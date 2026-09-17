"""
sync_fix.py
===========
Targeted fix for the remaining rows that sync_to_production.py couldn't insert:

1. User `vigh@example.com` exists in production under a DIFFERENT UUID.
   We remap the local UUID to the prod UUID in every FK reference so the
   dependent rows (cases, case_investigators, jobs) can be inserted cleanly.

2. Insert the 2 missing cases (with remapped FK), their investigators,
   and the 27 missing jobs (24 with valid FKs + 3 whose case_id refers
   to a missing case which we insert first).

3. Insert 2 missing timeline_events (depend on the newly-inserted cases).

All inserts use ON CONFLICT DO NOTHING — safe to run multiple times.
"""

import asyncio, sqlite3, json, sys
from datetime import datetime, timezone
from pathlib import Path

LOCAL_SQLITE_PATH = Path(__file__).parent / "pramaan.db"
PRODUCTION_DB_URL = (
    "postgresql+asyncpg://neondb_owner:npg_fr3sF4jHvXCN"
    "@ep-summer-leaf-ay3i9jrf-pooler.c-5.us-east-2.aws.neon.tech"
    "/neondb?ssl=require"
)

# ── Type coercion (same as sync_to_production.py) ────────────────────────

_DT_FORMATS = [
    "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S",
]
BOOL_COLS = {
    "operation_records": {"success"},
    "case_investigators": {"is_lead"},
}
TZ_NAIVE_COLS = {
    "devices": {"last_operation_at","detected_at","created_at","updated_at"},
    "jobs": {"claimed_at","started_at","completed_at","cancelled_at","created_at","updated_at"},
    "notifications": {"read_at","created_at","updated_at"},
    "system_logs": {"created_at"},
    "settings": {"updated_at"},
    "timeline_events": {"event_at"},
}

def _parse_dt(s):
    for fmt in _DT_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None

def _coerce(table, col, val):
    if val is None:
        return None
    if col in BOOL_COLS.get(table, set()):
        return bool(val) if isinstance(val, int) else val
    if isinstance(val, str):
        s = val.strip()
        if len(s) >= 10 and s[4] == "-" and s[7] == "-":
            dt = _parse_dt(s)
            if dt:
                return dt.replace(tzinfo=None) if col in TZ_NAIVE_COLS.get(table, set()) \
                       else dt.replace(tzinfo=timezone.utc)
        return val
    if isinstance(val, (dict, list)):
        return json.dumps(val, default=str)
    return val

def sqlite_rows(table):
    conn = sqlite3.connect(str(LOCAL_SQLITE_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(f'SELECT * FROM "{table}"')
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description] if rows else []
    conn.close()
    return cols, [tuple(r) for r in rows]

def build_dict(table, cols, row):
    return {c: _coerce(table, c, v) for c, v in zip(cols, row)}

# ── Async insert helper ───────────────────────────────────────────────────

async def upsert_row(session, table, row_dict, conflict_col="id", id_map=None):
    from sqlalchemy import text
    # Apply ID remapping to every string value that looks like a UUID
    if id_map:
        row_dict = {
            k: id_map.get(v, v) if isinstance(v, str) else v
            for k, v in row_dict.items()
        }
    col_names   = ", ".join(f'"{c}"' for c in row_dict)
    param_names = ", ".join(f":{c}" for c in row_dict)
    stmt = text(
        f'INSERT INTO "{table}" ({col_names}) VALUES ({param_names}) '
        f'ON CONFLICT ("{conflict_col}") DO NOTHING'
    )
    try:
        result = await session.execute(stmt, row_dict)
        await session.commit()
        return result.rowcount == 1
    except Exception as exc:
        await session.rollback()
        short = str(exc).split("\n")[0][:180]
        print(f"  [SKIP] {table}: {short}")
        return False

# ── Main fix ─────────────────────────────────────────────────────────────

async def main():
    sys.path.insert(0, str(Path(__file__).parent))
    from sqlalchemy.ext.asyncio import (
        create_async_engine, AsyncSession, async_sessionmaker
    )
    from sqlalchemy import text
    import app.models  # noqa

    eng = create_async_engine(PRODUCTION_DB_URL, echo=False,
                              connect_args={"ssl": "require"})
    Session = async_sessionmaker(bind=eng, class_=AsyncSession,
                                 expire_on_commit=False)

    # ── Step A: resolve the UUID mismatch for vigh@example.com ──────────
    async with eng.connect() as c:
        r = await c.execute(
            text("SELECT id FROM users WHERE email = 'vigh@example.com'")
        )
        prod_vigh_id = r.scalar()

    local_vigh_id = "6c7d1411-12fc-457f-996d-a478bf521b5f"
    id_map: dict[str, str] = {}

    if prod_vigh_id and prod_vigh_id != local_vigh_id:
        print(f"User vigh@example.com: local={local_vigh_id} → prod={prod_vigh_id}")
        id_map[local_vigh_id] = prod_vigh_id
    elif not prod_vigh_id:
        print("[INFO] vigh@example.com not in production – will insert directly")
    else:
        print("[INFO] vigh@example.com already has same UUID in production")

    # ── Step B: insert the 2 missing cases ──────────────────────────────
    print("\n── Inserting missing cases ──")
    cols, rows = sqlite_rows("cases")
    async with eng.connect() as c:
        r = await c.execute(text("SELECT id FROM cases"))
        prod_case_ids = {row[0] for row in r.fetchall()}
        r2 = await c.execute(text("SELECT id FROM users"))
        prod_user_ids = {row[0] for row in r2.fetchall()}

    inserted_case_ids: set[str] = set()
    async with Session() as session:
        for row in rows:
            d = build_dict("cases", cols, row)
            local_id = d["id"]
            if local_id in prod_case_ids:
                continue
            # remap FK user ids
            for fk in ("created_by_user_id", "lead_investigator_user_id"):
                if d.get(fk) and d[fk] in id_map:
                    d[fk] = id_map[d[fk]]
            # Check FKs are satisfied
            created_ok = d.get("created_by_user_id") in prod_user_ids or \
                         d.get("created_by_user_id") in {v for v in id_map.values()}
            lead_id = d.get("lead_investigator_user_id")
            lead_ok = lead_id is None or lead_id in prod_user_ids or \
                      lead_id in {v for v in id_map.values()}
            if not created_ok or not lead_ok:
                print(f"  [SKIP case] {d.get('case_number')} – FK still unresolvable")
                continue
            ok = await upsert_row(session, "cases", d)
            if ok:
                inserted_case_ids.add(local_id)
                prod_case_ids.add(local_id)
                print(f"  ✓ case {d.get('case_number')}")

    # ── Step C: insert missing case_investigators ────────────────────────
    print("\n── Inserting missing case_investigators ──")
    cols, rows = sqlite_rows("case_investigators")
    async with eng.connect() as c:
        r = await c.execute(text("SELECT id FROM case_investigators"))
        prod_ci_ids = {row[0] for row in r.fetchall()}

    async with Session() as session:
        for row in rows:
            d = build_dict("case_investigators", cols, row)
            if d["id"] in prod_ci_ids:
                continue
            # remap FKs
            for fk in ("case_id", "user_id"):
                if d.get(fk) in id_map:
                    d[fk] = id_map[d[fk]]
            if d.get("case_id") not in prod_case_ids:
                print(f"  [SKIP ci] case_id {d.get('case_id')} not in prod")
                continue
            if d.get("user_id") not in prod_user_ids:
                print(f"  [SKIP ci] user_id {d.get('user_id')} not in prod")
                continue
            ok = await upsert_row(session, "case_investigators", d)
            if ok:
                print(f"  ✓ case_investigator {d['id'][:8]}…")

    # ── Step D: insert missing jobs ──────────────────────────────────────
    print("\n── Inserting missing jobs ──")
    cols, rows = sqlite_rows("jobs")
    async with eng.connect() as c:
        r = await c.execute(text("SELECT id FROM jobs"))
        prod_job_ids = {row[0] for row in r.fetchall()}

    inserted_j = skipped_j = 0
    async with Session() as session:
        for row in rows:
            d = build_dict("jobs", cols, row)
            if d["id"] in prod_job_ids:
                continue
            # remap FKs
            for fk in ("case_id", "created_by_user_id"):
                if d.get(fk) in id_map:
                    d[fk] = id_map[d[fk]]
            # Validate FKs
            case_ok = d.get("case_id") is None or d.get("case_id") in prod_case_ids
            user_ok = d.get("created_by_user_id") in prod_user_ids
            if not case_ok:
                skipped_j += 1
                continue
            if not user_ok:
                skipped_j += 1
                continue
            ok = await upsert_row(session, "jobs", d)
            if ok:
                inserted_j += 1
            else:
                skipped_j += 1
    print(f"  jobs: inserted={inserted_j}  skipped={skipped_j}")

    # ── Step E: insert missing timeline_events ───────────────────────────
    print("\n── Inserting missing timeline_events ──")
    cols, rows = sqlite_rows("timeline_events")
    async with eng.connect() as c:
        r = await c.execute(text("SELECT id FROM timeline_events"))
        prod_te_ids = {row[0] for row in r.fetchall()}

    inserted_te = 0
    async with Session() as session:
        for row in rows:
            d = build_dict("timeline_events", cols, row)
            if d["id"] in prod_te_ids:
                continue
            for fk in ("case_id", "operation_record_id"):
                if d.get(fk) in id_map:
                    d[fk] = id_map[d[fk]]
            if d.get("case_id") not in prod_case_ids:
                print(f"  [SKIP te] case_id {d.get('case_id')} not in prod")
                continue
            ok = await upsert_row(session, "timeline_events", d)
            if ok:
                inserted_te += 1
                print(f"  ✓ timeline_event {d['id'][:8]}…")

    # ── Final verification ───────────────────────────────────────────────
    print("\n══ Final counts ══")
    tables = ["users","operation_records","ledger_entries","devices","cases",
              "case_investigators","jobs","notifications","timeline_events",
              "system_logs","settings"]
    local_counts = {}
    conn = sqlite3.connect(str(LOCAL_SQLITE_PATH))
    cur = conn.cursor()
    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        local_counts[t] = cur.fetchone()[0]
    conn.close()

    print(f"  {'Table':<30} {'Local':>8}  {'Production':>12}  Status")
    print(f"  {'-'*30} {'-'*8}  {'-'*12}  {'-'*10}")
    async with eng.connect() as c:
        for t in tables:
            r = await c.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
            prod = r.scalar()
            local = local_counts.get(t, 0)
            status = "✓ OK" if prod >= local else "⚠  MISMATCH"
            print(f"  {t:<30} {local:>8}  {prod:>12}  {status}")

    await eng.dispose()

if __name__ == "__main__":
    asyncio.run(main())
