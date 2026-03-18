import api from "./axios";

export async function fetchAdmins(requesterAdminId) {
  const response = await api.get("/admin/admins", {
    params: { requester_admin_id: requesterAdminId },
  });

  return response.data;
}

export async function createAdmin(payload) {
  const response = await api.post("/admin/admins", payload);
  return response.data;
}

export async function updateAdminStatus(adminId, payload) {
  const response = await api.put(`/admin/admins/${adminId}/status`, payload);
  return response.data;
}
