import json

from sqlalchemy.orm import Session

from app.models.core import AuditLog


def add_audit(
    session: Session,
    *,
    action: str,
    actor_user_id: str | None,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        action=action,
        actor_user_id=actor_user_id,
        target_type=target_type,
        target_id=target_id,
        details_json=json.dumps(details or {}, separators=(",", ":")),
        ip_address=ip_address,
    )
    session.add(entry)
    return entry
