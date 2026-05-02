import api from "../api/axios";

export async function fetchEmployees() {
  const response = await api.get("/employees");
  return response.data;
}
