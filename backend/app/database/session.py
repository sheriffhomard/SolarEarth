"""
Database session management with SQLAlchemy.
Supports local SQLite file storage for lightweight offline/mobile environments.
"""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from backend.app.core.config import settings
from backend.app.core.logging import get_logger

logger = get_logger("DATABASE")

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine_kwargs = {"connect_args": connect_args}
if not is_sqlite:
    engine_kwargs.update({"pool_size": 10, "max_overflow": 20, "pool_pre_ping": True})

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and ensures closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Checks whether the database connection is operational."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1;"))
            return True
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False
