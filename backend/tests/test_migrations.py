import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect


def test_initial_migration_upgrades_and_downgrades(tmp_path: Path):
    backend_dir = Path(__file__).resolve().parents[1]
    database_path = tmp_path / "migration.db"
    database_url = f"sqlite:///{database_path.as_posix()}"
    environment = {**os.environ, "DATABASE_URL": database_url, "PYTHONPATH": str(backend_dir)}

    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )
    tables = set(inspect(create_engine(database_url)).get_table_names())
    assert {
        "alembic_version",
        "users",
        "client_profiles",
        "lawyer_profiles",
        "lawyer_verifications",
        "cases",
        "case_participants",
        "user_sessions",
        "audit_logs",
    } <= tables

    subprocess.run(
        [sys.executable, "-m", "alembic", "downgrade", "base"],
        cwd=backend_dir,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )
    assert set(inspect(create_engine(database_url)).get_table_names()) == {"alembic_version"}
