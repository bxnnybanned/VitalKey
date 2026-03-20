import { useEffect, useMemo, useState } from "react";
import {
  fetchInventoryRequests,
  updateInventoryRequestStatus,
} from "../api/inventoryApi";

function StatusBadge({ status }) {
  const statusClass =
    status === "Released"
      ? "inventory-chip-done"
      : status === "Ready for Pickup"
        ? "inventory-chip-primary"
        : status === "Rejected"
          ? "inventory-status-bad"
          : "inventory-chip-neutral";

  return <span className={statusClass}>{status}</span>;
}

export default function PatientRequests() {
  const keeper = useMemo(
    () => JSON.parse(localStorage.getItem("inventory_keeper") || "null"),
    [],
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchInventoryRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load patient requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRequestAction = async (requestId, status) => {
    try {
      setBusyRequestId(requestId);
      setError("");
      setSuccess("");
      await updateInventoryRequestStatus(requestId, {
        status,
        keeper_id: keeper.keeper_id,
      });
      setSuccess(`Medicine request marked as ${status}.`);
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to update medicine request.",
      );
    } finally {
      setBusyRequestId(null);
    }
  };

  const activeRequests = requests.filter((request) => request.status !== "Released");
  const releasedRequests = requests.filter((request) => request.status === "Released");

  return (
    <section className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">Patient Requests</h1>
        <p className="inventory-subtitle">
          Review medicine requests submitted by patients from the mobile app.
        </p>
      </div>

      {error && <div className="inventory-alert-error">{error}</div>}
      {success && <div className="inventory-alert-success">{success}</div>}

      {loading ? (
        <div className="inventory-empty">Loading patient requests...</div>
      ) : (
        <div className="space-y-6">
          <section className="inventory-card">
            <div className="inventory-section-head">
              <div>
                <h2 className="inventory-section-title">Active Requests</h2>
                <p className="inventory-section-note">
                  Process requests that are still pending or ready for pickup.
                </p>
              </div>
              <span className="inventory-count">{activeRequests.length}</span>
            </div>

            {activeRequests.length === 0 ? (
              <div className="inventory-empty mt-4">No active patient requests.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {activeRequests.map((request) => (
                  <div key={request.request_id} className="inventory-panel">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {request.request_code}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Patient: {request.patient_name} ({request.patient_id})
                        </p>
                        <p className="text-sm text-slate-500">
                          Medicine: {request.medicine_name}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="inventory-mini-card">
                        <span>Quantity</span>
                        <strong>{request.quantity}</strong>
                      </div>
                      <div className="inventory-mini-card">
                        <span>Stock</span>
                        <strong>{request.stock_quantity}</strong>
                      </div>
                      <div className="inventory-mini-card md:col-span-2">
                        <span>Reason</span>
                        <strong className="text-sm">{request.reason || "-"}</strong>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {request.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestAction(request.request_id, "Ready for Pickup")
                            }
                            disabled={busyRequestId === request.request_id}
                            className="inventory-button"
                          >
                            Ready for Pickup
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestAction(request.request_id, "Rejected")
                            }
                            disabled={busyRequestId === request.request_id}
                            className="inventory-button-secondary"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {request.status === "Ready for Pickup" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRequestAction(request.request_id, "Released")
                          }
                          disabled={busyRequestId === request.request_id}
                          className="inventory-button"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="inventory-card">
            <div className="inventory-section-head">
              <div>
                <h2 className="inventory-section-title">Released Requests</h2>
                <p className="inventory-section-note">
                  Completed medicine requests for reference.
                </p>
              </div>
              <span className="inventory-count">{releasedRequests.length}</span>
            </div>

            {releasedRequests.length === 0 ? (
              <div className="inventory-empty mt-4">No released requests yet.</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="inventory-table min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Request Code</th>
                      <th>Patient</th>
                      <th>Medicine</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Processed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releasedRequests.map((request) => (
                      <tr key={request.request_id}>
                        <td>{request.request_code}</td>
                        <td>{request.patient_name}</td>
                        <td>{request.medicine_name}</td>
                        <td>{request.quantity}</td>
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        <td>{request.processed_at || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
