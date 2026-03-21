import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPatientDetails, fetchTodayPatients } from "../api/doctorApi";
import { getSelectedPatientCode, getSelectedQueueItem } from "../utils/selectedPatient";

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${suffix}`;
}

function formatBloodPressure(record) {
  if (!record?.systolic_bp || !record?.diastolic_bp) return "-";
  return `${record.systolic_bp}/${record.diastolic_bp}`;
}

export default function PatientDetails() {
  const navigate = useNavigate();
  const doctor = useMemo(
    () => JSON.parse(localStorage.getItem("doctor") || "null"),
    [],
  );
  const selectedPatientCode = getSelectedPatientCode();
  const selectedQueueItem = getSelectedQueueItem();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      if (!doctor?.doctor_id || !selectedPatientCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [details, patients] = await Promise.all([
          fetchPatientDetails(selectedPatientCode),
          fetchTodayPatients(doctor.doctor_id),
        ]);
        setSelectedPatient(details);
        setSelectedAppointment(
          selectedQueueItem
            ? patients.find(
                (item) => item.queue_item_id === selectedQueueItem.queue_item_id,
              ) || selectedQueueItem
            : patients.find((item) => item.patient_code === selectedPatientCode) || null,
        );
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [doctor?.doctor_id, selectedPatientCode]);

  return (
    <section className="portal-page">
      <div className="portal-header">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="portal-title">Patient Details</h1>
          <button
            type="button"
            onClick={() => navigate("/consultation")}
            disabled={!selectedPatient}
            className="portal-button portal-button-block"
          >
            Continue to Consultation
          </button>
        </div>
      </div>

      {error && <div className="portal-alert-error">{error}</div>}

      {loading ? (
        <div className="portal-empty">Loading patient details...</div>
      ) : !selectedPatient ? (
        <div className="portal-empty">
          Select a patient from Today's Patients first.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="portal-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-bold text-slate-900 md:text-[32px]">
                  {selectedPatient.full_name}
                </h2>
                <p className="mt-2 text-base text-slate-500">
                  Patient ID: {selectedPatient.patient_code}
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Queue:</span>{" "}
                  {selectedAppointment?.queue_number
                    ? `#${selectedAppointment.queue_number}`
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Time:</span>{" "}
                  {formatValue(selectedAppointment?.appointment_time)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Status:</span>{" "}
                  {formatValue(selectedAppointment?.status)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Source:</span>{" "}
                  {formatValue(selectedAppointment?.source)}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="portal-card">
              <h2 className="portal-section-title">Patient Information</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="portal-mini-card">
                  <span>Age</span>
                  <strong>{formatValue(selectedPatient.age)}</strong>
                </div>
                <div className="portal-mini-card">
                  <span>Sex</span>
                  <strong>{formatValue(selectedPatient.sex)}</strong>
                </div>
                <div className="portal-mini-card">
                  <span>Birthday</span>
                  <strong>{formatValue(selectedPatient.birthday)}</strong>
                </div>
                <div className="portal-mini-card">
                  <span>Mobile</span>
                  <strong>{formatValue(selectedPatient.mobile_number)}</strong>
                </div>
                <div className="portal-mini-card md:col-span-2">
                  <span>Emergency Contact</span>
                  <strong>{formatValue(selectedPatient.emergency_contact)}</strong>
                </div>
                <div className="portal-mini-card md:col-span-2">
                  <span>Address</span>
                  <strong className="text-sm">{formatValue(selectedPatient.address)}</strong>
                </div>
                <div className="portal-mini-card md:col-span-2">
                  <span>Reason for Visit</span>
                  <strong className="text-sm">
                    {formatValue(selectedAppointment?.reason)}
                  </strong>
                </div>
              </div>
            </section>

            <section className="portal-card">
              <h2 className="portal-section-title">Latest Kiosk Record</h2>
              {selectedPatient.latest_health_record ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="portal-mini-card">
                    <span>Height</span>
                    <strong>
                      {formatValue(selectedPatient.latest_health_record.height_cm, " cm")}
                    </strong>
                  </div>
                  <div className="portal-mini-card">
                    <span>Weight</span>
                    <strong>
                      {formatValue(selectedPatient.latest_health_record.weight_kg, " kg")}
                    </strong>
                  </div>
                  <div className="portal-mini-card">
                    <span>Temperature</span>
                    <strong>
                      {formatValue(
                        selectedPatient.latest_health_record.temperature_c,
                        " C",
                      )}
                    </strong>
                  </div>
                  <div className="portal-mini-card">
                    <span>Blood Pressure</span>
                    <strong>{formatBloodPressure(selectedPatient.latest_health_record)}</strong>
                  </div>
                  <div className="portal-mini-card">
                    <span>Oxygen</span>
                    <strong>
                      {formatValue(
                        selectedPatient.latest_health_record.oxygen_saturation,
                        "%",
                      )}
                    </strong>
                  </div>
                  <div className="portal-mini-card">
                    <span>Heart Rate</span>
                    <strong>
                      {formatValue(selectedPatient.latest_health_record.heart_rate, " bpm")}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="portal-empty mt-4">No kiosk health record found.</div>
              )}
            </section>
          </div>

          <section className="portal-card">
            <h2 className="portal-section-title">Previous Consultations</h2>
            {selectedPatient.consultation_history?.length ? (
              <div className="mt-4 space-y-3">
                {selectedPatient.consultation_history.map((item) => (
                  <div key={item.consultation_id} className="portal-panel">
                    <p className="font-semibold text-slate-900">{item.consultation_code}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.created_at}</p>
                    <p className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold">Diagnosis:</span>{" "}
                      {formatValue(item.diagnosis)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold">Notes:</span>{" "}
                      {formatValue(item.consultation_notes)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="portal-empty mt-4">No consultation history found.</div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
