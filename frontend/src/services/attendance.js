import api from '../api/axios';

export const checkIn = async (remarks = "") => {
  const response = await api.post('/attendance/checkin', { remarks });
  return response.data;
};

export const checkOut = async (remarks = "") => {
  const response = await api.post('/attendance/checkout', { remarks });
  return response.data;
};

export const getMyAttendanceHistory = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await api.get('/attendance/history', { params });
  return response.data;
};

export const getAllAttendance = async (startDate, endDate, employeeId) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (employeeId) params.employee_id = employeeId;
  const response = await api.get('/attendance/all', { params });
  return response.data;
};

export const getMyLeaveBalances = async () => {
  const response = await api.get('/leave-balances/me');
  return response.data;
};
