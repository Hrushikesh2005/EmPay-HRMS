from pydantic import BaseModel, ConfigDict
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    description: str | None = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    name: str | None = None

class DepartmentResponse(DepartmentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
