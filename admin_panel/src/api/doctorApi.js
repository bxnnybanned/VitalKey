import api from "./axios";

export const getDoctors = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/admin/doctors", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const createDoctor = async (doctorData) => {
  const token = localStorage.getItem("token");

  const response = await api.post("/admin/doctors", doctorData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const token = localStorage.getItem("token");

  const response = await api.put(`/admin/doctors/${id}`, doctorData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const deleteDoctor = async (id) => {
  const token = localStorage.getItem("token");

  const response = await api.delete(`/admin/doctors/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
