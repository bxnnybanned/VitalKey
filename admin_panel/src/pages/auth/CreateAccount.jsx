import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";

export default function CreateAccount() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/admin-auth/register", {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-white to-blue-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">VitalKey</h1>
          <p className="text-gray-500 mt-2">Create Admin Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700">First Name</label>
              <input
                name="firstName"
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Last Name</label>
              <input
                name="lastName"
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 mt-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="w-full border rounded-xl px-4 py-3 mt-1"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-700">Password</label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 pr-12"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm text-gray-700">Confirm Password</label>

            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 pr-12"
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
