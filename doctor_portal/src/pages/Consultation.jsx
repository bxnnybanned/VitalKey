import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeConsultation, fetchMedicines, fetchPatientDetails, fetchTodayPatients } from "../api/doctorApi";
import { clearSelectedPatientCode, getSelectedPatientCode, getSelectedQueueItem } from "../utils/selectedPatient";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function Consultation() {
  const navigate = useNavigate();
  const doctor = useMemo(
    () => JSON.parse(localStorage.getItem("doctor") || "null"),
    [],
  );
  const selectedPatientCode = getSelectedPatientCode();
  const selectedQueueItem = getSelectedQueueItem();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consultationForm, setConsultationForm] = useState({
    consultation_notes: "",
    diagnosis: "",
  });
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicine_id: "", dosage_instructions: "", quantity: 1 },
  ]);

  useEffect(() => {
    const loadConsultationData = async () => {
      if (!doctor?.doctor_id || !selectedPatientCode) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [details, patients, medicineData] = await Promise.all([
          fetchPatientDetails(selectedPatientCode),
          fetchTodayPatients(doctor.doctor_id),
          fetchMedicines(),
        ]);
        setSelectedPatient(details);
        setSelectedAppointment(
          selectedQueueItem
            ? patients.find(
                (item) => item.queue_item_id === selectedQueueItem.queue_item_id,
              ) || selectedQueueItem
            : patients.find((item) => item.patient_code === selectedPatientCode) || null,
        );
        setMedicines(medicineData);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load consultation data.");
      } finally {
        setLoading(false);
      }
    };

    loadConsultationData();
  }, [doctor?.doctor_id, selectedPatientCode]);

  const handleConsultationChange = (e) => {
    setConsultationForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const normalizedItems = prescriptionItems.map((item) => ({
        medicine_id: Number(item.medicine_id),
        dosage_instructions: item.dosage_instructions.trim(),
        quantity: Number(item.quantity),
      }));

      const invalidItem = normalizedItems.find(
        (item) =>
          !item.medicine_id ||
          !item.dosage_instructions ||
          !item.quantity ||
          item.quantity < 1,
      );

      if (invalidItem) {
        setError("Complete the medicine, dosage instructions, and quantity fields.");
        setSubmitting(false);
        return;
      }

      await completeConsultation({
        appointment_id: selectedAppointment?.appointment_id ?? null,
        patient_code: selectedPatient.patient_code,
        doctor_id: doctor.doctor_id,
        kiosk_session_id:
          selectedAppointment?.kiosk_session_id ??
          selectedPatient.latest_kiosk_session_id ??
          null,
        consultation_notes: consultationForm.consultation_notes,
        diagnosis: consultationForm.diagnosis,
        items: normalizedItems,
      });

      setSuccess("Consultation completed and prescription sent to inventory.");
      clearSelectedPatientCode();
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to complete consultation and send prescription.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="portal-page">
      <div className="portal-header">
        <h1 className="portal-title">Consultation</h1>
      </div>

      {error && <div className="portal-alert-error">{error}</div>}
      {success && <div className="portal-alert-success">{success}</div>}

      {loading ? (
        <div className="portal-empty">Loading consultation data...</div>
      ) : !selectedPatient ? (
        <div className="portal-empty">
          Select a patient from Today's Patients first.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="portal-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-bold text-slate-900 md:text-[32px]">
                  {selectedPatient.full_name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Patient ID: {selectedPatient.patient_code}
                </p>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Queue:</span>{" "}
                  {selectedAppointment?.queue_number
                    ? `#${selectedAppointment.queue_number}`
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Reason:</span>{" "}
                  {formatValue(selectedAppointment?.reason)}
                </p>
              </div>
            </div>
          </section>

          <form onSubmit={handleCompleteConsultation} className="portal-card space-y-5">
            <h2 className="portal-section-title">Consultation Notes</h2>

            <label className="space-y-2">
              <span className="text-base font-semibold text-slate-800">Notes</span>
              <textarea
                name="consultation_notes"
                value={consultationForm.consultation_notes}
                onChange={handleConsultationChange}
                className="portal-textarea text-base"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-base font-semibold text-slate-800">Diagnosis</span>
              <textarea
                name="diagnosis"
                value={consultationForm.diagnosis}
                onChange={handleConsultationChange}
                className="portal-textarea text-base"
                required
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <h2 className="portal-section-title">Prescription</h2>
              <button
                type="button"
                onClick={addPrescriptionItem}
                className="portal-button-secondary"
              >
                Add Medicine
              </button>
            </div>

            {prescriptionItems.map((item, index) => (
              <div key={`prescription-item-${index}`} className="portal-panel">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_140px]">
                  <label className="space-y-2">
                    <span className="text-base font-semibold text-slate-800">Medicine</span>
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
                        updatePrescriptionItem(index, "dosage_instructions", e.target.value)
                      }
                      className="portal-input text-base"
                      placeholder="e.g. 1 tablet after meals"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-base font-semibold text-slate-800">Quantity</span>
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
                    className="mt-4 text-sm font-semibold text-red-500 transition hover:text-red-600"
                  >
                    Remove Medicine
                  </button>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="portal-button portal-button-block"
            >
              {submitting ? "Submitting..." : "Complete Consultation"}
            </button>

          </form>
        </div>
      )}
    </section>
  );
}
