import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getAppointments = async () => {
  const response = await api.get("/admin/appointments", getAuthConfig());
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.put(
    `/admin/appointments/${appointmentId}/status`,
    { status },
    getAuthConfig(),
  );

  return response.data;
};
