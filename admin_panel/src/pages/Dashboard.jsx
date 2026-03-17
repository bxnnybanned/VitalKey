import { useEffect, useState } from "react";

import { getDashboardSummary } from "../api/dashboardApi";

const summaryCards = [
  {
    key: "total_patients",
    title: "Total Patients",
    accent: "from-blue-500/15 to-blue-100/40 text-blue-700",
  },
  {
    key: "total_doctors",
    title: "Total Doctors",
    accent: "from-emerald-500/15 to-emerald-100/40 text-emerald-700",
  },
  {
    key: "total_appointments",
    title: "Total Appointments",
    accent: "from-cyan-500/15 to-cyan-100/40 text-cyan-700",
  },
  {
    key: "low_stock_medicines",
    title: "Low Stock Medicines",
    accent: "from-rose-500/15 to-rose-100/40 text-rose-700",
  },
  {
    key: "total_pending_prescriptions",
    title: "Pending Prescriptions",
    accent: "from-amber-500/15 to-amber-100/40 text-amber-700",
  },
  {
    key: "total_released_prescriptions",
    title: "Released Prescriptions",
    accent: "from-violet-500/15 to-violet-100/40 text-violet-700",
  },
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load dashboard summary.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">
          Monitor the overall activity of VitalKey, from patient records and
          appointment demand to prescription handling and medicine stock alerts.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className={`admin-card-strong bg-gradient-to-br ${card.accent}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {card.title}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {loading ? "..." : summary?.[card.key] ?? 0}
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Live summary pulled from the shared health center database.
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
