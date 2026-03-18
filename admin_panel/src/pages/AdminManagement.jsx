import { useEffect, useMemo, useState } from "react";
import { createAdmin, fetchAdmins, updateAdminStatus } from "../api/adminManagementApi";

function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem("admin") || "null");
  } catch {
    return null;
  }
}

export default function AdminManagement() {
  const currentAdmin = useMemo(() => getStoredAdmin(), []);
  const isSuperAdmin = currentAdmin?.role === "super_admin";

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const loadAdmins = async () => {
    if (!currentAdmin?.id || !isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const data = await fetchAdmins(currentAdmin.id);
      setAdmins(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isSuperAdmin || !currentAdmin?.id) {
      setError("Only a super admin can add admins.");
      return;
    }

    setSaving(true);
    try {
      await createAdmin({
        requester_admin_id: currentAdmin.id,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
      });

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
      setSuccess("Admin added successfully.");
      await loadAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add admin.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    if (!currentAdmin?.id) return;

    setError("");
    setSuccess("");

    try {
      await updateAdminStatus(admin.admin_id, {
        requester_admin_id: currentAdmin.id,
        is_active: !admin.is_active,
      });
      setSuccess("Admin status updated successfully.");
      await loadAdmins();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update admin status.");
    }
  };

  if (!isSuperAdmin) {
    return (
      <section className="admin-page">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Management</h1>
            <p className="admin-subtitle">
              This section is only available to the super admin.
            </p>
          </div>
        </div>

        <div className="admin-card p-6 text-sm text-slate-600">
          Only the super admin can view and manage admin accounts.
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Management</h1>
          <p className="admin-subtitle">
            Add admin accounts and manage access for the admin panel.
          </p>
        </div>
      </div>

      {error && <div className="admin-alert-error">{error}</div>}
      {success && <div className="admin-alert-success">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="admin-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Add Admin</h2>
          <p className="mt-1 text-sm text-slate-500">
            New admin accounts created here will have the standard admin role.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  First Name
                </span>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Last Name
                </span>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="admin-input"
                  required
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="admin-input"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="admin-input"
                required
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="admin-button w-full"
            >
              {saving ? "Adding Admin..." : "Add Admin"}
            </button>
          </form>
        </div>

        <div className="admin-card overflow-hidden">
          <div className="border-b border-slate-200/70 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Admin List</h2>
            <p className="mt-1 text-sm text-slate-500">
              View all admin accounts and control their access status.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-sm text-slate-500">
              Loading admin accounts...
            </div>
          ) : admins.length === 0 ? (
            <div className="px-6 py-8 text-sm text-slate-500">
              No admin accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.admin_id}>
                      <td>{admin.full_name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className="admin-badge bg-blue-50 text-blue-700">
                          {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            admin.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{admin.created_by_name || "-"}</td>
                      <td>
                        {admin.role === "super_admin" ? (
                          <span className="text-xs font-medium text-slate-400">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(admin)}
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                          >
                            {admin.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
