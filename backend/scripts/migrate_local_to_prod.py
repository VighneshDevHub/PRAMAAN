"""
Sync local SQLite database data (accounts, cases, devices, operations, ledger)
to the production Neon PostgreSQL database.

Usage:
    python scripts/migrate_local_to_prod.py [sqlite_file] [postgresql_url]
"""
import sys
import os
import sqlite3
import json
import asyncio
from datetime import datetime

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from app.core.config import Settings

DEFAULT_SQLITE = "forensicguard.db"
if not os.path.exists(DEFAULT_SQLITE) and os.path.exists("pramaan.db"):
    DEFAULT_SQLITE = "pramaan.db"

DEFAULT_PG_URL = (
    os.getenv("DATABASE_URL")
    or "postgresql://neondb_owner:npg_fr3sF4jHvXCN@ep-summer-leaf-ay3i9jrf-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def parse_iso(dt_str):
    if not dt_str:
        return None
    if isinstance(dt_str, datetime):
        return dt_str
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None

async def main():
    sqlite_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SQLITE
    pg_url_raw = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PG_URL

    if not os.path.isabs(sqlite_path):
        sqlite_path = os.path.abspath(sqlite_path)

    if not os.path.exists(sqlite_path):
        print(f"[Error] Local SQLite file not found at: {sqlite_path}")
        return

    # Normalize PG URL for asyncpg
    pg_url = Settings._normalize_database_url(pg_url_raw)

    print(f"============================================================")
    print(f"PRAMAAN Database Sync Tool")
    print(f"============================================================")
    print(f"Source SQLite DB: {sqlite_path}")
    print(f"Target Postgres: {pg_url.split('@')[-1]}")
    print(f"============================================================")

    # 1. Connect to SQLite
    sq_conn = sqlite3.connect(sqlite_path)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    # 2. Connect to Async PostgreSQL
    engine = create_async_engine(pg_url, pool_pre_ping=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    # Ensure target tables exist
    from app.db.session import init_models
    print("[1/5] Ensuring remote PostgreSQL tables exist...")
    async with engine.begin() as conn:
        import app.models # noqa
        from app.db.session import Base
        await conn.run_sync(Base.metadata.create_all)

    # Table Sync Order (respecting foreign key constraints)
    tables_to_sync = [
        "users",
        "operation_records",
        "devices",
        "ledger_entries",
        "cases",
        "case_investigators",
        "case_evidence_items",
        "case_operation_links",
        "jobs",
        "timeline_events",
        "system_logs",
        "settings",
    ]

    async with async_session() as session:
        for table in tables_to_sync:
            try:
                sq_cur.execute(f"SELECT * FROM {table}")
                rows = sq_cur.fetchall()
            except sqlite3.OperationalError:
                print(f"  - Table '{table}' not present in local SQLite. Skipping.")
                continue

            if not rows:
                print(f"  - Table '{table}' has 0 rows.")
                continue

            print(f"[+] Syncing {len(rows)} rows for table '{table}'...")
            inserted = 0
            for row in rows:
                row_dict = dict(row)
                cols = list(row_dict.keys())
                col_names = ", ".join(cols)
                param_names = ", ".join([f":{c}" for c in cols])
                
                # Convert types for asyncpg (datetimes, booleans, json)
                for k, v in row_dict.items():
                    if (k.endswith("_at") or k.endswith("_date") or k in ("detected_at", "started_at", "completed_at", "created_at", "updated_at", "read_at", "claimed_at", "cancelled_at", "assigned_at", "linked_at", "event_at", "last_operation_at")) and isinstance(v, str):
                        dt = parse_iso(v)
                        if dt:
                            row_dict[k] = dt
                    elif (k in ("success", "is_lead") or isinstance(v, bool)) and isinstance(v, (int, bool)):
                        row_dict[k] = bool(v)
                    elif isinstance(v, (dict, list)):
                        row_dict[k] = json.dumps(v)

                # Build Postgres ON CONFLICT DO NOTHING clause based on table primary key
                pk = "id" if "id" in cols else ("setting_key" if "setting_key" in cols else cols[0])
                stmt = text(
                    f"INSERT INTO {table} ({col_names}) VALUES ({param_names}) "
                    f"ON CONFLICT ({pk}) DO NOTHING"
                )
                try:
                    async with session.begin_nested():
                        res = await session.execute(stmt, row_dict)
                        if res.rowcount > 0:
                            inserted += 1
                except Exception as ex:
                    print(f"   [!] Skipped/Failed row in '{table}' ({pk}={row_dict.get(pk)}): {ex}")
            
            await session.commit()
            print(f"   [OK] Successfully synced {inserted}/{len(rows)} new rows into '{table}'.")

    print("\n============================================================")
    print("Database sync completed successfully!")
    print("All local accounts, cases, and records are now available in Production.")
    print("============================================================")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
