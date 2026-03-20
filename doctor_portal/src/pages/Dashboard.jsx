import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTodayPatients } from "../api/doctorApi";
import { setSelectedPatientCode } from "../utils/selectedPatient";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const doctor = useMemo(
    () => JSON.parse(localStorage.getItem("doctor") || "null"),
    [],
  );

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      if (!doctor?.doctor_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await fetchTodayPatients(doctor.doctor_id);
        setPatients(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load today's patients.");
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [doctor?.doctor_id]);

  const filteredPatients = patients.filter((patient) =>
    [
      patient.full_name,
      patient.patient_code,
      patient.reason,
      patient.appointment_time,
      patient.queue_number,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase()),
  );

  const openPatientDetails = (patientCode) => {
    setSelectedPatientCode(patientCode);
    navigate("/patient-details");
  };

  return (
    <section className="portal-page">
      <div className="portal-header">
        <h1 className="portal-title">Today's Patients</h1>
      </div>

      {error && <div className="portal-alert-error">{error}</div>}

      <section className="portal-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="portal-section-title">Queue</h2>
          <span className="portal-count">{loading ? "..." : filteredPatients.length}</span>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search patient"
          className="portal-input text-base"
        />

        {loading ? (
          <div className="portal-empty">Loading today's patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="portal-empty">
            {patients.length === 0
              ? "No patients scheduled for today."
              : "No matching patient found."}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <div key={patient.appointment_id} className="portal-list-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Queue #{patient.queue_number}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      {patient.full_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{patient.patient_code}</p>
                  </div>
                  <span className="portal-chip-neutral">{patient.status}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="portal-mini-card">
                    <span>Time</span>
                    <strong>{formatValue(patient.appointment_time)}</strong>
                  </div>
                  <div className="portal-mini-card md:col-span-2">
                    <span>Reason</span>
                    <strong className="text-sm">{formatValue(patient.reason)}</strong>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => openPatientDetails(patient.patient_code)}
                    className="portal-button portal-button-block"
                  >
                    Open Patient Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
