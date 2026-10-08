import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Store,
  Users,
  UtensilsCrossed,
  Plus,
  BarChart3,
  Search,
} from "lucide-react";
import type {
  Cafeteria,
  Category,
  MasterItem,
  User,
  UserRole,
} from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/Modal";

export const AdminDashboard: React.FC = () => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<"analytics" | "cafes" | "items" | "users">("analytics");

  // Analytics
  const [analytics, setAnalytics] = useState<{
    totals: { orders: number; revenue: number };
    daily: Array<{ date: string; total_orders: number; total_revenue: number }>;
  } | null>(null);

  // Entities
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Modals
  const [isCafeModalOpen, setIsCafeModalOpen] = useState(false);
  const [cafeForm, setCafeForm] = useState({
    name: "",
    location: "",
    image: "",
    payment_instructions: "",
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    categoryId: 1,
    price: 50,
    image: "",
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [analyticsData, cafes, cats, items, users] = await Promise.all([
        api.getSystemAnalytics(),
        api.listCafeterias(),
        api.listCategories(),
        api.listMasterItems(),
        api.listUsers(),
      ]);
      setAnalytics(analyticsData);
      setCafeterias(cafes);
      setCategories(cats);
      setMasterItems(items);
      setUsersList(users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCafeteria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCafeteria(cafeForm);
      setCafeterias((prev) => [...prev, created]);
      success(`Cafeteria "${created.name}" created!`);
      setIsCafeModalOpen(false);
      setCafeForm({ name: "", location: "", image: "", payment_instructions: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create cafeteria";
      error(msg);
    }
  };

  const handleToggleCafe = async (id: number, currentOpen: boolean) => {
    try {
      const updated = await api.setCafeteriaStatus(id, !currentOpen);
      setCafeterias((prev) => prev.map((c) => (c.id === id ? updated : c)));
      success(`Cafeteria status changed to ${updated.is_open ? "OPEN" : "CLOSED"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change status";
      error(msg);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createMasterItem(itemForm);
      setMasterItems((prev) => [...prev, created]);
      success(`Item "${created.name}" added to master catalog!`);
      setIsItemModalOpen(false);
      setItemForm({
        name: "",
        description: "",
        categoryId: categories[0]?.id || 1,
        price: 50,
        image: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create item";
      error(msg);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      const created = await api.createCategory(categoryName.trim());
      setCategories((prev) => [...prev, created]);
      success(`Category "${created.name}" created!`);
      setIsCategoryModalOpen(false);
      setCategoryName("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      error(msg);
    }
  };

  const handleUpdateRole = async (userId: number, role: UserRole) => {
    try {
      const updated = await api.updateUserRole(userId, role);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      success(`Role for ${updated.name} updated to ${role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      error(msg);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    try {
      const updated = await api.updateUserStatus(userId, !currentActive);
      setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      info(`User ${updated.name} ${updated.is_active ? "activated" : "deactivated"}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user status";
      error(msg);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 bg-[#fafbfb] text-slate-900">
      {/* Title */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              K-Eat Master Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Platform revenue analytics, cafeteria management, master items catalog, and user permissions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("cafes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "cafes"
              ? "bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Cafeterias ({cafeterias.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Master Menu Items ({masterItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs font-extrabold"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles ({usersList.length})</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Platform Revenue
              </span>
              <p className="text-3xl font-black text-emerald-700">
                ₹{analytics?.totals.revenue.toLocaleString() || "5,840"}
              </p>
              <span className="text-[11px] text-emerald-600 font-bold block pt-1">
                ↑ +18.4% this week
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Orders Served
              </span>
              <p className="text-3xl font-black text-slate-900">
                {analytics?.totals.orders || 48} orders
              </p>
              <span className="text-[11px] text-slate-500 block pt-1">
                Completed campus collections
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Dining Counters
              </span>
              <p className="text-3xl font-black text-indigo-700">
                {cafeterias.length} Counters
              </p>
              <span className="text-[11px] text-indigo-600 block pt-1 font-medium">
                {cafeterias.filter((c) => c.is_open).length} currently open
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Campus Accounts
              </span>
              <p className="text-3xl font-black text-slate-900">
                {usersList.length} Students & Staff
              </p>
              <span className="text-[11px] text-slate-500 block pt-1 font-medium">
                SAC, Hostel & Engineering blocks
              </span>
            </div>
          </div>

          {/* Simple Chart Simulation */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Daily Revenue Trend
            </h3>
            <div className="h-44 flex items-end gap-3 pt-4 border-b border-slate-100">
              {analytics?.daily.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                >
                  <span className="text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{d.total_revenue}
                  </span>
                  <div
                    className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                    style={{
                      height: `${Math.min(100, (d.total_revenue / 2000) * 100)}%`,
                    }}
                  />
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAFETERIAS MANAGEMENT */}
      {activeTab === "cafes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">
              Campus Cafeterias
            </h2>
            <button
              onClick={() => setIsCafeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:scale-105 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Cafeteria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafeterias.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.location}</p>
                  </div>
                  <button
                    onClick={() => handleToggleCafe(c.id, c.is_open)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      c.is_open
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {c.is_open ? "Open" : "Closed"}
                  </button>
                </div>

                {c.payment_instructions && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    {c.payment_instructions}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400">ID #{c.id}</span>
                  <button
                    onClick={() => handleToggleCafe(c.id, c.is_open)}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Toggle Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER MENU ITEMS & CATEGORIES */}
      {activeTab === "items" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-base font-bold text-slate-900">
              Master Food Catalog
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                + Add Category
              </button>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:scale-105 transition-all cursor-pointer"
              >
                + Add Master Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Item Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Base Price</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-900">
                      {item.name}
                      {item.description && (
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">
                      {item.category_name || "General"}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-base font-bold text-slate-900">
              Campus Accounts & Roles
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3.5 text-slate-500">
                      {u.phone || "—"}
                    </td>

                    <td className="py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleUpdateRole(u.id, e.target.value as UserRole)
                        }
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff (Faculty)</option>
                        <option value="cafe_staff">Cafe / Kitchen Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_active !== false
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.is_active !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <button
                        onClick={() =>
                          handleToggleUserStatus(u.id, u.is_active !== false)
                        }
                        className="font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                      >
                        {u.is_active !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Cafeteria Modal */}
      {isCafeModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCafeModalOpen(false)}
          title="Create New Campus Cafeteria"
        >
          <form onSubmit={handleCreateCafeteria} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cafeteria Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. South Campus Diner"
                value={cafeForm.name}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Campus Location
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hostel Block B Ground Floor"
                value={cafeForm.location}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, location: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={cafeForm.image}
                onChange={(e) =>
                  setCafeForm({ ...cafeForm, image: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Instructions / UPI ID
              </label>
              <textarea
                placeholder="e.g. Pay via UPI to southdiner@upi"
                value={cafeForm.payment_instructions}
                onChange={(e) =>
                  setCafeForm({
                    ...cafeForm,
                    payment_instructions: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none h-20"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCafeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Save Cafeteria
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Master Item Modal */}
      {isItemModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsItemModalOpen(false)}
          title="Add New Master Menu Item"
        >
          <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Item Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Masala Dosa"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={itemForm.categoryId}
                onChange={(e) =>
                  setItemForm({ ...itemForm, categoryId: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white text-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={itemForm.image}
                onChange={(e) =>
                  setItemForm({ ...itemForm, image: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Ingredients, prep details, allergens..."
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none h-16"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Save Item
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Create New Food Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. South Indian Specials"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
