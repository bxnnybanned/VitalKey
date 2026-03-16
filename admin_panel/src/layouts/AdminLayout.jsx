import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItemClass = (path) =>
    `block rounded-lg px-4 py-3 transition ${
      location.pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md border-r flex flex-col justify-between">
        <div>
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-blue-600">VitalKey</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>

          <nav className="p-4 space-y-2">
            <Link to="/dashboard" className={navItemClass("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/doctors" className={navItemClass("/doctors")}>
              Doctors
            </Link>
            <Link to="/medicines" className={navItemClass("/medicines")}>
              Medicines
            </Link>
            <Link to="/appointments" className={navItemClass("/appointments")}>
              Appointments
            </Link>
            <Link to="/reports" className={navItemClass("/reports")}>
              Reports
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
