import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, ArrowRight, Sparkles, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, switchDemoRole } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success("Welcome back to K-Eat!");
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: "student" | "cafe_staff" | "admin") => {
    switchDemoRole(role);
    success(`Signed in as demo ${role.replace("_", " ")}!`);
    navigate(role === "cafe_staff" ? "/staff" : role === "admin" ? "/admin" : "/");
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-[#fafbfb] text-slate-900">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-600/25 font-black">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign in to K-Eat
          </h2>
          <p className="text-xs text-slate-500">
            Access campus food counters, track live tokens, or manage the kitchen.
          </p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Demo Access (Click to test)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("student")}
              className="py-1.5 px-2 bg-white hover:bg-emerald-100/50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:text-emerald-800 transition-colors text-center cursor-pointer shadow-2xs"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("cafe_staff")}
              className="py-1.5 px-2 bg-white hover:bg-purple-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:text-purple-700 transition-colors text-center cursor-pointer shadow-2xs"
            >
              Kitchen Staff
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="py-1.5 px-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:text-indigo-700 transition-colors text-center cursor-pointer shadow-2xs"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Campus Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="student@keat.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs hover:scale-[1.01] cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          New to campus?{" "}
          <Link
            to="/signup"
            className="font-bold text-emerald-700 hover:underline"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
