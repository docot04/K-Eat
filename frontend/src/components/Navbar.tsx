import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  ChefHat,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole, demoMode, toggleDemoMode } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        isHome
          ? "bg-[#161415]/85 backdrop-blur-xl border-b border-white/10 text-white"
          : "bg-white/80 backdrop-blur-xl border-b border-slate-200/70 text-slate-900 shadow-2xs"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform font-black">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-xl font-display font-black tracking-tight transition-colors ${
                  isHome ? "text-white" : "text-slate-900 group-hover:text-emerald-700"
                }`}
              >
                K-Eat
              </span>
              <span
                className={`hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isHome
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                }`}
              >
                Campus Dining
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive("/")
                  ? isHome
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "bg-slate-900 text-white font-bold"
                  : isHome
                  ? "text-slate-300 hover:text-white hover:bg-white/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              Food Courts
            </Link>

            <Link
              to="/orders"
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive("/orders")
                  ? isHome
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "bg-slate-900 text-white font-bold"
                  : isHome
                  ? "text-slate-300 hover:text-white hover:bg-white/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              My Orders & Tokens
            </Link>

            {(user?.role === "cafe_staff" || user?.role === "admin") && (
              <Link
                to="/staff"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname.startsWith("/staff")
                    ? "bg-purple-600 text-white font-bold"
                    : isHome
                    ? "text-slate-300 hover:text-purple-300 hover:bg-white/10"
                    : "text-slate-600 hover:text-purple-700 hover:bg-purple-50/50"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-purple-400" />
                Kitchen Board
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname.startsWith("/admin")
                    ? "bg-indigo-600 text-white font-bold"
                    : isHome
                    ? "text-slate-300 hover:text-indigo-300 hover:bg-white/10"
                    : "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/50"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Master Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {/* Demo Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                isHome
                  ? "border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200"
                  : "border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
              }`}
              title="Switch demo persona"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="capitalize">{user ? user.role.replace("_", " ") : "Demo"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {demoMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-900 animate-in fade-in"
                onClick={() => setDemoMenuOpen(false)}
              >
                <div className="px-3.5 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Switch Demo Persona
                </div>
                <button
                  onClick={() => switchDemoRole("student")}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <span className="font-semibold">Student (Aarav)</span>
                  {user?.role === "student" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  )}
                </button>
                <button
                  onClick={() => switchDemoRole("cafe_staff")}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <span className="font-semibold">Kitchen Staff (Ramesh)</span>
                  {user?.role === "cafe_staff" && (
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                  )}
                </button>
                <button
                  onClick={() => switchDemoRole("admin")}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                >
                  <span className="font-semibold">Admin</span>
                  {user?.role === "admin" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </button>
                <div className="border-t border-slate-100 my-1 pt-1 px-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDemoMode();
                    }}
                    className="w-full text-left py-1 text-slate-500 hover:text-slate-800 flex items-center justify-between text-[11px] cursor-pointer"
                  >
                    <span>Simulation:</span>
                    <span
                      className={`font-semibold ${
                        demoMode ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {demoMode ? "Demo Mode" : "Live API"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Tray Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`relative p-2.5 rounded-xl transition-all shadow-2xs cursor-pointer ${
              isHome
                ? "border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                : "border border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50 text-slate-700"
            }`}
            aria-label="Open tray"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-500" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-emerald-600 text-white text-[11px] font-black rounded-full flex items-center justify-center animate-in zoom-in shadow-xs">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                  isHome
                    ? "border border-white/15 bg-white/5 hover:bg-white/10 text-white"
                    : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                }`}
              >
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.name.split(" ")[0]}
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  {user.name.charAt(0)}
                </div>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900 animate-in fade-in"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-600" />
                    Account Settings
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 md:hidden"
                  >
                    <Layers className="w-4 h-4 text-emerald-600" />
                    My Orders
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left border-t border-slate-100 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 hover:scale-105 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
