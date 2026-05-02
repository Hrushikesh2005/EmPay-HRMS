from pydantic import BaseModel
from app.models.permission import AccessLevel
from typing import List

class PermissionOut(BaseModel):
    id: str
    role: str
    module: str
    access_level: AccessLevel
    can_edit: bool
    can_delete: bool

    class Config:
        from_attributes = True

class PermissionUpdate(BaseModel):
    access_level: AccessLevel
    can_edit: bool
    can_delete: bool

class BulkPermissionItem(BaseModel):
    id: str
    access_level: AccessLevel
    can_edit: bool
    can_delete: bool

class BulkPermissionUpdate(BaseModel):
    items: List[BulkPermissionItem]
