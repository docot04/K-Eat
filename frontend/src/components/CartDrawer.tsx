import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Store,
} from "lucide-react";
import { useCart } from "../context/CartContext";

export const CartDrawer: React.FC = () => {
  const {
    items,
    cafeteriaName,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
  } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-900">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Your Food Tray</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cafeteria indicator */}
          {cafeteriaName && (
            <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-medium truncate">
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Counter: <strong className="text-slate-900">{cafeteriaName}</strong>
                </span>
              </div>
              <button
                onClick={clearCart}
                className="text-rose-600 hover:text-rose-700 font-bold shrink-0 ml-2 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-emerald-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-slate-800 mb-1">
                  Your tray is empty
                </p>
                <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
                  Explore menu items from campus food counters and add your favorite dishes!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:scale-105 transition-all cursor-pointer"
                >
                  Explore Counters
                </button>
              </div>
            ) : (
              items.map(({ menuItem, quantity }) => (
                <div
                  key={menuItem.item_id}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-2xl shadow-xs hover:border-emerald-300 transition-all"
                >
                  {menuItem.image ? (
                    <img
                      src={menuItem.image}
                      alt={menuItem.name}
                      className="w-16 h-16 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-150"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                      Food
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {menuItem.name}
                    </h4>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">
                      ₹{menuItem.price.toFixed(2)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(menuItem.item_id, quantity - 1)
                          }
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(menuItem.item_id, quantity + 1)
                          }
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          ₹{(menuItem.price * quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeItem(menuItem.item_id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer checkout bar */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Tray Subtotal</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Tax included. Instant token issued upon UPI reference verification.
              </p>
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] text-xs cursor-pointer"
              >
                <span>Proceed to Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
