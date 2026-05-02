from sqlalchemy import Column, String, Boolean, Enum
from app.models.base import Base
import enum

class AccessLevel(str, enum.Enum):
    NONE = "none"
    SELF = "self"
    ALL = "all"

class Permission(Base):
    __tablename__ = "role_permissions"

    id = Column(String, primary_key=True, index=True)
    role = Column(String, index=True, nullable=False)
    module = Column(String, index=True, nullable=False)
    access_level = Column(Enum(AccessLevel), default=AccessLevel.NONE)
    can_edit = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
