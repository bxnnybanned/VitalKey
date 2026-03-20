import { useEffect, useMemo, useState } from "react";
import {
  fetchInventoryDailyDispensing,
  fetchInventoryMedicineUsage,
  fetchInventoryReportSummary,
} from "../api/inventoryApi";

const CHART_COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const RANGE_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

function formatDateLabel(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatPeriodLabel(value, range) {
  if (!value) return "-";
  if (range === "weekly") {
    return `Week ${value.replace(/^.*-W/, "")}`;
  }
  if (range === "monthly") {
    const [year, month] = value.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function MetricCard({ title, value, note, accentClass }) {
  return (
    <div className="inventory-stat-card">
      <p className="inventory-stat-label">{title}</p>
      <p className={`inventory-stat-value ${accentClass}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function BreakdownDonutChart({ items, range, valueKey, valueLabel, emptyLabel }) {
  if (!items.length) return <div className="inventory-empty">{emptyLabel}</div>;

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
      color: CHART_COLORS[index % CHART_COLORS.length],
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: -offsetTracker,
      percentage: Math.round((value / total) * 100),
      formattedLabel: formatPeriodLabel(item.label, range),
    };
    offsetTracker += length;
    return segment;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-center">
      <div className="mx-auto">
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
          <div key={segment.label} className="inventory-list-card">
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

function DonutChart({ items }) {
  if (!items.length) return <div className="inventory-empty">No medicine usage data found.</div>;

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
      color: CHART_COLORS[index % CHART_COLORS.length],
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: -offsetTracker,
      percentage: Math.round((value / total) * 100),
    };
    offsetTracker += length;
    return segment;
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-center">
      <div className="mx-auto">
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
            Total
          </text>
          <text x="110" y="124" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.medicine_name} className="inventory-list-card">
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

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [dailyDispensing, setDailyDispensing] = useState([]);
  const [medicineUsage, setMedicineUsage] = useState([]);
  const [range, setRange] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");
        const [summaryData, dailyData, usageData] = await Promise.all([
          fetchInventoryReportSummary(),
          fetchInventoryDailyDispensing(),
          fetchInventoryMedicineUsage(),
        ]);
        setSummary(summaryData);
        setDailyDispensing(dailyData);
        setMedicineUsage(usageData);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const groupedDispensing = useMemo(() => {
    if (range === "daily") return dailyDispensing;

    const grouped = new Map();

    dailyDispensing.forEach((item) => {
      const rawDate = item.date || item.label;
      if (!rawDate) return;

      const currentDate = new Date(rawDate);
      if (Number.isNaN(currentDate.getTime())) return;

      let key = rawDate;
      if (range === "weekly") {
        const temp = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
        const dayNum = temp.getUTCDay() || 7;
        temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
        key = `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
      } else if (range === "monthly") {
        key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      }

      grouped.set(key, (grouped.get(key) || 0) + (item.total_released || 0));
    });

    return Array.from(grouped.entries()).map(([label, total_released]) => ({
      label,
      total_released,
    }));
  }, [dailyDispensing, range]);

  const insights = useMemo(() => {
    const busiestDay = groupedDispensing.length
      ? groupedDispensing.reduce((current, item) =>
          (item.total_released || 0) > (current.total_released || 0) ? item : current,
        )
      : null;
    const totalDailyReleased = groupedDispensing.reduce(
      (sum, item) => sum + (item.total_released || 0),
      0,
    );
    const topMedicine = medicineUsage[0] || null;
    const totalMedicineUsage = medicineUsage.reduce(
      (sum, item) => sum + (item.total_released || 0),
      0,
    );
    return {
      busiestDayLabel: busiestDay ? formatPeriodLabel(busiestDay.label, range) : "-",
      busiestDayValue: busiestDay?.total_released || 0,
      averageDailyReleased: groupedDispensing.length
        ? Math.round(totalDailyReleased / groupedDispensing.length)
        : 0,
      topMedicineName: topMedicine?.medicine_name || "N/A",
      topMedicineShare:
        totalMedicineUsage && topMedicine
          ? Math.round(((topMedicine.total_released || 0) / totalMedicineUsage) * 100)
          : 0,
    };
  }, [groupedDispensing, medicineUsage, range]);

  return (
    <section className="inventory-page">
      <div className="inventory-header">
        <h1 className="inventory-title">Reports</h1>
        <p className="inventory-subtitle">
          Visual summaries of dispensing activity with clearer charts and statistics.
        </p>
      </div>

      {error && <div className="inventory-alert-error">{error}</div>}

      {loading ? (
        <div className="inventory-empty">Loading reports...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Dispensed"
              value={summary?.total_medicines_dispensed ?? 0}
              note="Total quantity released across all transactions."
              accentClass="text-cyan-700"
            />
            <MetricCard
              title="Transactions"
              value={summary?.total_transactions ?? 0}
              note="Total release transactions recorded."
              accentClass="text-blue-700"
            />
            <MetricCard
              title="Released Prescriptions"
              value={summary?.released_prescriptions ?? 0}
              note="Prescriptions fully completed and released."
              accentClass="text-emerald-700"
            />
            <MetricCard
              title="Top Medicine"
              value={summary?.top_medicine?.medicine_name || "-"}
              note={`${summary?.top_medicine?.total_released ?? 0} units released`}
              accentClass="text-amber-700 text-2xl"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <section className="inventory-card">
              <div className="inventory-section-head">
                <div>
                  <h2 className="inventory-section-title">Dispensing Trend</h2>
                  <p className="inventory-section-note">
                    Compare released medicines by day, week, or month.
                  </p>
                </div>
                <span className="inventory-count">{groupedDispensing.length} periods</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={
                      range === option.value
                        ? "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <BreakdownDonutChart
                  items={groupedDispensing}
                  range={range}
                  valueKey="total_released"
                  valueLabel="released"
                  emptyLabel="No dispensing data found."
                />
              </div>
            </section>

            <div className="space-y-4">
              <div className="inventory-card">
                <p className="inventory-stat-label">Busiest Period</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{insights.busiestDayLabel}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {insights.busiestDayValue} medicines released in the busiest {range === "daily" ? "day" : range === "weekly" ? "week" : "month"}.
                </p>
              </div>
              <div className="inventory-card">
                <p className="inventory-stat-label">Average Per Period</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{insights.averageDailyReleased}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Average number of medicines released per {range === "daily" ? "day" : range === "weekly" ? "week" : "month"}.
                </p>
              </div>
              <div className="inventory-card">
                <p className="inventory-stat-label">Top Medicine Share</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{insights.topMedicineShare}%</p>
                <p className="mt-2 text-sm text-slate-500">
                  {insights.topMedicineName} has the largest share of released medicines.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="inventory-card">
              <div className="inventory-section-head">
                <div>
                  <h2 className="inventory-section-title">Medicine Distribution</h2>
                  <p className="inventory-section-note">
                    Share of the most dispensed medicines.
                  </p>
                </div>
                <span className="inventory-count">Top 5</span>
              </div>
              <div className="mt-5">
                <DonutChart items={medicineUsage} />
              </div>
            </section>

            <section className="inventory-card">
              <div className="inventory-section-head">
                <div>
                  <h2 className="inventory-section-title">Usage Table</h2>
                  <p className="inventory-section-note">
                    Plain table for reporting and quick checking.
                  </p>
                </div>
              </div>
              {medicineUsage.length === 0 ? (
                <div className="inventory-empty mt-5">No usage records found.</div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="inventory-table min-w-[600px]">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th>Total Released</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicineUsage.map((item) => (
                        <tr key={item.medicine_name}>
                          <td>{item.medicine_name}</td>
                          <td className="font-semibold text-slate-900">{item.total_released}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
