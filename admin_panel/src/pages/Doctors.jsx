import { useEffect, useState } from "react";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../api/doctorApi";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    doctor_code: "",
    first_name: "",
    last_name: "",
    specialization: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      setError("Failed to load doctors.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setForm({
      doctor_code: "",
      first_name: "",
      last_name: "",
      specialization: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateDoctor(editingId, form);
      } else {
        await createDoctor(form);
      }

      resetForm();
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert("Failed to save doctor.");
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
    setEditingId(doctor.id);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this doctor?",
    );
    if (!confirmed) return;

    try {
      await deleteDoctor(id);
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert("Failed to delete doctor.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Doctors Management</h1>
        <p className="text-gray-500">Add, edit, and manage doctor records.</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Doctor" : "Add Doctor"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            name="doctor_code"
            value={form.doctor_code}
            onChange={handleChange}
            placeholder="Doctor Code"
            className="border rounded-xl px-4 py-3"
            required
          />

          <input
            type="text"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            placeholder="Specialization"
            className="border rounded-xl px-4 py-3"
            required
          />

          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="border rounded-xl px-4 py-3"
            required
          />

          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="border rounded-xl px-4 py-3"
            required
          />

          <label className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              {editingId ? "Update Doctor" : "Add Doctor"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Doctor List</h2>

        {loading ? (
          <p className="text-gray-500">Loading doctors...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : doctors.length === 0 ? (
          <p className="text-gray-500">No doctors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Specialization</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id} className="border-t">
                    <td className="p-3">{doctor.doctor_code}</td>
                    <td className="p-3">
                      {doctor.first_name} {doctor.last_name}
                    </td>
                    <td className="p-3">{doctor.specialization}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          doctor.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {doctor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
