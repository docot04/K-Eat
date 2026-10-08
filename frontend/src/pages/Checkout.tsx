import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import type { PaymentMethod } from "../types";

export const Checkout: React.FC = () => {
  const { items, cafeteriaId, cafeteriaName, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  // Default pickup time: 20 minutes from now
  const defaultPickup = new Date(Date.now() + 20 * 60 * 1000);
  const formatInputDateTime = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [pickupTime, setPickupTime] = useState(formatInputDateTime(defaultPickup));

  if (items.length === 0 || !cafeteriaId) {
    return (
      <div className="min-h-screen bg-[#fafbfb] text-slate-900 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center bg-white border border-slate-150 p-8 rounded-3xl shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your Tray is Empty</h2>
          <p className="text-xs text-slate-500 mb-6">
            Add some items from campus food counters before proceeding to checkout.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Browse Food Courts
          </Link>
        </div>
      </div>
    );
  }

  const setPresetMinutes = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    setPickupTime(formatInputDateTime(target));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      error("Please sign in to complete your order");
      navigate("/login");
      return;
    }

    const pickupDate = new Date(pickupTime);
    if (pickupDate.getTime() <= Date.now()) {
      error("Pickup time must be in the future");
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        cafeteriaId,
        items: items.map((i) => ({
          itemId: i.menuItem.item_id,
          quantity: i.quantity,
        })),
        pickupTime: pickupDate.toISOString(),
        paymentMethod,
      };

      const order = await api.createOrder(orderPayload);
      clearCart();
      success("Order submitted! Proceed with payment reference.");
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#fafbfb] text-slate-900">
      <Link
        to={cafeteriaId ? `/cafeteria/${cafeteriaId}` : "/"}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Menu
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Review & Confirm Order
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select your scheduled pickup window and payment option.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Timing & Payment */}
        <div className="md:col-span-2 space-y-6">
          {/* Pickup Timing */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                1. Scheduled Pickup Window
              </h2>
            </div>

            <p className="text-xs text-slate-500">
              When would you like to collect your food? Kitchen prepares it fresh for your chosen time.
            </p>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPresetMinutes(15)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold hover:border-emerald-500 bg-slate-50 text-slate-700 transition-all text-center cursor-pointer"
              >
                In 15 mins
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(30)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold hover:border-emerald-500 bg-slate-50 text-slate-700 transition-all text-center cursor-pointer"
              >
                In 30 mins
              </button>
              <button
                type="button"
                onClick={() => setPresetMinutes(60)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold hover:border-emerald-500 bg-slate-50 text-slate-700 transition-all text-center cursor-pointer"
              >
                In 1 hour
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Exact Pickup Date & Time:
              </label>
              <input
                type="datetime-local"
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:border-emerald-500 outline-none shadow-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pickup must be within operating hours in the next 7 days.
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                  paymentMethod === "upi"
                    ? "border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                  className="sr-only"
                />
                <QrCode className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold">UPI / QR Code</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  GPay / PhonePe / Paytm
                </span>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold">Card at Counter</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  POS terminal swipe
                </span>
              </label>

              <label
                className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                  paymentMethod === "cash"
                    ? "border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6 text-emerald-600 mb-2" />
                <span className="text-xs font-bold">Cash at Counter</span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Pay when picking up
                </span>
              </label>
            </div>

            <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200 text-xs text-slate-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {paymentMethod === "upi"
                  ? "After placing order, you will receive the official UPI QR and instructions to submit your payment reference for immediate queue entry."
                  : "Pay at counter when picking up. Kitchen prepares upon arrival."}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider truncate">
                {cafeteriaName}
              </h3>
            </div>

            {/* Item list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {items.map(({ menuItem, quantity }) => (
                <div
                  key={menuItem.item_id}
                  className="flex justify-between items-start gap-2"
                >
                  <div>
                    <p className="font-bold text-slate-900">{menuItem.name}</p>
                    <p className="text-[10px] text-slate-400">
                      Qty: {quantity} × ₹{menuItem.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">
                    ₹{(menuItem.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Campus Surcharge</span>
                <span className="text-emerald-700 font-bold">₹0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                <span>Total Due</span>
                <span className="text-emerald-700">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs hover:scale-[1.02] cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
