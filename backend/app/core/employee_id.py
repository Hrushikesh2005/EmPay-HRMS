"""Employee ID code generation.

Format: {COMPANY_PREFIX}{FL}{JL}{YEAR}{SERIAL:04d}
Example: EMJODO20260001

- COMPANY_PREFIX: from settings (default "EM"), swap when company name feature is added
- FL: first 2 letters of first name
- JL: first 2 letters of last name
- YEAR: 4-digit year of joining (falls back to current year)
- SERIAL: auto-incremented count of employees who joined that year, zero-padded to 4 digits
"""

import re
from datetime import date
from sqlalchemy.orm import Session
from app.core.config import settings


def _clean(text: str, length: int = 2) -> str:
    """Extract uppercase alpha chars from text, up to `length` chars."""
    letters = re.sub(r"[^a-zA-Z]", "", text).upper()
    return letters[:length].ljust(length, "X")  # pad with X if name is very short


def generate_employee_code(full_name: str, join_year: int | None, db: Session) -> str:
    from app.models.employee import EmployeeProfile

    year = join_year or date.today().year

    # Split name into parts; treat first word as first name, last word as last name
    parts = full_name.strip().split()
    first = parts[0] if len(parts) >= 1 else "XX"
    last = parts[-1] if len(parts) >= 2 else "XX"

    initials = _clean(first, 2) + _clean(last, 2)
    prefix = settings.COMPANY_PREFIX.upper()

    # Count employees whose code starts with this prefix+initials+year pattern
    pattern = f"{prefix}{initials}{year}%"
    count = (
        db.query(EmployeeProfile)
        .filter(EmployeeProfile.employee_code.like(pattern))
        .count()
    )
    serial = count + 1

    return f"{prefix}{initials}{year}{serial:04d}"
