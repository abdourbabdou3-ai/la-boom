import React, { useState } from "react";
import {
  Search,
  Heart,
  ShoppingCart,
  ShieldCheck,
  HeadphonesIcon,
  Package,
  Award,
  Truck,
  Crown,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  X,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import BuildYourLookScroll from "./components/BuildYourLookScroll";
import aboutVideo from "../الفيديو الثاني .mp4";
import algeriaCommunes from "../algeria-communes-69-wilayas.json";

import { useStore } from "./StoreContext";
import { wilayasAlgeria } from "./data";

type AlgeriaCommune = (typeof algeriaCommunes)[number];

export default function Storefront() {
  const {
    products,
    setProducts,
    categories,
    orders,
    setOrders,
    shippingPrices,
    setShippingPrices,
    settings,
    setSettings,
    abandonedCartCount,
    setAbandonedCartCount,
    cartItems,
    setCartItems,
    likedProducts,
    setLikedProducts,
  } = useStore();
  const [activeTab, setActiveTab] = useState("home");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartAddedNotice, setCartAddedNotice] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const cartNoticeTimeout = React.useRef<number | null>(null);
  const cartPulseTimeout = React.useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedColorCode, setSelectedColorCode] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (cartNoticeTimeout.current !== null) {
        window.clearTimeout(cartNoticeTimeout.current);
      }
      if (cartPulseTimeout.current !== null) {
        window.clearTimeout(cartPulseTimeout.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (selectedProduct) {
      const prod = products.find((p) => p.id === selectedProduct);
      if (prod) {
        setActiveImage(prod.image);
        setSelectedColorCode(null);
        setSelectedSize(null);
      }
    } else {
      setActiveImage(null);
      setSelectedColorCode(null);
      setSelectedSize(null);
    }
  }, [selectedProduct]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [activePolicyPage, setActivePolicyPage] = useState<
    "faq" | "returns" | "shipping" | null
  >(null);

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    phone: "",
    wilaya: "",
    communeId: "",
    address: "",
    deliveryType: "home",
  });
  const [communeSearch, setCommuneSearch] = useState("");
  const selectedWilayaCode = checkoutForm.wilaya
    ? `${checkoutForm.wilaya.match(/^\d+/)?.[0] || ""}`.padStart(2, "0")
    : "";
  const availableCommunes = selectedWilayaCode
    ? (algeriaCommunes as AlgeriaCommune[])
        .filter((commune) => commune.wilaya_code === selectedWilayaCode)
        .sort((a, b) => a.commune_name.localeCompare(b.commune_name, "ar"))
    : [];
  const filteredCommunes = availableCommunes.filter((commune) =>
    `${commune.commune_name} ${commune.commune_name_ascii}`
      .toLocaleLowerCase()
      .includes(communeSearch.trim().toLocaleLowerCase()),
  );

  const actualLikedProducts = (likedProducts || []).filter((itemId) =>
    products.some((p) => Number(p.id) === Number(itemId))
  );

  const toggleLike = (id: number) => {
    setLikedProducts((prev) => {
      const normalId = Number(id);
      const normalPrev = prev.map(p => Number(p));
      if (normalPrev.includes(normalId)) {
        return prev.filter((pId) => Number(pId) !== normalId);
      } else {
        return [...prev, normalId];
      }
    });
  };

  const getAvailableStock = (product: any, size?: string, color?: string) => {
    const variantSizeStock = product.variantSizeStock || {};
    const sizeStock = product.sizeStock || {};
    const sizes = Array.isArray(product.sizes) ? product.sizes.map(String) : [];
    const variants = Array.isArray(product.colorVariants) ? product.colorVariants : [];
    const hasCombinationStock = variants.some((variant: any) =>
      sizes.some((itemSize: string) => {
        const code = String(variant.colorCode || variant.colorName || "").match(/#[0-9a-f]{3,8}/i)?.[0];
        const key = `${(code || variant.colorCode || variant.colorName || "").trim().toLowerCase()}::${itemSize.trim().toLowerCase()}`;
        return variantSizeStock[key] !== null &&
          variantSizeStock[key] !== undefined &&
          variantSizeStock[key] !== "";
      }),
    );
    const hasSizeStock = sizes.some((itemSize: string) =>
      sizeStock[itemSize] !== null &&
      sizeStock[itemSize] !== undefined &&
      sizeStock[itemSize] !== "",
    );
    const colorCode = color?.match(/#[0-9a-f]{3,8}/i)?.[0];
    const colorKey = (colorCode || color || "").trim().toLowerCase();
    const combinationKey = `${colorKey}::${(size || "").trim().toLowerCase()}`;
    if (size && Object.prototype.hasOwnProperty.call(variantSizeStock, combinationKey)) {
      const quantity = Number(variantSizeStock[combinationKey]);
      return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0;
    }
    if (
      size && hasCombinationStock
    ) {
      return 0;
    }
    if (size && Object.prototype.hasOwnProperty.call(sizeStock, size)) {
      const quantity = Number(sizeStock[size]);
      return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0;
    }
    if (
      size && hasSizeStock
    ) {
      return 0;
    }
    if (color) {
      const variant = product.colorVariants?.find((item: any) => {
        const variantCode = String(item.colorCode || item.colorName || "").toLowerCase();
        return variantCode === colorKey ||
          (colorCode && variantCode === colorCode.toLowerCase());
      });
      if (variant?.stockQty !== null && variant?.stockQty !== undefined && variant.stockQty !== "") {
        const quantity = Number(variant.stockQty);
        return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0;
      }
    }
    return Number(product.stockQty) || 0;
  };

  React.useEffect(() => {
    if (selectedProduct === null) return;
    let isActive = true;
    const refreshInventory = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error(`Failed to refresh product inventory: ${response.status}`);
        const latestProducts = await response.json();
        if (!isActive || !Array.isArray(latestProducts)) return;
        setProducts((currentProducts) =>
          latestProducts.map((latest: any) => {
            const current = currentProducts.find((product) => product.id === latest.id);
            return { ...latest, salesCount: current?.salesCount ?? latest.salesCount };
          }),
        );
      } catch (error) {
        console.error("Failed to refresh selected product inventory", error);
      }
    };
    void refreshInventory();
    const intervalId = window.setInterval(refreshInventory, 15000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [selectedProduct, setProducts]);

  React.useEffect(() => {
    if (selectedProduct === null || !selectedSize) return;
    const product = products.find((item) => item.id === selectedProduct);
    if (!product) return;

    const colorForStock = (() => {
      if (selectedColorCode) {
        const variant = product.colorVariants?.find(
          (item: any) => item.colorCode === selectedColorCode,
        );
        return variant ? `${variant.colorName} (${variant.colorCode})` : selectedColorCode;
      }
      if (product.colorVariants?.length) {
        const variant = product.colorVariants[0];
        return `${variant.colorName} (${variant.colorCode})`;
      }
      return product.colors?.[0] || "";
    })();

    if (getAvailableStock(product, selectedSize, colorForStock) <= 0) {
      setSelectedSize(null);
    }
  }, [products, selectedProduct, selectedSize, selectedColorCode]);

  const addToCart = async (id: number, overrideColor?: string | null, overrideSize?: string | null) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    let chosenColor = overrideColor;
    if (chosenColor === undefined || chosenColor === null) {
      if (selectedProduct === id && selectedColorCode) {
        const variant = product.colorVariants?.find((v: any) => v.colorCode === selectedColorCode);
        chosenColor = variant ? `${variant.colorName} (${variant.colorCode})` : selectedColorCode;
      } else if (product.colorVariants && product.colorVariants.length > 0) {
        chosenColor = `${product.colorVariants[0].colorName} (${product.colorVariants[0].colorCode})`;
      } else if (product.colors && product.colors.length > 0) {
        chosenColor = product.colors[0];
      } else {
        chosenColor = "";
      }
    }

    let chosenSize = overrideSize;
    if (chosenSize === undefined || chosenSize === null) {
      if (selectedProduct === id && selectedSize) {
        chosenSize = selectedSize;
      } else if (product.sizes && product.sizes.length > 0) {
        chosenSize = product.sizes.find(
          (size: string) => getAvailableStock(product, size, chosenColor || "") > 0,
        ) || product.sizes[0];
      } else {
        chosenSize = "";
      }
    }

    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error(`Failed to validate product stock: ${response.status}`);
      const latestProducts = await response.json();
      const liveProduct = Array.isArray(latestProducts)
        ? latestProducts.find((item: any) => item.id === id)
        : null;
      if (!liveProduct) throw new Error("المنتج غير متوفر حاليًا");
      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item.id === id
            ? { ...liveProduct, salesCount: item.salesCount ?? liveProduct.salesCount }
            : item,
        ),
      );

      const availableStock = getAvailableStock(liveProduct, chosenSize || "", chosenColor || "");
      if (availableStock <= 0) {
        if (selectedProduct === id) {
          setSelectedSize(null);
        }
        return;
      }

      const existingCartItem = cartItems.find(
        (item) =>
          item.id === id &&
          item.selectedColor === chosenColor &&
          item.selectedSize === chosenSize,
      );
      if (existingCartItem && existingCartItem.quantity >= availableStock) {
        alert("الكمية المطلوبة غير متوفرة في المخزون");
        return;
      }

      setCartItems((prev) => {
        const existing = prev.find(
          (item) =>
            item.id === id &&
            item.selectedColor === chosenColor &&
            item.selectedSize === chosenSize
        );
        if (existing) {
          if (existing.quantity >= availableStock) {
            alert("الكمية المطلوبة غير متوفرة في المخزون");
            return prev;
          }
          return prev.map((item) =>
            item.id === id &&
            item.selectedColor === chosenColor &&
            item.selectedSize === chosenSize
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            id,
            quantity: 1,
            selectedColor: chosenColor || "",
            selectedSize: chosenSize || "",
          },
        ];
      });
      setCartAddedNotice(true);
      setCartPulse(true);
      if (cartNoticeTimeout.current !== null) {
        window.clearTimeout(cartNoticeTimeout.current);
      }
      if (cartPulseTimeout.current !== null) {
        window.clearTimeout(cartPulseTimeout.current);
      }
      cartNoticeTimeout.current = window.setTimeout(() => {
        setCartAddedNotice(false);
        cartNoticeTimeout.current = null;
      }, 2200);
      cartPulseTimeout.current = window.setTimeout(() => {
        setCartPulse(false);
        cartPulseTimeout.current = null;
      }, 650);
    } catch (error) {
      console.error(`Failed to validate stock for product ${id}`, error);
      alert(error instanceof Error ? error.message : "تعذر التحقق من توفر المنتج");
    }
  };

  const updateCartQuantity = (id: number, delta: number, chosenColor?: string, chosenSize?: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (
          item.id === id &&
          (chosenColor === undefined || item.selectedColor === chosenColor) &&
          (chosenSize === undefined || item.selectedSize === chosenSize)
        ) {
          const product = products.find((p) => p.id === id);
          let newQuantity = item.quantity + delta;
          const availableStock = product
            ? getAvailableStock(product, item.selectedSize, item.selectedColor)
            : 0;
          if (newQuantity > availableStock) {
            alert("الكمية المطلوبة غير متوفرة في المخزون");
            newQuantity = availableStock;
          }
          newQuantity = Math.max(1, newQuantity);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (idToRemove: number, chosenColor?: string, chosenSize?: string) => {
    setAbandonedCartCount((prevCount) => ({
      ...prevCount,
      [idToRemove]: (prevCount[idToRemove] || 0) + 1,
    }));
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === idToRemove &&
            (chosenColor === undefined || item.selectedColor === chosenColor) &&
            (chosenSize === undefined || item.selectedSize === chosenSize)
          )
      )
    );
  };

  const navItems = [
    { name: "الرئيسية", id: "home" },
    { name: "الأقسام", id: "categories" },
    { name: "من نحن", id: "about" },
    { name: "تواصل معنا", id: "contact" },
  ];

  const features = [
    { text: "دفع آمن\nالاستلام", icon: ShieldCheck },
    { text: "خدمة عملاء\n24/7", icon: HeadphonesIcon },
    { text: "إرجاع سهل\nخلال 14 يوم", icon: Package },
    { text: "منتجات مضمونة\n100%", icon: Award },
    { text: "توصيل سريع\nلكل الولايات الجزائرية", icon: Truck },
  ];

  const totalCartPrice = cartItems.reduce((total, item) => {
    const product = products.find((p) => p.id === item.id);
    return total + (product ? product.numericPrice * item.quantity : 0);
  }, 0);

  const extraShippingInfo = React.useMemo(() => {
    let extra = 0;
    let reasons: string[] = [];
    let hasWeightFee = false;
    let hasDimFee = false;
    if (!settings?.shippingRules) return { total: 0, reasons, hasWeightFee, hasDimFee };

    cartItems.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) return;

      if (product.applyWeightRule && settings.shippingRules.weight?.enabled) {
        const weightRule = settings.shippingRules.weight;
        if ((product.weight || 0) > weightRule.maxWeight) {
          const extraKg = Math.ceil(
            (product.weight || 0) - weightRule.maxWeight,
          );
          const fee = extraKg * weightRule.extraPerKg * item.quantity;
          extra += fee;
          reasons.push(`+${fee} د.ج (وزن إضافي: ${product.name})`);
          hasWeightFee = true;
        }
      }

      if (
        product.applyDimensionsRule &&
        settings.shippingRules.dimensions?.enabled
      ) {
        const dimRule = settings.shippingRules.dimensions;
        if (
          (product.length || 0) > dimRule.maxLength ||
          (product.width || 0) > dimRule.maxWidth ||
          (product.height || 0) > dimRule.maxHeight
        ) {
          const fee = dimRule.extraFee * item.quantity;
          extra += fee;
          reasons.push(`+${fee} د.ج (أبعاد كبيرة: ${product.name})`);
          hasDimFee = true;
        }
      }
    });

    return { total: extra, reasons, hasWeightFee, hasDimFee };
  }, [cartItems, products, settings?.shippingRules]);

  const filteredProducts = products.filter((p) => {
    if ((p.stockQty ?? 0) <= 0) return false;
    const query = searchQuery.toLowerCase();
    const searchMatch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query)) ||
      (p.age && p.age.toLowerCase().includes(query));

    const categoryMatch =
      !selectedCategory ||
      (p.category && p.category.includes(selectedCategory)) ||
      p.name.includes(selectedCategory);
    const subcategoryMatch =
      !selectedSubcategory || p.subcategory === selectedSubcategory;

    const isNewArrivalEnabled =
      p.isNewArrival === true ||
      p.isNewArrival === 1 ||
      (typeof p.isNewArrival === "string" &&
        ["true", "1"].includes(p.isNewArrival.trim().toLowerCase()));

    // Filter "وصلنا حديثاً" by isNewArrival if not filtering by category or performing a search query
    const newArrivalMatch =
      selectedCategory || query || isNewArrivalEnabled;

    return searchMatch && categoryMatch && subcategoryMatch && newArrivalMatch;
  });

  const isContactVisible = (key: string, value: unknown) =>
    settings?.contactVisibility?.[key] !== false &&
    typeof value === "string" &&
    value.trim().length > 0;
  const showContactPhone = isContactVisible("phone", settings?.contact?.phone);
  const showContactEmail = isContactVisible("email", settings?.contact?.email);
  const showContactAddress = isContactVisible("address", settings?.contact?.address);
  const showContactMap = isContactVisible("addressUrl", settings?.contact?.addressUrl);
  const showContactInstagram = isContactVisible("instagram", settings?.contact?.instagram);
  const showContactFacebook = isContactVisible("facebook", settings?.contact?.facebook);

  return (
    <div dir="rtl" className="min-h-screen font-body text-[#1A2B4C] pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header Region */}
        <header className="flex flex-wrap md:flex-nowrap items-center justify-between py-4 md:py-6 gap-4 md:gap-6">
          {/* Logo & Mobile Action Bar */}
          <div className="order-1 flex flex-1 items-center md:flex-none">
            {/* Logo */}
            <div 
              className="flex items-center relative cursor-pointer"
              onClick={() => setSelectedProduct(null)}
              dir="ltr"
            >
              <h1
                className="text-3xl md:text-5xl font-black tracking-tight flex items-center gap-1.5"
                style={{ fontWeight: 900 }}
              >
                <span>LA BOOM</span>{" "}
                <span className="relative font-semibold text-2xl md:text-4xl text-[#F15C64] px-1">
                  CLOTHES
                  <span className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 text-yellow-400">
                    <Crown
                      fill="currentColor"
                      size={18}
                      className="stroke-yellow-500 md:w-5 md:h-5"
                    />
                  </span>
                </span>
              </h1>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F15C64"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1.5 mt-1.5 opacity-90 md:w-6 md:h-6"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
          </div>

          {/* Search Bar */}
          <div className="order-3 md:order-2 flex-1 max-w-2xl w-full relative z-[60]">
            <div className="relative flex items-center w-full group">
              <div className="absolute right-4 text-gray-450">
                <Search size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="ابحث عن منتج، قسم، أو مقاس..."
                className="w-full bg-white border border-gray-100 placeholder:text-gray-400 text-[#1A2B4C] rounded-full py-3 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)!important]"
              />

              {/* Search Dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[70] max-h-[20rem] overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        onClick={() => {
                          setSelectedProduct(prod.id);
                          setSearchQuery("");
                          setIsSearchFocused(false);
                        }}
                      >
                        <img
                          src={prod.image || undefined}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1A2B4C] text-sm truncate">
                            {prod.name}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1 truncate">
                            {prod.category} • {prod.age}
                          </p>
                        </div>
                        <div className="text-left whitespace-nowrap">
                          <span
                            className="text-[#F15C64] font-bold text-sm"
                            dir="ltr"
                          >
                            {(prod.numericPrice || 0).toLocaleString()} د.ج
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500 text-sm font-medium">
                      لا توجد منتجات مطابقة لـ "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </header>

        {/* Navigation */}
        <nav className="sticky top-0 z-50 mb-4 flex items-center gap-2 border-b border-gray-150/40 bg-[#FEF8F5]/95 px-1 pt-2 pb-4 backdrop-blur-sm md:mb-4 md:gap-8 md:px-4 md:pb-6">
          <div
            className="order-last flex shrink-0 items-center gap-2"
            aria-label="السلة والمفضلة"
          >
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(true);
                setIsFavoritesOpen(false);
                setIsCheckoutOpen(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#101114] text-[#D8FF3E] shadow-sm transition-transform hover:scale-105 hover:border-[#D8FF3E]/50 active:scale-90 motion-reduce:transition-none"
              aria-label={`فتح السلة، ${cartItems.reduce((total, item) => total + item.quantity, 0)} منتجات`}
            >
              <ShoppingCart
                size={21}
                className={cartPulse ? "animate-bounce motion-reduce:animate-none" : ""}
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#101114] bg-[#D8FF3E] px-1 text-[9px] font-bold text-[#101114]">
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFavoritesOpen(true);
                setIsCartOpen(false);
                setIsCheckoutOpen(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#101114] text-[#C7A27A] shadow-sm transition-transform hover:scale-105 hover:border-[#C7A27A]/50 active:scale-90 motion-reduce:transition-none"
              aria-label={`فتح المفضلة، ${actualLikedProducts.length} منتجات`}
            >
              <Heart
                size={21}
                fill={actualLikedProducts.length > 0 ? "currentColor" : "none"}
              />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#101114] bg-[#C7A27A] px-1 text-[9px] font-bold text-[#101114]">
                {actualLikedProducts.length}
              </span>
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-around gap-1 overflow-x-auto hide-scrollbar md:justify-center md:gap-12">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative whitespace-nowrap px-2 text-sm font-bold transition-all md:px-4 md:text-lg ${activeTab === item.id ? "text-[#1A2B4C]" : "text-gray-500 hover:text-[#1A2B4C]"}`}
              >
                {item.name}
                {activeTab === item.id && (
                  <div className="absolute bottom-[-8px] left-1/2 h-[3px] w-full -translate-x-1/2 rounded-full bg-[#F15C64]"></div>
                )}
              </a>
            ))}
          </div>
        </nav>

        {/* Hero Section: Build Your Look Scroll Experience */}
        <BuildYourLookScroll
          id="home"
          onShopClick={() => {
            document
              .getElementById("products-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Categories Section */}
        <div id="categories" className="pt-8 scroll-mt-20">
          <div className="flex justify-start items-start gap-4 md:gap-8 overflow-x-auto pb-4 snap-x hide-scrollbar px-4 md:px-8">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-3 shrink-0 w-[85px] md:w-[100px] cursor-pointer group snap-center"
                onClick={() => {
                  const newCategory =
                    selectedCategory === cat.keyword ? null : cat.keyword;
                  setSelectedCategory(newCategory);
                  setSelectedSubcategory(null);

                  // If the selected category has no subcategories or we unselected it, scroll to products directly
                  const hasSubcategories =
                    categories.find((c) => c.keyword === cat.keyword)
                      ?.subcategories?.length > 0;
                  if (!newCategory || !hasSubcategories) {
                    document
                      .getElementById("products-section")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <div
                  className={`w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden shadow-sm flex items-center justify-center border-[3px] transition-all duration-300 ${selectedCategory === cat.keyword ? "border-[#F15C64] bg-[#F15C64] scale-105" : "bg-[#FDE9EB] border-white group-hover:border-[#F15C64]/30"}`}
                >
                  <img
                    src={cat.image || undefined}
                    alt={cat.name}
                    className={`w-full h-full object-cover object-top transition-opacity duration-300 ${selectedCategory === cat.keyword ? "opacity-90" : "opacity-100"}`}
                  />
                </div>
                <p
                  className={`text-center font-bold text-sm md:text-base leading-snug whitespace-pre-line transition-colors ${selectedCategory === cat.keyword ? "text-[#F15C64]" : "text-[#1A2B4C]"}`}
                >
                  {cat.name}
                </p>
              </div>
            ))}
          </div>

          {/* Subcategories Section */}
          {(() => {
            if (!selectedCategory) return null;
            const currentCat = categories.find(
              (c) => c.keyword === selectedCategory,
            );
            if (
              !currentCat ||
              !currentCat.subcategories ||
              currentCat.subcategories.length === 0
            )
              return null;

            return (
              <div className="pt-8">
                <div className="flex justify-center items-start gap-4 md:gap-8 overflow-x-auto pb-4 snap-x hide-scrollbar px-4 md:px-8">
                  {currentCat.subcategories.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-3 shrink-0 w-[75px] md:w-[90px] cursor-pointer group snap-center"
                      onClick={() => {
                        setSelectedSubcategory(
                          selectedSubcategory === sub.name ? null : sub.name,
                        );
                        document
                          .getElementById("products-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <div
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-sm flex items-center justify-center border-[2px] transition-all duration-300 ${selectedSubcategory === sub.name ? "border-[#F15C64] bg-[#F15C64] scale-105" : "bg-[#FDE9EB] border-white group-hover:border-[#F15C64]/30"}`}
                      >
                        <img
                          src={sub.image || undefined}
                          alt={sub.name}
                          className={`w-full h-full object-cover object-top transition-opacity duration-300 ${selectedSubcategory === sub.name ? "opacity-90" : "opacity-100"}`}
                        />
                      </div>
                      <p
                        className={`text-center font-bold text-xs md:text-sm leading-snug whitespace-pre-line transition-colors ${selectedSubcategory === sub.name ? "text-[#F15C64]" : "text-[#1A2B4C]"}`}
                      >
                        {sub.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Features Box */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-4 md:p-8 mt-12">
            <div className="grid grid-cols-6 md:flex md:flex-row justify-between items-center gap-x-2 gap-y-4 md:gap-6 md:divide-x md:divide-x-reverse md:divide-gray-100">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-start text-center px-1 gap-2 md:gap-3 md:flex-1 ${
                    idx < 3 ? "col-span-2" : "col-span-3"
                  }`}
                >
                  <div className="text-[#1A2B4C]">
                    <feature.icon strokeWidth={1.5} className="w-8 h-8 md:w-9 md:h-9" />
                  </div>
                  <p className="text-center text-[11px] sm:text-xs md:text-base font-bold whitespace-pre-line leading-tight text-[#1A2B4C]">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16" id="products-section">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1A2B4C]">
                {selectedCategory
                  ? `منتجات قسم: ${selectedCategory}${selectedSubcategory ? ` - ${selectedSubcategory}` : ""}`
                  : "وصلنا حديثاً"}
              </h2>
              <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod, idx) => {
                  const isInCart = cartItems.some(
                    (item) => item.id === prod.id,
                  );
                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-[1.5rem] overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col h-full relative cursor-pointer group"
                      onClick={() => setSelectedProduct(prod.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(prod.id);
                        }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center text-[#1A2B4C] hover:text-[#F15C64] transition-all active:scale-110"
                      >
                        <Heart
                          size={18}
                          fill={
                            likedProducts.some(id => Number(id) === Number(prod.id)) ? "#F15C64" : "none"
                          }
                          color={
                            likedProducts.some(id => Number(id) === Number(prod.id))
                              ? "#F15C64"
                              : "currentColor"
                          }
                        />
                      </button>
                      <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                        <img
                          src={prod.image || undefined}
                          alt="Product Item"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 md:p-5 flex flex-col bg-white relative -mt-4 rounded-t-[1.5rem] z-10 w-full gap-2 border-t border-gray-50">
                        <h3 className="font-bold text-[#1A2B4C] text-sm md:text-base leading-tight truncate">
                          {prod.name}
                        </h3>
                        <div className="flex items-center justify-between w-full">
                          <span
                            className="font-bold text-lg text-[#F15C64]"
                            dir="ltr"
                          >
                            {(prod.numericPrice || 0).toLocaleString()} د.ج
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod.id);
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border focus:outline-none ${isInCart ? "bg-green-100 text-green-500 border-green-100 hover:bg-green-500 hover:text-white" : "bg-[#FDE9EB] text-[#F15C64] border-[#FDE9EB] hover:bg-[#F15C64] hover:text-white"}`}
                          >
                            <ShoppingCart
                              size={20}
                              strokeWidth={2.5}
                              className="mr-0.5"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 md:col-span-4 text-center py-12 text-gray-500 font-medium">
                  لا توجد منتجات مطابقة لبحثك
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div id="about" className="mt-20 pt-8 scroll-mt-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A2B4C]">
              من نحن
            </h2>
            <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div dir="rtl" className="w-full h-full bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6 md:p-10 text-center border border-gray-50">
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-[#F15C64]">
                مرحبًا بكم في LA BOOM CLOTHES!
              </h3>
              {settings?.aboutUs?.split('\n').filter((p: string) => p.trim()).map((paragraph: string, i: number) => (
                  <p key={i} className={`text-gray-600 leading-relaxed md:text-lg mb-6 last:mb-0 ${i === 2 ? "font-bold" : "font-medium"}`}>
                    {paragraph}
                  </p>
              ))}
            </div>
            <div className="w-full h-full min-h-56 md:min-h-0 overflow-hidden rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <video
                src={aboutVideo}
                className="w-full h-full aspect-video md:aspect-auto object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="فيديو تعريفي بمتجر LA BOOM CLOTHES"
              />
            </div>
          </div>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className="mt-20 mb-10 pt-8 scroll-mt-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A2B4C]">
              تواصل معنا
            </h2>
            <div className="h-[2px] w-8 md:w-16 bg-[#F15C64] opacity-30 rounded-full"></div>
          </div>

          {/* Horizontal circles row for small screens only */}
          {(showContactPhone || showContactEmail || showContactMap || showContactInstagram || showContactFacebook) && (
          <div className="flex sm:hidden justify-center items-center gap-4 py-4">
            {showContactPhone && <a
              href={`tel:${settings?.contact?.phone?.replace(/\s/g, '')}`}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-green-100 active:scale-95 transition-transform"
              title="رقم الهاتف"
            >
              <Phone size={24} />
            </a>}

            {showContactEmail && <a
              href={`mailto:${settings?.contact?.email}`}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-red-100 active:scale-95 transition-transform"
              title="البريد الإلكتروني"
            >
              <Mail size={24} />
            </a>}

            {showContactMap && <a
              href={settings?.contact?.addressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-100 active:scale-95 transition-transform"
              title="العنوان"
            >
              <MapPin size={24} />
            </a>}

            {showContactInstagram && <a
              href={settings?.contact?.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg shadow-pink-100 active:scale-95 transition-transform"
              title="إنستغرام"
            >
              <Instagram size={24} />
            </a>}

            {showContactFacebook && <a
              href={settings?.contact?.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0A5BC4] text-white flex items-center justify-center shadow-lg shadow-blue-100 active:scale-95 transition-transform"
              title="فيسبوك"
            >
              <Facebook size={24} />
            </a>}
          </div>
          )}

          {/* Full cards row - hidden on small screens */}
          <div className="hidden sm:flex flex-wrap justify-center gap-6">
            {showContactPhone && <a
              href={`tel:${settings?.contact?.phone?.replace(/\s/g, '')}`}
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-8 border border-gray-50 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-green-200">
                  <Phone size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-[#1A2B4C]">
                  رقم الهاتف
                </h3>
                <p
                  className="text-gray-500 font-medium tracking-wider"
                  dir="ltr"
                >
                  {settings?.contact?.phone}
                </p>
              </div>
            </a>}

            {showContactEmail && <a
              href={`mailto:${settings?.contact?.email}`}
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-8 border border-gray-50 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-pink-500 text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-red-200">
                  <Mail size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-[#1A2B4C]">
                  البريد الإلكتروني
                </h3>
                <p className="text-gray-500 font-medium">
                  {settings?.contact?.email}
                </p>
              </div>
            </a>}

            {(showContactAddress || showContactMap) && <a
              href={showContactMap ? settings?.contact?.addressUrl : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-8 border border-gray-50 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-orange-200">
                  <MapPin size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-[#1A2B4C]">
                  العنوان
                </h3>
                <p className="text-gray-500 font-medium">
                  {showContactAddress ? settings?.contact?.address : "فتح الموقع على الخريطة"}
                </p>
              </div>
            </a>}

            {showContactInstagram && <a
              href={settings?.contact?.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-8 border border-gray-50 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-pink-200">
                  <Instagram size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-[#1A2B4C]">
                  إنستغرام
                </h3>
                <p
                  className="text-gray-500 font-medium tracking-wider"
                  dir="ltr"
                >
                  {settings?.contact?.instagram?.split('/').pop()}
                </p>
              </div>
            </a>}

            {showContactFacebook && <a
              href={settings?.contact?.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-8 border border-gray-50 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300 w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1877F2] to-[#0A5BC4] text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 shadow-lg shadow-blue-200">
                  <Facebook size={32} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-[#1A2B4C]">
                  فيسبوك
                </h3>
                <p
                  className="text-gray-500 font-medium tracking-wider"
                  dir="ltr"
                >
                  {settings?.contact?.facebook?.split('/').pop()}
                </p>
              </div>
            </a>}
          </div>
        </div>

        {/* Footer - Policies and FAQ */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-16 text-center border-t border-[#1A2B4C]/5 mt-10 mb-20 md:mb-6">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={() => setActivePolicyPage("faq")}
              className="text-gray-500 hover:text-[#F15C64] transition-colors font-bold text-lg md:text-base w-full text-center"
            >
              الأسئلة الشائعة
            </button>
            <button
              onClick={() => setActivePolicyPage("returns")}
              className="text-gray-500 hover:text-[#F15C64] transition-colors font-bold text-lg md:text-base w-full text-center"
            >
              سياسة الاسترجاع والاستبدال
            </button>
            <button
              onClick={() => setActivePolicyPage("shipping")}
              className="text-gray-500 hover:text-[#F15C64] transition-colors font-bold text-lg md:text-base w-full text-center"
            >
              سياسة الشحن والتوصيل
            </button>
          </div>
        </div>

        {/* Overlays / Modals */}
        {(isCartOpen || isFavoritesOpen || isCheckoutOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex justify-end"
            onClick={() => {
              setIsCartOpen(false);
              setIsFavoritesOpen(false);
              setIsCheckoutOpen(false);
            }}
          >
            <div
              className="bg-[#FEF8F5] w-full max-w-md h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-200/50 bg-[#FEF8F5]">
                {isCheckoutOpen ? (
                  <>
                    <div className="w-10"></div>
                    <h2 className="text-xl font-bold text-[#1A2B4C]">
                      إتمام الطلب
                    </h2>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[#1A2B4C] hover:bg-gray-200/50 transition-colors"
                    >
                      <ArrowRight size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsFavoritesOpen(false);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#1A2B4C]"
                    >
                      <span className="sr-only">قائمة</span>
                      {/* using a placeholder icon or empty for now matching layout */}
                      <div className="flex flex-col gap-1 w-6">
                        <div className="h-0.5 bg-[#1A2B4C] w-full"></div>
                        <div className="h-0.5 bg-[#1A2B4C] w-full"></div>
                        <div className="h-0.5 bg-[#1A2B4C] w-full"></div>
                      </div>
                    </button>
                    <h2 className="text-xl font-bold text-[#1A2B4C]">
                      {isCartOpen
                        ? `سلة مشترياتك (${cartItems.reduce((acc, item) => acc + item.quantity, 0)})`
                        : "المفضلة"}
                    </h2>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsFavoritesOpen(false);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#1A2B4C] hover:bg-gray-200/50 rounded-full transition-colors"
                    >
                      <ArrowRight size={24} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto w-full">
                {isCheckoutOpen ? (
                  <div className="p-6 flex flex-col gap-6">
                    {/* Customer Info */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-[#1A2B4C] text-lg">
                        معلومات العميل
                      </h3>
                      <input
                        type="text"
                        placeholder="الاسم الكامل"
                        value={checkoutForm.customerName}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64]"
                      />
                      <input
                        type="tel"
                        placeholder="رقم الهاتف"
                        value={checkoutForm.phone}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64]"
                      />
                    </div>

                    {/* State & Address */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-[#1A2B4C] text-lg">
                        الولاية
                      </h3>
                      <select
                        value={checkoutForm.wilaya}
                        onChange={(e) => {
                          setCheckoutForm({
                            ...checkoutForm,
                            wilaya: e.target.value,
                            communeId: "",
                          });
                          setCommuneSearch("");
                        }}
                        className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64] text-gray-700"
                      >
                        <option value="">اختر الولاية...</option>
                        {wilayasAlgeria.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="checkout-commune-search"
                          className="font-bold text-[#1A2B4C] text-sm"
                        >
                          البلدية
                        </label>
                        <input
                          id="checkout-commune-search"
                          type="search"
                          value={communeSearch}
                          onChange={(e) => setCommuneSearch(e.target.value)}
                          placeholder={
                            checkoutForm.wilaya
                              ? "ابحث عن البلدية..."
                              : "اختر الولاية أولاً"
                          }
                          disabled={!checkoutForm.wilaya}
                          className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64] disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <select
                          value={checkoutForm.communeId}
                          onChange={(e) =>
                            setCheckoutForm({
                              ...checkoutForm,
                              communeId: e.target.value,
                            })
                          }
                          disabled={!checkoutForm.wilaya}
                          required
                          aria-label="البلدية"
                          className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64] text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">
                            {checkoutForm.wilaya
                              ? "اختر البلدية..."
                              : "اختر الولاية أولاً"}
                          </option>
                          {filteredCommunes.map((commune) => (
                            <option key={commune.id} value={commune.id}>
                              {commune.commune_name}
                            </option>
                          ))}
                        </select>
                        {checkoutForm.wilaya && availableCommunes.length === 0 && (
                          <p className="text-sm text-red-500">
                            لا تتوفر بلديات مسجلة لهذه الولاية.
                          </p>
                        )}
                      </div>

                      {checkoutForm.wilaya &&
                        (() => {
                          const wInfo = shippingPrices.find(
                            (s) => s.wilaya === checkoutForm.wilaya,
                          );
                          if (!wInfo)
                            return (
                              <div className="text-sm text-red-500">
                                عذراً، الشحن غير متوفر لهذه الولاية حالياً
                              </div>
                            );

                          return (
                            <div className="flex gap-4">
                              <label
                                className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${checkoutForm.deliveryType === "home" ? "border-[#F15C64] bg-red-50" : "border-gray-200"}`}
                              >
                                <input
                                  type="radio"
                                  value="home"
                                  checked={checkoutForm.deliveryType === "home"}
                                  onChange={() =>
                                    setCheckoutForm({
                                      ...checkoutForm,
                                      deliveryType: "home",
                                    })
                                  }
                                  className="sr-only"
                                />
                                <span className="font-bold text-sm">
                                  توصيل للمنزل
                                </span>
                                <span className="text-[#F15C64] font-black">
                                  {wInfo.price} د.ج
                                </span>
                              </label>
                              {wInfo.priceDesk != null && (
                                <label
                                  className={`flex-1 flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${checkoutForm.deliveryType === "desk" ? "border-[#F15C64] bg-red-50" : "border-gray-200"}`}
                                >
                                  <input
                                    type="radio"
                                    value="desk"
                                    checked={
                                      checkoutForm.deliveryType === "desk"
                                    }
                                    onChange={() =>
                                      setCheckoutForm({
                                        ...checkoutForm,
                                        deliveryType: "desk",
                                      })
                                    }
                                    className="sr-only"
                                  />
                                  <span className="font-bold text-sm">
                                    توصيل للمكتب
                                  </span>
                                  <span className="text-[#F15C64] font-black">
                                    {wInfo.priceDesk} د.ج
                                  </span>
                                </label>
                              )}
                            </div>
                          );
                        })()}

                      {/* Weight and Dimension custom conditions display under the Wilaya select / delivery type options */}
                      {cartItems.some((item) => {
                        const product = products.find((p) => p.id === item.id);
                        return product && (
                          (product.applyWeightRule && settings.shippingRules?.weight?.enabled && (product.weight || 0) > 0) ||
                          (product.applyDimensionsRule && settings.shippingRules?.dimensions?.enabled && ((product.length || 0) > 0 || (product.width || 0) > 0 || (product.height || 0) > 0))
                        );
                      }) && (
                        <div className="p-4 bg-[#F2F7FF] rounded-2xl border border-blue-100 flex flex-col gap-3 animate-in slide-in-from-top-2">
                          <span className="text-xs font-black text-blue-800 flex items-center gap-1.5">
                            ⚖️ الميزات والشروط الإضافية لتوصيل هذا الصنف:
                          </span>
                          <div className="space-y-3 text-xs text-gray-600">
                            {cartItems.map((item) => {
                              const product = products.find((p) => p.id === item.id);
                              if (!product) return null;
                              const hasWeight = product.applyWeightRule && settings.shippingRules?.weight?.enabled && (product.weight || 0) > 0;
                              const hasDim = product.applyDimensionsRule && settings.shippingRules?.dimensions?.enabled && ((product.length || 0) > 0 || (product.width || 0) > 0 || (product.height || 0) > 0);
                              if (!hasWeight && !hasDim) return null;

                              const productBaseTotal = product.numericPrice * item.quantity;
                              let weightFee = 0;
                              if (hasWeight) {
                                const weightRule = settings.shippingRules.weight;
                                if ((product.weight || 0) > weightRule.maxWeight) {
                                  const extraKg = Math.ceil((product.weight || 0) - weightRule.maxWeight);
                                  weightFee = extraKg * weightRule.extraPerKg * item.quantity;
                                }
                              }
                              let dimFee = 0;
                              if (hasDim) {
                                const dimRule = settings.shippingRules.dimensions;
                                if (
                                  (product.length || 0) > dimRule.maxLength ||
                                  (product.width || 0) > dimRule.maxWidth ||
                                  (product.height || 0) > dimRule.maxHeight
                                ) {
                                  dimFee = dimRule.extraFee * item.quantity;
                                }
                              }
                              const productFinalTotal = productBaseTotal + weightFee + dimFee;

                              return (
                                <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center font-bold text-[#1A2B4C]">
                                    <span>{product.name} (عدد: {item.quantity})</span>
                                    <span className="text-[#F15C64] font-extrabold" dir="ltr">
                                      {productFinalTotal.toLocaleString()} د.ج
                                    </span>
                                  </div>
                                  
                                  <div className="text-[11px] text-gray-500 space-y-1 mt-0.5 border-t border-gray-50 pt-1.5">
                                    <div className="flex justify-between">
                                      <span>السعر الأساسي للمنتج:</span>
                                      <span dir="ltr">{productBaseTotal.toLocaleString()} د.ج</span>
                                    </div>
                                    {hasWeight && (
                                      <div className="flex justify-between">
                                        <span>شرط الوزن ({product.weight} كغ):</span>
                                        {weightFee > 0 ? (
                                          <span className="text-red-500 font-bold" dir="ltr">+{weightFee.toLocaleString()} د.ج</span>
                                        ) : (
                                          <span className="text-green-600 font-medium">سليم (لا يتجاوز حد الوزن)</span>
                                        )}
                                      </div>
                                    )}
                                    {hasDim && (
                                      <div className="flex justify-between">
                                        <span>شرط الأبعاد (طول {product.length} × عرض {product.width} × ارتفاع {product.height} سم):</span>
                                        {dimFee > 0 ? (
                                          <span className="text-red-500 font-bold" dir="ltr">+{dimFee.toLocaleString()} د.ج</span>
                                        ) : (
                                          <span className="text-green-600 font-semibold">سليم (ضمن نطاق الأبعاد)</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed border-t border-blue-50/30 pt-1.5">
                            💡 <strong>تعليل بسيط:</strong> نقوم بحساب الأوزان والأبعاد لكي نضمن تعبئتها بطرق تعبئة آمنة للمنتجات الكبيرة والثقيلة لتجنب الأضرار وضمان خدمة شحن آمنة وموثوقة. الحساب يجمع ويوضح لك التكلفة الإجمالية بدقة.
                          </p>
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="بالتفصيل بالتفصيل"
                        value={checkoutForm.address}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            address: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl p-4 bg-white text-sm focus:outline-none focus:border-[#F15C64]"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-bold text-[#1A2B4C] text-lg">
                        طريقة الدفع
                      </h3>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center justify-between p-4 border border-gray-200 bg-white rounded-xl cursor-pointer">
                          <span className="text-sm font-medium text-gray-600">
                            الدفع عند الاستلام
                          </span>
                          <div className="w-5 h-5 rounded-full bg-[#1A2B4C] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Embedded summary & action total calculation inside form avoiding overlapping panels */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">سعر المنتجات</span>
                        <span className="font-bold text-[#1A2B4C]" dir="ltr">
                          {totalCartPrice.toLocaleString()} د.ج
                        </span>
                      </div>

                      {(() => {
                        const w = shippingPrices.find(
                          (s) => s.wilaya === checkoutForm.wilaya,
                        );
                        const baseShippingText = w
                          ? (checkoutForm.deliveryType === "desk"
                              ? w.priceDesk || 0
                              : w.price
                            ).toLocaleString() + " د.ج"
                          : "يحدد لاحقاً";
                        return (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">سعر التوصيل الأساسي</span>
                            <span className="font-bold text-[#1A2B4C]" dir="ltr">
                              {baseShippingText}
                            </span>
                          </div>
                        );
                      })()}

                      {extraShippingInfo.total > 0 && (
                        <div className="pt-2 border-t border-dashed border-gray-200">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <span className="text-red-500 font-bold">
                              {extraShippingInfo.hasWeightFee && extraShippingInfo.hasDimFee
                                ? "رسوم شحن إضافية (وزن وأبعاد)"
                                : extraShippingInfo.hasWeightFee
                                ? "رسوم شحن إضافية (وزن)"
                                : "رسوم شحن إضافية (أبعاد)"}
                            </span>
                            <span className="font-bold text-red-500" dir="ltr">
                              +{extraShippingInfo.total.toLocaleString()} د.ج
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-[#1A2B4C]">الإجمالي النهائي</span>
                        <span className="font-black text-xl text-[#F15C64]" dir="ltr">
                          {(() => {
                            const w = shippingPrices.find(
                              (s) => s.wilaya === checkoutForm.wilaya,
                            );
                            const c = w
                              ? checkoutForm.deliveryType === "desk"
                                ? w.priceDesk || 0
                                : w.price
                              : 0;
                            return (totalCartPrice + c + extraShippingInfo.total).toLocaleString() + " د.ج";
                          })()}
                        </span>
                      </div>

                      <button
                        onClick={async () => {
                          if (
                            !checkoutForm.customerName ||
                            !checkoutForm.phone ||
                            !checkoutForm.wilaya ||
                            !checkoutForm.communeId
                          ) {
                            alert("يرجى ملء جميع الحقول المطلوبة واختيار البلدية");
                            return;
                          }

                          const selectedCommune = availableCommunes.find(
                            (commune) =>
                              String(commune.id) === checkoutForm.communeId,
                          );
                          if (!selectedCommune) {
                            alert("البلدية المختارة لا تتبع الولاية المحددة");
                            return;
                          }

                          const wInfo = shippingPrices.find(
                            (s) => s.wilaya === checkoutForm.wilaya,
                          );
                          const shippingCost = wInfo
                            ? checkoutForm.deliveryType === "desk"
                              ? wInfo.priceDesk || 0
                              : wInfo.price
                            : 0;
                          const finalShippingCost =
                            shippingCost + extraShippingInfo.total;

                          const orderSuffix = Array.from(
                            crypto.getRandomValues(new Uint8Array(8)),
                            (value) => value.toString(16).padStart(2, "0"),
                          ).join("");
                          const orderId = `boom-${new Date().getFullYear()}-${settings.nextOrderNumber}-${orderSuffix}`;
                          const newOrder = {
                            id: orderId,
                            customerName: checkoutForm.customerName,
                            phone: checkoutForm.phone,
                            wilaya: checkoutForm.wilaya,
                            wilayaCode: selectedCommune.wilaya_code,
                            communeId: selectedCommune.id,
                            commune: selectedCommune.commune_name,
                            communeNameAscii: selectedCommune.commune_name_ascii,
                            address: checkoutForm.address,
                            deliveryType: checkoutForm.deliveryType,
                            total: totalCartPrice + finalShippingCost,
                            items: cartItems.length,
                            cartItems: cartItems.map(item => {
                              const prod = products.find(p => p.id === item.id);
                              let variantImg = prod?.image;
                              if (prod?.colorVariants && item.selectedColor) {
                                const matchedVar = prod.colorVariants.find((v:any) => 
                                  v.colorCode === item.selectedColor || 
                                  `${v.colorName} (${v.colorCode})` === item.selectedColor
                                );
                                if (matchedVar && matchedVar.image) {
                                  variantImg = matchedVar.image;
                                }
                              }
                              return {
                                ...item,
                                productName: prod?.name,
                                productImage: variantImg,
                                numericPrice: prod?.numericPrice,
                                costPrice: prod?.costPrice,
                                category: prod?.category
                              };
                            }), // Save full detail of cart items so we can refund them and keep history!
                            status: "pending",
                            inventoryState: "not_deducted",
                            date: new Date().toISOString().split("T")[0],
                          };

                          try {
                            const response = await fetch("/api/orders", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(newOrder),
                            });
                            const result = await response.json();
                            if (!response.ok) {
                              if (response.status === 409) {
                                const productsResponse = await fetch("/api/products");
                                if (productsResponse.ok) {
                                  const latestProducts = await productsResponse.json();
                                  if (Array.isArray(latestProducts)) setProducts(latestProducts);
                                }
                                setSelectedSize(null);
                              } else if (response.status === 422) {
                                const [productsResponse, settingsResponse] = await Promise.all([
                                  fetch("/api/products"),
                                  fetch("/api/settings"),
                                ]);
                                if (productsResponse.ok) {
                                  const latestProducts = await productsResponse.json();
                                  if (Array.isArray(latestProducts)) setProducts(latestProducts);
                                }
                                if (settingsResponse.ok) {
                                  const latestSettings = await settingsResponse.json();
                                  if (Array.isArray(latestSettings.shippingPrices)) {
                                    setShippingPrices(latestSettings.shippingPrices);
                                  }
                                  if (latestSettings.settings) {
                                    setSettings((current) => ({
                                      ...current,
                                      ...latestSettings.settings,
                                    }));
                                  }
                                }
                              }
                              throw new Error(result.error || `تعذر حفظ الطلب (${response.status})`);
                            }
                          } catch (error) {
                            console.error(`Failed to create order ${newOrder.id}`, error);
                            alert(error instanceof Error ? error.message : "تعذر حفظ الطلب");
                            return;
                          }

                          setOrders((prev) => [newOrder, ...prev]);

                          setLastOrderId(newOrder.id);
                          setSettings({
                            ...settings,
                            nextOrderNumber: settings.nextOrderNumber + 1,
                          });

                          // Keep the local sales count while inventory remains available until confirmation.
                          setProducts(products.map((p) => {
                            const cartItem = cartItems.find(
                              (item) => item.id === p.id,
                            );
                            return cartItem
                              ? { ...p, salesCount: (p.salesCount || 0) + cartItem.quantity }
                              : p;
                          }));

                          setCartItems([]);
                          setIsCheckoutOpen(false);
                          setIsOrderSuccess(true);
                        }}
                        className="w-full bg-[#1A2B4C] text-white py-3.5 rounded-xl font-bold text-base hover:bg-opacity-90 transition-all font-sans relative overflow-hidden group mt-2 shadow-sm cursor-pointer"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          تأكيد الطلب وبدء الشحن
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 md:p-6 flex flex-col gap-4">
                    {isCartOpen &&
                      (cartItems.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                          السلة فارغة
                        </div>
                      ) : (
                        cartItems.map((cartItem, idx) => {
                          const product = products.find(
                            (p) => p.id === cartItem.id,
                          );
                          if (!product) return null;
                          return (
                            <div
                              key={`${cartItem.id}-${cartItem.selectedColor || ""}-${cartItem.selectedSize || ""}-${idx}`}
                              className="flex bg-white p-3 rounded-[1.5rem] border border-gray-100 shadow-sm gap-4 items-center animate-in slide-in-from-bottom-2"
                            >
                              <img
                                src={(() => {
                                  if (product.colorVariants && cartItem.selectedColor) {
                                    const matchedVar = product.colorVariants.find((v:any) => 
                                      v.colorCode === cartItem.selectedColor || 
                                      `${v.colorName} (${v.colorCode})` === cartItem.selectedColor
                                    );
                                    if (matchedVar && matchedVar.image) {
                                      return matchedVar.image;
                                    }
                                  }
                                  return product.image;
                                })()}
                                className="w-24 h-24 object-cover rounded-xl bg-gray-50 shrink-0"
                              />
                              <div className="flex-1 flex flex-col py-1">
                                <h4 className="font-bold text-[#1A2B4C] mb-1 text-sm md:text-base">
                                  {product.name}
                                </h4>

                                {/* Display color and size chosen if present */}
                                <div className="flex flex-wrap gap-1.5 mb-2 font-sans">
                                  {cartItem.selectedColor && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-50 text-[#1A2B4C] px-2 py-0.5 rounded-lg border border-gray-100">
                                      <span className="w-2 h-2 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: cartItem.selectedColor.includes('#') ? cartItem.selectedColor.substring(cartItem.selectedColor.indexOf('#')).replace(')', '') : cartItem.selectedColor }} />
                                      {cartItem.selectedColor.includes('(') ? cartItem.selectedColor.substring(0, cartItem.selectedColor.indexOf('(')).trim() : cartItem.selectedColor}
                                    </span>
                                  )}
                                  {cartItem.selectedSize && (
                                    <span className="text-[10px] font-bold bg-red-50 text-[#F15C64] px-2 py-0.5 rounded-lg border border-[#FDE9EB]">
                                      مقاس: {cartItem.selectedSize}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="text-[#1A2B4C] font-black text-sm mb-3 w-fit"
                                  dir="ltr"
                                >
                                  {(
                                    product.numericPrice * cartItem.quantity
                                  ).toLocaleString()}{" "}
                                  د.ج
                                </p>

                                <div className="flex items-center w-fit border border-gray-200 rounded-lg overflow-hidden h-8">
                                  <button
                                    onClick={() =>
                                      updateCartQuantity(cartItem.id, -1, cartItem.selectedColor, cartItem.selectedSize)
                                    }
                                    className="w-8 h-full flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold text-sm text-[#1A2B4C]">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateCartQuantity(cartItem.id, 1, cartItem.selectedColor, cartItem.selectedSize)
                                    }
                                    className="w-8 h-full flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="pl-2 h-full flex items-center justify-center">
                                <button
                                  onClick={() => removeFromCart(cartItem.id, cartItem.selectedColor, cartItem.selectedSize)}
                                  className="p-2 text-gray-400 hover:text-[#F15C64] transition-colors cursor-pointer"
                                >
                                  <Trash2 size={22} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ))}

                    {isFavoritesOpen &&
                      (actualLikedProducts.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                          لا توجد منتجات في المفضلة
                        </div>
                      ) : (
                        actualLikedProducts.map((itemId) => {
                          const product = products.find((p) => Number(p.id) === Number(itemId));
                          if (!product) return null;
                          return (
                            <div
                              key={itemId}
                              className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-gray-100 shadow-sm"
                            >
                              <img
                                src={product.image}
                                className="w-20 h-20 object-cover rounded-xl bg-gray-50 shrink-0"
                              />
                              <div className="flex-1">
                                <h4 className="font-bold text-[#1A2B4C] mb-1">
                                  {product.name}
                                </h4>
                                <p
                                  className="text-[#F15C64] font-bold"
                                  dir="ltr"
                                >
                                  {(product.numericPrice || 0).toLocaleString()} د.ج
                                </p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => toggleLike(itemId)}
                                  className="text-[#F15C64] p-2 hover:bg-gray-50 rounded-full transition-colors"
                                >
                                  <Heart size={20} fill="#F15C64" />
                                </button>
                                <button
                                  onClick={() => addToCart(itemId)}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${cartItems.some((i) => i.id === itemId) ? "bg-green-100 text-green-500 hover:bg-green-500 hover:text-white" : "bg-[#FDE9EB] text-[#F15C64] hover:bg-[#F15C64] hover:text-white"}`}
                                >
                                  <ShoppingCart size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ))}
                  </div>
                )}
              </div>

              {!isCheckoutOpen && isCartOpen && cartItems.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] mt-auto rounded-t-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-gray-500">
                      المجموع الكلي
                    </span>
                    <span
                      className="font-black text-xl text-[#F15C64]"
                      dir="ltr"
                    >
                      {totalCartPrice.toLocaleString()} د.ج
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-[#1A2B4C] text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all mb-3"
                  >
                    إتمام الطلب
                  </button>
                </div>
              )}

              {/* No sticky redundant isCheckoutOpen block here */}
            </div>
          </div>
        )}

        {/* Order Success Modal */}
        {isOrderSuccess && (
          <div
            className="fixed inset-0 bg-black/50 z-[120] flex justify-end"
            onClick={() => setIsOrderSuccess(false)}
          >
            <div
              className="bg-[#FEF8F5] w-full max-w-md h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between bg-[#FEF8F5]">
                <div className="w-10"></div>
                <h2 className="text-lg font-bold text-[#1A2B4C]">
                  8 تأكيد الطلب
                </h2>
                <button
                  onClick={() => setIsOrderSuccess(false)}
                  className="w-10 h-10 flex items-center justify-center text-[#1A2B4C] hover:bg-gray-200/50 rounded-full transition-colors"
                >
                  <ArrowRight size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto w-full p-6 flex flex-col items-center pt-10">
                <div className="w-24 h-24 bg-[#F15C64] text-white rounded-full flex items-center justify-center mb-6 shadow-md shadow-[#F15C64]/20 flex-shrink-0">
                  <Check size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-[#F15C64] mb-8 text-center leading-relaxed">
                  تم تأكيد طلبك بنجاح!
                </h2>

                <h3 className="font-bold text-[#1A2B4C] mb-3">رقم الطلب</h3>
                <div
                  className="bg-[#FDE9EB] text-[#F15C64] font-bold text-lg md:text-xl py-3 px-8 rounded-xl mb-12"
                  dir="ltr"
                >
                  #{lastOrderId}
                </div>

                <p className="text-gray-500 font-bold mb-10 text-center">
                  شكراً لتسوقك من متجر LA BOOM CLOTHES
                </p>

                <div className="w-full flex flex-col gap-4 mt-auto mb-10">
                  <button
                    onClick={() => setIsOrderSuccess(false)}
                    className="w-full bg-[#1A2B4C] text-white py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg"
                  >
                    متابعة التسوق
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Policy Modal */}
        {activePolicyPage && (
          <div
            className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setActivePolicyPage(null)}
          >
            <div
              className="bg-white p-6 md:p-10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <button
                onClick={() => setActivePolicyPage(null)}
                className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>

              {activePolicyPage === "faq" && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1A2B4C] mb-8 border-b border-gray-100 pb-4">
                    الأسئلة الشائعة
                  </h2>
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        كيف يمكنني الطلب؟
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        يمكنك تصفح المنتجات في المتجر، إضافة ما يعجبك إلى سلة
                        المشتريات، ثم الذهاب إلى السلة والضغط على "إتمام الطلب"
                        وتعبئة البيانات الخاصة بك. سنتصل بك لتأكيد طلبك في أقرب
                        وقت.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        هل يتوفر لديكم الشحن لجميع الولايات؟
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        نعم، نوفر خدمة الشحن السريع والمضمون إلى جميع ولايات
                        الجزائر الـ 58، مع إمكانية التوصيل حتى باب المنزل أو إلى
                        مكتب شركة الشحن.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        كيف يمكنني الدفع؟
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        نحن نوفر خدمة الدفع عند الاستلام كطريقة دفع أساسية، حيث
                        تدفع فقط عند استلام طلبك ومعاينته لضمان راحتك ورضاك.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePolicyPage === "returns" && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1A2B4C] mb-8 border-b border-gray-100 pb-4">
                    سياسة الاسترجاع والاستبدال
                  </h2>
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        شروط الاستبدال والاسترجاع
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        يحق لعملائنا الكرام استبدال أو إرجاع المنتجات خلال 7
                        أيام من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته
                        الأصلية، غير مستخدم، ومحتفظاً بغلافه وبطاقة السعر
                        الأصلية.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        طريقة طلب الاستبدال أو الإرجاع
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        يرجى التواصل مع خدمة العملاء عبر أرقام الهاتف المتوفرة
                        أو عبر صفحاتنا على وسائل التواصل الاجتماعي والتزويد برقم
                        الطلب مع صور للمنتج لتسهيل العملية ومراجعة الطلب.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        تكاليف الشحن وتفاصيل أخرى
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        في حالة كان الخطأ من متجرنا (مثل إرسال منتج خاطئ أو
                        تالف)، نتحمل نحن تكاليف الشحن بالكامل. أما في حال كان
                        الاستبدال بناءً على رغبة العميل (مثل تغيير المقاس أو
                        اللون رغم استلام الطلب الصحيح)، فيتحمل العميل رسوم الشحن
                        المرتبطة بالاستبدال.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePolicyPage === "shipping" && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1A2B4C] mb-8 border-b border-gray-100 pb-4">
                    سياسة الشحن والتوصيل
                  </h2>
                  <div className="space-y-8">
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        مدة التوصيل
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        تستغرق عملية التوصيل داخل ولاية الجزائر العاصمة عادةً من
                        24 إلى 48 ساعة. أما باقي ولايات الوطن فتتراوح المدة بين
                        2 إلى 5 أيام عمل تقريباً، وذلك حسب مسافة الولاية وسرعة
                        شركة الشحن.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        شركات الشحن
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        نتعامل مع أفضل وأوثق وكالات الشحن في الجزائر لضمان وصول
                        طلبياتكم بسرعة وأمان تام، مع توفر ميزة تتبع مسار الشحنة
                        لبعض الولايات.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#F15C64] mb-3 text-lg">
                        تأكيد الشحن
                      </h3>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        بعد إتمامك للطلب عبر موقعنا، سيقوم فريق العمل للاتصال بك
                        هاتفياً في غضون 24 ساعة لتأكيد الطلب التوصيل والمعلومات
                        الخاصة بك قبل تجهيز وشحن المنتج.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl cursor-default animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                title="إغلاق"
              >
                <X size={24} />
              </button>

              {(() => {
                const product = products.find((p) => p.id === selectedProduct);
                if (!product) return null;
                const isInCart = cartItems.some((i) => i.id === product.id);

                return (
                  <>
                    <div className="w-full md:w-1/2 flex flex-col bg-gray-50/50 p-4 md:p-6 justify-between select-none border-l border-gray-100">
                      <div className="w-full aspect-[4/5] bg-white rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center">
                        <img
                          src={(activeImage || product.image) || undefined}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-500 animate-in fade-in"
                        />
                        <button
                          onClick={() => toggleLike(product.id)}
                          className="absolute top-4 left-4 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md flex items-center justify-center text-[#1A2B4C] hover:text-[#F15C64] transition-all active:scale-110"
                        >
                          <Heart
                            size={22}
                            fill={
                              likedProducts.some(id => Number(id) === Number(product.id))
                                ? "#F15C64"
                                : "none"
                            }
                            color={
                              likedProducts.some(id => Number(id) === Number(product.id))
                                ? "#F15C64"
                                : "currentColor"
                            }
                          />
                        </button>
                      </div>

                      {/* Thumbnails Gallery */}
                      {(() => {
                        const thumbnails = [
                          product.image,
                          ...(product.images || []),
                          ...(product.colorVariants || [])
                            .map((v: any) => v.image)
                            .filter(Boolean),
                        ].filter((value, index, self) => self.indexOf(value) === index); // unique thumbnails

                        if (thumbnails.length <= 1) return null;

                        return (
                          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                            {thumbnails.map((thumb, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImage(thumb)}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white shrink-0 ${
                                  (activeImage || product.image) === thumb
                                    ? "border-[#F15C64] scale-95 shadow-md"
                                    : "border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                <img
                                  src={thumb || undefined}
                                  alt={`Thumbnail ${idx}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white">
                      <div className="inline-block px-4 py-1.5 bg-[#FDE9EB] text-[#F15C64] font-bold text-sm rounded-full mb-4 w-fit">
                        {product.category}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B4C] mb-3">
                        {product.name}
                      </h2>
                      <p
                        className="text-3xl font-black text-[#F15C64] mb-6"
                        dir="ltr"
                      >
                        {(product.numericPrice || 0).toLocaleString()} د.ج
                      </p>

                      <p className="text-gray-600 mb-8 leading-relaxed font-semibold text-sm">
                        {product.description}
                      </p>

                      {/* Color variants with images (as requested by user) */}
                      {product.colorVariants && product.colorVariants.length > 0 ? (
                        <div className="mb-6">
                          <h4 className="font-bold text-[#1A2B4C] mb-3 text-lg">
                            الألوان والخيارات المتاحة
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">انقر على اللون لمشاهدة صورته الخاصة مباشرة</p>
                          <div className="flex flex-wrap gap-2">
                            {product.colorVariants.map((variant: any, idx: number) => {
                              const isSelected = selectedColorCode === variant.colorCode;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedColorCode(variant.colorCode);
                                    if (variant.image) {
                                      setActiveImage(variant.image);
                                    }
                                  }}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-[#F15C64] bg-red-50/50 shadow-sm scale-102"
                                      : "border-gray-100 hover:border-gray-200 bg-gray-50/30"
                                  }`}
                                >
                                  <span
                                    className="w-5.5 h-5.5 rounded-full border shadow-inner shrink-0"
                                    style={{
                                      backgroundColor: variant.colorCode,
                                      borderColor: variant.colorCode === "#FFFFFF" ? "#cbd5e1" : "transparent"
                                    }}
                                  />
                                  <span className="text-xs font-bold text-[#1A2B4C]">
                                    {variant.colorName || "بدون اسم"}
                                  </span>
                                  {isSelected && (
                                    <Check size={14} className="text-[#F15C64] ml-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : product.colors && product.colors.length > 0 ? (
                        <div className="mb-6">
                          <h4 className="font-bold text-[#1A2B4C] mb-3 text-lg">
                            الألوان المتوفرة
                          </h4>
                          <div className="flex gap-3">
                            {product.colors.map((color: any, idx: number) => {
                              const isSelected = selectedColorCode === color;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedColorCode(color)}
                                  className="w-10 h-10 rounded-full border-[3px] focus:outline-none focus:ring-2 focus:ring-offset-2 ring-gray-300 shadow-sm transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                                  style={{
                                    backgroundColor: color,
                                    borderColor: isSelected
                                      ? "#F15C64"
                                      : color === "#FFFFFF"
                                      ? "#e5e7eb"
                                      : "white",
                                  }}
                                  title="لون المنتج"
                                >
                                  {isSelected && (
                                    <Check
                                      size={16}
                                      className={color === "#FFFFFF" ? "text-black" : "text-white"}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {(() => {
                        const chosenColor = (() => {
                          if (selectedColorCode) {
                            const variant = product.colorVariants?.find((v: any) => v.colorCode === selectedColorCode);
                            return variant ? `${variant.colorName} (${variant.colorCode})` : selectedColorCode;
                          } else if (product.colorVariants && product.colorVariants.length > 0) {
                            return `${product.colorVariants[0].colorName} (${product.colorVariants[0].colorCode})`;
                          } else if (product.colors && product.colors.length > 0) {
                            return product.colors[0];
                          }
                          return "";
                        })();

                        const firstAvailableSize = product.sizes?.find(
                          (size: string) => getAvailableStock(product, size, chosenColor) > 0,
                        );
                        const chosenSize = selectedSize || firstAvailableSize || "";

                        const isSpecInCart = cartItems.some(
                          (i) => i.id === product.id && i.selectedColor === chosenColor && i.selectedSize === chosenSize
                        );

                        return (
                          <>
                            <div className="mb-8 font-sans">
                              <h4 className="font-bold text-[#1A2B4C] mb-4 text-lg">
                                المقاسات المتاحة
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {product.sizes?.map((size, idx) => {
                                  const available = getAvailableStock(product, size, chosenColor) > 0;
                                  const isSizeSelected = selectedSize === size || (!selectedSize && firstAvailableSize === size);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      disabled={!available}
                                      aria-label={`${size} — ${available ? "متوفر" : "غير متوفر"}`}
                                      title={available ? "متوفر" : "غير متوفر"}
                                      onClick={() => {
                                        if (!available) {
                                          return;
                                        }
                                        setSelectedSize(size);
                                      }}
                                      className={`relative px-5 py-2.5 border rounded-xl font-bold text-sm transition-all ${
                                        available ? "cursor-pointer" : "cursor-not-allowed opacity-50 text-gray-400 bg-gray-100 line-through"
                                      } ${
                                        isSizeSelected
                                          ? "border-[#F15C64] bg-red-55/40 text-[#F15C64] shadow-sm scale-102"
                                          : "border-gray-200 text-gray-600 hover:border-[#1A2B4C] hover:text-[#1A2B4C] bg-white hover:bg-gray-50/50"
                                      }`}
                                    >
                                      {size}
                                      {!available && (
                                        <span
                                          aria-hidden="true"
                                          className="absolute -right-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                                        >
                                          <X size={13} strokeWidth={3} />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              disabled={product.sizes?.length > 0 && !firstAvailableSize}
                              onClick={() => addToCart(product.id)}
                              className={`w-full py-4 rounded-full font-bold text-lg transition-all shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 flex items-center justify-center gap-3 mt-auto ${
                                isSpecInCart
                                  ? "bg-green-500 text-white shadow-green-200"
                                  : "bg-[#1A2B4C] text-white hover:bg-opacity-90 shadow-blue-900/20"
                              } ${product.sizes?.length > 0 && !firstAvailableSize ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                            >
                              <ShoppingCart size={24} />
                              {isSpecInCart
                                ? "تمت إضافة هذا الخيار بنجاح"
                                : "إضافة إلى سلة المشتريات"}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
      {cartAddedNotice && (
        <div
          role="status"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[130] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 rounded-full border border-[#C7A27A]/40 bg-[#101114]/95 px-5 py-3 text-sm font-bold text-white shadow-xl"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#D8FF3E]" />
            تمت إضافة المنتج إلى السلة
          </span>
        </div>
      )}
    </div>
  );
}
