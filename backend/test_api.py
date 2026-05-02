import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_response(title, response):
    """Helper to pretty print responses"""
    print(f"\n{'='*60}")
    print(f"📌 {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def main():
    # Step 1: Login as admin
    print("\n🔐 Step 1: Login as Admin")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "admin@empay.com", "password": "Password123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code != 200:
        print_response("Login Failed", login_response)
        return
    
    admin_token = login_response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ Admin Token: {admin_token[:50]}...")
    
    # Step 2: Get all leave types
    print("\n📋 Step 2: Get All Leave Types")
    types_response = requests.get(
        f"{BASE_URL}/leave-types",
        headers=admin_headers
    )
    print_response("Leave Types", types_response)
    
    if types_response.status_code != 200:
        return
    
    leave_types = types_response.json()
    if not leave_types:
        print("❌ No leave types found")
        return
    
    leave_type_id = leave_types[0]["id"]
    print(f"✅ Using leave type ID: {leave_type_id} ({leave_types[0]['name']})")
    
    # Step 3: Get all employees and find emp1
    print("\n👥 Step 3: Get All Employees")
    emp_response = requests.get(
        f"{BASE_URL}/employees",
        headers=admin_headers
    )
    print_response("Employees", emp_response)
    
    if emp_response.status_code != 200:
        print("❌ Could not fetch employees.")
        return
    
    employees = emp_response.json()
    if not employees:
        print("❌ No employees found")
        return
    
    # Find emp1 specifically so we can verify allocation later
    emp1_record = next((e for e in employees if e["user"]["email"] == "emp1@empay.com"), None)
    if not emp1_record:
        employee_id = employees[0]["id"]
        print(f"⚠️  emp1 not found, using first employee: {employees[0]['user']['full_name']}")
    else:
        employee_id = emp1_record["id"]
        print(f"✅ Using emp1 ID: {employee_id}")
    
    # Step 4: Allocate leave as admin
    print("\n💼 Step 4: Allocate Leave (Admin)")
    allocation_body = {
        "employee_id": employee_id,
        "leave_type_id": leave_type_id,
        "year": 2026,
        "allocated_days": 18
    }
    
    alloc_response = requests.post(
        f"{BASE_URL}/leave-balances",
        json=allocation_body,
        headers=admin_headers
    )
    print_response("Allocation Result", alloc_response)
    
    if alloc_response.status_code not in [200, 201]:
        print("❌ Allocation failed")
        return
    
    print("✅ Leave allocated successfully")
    
    # Step 5: Login as employee
    print("\n🔐 Step 5: Login as Employee")
    emp_login_response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "emp1@empay.com", "password": "Password123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print_response("Employee Login", emp_login_response)
    
    if emp_login_response.status_code != 200:
        print("❌ Employee login failed")
        return
    
    emp_token = emp_login_response.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print(f"✅ Employee Token: {emp_token[:50]}...")
    
    # Step 6: View employee's leave balance
    print("\n📊 Step 6: View Employee's Leave Balance")
    balance_response = requests.get(
        f"{BASE_URL}/leave-balances/me",
        headers=emp_headers
    )
    print_response("Employee's Leave Balance", balance_response)
    
    if balance_response.status_code == 200:
        balances = balance_response.json()
        if balances:
            print(f"\n✅ Total allocated days: {balances[0]['allocated_days']}")
            print(f"✅ Used days: {balances[0]['used_days']}")
            print(f"✅ Remaining days: {balances[0]['remaining_days']}")
            print(f"✅ Leave type: {balances[0]['leave_type_name']}")
        else:
            print("ℹ️  No leave balances found for this employee")
    else:
        print("❌ Failed to fetch leave balance")
    
    print("\n" + "="*60)
    print("✅ Test completed!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
