import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/doctors", label: "Doctor Management" },
  { path: "/clinic-settings", label: "Clinic Settings" },
  { path: "/patient-records", label: "Patient Records" },
  { path: "/medicines", label: "Medicine Catalog" },
  { path: "/appointments", label: "Appointment Management" },
  { path: "/reports", label: "Reports" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItemClass = (path) =>
    `group relative block overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        : "text-slate-600 hover:bg-white hover:text-slate-900"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-r border-slate-200/70 bg-white/75 px-5 py-6 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="admin-card-strong px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Admin Panel
                </h1>
              </div>
              <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                Live
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path} className={navItemClass(item.path)}>
                <span className="relative z-10">{item.label}</span>
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
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {navigationItems.find((item) => item.path === location.pathname)?.label ||
                    "Admin Panel"}
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
