import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchTodayPatients } from "../api/doctorApi";
import { getSelectedPatientCode } from "../utils/selectedPatient";

const navigationItems = [
  { path: "/dashboard", label: "Today's Patients" },
  { path: "/patient-details", label: "Patient Details" },
  { path: "/consultation", label: "Consultation" },
];

export default function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = useMemo(
    () => JSON.parse(localStorage.getItem("doctor") || "null"),
    [],
  );
  const [patientCount, setPatientCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      setSelectedCount(getSelectedPatientCode() ? 1 : 0);
      if (!doctor?.doctor_id) return;

      try {
        const patients = await fetchTodayPatients(doctor.doctor_id);
        setPatientCount(patients.length);
      } catch {
        setPatientCount(0);
      }
    };

    loadCounts();
  }, [doctor?.doctor_id, location.pathname]);

  const navItemClass = (path) =>
    `portal-nav-item ${
      location.pathname === path
        ? "portal-nav-item-active"
        : "portal-nav-item-idle"
    }`;

  const getBadgeCount = (path) =>
    path === "/dashboard" ? patientCount : selectedCount;

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

    return "portal-nav-badge";
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor_token");
    localStorage.removeItem("doctor");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[290px] border-r border-slate-200/70 bg-white/95 px-5 py-6 xl:flex xl:flex-col">
          <div className="portal-brand">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Portal
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {doctor?.full_name || "Doctor"}
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path} className={navItemClass(item.path)}>
                <span>{item.label}</span>
                <span className={getBadgeClass(item.path)}>
                  {getBadgeCount(item.path)}
                </span>
              </Link>
            ))}
          </nav>

          <div className="portal-card mt-6 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 xl:pl-[322px] xl:pr-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1600px]">
            <div className="portal-mobile-bar xl:hidden">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Doctor Portal
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {navigationItems.find((item) => item.path === location.pathname)?.label ||
                    "Doctor Portal"}
                </h2>
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
