import { useEffect, useState } from "react";

import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
} from "../api/doctorApi";

const initialForm = {
  doctor_code: "",
  first_name: "",
  last_name: "",
  specialization: "",
  is_active: true,
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to load doctors.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await updateDoctor(editingId, form);
        setSuccess("Doctor updated successfully.");
      } else {
        await createDoctor(form);
        setSuccess("Doctor added successfully.");
      }

      resetForm();
      await fetchDoctors();
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to save doctor.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (doctor) => {
    setForm({
      doctor_code: doctor.doctor_code || "",
      first_name: doctor.first_name || "",
      last_name: doctor.last_name || "",
      specialization: doctor.specialization || "",
      is_active: doctor.is_active ?? true,
    });
    setEditingId(doctor.doctor_id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (doctorId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this doctor record?",
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await deleteDoctor(doctorId);
      setSuccess("Doctor deleted successfully.");

      if (editingId === doctorId) {
        resetForm();
      }

      await fetchDoctors();
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to delete doctor.",
      );
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Doctor Management</h1>
        <p className="admin-subtitle">
          Add, edit, and manage doctor records for the health center.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      {success && <div className="admin-alert-success">{success}</div>}

      <section className="admin-card-strong">
        <h2 className="admin-card-title mb-4">
          {editingId ? "Edit Doctor" : "Add Doctor"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            name="doctor_code"
            value={form.doctor_code}
            onChange={handleChange}
            placeholder="Doctor Code"
            className="admin-input"
            required
            disabled={Boolean(editingId)}
          />

          <input
            type="text"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            placeholder="Specialization"
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

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active doctor
          </label>

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
                  ? "Update Doctor"
                  : "Add Doctor"}
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
        <h2 className="admin-card-title mb-4">
          Doctor List
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading doctors...</p>
        ) : doctors.length === 0 ? (
          <p className="text-gray-500">No doctor records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.doctor_id} className="border-t">
                    <td className="p-3">{doctor.doctor_code}</td>
                    <td className="p-3">
                      {doctor.first_name} {doctor.last_name}
                    </td>
                    <td className="p-3">{doctor.specialization}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          doctor.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {doctor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(doctor)}
                          className="rounded-lg bg-yellow-400 px-4 py-2 text-white hover:bg-yellow-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doctor.doctor_id)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
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
  );
}
