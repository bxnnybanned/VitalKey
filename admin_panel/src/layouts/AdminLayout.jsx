import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { fetchAdmins } from "../api/adminManagementApi";
import { getAppointments } from "../api/appointmentsApi";
import { getClinicSettings } from "../api/clinicSettingsApi";
import { getDashboardSummary } from "../api/dashboardApi";
import { getDoctors } from "../api/doctorApi";
import { getMedicines } from "../api/medicinesApi";
import { fetchMedicineKeepers } from "../api/medicineKeepersApi";
import { getPatients } from "../api/patientRecordsApi";

const appIcon = "/app_icon.png";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/admin-management", label: "Admin Management", superAdminOnly: true },
  { path: "/doctors", label: "Doctor Management" },
  { path: "/clinic-settings", label: "Clinic Settings" },
  { path: "/patient-records", label: "Patient Records" },
  { path: "/medicines", label: "Medicine Catalog" },
  { path: "/medicine-keepers", label: "Medicine Keeper Accounts" },
  { path: "/inventory-activity", label: "Inventory Activity" },
  { path: "/appointments", label: "Appointment Management" },
  { path: "/reports", label: "Reports" },
];

function NavIcon({ path }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    className: "admin-nav-icon-svg",
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
  if (path === "/admin-management") {
    return <svg {...commonProps}><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 13v8M12 17h8M4 19c0-3 2-5 4-5s4 2 4 5" /></svg>;
  }
  if (path === "/doctors") {
    return <svg {...commonProps}><path d="M12 4v16M5 12h14" /><rect x="7" y="2" width="10" height="20" rx="3" /></svg>;
  }
  if (path === "/clinic-settings") {
    return <svg {...commonProps}><path d="M12 3v4M12 17v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M3 12h4M17 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /><circle cx="12" cy="12" r="3" /></svg>;
  }
  if (path === "/patient-records") {
    return <svg {...commonProps}><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>;
  }
  if (path === "/medicines") {
    return <svg {...commonProps}><path d="M8 6h8M8 18h8M9 6v12M15 6v12" /><rect x="5" y="3" width="14" height="18" rx="4" /></svg>;
  }
  if (path === "/medicine-keepers") {
    return <svg {...commonProps}><circle cx="9" cy="8" r="3" /><path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" /><path d="M16 8h4M18 6v4" /></svg>;
  }
  if (path === "/inventory-activity") {
    return <svg {...commonProps}><path d="M5 18h14M7 14l3-3 3 2 4-5" /></svg>;
  }
  if (path === "/appointments") {
    return <svg {...commonProps}><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>;
  }
  return <svg {...commonProps}><path d="M12 4v16M4 12h16" /></svg>;
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "null");
    } catch {
      return null;
    }
  }, []);
  const [navNotifications, setNavNotifications] = useState({
    dashboard: 0,
    adminManagement: 0,
    doctors: 0,
    clinicSettings: 0,
    patientRecords: 0,
    medicines: 0,
    medicineKeepers: 0,
    inventoryActivity: 0,
    appointments: 0,
    reports: 0,
  });

  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.superAdminOnly || admin?.role === "super_admin"
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const requests = [
          getDashboardSummary(),
          getDoctors(),
          getAppointments(),
          getMedicines(),
          getClinicSettings(),
          getPatients(),
          fetchMedicineKeepers(),
        ];

        if (admin?.role === "super_admin" && admin?.admin_id) {
          requests.push(fetchAdmins(admin.admin_id));
        }

        const [
          summary,
          doctors,
          appointments,
          medicines,
          clinicSettings,
          patients,
          medicineKeepers,
          admins = [],
        ] = await Promise.all(requests);

        const pendingAppointments = appointments.filter(
          (item) => (item.status || "").toLowerCase() === "pending",
        ).length;

        const doctorsNeedingAttention = doctors.filter(
          (item) => !item.is_active || !item.username,
        ).length;
        const medicinesLowStock = medicines.filter(
          (item) => Number(item.stock_quantity) <= 20 || !item.is_active,
        ).length;
        const inactiveKeepers = medicineKeepers.filter((item) => !item.is_active).length;
        const unverifiedPatients = patients.filter((item) => !item.is_verified).length;
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const clinicIssues = clinicSettings.filter((item) => {
          if (!weekdays.includes(item.day_of_week)) return false;
          return !item.is_open || !item.open_time || !item.close_time;
        }).length;
        const inactiveAdmins = Array.isArray(admins)
          ? admins.filter((item) => !item.is_active).length
          : 0;

        setNavNotifications({
          dashboard:
            (summary.total_pending_prescriptions ?? 0) +
            (summary.low_stock_medicines ?? 0) +
            pendingAppointments,
          adminManagement: inactiveAdmins,
          doctors: doctorsNeedingAttention,
          clinicSettings: clinicIssues,
          patientRecords: unverifiedPatients,
          medicines: medicinesLowStock,
          medicineKeepers: inactiveKeepers,
          inventoryActivity: 0,
          appointments: pendingAppointments,
          reports: summary.low_stock_medicines ?? 0,
        });
      } catch {
        setNavNotifications({
          dashboard: 0,
          adminManagement: 0,
          doctors: 0,
          clinicSettings: 0,
          patientRecords: 0,
          medicines: 0,
          medicineKeepers: 0,
          inventoryActivity: 0,
          appointments: 0,
          reports: 0,
        });
      }
    };

    loadNotifications();
  }, [admin?.admin_id, admin?.role]);

  const formatBadgeCount = (count) => (count > 99 ? "99+" : count);

  const getNotificationCount = (path) => {
    if (path === "/dashboard") return navNotifications.dashboard;
    if (path === "/admin-management") return navNotifications.adminManagement;
    if (path === "/doctors") return navNotifications.doctors;
    if (path === "/clinic-settings") return navNotifications.clinicSettings;
    if (path === "/patient-records") return navNotifications.patientRecords;
    if (path === "/medicines") return navNotifications.medicines;
    if (path === "/medicine-keepers") return navNotifications.medicineKeepers;
    if (path === "/inventory-activity") return navNotifications.inventoryActivity;
    if (path === "/appointments") return navNotifications.appointments;
    if (path === "/reports") return navNotifications.reports;
    return 0;
  };

  const navItemClass = (path) =>
    `group relative flex items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        : "text-slate-600 hover:bg-white hover:text-slate-900"
    }`;

  const navBadgeClass = (path) => {
    const count = getNotificationCount(path);
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

    return "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 overflow-hidden border-r border-slate-200/70 bg-white/75 px-5 py-6 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="admin-card-strong px-5 py-5">
            <div className="flex items-center gap-4">
              <img
                src={appIcon}
                alt="VitalKey logo"
                className="h-14 w-14 rounded-2xl object-cover shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Admin Panel
                </h1>
                <p className="mt-1 text-sm text-slate-500">VitalKey</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
            {visibleNavigationItems.map((item) => (
              <Link key={item.path} to={item.path} className={navItemClass(item.path)}>
                <span className="relative z-10 flex items-center gap-3">
                  <span className="admin-nav-icon"><NavIcon path={item.path} /></span>
                  <span>{item.label}</span>
                </span>
                <span className={navBadgeClass(item.path)}>
                  {formatBadgeCount(getNotificationCount(item.path))}
                </span>
                {location.pathname !== item.path && (
                  <span className="absolute inset-y-2 left-2 w-1 rounded-full bg-transparent transition group-hover:bg-blue-100" />
                )}
              </Link>
            ))}
          </nav>

          <div className="admin-card mt-6 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 xl:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1500px]">
            <div className="admin-card mb-5 flex items-center justify-between gap-4 px-5 py-4 xl:hidden">
              <div className="flex items-center gap-3">
                <img
                  src={appIcon}
                  alt="VitalKey logo"
                  className="h-12 w-12 rounded-2xl object-cover shadow-sm"
                />
                <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {visibleNavigationItems.find((item) => item.path === location.pathname)?.label ||
                    "Admin Panel"}
                </h2>
                  <p className="text-sm text-slate-500">VitalKey</p>
                </div>
              </div>
              <button
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
