import { useEffect, useMemo, useState } from "react";
import {
  createPrescription,
  fetchMedicines,
  fetchPatientDetails,
  fetchTodayPatients,
  saveConsultation,
} from "../api/doctorApi";

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${suffix}`;
}

function formatBloodPressure(record) {
  if (!record?.systolic_bp || !record?.diastolic_bp) return "-";
  return `${record.systolic_bp}/${record.diastolic_bp}`;
}

export default function Dashboard() {
  const doctor = useMemo(
    () => JSON.parse(localStorage.getItem("doctor") || "null"),
    [],
  );

  const [patients, setPatients] = useState([]);
  const [selectedPatientCode, setSelectedPatientCode] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [consultationResult, setConsultationResult] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    consultation_notes: "",
    diagnosis: "",
  });
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine_id: "", dosage_instructions: "", quantity: 1 },
  ]);

  const loadPatients = async () => {
    if (!doctor?.doctor_id) {
      setLoadingPatients(false);
      return;
    }

    try {
      setError("");
      const data = await fetchTodayPatients(doctor.doctor_id);
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatientCode((prev) => prev || data[0].patient_code);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load today's patients.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadMedicines = async () => {
    try {
      const data = await fetchMedicines();
      setMedicines(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load medicines.");
    }
  };

  const loadPatientDetails = async (patientCode) => {
    if (!patientCode) return;

    try {
      setLoadingDetails(true);
      setError("");
      setSuccess("");
      setConsultationResult(null);
      setPrescriptionItems([
        { medicine_id: "", dosage_instructions: "", quantity: 1 },
      ]);
      const data = await fetchPatientDetails(patientCode);
      setSelectedPatient(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load patient details.");
      setSelectedPatient(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadPatients();
    loadMedicines();
  }, []);

  useEffect(() => {
    if (selectedPatientCode) {
      loadPatientDetails(selectedPatientCode);
    }
  }, [selectedPatientCode]);

  const selectedAppointment = useMemo(
    () =>
      patients.find((item) => item.patient_code === selectedPatientCode) ||
      null,
    [patients, selectedPatientCode],
  );

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const haystack = [
        patient.full_name,
        patient.patient_code,
        patient.reason,
        patient.appointment_time,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [patients, searchTerm]);

  const handleConsultationChange = (e) => {
    setConsultationForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedAppointment) return;

    setSavingConsultation(true);
    setError("");
    setSuccess("");

    try {
      const data = await saveConsultation({
        appointment_id: selectedAppointment.appointment_id,
        patient_code: selectedPatient.patient_code,
        doctor_id: doctor.doctor_id,
        consultation_notes: consultationForm.consultation_notes,
        diagnosis: consultationForm.diagnosis,
      });
      setConsultationResult(data);
      setSuccess("Consultation saved successfully.");
      await loadPatients();
      await loadPatientDetails(selectedPatient.patient_code);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save consultation.");
    } finally {
      setSavingConsultation(false);
    }
  };

  const updatePrescriptionItem = (index, key, value) => {
    setPrescriptionItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems((prev) => [
      ...prev,
      { medicine_id: "", dosage_instructions: "", quantity: 1 },
    ]);
  };

  const removePrescriptionItem = (index) => {
    setPrescriptionItems((prev) =>
      prev.length === 1
        ? prev
        : prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!consultationResult?.consultation_id) {
      setError("Save the consultation first before creating a prescription.");
      return;
    }

    setSavingPrescription(true);
    setError("");
    setSuccess("");

    try {
      await createPrescription({
        consultation_id: consultationResult.consultation_id,
        items: prescriptionItems.map((item) => ({
          medicine_id: Number(item.medicine_id),
          dosage_instructions: item.dosage_instructions,
          quantity: Number(item.quantity),
        })),
      });
      setSuccess("Prescription created successfully.");
      setPrescriptionItems([
        { medicine_id: "", dosage_instructions: "", quantity: 1 },
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create prescription.");
    } finally {
      setSavingPrescription(false);
    }
  };

  return (
    <section className="portal-page">
      <div className="portal-header">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="portal-title">Today's Patients</h1>
            <p className="portal-subtitle">
              Select one patient from the queue, review the details, then save
              the consultation and prescription.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 text-center">
            <p className="text-sm text-slate-500">Total Patients</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {patients.length}
            </p>
          </div>
        </div>
      </div>

      {error && <div className="portal-alert-error">{error}</div>}
      {success && <div className="portal-alert-success">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="portal-card space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <div className="flex items-center justify-between gap-3">
            <h2 className="portal-section-title text-xl">Patient Queue</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {loadingPatients ? "..." : filteredPatients.length}
            </span>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient name or ID"
            className="portal-input text-base"
          />

          {loadingPatients ? (
            <div className="portal-empty">Loading today's patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="portal-empty">
              {patients.length === 0
                ? "No patients scheduled for today."
                : "No matching patient found."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.appointment_id}
                  type="button"
                  onClick={() => setSelectedPatientCode(patient.patient_code)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                    selectedPatientCode === patient.patient_code
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Queue #{patient.queue_number}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {patient.full_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {patient.patient_code}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                      {patient.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>Time: {formatValue(patient.appointment_time)}</p>
                    <p>Reason: {formatValue(patient.reason)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="space-y-6">
          <div className="portal-card">
            {loadingDetails ? (
              <div className="portal-empty">Loading patient details...</div>
            ) : !selectedPatient ? (
              <div className="portal-empty">
                Select a patient from the queue first.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
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
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Patient Information
                    </h3>
                    <div className="mt-4 space-y-2 text-base text-slate-700">
                      <p>
                        <span className="font-semibold">Age:</span>{" "}
                        {formatValue(selectedPatient.age)}
                      </p>
                      <p>
                        <span className="font-semibold">Sex:</span>{" "}
                        {formatValue(selectedPatient.sex)}
                      </p>
                      <p>
                        <span className="font-semibold">Birthday:</span>{" "}
                        {formatValue(selectedPatient.birthday)}
                      </p>
                      <p>
                        <span className="font-semibold">Mobile:</span>{" "}
                        {formatValue(selectedPatient.mobile_number)}
                      </p>
                      <p>
                        <span className="font-semibold">Emergency Contact:</span>{" "}
                        {formatValue(selectedPatient.emergency_contact)}
                      </p>
                      <p>
                        <span className="font-semibold">Address:</span>{" "}
                        {formatValue(selectedPatient.address)}
                      </p>
                      <p>
                        <span className="font-semibold">Reason for Visit:</span>{" "}
                        {formatValue(selectedAppointment?.reason)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Latest Kiosk Record
                    </h3>
                    {selectedPatient.latest_health_record ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Height:</span>{" "}
                          {formatValue(
                            selectedPatient.latest_health_record.height_cm,
                            " cm",
                          )}
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Weight:</span>{" "}
                          {formatValue(
                            selectedPatient.latest_health_record.weight_kg,
                            " kg",
                          )}
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Temperature:</span>{" "}
                          {formatValue(
                            selectedPatient.latest_health_record.temperature_c,
                            " C",
                          )}
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Blood Pressure:</span>{" "}
                          {formatBloodPressure(selectedPatient.latest_health_record)}
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Oxygen:</span>{" "}
                          {formatValue(
                            selectedPatient.latest_health_record.oxygen_saturation,
                            "%",
                          )}
                        </div>
                        <div className="rounded-xl bg-white px-4 py-3 text-base text-slate-700">
                          <span className="font-semibold">Heart Rate:</span>{" "}
                          {formatValue(
                            selectedPatient.latest_health_record.heart_rate,
                            " bpm",
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="portal-empty mt-4">
                        No kiosk health record found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Previous Consultations
                  </h3>
                  {selectedPatient.consultation_history?.length ? (
                    <div className="mt-4 space-y-3">
                      {selectedPatient.consultation_history.map((item) => (
                        <div
                          key={item.consultation_id}
                          className="rounded-2xl bg-white px-4 py-4 text-base text-slate-700"
                        >
                          <p className="font-semibold text-slate-900">
                            {item.consultation_code}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.created_at}
                          </p>
                          <p className="mt-3">
                            <span className="font-semibold">Diagnosis:</span>{" "}
                            {formatValue(item.diagnosis)}
                          </p>
                          <p className="mt-2">
                            <span className="font-semibold">Notes:</span>{" "}
                            {formatValue(item.consultation_notes)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="portal-empty mt-4">
                      No consultation history found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveConsultation} className="portal-card space-y-4">
            <h2 className="portal-section-title text-xl">Consultation</h2>

            <label className="space-y-2">
              <span className="text-base font-semibold text-slate-800">
                Consultation Notes
              </span>
              <textarea
                name="consultation_notes"
                value={consultationForm.consultation_notes}
                onChange={handleConsultationChange}
                className="portal-textarea text-base"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-base font-semibold text-slate-800">
                Diagnosis
              </span>
              <textarea
                name="diagnosis"
                value={consultationForm.diagnosis}
                onChange={handleConsultationChange}
                className="portal-textarea text-base"
                required
              />
            </label>

            <button
              type="submit"
              disabled={savingConsultation || !selectedPatient}
              className="portal-button w-full text-lg"
            >
              {savingConsultation ? "Saving..." : "Save Consultation"}
            </button>
          </form>

          <form onSubmit={handleCreatePrescription} className="portal-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="portal-section-title text-xl">Prescription</h2>
              <button
                type="button"
                onClick={addPrescriptionItem}
                className="portal-button-secondary"
              >
                Add Medicine
              </button>
            </div>

            {prescriptionItems.map((item, index) => (
              <div
                key={`prescription-item-${index}`}
                className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_140px]">
                  <label className="space-y-2">
                    <span className="text-base font-semibold text-slate-800">
                      Medicine
                    </span>
                    <select
                      value={item.medicine_id}
                      onChange={(e) =>
                        updatePrescriptionItem(index, "medicine_id", e.target.value)
                      }
                      className="portal-input text-base"
                      required
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.medicine_id} value={medicine.medicine_id}>
                          {medicine.name} ({medicine.stock_quantity} in stock)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-base font-semibold text-slate-800">
                      Dosage Instructions
                    </span>
                    <input
                      type="text"
                      value={item.dosage_instructions}
                      onChange={(e) =>
                        updatePrescriptionItem(
                          index,
                          "dosage_instructions",
                          e.target.value,
                        )
                      }
                      className="portal-input text-base"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-base font-semibold text-slate-800">
                      Quantity
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePrescriptionItem(index, "quantity", e.target.value)
                      }
                      className="portal-input text-base"
                      required
                    />
                  </label>
                </div>

                {prescriptionItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrescriptionItem(index)}
                    className="mt-4 text-base font-semibold text-red-500 transition hover:text-red-600"
                  >
                    Remove Medicine
                  </button>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={savingPrescription || !selectedPatient}
              className="portal-button w-full text-lg"
            >
              {savingPrescription ? "Creating..." : "Create Prescription"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
