import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Store,
  ChevronRight,
} from "lucide-react";
import type { Cafeteria } from "../types";
import { api } from "../services/api";
import { Hero3DShowcase } from "../components/Hero3DShowcase";
import { NixtioBentoGrid } from "../components/NixtioBentoGrid";
import { MobileAppBanner } from "../components/MobileAppBanner";

export const Home: React.FC = () => {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  useEffect(() => {
    loadCafeterias();
  }, []);

  const loadCafeterias = async () => {
    setLoading(true);
    try {
      const data = await api.listCafeterias();
      setCafeterias(data);
    } catch (err) {
      console.error("Failed to load cafeterias", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = cafeterias.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchesOpen = onlyOpen ? c.is_open : true;
    return matchesSearch && matchesOpen;
  });

  return (
    <div className="min-h-screen pb-16 bg-[#fafbfb] text-slate-900">
      {/* 1. Interactive 3D WebGL Food Showcase Hero */}
      <Hero3DShowcase />

      {/* 2. ScrollTide-Inspired Campus Queue Workflow */}
      <NixtioBentoGrid />

      {/* 3. Campus Food Courts & Cafeterias Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Campus Dining Counters</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Select Your Food Counter
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live menu availability, daily specials, and preparation wait times.
            </p>
          </div>

          {/* Search & Open Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search food stalls, blocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none shadow-xs"
              />
            </div>

            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`px-3.5 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs ${
                onlyOpen
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Open Only</span>
            </button>
          </div>
        </div>

        {/* Cafeteria Cards Grid - Airy, Unboxed & Light */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-3xl bg-white border border-slate-100 animate-pulse p-4 flex flex-col justify-between shadow-xs"
              >
                <div className="w-full h-36 bg-slate-100 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-9 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No cafeterias match your criteria
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your search keywords or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setOnlyOpen(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cafe) => (
              <div
                key={cafe.id}
                className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col transform hover:-translate-y-1"
              >
                {/* Image Cover */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  {cafe.image ? (
                    <img
                      src={cafe.image}
                      alt={cafe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-black">
                      {cafe.name.charAt(0)}
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md shadow-xs ${
                        cafe.is_open
                          ? "bg-white/95 text-emerald-700 border border-emerald-200"
                          : "bg-white/95 text-rose-600 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cafe.is_open ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
                        }`}
                      />
                      {cafe.is_open ? "Open Now" : "Closed"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {cafe.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{cafe.location}</span>
                    </div>

                    {cafe.payment_instructions && (
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                        {cafe.payment_instructions}
                      </p>
                    )}
                  </div>

                  {/* Action link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pre-orders ready</span>
                    </div>

                    <Link
                      to={`/cafeteria/${cafe.id}`}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        cafe.is_open
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-105"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{cafe.is_open ? "View Menu" : "Check Menu"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Native Mobile App & PWA Section */}
      <MobileAppBanner />
    </div>
  );
};
