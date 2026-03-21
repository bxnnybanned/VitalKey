import { useEffect, useState } from "react";
import {
  createInventoryMedicine,
  deleteInventoryMedicine,
  fetchInventoryMedicines,
  updateInventoryMedicine,
} from "../api/inventoryApi";

const initialForm = {
  medicine_code: "",
  name: "",
  description: "",
  stock_quantity: 0,
  expiration_date: "",
  unit: "",
  is_active: true,
};

export default function MedicineCatalog() {
  const keeper = JSON.parse(localStorage.getItem("inventory_keeper") || "null");
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchInventoryMedicines();
      setMedicines(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...form,
        keeper_id: keeper?.keeper_id,
        stock_quantity: Number(form.stock_quantity),
        expiration_date: form.expiration_date || null,
      };

      if (editingId) {
        await updateInventoryMedicine(editingId, payload);
        setSuccess("Medicine updated successfully.");
      } else {
        await createInventoryMedicine(payload);
        setSuccess("Medicine added successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadMedicines();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save medicine.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.medicine_id);
    setForm({
      medicine_code: medicine.medicine_code || "",
      name: medicine.name || "",
      description: medicine.description || "",
      stock_quantity: medicine.stock_quantity ?? 0,
      expiration_date: medicine.expiration_date || "",
      unit: medicine.unit || "",
      is_active: medicine.is_active ?? true,
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (medicine) => {
    const confirmed = window.confirm(
      `Delete ${medicine.name}? This will only work if the medicine has no existing records.`,
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await deleteInventoryMedicine(medicine.medicine_id, keeper?.keeper_id);
      setSuccess("Medicine deleted successfully.");

      if (editingId === medicine.medicine_id) {
        setEditingId(null);
        setForm(initialForm);
      }

      await loadMedicines();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete medicine.");
    }
  };

  const filteredMedicines = medicines.filter((medicine) =>
    [medicine.medicine_code, medicine.name, medicine.unit]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  return (
    <section className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">Medicine Catalog</h1>
        <p className="inventory-subtitle">
          Add, update, and monitor medicines used by the doctor portal and release workflow.
        </p>
      </div>

      {error && <div className="inventory-alert-error">{error}</div>}
      {success && <div className="inventory-alert-success">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="inventory-card">
          <h2 className="inventory-section-title">
            {editingId ? "Edit Medicine" : "Add Medicine"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              type="text"
              name="medicine_code"
              value={form.medicine_code}
              onChange={handleChange}
              placeholder="Medicine Code"
              className="inventory-input"
              required
              disabled={Boolean(editingId)}
            />

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Medicine Name"
              className="inventory-input"
              required
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="inventory-textarea"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="number"
                min="0"
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={handleChange}
                placeholder="Stock Quantity"
                className="inventory-input"
                required
              />

              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="Unit"
                className="inventory-input"
              />
            </div>

            <input
              type="date"
              name="expiration_date"
              value={form.expiration_date}
              onChange={handleChange}
              className="inventory-input"
            />

            <label className="inventory-list-card flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Active medicine
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="inventory-button">
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                    ? "Update Medicine"
                    : "Add Medicine"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="inventory-button-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="inventory-card">
          <div className="inventory-section-head">
            <div>
              <h2 className="inventory-section-title">Medicine List</h2>
              <p className="inventory-section-note">Search and update medicine records.</p>
            </div>
            <span className="inventory-count">{filteredMedicines.length}</span>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicine"
              className="inventory-input"
            />
          </div>

          {loading ? (
            <div className="inventory-empty mt-4">Loading medicines...</div>
          ) : filteredMedicines.length === 0 ? (
            <div className="inventory-empty mt-4">No medicine records found.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="inventory-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Stock</th>
                    <th>Unit</th>
                    <th>Expiration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine) => (
                    <tr key={medicine.medicine_id}>
                      <td>{medicine.medicine_code}</td>
                      <td>{medicine.name}</td>
                      <td>{medicine.stock_quantity}</td>
                      <td>{medicine.unit || "-"}</td>
                      <td>{medicine.expiration_date || "-"}</td>
                      <td>
                        <span
                          className={
                            medicine.is_active
                              ? "inventory-status-ok"
                              : "inventory-status-bad"
                          }
                        >
                          {medicine.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(medicine)}
                            className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 transition hover:bg-cyan-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(medicine)}
                            className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
