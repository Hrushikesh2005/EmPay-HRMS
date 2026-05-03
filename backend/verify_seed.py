from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:1234@localhost:5432/empay')
with engine.connect() as c:
    for t in ['users', 'employee_profiles', 'leave_requests', 'attendance_logs']:
        count = c.execute(text(f"SELECT count(*) FROM {t}")).scalar()
        print(f"{t}: {count}")
