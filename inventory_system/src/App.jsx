import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import InventoryLayout from "./layouts/InventoryLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MedicineCatalog from "./pages/MedicineCatalog";
import PatientRequests from "./pages/PatientRequests";
import Reports from "./pages/Reports";
import Transactions from "./pages/Transactions";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <InventoryLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/medicines" element={<MedicineCatalog />} />
        <Route path="/patient-requests" element={<PatientRequests />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/transactions" element={<Transactions />} />
      </Route>
    </Routes>
  );
}
