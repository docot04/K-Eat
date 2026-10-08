import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Users,
  Store,
  RefreshCw,
  XCircle,
  Copy,
  Receipt,
} from "lucide-react";
import type { Order } from "../types";
import { api } from "../services/api";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/Badge";
import { useToast } from "../context/ToastContext";

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const { success, error, info } = useToast();

  useEffect(() => {
    if (!orderId) return;
    loadOrder();

    const interval = setInterval(loadOrder, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      error("Please enter your transaction ID or reference number");
      return;
    }

    setSubmittingPayment(true);
    try {
      await api.submitPayment({
        orderId,
        paymentMethod: order?.payment?.payment_method || "upi",
        transactionId: transactionId.trim(),
      });
      success("Payment reference submitted! Awaiting kitchen verification.");
      setTransactionId("");
      loadOrder();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit payment reference";
      error(msg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await api.cancelOrder(orderId);
      success("Order has been cancelled.");
      loadOrder();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    info("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6 bg-[#fafbfb] min-h-screen text-slate-900">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-40 bg-white rounded-3xl border border-slate-100" />
        <div className="h-64 bg-white rounded-3xl border border-slate-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center bg-[#fafbfb] min-h-screen text-slate-900">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Link
          to="/orders"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" /> Go to My Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "not_paid", label: "Payment Due" },
    { key: "paid", label: "Queued" },
    { key: "preparing", label: "Cooking" },
    { key: "ready", label: "Ready" },
    { key: "collected", label: "Collected" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "not_paid":
        return 0;
      case "paid":
        return 1;
      case "preparing":
        return 2;
      case "ready":
        return 3;
      case "collected":
        return 4;
      default:
        return -1;
    }
  };

  const currentStep = getStepIndex(order.status);
  const canCancel = ["not_paid", "paid"].includes(order.status);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 bg-[#fafbfb] text-slate-900">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All Orders & Tokens
        </Link>

        <button
          onClick={loadOrder}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Refresh Live Token</span>
        </button>
      </div>

      {/* Main Order Status Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Order #{order.id}
              </h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-700 font-semibold">{order.cafeteria_name}</span>
              <span>•</span>
              <span>Placed {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Scheduled Pickup:</span>
            <span className="text-sm font-bold text-emerald-700">
              {new Date(order.pickup_time).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Step Progress Tracker */}
        {order.status !== "cancelled" ? (
          <div className="pt-4 pb-2">
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2" />
              <div
                className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%`,
                }}
              />

              <div className="relative flex justify-between">
                {steps.map((st, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={st.key}
                      className="flex flex-col items-center text-center space-y-2"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-sm"
                            : isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent
                            ? "text-emerald-700"
                            : isDone
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-rose-600 font-bold text-xs flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4" /> This order was cancelled.
          </div>
        )}
      </div>

      {/* Live Queue Token Card (Visible when Paid or Cooking) */}
      {order.queue && ["paid", "preparing"].includes(order.status) && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black border border-emerald-200">
              <Users className="w-3.5 h-3.5" /> Live Kitchen Queue Token
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Queue Position: <span className="text-emerald-700">#{order.queue.position}</span>
            </h2>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              {order.queue.orders_ahead === 0
                ? "Your tray is next up on the chef's counter!"
                : `There ${
                    order.queue.orders_ahead === 1 ? "is" : "are"
                  } ${order.queue.orders_ahead} ${
                    order.queue.orders_ahead === 1 ? "order" : "orders"
                  } ahead of you in line.`}
            </p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-center min-w-[150px] shadow-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Estimated Ready
            </span>
            <span className="text-xl font-black text-emerald-700">
              ~8-12 mins
            </span>
          </div>
        </div>
      )}

      {/* Payment Action Box (When payment is needed) */}
      {order.status === "not_paid" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-800 font-bold text-base mb-1">
                <QrCode className="w-5 h-5 text-amber-600" />
                Submit Payment UTR to Enter Kitchen Queue
              </div>
              <p className="text-xs text-slate-500">
                Kitchen staff will verify your reference number and queue your food for cooking immediately.
              </p>
            </div>
            <PaymentStatusBadge
              status={order.payment?.status || "pending"}
            />
          </div>

          {/* Payment Instructions & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            {/* UPI Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Transfer Amount
              </h3>
              <div className="text-2xl font-black text-slate-900">
                ₹{order.total_amount.toFixed(2)}
              </div>
              {order.payment?.payment_instructions && (
                <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {order.payment.payment_instructions}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Demo UPI VPA:</span>
                <code className="bg-emerald-50 px-2 py-0.5 rounded font-mono text-emerald-800 font-bold border border-emerald-200">
                  keat.canteen@upi
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard("keat.canteen@upi")}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Submission form */}
            <form onSubmit={handleSubmitPaymentReference} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Enter Transaction UTR
              </h3>
              <p className="text-[11px] text-slate-500 leading-tight">
                Enter your 12-digit UPI reference number from GooglePay / PhonePe.
              </p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPI829471928472"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:border-emerald-500 outline-none shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingPayment ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Payment Reference</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {order.payment?.transaction_id && (
            <div className="text-xs text-slate-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span>
                Submitted Reference:{" "}
                <strong className="font-mono text-emerald-800">
                  {order.payment.transaction_id}
                </strong>
              </span>
              <span className="text-amber-700 font-bold">
                Awaiting Counter Verification...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Itemized Receipt Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Itemized Receipt
          </h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                </p>
              </div>
              <span className="font-bold text-slate-900">
                ₹{item.line_total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>₹{order.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Payment Method</span>
            <span className="font-bold uppercase text-slate-900">
              {order.payment?.payment_method || "UPI"}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
            <span>Total Paid / Due</span>
            <span className="text-emerald-700">₹{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {canCancel && (
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? "Cancelling..." : "Cancel This Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
