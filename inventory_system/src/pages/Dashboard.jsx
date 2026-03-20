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

function buildPrescriptionPrintMarkup(prescription, keeperName) {
  const releasedAt = new Date().toLocaleString();
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
              <h1>Prescription Release Slip</h1>
              <p class="muted">Barangay Abangan Norte Health Center</p>
              <p class="muted">VitalKey Inventory System</p>
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
            <div class="sign">Medicine Keeper Signature</div>
            <div class="sign">Patient Signature</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function printPrescriptionSlip(prescription, keeperName) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildPrescriptionPrintMarkup(prescription, keeperName));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
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
  const statusClass =
    status === "Released"
      ? "inventory-chip-done"
      : status === "Ready for Pickup"
        ? "inventory-chip-primary"
        : status === "Prepared"
          ? "inventory-chip-warning"
          : "inventory-chip-neutral";

  return <span className={statusClass}>{status}</span>;
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
      await updatePrescriptionStatus(prescriptionId, {
        status,
        keeper_id: keeper.keeper_id,
      });
      setSuccess(`Prescription marked as ${status}.`);
      if (status === "Released" && selectedPrescription) {
        printPrescriptionSlip(
          selectedPrescription,
          keeper?.full_name || "Medicine Keeper",
        );
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
    (item) => item.status !== "Released",
  );

  return (
    <section className="inventory-page">
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

                        <div className="mt-4 flex flex-wrap gap-3">
                          {prescription.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "Prepared",
                                )
                              }
                              disabled={busyPrescriptionId === prescription.prescription_id}
                              className="inventory-button"
                            >
                              Prepare
                            </button>
                          )}

                          {prescription.status === "Prepared" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "Ready for Pickup",
                                )
                              }
                              disabled={busyPrescriptionId === prescription.prescription_id}
                              className="inventory-button"
                            >
                              Ready for Pickup
                            </button>
                          )}

                          {prescription.status === "Ready for Pickup" && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePrescriptionAction(
                                  prescription.prescription_id,
                                  "Released",
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
