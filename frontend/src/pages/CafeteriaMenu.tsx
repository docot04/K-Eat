import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  ArrowLeft,
  ShoppingBag,
  Plus,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Cafeteria, Category, MenuItem, QueueEntry } from "../types";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { StockBadge } from "../components/Badge";

export const CafeteriaMenu: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cafeteriaId = Number(id);

  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const { addItem, items, subtotal, itemCount, setIsCartOpen } = useCart();
  const { success } = useToast();

  useEffect(() => {
    if (!cafeteriaId) return;
    loadData();
  }, [cafeteriaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cafeData, catData, menuData, queueData] = await Promise.all([
        api.getCafeteria(cafeteriaId),
        api.listCategories(),
        api.getMenu(cafeteriaId),
        api.getCafeteriaQueue(cafeteriaId),
      ]);
      setCafeteria(cafeData);
      setCategories(catData);
      setMenuItems(menuData);
      setQueue(queueData);
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!cafeteria) return;
    addItem(item, cafeteria.name);
    success(`Added ${item.name} to tray`);
  };

  const getItemQuantityInCart = (itemId: number) => {
    const found = items.find((i) => i.menuItem.item_id === itemId);
    return found ? found.quantity : 0;
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === null || item.category_id === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesAvailability = onlyAvailable
      ? item.is_available && item.stock > 0
      : true;
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8 bg-[#fafbfb] min-h-screen">
        <div className="h-8 bg-slate-200 rounded-xl w-48" />
        <div className="h-44 bg-white rounded-3xl border border-slate-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-40 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!cafeteria) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-[#fafbfb] min-h-screen text-slate-900">
        <h2 className="text-xl font-bold text-slate-800">Cafeteria not found</h2>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cafeterias
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-[#fafbfb] text-slate-900">
      {/* Top Banner & Cafeteria Info */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> All Cafeterias
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {cafeteria.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    cafeteria.is_open
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cafeteria.is_open ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
                    }`}
                  />
                  {cafeteria.is_open ? "Serving Now" : "Currently Closed"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {cafeteria.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Fast pickup counter available
                </span>
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {queue.length} active in kitchen queue
                </span>
              </div>
            </div>

            {cafeteria.payment_instructions && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl max-w-md text-xs text-slate-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-slate-800 mb-0.5">Payment Instructions:</strong>
                  {cafeteria.payment_instructions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Menu Controls Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Search & In-stock toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search food items, drinks, snacks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none shadow-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none self-end sm:self-auto">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>In-stock only</span>
            </label>
          </div>

          {/* Category Tabs / Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === null
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Items ({menuItems.length})
            </button>

            {categories.map((cat) => {
              const count = menuItems.filter((m) => m.category_id === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Item Cards Grid - Unboxed, Fluid Light Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No items match your criteria
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Try switching food categories or clearing search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearch("");
                setOnlyAvailable(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const inCartQty = getItemQuantityInCart(item.item_id);
              const isAvailable = item.is_available && item.stock > 0;

              return (
                <div
                  key={item.item_id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between transform hover:-translate-y-1"
                >
                  <div className="p-5 flex gap-4">
                    {/* Item Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <StockBadge
                          stock={item.stock}
                          isAvailable={item.is_available}
                        />
                        {item.category_name && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {item.category_name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {item.name}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Item Image */}
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-150">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-700 text-xs font-bold bg-emerald-50">
                          Fresh
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart button */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {item.stock > 0 ? `${item.stock} in stock` : "Sold Out"}
                    </span>

                    <button
                      disabled={!isAvailable || !cafeteria.is_open}
                      onClick={() => handleAddToCart(item)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !isAvailable || !cafeteria.is_open
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : inCartQty > 0
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-105"
                      }`}
                    >
                      {inCartQty > 0 ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Added ({inCartQty})</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Tray</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Tray Bar (Visible when tray has items) */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 shadow-md">
                {itemCount}
              </div>
              <div>
                <p className="text-xs text-slate-300 font-medium">Tray Total</p>
                <p className="text-base font-black text-emerald-400">
                  ₹{subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-105 cursor-pointer"
            >
              <span>View Tray & Order</span>
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
