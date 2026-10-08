import type {
  ApiResponse,
  Cafeteria,
  Category,
  MasterItem,
  MenuItem,
  Order,
  OrderPayment,
  PaginatedResult,
  QueueEntry,
  User,
  UserRole,
} from "../types";
import {
  MOCK_CAFETERIAS,
  MOCK_CATEGORIES,
  MOCK_MASTER_ITEMS,
  MOCK_MENU_ITEMS,
  MOCK_ORDERS,
  MOCK_USERS,
} from "./mockData";

const API_BASE = "/api";
const TOKEN_KEY = "keat_auth_token";
const USER_KEY = "keat_auth_user";
const DEMO_MODE_KEY = "keat_demo_mode";

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeStoredToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};
export const setStoredUser = (user: User): void =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = (): void => localStorage.removeItem(USER_KEY);

export const isDemoMode = (): boolean => {
  const val = localStorage.getItem(DEMO_MODE_KEY);
  return val ? val === "true" : false;
};

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem(DEMO_MODE_KEY, String(enabled));
};

// In-memory mutable storage for Demo mode interactions
let demoCafeterias = [...MOCK_CAFETERIAS];
let demoCategories = [...MOCK_CATEGORIES];
let demoMasterItems = [...MOCK_MASTER_ITEMS];
let demoMenuItems = [...MOCK_MENU_ITEMS];
let demoOrders = [...MOCK_ORDERS];
let demoUsers = [...MOCK_USERS];

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error";
      // If server unreachable and demo mode not yet explicitly disabled, fallback or propagate
      throw new Error(message);
    }
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    if (isDemoMode()) {
      const user = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("Invalid email or password");
      const token = "mock-jwt-token-" + user.id;
      setStoredToken(token);
      setStoredUser(user);
      return { token, user };
    }

    try {
      const res = await this.request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.data.token);
      setStoredUser(res.data.user);
      return res.data;
    } catch (err) {
      // Auto-fallback to mock user if server down
      const user = demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        setDemoMode(true);
        const token = "mock-jwt-token-" + user.id;
        setStoredToken(token);
        setStoredUser(user);
        return { token, user };
      }
      throw err;
    }
  }

  async signup(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "student" | "staff";
  }): Promise<{ token: string; user: User }> {
    if (isDemoMode()) {
      const newUser: User = {
        id: demoUsers.length + 1,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || "student",
        is_active: true,
      };
      demoUsers.push(newUser);
      const token = "mock-jwt-token-" + newUser.id;
      setStoredToken(token);
      setStoredUser(newUser);
      return { token, user: newUser };
    }

    try {
      const res = await this.request<{ token: string; user: User }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setStoredToken(res.data.token);
      setStoredUser(res.data.user);
      return res.data;
    } catch (err) {
      // If server unavailable, register in demo
      const newUser: User = {
        id: demoUsers.length + 1,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role || "student",
        is_active: true,
      };
      demoUsers.push(newUser);
      setDemoMode(true);
      const token = "mock-jwt-token-" + newUser.id;
      setStoredToken(token);
      setStoredUser(newUser);
      return { token, user: newUser };
    }
  }

  async getMe(): Promise<User> {
    if (isDemoMode()) {
      const user = getStoredUser() || demoUsers[0];
      return user;
    }
    try {
      const res = await this.request<User>("/auth/me");
      setStoredUser(res.data);
      return res.data;
    } catch {
      return getStoredUser() || demoUsers[0];
    }
  }

  async updateProfile(data: { name?: string; phone?: string | null }): Promise<User> {
    if (isDemoMode()) {
      const curr = getStoredUser() || demoUsers[0];
      const updated = { ...curr, ...data };
      setStoredUser(updated);
      demoUsers = demoUsers.map((u) => (u.id === updated.id ? updated : u));
      return updated;
    }
    const res = await this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setStoredUser(res.data);
    return res.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (isDemoMode()) return;
    await this.request<null>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // --- Cafeterias ---
  async listCafeterias(params?: {
    search?: string;
    location?: string;
    isOpen?: boolean;
  }): Promise<Cafeteria[]> {
    if (isDemoMode()) {
      let list = demoCafeterias;
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(s) || c.location.toLowerCase().includes(s)
        );
      }
      if (params?.isOpen !== undefined) {
        list = list.filter((c) => c.is_open === params.isOpen);
      }
      return list;
    }

    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.location) query.append("location", params.location);
      if (params?.isOpen !== undefined) query.append("isOpen", String(params.isOpen));

      const res = await this.request<PaginatedResult<Cafeteria> | Cafeteria[]>(
        `/cafeterias?${query.toString()}`
      );
      if (Array.isArray(res.data)) return res.data;
      return (res.data as PaginatedResult<Cafeteria>).items || [];
    } catch {
      return demoCafeterias;
    }
  }

  async getCafeteria(id: number): Promise<Cafeteria> {
    if (isDemoMode()) {
      const cafe = demoCafeterias.find((c) => c.id === id);
      if (!cafe) throw new Error("Cafeteria not found");
      return cafe;
    }
    try {
      const res = await this.request<Cafeteria>(`/cafeterias/${id}`);
      return res.data;
    } catch {
      const cafe = demoCafeterias.find((c) => c.id === id);
      if (!cafe) throw new Error("Cafeteria not found");
      return cafe;
    }
  }

  async createCafeteria(data: Partial<Cafeteria>): Promise<Cafeteria> {
    if (isDemoMode()) {
      const created: Cafeteria = {
        id: demoCafeterias.length + 1,
        name: data.name || "New Cafeteria",
        location: data.location || "Campus",
        image: data.image || null,
        is_open: data.is_open ?? false,
        is_active: true,
        payment_instructions: data.payment_instructions || null,
        created_at: new Date().toISOString(),
      };
      demoCafeterias.push(created);
      return created;
    }
    const res = await this.request<Cafeteria>("/cafeterias", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateCafeteria(id: number, data: Partial<Cafeteria>): Promise<Cafeteria> {
    if (isDemoMode()) {
      demoCafeterias = demoCafeterias.map((c) =>
        c.id === id ? { ...c, ...data } : c
      );
      return demoCafeterias.find((c) => c.id === id)!;
    }
    const res = await this.request<Cafeteria>(`/cafeterias/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async setCafeteriaStatus(id: number, isOpen: boolean): Promise<Cafeteria> {
    if (isDemoMode()) {
      demoCafeterias = demoCafeterias.map((c) =>
        c.id === id ? { ...c, is_open: isOpen } : c
      );
      return demoCafeterias.find((c) => c.id === id)!;
    }
    const res = await this.request<Cafeteria>(`/cafeterias/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOpen }),
    });
    return res.data;
  }

  // --- Menu & Inventory ---
  async getMenu(
    cafeteriaId: number,
    params?: { search?: string; categoryId?: number; availableOnly?: boolean }
  ): Promise<MenuItem[]> {
    if (isDemoMode()) {
      let list = demoMenuItems.filter((m) => m.cafeteria_id === cafeteriaId);
      if (params?.search) {
        const s = params.search.toLowerCase();
        list = list.filter((m) => m.name.toLowerCase().includes(s));
      }
      if (params?.categoryId) {
        list = list.filter((m) => m.category_id === params.categoryId);
      }
      if (params?.availableOnly) {
        list = list.filter((m) => m.is_available && m.stock > 0);
      }
      return list;
    }

    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.categoryId) query.append("categoryId", String(params.categoryId));
      if (params?.availableOnly !== undefined)
        query.append("availableOnly", String(params.availableOnly));

      const res = await this.request<MenuItem[]>(
        `/cafeterias/${cafeteriaId}/menu?${query.toString()}`
      );
      return res.data;
    } catch {
      return demoMenuItems.filter((m) => m.cafeteria_id === cafeteriaId);
    }
  }

  async addMenuItem(
    cafeteriaId: number,
    data: { itemId: number; stock?: number; isAvailable?: boolean; reorderLevel?: number }
  ): Promise<MenuItem> {
    if (isDemoMode()) {
      const master = demoMasterItems.find((i) => i.id === data.itemId);
      const newItem: MenuItem = {
        cafeteria_id: cafeteriaId,
        item_id: data.itemId,
        name: master ? master.name : `Item #${data.itemId}`,
        description: master?.description,
        category_id: master?.category_id || 1,
        category_name: master?.category_name,
        price: master ? master.price : 50,
        image: master?.image,
        stock: data.stock ?? 10,
        is_available: data.isAvailable ?? true,
        reorder_level: data.reorderLevel ?? 5,
      };
      demoMenuItems.push(newItem);
      return newItem;
    }

    const res = await this.request<MenuItem>(`/cafeterias/${cafeteriaId}/menu`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async updateMenuItem(
    cafeteriaId: number,
    itemId: number,
    data: { stock?: number; isAvailable?: boolean; reorderLevel?: number }
  ): Promise<MenuItem> {
    if (isDemoMode()) {
      demoMenuItems = demoMenuItems.map((m) =>
        m.cafeteria_id === cafeteriaId && m.item_id === itemId
          ? {
              ...m,
              ...(data.stock !== undefined && { stock: data.stock }),
              ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
              ...(data.reorderLevel !== undefined && { reorder_level: data.reorderLevel }),
            }
          : m
      );
      return demoMenuItems.find(
        (m) => m.cafeteria_id === cafeteriaId && m.item_id === itemId
      )!;
    }

    const res = await this.request<MenuItem>(
      `/cafeterias/${cafeteriaId}/menu/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    return res.data;
  }

  async setMenuAvailability(
    cafeteriaId: number,
    itemId: number,
    isAvailable: boolean
  ): Promise<void> {
    if (isDemoMode()) {
      demoMenuItems = demoMenuItems.map((m) =>
        m.cafeteria_id === cafeteriaId && m.item_id === itemId
          ? { ...m, is_available: isAvailable }
          : m
      );
      return;
    }
    await this.request<null>(
      `/cafeterias/${cafeteriaId}/menu/${itemId}/availability`,
      {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
      }
    );
  }

  // --- Categories & Items (Master Catalog) ---
  async listCategories(): Promise<Category[]> {
    if (isDemoMode()) return demoCategories;
    try {
      const res = await this.request<Category[]>("/categories");
      return res.data;
    } catch {
      return demoCategories;
    }
  }

  async createCategory(name: string, description?: string): Promise<Category> {
    if (isDemoMode()) {
      const cat: Category = { id: demoCategories.length + 1, name, description };
      demoCategories.push(cat);
      return cat;
    }
    const res = await this.request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
    return res.data;
  }

  async listMasterItems(): Promise<MasterItem[]> {
    if (isDemoMode()) return demoMasterItems;
    try {
      const res = await this.request<PaginatedResult<MasterItem> | MasterItem[]>("/items");
      if (Array.isArray(res.data)) return res.data;
      return (res.data as PaginatedResult<MasterItem>).items || [];
    } catch {
      return demoMasterItems;
    }
  }

  async createMasterItem(data: {
    name: string;
    description?: string;
    categoryId: number;
    price: number;
    image?: string;
  }): Promise<MasterItem> {
    if (isDemoMode()) {
      const cat = demoCategories.find((c) => c.id === data.categoryId);
      const item: MasterItem = {
        id: demoMasterItems.length + 1,
        name: data.name,
        description: data.description,
        category_id: data.categoryId,
        category_name: cat?.name,
        price: data.price,
        image: data.image,
        is_active: true,
      };
      demoMasterItems.push(item);
      return item;
    }
    const res = await this.request<MasterItem>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // --- Orders ---
  async createOrder(data: {
    cafeteriaId: number;
    items: Array<{ itemId: number; quantity: number }>;
    pickupTime: string;
    paymentMethod?: "card" | "cash" | "upi";
  }): Promise<Order> {
    if (isDemoMode()) {
      const cafe = demoCafeterias.find((c) => c.id === data.cafeteriaId);
      const user = getStoredUser() || demoUsers[0];
      let total = 0;
      const orderItems = data.items.map((i) => {
        const item = demoMenuItems.find(
          (m) => m.cafeteria_id === data.cafeteriaId && m.item_id === i.itemId
        );
        const unit_price = item ? item.price : 50;
        const line_total = unit_price * i.quantity;
        total += line_total;
        return {
          item_id: i.itemId,
          name: item ? item.name : `Item #${i.itemId}`,
          quantity: i.quantity,
          unit_price,
          line_total,
        };
      });

      const orderId = demoOrders.length + 101;
      const newOrder: Order = {
        id: orderId,
        user_id: user.id,
        cafeteria_id: data.cafeteriaId,
        cafeteria_name: cafe ? cafe.name : "Cafeteria",
        total_amount: total,
        status: "not_paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pickup_time: data.pickupTime,
        customer_name: user.name,
        customer_email: user.email,
        items: orderItems,
        payment: {
          id: orderId + 100,
          order_id: orderId,
          payment_method: data.paymentMethod || "upi",
          amount: total,
          status: "pending",
          transaction_id: null,
          cafeteria_name: cafe?.name,
          payment_instructions: cafe?.payment_instructions,
        },
        queue: null,
      };

      demoOrders.unshift(newOrder);
      return newOrder;
    }

    const res = await this.request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async listOrders(params?: {
    cafeteriaId?: number;
    status?: string;
  }): Promise<Order[]> {
    if (isDemoMode()) {
      const user = getStoredUser();
      let list = demoOrders;
      if (user?.role === "student" || user?.role === "staff") {
        list = list.filter((o) => o.user_id === user.id);
      } else if (user?.role === "cafe_staff" && params?.cafeteriaId) {
        list = list.filter((o) => o.cafeteria_id === params.cafeteriaId);
      }
      if (params?.status) {
        list = list.filter((o) => o.status === params.status);
      }
      return list;
    }

    try {
      const query = new URLSearchParams();
      if (params?.cafeteriaId) query.append("cafeteriaId", String(params.cafeteriaId));
      if (params?.status) query.append("status", params.status);

      const res = await this.request<PaginatedResult<Order> | Order[]>(
        `/orders?${query.toString()}`
      );
      if (Array.isArray(res.data)) return res.data;
      return (res.data as PaginatedResult<Order>).items || [];
    } catch {
      return demoOrders;
    }
  }

  async getOrder(id: number): Promise<Order> {
    if (isDemoMode()) {
      const ord = demoOrders.find((o) => o.id === id);
      if (!ord) throw new Error("Order not found");
      return ord;
    }
    try {
      const res = await this.request<Order>(`/orders/${id}`);
      return res.data;
    } catch {
      const ord = demoOrders.find((o) => o.id === id);
      if (!ord) throw new Error("Order not found");
      return ord;
    }
  }

  async cancelOrder(id: number): Promise<Order> {
    if (isDemoMode()) {
      demoOrders = demoOrders.map((o) =>
        o.id === id ? { ...o, status: "cancelled" } : o
      );
      return demoOrders.find((o) => o.id === id)!;
    }
    const res = await this.request<Order>(`/orders/${id}/cancel`, {
      method: "PATCH",
    });
    return res.data;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    if (isDemoMode()) {
      demoOrders = demoOrders.map((o) => {
        if (o.id === id) {
          return {
            ...o,
            status: status as any,
            ...(status === "collected" && { queue: null }),
          };
        }
        return o;
      });
      return demoOrders.find((o) => o.id === id)!;
    }
    const res = await this.request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res.data;
  }

  // --- Payments ---
  async getOrderPayment(orderId: number): Promise<OrderPayment> {
    if (isDemoMode()) {
      const ord = demoOrders.find((o) => o.id === orderId);
      if (ord?.payment) return ord.payment;
      throw new Error("Payment not found");
    }
    const res = await this.request<OrderPayment>(`/orders/${orderId}/payment`);
    return res.data;
  }

  async submitPayment(data: {
    orderId: number;
    paymentMethod?: "card" | "cash" | "upi";
    transactionId?: string;
  }): Promise<OrderPayment> {
    if (isDemoMode()) {
      const ord = demoOrders.find((o) => o.id === data.orderId);
      if (ord && ord.payment) {
        ord.payment.status = "pending";
        ord.payment.transaction_id = data.transactionId || null;
        if (data.paymentMethod) ord.payment.payment_method = data.paymentMethod;
        return ord.payment;
      }
      throw new Error("Payment not found");
    }
    const res = await this.request<OrderPayment>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async verifyPayment(
    paymentId: number,
    data: { verified: boolean; transactionId?: string; note?: string }
  ): Promise<OrderPayment> {
    if (isDemoMode()) {
      for (const ord of demoOrders) {
        if (ord.payment && ord.payment.id === paymentId) {
          ord.payment.status = data.verified ? "success" : "failed";
          ord.payment.staff_note = data.note || null;
          if (data.verified) {
            ord.status = "paid";
            ord.queue = {
              queue_item_id: ord.id,
              position: 3,
              orders_ahead: 2,
            };
          }
          return ord.payment;
        }
      }
      throw new Error("Payment not found");
    }
    const res = await this.request<OrderPayment>(`/payments/${paymentId}/verify`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // --- Queue ---
  async getCafeteriaQueue(cafeteriaId: number): Promise<QueueEntry[]> {
    if (isDemoMode()) {
      return demoOrders
        .filter(
          (o) =>
            o.cafeteria_id === cafeteriaId &&
            ["paid", "preparing"].includes(o.status)
        )
        .map((o, idx) => ({
          queue_item_id: o.id,
          order_id: o.id,
          position: idx + 1,
          customer_name: o.customer_name || "Guest",
          total_amount: o.total_amount,
          status: o.status,
          pickup_time: o.pickup_time,
          created_at: o.created_at,
        }));
    }
    try {
      const res = await this.request<QueueEntry[]>(`/cafeterias/${cafeteriaId}/queue`);
      return res.data;
    } catch {
      return [];
    }
  }

  // --- Admin ---
  async listUsers(): Promise<User[]> {
    if (isDemoMode()) return demoUsers;
    try {
      const res = await this.request<PaginatedResult<User> | User[]>("/admin/users");
      if (Array.isArray(res.data)) return res.data;
      return (res.data as PaginatedResult<User>).items || [];
    } catch {
      return demoUsers;
    }
  }

  async updateUserRole(id: number, role: UserRole): Promise<User> {
    if (isDemoMode()) {
      demoUsers = demoUsers.map((u) => (u.id === id ? { ...u, role } : u));
      return demoUsers.find((u) => u.id === id)!;
    }
    const res = await this.request<User>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    return res.data;
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<User> {
    if (isDemoMode()) {
      demoUsers = demoUsers.map((u) => (u.id === id ? { ...u, is_active: isActive } : u));
      return demoUsers.find((u) => u.id === id)!;
    }
    const res = await this.request<User>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    return res.data;
  }

  async getSystemAnalytics(): Promise<{
    totals: { orders: number; revenue: number };
    daily: Array<{ date: string; total_orders: number; total_revenue: number }>;
  }> {
    if (isDemoMode()) {
      return {
        totals: { orders: 48, revenue: 5840 },
        daily: [
          { date: "2026-10-01", total_orders: 8, total_revenue: 950 },
          { date: "2026-10-02", total_orders: 12, total_revenue: 1420 },
          { date: "2026-10-03", total_orders: 9, total_revenue: 1100 },
          { date: "2026-10-04", total_orders: 15, total_revenue: 1850 },
          { date: "2026-10-05", total_orders: 4, total_revenue: 520 },
        ],
      };
    }
    const res = await this.request<any>("/admin/analytics");
    return res.data;
  }
}

export const api = new ApiClient();
