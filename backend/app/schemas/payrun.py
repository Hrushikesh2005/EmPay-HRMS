from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator


class PayrunCreate(BaseModel):
    period_label: str
    period_start: date
    period_end: date

    @model_validator(mode="after")
    def validate_dates(self):
        if self.period_end <= self.period_start:
            raise ValueError("period_end must be greater than period_start")
        return self


class PayrunResponse(BaseModel):
    id: str
    period_label: str
    period_start: date
    period_end: date
    status: str
    created_by: str
    finalized_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
