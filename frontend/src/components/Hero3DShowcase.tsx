import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Check,
  Copy,
  Utensils,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ThreeCanvasFood, type FoodModelType } from "./ThreeCanvasFood";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

interface ShowcaseItem {
  id: number;
  name: string;
  scriptTitle: string;
  tagline: string;
  category: string;
  price: number;
  modelType: FoodModelType;
  image: string;
  cafeteriaId: number;
  cafeteriaName: string;
  location: string;
  badge: string;
  promoText: string;
}

const HERO_ITEMS: ShowcaseItem[] = [
  {
    id: 101,
    name: "Double Smash Brioche Burger",
    scriptTitle: "burger",
    tagline: "Double seared patties, molten cheddar cheese, crisp leaf lettuce & tomatoes",
    category: "Snacks & Quick Bites",
    price: 110.0,
    modelType: "burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=95",
    cafeteriaId: 2,
    cafeteriaName: "North Campus Bites",
    location: "Engineering Block 3",
    badge: "Best burgers in campus",
    promoText: "Buy 1 Get 1 Free",
  },
  {
    id: 102,
    name: "Stone-Baked Mozzarella Pizza",
    scriptTitle: "pizza",
    tagline: "Crisp sourdough crust topped with San Marzano sugo, golden mozzarella & fresh basil",
    category: "Pizzas & Bakes",
    price: 140.0,
    modelType: "pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=95",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    badge: "Stone-Oven Fresh",
    promoText: "Buy 1 Get 1 Free",
  },
  {
    id: 6,
    name: "Artisan Cold Brew Coffee",
    scriptTitle: "coffee",
    tagline: "Slow-steeped Arabica espresso poured over crystal ice with vanilla whipped cream",
    category: "Beverages & Shakes",
    price: 70.0,
    modelType: "coffee",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=95",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    badge: "Chilled Refresher",
    promoText: "Buy 1 Get 1 Free",
  },
  {
    id: 103,
    name: "Belgian Chocolate Glazed Donut",
    scriptTitle: "donut",
    tagline: "Golden fried brioche ring drenched in 70% dark Belgian chocolate ganache",
    category: "Bakery & Desserts",
    price: 55.0,
    modelType: "donut",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=95",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    badge: "Freshly Baked Daily",
    promoText: "Buy 1 Get 1 Free",
  },
  {
    id: 104,
    name: "Mediterranean Salad Platter",
    scriptTitle: "greens",
    tagline: "Persian cucumbers, Kalamata olives, crushed feta, heirloom tomatoes & golden olive oil",
    category: "Healthy & Greens",
    price: 95.0,
    modelType: "dish",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=95",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    badge: "Crisp & Healthy",
    promoText: "Buy 1 Get 1 Free",
  },
];

export const Hero3DShowcase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { addItem, itemCount, setIsCartOpen } = useCart();
  const { success, info } = useToast();

  const currentItem = HERO_ITEMS[currentIndex];
  const prevIndex = (currentIndex - 1 + HERO_ITEMS.length) % HERO_ITEMS.length;
  const nextIndex = (currentIndex + 1) % HERO_ITEMS.length;
  const prevItem = HERO_ITEMS[prevIndex];
  const nextItem = HERO_ITEMS[nextIndex];

  // Automatic Smooth Transition every 6 seconds
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_ITEMS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("FIRSTORDER05");
    setCopiedCoupon(true);
    info("Coupon FIRSTORDER05 copied! (Flat 50% Off First Orders)");
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleQuickAdd = () => {
    addItem(
      {
        cafeteria_id: currentItem.cafeteriaId,
        item_id: currentItem.id,
        name: currentItem.name,
        price: currentItem.price,
        stock: 50,
        is_available: true,
        reorder_level: 5,
        category_id: 1,
        image: currentItem.image,
      },
      currentItem.cafeteriaName
    );
    success(`Added ${currentItem.name} to tray!`);
    setIsCartOpen(true);
  };

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-[720px] lg:min-h-[780px] bg-[#1a1819] text-white overflow-hidden flex flex-col justify-between select-none"
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER NAVIGATION (Exact Match to User Reference) */}
      {/* ======================================================== */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4 flex items-center justify-between">
        {/* Left: Brand Logo in Crimson Red Circle */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-full bg-[#c92a2a] flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <span className="font-script text-2xl font-bold tracking-tight lowercase">
                burger
              </span>
            </div>
          </Link>

          {/* Coupon Code Callout */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
            <span className="font-medium text-slate-400">First 5 order coupn code</span>
            <button
              onClick={handleCopyCoupon}
              className="px-3 py-1 rounded-sm border border-dashed border-amber-400 text-amber-400 font-mono font-bold text-xs tracking-wider hover:bg-amber-400/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>FIRSTORDER05</span>
              {copiedCoupon ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-300" />
              )}
            </button>
          </div>
        </div>

        {/* Right Nav Items & Red Tray Square */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold">
          {/* Active Cart Counter Pill */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-[#c92a2a] text-white font-bold text-[11px] shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
          >
            {itemCount < 10 ? `0${itemCount}` : itemCount}
          </button>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-slate-300 text-xs font-medium">
            <Link to="/" className="text-white hover:text-red-400 transition-colors font-bold">
              Home
            </Link>
            <Link to="/" className="hover:text-white transition-colors">
              Pages
            </Link>
            <Link to="/orders" className="hover:text-white transition-colors">
              Gallery
            </Link>
            <Link to="/staff" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link to="/admin" className="hover:text-white transition-colors">
              Shop
            </Link>
          </nav>

          {/* Search Trigger */}
          <button
            onClick={() => info("Search across campus cafeterias and live tokens")}
            className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Crimson Red Tray Button with Burger/Utensils Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-11 h-11 bg-[#c92a2a] hover:bg-[#b02525] rounded-xl flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open Food Tray"
          >
            <Utensils className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CENTRAL VERTICAL GRAPHIC RUNNER (Signature Stripe)   */}
      {/* ======================================================== */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-14 z-0 pointer-events-none flex flex-col justify-between overflow-hidden">
        {/* Top Candy Stripes */}
        <div className="h-44 sm:h-52 w-full stripe-candy-red shadow-inner opacity-90" />

        {/* Golden Sun Badge */}
        <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-[#f59e0b] self-center my-auto shadow-md border-2 border-white/20" />

        {/* Bottom Green & Red Stripes */}
        <div className="h-44 sm:h-52 w-full stripe-candy-green shadow-inner opacity-90" />
      </div>

      {/* ======================================================== */}
      {/* 3. GIANT WHITE CURSIVE WATERMARK (Exact Reference Style) */}
      {/* ======================================================== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-10 overflow-hidden">
        <span
          key={currentItem.scriptTitle}
          className="font-script text-[22vw] sm:text-[18vw] font-bold text-white leading-none tracking-tight block transition-all duration-700 drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
          style={{ textShadow: "0 10px 40px rgba(0,0,0,0.85)" }}
        >
          {currentItem.scriptTitle}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 4. CURVED BOTTOM STAGE HORIZON                           */}
      {/* ======================================================== */}
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140vw] sm:w-[120vw] h-80 sm:h-96 bg-[#131112] rounded-[50%/100%_100%_0_0] z-10 pointer-events-none"
        style={{
          boxShadow: "0 -20px 60px rgba(0,0,0,0.9) inset, 0 -10px 30px rgba(0,0,0,0.8)",
        }}
      />

      {/* ======================================================== */}
      {/* 5. SIDE PEEKING DISHES (Left & Right)                     */}
      {/* ======================================================== */}
      {/* Left Peeking Dish */}
      <button
        onClick={() => setCurrentIndex(prevIndex)}
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center group cursor-pointer transition-transform hover:scale-105"
        title={`Previous: ${prevItem.name}`}
      >
        <div className="relative w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center">
          {/* Black & White Diagonal Striped Disc */}
          <div className="absolute inset-0 rounded-full stripe-badge-mono shadow-xl transform -rotate-12 group-hover:rotate-0 transition-transform" />
          <img
            src={prevItem.image}
            alt={prevItem.name}
            className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-full shadow-2xl relative z-10 border-2 border-white/20"
          />
        </div>
      </button>

      {/* Right Peeking Dish */}
      <button
        onClick={() => setCurrentIndex(nextIndex)}
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center group cursor-pointer transition-transform hover:scale-105"
        title={`Next: ${nextItem.name}`}
      >
        <div className="relative w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center">
          {/* Black & White Diagonal Striped Disc */}
          <div className="absolute inset-0 rounded-full stripe-badge-mono shadow-xl transform rotate-12 group-hover:rotate-0 transition-transform" />
          <img
            src={nextItem.image}
            alt={nextItem.name}
            className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-full shadow-2xl relative z-10 border-2 border-white/20"
          />
        </div>
      </button>

      {/* ======================================================== */}
      {/* 6. DEAD-CENTER 3D TURNTABLE STAGE & FLOATING INGREDIENTS */}
      {/* ======================================================== */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 w-full my-auto flex flex-col items-center justify-center">
        {/* 3D Canvas Box */}
        <div className="relative w-76 sm:w-88 md:w-[440px] lg:w-[480px] h-64 sm:h-76 md:h-[350px] lg:h-[380px] flex items-center justify-center">
          {/* Real Three.js WebGL Food Model */}
          <ThreeCanvasFood
            modelType={currentItem.modelType}
            className="w-full h-full"
          />

          {/* Orbiting Floating Ingredients (Matching User Image Perfectly) */}
          {/* Fresh Basil Leaves */}
          <div className="absolute -top-6 -left-6 sm:-left-12 pointer-events-none animate-bounce" style={{ animationDuration: "4s" }}>
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🍃</span>
          </div>
          <div className="absolute top-12 right-0 sm:-right-8 pointer-events-none animate-bounce" style={{ animationDuration: "5.5s" }}>
            <span className="text-2xl sm:text-3xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🍃</span>
          </div>

          {/* Red Sliced Tomato */}
          <div className="absolute -top-4 right-10 sm:right-16 pointer-events-none animate-bounce" style={{ animationDuration: "4.8s" }}>
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🍅</span>
          </div>

          {/* Red Hot Chili Pepper */}
          <div className="absolute -top-2 -right-8 sm:-right-14 pointer-events-none animate-bounce" style={{ animationDuration: "3.8s" }}>
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🌶️</span>
          </div>
          <div className="absolute -bottom-2 -left-8 sm:-left-14 pointer-events-none animate-bounce" style={{ animationDuration: "4.2s" }}>
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🌶️</span>
          </div>
          <div className="absolute -bottom-6 left-12 sm:left-20 pointer-events-none animate-bounce" style={{ animationDuration: "5s" }}>
            <span className="text-2xl sm:text-3xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">🍃</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. BOTTOM PROMOTIONAL CALLOUT (Exact Reference Match)    */}
        {/* ======================================================== */}
        <div className="mt-2 sm:mt-4 z-30 flex flex-col items-center gap-3">
          {/* Cursive: Buy 1 [Get 1] Free */}
          <div className="flex items-center gap-3">
            <span className="font-script text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-wide">
              Buy 1
            </span>
            <span className="px-3 py-1 rounded-full bg-[#16a34a] text-white font-display font-black text-xs sm:text-sm shadow-lg tracking-wider uppercase border border-emerald-400/40">
              Get 1
            </span>
            <span className="font-script text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-wide">
              Free
            </span>
          </div>

          {/* White Pill Button: Order Fresh / Best Burgers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAdd}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{currentItem.badge}</span>
              <span className="text-slate-400">•</span>
              <span className="text-red-600 font-extrabold">₹{currentItem.price.toFixed(2)}</span>
              <ShoppingBag className="w-3.5 h-3.5 ml-1 text-slate-900" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. CAROUSEL PAGINATION & ARROWS                          */}
      {/* ======================================================== */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between pb-4">
        {/* Category & Location Indicator */}
        <div className="text-xs text-slate-400 font-medium">
          <span className="text-white font-bold">{currentItem.cafeteriaName}</span>
          <span className="mx-2 text-slate-600">•</span>
          <span>{currentItem.location}</span>
        </div>

        {/* Dots & Nav Arrows */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {HERO_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 bg-red-500"
                    : "w-1.5 bg-slate-600 hover:bg-slate-400"
                }`}
                title={`Switch to ${item.name}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setCurrentIndex(prevIndex)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(nextIndex)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
