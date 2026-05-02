# EmPay HRMS Implementation Notes

This file is intentionally ignored by git and is meant for local reference while working on the backend.

## What we implemented

### 1. Database migration and seed setup
- Added the initial Alembic migration in `backend/alembic/versions/21232ece52e3_initial_schema.py`.
- The migration creates the core tables used by the HRMS backend, including `users`, `employee_profiles`, `leave_types`, `leave_balances`, `leave_requests`, `attendance_logs`, `payruns`, `payslips`, and `salary_structures`.
- Added `backend/seed.py` to create initial users and leave types so the app has working test data right after setup.

### 2. User model and password hashing
- Defined the `User` ORM model in `backend/app/models/user.py`.
- The model stores the user's email, full name, role, hashed password, and active status.
- Passwords are hashed with bcrypt in `backend/app/services/auth_services.py` and in `backend/seed.py` before being stored.
- This avoids storing raw passwords and keeps authentication secure.

### 3. Authentication routes
- Added `POST /api/v1/auth/register` and `POST /api/v1/auth/login` in `backend/app/api/auth.py`.
- `register` creates a new user, hashes the password, and saves the account.
- `login` validates the password and returns access and refresh JWT tokens.
- `POST /api/v1/auth/refresh` is also available to issue new access tokens from a valid refresh token.
- `GET /api/v1/auth/me` returns the currently authenticated user.

### 4. JWT middleware and current user dependency
- Implemented JWT creation and verification in `backend/app/services/auth_services.py` and `backend/app/core/dependencies.py`.
- `backend/app/core/dependencies.py` defines `get_current_user`, which:
  - reads the Bearer token from the request,
  - decodes and validates the JWT,
  - loads the matching `User` record from the database,
  - and injects that user into route handlers.
- The same file also provides role-check helpers such as `require_roles`, `require_admin`, `require_hr`, and `require_payroll`.
- These helpers are used to protect endpoints from unauthorized access.

### 5. Leave allocation setup for HR
- Added `backend/app/models/leave_balance.py` to track leave allocation per employee, leave type, and year.
- Added `backend/app/schemas/leave_balance.py` for request and response validation.
- Added `backend/app/services/leave_balance_service.py` for the business logic that allocates, updates, and fetches balances.
- Added `backend/app/api/leave_balances.py` for the HTTP routes.
- Registered the routes in `backend/app/main.py`.

## How the flow works

### Step A: Bootstrapping the database
1. Alembic runs the initial migration.
2. The database gets the base tables needed for users, employees, leaves, attendance, payroll, and balances.
3. The seed script inserts default users and leave types so the system can be tested immediately.

### Step B: User registration and login
1. A client sends credentials to `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.
2. The service hashes the password using bcrypt.
3. On login, the service verifies the password and creates JWT access and refresh tokens.
4. The tokens are returned to the client along with the user profile and role.

### Step C: Protecting routes with JWT
1. A client sends the access token in the `Authorization: Bearer <token>` header.
2. `get_current_user` validates the token signature and expiration.
3. The dependency loads the user from the database.
4. Protected routes receive the current user object automatically.

### Step D: HR leave allocation
1. An HR officer or admin calls `POST /api/v1/leave-balances`.
2. The route is protected by role checks, so only approved roles can allocate balances.
3. The service checks whether the employee already has a balance for that leave type and year.
4. If no duplicate exists, a new `leave_balances` record is inserted.
5. The response includes allocated days, used days, remaining days, and the leave type name.

### Step E: Employee balance viewing
1. An authenticated employee calls `GET /api/v1/leave-balances/me`.
2. The backend finds the employee profile linked to the logged-in user.
3. It fetches the current year balances and returns them to the employee.
4. The response shows how much leave is allocated, used, and remaining.

## Files used in this implementation

### Core database and startup
- `backend/alembic/versions/21232ece52e3_initial_schema.py`
- `backend/seed.py`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/database.py`

### Authentication and security
- `backend/app/models/user.py`
- `backend/app/services/auth_services.py`
- `backend/app/api/auth.py`
- `backend/app/core/dependencies.py`
- `backend/app/models/enums.py`
- `backend/app/models/base.py`

### Leave allocation
- `backend/app/models/leave_balance.py`
- `backend/app/schemas/leave_balance.py`
- `backend/app/services/leave_balance_service.py`
- `backend/app/api/leave_balances.py`
- `backend/app/models/leave.py`
- `backend/app/schemas/leave_type.py`
- `backend/app/api/leave_types.py`

## Why this matters
- The database migration gives the app its schema.
- The seed script makes the system usable from day one.
- The user model and bcrypt hashing make login secure.
- JWT middleware keeps routes protected and user-aware.
- Leave allocation must happen before employees can submit or consume leave, so HR setup is the first operational step.

## Notes
- This file is local documentation only.
- It is ignored by git on purpose.
- If the implementation changes later, update this note file first so the architecture stays easy to review.
