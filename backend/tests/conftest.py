from pathlib import Path

import pytest

from app.core.config import Settings


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    return Settings(
        data_dir=tmp_path / "data",
        upload_dir=tmp_path / "uploads",
        database_url=f"sqlite:///{(tmp_path / 'test.db').as_posix()}",
    )
