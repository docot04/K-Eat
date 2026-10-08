import React, { useState, useEffect } from "react";
import {
  ChefHat,
  CheckCircle2,
  Clock,
  Package,
  Power,
  RefreshCw,
  Check,
  Users,
  Store,
  QrCode,
} from "lucide-react";
import type { Cafeteria, MenuItem, Order, QueueEntry } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { OrderStatusBadge, StockBadge } from "../components/Badge";
import { Modal } from "../components/Modal";

export const StaffBoard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "queue">("orders");

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  // Verification modal state
  const [verifyModalOrder, setVerifyModalOrder] = useState<Order | null>(null);
  const [staffNote, setStaffNote] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadCafeterias();
  }, []);

  useEffect(() => {
    if (selectedCafeId) {
      loadCafeData(selectedCafeId);
      const timer = setInterval(() => loadCafeData(selectedCafeId), 10000);
      return () => clearInterval(timer);
    }
  }, [selectedCafeId]);

  const loadCafeterias = async () => {
    try {
      const list = await api.listCafeterias();
      setCafeterias(list);
      if (list.length > 0) {
        const defaultId =
          user?.cafeterias && user.cafeterias.length > 0
            ? user.cafeterias[0].cafeteria_id
            : list[0].id;
        setSelectedCafeId(defaultId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCafeData = async (cafeId: number) => {
    try {
      const [ordList, menuList, qList] = await Promise.all([
        api.listOrders({ cafeteriaId: cafeId }),
        api.getMenu(cafeId),
        api.getCafeteriaQueue(cafeId),
      ]);
      setOrders(ordList);
      setMenuItems(menuList);
      setQueue(qList);
    } catch (err) {
      console.error("Failed to refresh cafe data", err);
    }
  };

  const currentCafe = cafeterias.find((c) => c.id === selectedCafeId);

  const handleToggleCafeOpen = async () => {
    if (!currentCafe) return;
    try {
      const updated = await api.setCafeteriaStatus(
        currentCafe.id,
        !currentCafe.is_open
      );
      setCafeterias((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      success(
        `${currentCafe.name} is now ${updated.is_open ? "OPEN" : "CLOSED"}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle status";
      error(msg);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: Order["status"]) => {
    try {
      await api.updateOrderStatus(orderId, status);
      success(`Order #${orderId} marked as ${status}`);
      if (selectedCafeId) loadCafeData(selectedCafeId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order";
      error(msg);
    }
  };

  const handleConfirmVerification = async (verified: boolean) => {
    if (!verifyModalOrder) return;
    setVerifying(true);
    try {
      await api.verifyPayment(
        verifyModalOrder.payment?.id || verifyModalOrder.id,
        {
          verified,
          note: staffNote.trim() || undefined,
        }
      );

      success(
        verified
          ? `Payment for Order #${verifyModalOrder.id} verified! Queued for cooking.`
          : `Payment for Order #${verifyModalOrder.id} rejected.`
      );
      setVerifyModalOrder(null);
      setStaffNote("");
      if (selectedCafeId) loadCafeData(selectedCafeId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleAdjustStock = async (itemId: number, delta: number) => {
    if (!selectedCafeId) return;
    const item = menuItems.find((i) => i.item_id === itemId);
    if (!item) return;

    const newStock = Math.max(0, item.stock + delta);
    try {
      await api.updateMenuItem(selectedCafeId, itemId, { stock: newStock });
      setMenuItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, stock: newStock } : i))
      );
      success(`Updated ${item.name} stock to ${newStock}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update stock";
      error(msg);
    }
  };

  const handleToggleAvailability = async (
    itemId: number,
    currentAvailable: boolean
  ) => {
    if (!selectedCafeId) return;
    try {
      await api.setMenuAvailability(selectedCafeId, itemId, !currentAvailable);
      setMenuItems((prev) =>
        prev.map((i) =>
          i.item_id === itemId ? { ...i, is_available: !currentAvailable } : i
        )
      );
      success(`Item availability updated`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle availability";
      error(msg);
    }
  };

  const pendingPaymentOrders = orders.filter((o) => o.status === "not_paid");
  const queuedOrders = orders.filter((o) => o.status === "paid");
  const cookingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 bg-[#fafbfb] text-slate-900">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-black">
              <ChefHat className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Kitchen & Cafeteria Console
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Verify UPI payments, manage kitchen order workflow, and adjust live item inventory.
          </p>
        </div>

        {/* Cafeteria Selector & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
            <Store className="w-4 h-4 text-emerald-600 ml-2" />
            <select
              value={selectedCafeId || ""}
              onChange={(e) => setSelectedCafeId(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 outline-none pr-3 py-1 cursor-pointer"
            >
              {cafeterias.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {currentCafe && (
            <button
              onClick={handleToggleCafeOpen}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                currentCafe.is_open
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{currentCafe.is_open ? "Cafeteria OPEN" : "Cafeteria CLOSED"}</span>
            </button>
          )}

          <button
            onClick={() => selectedCafeId && loadCafeData(selectedCafeId)}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Kitchen Board</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {queuedOrders.length + cookingOrders.length + readyOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "queue"
              ? "bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Live Queue Order ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "menu"
              ? "bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Menu & Stock Inventory ({menuItems.length})</span>
        </button>
      </div>

      {/* TAB 1: KITCHEN ORDER BOARD */}
      {activeTab === "orders" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Column 1: Awaiting Payment */}
          <div className="bg-white rounded-3xl p-4 border border-amber-200/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-600" />
                Needs Payment ({pendingPaymentOrders.length})
              </span>
            </div>

            <div className="space-y-3">
              {pendingPaymentOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No orders waiting for payment verification.
                </p>
              ) : (
                pendingPaymentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          #{ord.id} {ord.customer_name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Due: ₹{ord.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        {ord.payment?.payment_method || "UPI"}
                      </span>
                    </div>

                    {ord.payment?.transaction_id ? (
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="text-[10px] text-amber-700 block font-bold">
                          Submitted UTR / Ref:
                        </span>
                        <code className="font-mono font-bold text-emerald-700">
                          {ord.payment.transaction_id}
                        </code>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Customer hasn't submitted UTR yet
                      </p>
                    )}

                    <button
                      onClick={() => setVerifyModalOrder(ord)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Enter Queue</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Queued (Paid) */}
          <div className="bg-white rounded-3xl p-4 border border-blue-200/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Queued ({queuedOrders.length})
              </span>
            </div>

            <div className="space-y-3">
              {queuedOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No orders waiting in queue.
                </p>
              ) : (
                queuedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          #{ord.id} {ord.customer_name}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Pickup:{" "}
                          {new Date(ord.pickup_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{ord.total_amount.toFixed(2)}
                      </span>
                    </div>

                    {ord.items && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium text-slate-700">
                              {it.quantity}x {it.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(ord.id, "preparing")}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Start Cooking →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Cooking */}
          <div className="bg-white rounded-3xl p-4 border border-purple-200/80 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-purple-600" />
                Cooking Now ({cookingOrders.length})
              </span>
            </div>

            <div className="space-y-3">
              {cookingOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No orders currently cooking.
                </p>
              ) : (
                cookingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          #{ord.id} {ord.customer_name}
                        </h4>
                        <span className="text-[11px] text-purple-700 font-bold">
                          In Kitchen
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        ₹{ord.total_amount.toFixed(2)}
                      </span>
                    </div>

                    {ord.items && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium text-slate-700">
                              {it.quantity}x {it.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(ord.id, "ready")}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready for Pickup!</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 4: Ready for Pickup */}
          <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready for Pickup ({readyOrders.length})
              </span>
            </div>

            <div className="space-y-3">
              {readyOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No orders waiting for customer pickup.
                </p>
              ) : (
                readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 shadow-2xs space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-sm text-slate-900">
                          #{ord.id} {ord.customer_name}
                        </h4>
                        <span className="text-[11px] text-emerald-700 font-bold block">
                          Packed & Waiting at Counter
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(ord.id, "collected")}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark Collected & Clear
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE QUEUE ORDER LIST */}
      {activeTab === "queue" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live Kitchen Preparation Sequence
              </h2>
              <p className="text-xs text-slate-500">
                Order priority sequence generated dynamically by the backend queue manager.
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              {queue.length} Active in Queue
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No orders currently in active queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((q) => (
                <div
                  key={q.queue_item_id}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-200">
                      #{q.position}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Order #{q.order_id} - {q.customer_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pickup:{" "}
                        {new Date(q.pickup_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={q.status} />
                    <span className="font-bold text-xs text-slate-900">
                      ₹{q.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENU & STOCK INVENTORY */}
      {activeTab === "menu" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Menu Item Availability & Counter Inventory
              </h2>
              <p className="text-xs text-slate-500">
                Instantly mark items as sold out or update counter stock units.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Item Name</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Current Stock</th>
                  <th className="pb-3">Stock Controls</th>
                  <th className="pb-3">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menuItems.map((item) => (
                  <tr key={item.item_id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StockBadge
                          stock={item.stock}
                          isAvailable={item.is_available}
                        />
                        {item.stock <= item.reorder_level && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⚠️ Low Stock (Reorder at {item.reorder_level})
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 font-bold text-slate-900">
                      ₹{item.price.toFixed(2)}
                    </td>

                    <td className="py-3.5 font-bold text-sm text-slate-900">
                      {item.stock} units
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStock(item.item_id, -5)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 cursor-pointer"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item.item_id, -1)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item.item_id, 1)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item.item_id, 10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 cursor-pointer"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <button
                        onClick={() =>
                          handleToggleAvailability(item.item_id, item.is_available)
                        }
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                          item.is_available
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.is_available ? "Available" : "Disabled / Sold Out"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setVerifyModalOrder(null)}
          title={`Verify Payment for Order #${verifyModalOrder.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">
                  {verifyModalOrder.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Amount:</span>
                <span className="font-black text-emerald-700 text-sm">
                  ₹{verifyModalOrder.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold uppercase text-slate-900">
                  {verifyModalOrder.payment?.payment_method || "UPI"}
                </span>
              </div>
              {verifyModalOrder.payment?.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted UTR:</span>
                  <code className="font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 border border-emerald-200">
                    {verifyModalOrder.payment.transaction_id}
                  </code>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Staff Note (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Verified via merchant UPI app"
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                disabled={verifying}
                onClick={() => handleConfirmVerification(true)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Enter Queue</span>
              </button>

              <button
                type="button"
                disabled={verifying}
                onClick={() => handleConfirmVerification(false)}
                className="py-2.5 px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-all border border-rose-200 disabled:opacity-50 cursor-pointer"
              >
                Reject Payment
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
