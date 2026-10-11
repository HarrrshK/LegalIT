import argparse
import hashlib
import json
import secrets
import shutil
import sqlite3
import string
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import build_engine, build_session_factory
from app.models.core import User, UserRole
from app.models.domain import IngestionJob, LegalDocument, LegalNews, LegalSource
from app.services.auth import AuthService


def parse_datetime(value):
    if value in {None, ""}:
        return None
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def generated_password(length: int = 20) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_user(args: argparse.Namespace) -> int:
    settings = get_settings()
    settings.ensure_directories()
    engine = build_engine(settings)
    password = args.password or generated_password()
    role = UserRole(args.role)
    try:
        with build_session_factory(engine)() as session:
            if role in {UserRole.CLIENT, UserRole.LAWYER}:
                user = AuthService(session, settings).register(
                    email=args.email,
                    password=password,
                    full_name=args.name,
                    role=role,
                )
            else:
                user = User(
                    public_id=f"ADM-{secrets.token_hex(5).upper()}",
                    email=args.email.strip().lower(),
                    password_hash=hash_password(password),
                    full_name=args.name.strip(),
                    role=UserRole.ADMIN,
                )
                session.add(user)
                session.commit()
            if args.password is None:
                user.must_change_password = True
                session.commit()
            print(f"Created {role.value} account")
            print(f"User ID: {user.public_id}")
            print(f"Temporary password: {password}" if args.password is None else "Password: supplied securely")
    except IntegrityError:
        print("Could not create account: the email or professional registration already exists.")
        return 1
    finally:
        engine.dispose()
    return 0


def nuke_data(args: argparse.Namespace) -> int:
    if not args.yes:
        print("Refusing to erase data without --yes.")
        return 2
    settings = get_settings()
    engine = build_engine(settings)
    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(delete(table))
    engine.dispose()
    upload_dir = Path(settings.upload_dir)
    if upload_dir.exists():
        for child in upload_dir.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
    print("Erased all LegalIt database records and uploaded files. Database tables remain migrated.")
    return 0


def import_legal(args: argparse.Namespace) -> int:
    path = Path(args.file)
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Could not read import file: {error}")
        return 1
    if not isinstance(payload, dict) or not isinstance(payload.get("documents"), list):
        print("Import file must contain a source object and a documents array.")
        return 1
    source_data = payload.get("source") or {}
    required_source = {"name", "base_url"}
    if not required_source.issubset(source_data):
        print("Source requires name and base_url.")
        return 1
    settings = get_settings()
    engine = build_engine(settings)
    processed = 0
    try:
        with build_session_factory(engine)() as session:
            source = session.scalar(select(LegalSource).where(LegalSource.name == source_data["name"]))
            if source is None:
                source = LegalSource(
                    name=source_data["name"],
                    base_url=source_data["base_url"],
                    authority_level=int(source_data.get("authority_level", 50)),
                    retrieval_method="manual",
                    terms_note=source_data.get("terms_note"),
                )
                session.add(source)
                session.flush()
            job = IngestionJob(source_id=source.id, status="running")
            session.add(job)
            session.flush()
            for item in payload["documents"]:
                required = {"external_id", "title", "document_type", "source_url", "content"}
                if not isinstance(item, dict) or not required.issubset(item):
                    raise ValueError("Every document requires external_id, title, document_type, source_url, and content")
                content = str(item["content"]).strip()
                existing = session.scalar(
                    select(LegalDocument).where(
                        LegalDocument.source_id == source.id,
                        LegalDocument.external_id == str(item["external_id"]),
                    )
                )
                values = {
                    "title": str(item["title"]).strip(),
                    "document_type": str(item["document_type"]).strip(),
                    "jurisdiction": item.get("jurisdiction"),
                    "authority": item.get("authority"),
                    "act_identifier": item.get("act_identifier"),
                    "section_identifier": item.get("section_identifier"),
                    "publication_date": parse_datetime(item.get("publication_date")),
                    "source_url": str(item["source_url"]),
                    "content": content,
                    "content_hash": hashlib.sha256(content.encode("utf-8")).hexdigest(),
                    "processing_status": "indexed",
                }
                if existing is None:
                    session.add(LegalDocument(source_id=source.id, external_id=str(item["external_id"]), **values))
                else:
                    for key, value in values.items():
                        setattr(existing, key, value)
                processed += 1
            job.status = "completed"
            job.records_processed = processed
            job.completed_at = datetime.now(timezone.utc)
            session.commit()
    except (ValueError, IntegrityError) as error:
        print(f"Import failed: {error}")
        return 1
    finally:
        engine.dispose()
    print(f"Imported {processed} legal documents from {source_data['name']}.")
    return 0


def import_news(args: argparse.Namespace) -> int:
    path = Path(args.file)
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(items, list):
            raise ValueError("News import must be a JSON array")
        settings = get_settings()
        engine = build_engine(settings)
        processed = 0
        with build_session_factory(engine)() as session:
            for item in items:
                required = {"headline", "source_name", "source_url"}
                if not isinstance(item, dict) or not required.issubset(item):
                    raise ValueError("Each news item requires headline, source_name, and source_url")
                existing = session.scalar(select(LegalNews).where(LegalNews.source_url == item["source_url"]))
                values = {
                    "headline": str(item["headline"]).strip(), "source_name": str(item["source_name"]).strip(),
                    "summary": item.get("summary"), "jurisdiction": item.get("jurisdiction"),
                    "practice_areas_json": json.dumps(item.get("practice_areas") or []),
                    "published_at": parse_datetime(item.get("published_at")),
                }
                if existing is None:
                    session.add(LegalNews(source_url=str(item["source_url"]), **values))
                else:
                    for key, value in values.items():
                        setattr(existing, key, value)
                processed += 1
            session.commit()
        engine.dispose()
    except (OSError, ValueError, json.JSONDecodeError, IntegrityError) as error:
        print(f"News import failed: {error}")
        return 1
    print(f"Imported {processed} legal news records.")
    return 0


def sqlite_path(settings) -> Path:
    prefix = "sqlite:///"
    if not settings.resolved_database_url.startswith(prefix):
        raise ValueError("Backup commands currently support SQLite database URLs only")
    return Path(settings.resolved_database_url.removeprefix(prefix)).resolve()


def backup_data(args: argparse.Namespace) -> int:
    settings = get_settings()
    settings.ensure_directories()
    try:
        database = sqlite_path(settings)
    except ValueError as error:
        print(error)
        return 1
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        snapshot = Path(temporary) / "legalit.db"
        with sqlite3.connect(database) as source, sqlite3.connect(snapshot) as target:
            source.backup(target)
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.write(snapshot, "database/legalit.db")
            upload_root = settings.upload_dir.resolve()
            if upload_root.exists():
                for path in upload_root.rglob("*"):
                    if path.is_file():
                        archive.write(path, Path("uploads") / path.relative_to(upload_root))
    print(f"Backup written to {output}")
    return 0


def restore_data(args: argparse.Namespace) -> int:
    if not args.yes:
        print("Refusing to replace current data without --yes. Stop the API before restoring.")
        return 2
    settings = get_settings()
    archive_path = Path(args.file).resolve()
    if not archive_path.is_file():
        print("Backup archive not found.")
        return 1
    try:
        database = sqlite_path(settings)
        with zipfile.ZipFile(archive_path) as archive:
            names = archive.namelist()
            if "database/legalit.db" not in names or any(name.startswith("/") or ".." in Path(name).parts for name in names):
                raise ValueError("Backup archive layout is invalid")
            with tempfile.TemporaryDirectory() as temporary:
                archive.extractall(temporary)
                restored = Path(temporary) / "database" / "legalit.db"
                with sqlite3.connect(restored) as check:
                    result = check.execute("PRAGMA integrity_check").fetchone()
                    if not result or result[0] != "ok":
                        raise ValueError("Backup database failed integrity checking")
                database.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(restored, database)
                if settings.upload_dir.exists():
                    shutil.rmtree(settings.upload_dir)
                source_uploads = Path(temporary) / "uploads"
                if source_uploads.exists():
                    shutil.copytree(source_uploads, settings.upload_dir)
                else:
                    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    except (OSError, ValueError, zipfile.BadZipFile, sqlite3.DatabaseError) as error:
        print(f"Restore failed: {error}")
        return 1
    print("Backup restored. Run database migrations before restarting the API.")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="LegalIt local administration")
    commands = root.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-user", help="Create a client, lawyer, or administrator")
    create.add_argument("--role", required=True, choices=[role.value for role in UserRole])
    create.add_argument("--name", required=True)
    create.add_argument("--email", required=True)
    create.add_argument("--password", help="Omit to generate a one-time temporary password")
    create.set_defaults(handler=create_user)
    nuke = commands.add_parser("nuke-data", help="Erase every local record and uploaded file")
    nuke.add_argument("--yes", action="store_true", help="Confirm irreversible erasure")
    nuke.set_defaults(handler=nuke_data)
    ingest = commands.add_parser("import-legal", help="Import permitted legal documents from a JSON file")
    ingest.add_argument("file")
    ingest.set_defaults(handler=import_legal)
    news = commands.add_parser("import-news", help="Import sourced legal news from a JSON array")
    news.add_argument("file")
    news.set_defaults(handler=import_news)
    backup = commands.add_parser("backup", help="Create a consistent SQLite and uploads backup archive")
    backup.add_argument("--output", required=True)
    backup.set_defaults(handler=backup_data)
    restore = commands.add_parser("restore", help="Replace local data from a backup archive")
    restore.add_argument("file")
    restore.add_argument("--yes", action="store_true")
    restore.set_defaults(handler=restore_data)
    return root


def main() -> int:
    args = parser().parse_args()
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
