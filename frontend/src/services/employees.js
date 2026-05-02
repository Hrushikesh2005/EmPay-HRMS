import api from "../api/axios";

export async function fetchEmployees() {
  const response = await api.get("/employees");
  return response.data;
}

export async function fetchEmployeeSalary(employeeId) {
  const response = await api.get(`/employees/${employeeId}/salary`);
  return response.data;
}

export async function changeUserPassword(userId, currentPassword, newPassword) {
  const response = await api.patch(`/users/${userId}/change-password`, {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
}
