import React, { useState } from "react";
import { Smartphone, Check, ArrowRight, Layers, Bell, Zap } from "lucide-react";
import { useToast } from "../context/ToastContext";

export const MobileAppBanner: React.FC = () => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const handleInstallPWA = () => {
    setCopied(true);
    success("K-Eat is PWA & Capacitor ready! Tap 'Add to Home Screen' in your browser for the full native app experience.");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-3xl p-6 sm:p-8 border border-emerald-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mobile App & PWA Ready</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Install K-Eat Directly to Your Phone
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Runs as a native mobile application via Capacitor and Progressive Web App (PWA). Offline digital token access, instant camera scanning, and push notifications when food is ready.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Instant launch
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Bell className="w-3.5 h-3.5 text-emerald-600" /> Live pickup alerts
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-emerald-600" /> Offline token storage
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleInstallPWA}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>PWA Instructions Triggered</span>
              </>
            ) : (
              <>
                <span>Add to Home Screen</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
