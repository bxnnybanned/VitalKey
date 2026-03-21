import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import CreateAccount from "./pages/auth/CreateAccount";

import Dashboard from "./pages/Dashboard";
import AdminManagement from "./pages/AdminManagement";
import Doctors from "./pages/Doctors";
import ClinicSettings from "./pages/ClinicSettings";
import PatientRecords from "./pages/PatientRecords";
import Medicines from "./pages/Medicines";
import MedicineKeepers from "./pages/MedicineKeepers";
import InventoryActivity from "./pages/InventoryActivity";
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
        <Route path="/admin-management" element={<AdminManagement />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/clinic-settings" element={<ClinicSettings />} />
        <Route path="/patient-records" element={<PatientRecords />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/medicine-keepers" element={<MedicineKeepers />} />
        <Route path="/inventory-activity" element={<InventoryActivity />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
