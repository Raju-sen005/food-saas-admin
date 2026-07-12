import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Login({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setAuthError("");
      await login(email, password);
    } catch (err) {
      setAuthError(err.response?.data?.message || "Invalid Email or Password");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F8F9FA] font-sans">
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white tracking-tight">Chotu AI+</h1>
          <p className="text-white/80 font-medium text-sm mt-1">Partner Network Management</p>
        </div>
        <div className="relative z-10 text-white space-y-3">
          <h2 className="text-2xl font-bold leading-tight">
            Manage orders, update menus, and analyze growth instantly.
          </h2>
          <p className="text-white/70 text-xs">
            Empowering 10,000+ cloud kitchens and premium outlets across India.
          </p>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-slate-500 text-sm">
              Welcome back! Please enter your merchant account operational credentials.
            </p>
          </div>

          {authError && (
            <div className="bg-rose-50/80 backdrop-blur-xs text-rose-600 p-4 rounded-xl text-xs font-semibold border border-rose-100 flex items-center gap-2 animate-shake">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Registered Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                placeholder="owner@yourrestaurant.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Secure Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3.5 rounded-xl font-bold hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-red-500/20 text-sm mt-3 cursor-pointer"
            >
              Enter Dashboard Control
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              New to Chotu AI+?{" "}
              <button
                onClick={onSwitchToSignup}
                className="text-red-500 font-extrabold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}