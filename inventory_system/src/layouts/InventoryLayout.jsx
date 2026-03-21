import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  fetchInventoryAlerts,
  fetchInventoryRequests,
  fetchInventorySummary,
} from "../api/inventoryApi";

const appIcon = "/app_icon.png";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/medicines", label: "Medicine Catalog" },
  { path: "/patient-requests", label: "Patient Requests" },
  { path: "/reports", label: "Reports" },
  { path: "/transactions", label: "Transactions" },
];

function NavIcon({ path }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    className: "inventory-nav-icon-svg",
    "aria-hidden": "true",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (path === "/dashboard") {
    return <svg {...commonProps}><path d="M4 13h6V5H4zM14 19h6v-8h-6zM14 5h6v4h-6zM4 19h6v-2H4z" /></svg>;
  }
  if (path === "/medicines") {
    return <svg {...commonProps}><rect x="5" y="4" width="14" height="16" rx="4" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  }
  if (path === "/patient-requests") {
    return <svg {...commonProps}><circle cx="9" cy="8" r="3" /><path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" /><path d="M17 8h3M17 12h3" /></svg>;
  }
  if (path === "/reports") {
    return <svg {...commonProps}><path d="M6 18V9M12 18V5M18 18v-7" /></svg>;
  }
  return <svg {...commonProps}><path d="M5 18h14M7 14l3-3 3 2 4-5" /></svg>;
}

export default function InventoryLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const keeper = useMemo(
    () => JSON.parse(localStorage.getItem("inventory_keeper") || "null"),
    [],
  );
  const [navCounts, setNavCounts] = useState({
    dashboard: 0,
    medicines: 0,
    patientRequests: 0,
    reports: 0,
    transactions: 0,
  });
  const currentPage =
    navigationItems.find((item) => item.path === location.pathname)?.label ||
    "Inventory System";

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [summary, requests, alerts] = await Promise.all([
          fetchInventorySummary(),
          fetchInventoryRequests(),
          fetchInventoryAlerts(),
        ]);

        setNavCounts({
          dashboard: summary.pending_prescriptions ?? 0,
          medicines:
            (summary.low_stock_medicines ?? 0) + (summary.expiring_medicines ?? 0),
          patientRequests: requests.filter((item) => {
            const status = (item.status || "").toLowerCase();
            return status !== "released" && status !== "rejected";
          }).length,
          reports: summary.released_today ?? 0,
          transactions: summary.released_today ?? 0,
        });
      } catch {
        setNavCounts({
          dashboard: 0,
          medicines: 0,
          patientRequests: 0,
          reports: 0,
          transactions: 0,
        });
      }
    };

    loadCounts();
  }, [location.pathname]);

  const formatBadgeCount = (count) => (count > 99 ? "99+" : count);

  const getBadgeCount = (path) => {
    if (path === "/dashboard") return navCounts.dashboard;
    if (path === "/medicines") return navCounts.medicines;
    if (path === "/patient-requests") return navCounts.patientRequests;
    if (path === "/reports") return navCounts.reports;
    if (path === "/transactions") return navCounts.transactions;
    return 0;
  };

  const navItemClass = (path) =>
    `inventory-nav-item ${
      location.pathname === path
        ? "inventory-nav-item-active"
        : "inventory-nav-item-idle"
    }`;

  const getBadgeClass = (path) => {
    const count = getBadgeCount(path);
    const isActive = location.pathname === path;

    if (count > 0 && isActive) {
      return "rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white";
    }

    if (count > 0) {
      return "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700";
    }

    if (isActive) {
      return "rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white";
    }

    return "inventory-nav-badge";
  };

  const handleLogout = () => {
    localStorage.removeItem("inventory_token");
    localStorage.removeItem("inventory_keeper");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[300px] overflow-hidden border-r border-slate-200/70 bg-white/95 px-5 py-6 xl:flex xl:flex-col">
          <div className="inventory-brand">
            <div className="flex items-center gap-4">
              <img
                src={appIcon}
                alt="VitalKey logo"
                className="h-14 w-14 rounded-2xl object-cover shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Inventory System</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {keeper?.full_name || "Medicine Keeper"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path} className={navItemClass(item.path)}>
                <span className="flex items-center gap-3">
                  <span className="inventory-nav-icon"><NavIcon path={item.path} /></span>
                  <span>{item.label}</span>
                </span>
                <span className={getBadgeClass(item.path)}>
                  {formatBadgeCount(getBadgeCount(item.path))}
                </span>
              </Link>
            ))}
          </nav>

          <div className="inventory-card p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 xl:pl-[332px] xl:pr-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="inventory-mobile-bar xl:hidden">
              <div className="flex items-center gap-3">
                <img
                  src={appIcon}
                  alt="VitalKey logo"
                  className="h-12 w-12 rounded-2xl object-cover shadow-sm"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Inventory System
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{currentPage}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Logout
              </button>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
