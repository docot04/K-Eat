import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  ArrowRight,
  Clock,
  Store,
  ChevronRight,
  Search,
  ShoppingBag,
} from "lucide-react";
import type { Order } from "../types";
import { api } from "../services/api";
import { OrderStatusBadge } from "../components/Badge";

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.listOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      String(o.id).includes(search) ||
      o.cafeteria_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "active") {
      return ["not_paid", "paid", "preparing", "ready"].includes(o.status);
    }
    if (filter === "completed") {
      return o.status === "collected";
    }
    if (filter === "cancelled") {
      return o.status === "cancelled";
    }
    return true;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 bg-[#fafbfb] text-slate-900">
      {/* Header - Open, Airy, Unboxed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Token Queue</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Orders & Tokens
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track live kitchen preparation, review token receipts, and monitor queue progression.
          </p>
        </div>

        <Link
          to="/"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer"
        >
          <span>Order Food</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter and Search Bar - Unboxed, Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-bold pb-1 sm:pb-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              filter === "active"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Active & In Queue
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              filter === "completed"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              filter === "cancelled"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Cancelled
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID or cafeteria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* Orders List - Completely Unboxed, Elegant Flowing Rows */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-white/70 rounded-2xl border border-slate-100 p-6" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No orders found
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            You don't have any orders matching this filter. Explore campus dining counters to place a fresh meal order!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all"
          >
            Browse Food Courts
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden divide-y divide-slate-100">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="p-5 sm:p-6 hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-black text-slate-900 text-base">
                    Order #{order.id}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  {order.queue?.position && order.queue.position > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      Queue #{order.queue.position}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    {order.cafeteria_name}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Pickup:{" "}
                    {new Date(order.pickup_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {order.items && order.items.length > 0 && (
                  <p className="text-xs text-slate-500 truncate max-w-xl">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <span>Track Live</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
