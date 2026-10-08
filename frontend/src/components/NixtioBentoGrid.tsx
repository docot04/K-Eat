import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  ChefHat,
  Sparkles,
} from "lucide-react";

export const NixtioBentoGrid: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const STEPS = [
    {
      step: "01",
      title: "Browse Real-Time Counter Menus",
      desc: "Live inventory synced with SAC Central Food Court, North Campus Bites, and Brew & Bake Cafe.",
      badge: "Real-time Sync",
    },
    {
      step: "02",
      title: "Direct UPI & Fast UTR Verification",
      desc: "Instant digital receipts with student ID and transaction reference number. Zero payment gateways fees.",
      badge: "Instant Payment",
    },
    {
      step: "03",
      title: "Live Token Progression in Kitchen Queue",
      desc: "Watch your order transition from 'Paid' to 'Preparing' to 'Ready for Pickup' on the live kitchen board.",
      badge: "Token Tracking",
    },
    {
      step: "04",
      title: "Zero-Wait Physical Counter Pickup",
      desc: "Walk straight to the pickup counter when your digital token turns green. No standing in long lines.",
      badge: "Express Pickup",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header - Unboxed & Clean */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200/80">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Dining Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            How K-Eat Eliminates Campus Dining Queues
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Engineered specifically for university food courts, student activity centers, and rush-hour dining.
          </p>
        </div>

        <Link
          to="/orders"
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <span>View Live Queue Tokens</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ScrollTide-Inspired Fluid Interactive Step Sequence */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STEPS.map((item, idx) => (
          <div
            key={item.step}
            onMouseEnter={() => setActiveStep(idx)}
            className={`p-6 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${
              activeStep === idx
                ? "bg-white shadow-lg shadow-emerald-950/5 border border-emerald-300/80 -translate-y-1"
                : "bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-2xl font-black font-mono ${
                    activeStep === idx ? "text-emerald-600" : "text-slate-300"
                  }`}
                >
                  {item.step}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    activeStep === idx
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-slate-400">
                Step {idx + 1}
              </span>
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  activeStep === idx ? "bg-emerald-600" : "bg-slate-300"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Campus Performance Metrics - Clean Unboxed Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
        <div className="p-4 border-l-2 border-emerald-500 pl-4">
          <span className="text-3xl font-black text-slate-900 block font-mono">
            4.2 mins
          </span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Avg. Rush Prep Time
          </span>
        </div>

        <div className="p-4 border-l-2 border-emerald-500 pl-4">
          <span className="text-3xl font-black text-slate-900 block font-mono">
            100%
          </span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified UPI Tokens
          </span>
        </div>

        <div className="p-4 border-l-2 border-emerald-500 pl-4">
          <span className="text-3xl font-black text-slate-900 block font-mono">
            3 Blocks
          </span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
            <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
            Active Food Courts
          </span>
        </div>

        <div className="p-4 border-l-2 border-emerald-500 pl-4">
          <span className="text-3xl font-black text-slate-900 block font-mono">
            0 Lines
          </span>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Direct Tray Pickup
          </span>
        </div>
      </div>
    </section>
  );
};
