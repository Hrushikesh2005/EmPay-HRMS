from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


# Ensure an async driver is used for SQLAlchemy async engine. If the
# DATABASE_URL is provided as "postgresql://...", swap to
# "postgresql+asyncpg://..." so SQLAlchemy loads asyncpg instead of psycopg2.
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://") and "asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(database_url, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
