import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const navigationItems = [{ path: "/dashboard", label: "Today's Patients" }];

export default function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = JSON.parse(localStorage.getItem("doctor") || "null");

  const navItemClass = (path) =>
    `group relative block overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition ${
      location.pathname === path
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        : "text-slate-600 hover:bg-white hover:text-slate-900"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("doctor_token");
    localStorage.removeItem("doctor");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-r border-slate-200/70 bg-white/75 px-5 py-6 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="portal-card-strong px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Doctor Portal
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {doctor?.full_name || "Doctor"}
                </p>
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

        <main className="relative flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 xl:px-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1600px]">
            <div className="portal-card mb-5 flex items-center justify-between gap-4 px-5 py-4 xl:hidden">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
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
