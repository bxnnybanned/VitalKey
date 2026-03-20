import { useEffect, useMemo, useState } from "react";

import {
  getDailyPatientVisitsReport,
  getMedicineUsageReport,
  getMonthlyPatientVisitsReport,
  getReportsSummary,
  getWeeklyPatientVisitsReport,
} from "../api/reportsApi";

const VISIT_RANGE_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const PIE_COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatPeriodLabel(label, range) {
  if (!label) return "-";
  if (range === "weekly") return `Week ${label.replace(/^.*-W/, "")}`;
  if (range === "monthly") {
    const [year, month] = label.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
  return new Date(label).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getRangeLabel(range) {
  if (range === "weekly") return "week";
  if (range === "monthly") return "month";
  return "day";
}

function StatCard({ title, value, note, accent }) {
  return (
    <article className="admin-card-strong">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <h2 className={`mt-4 text-4xl font-bold tracking-tight ${accent}`}>{value}</h2>
      <p className="mt-3 text-sm text-slate-500">{note}</p>
    </article>
  );
}

function BreakdownDonutChart({ items, range, valueKey, valueLabel, emptyLabel }) {
  if (!items.length) return <div className="admin-empty">{emptyLabel}</div>;

  const chartItems = items.slice(0, 6);
  const total = chartItems.reduce((sum, item) => sum + (item[valueKey] || 0), 0) || 1;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offsetTracker = 0;

  const segments = chartItems.map((item, index) => {
    const value = item[valueKey] || 0;
    const length = (value / total) * circumference;
    const segment = {
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length],
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: -offsetTracker,
      percentage: Math.round((value / total) * 100),
      formattedLabel: formatPeriodLabel(item.label, range),
    };
    offsetTracker += length;
    return segment;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-center">
      <div className="mx-auto flex flex-col items-center">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <g transform="rotate(-90 110 110)">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="22" />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
              />
            ))}
          </g>
          <text x="110" y="103" textAnchor="middle" fontSize="12" fill="#64748b">
            Total
          </text>
          <text x="110" y="124" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="admin-list-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div>
                  <p className="font-semibold text-slate-900">{segment.formattedLabel}</p>
                  <p className="text-sm text-slate-500">
                    {segment.percentage}% of total {valueLabel}
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{segment[valueKey]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedUsageCards({ items }) {
  if (!items.length) return <div className="admin-empty">No medicine usage data found.</div>;

  const maxValue = Math.max(...items.map((item) => item.total_released || 0), 1);

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item, index) => {
        const width = Math.max(((item.total_released || 0) / maxValue) * 100, 8);

        return (
          <div key={item.medicine_name} className="admin-list-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.medicine_name}</p>
                  <p className="text-sm text-slate-500">dispensed medicine</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{item.total_released}</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ items }) {
  if (!items.length) return <div className="admin-empty">No medicine usage data found.</div>;

  const chartItems = items.slice(0, 5);
  const total = chartItems.reduce((sum, item) => sum + (item.total_released || 0), 0) || 1;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let offsetTracker = 0;

  const segments = chartItems.map((item, index) => {
    const value = item.total_released || 0;
    const length = (value / total) * circumference;
    const segment = {
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length],
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: -offsetTracker,
      percentage: Math.round((value / total) * 100),
    };
    offsetTracker += length;
    return segment;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-center">
      <div className="mx-auto flex flex-col items-center">
        <svg viewBox="0 0 220 220" width="220" height="220">
          <g transform="rotate(-90 110 110)">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="22" />
            {segments.map((segment) => (
              <circle
                key={segment.medicine_name}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={segment.strokeDashoffset}
              />
            ))}
          </g>
          <text x="110" y="103" textAnchor="middle" fontSize="12" fill="#64748b">
            Total Released
          </text>
          <text x="110" y="124" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.medicine_name} className="admin-list-card">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <div>
                  <p className="font-semibold text-slate-900">{segment.medicine_name}</p>
                  <p className="text-sm text-slate-500">{segment.percentage}% of total releases</p>
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{segment.total_released}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ label, value, note }) {
  return (
    <div className="admin-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [dailyVisits, setDailyVisits] = useState([]);
  const [weeklyVisits, setWeeklyVisits] = useState([]);
  const [monthlyVisits, setMonthlyVisits] = useState([]);
  const [medicineUsage, setMedicineUsage] = useState([]);
  const [visitRange, setVisitRange] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        const [summaryData, dailyData, weeklyData, monthlyData, medicineData] = await Promise.all([
          getReportsSummary(),
          getDailyPatientVisitsReport(),
          getWeeklyPatientVisitsReport(),
          getMonthlyPatientVisitsReport(),
          getMedicineUsageReport(),
        ]);
        setSummary(summaryData);
        setDailyVisits(dailyData);
        setWeeklyVisits(weeklyData);
        setMonthlyVisits(monthlyData);
        setMedicineUsage(medicineData);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const selectedVisitData = useMemo(() => {
    if (visitRange === "weekly") return weeklyVisits;
    if (visitRange === "monthly") return monthlyVisits;
    return dailyVisits;
  }, [dailyVisits, weeklyVisits, monthlyVisits, visitRange]);

  const visitInsights = useMemo(() => {
    if (!selectedVisitData.length) {
      return { busiestLabel: "-", busiestValue: 0, averageValue: 0 };
    }
    const total = selectedVisitData.reduce((sum, item) => sum + (item.total_visits || 0), 0);
    const busiest = selectedVisitData.reduce((current, item) =>
      (item.total_visits || 0) > (current.total_visits || 0) ? item : current,
    );
    return {
      busiestLabel: formatPeriodLabel(busiest.label, visitRange),
      busiestValue: busiest.total_visits || 0,
      averageValue: Math.round(total / selectedVisitData.length),
    };
  }, [selectedVisitData, visitRange]);

  const medicineInsights = useMemo(() => {
    if (!medicineUsage.length) return { topName: "N/A", share: 0 };
    const total = medicineUsage.reduce((sum, item) => sum + (item.total_released || 0), 0);
    const top = medicineUsage[0];
    return {
      topName: top.medicine_name,
      share: total ? Math.round(((top.total_released || 0) / total) * 100) : 0,
    };
  }, [medicineUsage]);

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Reports</h1>
        <p className="admin-subtitle">
          Visual summaries of patient visits and medicine dispensing with clearer statistics.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Patient Visits"
              value={summary?.total_patient_visits ?? 0}
              note="All recorded appointments in the system."
              accent="text-blue-700"
            />
            <StatCard
              title="Total Medicines Dispensed"
              value={summary?.total_medicines_dispensed ?? 0}
              note="Total quantity released from inventory."
              accent="text-emerald-700"
            />
            <StatCard
              title="Dispensing Transactions"
              value={summary?.total_dispensing_transactions ?? 0}
              note="Completed release actions recorded in history."
              accent="text-amber-700"
            />
            <StatCard
              title="Most Dispensed Medicine"
              value={summary?.most_dispensed_medicine?.medicine_name || "N/A"}
              note={`${summary?.most_dispensed_medicine?.total_released ?? 0} total released`}
              accent="text-cyan-700 text-2xl md:text-3xl"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <div className="admin-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="admin-card-title">Patient Visit Trend</h2>
                  <p className="admin-card-subtitle">
                    {visitRange === "daily"
                      ? "Day-by-day patient visits."
                      : visitRange === "weekly"
                        ? "Week-by-week patient visits."
                        : "Month-by-month patient visits."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {VISIT_RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisitRange(option.value)}
                      className={
                        visitRange === option.value
                          ? "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                          : "rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <BreakdownDonutChart
                  items={selectedVisitData}
                  range={visitRange}
                  valueKey="total_visits"
                  valueLabel="visits"
                  emptyLabel="No patient visit data found."
                />
              </div>
            </div>

            <div className="space-y-4">
              <InsightCard
                label="Busiest Period"
                value={visitInsights.busiestLabel}
                note={`${visitInsights.busiestValue} visits in the highest period`}
              />
              <InsightCard
                label="Average Visits"
                value={visitInsights.averageValue}
                note={`Average visits per ${getRangeLabel(visitRange)}`}
              />
              <InsightCard
                label="Top Medicine Share"
                value={`${medicineInsights.share}%`}
                note={`${medicineInsights.topName} makes up the biggest share of released medicines`}
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="admin-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="admin-card-title">Medicine Distribution</h2>
                  <p className="admin-card-subtitle">
                    Share of the most dispensed medicines.
                  </p>
                </div>
                <span className="admin-badge bg-emerald-100 text-emerald-700">
                  Top 5
                </span>
              </div>
              <div className="mt-5">
                <DonutChart items={medicineUsage} />
              </div>
            </div>

            <div className="admin-card">
              <h2 className="admin-card-title">Medicine Usage Table</h2>
              <p className="admin-card-subtitle">Full ranked list of dispensed medicines.</p>
              <div className="mt-5">
                <RankedUsageCards items={medicineUsage} />
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
