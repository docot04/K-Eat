import React from "react";
import type { OrderStatus, PaymentStatus } from "../types";

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const configs: Record<
    OrderStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    not_paid: {
      label: "Payment Due",
      bg: "bg-amber-950/60 border-amber-500/30",
      text: "text-amber-300",
      dot: "bg-amber-400",
    },
    paid: {
      label: "Queued",
      bg: "bg-blue-950/60 border-blue-500/30",
      text: "text-blue-300",
      dot: "bg-blue-400",
    },
    preparing: {
      label: "Cooking Now",
      bg: "bg-purple-950/60 border-purple-500/30",
      text: "text-purple-300",
      dot: "bg-purple-400 animate-pulse",
    },
    ready: {
      label: "Ready for Pickup!",
      bg: "bg-emerald-950/80 border-emerald-500/50",
      text: "text-[#05f175]",
      dot: "bg-[#05f175] animate-ping",
    },
    collected: {
      label: "Collected",
      bg: "bg-[#141f18] border-slate-700/40",
      text: "text-slate-400",
      dot: "bg-slate-500",
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-rose-950/60 border-rose-500/30",
      text: "text-rose-400",
      dot: "bg-rose-500",
    },
  };

  const c = configs[status] || configs.not_paid;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({
  status,
}) => {
  const configs: Record<PaymentStatus, { label: string; style: string }> = {
    pending: {
      label: "Pending Verification",
      style: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    },
    success: {
      label: "Verified & Paid",
      style: "bg-emerald-950/80 text-[#05f175] border-emerald-500/40",
    },
    failed: {
      label: "Failed / Rejected",
      style: "bg-rose-950/60 text-rose-300 border-rose-500/30",
    },
    refunded: {
      label: "Refunded",
      style: "bg-[#141f18] text-slate-400 border-slate-700/40",
    },
  };

  const c = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c.style}`}
    >
      {c.label}
    </span>
  );
};

export const StockBadge: React.FC<{ stock: number; isAvailable: boolean }> = ({
  stock,
  isAvailable,
}) => {
  if (!isAvailable || stock <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/30">
        Sold Out
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/30">
        Only {stock} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-[#05f175] border border-emerald-500/30">
      In Stock
    </span>
  );
};
