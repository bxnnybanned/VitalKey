import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  createMedicineKeeper,
  fetchMedicineKeepers,
  updateMedicineKeeper,
} from "../api/medicineKeepersApi";

const initialForm = {
  keeper_code: "",
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  is_active: true,
};

export default function MedicineKeepers() {
  const [keepers, setKeepers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadKeepers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchMedicineKeepers();
      setKeepers(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to load medicine keepers.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeepers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await updateMedicineKeeper(editingId, form);
        setSuccess("Medicine keeper updated successfully.");
      } else {
        await createMedicineKeeper(form);
        setSuccess("Medicine keeper added successfully.");
      }

      resetForm();
      await loadKeepers();
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to save medicine keeper.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (keeper) => {
    setForm({
      keeper_code: keeper.keeper_code || "",
      first_name: keeper.first_name || "",
      last_name: keeper.last_name || "",
      username: keeper.username || "",
      password: "",
      is_active: keeper.is_active ?? true,
    });
    setEditingId(keeper.keeper_id);
    setShowPassword(false);
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Medicine Keeper Accounts</h1>
        <p className="admin-subtitle">
          Create and manage inventory system accounts for medicine keepers.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}
      {success && <div className="admin-alert-success">{success}</div>}

      <section className="admin-card-strong">
        <h2 className="admin-card-title mb-4">
          {editingId ? "Edit Medicine Keeper" : "Add Medicine Keeper"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            type="text"
            name="keeper_code"
            value={form.keeper_code}
            onChange={handleChange}
            placeholder="Keeper Code"
            className="admin-input"
            required
            disabled={Boolean(editingId)}
          />

          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Inventory Username"
            className="admin-input"
            required
          />

          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="admin-input"
            required
          />

          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="admin-input"
            required
          />

          <div className="relative md:col-span-2">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={
                editingId
                  ? "New Password (optional)"
                  : "Inventory Password"
              }
              className="admin-input pr-12"
              required={!editingId}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active medicine keeper
          </label>

          <div className="flex gap-3 md:col-span-2">
            <button type="submit" disabled={saving} className="admin-button">
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                  ? "Update Medicine Keeper"
                  : "Add Medicine Keeper"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} className="admin-button-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card-strong">
        <h2 className="admin-card-title mb-4">Medicine Keeper List</h2>

        {loading ? (
          <p className="text-gray-500">Loading medicine keeper accounts...</p>
        ) : keepers.length === 0 ? (
          <p className="text-gray-500">No medicine keeper accounts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {keepers.map((keeper) => (
                  <tr key={keeper.keeper_id} className="border-t">
                    <td className="p-3">{keeper.keeper_code}</td>
                    <td className="p-3">{keeper.full_name}</td>
                    <td className="p-3">{keeper.username}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          keeper.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {keeper.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(keeper)}
                        className="rounded-lg bg-yellow-400 px-4 py-2 text-white hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
