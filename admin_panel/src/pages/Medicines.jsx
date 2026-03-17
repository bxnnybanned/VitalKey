import { useEffect, useMemo, useState } from "react";

import {
  createMedicine,
  getMedicines,
  updateMedicine,
} from "../api/medicinesApi";

const initialForm = {
  medicine_code: "",
  name: "",
  description: "",
  stock_quantity: "",
  expiration_date: "",
  unit: "",
  is_active: true,
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMedicines();
      setMedicines(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load medicines.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filteredMedicines = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return medicines;

    return medicines.filter((medicine) =>
      [
        medicine.medicine_code,
        medicine.name,
        medicine.description,
        medicine.unit,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [medicines, search]);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        medicine_code: form.medicine_code,
        name: form.name,
        description: form.description || null,
        stock_quantity: Number(form.stock_quantity),
        expiration_date: form.expiration_date || null,
        unit: form.unit || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await updateMedicine(editingId, payload);
        setSuccess("Medicine updated successfully.");
      } else {
        await createMedicine(payload);
        setSuccess("Medicine added successfully.");
      }

      resetForm();
      await fetchMedicines();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to save medicine.",
      );
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
      stock_quantity: medicine.stock_quantity ?? "",
      expiration_date: medicine.expiration_date || "",
      unit: medicine.unit || "",
      is_active: medicine.is_active ?? true,
    });
    setSuccess("");
    setError("");
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Medicine Catalog</h1>
        <p className="admin-subtitle">
          Manage medicine entries used in the doctor portal and inventory system.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      {success && <div className="admin-alert-success">{success}</div>}

      <section className="admin-card-strong">
        <h2 className="admin-card-title mb-4">
          {editingId ? "Edit Medicine" : "Add Medicine"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            name="medicine_code"
            value={form.medicine_code}
            onChange={handleChange}
            placeholder="Medicine Code"
            className="admin-input"
            required
            disabled={Boolean(editingId)}
          />

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Medicine Name"
            className="admin-input"
            required
          />

          <input
            type="number"
            min="0"
            name="stock_quantity"
            value={form.stock_quantity}
            onChange={handleChange}
            placeholder="Stock Quantity"
            className="admin-input"
            required
          />

          <input
            type="text"
            name="unit"
            value={form.unit}
            onChange={handleChange}
            placeholder="Unit (e.g. tablet, bottle)"
            className="admin-input"
          />

          <input
            type="date"
            name="expiration_date"
            value={form.expiration_date}
            onChange={handleChange}
            className="admin-input"
          />

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active medicine
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            rows="4"
            className="admin-textarea md:col-span-2"
          />

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="admin-button"
            >
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
                onClick={resetForm}
                className="admin-button-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card-strong">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="admin-card-title">
            Medicine List
          </h2>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name, description..."
            className="admin-input md:max-w-sm"
          />
        </div>

        {loading ? (
          <p className="text-gray-500">Loading medicines...</p>
        ) : filteredMedicines.length === 0 ? (
          <p className="text-gray-500">No medicines found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Expiration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((medicine) => (
                  <tr key={medicine.medicine_id} className="border-t">
                    <td className="p-3 font-medium text-gray-800">
                      {medicine.medicine_code}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-800">{medicine.name}</p>
                      <p className="text-sm text-gray-500">
                        {medicine.description || "No description"}
                      </p>
                    </td>
                    <td className="p-3">{medicine.stock_quantity}</td>
                    <td className="p-3">{medicine.unit || "N/A"}</td>
                    <td className="p-3">{medicine.expiration_date || "N/A"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          medicine.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {medicine.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(medicine)}
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
