"""
sync_to_production.py
=====================
Safely syncs local SQLite (pramaan.db) → Neon PostgreSQL production.

Strategy:
  • Step 1 – Run SQLAlchemy create_all on production  →  creates any missing
              tables/columns.  NEVER drops or alters existing ones.
  • Step 2 – For every table, dump all rows from SQLite and INSERT them into
              PostgreSQL using ON CONFLICT DO NOTHING  →  rows already in
              production are skipped; new rows are added.  Zero deletions.

Run from the backend/ directory:
    python sync_to_production.py
"""

import asyncio
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
LOCAL_SQLITE_PATH = Path(__file__).parent / "pramaan.db"

PRODUCTION_DB_URL = (
    "postgresql+asyncpg://neondb_owner:npg_fr3sF4jHvXCN"
    "@ep-summer-leaf-ay3i9jrf-pooler.c-5.us-east-2.aws.neon.tech"
    "/neondb?ssl=require"
)

# FK-safe insertion order
TABLE_ORDER = [
    "users",
    "operation_records",
    "ledger_entries",
    "devices",
    "cases",
    "case_investigators",
    "case_evidence_items",
    "case_operation_links",
    "jobs",
    "notifications",
    "timeline_events",
    "system_logs",
    "settings",
]

# ---------------------------------------------------------------------------
# Column metadata: which columns are booleans, which datetimes are tz-naive
# ---------------------------------------------------------------------------
# Boolean columns (SQLite stores as 0/1 int; asyncpg requires True/False)
BOOL_COLS: dict[str, set[str]] = {
    "operation_records": {"success"},
    "case_investigators": {"is_lead"},
}

# Datetime columns declared with timezone=False — strip tzinfo before insert.
# Datetime columns with timezone=True — keep tzinfo (add UTC if missing).
# We track the tz=False ones explicitly; everything else gets UTC attached.
TZ_NAIVE_COLS: dict[str, set[str]] = {
    "devices": {
        "last_operation_at", "detected_at", "created_at", "updated_at"
    },
    "jobs": {
        "claimed_at", "started_at", "completed_at", "cancelled_at",
        "created_at", "updated_at"
    },
    "notifications": {"read_at", "created_at", "updated_at"},
    "system_logs": {"created_at"},
    "settings": {"updated_at"},
    "timeline_events": {"event_at"},
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DT_FORMATS = [
    "%Y-%m-%d %H:%M:%S.%f",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%f",
    "%Y-%m-%dT%H:%M:%S",
]


def _parse_dt_string(s: str) -> datetime | None:
    for fmt in _DT_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _coerce(table: str, col: str, val) -> object:
    """
    Apply SQLite → PostgreSQL type coercions for raw text() queries with asyncpg:

      1. None        → None
      2. Bool cols   → Python bool  (SQLite stores 0/1 int)
      3. Datetime    → datetime obj, tz-aware or tz-naive per column
      4. JSON cols   → JSON string  (asyncpg text() binding can't accept
                        raw dict/list; must be a pre-serialised string)
      5. Everything else → unchanged
    """
    if val is None:
        return None

    # ── 1. Boolean coercion ─────────────────────────────────────────────
    if col in BOOL_COLS.get(table, set()):
        if isinstance(val, int):
            return bool(val)
        return val

    # ── 2. Datetime coercion ────────────────────────────────────────────
    if isinstance(val, str):
        stripped = val.strip()

        if len(stripped) >= 10 and stripped[4] == "-" and stripped[7] == "-":
            dt = _parse_dt_string(stripped)
            if dt is not None:
                if col in TZ_NAIVE_COLS.get(table, set()):
                    return dt.replace(tzinfo=None)
                else:
                    return dt.replace(tzinfo=timezone.utc)

        # ── 3. JSON blob strings → keep as string (asyncpg handles it) ──
        # asyncpg text() parameter binding requires JSON to be passed as
        # a plain JSON string, not a Python dict/list.
        # We leave valid-looking JSON strings as-is here.
        return val

    # ── 4. dict / list → JSON string ────────────────────────────────────
    # SQLite row_factory already parsed some JSON when sqlite3 module
    # returned them as Python objects (rare but possible), or our
    # previous coerce pass already turned them into dicts. Either way,
    # asyncpg text() binding needs them back as strings.
    if isinstance(val, (dict, list)):
        return json.dumps(val, default=str)

    return val


def _build_row_dict(table: str, cols: list[str], row: tuple) -> dict:
    return {col: _coerce(table, col, val) for col, val in zip(cols, row)}


def _sqlite_rows(db_path: Path, table: str) -> tuple[list[str], list[tuple]]:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        cur.execute(f'SELECT * FROM "{table}"')
        rows = cur.fetchall()
        if not rows:
            return [], []
        cols = [d[0] for d in cur.description]
        return cols, [tuple(r) for r in rows]
    except sqlite3.OperationalError as exc:
        print(f"  [WARN] Could not read {table}: {exc}")
        return [], []
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Per-table conflict resolution targets
# Columns listed here = the ON CONFLICT target.
# For most tables: primary key (id).
# For tables with additional unique constraints that could also conflict:
#   we use INSERT ... ON CONFLICT DO NOTHING with the PK, but handle
#   unique-secondary-key violations (like email) as "already exists".
# ---------------------------------------------------------------------------
CONFLICT_TARGETS: dict[str, str] = {
    "settings": "setting_key",
    # All others default to "id"
}


# ---------------------------------------------------------------------------
# Core async sync
# ---------------------------------------------------------------------------

async def run_sync():
    sys.path.insert(0, str(Path(__file__).parent))

    from sqlalchemy.ext.asyncio import (
        create_async_engine, AsyncSession, async_sessionmaker
    )
    from sqlalchemy import text
    import app.models  # noqa – registers models with Base.metadata
    from app.db.session import Base

    print("=" * 60)
    print("PRAMAAN  –  SQLite → Neon PostgreSQL Sync")
    print("=" * 60)
    print(f"Source : {LOCAL_SQLITE_PATH}")
    print(f"Target : Neon PostgreSQL (production)")
    print()

    if not LOCAL_SQLITE_PATH.exists():
        print(f"[ERROR] Local DB not found: {LOCAL_SQLITE_PATH}")
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 1 – ensure schema on production (create_all is safe/additive)
    # ------------------------------------------------------------------
    print("Step 1 – Creating missing tables on production (safe, no drops)…")
    prod_engine = create_async_engine(
        PRODUCTION_DB_URL,
        echo=False,
        pool_pre_ping=True,
        connect_args={"ssl": "require"},
    )

    async with prod_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  ✓ Schema up to date\n")

    # ------------------------------------------------------------------
    # Step 2 – upsert row by row
    # ------------------------------------------------------------------
    print("Step 2 – Syncing data (INSERT … ON CONFLICT DO NOTHING) …\n")

    total_inserted = 0
    total_skipped = 0

    AsyncProdSession = async_sessionmaker(
        bind=prod_engine, class_=AsyncSession, expire_on_commit=False
    )

    for table in TABLE_ORDER:
        cols, rows = _sqlite_rows(LOCAL_SQLITE_PATH, table)
        if not rows:
            print(f"  {'–'} {table:<30} 0 rows in local DB – skip")
            continue

        inserted = 0
        skipped = 0
        conflict_col = CONFLICT_TARGETS.get(table, "id")

        async with AsyncProdSession() as session:
            for row in rows:
                row_dict = _build_row_dict(table, cols, row)

                col_names = ", ".join(f'"{c}"' for c in row_dict)
                param_names = ", ".join(f":{c}" for c in row_dict)
                stmt = text(
                    f'INSERT INTO "{table}" ({col_names}) '
                    f'VALUES ({param_names}) '
                    f'ON CONFLICT ("{conflict_col}") DO NOTHING'
                )
                try:
                    result = await session.execute(stmt, row_dict)
                    if result.rowcount == 1:
                        inserted += 1
                    else:
                        skipped += 1
                except Exception as exc:
                    await session.rollback()
                    err_str = str(exc)
                    # Treat secondary unique-constraint violations as
                    # "already exists" rather than a real error
                    if "UniqueViolationError" in err_str or \
                       "unique constraint" in err_str.lower():
                        skipped += 1
                    else:
                        short = err_str.split("\n")[0][:200]
                        print(f"  [WARN] {table} row skipped: {short}")
                        skipped += 1
                    continue

            await session.commit()

        total_inserted += inserted
        total_skipped += skipped
        marker = "✓" if inserted > 0 else "–"
        print(
            f"  {marker} {table:<30} "
            f"inserted={inserted:<5} "
            f"skipped(already exist)={skipped}"
        )

    print()
    print("=" * 60)
    print(f"Sync complete.  Inserted: {total_inserted}  |  Already existed/skipped: {total_skipped}")
    print("=" * 60)

    await prod_engine.dispose()


# ---------------------------------------------------------------------------
# Verification – row counts local vs production
# ---------------------------------------------------------------------------

async def verify_counts():
    sys.path.insert(0, str(Path(__file__).parent))

    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    import app.models  # noqa

    print("\nStep 3 – Verifying row counts (local vs production) …\n")

    prod_engine = create_async_engine(
        PRODUCTION_DB_URL,
        echo=False,
        pool_pre_ping=True,
        connect_args={"ssl": "require"},
    )

    local_counts: dict[str, int] = {}
    conn = sqlite3.connect(str(LOCAL_SQLITE_PATH))
    cur = conn.cursor()
    for table in TABLE_ORDER:
        try:
            cur.execute(f'SELECT COUNT(*) FROM "{table}"')
            local_counts[table] = cur.fetchone()[0]
        except Exception:
            local_counts[table] = -1
    conn.close()

    print(f"  {'Table':<30} {'Local':>8}  {'Production':>12}  Status")
    print(f"  {'-'*30} {'-'*8}  {'-'*12}  {'-'*10}")

    async with prod_engine.connect() as conn:
        for table in TABLE_ORDER:
            try:
                result = await conn.execute(
                    text(f'SELECT COUNT(*) FROM "{table}"')
                )
                prod_count = result.scalar()
            except Exception:
                prod_count = -1

            local = local_counts.get(table, -1)
            status = "✓ OK" if prod_count >= local else "⚠  MISMATCH"
            print(f"  {table:<30} {local:>8}  {prod_count:>12}  {status}")

    await prod_engine.dispose()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    asyncio.run(run_sync())
    asyncio.run(verify_counts())
