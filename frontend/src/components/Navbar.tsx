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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full pt-3 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto h-14 rounded-full bg-[#03231c]/65 backdrop-blur-2xl border border-[#34d399]/25 shadow-[0_16px_40px_rgba(0,15,10,0.5),inset_0_1px_1px_rgba(167,243,208,0.2)] px-5 flex items-center justify-between text-[#f0fdf4] pointer-events-auto transition-all">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#059669] to-[#10b981] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform font-black">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-display font-black tracking-tight text-white group-hover:text-[#6ee7b7] transition-colors">
                K-Eat
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#6ee7b7] border border-[#34d399]/30">
                Campus Dining
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                isActive("/")
                  ? "bg-[#10b981]/25 text-[#a7f3d0] border border-[#34d399]/40 font-bold shadow-xs"
                  : "text-[#a7f3d0]/75 hover:text-white hover:bg-white/10"
              }`}
            >
              Food Courts
            </Link>

            <Link
              to="/orders"
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                isActive("/orders")
                  ? "bg-[#10b981]/25 text-[#a7f3d0] border border-[#34d399]/40 font-bold shadow-xs"
                  : "text-[#a7f3d0]/75 hover:text-white hover:bg-white/10"
              }`}
            >
              My Orders & Tokens
            </Link>

            {(user?.role === "cafe_staff" || user?.role === "admin") && (
              <Link
                to="/staff"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                  location.pathname.startsWith("/staff")
                    ? "bg-purple-600/30 text-purple-200 border border-purple-400/40 font-bold"
                    : "text-[#a7f3d0]/75 hover:text-purple-300 hover:bg-white/10"
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
                    ? "bg-indigo-600/30 text-indigo-200 border border-indigo-400/40 font-bold"
                    : "text-[#a7f3d0]/75 hover:text-indigo-300 hover:bg-white/10"
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
          {/* Persona Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#34d399]/20 bg-[#053b2f]/40 hover:bg-[#053b2f]/70 text-[#a7f3d0] text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Switch demo persona"
            >
              <Sparkles className="w-3 h-3 text-[#fef08a]" />
              <span className="hidden sm:inline text-[#a7f3d0]/70 font-normal">Role:</span>
              <span className="capitalize">{user ? user.role.replace("_", " ") : "Demo"}</span>
              <ChevronDown className="w-3 h-3 text-[#a7f3d0]/60" />
            </button>

            {demoMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#04261e] rounded-2xl shadow-2xl border border-[#34d399]/30 py-2 z-50 text-xs text-[#f0fdf4] backdrop-blur-2xl animate-in fade-in"
                onClick={() => setDemoMenuOpen(false)}
              >
                <div className="px-3.5 py-1.5 font-bold text-[#86efac]/70 uppercase tracking-wider text-[10px]">
                  Switch Demo Persona
                </div>
                <button
                  onClick={() => switchDemoRole("student")}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#064e3b] flex items-center justify-between text-[#f0fdf4] cursor-pointer"
                >
                  <span className="font-semibold">Student (Aarav)</span>
                  {user?.role === "student" && (
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  )}
                </button>
                <button
                  onClick={() => switchDemoRole("cafe_staff")}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#064e3b] flex items-center justify-between text-[#f0fdf4] cursor-pointer"
                >
                  <span className="font-semibold">Kitchen Staff (Ramesh)</span>
                  {user?.role === "cafe_staff" && (
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                  )}
                </button>
                <button
                  onClick={() => switchDemoRole("admin")}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#064e3b] flex items-center justify-between text-[#f0fdf4] cursor-pointer"
                >
                  <span className="font-semibold">Admin</span>
                  {user?.role === "admin" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  )}
                </button>
                <div className="border-t border-[#064e3b] my-1 pt-1 px-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDemoMode();
                    }}
                    className="w-full text-left py-1 text-[#86efac]/80 hover:text-white flex items-center justify-between text-[11px] cursor-pointer"
                  >
                    <span>Simulation:</span>
                    <span className="font-semibold text-[#fef08a]">
                      {demoMode ? "Demo Mode" : "Live API"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Tray Pill */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-full border border-[#34d399]/25 hover:border-[#34d399]/60 bg-[#053b2f]/40 hover:bg-[#053b2f]/70 text-[#f0fdf4] transition-all shadow-xs cursor-pointer flex items-center justify-center"
            aria-label="Open tray"
          >
            <ShoppingBag className="w-4 h-4 text-[#34d399]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-[#10b981] text-[#021a14] text-[10px] font-black rounded-full flex items-center justify-center animate-in zoom-in shadow-md">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-[#34d399]/20 bg-[#053b2f]/40 hover:bg-[#053b2f]/70 text-xs font-bold text-[#f0fdf4] transition-colors cursor-pointer shadow-xs"
              >
                <span className="hidden sm:inline max-w-[100px] truncate text-xs">
                  {user.name.split(" ")[0]}
                </span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#10b981] to-[#34d399] text-[#021a14] flex items-center justify-center font-black text-xs shadow-xs">
                  {user.name.charAt(0)}
                </div>
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-[#04261e] rounded-2xl shadow-2xl border border-[#34d399]/30 py-2 z-50 text-[#f0fdf4] backdrop-blur-2xl animate-in fade-in"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-[#064e3b]">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-[#86efac]/80 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#a7f3d0] hover:bg-[#064e3b]"
                  >
                    <UserIcon className="w-4 h-4 text-[#34d399]" />
                    Account Settings
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#a7f3d0] hover:bg-[#064e3b] md:hidden"
                  >
                    <Layers className="w-4 h-4 text-[#34d399]" />
                    My Orders
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-300 hover:bg-rose-950/40 text-left border-t border-[#064e3b] cursor-pointer"
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
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#10b981] to-[#059669] text-[#021a14] text-xs font-black shadow-md hover:scale-105 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
