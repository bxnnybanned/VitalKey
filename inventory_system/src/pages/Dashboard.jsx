import { useEffect, useMemo, useState } from "react";
import {
  fetchInventoryAlerts,
  fetchInventoryPrescriptions,
  fetchInventorySummary,
  updatePrescriptionStatus,
} from "../api/inventoryApi";

const summaryCards = [
  { key: "pending_prescriptions", label: "Pending Prescriptions" },
  { key: "prepared_prescriptions", label: "Prepared" },
  { key: "ready_for_pickup", label: "Ready for Pickup" },
  { key: "released_today", label: "Released Today" },
];

function normalizePrescriptionStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "ready for pickup") return "ready";
  return value;
}

function getPrescriptionStatusLabel(status) {
  const normalized = normalizePrescriptionStatus(status);
  if (normalized === "pending") return "Pending";
  if (normalized === "prepared") return "Prepared";
  if (normalized === "ready") return "Ready for Pickup";
  if (normalized === "released") return "Released";
  return status || "-";
}

function buildPrescriptionPrintMarkup(prescription, keeperName) {
  const releasedAt = new Date().toLocaleString();
  const healthSummary = prescription.health_summary;
  const consultation = prescription.consultation;
  const doctorSpecialization = prescription.doctor_specialization || "General Physician";
  const itemsMarkup = prescription.items
    .map(
      (item) => `
        <tr>
          <td>${item.medicine_name}</td>
          <td>${item.dosage_instructions || "-"}</td>
          <td>${item.quantity}</td>
          <td>${item.unit || "-"}</td>
        </tr>
      `,
    )
    .join("");
  const vitalsMarkup = healthSummary
    ? `
      <div class="vitals-grid">
        <div class="meta-card"><strong>Temperature</strong>${healthSummary.temperature_c ?? "-"} C</div>
        <div class="meta-card"><strong>Blood Pressure</strong>${healthSummary.systolic_bp ?? "-"}/${healthSummary.diastolic_bp ?? "-"} mmHg</div>
        <div class="meta-card"><strong>Height</strong>${healthSummary.height_cm ?? "-"} cm</div>
        <div class="meta-card"><strong>Weight</strong>${healthSummary.weight_kg ?? "-"} kg</div>
        <div class="meta-card"><strong>SpO2</strong>${healthSummary.oxygen_saturation ?? "-"} %</div>
        <div class="meta-card"><strong>Heart Rate</strong>${healthSummary.heart_rate ?? "-"} bpm</div>
      </div>
      <p class="muted" style="margin-top:10px;">Recorded at: ${healthSummary.recorded_at || "-"}</p>
    `
    : `<div class="note-box"><strong>Health Summary</strong>No kiosk health summary linked to this prescription.</div>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${prescription.prescription_code}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            margin: 28px;
            background: #f8fafc;
          }
          .sheet {
            max-width: 820px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            padding: 30px;
            background: #ffffff;
          }
          .topbar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 18px;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 16px;
          }
          .brand h1 {
            font-size: 16px;
            margin: 0 0 6px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #1d4ed8;
          }
          .brand h2 {
            font-size: 28px;
            margin: 0 0 4px;
            letter-spacing: 0.01em;
          }
          .brand p {
            margin: 0;
          }
          .code-box {
            min-width: 190px;
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            border-radius: 14px;
            padding: 12px 14px;
            text-align: right;
          }
          .code-box strong {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #1d4ed8;
            margin-bottom: 6px;
          }
          .code-box span {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .muted {
            color: #475569;
            font-size: 14px;
          }
          .section-title {
            margin: 26px 0 12px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #1e3a8a;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin: 0;
          }
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .meta-card {
            border: 1px solid #dbeafe;
            background: linear-gradient(135deg, #eff6ff, #f8fafc);
            border-radius: 12px;
            padding: 12px 14px;
          }
          .meta-card strong {
            display: block;
            font-size: 12px;
            color: #475569;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
            vertical-align: top;
            font-size: 14px;
          }
          th {
            background: linear-gradient(135deg, #eff6ff, #ecfeff);
          }
          .footer {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            gap: 18px;
          }
          .sign {
            width: 48%;
            border-top: 1px solid #94a3b8;
            padding-top: 10px;
            font-size: 14px;
          }
          .note-box {
            margin-top: 18px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
            padding: 12px 14px;
          }
          .note-box strong {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #475569;
          }
          .two-column {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          @media print {
            body {
              margin: 0;
              background: #fff;
            }
            .sheet {
              border: none;
              border-radius: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="topbar">
            <div class="brand">
              <h1>VitalKey Inventory System</h1>
              <h2>Prescription Release Slip</h2>
              <p class="muted">Barangay Abangan Norte Health Center</p>
            </div>
            <div class="code-box">
              <strong>Prescription Code</strong>
              <span>${prescription.prescription_code}</span>
            </div>
          </div>

          <div class="section-title">Release Details</div>
          <div class="meta">
            <div class="meta-card">
              <strong>Patient</strong>
              ${prescription.patient_name}<br />
              ${prescription.patient_id}
            </div>
            <div class="meta-card">
              <strong>Doctor</strong>
              ${prescription.doctor_name}
            </div>
            <div class="meta-card">
              <strong>Released By</strong>
              ${keeperName || "-"}
            </div>
            <div class="meta-card">
              <strong>Released At</strong>
              ${releasedAt}
            </div>
          </div>

          <div class="section-title">Health Summary</div>
          ${vitalsMarkup}

          <div class="section-title">Consultation</div>
          <div class="two-column">
            <div class="note-box">
              <strong>Diagnosis</strong>
              ${consultation?.diagnosis || "-"}
            </div>
            <div class="note-box">
              <strong>Consultation Notes</strong>
              ${consultation?.consultation_notes || "-"}
            </div>
          </div>

          <div class="section-title">Medicines</div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${itemsMarkup}
            </tbody>
          </table>

          <div class="note-box">
            <strong>Note</strong>
            This release slip confirms that the medicines listed above were prepared and released by the medicine keeper based on the doctor's prescription.
          </div>

          <div class="footer">
            <div class="sign">
              Dr. ${prescription.doctor_name || "-"}<br />
              ${doctorSpecialization}
            </div>
          </div>

        </div>
      </body>
    </html>
  `;
}

function openPrintPreview(prescription, keeperName) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildPrescriptionPrintMarkup(prescription, keeperName));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}

function ReleasePreviewModal({ prescription, keeperName, onClose }) {
  if (!prescription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              VitalKey Inventory System
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Prescription Release Preview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the summary before printing.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Patient
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{prescription.patient_name}</p>
            <p className="mt-1 text-sm text-slate-500">{prescription.patient_id}</p>
          </div>
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Doctor
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{prescription.doctor_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {prescription.doctor_specialization || "General Physician"}
            </p>
          </div>
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Released By
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">{keeperName}</p>
          </div>
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Prescription Code
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {prescription.prescription_code}
            </p>
          </div>
        </div>

        {prescription.health_summary && (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="inventory-list-card"><strong>Temperature</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.temperature_c ?? "-"} C</p></div>
            <div className="inventory-list-card"><strong>Blood Pressure</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.systolic_bp ?? "-"}/{prescription.health_summary.diastolic_bp ?? "-"} mmHg</p></div>
            <div className="inventory-list-card"><strong>Height</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.height_cm ?? "-"} cm</p></div>
            <div className="inventory-list-card"><strong>Weight</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.weight_kg ?? "-"} kg</p></div>
            <div className="inventory-list-card"><strong>SpO2</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.oxygen_saturation ?? "-"} %</p></div>
            <div className="inventory-list-card"><strong>Heart Rate</strong><p className="mt-2 text-lg font-bold">{prescription.health_summary.heart_rate ?? "-"} bpm</p></div>
          </div>
        )}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Diagnosis
            </p>
            <p className="mt-2 text-slate-700">{prescription.consultation?.diagnosis || "-"}</p>
          </div>
          <div className="inventory-list-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Consultation Notes
            </p>
            <p className="mt-2 text-slate-700">{prescription.consultation?.consultation_notes || "-"}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="inventory-table min-w-[620px]">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Qty</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item) => (
                <tr key={item.prescription_item_id}>
                  <td>{item.medicine_name}</td>
                  <td>{item.dosage_instructions}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inventory-button-secondary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => openPrintPreview(prescription, keeperName)}
            className="inventory-button"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="inventory-stat-card">
      <p className="inventory-stat-label">{label}</p>
      <p className="inventory-stat-value">{value ?? 0}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizePrescriptionStatus(status);
  const statusClass =
    normalized === "released"
      ? "inventory-chip-done"
      : normalized === "ready"
        ? "inventory-chip-primary"
        : normalized === "prepared"
          ? "inventory-chip-warning"
          : "inventory-chip-neutral";

  return <span className={statusClass}>{getPrescriptionStatusLabel(status)}</span>;
}

export default function Dashboard() {
  const keeper = useMemo(
    () => JSON.parse(localStorage.getItem("inventory_keeper") || "null"),
    [],
  );

  const [summary, setSummary] = useState({});
  const [prescriptions, setPrescriptions] = useState([]);
  const [alerts, setAlerts] = useState({ low_stock: [], expiring: [] });
  const [loading, setLoading] = useState(true);
  const [busyPrescriptionId, setBusyPrescriptionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewPrescription, setPreviewPrescription] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryData, prescriptionData, alertData] =
        await Promise.all([
          fetchInventorySummary(),
          fetchInventoryPrescriptions(),
          fetchInventoryAlerts(),
        ]);

      setSummary(summaryData);
      setPrescriptions(prescriptionData);
      setAlerts(alertData);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrescriptionAction = async (prescriptionId, status) => {
    try {
      setBusyPrescriptionId(prescriptionId);
      setError("");
      setSuccess("");
      const selectedPrescription = prescriptions.find(
        (item) => item.prescription_id === prescriptionId,
      );
      const normalizedStatus = normalizePrescriptionStatus(status);
      await updatePrescriptionStatus(prescriptionId, {
        status: normalizedStatus,
        keeper_id: keeper.keeper_id,
      });
      setSuccess(`Prescription marked as ${getPrescriptionStatusLabel(normalizedStatus)}.`);
      if (normalizedStatus === "released" && selectedPrescription) {
        setPreviewPrescription({
          ...selectedPrescription,
          status: normalizedStatus,
        });
      }
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to update prescription status.",
      );
    } finally {
      setBusyPrescriptionId(null);
    }
  };

  const actionablePrescriptions = prescriptions.filter(
    (item) => normalizePrescriptionStatus(item.status) !== "released",
  );

  return (
    <section className="inventory-page">
      <ReleasePreviewModal
        prescription={previewPrescription}
        keeperName={keeper?.full_name || "Medicine Keeper"}
        onClose={() => setPreviewPrescription(null)}
      />
      <div className="inventory-header">
        <h1 className="inventory-title">Dashboard</h1>
        <p className="inventory-subtitle">
          Welcome, {keeper?.full_name || "Medicine Keeper"}.
        </p>
      </div>

      {error && <div className="inventory-alert-error">{error}</div>}
      {success && <div className="inventory-alert-success">{success}</div>}

      {loading ? (
        <div className="inventory-empty">Loading inventory data...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <StatCard key={card.key} label={card.label} value={summary[card.key]} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="space-y-6">
              <section className="inventory-card">
                <div className="inventory-section-head">
                  <div>
                    <h2 className="inventory-section-title">Prescription Queue</h2>
                    <p className="inventory-section-note">
                      Prepare, mark ready, then release medicines.
                    </p>
                  </div>
                  <span className="inventory-count">
                    {actionablePrescriptions.length}
                  </span>
                </div>

                {actionablePrescriptions.length === 0 ? (
                  <div className="inventory-empty mt-4">
                    No active prescriptions in queue.
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {actionablePrescriptions.map((prescription) => (
                      <div
                        key={prescription.prescription_id}
                        className="inventory-list-card"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {prescription.prescription_code}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              Patient: {prescription.patient_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              Doctor: {prescription.doctor_name}
                            </p>
                          </div>
                          <StatusBadge status={prescription.status} />
                        </div>

                        <div className="mt-4 overflow-x-auto">
                          <table className="inventory-table min-w-[620px]">
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Qty</th>
                                <th>Stock</th>
                                <th>Available</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prescription.items.map((item) => (
                                <tr key={item.prescription_item_id}>
                                  <td>{item.medicine_name}</td>
                                  <td>{item.dosage_instructions}</td>
                                  <td>{item.quantity}</td>
                                  <td>{item.stock_quantity}</td>
                                  <td>
                                    <span
                                      className={
                                        item.is_available
                                          ? "inventory-status-ok"
                                          : "inventory-status-bad"
                                      }
                                    >
                                      {item.is_available ? "Yes" : "No"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {prescription.health_summary && (
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="inventory-list-card">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Temperature
                              </p>
                              <p className="mt-2 text-lg font-bold text-slate-900">
                                {prescription.health_summary.temperature_c ?? "-"} C
                              </p>
                            </div>
                            <div className="inventory-list-card">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Blood Pressure
                              </p>
                              <p className="mt-2 text-lg font-bold text-slate-900">
                                {prescription.health_summary.systolic_bp ?? "-"}
                                /
                                {prescription.health_summary.diastolic_bp ?? "-"} mmHg
                              </p>
                            </div>
                            <div className="inventory-list-card">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Height / Weight
                              </p>
                              <p className="mt-2 text-lg font-bold text-slate-900">
                                {prescription.health_summary.height_cm ?? "-"} cm /{" "}
                                {prescription.health_summary.weight_kg ?? "-"} kg
                              </p>
                            </div>
                            <div className="inventory-list-card">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                SpO2
                              </p>
                              <p className="mt-2 text-lg font-bold text-slate-900">
                                {prescription.health_summary.oxygen_saturation ?? "-"} %
                              </p>
                            </div>
                            <div className="inventory-list-card">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Heart Rate
                              </p>
                              <p className="mt-2 text-lg font-bold text-slate-900">
                                {prescription.health_summary.heart_rate ?? "-"} bpm
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3">
                          {normalizePrescriptionStatus(prescription.status) === "pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "prepared",
                                )
                              }
                              disabled={busyPrescriptionId === prescription.prescription_id}
                              className="inventory-button"
                            >
                              Prepare
                            </button>
                          )}

                          {normalizePrescriptionStatus(prescription.status) === "prepared" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "ready",
                                )
                              }
                              disabled={busyPrescriptionId === prescription.prescription_id}
                              className="inventory-button"
                            >
                              Ready for Pickup
                            </button>
                          )}

                          {normalizePrescriptionStatus(prescription.status) === "ready" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "released",
                                )
                              }
                              disabled={busyPrescriptionId === prescription.prescription_id}
                              className="inventory-button"
                            >
                              Release Medicine
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="inventory-card">
                <div className="inventory-section-head">
                  <div>
                    <h2 className="inventory-section-title">Low Stock Alerts</h2>
                    <p className="inventory-section-note">
                      Medicines that need restocking soon.
                    </p>
                  </div>
                  <span className="inventory-count">{alerts.low_stock?.length || 0}</span>
                </div>

                {alerts.low_stock?.length ? (
                  <div className="mt-4 space-y-3">
                    {alerts.low_stock.map((medicine) => (
                      <div
                        key={medicine.medicine_id}
                        className="inventory-alert-card inventory-alert-low"
                      >
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {medicine.stock_quantity} {medicine.unit || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inventory-empty mt-4">No low stock alerts.</div>
                )}
              </section>

              <section className="inventory-card">
                <div className="inventory-section-head">
                  <div>
                    <h2 className="inventory-section-title">Expiring Medicines</h2>
                    <p className="inventory-section-note">
                      Medicines that are close to expiration.
                    </p>
                  </div>
                  <span className="inventory-count">{alerts.expiring?.length || 0}</span>
                </div>

                {alerts.expiring?.length ? (
                  <div className="mt-4 space-y-3">
                    {alerts.expiring.map((medicine) => (
                      <div
                        key={medicine.medicine_id}
                        className="inventory-alert-card inventory-alert-expiring"
                      >
                        <p className="font-semibold text-slate-900">{medicine.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Expires: {medicine.expiration_date}
                        </p>
                        <p className="text-sm text-slate-600">
                          {medicine.stock_quantity} {medicine.unit || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inventory-empty mt-4">No expiring medicines.</div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
