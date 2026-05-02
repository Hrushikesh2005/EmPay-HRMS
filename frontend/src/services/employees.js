import api from "./api";

export async function fetchEmployees() {
  const response = await api.get("/employees");
  return response.data;
}
