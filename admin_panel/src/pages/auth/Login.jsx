import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/admin-auth/login", {
        email: form.email,
        password: form.password,
      });

      console.log("Login success:", response.data);

      // Optional: store token
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }

      if (response.data.admin) {
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
      }

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-cyan-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">VitalKey</h1>
          <p className="text-gray-500 mt-2">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 outline-none"
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

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          No account yet?{" "}
          <Link
            to="/create-account"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
