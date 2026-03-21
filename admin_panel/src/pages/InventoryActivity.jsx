import { useEffect, useMemo, useState } from "react";
import { fetchInventoryActivity } from "../api/inventoryActivityApi";

const ACTION_OPTIONS = [
  "",
  "Create Medicine",
  "Update Medicine",
  "Delete Medicine",
  "Prepare Prescription",
  "Ready for Pickup",
  "Release Prescription",
  "Medicine Request: Pending",
  "Medicine Request: Ready for Pickup",
  "Medicine Request: Released",
  "Medicine Request: Rejected",
];

export default function InventoryActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchInventoryActivity({
        search: search.trim() || undefined,
        action_type: actionType || undefined,
      });
      setActivities(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load inventory activity history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [actionType]);

  const summary = useMemo(() => {
    const dispensingActions = activities.filter((item) =>
      ["Prepare Prescription", "Ready for Pickup", "Release Prescription"].includes(
        item.action_type,
      ),
    ).length;
    const medicineCrudActions = activities.filter((item) =>
      ["Create Medicine", "Update Medicine", "Delete Medicine"].includes(
        item.action_type,
      ),
    ).length;
    const requestActions = activities.filter((item) =>
      item.reference_type === "Medicine Request",
    ).length;

    return {
      total: activities.length,
      dispensingActions,
      medicineCrudActions,
      requestActions,
    };
  }, [activities]);

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Inventory Activity</h1>
        <p className="admin-subtitle">
          Trace medicine keeper actions for medicine changes, dispensing, and patient requests.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="admin-card-strong">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Total Logs
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="admin-card-strong">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Medicine CRUD
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.medicineCrudActions}
          </p>
        </div>
        <div className="admin-card-strong">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Dispensing
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.dispensingActions}
          </p>
        </div>
        <div className="admin-card-strong">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Patient Requests
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.requestActions}
          </p>
        </div>
      </section>

      <section className="admin-card-strong mt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px_160px]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by keeper, medicine, prescription, request, or details"
            className="admin-input"
          />
          <select
            value={actionType}
            onChange={(event) => setActionType(event.target.value)}
            className="admin-input"
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All Actions"}
              </option>
            ))}
          </select>
          <button type="button" onClick={loadActivity} className="admin-button">
            Refresh
          </button>
        </div>
      </section>

      <section className="admin-card-strong mt-6">
        <h2 className="admin-card-title mb-4">Activity History</h2>

        {loading ? (
          <p className="text-slate-500">Loading inventory activity...</p>
        ) : activities.length === 0 ? (
          <p className="text-slate-500">No inventory activity found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Medicine Keeper</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((item) => (
                  <tr key={item.activity_id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{item.created_at}</td>
                    <td className="p-3">{item.keeper_name}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                        {item.action_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1 text-sm text-slate-600">
                        <div>{item.reference_type}</div>
                        {item.medicine_name && <div>{item.medicine_name}</div>}
                        {item.prescription_code && <div>{item.prescription_code}</div>}
                        {item.request_code && <div>{item.request_code}</div>}
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{item.details}</td>
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
