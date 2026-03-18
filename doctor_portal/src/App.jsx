import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DoctorLayout from "./layouts/DoctorLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
