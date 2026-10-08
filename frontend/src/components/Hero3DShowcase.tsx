import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Sparkles,
  Flame,
  Clock,
  Star,
  ChevronRight,
  Copy,
  Check,
  Store,
  ChevronLeft,
} from "lucide-react";
import { ThreeCanvasFood, type FoodModelType } from "./ThreeCanvasFood";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

interface ShowcaseItem {
  id: number;
  name: string;
  backdropWord: string;
  tagline: string;
  category: string;
  price: number;
  modelType: FoodModelType;
  image: string;
  calories: string;
  protein: string;
  prepTime: string;
  rating: string;
  cafeteriaId: number;
  cafeteriaName: string;
  location: string;
  badge: string;
  tabLabel: string;
  icon: string;
}

const HERO_ITEMS: ShowcaseItem[] = [
  {
    id: 101,
    name: "Double Smash Brioche Burger",
    backdropWord: "SMASH",
    tagline:
      "Double seared beef patties, molten cheddar folds, crisp leaf lettuce & tomatoes on toasted seeded brioche.",
    category: "Snacks & Quick Bites",
    price: 110.0,
    modelType: "burger",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=95",
    calories: "580 kcal",
    protein: "28g Protein",
    prepTime: "5 mins",
    rating: "4.9",
    cafeteriaId: 2,
    cafeteriaName: "North Campus Bites",
    location: "Engineering Block 3",
    badge: "Chef's Signature Grill",
    tabLabel: "Double Burger",
    icon: "🍔",
  },
  {
    id: 102,
    name: "Stone-Baked Mozzarella Pizza",
    backdropWord: "PIZZA",
    tagline:
      "Crisp sourdough crust with slow-simmered San Marzano sugo, golden mozzarella & fresh torn sweet basil.",
    category: "Pizzas & Bakes",
    price: 140.0,
    modelType: "pizza",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=95",
    calories: "520 kcal",
    protein: "21g Protein",
    prepTime: "7 mins",
    rating: "4.8",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    badge: "Stone-Oven Favorite",
    tabLabel: "Artisan Pizza",
    icon: "🍕",
  },
  {
    id: 6,
    name: "Artisan Cold Brew with Cream",
    backdropWord: "BREW",
    tagline:
      "Slow-steeped Arabica espresso poured over crystal ice with rich vanilla whipped cream and dark cocoa dust.",
    category: "Beverages & Shakes",
    price: 70.0,
    modelType: "coffee",
    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=95",
    calories: "210 kcal",
    protein: "6g Protein",
    prepTime: "3 mins",
    rating: "4.9",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    badge: "Chilled Refresher",
    tabLabel: "Cold Brew",
    icon: "☕",
  },
  {
    id: 103,
    name: "Belgian Chocolate Glazed Donut",
    backdropWord: "DONUT",
    tagline:
      "Golden fried brioche ring drenched in 70% dark Belgian chocolate ganache with toasted sugar pearls.",
    category: "Bakery & Desserts",
    price: 55.0,
    modelType: "donut",
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=95",
    calories: "280 kcal",
    protein: "5g Protein",
    prepTime: "2 mins",
    rating: "4.9",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    badge: "Bakery Best Seller",
    tabLabel: "Glazed Donut",
    icon: "🍩",
  },
  {
    id: 104,
    name: "Mediterranean Salad Platter",
    backdropWord: "GREENS",
    tagline:
      "Persian cucumbers, Kalamata olives, crushed feta, heirloom tomatoes & golden olive oil dressing.",
    category: "Healthy & Greens",
    price: 95.0,
    modelType: "dish",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=95",
    calories: "340 kcal",
    protein: "14g Protein",
    prepTime: "4 mins",
    rating: "4.8",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    badge: "Crisp & Healthy",
    tabLabel: "Gourmet Salad",
    icon: "🥗",
  },
];

export const Hero3DShowcase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { addItem, setIsCartOpen } = useCart();
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
    navigator.clipboard.writeText("KEATFREE");
    setCopiedCoupon(true);
    info("Coupon code KEATFREE copied! (Flat 50% Off First 5 Orders)");
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
      className="relative w-full min-h-[740px] lg:min-h-[800px] bg-[#141213] text-white overflow-hidden flex flex-col justify-between select-none pt-4 pb-8"
    >
      {/* ======================================================== */}
      {/* 1. ATMOSPHERIC SPOTLIGHT & STAGE DEPTH                   */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Warm Studio Key Light Center Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] sm:h-[600px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-[140px]" />
        {/* Soft edge vignetting */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* 2. TOP PROMOTIONAL STRIP (Campus Dining Context)        */}
      {/* ======================================================== */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-1">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white font-semibold text-[11px] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-display font-bold">K-Eat 3D Stage</span>
          </div>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400 font-medium">
            Live Queue Tokens • SAC & Campus Food Courts
          </span>
        </div>

        {/* Minimal Coupon Badge */}
        <button
          onClick={handleCopyCoupon}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-dashed border-amber-400/80 text-amber-300 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-sm"
        >
          <span className="text-slate-400 text-[11px]">First 5 campus orders:</span>
          <span className="font-mono font-bold text-amber-400 tracking-wider">
            KEATFREE
          </span>
          {copiedCoupon ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 transition-colors" />
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. CURVED BOTTOM STAGE HORIZON (Physical Grounding Arc)  */}
      {/* ======================================================== */}
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140vw] sm:w-[120vw] h-80 sm:h-96 bg-[#0e0c0d] rounded-[50%/100%_100%_0_0] z-0 pointer-events-none"
        style={{
          boxShadow:
            "0 -25px 60px rgba(0,0,0,0.95) inset, 0 -15px 40px rgba(0,0,0,0.85)",
        }}
      />

      {/* ======================================================== */}
      {/* 4. BOLD ARCHITECTURAL WATERMARK (Scale & Energy)         */}
      {/* ======================================================== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden">
        <span
          key={currentItem.backdropWord}
          className="font-display font-black text-[22vw] sm:text-[19vw] text-white/[0.045] leading-none tracking-tighter block uppercase transition-all duration-700 select-none"
          style={{ textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
        >
          {currentItem.backdropWord}
        </span>
      </div>

      {/* ======================================================== */}
      {/* 5. SIDE PEEKING DISH BUTTONS                             */}
      {/* ======================================================== */}
      {/* Left Peeking Dish */}
      <button
        onClick={() => setCurrentIndex(prevIndex)}
        className="hidden lg:flex absolute left-6 xl:left-12 top-1/2 -translate-y-1/2 z-20 flex-col items-center group cursor-pointer transition-transform hover:scale-105"
        title={`Previous: ${prevItem.name}`}
      >
        <div className="relative w-22 h-22 xl:w-26 xl:h-26 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/15 bg-white/5 backdrop-blur-md shadow-2xl group-hover:border-emerald-500/50 transition-colors" />
          <img
            src={prevItem.image}
            alt={prevItem.name}
            className="w-18 h-18 xl:w-22 xl:h-22 object-cover rounded-full shadow-lg border border-white/20 relative z-10"
          />
        </div>
        <span className="text-[11px] font-bold text-slate-400 group-hover:text-white mt-1.5 max-w-[85px] truncate">
          {prevItem.tabLabel}
        </span>
      </button>

      {/* Right Peeking Dish */}
      <button
        onClick={() => setCurrentIndex(nextIndex)}
        className="hidden lg:flex absolute right-6 xl:right-12 top-1/2 -translate-y-1/2 z-20 flex-col items-center group cursor-pointer transition-transform hover:scale-105"
        title={`Next: ${nextItem.name}`}
      >
        <div className="relative w-22 h-22 xl:w-26 xl:h-26 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/15 bg-white/5 backdrop-blur-md shadow-2xl group-hover:border-emerald-500/50 transition-colors" />
          <img
            src={nextItem.image}
            alt={nextItem.name}
            className="w-18 h-18 xl:w-22 xl:h-22 object-cover rounded-full shadow-lg border border-white/20 relative z-10"
          />
        </div>
        <span className="text-[11px] font-bold text-slate-400 group-hover:text-white mt-1.5 max-w-[85px] truncate">
          {nextItem.tabLabel}
        </span>
      </button>

      {/* ======================================================== */}
      {/* 6. DEAD-CENTER 3D TURNTABLE STAGE & FLOATING INGREDIENTS */}
      {/* ======================================================== */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 w-full my-auto flex flex-col items-center justify-center">
        {/* 3D WebGL Model Container */}
        <div className="relative w-76 sm:w-88 md:w-[440px] lg:w-[480px] h-64 sm:h-76 md:h-[350px] lg:h-[380px] flex items-center justify-center">
          <ThreeCanvasFood
            modelType={currentItem.modelType}
            className="w-full h-full"
          />

          {/* Orbiting Floating Ingredients (Natural Accents) */}
          <div
            className="absolute -top-4 -left-6 sm:-left-12 pointer-events-none animate-bounce"
            style={{ animationDuration: "4.5s" }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
              🍃
            </span>
          </div>
          <div
            className="absolute top-10 right-2 sm:-right-8 pointer-events-none animate-bounce"
            style={{ animationDuration: "5.5s" }}
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
              🍃
            </span>
          </div>
          <div
            className="absolute -top-3 right-10 sm:right-16 pointer-events-none animate-bounce"
            style={{ animationDuration: "4.8s" }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
              🍅
            </span>
          </div>
          <div
            className="absolute -bottom-3 -right-6 sm:-right-12 pointer-events-none animate-bounce"
            style={{ animationDuration: "3.8s" }}
          >
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]">
              🌶️
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. SEGMENTED DISH SWITCHER BAR                           */}
        {/* ======================================================== */}
        <div className="mt-1 mb-3 z-20">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl">
            {HERO_ITEMS.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md scale-100"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="hidden sm:inline">{item.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 8. EDITORIAL DISH DETAILS & ORDER ACTIONS                */}
        {/* ======================================================== */}
        <div className="max-w-xl mx-auto space-y-2.5 z-20 text-center">
          {/* Cafeteria Counter Tag */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-slate-200 font-medium text-[11px]">
              <Store className="w-3 h-3 text-amber-400" />
              <span>{currentItem.cafeteriaName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{currentItem.location}</span>
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
              {currentItem.badge}
            </span>
          </div>

          {/* Dish Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white tracking-tight leading-tight">
            {currentItem.name}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {currentItem.tagline}
          </p>

          {/* Inline Nutrition & Speed Metrics Strip */}
          <div className="py-2 flex items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300 font-medium border-y border-white/10 max-w-md mx-auto">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="font-display font-bold text-white">
                {currentItem.calories}
              </span>
              <span className="text-[11px] text-slate-400">({currentItem.protein})</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-bold text-white">
                {currentItem.prepTime}
              </span>
              <span className="text-[11px] text-slate-400">prep</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-display font-bold text-white">
                {currentItem.rating}
              </span>
              <span className="text-[11px] text-slate-400">rated</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleQuickAdd}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-display font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Tray • ₹{currentItem.price.toFixed(2)}</span>
            </button>

            <Link
              to={`/cafeteria/${currentItem.cafeteriaId}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-display font-bold transition-all text-xs flex items-center justify-center gap-1.5 backdrop-blur-md"
            >
              <span>Explore Counter Menu</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. BOTTOM CAROUSEL DOTS & NAV ARROWS                     */}
      {/* ======================================================== */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between pt-3">
        {/* Cafeteria indicator */}
        <div className="text-xs text-slate-400 font-medium">
          <span className="text-white font-bold">{currentItem.cafeteriaName}</span>
          <span className="mx-2 text-slate-600">•</span>
          <span>{currentItem.location}</span>
        </div>

        {/* Carousel Dots & Arrows */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {HERO_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? "w-6 bg-emerald-500"
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
