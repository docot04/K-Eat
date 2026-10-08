import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ChevronRight, Sparkles } from "lucide-react";
import { ThreeCanvasFood, type FoodModelType } from "./ThreeCanvasFood";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

interface ShowcaseItem {
  id: number;
  name: string;
  tagline: string;
  price: number;
  modelType: FoodModelType;
  cafeteriaId: number;
  cafeteriaName: string;
  location: string;
  icon: string;
  tabLabel: string;
}

const DISHES: ShowcaseItem[] = [
  {
    id: 101,
    name: "Double Smash Brioche Burger",
    tagline: "Double seared patties, molten aged cheddar & secret sauce on toasted brioche.",
    price: 110.0,
    modelType: "burger",
    cafeteriaId: 2,
    cafeteriaName: "North Campus Bites",
    location: "Engineering Block 3",
    icon: "🍔",
    tabLabel: "Double Burger",
  },
  {
    id: 102,
    name: "Stone-Baked Mozzarella Pizza",
    tagline: "Slow-simmered San Marzano sugo, golden mozzarella & fresh sweet basil.",
    price: 140.0,
    modelType: "pizza",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    icon: "🍕",
    tabLabel: "Artisan Pizza",
  },
  {
    id: 6,
    name: "Artisan Cold Brew with Cream",
    tagline: "Slow-steeped Arabica espresso blend with vanilla whipped cream & cocoa.",
    price: 70.0,
    modelType: "coffee",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    icon: "☕",
    tabLabel: "Cold Brew",
  },
  {
    id: 103,
    name: "Belgian Chocolate Glazed Donut",
    tagline: "Golden brioche ring drenched in 70% dark Belgian ganache & sugar pearls.",
    price: 55.0,
    modelType: "donut",
    cafeteriaId: 3,
    cafeteriaName: "Brew & Bake Cafe",
    location: "Library Courtyard",
    icon: "🍩",
    tabLabel: "Glazed Donut",
  },
  {
    id: 104,
    name: "Mediterranean Salad Platter",
    tagline: "Kalamata olives, crumbled feta, heirloom tomatoes & golden olive oil.",
    price: 95.0,
    modelType: "dish",
    cafeteriaId: 1,
    cafeteriaName: "Central Food Court",
    location: "SAC Ground Floor",
    icon: "🥗",
    tabLabel: "Gourmet Salad",
  },
];

export const Hero3DShowcase: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const { addItem, setIsCartOpen } = useCart();
  const { success } = useToast();

  const currentDish = DISHES[currentIndex];

  // Auto-switch smoothly every 6.5s unless hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DISHES.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Scroll Parallax Tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth Interactive Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  const handleQuickAdd = () => {
    addItem(
      {
        cafeteria_id: currentDish.cafeteriaId,
        item_id: currentDish.id,
        name: currentDish.name,
        price: currentDish.price,
        stock: 50,
        is_available: true,
        reorder_level: 5,
        category_id: 1,
      },
      currentDish.cafeteriaName
    );
    success(`Added ${currentDish.name} to tray!`);
    setIsCartOpen(true);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMouseOffset({ x: 0, y: 0 });
      }}
      className="relative w-full min-h-[720px] lg:min-h-[820px] bg-emerald-couture text-[#f0fdf4] overflow-hidden flex flex-col justify-between select-none pt-24 sm:pt-28 pb-12"
    >
      {/* ======================================================== */}
      {/* 1. FLUID EMERALD SILK AURORA & PARALLAX BACKGROUND      */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Layer 1: Deep Pine Shadow Base with Scroll Parallax */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[800px] bg-gradient-to-b from-[#064e3b]/40 via-[#043327]/30 to-transparent rounded-full blur-[140px] transition-transform duration-700 ease-out"
          style={{
            transform: `translate(-50%, ${scrollY * 0.25}px) translate(${mouseOffset.x * -35}px, ${mouseOffset.y * -25}px)`,
          }}
        />

        {/* Layer 2: Radiant Jade Silk Fold (Flowing Light) */}
        <div
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#10b981]/25 rounded-full blur-[130px] animate-silk-float pointer-events-none"
          style={{
            transform: `translate(${mouseOffset.x * 45}px, ${mouseOffset.y * 35 + scrollY * 0.15}px)`,
          }}
        />

        {/* Layer 3: Shimmering Mint Ripple (Highlight on Silk) */}
        <div
          className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#6ee7b7]/15 rounded-full blur-[120px] animate-silk-ripple pointer-events-none"
          style={{
            transform: `translate(${mouseOffset.x * -40}px, ${mouseOffset.y * -30 + scrollY * 0.2}px)`,
          }}
        />

        {/* Layer 4: Organic Silk Folds Vignette at the Horizon */}
        <div className="absolute -bottom-20 inset-x-0 h-64 bg-gradient-to-t from-[#021a14] via-[#021a14]/80 to-transparent pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* 2. MINIMALIST TOP STATUS STRIP (Pure Breathing Room)     */}
      {/* ======================================================== */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex items-center justify-between text-xs text-[#a7f3d0]/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span className="font-display font-medium tracking-wide text-[#f0fdf4]">
            {currentDish.cafeteriaName}
          </span>
          <span className="text-[#34d399]/40">•</span>
          <span className="text-[#a7f3d0]/70">{currentDish.location}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[#6ee7b7]/90">
          <Sparkles className="w-3.5 h-3.5 text-[#fef08a]" />
          <span>Interactive 3D Turntable</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DEAD-CENTER COUTURE 3D TURNTABLE STAGE               */}
      {/* ======================================================== */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 w-full my-auto flex flex-col items-center justify-center text-center">
        {/* Giant Organic Relief Typography (Drifting in Parallax) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 transition-transform duration-500 ease-out"
          style={{
            transform: `translate(-50%, calc(-50% + ${scrollY * 0.12}px)) translate(${mouseOffset.x * -30}px, ${mouseOffset.y * -20}px)`,
          }}
        >
          <span className="font-display font-black text-[22vw] sm:text-[18vw] text-emerald-300/[0.04] leading-none tracking-tighter uppercase select-none block">
            K-Eat
          </span>
        </div>

        {/* 3D WebGL Canvas with Mouse & Scroll Parallax Float */}
        <div
          className="relative w-80 sm:w-96 md:w-[460px] lg:w-[500px] h-64 sm:h-76 md:h-[350px] lg:h-[380px] flex items-center justify-center transition-transform duration-300 ease-out z-10"
          style={{
            transform: `translate(${mouseOffset.x * 20}px, ${mouseOffset.y * 15 - scrollY * 0.08}px)`,
          }}
        >
          <ThreeCanvasFood
            modelType={currentDish.modelType}
            className="w-full h-full"
          />
        </div>

        {/* ======================================================== */}
        {/* 4. SEAMLESS FLOATING SILK DOCK (Dish Switcher)           */}
        {/* ======================================================== */}
        <div className="mt-2 mb-4 z-20">
          <div className="silk-dock inline-flex items-center gap-1.5 p-1.5 rounded-full">
            {DISHES.map((dish, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={dish.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-display font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 select-none ${
                    isActive
                      ? "silk-pill-active scale-105"
                      : "text-[#a7f3d0]/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-base leading-none">{dish.icon}</span>
                  <span className="hidden sm:inline tracking-tight">
                    {dish.tabLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. MINIMALIST EDITORIAL DISH DETAILS (No Clutter)        */}
        {/* ======================================================== */}
        <div className="max-w-xl mx-auto space-y-3 z-20 text-center">
          {/* Dish Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-white tracking-tight leading-tight drop-shadow-md">
            {currentDish.name}
          </h1>

          {/* Clean Sensuous Tagline */}
          <p className="text-xs sm:text-sm text-[#a7f3d0]/80 max-w-md mx-auto leading-relaxed">
            {currentDish.tagline}
          </p>

          {/* Couture Order Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleQuickAdd}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-[#021a14] font-display font-extrabold rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#021a14]" />
              <span>Add to Tray • ₹{currentDish.price.toFixed(2)}</span>
            </button>

            <Link
              to={`/cafeteria/${currentDish.cafeteriaId}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-950/40 hover:bg-emerald-950/70 text-[#a7f3d0] hover:text-white border border-[#34d399]/20 hover:border-[#34d399]/50 rounded-full font-display font-semibold transition-all text-xs flex items-center justify-center gap-1.5 backdrop-blur-xl"
            >
              <span>Explore Counter Menu</span>
              <ChevronRight className="w-4 h-4 text-[#34d399]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. SUBTLE SILK CAROUSEL INDICATOR (Minimal Dots)         */}
      {/* ======================================================== */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex items-center justify-center gap-2 pt-2">
        {DISHES.map((dish, idx) => (
          <button
            key={dish.id}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
              idx === currentIndex
                ? "w-8 bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                : "w-2 bg-[#064e3b] hover:bg-[#10b981]/50"
            }`}
            title={`Switch to ${dish.name}`}
          />
        ))}
      </div>
    </section>
  );
};
