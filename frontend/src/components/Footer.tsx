import React from "react";
import { UtensilsCrossed, Clock, ShieldCheck, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-xs">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">K-Eat</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ml-2">
                Campus Dining
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
              Order meals in advance from campus food courts, settle payments via UPI, and track live food preparation queues without standing in physical lines.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Advance order scheduling
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified UPI UTR tokens
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Campus Cafeterias
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="hover:text-emerald-700 transition-colors">Central Food Court (SAC)</li>
              <li className="hover:text-emerald-700 transition-colors">North Campus Bites (Block 3)</li>
              <li className="hover:text-emerald-700 transition-colors">Brew & Bake Cafe (Library)</li>
              <li className="hover:text-emerald-700 transition-colors">Night Owl Canteen (Hostels)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Operating Hours
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex justify-between">
                <span>Breakfast:</span>
                <span className="text-slate-900 font-medium">8:00 AM – 11:00 AM</span>
              </li>
              <li className="flex justify-between">
                <span>Lunch:</span>
                <span className="text-slate-900 font-medium">12:00 PM – 3:30 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Snacks & Tea:</span>
                <span className="text-slate-900 font-medium">4:00 PM – 7:30 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Night Canteen:</span>
                <span className="text-emerald-700 font-bold">8:00 PM – 2:00 AM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} K-Eat Cafeteria Management Platform.</p>
          <p className="flex items-center gap-1 font-medium">
            Built with <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> for campus dining efficiency
          </p>
        </div>
      </div>
    </footer>
  );
};
