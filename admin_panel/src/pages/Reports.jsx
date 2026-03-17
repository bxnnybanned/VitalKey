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

const summaryCards = [
  {
    key: "total_patient_visits",
    title: "Total Patient Visits",
    color: "text-blue-600",
  },
  {
    key: "total_medicines_dispensed",
    title: "Total Medicines Dispensed",
    color: "text-green-600",
  },
  {
    key: "total_dispensing_transactions",
    title: "Dispensing Transactions",
    color: "text-amber-600",
  },
];

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
];

function LineChart({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-500">No patient visit data found.</p>;
  }

  const width = 760;
  const height = 280;
  const padding = 32;
  const maxValue = Math.max(...items.map((item) => item.total_visits), 1);

  const points = items.map((item, index) => {
    const x =
      items.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (items.length - 1);
    const y =
      height -
      padding -
      ((item.total_visits || 0) * (height - padding * 2)) / maxValue;

    return { ...item, x, y };
  });

  const pathData = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px]"
          role="img"
          aria-label="Patient visits line chart"
        >
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          <path
            d={pathData}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" />
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="12"
                fill="#1f2937"
                fontWeight="600"
              >
                {point.total_visits}
              </text>
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-800">
              {item.total_visits} visits
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChart({ items }) {
  if (items.length === 0) {
    return <p className="text-gray-500">No medicine usage data found.</p>;
  }

  const chartItems = items.slice(0, 6);
  const total = chartItems.reduce((sum, item) => sum + item.total_released, 0) || 1;
  const radius = 90;
  const center = 120;

  let cumulative = 0;
  const slices = chartItems.map((item, index) => {
    const value = item.total_released;
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    const path = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return {
      ...item,
      color: PIE_COLORS[index % PIE_COLORS.length],
      path,
      percentage: ((value / total) * 100).toFixed(1),
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
      <div className="mx-auto">
        <svg
          viewBox="0 0 240 240"
          width="240"
          height="240"
          role="img"
          aria-label="Medicine usage pie chart"
        >
          {slices.map((slice) => (
            <path key={slice.medicine_name} d={slice.path} fill={slice.color} />
          ))}
          <circle cx="120" cy="120" r="42" fill="white" />
          <text
            x="120"
            y="112"
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
          >
            Total
          </text>
          <text
            x="120"
            y="130"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#111827"
          >
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-3">
        {slices.map((slice) => (
          <div
            key={slice.medicine_name}
            className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <div>
                <p className="font-medium text-gray-800">{slice.medicine_name}</p>
                <p className="text-sm text-gray-500">{slice.percentage}% of releases</p>
              </div>
            </div>
            <p className="font-semibold text-gray-800">{slice.total_released}</p>
          </div>
        ))}
      </div>
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

        const [
          summaryData,
          dailyVisitsData,
          weeklyVisitsData,
          monthlyVisitsData,
          medicineUsageData,
        ] = await Promise.all([
          getReportsSummary(),
          getDailyPatientVisitsReport(),
          getWeeklyPatientVisitsReport(),
          getMonthlyPatientVisitsReport(),
          getMedicineUsageReport(),
        ]);

        setSummary(summaryData);
        setDailyVisits(dailyVisitsData);
        setWeeklyVisits(weeklyVisitsData);
        setMonthlyVisits(monthlyVisitsData);
        setMedicineUsage(medicineUsageData);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            err.message ||
            "Failed to load reports.",
        );
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

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Reports</h1>
        <p className="admin-subtitle">
          Generate patient visit and medicine dispensing reports with statistical summaries and graphical views.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-gray-500">Loading...</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-300">...</h2>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Loading charts and report tables...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.key} className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-gray-500">{card.title}</p>
                <h2 className={`mt-2 text-3xl font-bold ${card.color}`}>
                  {summary?.[card.key] ?? 0}
                </h2>
              </div>
            ))}

            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-gray-500">Most Dispensed Medicine</p>
              <h2 className="mt-2 text-2xl font-bold text-purple-700">
                {summary?.most_dispensed_medicine?.medicine_name || "N/A"}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Total Released:{" "}
                <span className="font-semibold text-gray-800">
                  {summary?.most_dispensed_medicine?.total_released ?? 0}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Patient Visit Trends
                </h2>
                <p className="text-sm text-gray-500">
                  Line chart with visible data labels for daily, weekly, and monthly reports.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {VISIT_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisitRange(option.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      visitRange === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <LineChart items={selectedVisitData} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Medicine Dispensing Distribution
              </h2>
              <p className="text-sm text-gray-500">
                Pie chart showing the distribution of the most dispensed medicines.
              </p>
            </div>

            <PieChart items={medicineUsage} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Patient Visit Details
                </h2>
                <p className="text-sm text-gray-500">
                  Tabular breakdown of the selected patient visit range.
                </p>
              </div>

              {selectedVisitData.length === 0 ? (
                <p className="text-gray-500">No patient visit data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-3">Period</th>
                        <th className="p-3">Total Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVisitData.map((item) => (
                        <tr key={item.label} className="border-t">
                          <td className="p-3">{item.label}</td>
                          <td className="p-3 font-semibold text-gray-800">
                            {item.total_visits}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Medicine Dispensing Details
                </h2>
                <p className="text-sm text-gray-500">
                  Most dispensed medicines and total quantities released.
                </p>
              </div>

              {medicineUsage.length === 0 ? (
                <p className="text-gray-500">No medicine usage data found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-left">
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3">Total Released</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicineUsage.map((item) => (
                        <tr key={item.medicine_name} className="border-t">
                          <td className="p-3">{item.medicine_name}</td>
                          <td className="p-3 font-semibold text-gray-800">
                            {item.total_released}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
