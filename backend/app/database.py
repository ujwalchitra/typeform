from pathlib import Path

from sqlmodel import SQLModel, Session, create_engine

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATABASE_FILE = BACKEND_DIR / "typeform.db"

DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session