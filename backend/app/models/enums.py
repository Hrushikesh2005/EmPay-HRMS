import enum

class UserRole(str, enum.Enum):
    employee = "employee"
    hr_officer = "hr_officer"
    payroll_officer = "payroll_officer"
    admin = "admin"

class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    intern = "intern"

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    on_leave = "on_leave"
    holiday = "holiday"
    weekend = "weekend"

class LeaveRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"

class PayrunStatus(str, enum.Enum):
    draft = "draft"
    processing = "processing"
    finalized = "finalized"
    paid = "paid"

class PayslipStatus(str, enum.Enum):
    draft = "draft"
    generated = "generated"
    sent = "sent"