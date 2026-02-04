import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation logic
  const passwordStrength = {
    hasLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordStrong =
    Object.values(passwordStrength).filter(Boolean).length >= 3;
  const strengthPercent =
    (Object.values(passwordStrength).filter(Boolean).length / 5) * 100;

  const validateForm = () => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Invalid email address";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!isPasswordStrong) return "Password is not strong enough";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);

    if (result.success) {
      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }

    setLoading(false);
  };

  // Helper for strength colors
  const getStrengthColor = () => {
    if (strengthPercent < 40) return "#ef4444"; // Red
    if (strengthPercent < 80) return "#f59e0b"; // Amber
    return "#34d399"; // Mint
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_-20%,rgba(52,211,153,0.1),transparent_70%)]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Card */}
      <div className="relative bg-navy-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-navy-700 animate-in zoom-in-95 duration-300">
        {/* Header Gradient */}
        <div className="h-32 bg-gradient-to-r from-indigo-800 to-primary relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 bg-navy-800 rounded-2xl flex items-center justify-center shadow-lg border-4 border-navy-800">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-primary rounded-xl flex items-center justify-center shadow-glow">
                <UserPlus className="text-white" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-12 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Join Bug Tracker to get started
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-accent-mint/10 border border-accent-mint/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <Check className="text-accent-mint flex-shrink-0" size={18} />
              <p className="text-accent-mint text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Meter */}

              {password && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-navy-900 rounded-full overflow-hidden border border-navy-700">
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${strengthPercent}%`,
                          backgroundColor: getStrengthColor(),
                        }}
                      ></div>
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: getStrengthColor() }}
                    >
                      {strengthPercent < 40
                        ? "Weak"
                        : strengthPercent < 70
                          ? "Fair"
                          : "Strong"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {Object.entries(passwordStrength).map(([key, met]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div
                          className={`w-3 h-3 rounded-full flex items-center justify-center ${met ? "bg-accent-mint" : "bg-navy-700"}`}
                        >
                          {met && (
                            <Check
                              size={8}
                              className="text-navy-900"
                              strokeWidth={4}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] ${met ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {key === "hasLength" && "8+ chars"}
                          {key === "hasUpperCase" && "Uppercase"}
                          {key === "hasLowerCase" && "Lowercase"}
                          {key === "hasNumber" && "Number"}
                          {key === "hasSpecial" && "Symbol"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-slate-500"
                  size={18}
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-navy-900 border border-navy-700 rounded-xl text-slate-200 placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-primary hover:bg-primary-hover text-white font-semibold py-3.5 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-navy-800 text-slate-500 font-medium tracking-wide">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="w-full block text-center py-3 border border-navy-600 text-slate-300 font-medium rounded-xl hover:bg-navy-700 hover:text-white transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer Text */}
      <p className="absolute bottom-6 text-xs text-slate-600 text-center w-full">
        &copy; 2024 Bug Tracker Inc. All rights reserved.
      </p>
    </div>
  );
}
