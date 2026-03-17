import { useEffect, useMemo, useState } from "react";

import {
  getAppointments,
  updateAppointmentStatus,
} from "../api/appointmentsApi";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Consulted", "Cancelled"];

const statusClasses = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Consulted: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        normalizedSearch === "" ||
        [
          appointment.appointment_code,
          appointment.patient_code,
          appointment.patient_name,
          appointment.doctor_name,
          appointment.reason,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "All" || appointment.status === statusFilter;

      const matchesDate =
        dateFilter === "" || appointment.appointment_date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  const handleStatusChange = async (appointmentId, nextStatus) => {
    try {
      setSavingId(appointmentId);
      setError("");
      await updateAppointmentStatus(appointmentId, nextStatus);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, status: nextStatus }
            : appointment,
        ),
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update appointment status.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Appointment Management</h1>
        <p className="admin-subtitle">
          Track patient bookings, review queue assignments, and update
          appointment status as consultations move through the clinic.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      <section className="admin-card">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search appointment code, patient, doctor, reason..."
            className="admin-input"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="admin-input"
          />
        </div>
      </section>

      <section className="admin-card-strong">
        <div className="mb-5">
          <h2 className="admin-card-title">Appointment List</h2>
          <p className="admin-card-subtitle">
            Filter and manage consultation bookings in real time.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading appointments...</p>
        ) : filteredAppointments.length === 0 ? (
          <div className="admin-empty">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Appointment Code</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Queue</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td className="font-semibold text-slate-900">
                      {appointment.appointment_code}
                    </td>
                    <td>
                      <p className="font-semibold text-slate-900">
                        {appointment.patient_name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {appointment.patient_code || "No Patient ID"}
                      </p>
                    </td>
                    <td>{appointment.doctor_name}</td>
                    <td>{appointment.appointment_date}</td>
                    <td>{appointment.appointment_time}</td>
                    <td>
                      <span className="admin-badge bg-slate-100 text-slate-700">
                        #{appointment.queue_number}
                      </span>
                    </td>
                    <td>
                      <div className="max-w-xs whitespace-normal text-slate-600">
                        {appointment.reason}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-2">
                        <span
                          className={`admin-badge ${
                            statusClasses[appointment.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {appointment.status}
                        </span>
                        <select
                          value={appointment.status}
                          disabled={savingId === appointment.appointment_id}
                          onChange={(e) =>
                            handleStatusChange(
                              appointment.appointment_id,
                              e.target.value,
                            )
                          }
                          className="admin-select min-w-[150px] py-2 text-sm"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
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
