import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import CreateAccount from "./pages/auth/CreateAccount";

import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Medicines from "./pages/Medicines";
import Appointments from "./pages/Appointments";
import Reports from "./pages/Reports";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-account" element={<CreateAccount />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
