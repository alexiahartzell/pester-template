from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from backend.config import PESTER_DIR

PESTER_DIR.mkdir(exist_ok=True)
DB_PATH = PESTER_DIR / "tasks.db"

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
    # Add columns that may be missing from older DBs
    import sqlite3
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.execute("PRAGMA table_info(tasks)")
    columns = {row[1] for row in cursor.fetchall()}
    for col in ["category", "deadline_type"]:
        if col not in columns:
            conn.execute(f"ALTER TABLE tasks ADD COLUMN {col} VARCHAR")
    conn.commit()
    conn.close()
