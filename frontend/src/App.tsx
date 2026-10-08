import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";

// Pages
import { Home } from "./pages/Home";
import { CafeteriaMenu } from "./pages/CafeteriaMenu";
import { Checkout } from "./pages/Checkout";
import { OrderDetail } from "./pages/OrderDetail";
import { OrdersList } from "./pages/OrdersList";
import { StaffBoard } from "./pages/StaffBoard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-[#021a14] text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <CartDrawer />

      <main className={`flex-1 ${isHome ? "" : "pt-20 bg-[#fafbfb]"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cafeteria/:id" element={<CafeteriaMenu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/staff" element={<StaffBoard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
