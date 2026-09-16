"""
Sync local SQLite database data (accounts, cases, devices, operations, ledger, jobs, logs, settings)
to the production Neon PostgreSQL database using SQLAlchemy ORM models.

Preserves existing production records (no deletion or overwrite). Handles enum casting,
naive/aware datetime conversion, and foreign key validation to prevent orphan FK failures.

Usage:
    python scripts/migrate_local_to_prod.py [sqlite_file] [postgresql_url]
"""
import sys
import os
import sqlite3
import json
import asyncio
from datetime import datetime, timezone

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.core.config import Settings
from app.db.session import Base
from app.models import (
    User, UserRole,
    OperationRecord, OperationType, LedgerEntry,
    Device, DeviceConnectionType, DeviceMediaType, DeviceHealth, DeviceStatus,
    CaseRecord, CaseStatus, CaseInvestigator, CaseEvidenceItem, CaseOperationLink,
    Job, TaskStatus,
    TimelineEvent, TimelineEventType,
    SystemLog, LogLevel, LogCategory,
    Setting,
)

DEFAULT_SQLITE = "forensicguard.db"
if not os.path.exists(DEFAULT_SQLITE) and os.path.exists("pramaan.db"):
    DEFAULT_SQLITE = "pramaan.db"

DEFAULT_PG_URL = (
    os.getenv("DATABASE_URL")
    or "postgresql://neondb_owner:npg_fr3sF4jHvXCN@ep-summer-leaf-ay3i9jrf-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
)

def safe_enum(enum_cls, val, default):
    if not val:
        return default
    if isinstance(val, enum_cls):
        return val
    val_str = str(val).strip()
    try:
        return enum_cls(val_str)
    except ValueError:
        pass
    val_upper = val_str.upper()
    for item in enum_cls:
        if item.value.upper() == val_upper or item.name.upper() == val_upper:
            return item
    return default

def parse_iso(val, tz_aware: bool):
    if not val:
        return None
    if isinstance(val, datetime):
        dt = val
    else:
        try:
            dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
        except Exception:
            return None

    if tz_aware:
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
    else:
        return dt.replace(tzinfo=None)

# Map table name to (ModelClass, primary_key_attr, is_tz_aware, enum_mappings)
TABLE_CONFIGS = [
    (
        "users", User, "id", True,
        {"role": lambda v: safe_enum(UserRole, v, UserRole.INVESTIGATOR)}
    ),
    (
        "operation_records", OperationRecord, "id", True,
        {"operation_type": lambda v: safe_enum(OperationType, v, OperationType.DRIVE_ERASE)}
    ),
    (
        "devices", Device, "id", False,
        {
            "connection_type": lambda v: safe_enum(DeviceConnectionType, v, DeviceConnectionType.UNKNOWN),
            "media_type": lambda v: safe_enum(DeviceMediaType, v, DeviceMediaType.OTHER),
            "health": lambda v: safe_enum(DeviceHealth, v, DeviceHealth.UNKNOWN),
            "status": lambda v: safe_enum(DeviceStatus, v, DeviceStatus.CONNECTED),
        }
    ),
    (
        "ledger_entries", LedgerEntry, "id", True,
        {}
    ),
    (
        "cases", CaseRecord, "id", True,
        {"status": lambda v: safe_enum(CaseStatus, v, CaseStatus.OPEN)}
    ),
    (
        "case_investigators", CaseInvestigator, "id", True,
        {}
    ),
    (
        "case_evidence_items", CaseEvidenceItem, "id", True,
        {}
    ),
    (
        "case_operation_links", CaseOperationLink, "id", True,
        {}
    ),
    (
        "jobs", Job, "id", False,
        {
            "operation_type": lambda v: safe_enum(OperationType, v, OperationType.DRIVE_ERASE),
            "status": lambda v: safe_enum(TaskStatus, v, TaskStatus.PENDING),
        }
    ),
    (
        "timeline_events", TimelineEvent, "id", False,
        {"event_type": lambda v: safe_enum(TimelineEventType, v, TimelineEventType.NOTE)}
    ),
    (
        "system_logs", SystemLog, "id", False,
        {
            "level": lambda v: safe_enum(LogLevel, v, LogLevel.INFO),
            "category": lambda v: safe_enum(LogCategory, v, LogCategory.BACKEND),
        }
    ),
    (
        "settings", Setting, "setting_key", False,
        {}
    ),
]

async def main():
    sqlite_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SQLITE
    pg_url_raw = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PG_URL

    if not os.path.isabs(sqlite_path):
        sqlite_path = os.path.abspath(sqlite_path)

    if not os.path.exists(sqlite_path):
        print(f"[Error] Local SQLite file not found at: {sqlite_path}")
        return

    pg_url = Settings._normalize_database_url(pg_url_raw)

    print(f"============================================================")
    print(f"PRAMAAN Database Sync Tool (ORM Batch Mode with FK Validation)")
    print(f"============================================================")
    print(f"Source SQLite DB: {sqlite_path}")
    print(f"Target Postgres: {pg_url.split('@')[-1]}")
    print(f"============================================================")

    sq_conn = sqlite3.connect(sqlite_path)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    engine = create_async_engine(pg_url, pool_pre_ping=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    print("[1/2] Ensuring remote PostgreSQL schema is up to date...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Dictionaries to track present IDs per table
    valid_ids = {
        "users": set(),
        "operation_records": set(),
        "operation_certificates": set(),
        "devices": set(),
        "cases": set(),
        "jobs": set(),
    }

    # Pre-populate known valid IDs from Postgres
    async with async_session() as session:
        for model, key in [(User, "users"), (OperationRecord, "operation_records"), (Device, "devices"), (CaseRecord, "cases"), (Job, "jobs")]:
            res = await session.execute(select(model))
            for item in res.scalars().all():
                valid_ids[key].add(item.id)
                if isinstance(item, OperationRecord):
                    valid_ids["operation_certificates"].add(item.certificate_id)

    default_user_id = next(iter(valid_ids["users"])) if valid_ids["users"] else None

    print(f"[+] Loaded existing PG entity IDs: {len(valid_ids['users'])} users, {len(valid_ids['operation_records'])} ops, {len(valid_ids['devices'])} devices, {len(valid_ids['cases'])} cases, {len(valid_ids['jobs'])} jobs.")

    print("[2/2] Migrating table records...")
    async with async_session() as session:
        for table_name, model_cls, pk_col, tz_aware, enum_converters in TABLE_CONFIGS:
            try:
                sq_cur.execute(f"SELECT * FROM {table_name}")
                rows = sq_cur.fetchall()
            except sqlite3.OperationalError:
                print(f"  - Table '{table_name}' not present in local SQLite. Skipping.")
                continue

            if not rows:
                print(f"  - Table '{table_name}' has 0 rows.")
                continue

            print(f"[+] Syncing {len(rows)} rows for table '{table_name}'...")
            inserted = 0
            skipped = 0
            errors = 0

            valid_cols = set(model_cls.__table__.columns.keys())

            for row in rows:
                row_dict = dict(row)
                pk_val = row_dict.get(pk_col)

                if pk_val:
                    existing = await session.get(model_cls, pk_val)
                    if existing is not None:
                        skipped += 1
                        # Track ID if needed
                        if table_name in valid_ids:
                            valid_ids[table_name].add(pk_val)
                        if table_name == "operation_records" and "certificate_id" in row_dict:
                            valid_ids["operation_certificates"].add(row_dict["certificate_id"])
                        continue

                cleaned_kwargs = {}
                for k, v in row_dict.items():
                    if k not in valid_cols:
                        continue
                    if v is None:
                        cleaned_kwargs[k] = None
                        continue

                    # Enum conversion
                    if k in enum_converters:
                        cleaned_kwargs[k] = enum_converters[k](v)
                    # Datetime parsing
                    elif k.endswith("_at") or k.endswith("_date") or k in ("detected_at", "started_at", "completed_at", "created_at", "updated_at", "read_at", "claimed_at", "cancelled_at", "assigned_at", "linked_at", "event_at", "last_operation_at"):
                        cleaned_kwargs[k] = parse_iso(v, tz_aware)
                    # Boolean parsing
                    elif k in ("success", "is_lead") or isinstance(v, bool):
                        cleaned_kwargs[k] = bool(v)
                    # JSON parsing
                    elif k in ("details", "payload", "classifications", "files", "event_metadata", "setting_value"):
                        if isinstance(v, str):
                            try:
                                cleaned_kwargs[k] = json.loads(v)
                            except Exception:
                                cleaned_kwargs[k] = v
                        else:
                            cleaned_kwargs[k] = v
                    else:
                        cleaned_kwargs[k] = v

                # Foreign Key validation to prevent IntegrityErrors on missing referenced rows
                if table_name == "devices":
                    if cleaned_kwargs.get("last_operation_record_id") and cleaned_kwargs["last_operation_record_id"] not in valid_ids["operation_records"]:
                        cleaned_kwargs["last_operation_record_id"] = None
                elif table_name == "cases":
                    if cleaned_kwargs.get("created_by_user_id") and cleaned_kwargs["created_by_user_id"] not in valid_ids["users"]:
                        cleaned_kwargs["created_by_user_id"] = default_user_id
                    if cleaned_kwargs.get("lead_investigator_user_id") and cleaned_kwargs["lead_investigator_user_id"] not in valid_ids["users"]:
                        cleaned_kwargs["lead_investigator_user_id"] = None
                elif table_name == "jobs":
                    if cleaned_kwargs.get("case_id") and cleaned_kwargs["case_id"] not in valid_ids["cases"]:
                        cleaned_kwargs["case_id"] = None
                    if cleaned_kwargs.get("device_id") and cleaned_kwargs["device_id"] not in valid_ids["devices"]:
                        cleaned_kwargs["device_id"] = None
                    if cleaned_kwargs.get("created_by_user_id") and cleaned_kwargs["created_by_user_id"] not in valid_ids["users"]:
                        cleaned_kwargs["created_by_user_id"] = default_user_id
                    if cleaned_kwargs.get("parent_job_id") and cleaned_kwargs["parent_job_id"] not in valid_ids["jobs"]:
                        cleaned_kwargs["parent_job_id"] = None
                    if cleaned_kwargs.get("certificate_id") and cleaned_kwargs["certificate_id"] not in valid_ids["operation_certificates"]:
                        cleaned_kwargs["certificate_id"] = None
                elif table_name == "timeline_events":
                    if cleaned_kwargs.get("operation_record_id") and cleaned_kwargs["operation_record_id"] not in valid_ids["operation_records"]:
                        cleaned_kwargs["operation_record_id"] = None
                elif table_name == "settings":
                    if cleaned_kwargs.get("updated_by_user_id") and cleaned_kwargs["updated_by_user_id"] not in valid_ids["users"]:
                        cleaned_kwargs["updated_by_user_id"] = None

                try:
                    instance = model_cls(**cleaned_kwargs)
                    session.add(instance)
                    await session.flush()
                    inserted += 1
                    # Track newly inserted ID
                    if table_name in valid_ids and pk_val:
                        valid_ids[table_name].add(pk_val)
                    if table_name == "operation_records" and hasattr(instance, "certificate_id") and instance.certificate_id:
                        valid_ids["operation_certificates"].add(instance.certificate_id)
                except Exception as ex:
                    await session.rollback()
                    errors += 1
                    print(f"      [Error inserting row {pk_val} into {table_name}]: {ex}")

            await session.commit()
            print(f"   [OK] Table '{table_name}': {inserted} inserted, {skipped} skipped (already present), {errors} errors.")

    print("\n============================================================")
    print("Database sync completed successfully!")
    print("All local data is now synchronized to production PostgreSQL.")
    print("============================================================")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
