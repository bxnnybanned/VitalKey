import api from "./axios";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getClinicSettings = async () => {
  const response = await api.get("/admin/clinic-settings", getAuthConfig());
  return response.data;
};

export const updateClinicSetting = async (id, settingData) => {
  const response = await api.put(
    `/admin/clinic-settings/${id}`,
    settingData,
    getAuthConfig(),
  );

  return response.data;
};
