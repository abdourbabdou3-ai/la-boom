import React, { useState } from "react";
import { setStoreAdminSessionToken, useStore } from "./StoreContext";
import { Link } from "react-router-dom";
import { wilayasAlgeria } from "./data";
import {
  Package,
  ShoppingCart,
  LayoutDashboard,
  Truck,
  Users,
  Settings,
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  TrendingUp,
  DollarSign,
  Upload,
  X,
  Pipette,
  AlertCircle,
  Archive,
  Lock,
  Bell,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ImageColorSamplerModal({
  imageUrl,
  onSelect,
  onClose,
}: {
  imageUrl: string;
  onSelect: (hex: string) => void;
  onClose: () => void;
}) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [hoverColor, setHoverColor] = useState("#FFFFFF");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  const getPixelColor = (clientX: number, clientY: number): string => {
    const img = imgRef.current;
    if (!img) return "#FFFFFF";

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 300;
    canvas.height = img.naturalHeight || img.height || 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#FFFFFF";

    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const rect = img.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * canvas.width;
      const y = ((clientY - rect.top) / rect.height) * canvas.height;
      const imgData = ctx.getImageData(
        Math.max(0, Math.min(canvas.width - 1, x)),
        Math.max(0, Math.min(canvas.height - 1, y)),
        1,
        1
      ).data;
      const r = imgData[0];
      const g = imgData[1];
      const b = imgData[2];
      const hex =
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)
          .toUpperCase();
      return hex;
    } catch (err) {
      console.warn("Canvas crop failed due to CORS or structure:", err);
      return hoverColor || "#FFFFFF";
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const hex = getPixelColor(e.clientX, e.clientY);
    onSelect(hex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX, y: e.clientY });
    setShowMagnifier(true);
    const hex = getPixelColor(e.clientX, e.clientY);
    setHoverColor(hex);
  };

  const triggerSystemEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      const eyeDropper = new (window as any).EyeDropper();
      try {
        const result = await eyeDropper.open();
        onSelect(result.sRGBHex.toUpperCase());
      } catch (e) {
        console.log("EyeDropper closed or failed", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative flex flex-col items-center shadow-2xl border border-gray-100">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-bold text-[#1A2B4C] mb-1 flex items-center gap-2">
          🪄 القلم السحري للألوان
        </h3>
        <p className="text-[11px] text-gray-400 text-center mb-6 max-w-xs leading-relaxed">
          انقر مباشرة على أي جزء من الفستان أو الملابس لاستخراج لونها الحقيقي بدقة وتخزينه.
        </p>

        <div className="relative border-4 border-dashed border-gray-100 rounded-2xl overflow-hidden cursor-crosshair max-w-xs mt-1 shadow-inner bg-gray-50">
          <img
            ref={imgRef}
            src={imageUrl || undefined}
            crossOrigin="anonymous"
            alt="Color Pick Source"
            className="w-full max-h-[35vh] object-contain block"
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowMagnifier(false)}
          />

          {showMagnifier && (
            <div
              className="fixed pointer-events-none rounded-full border-4 border-white shadow-xl w-14 h-14 flex items-center justify-center -translate-x-1/2 -translate-y-[120%] z-[300]"
              style={{
                left: mousePos.x,
                top: mousePos.y,
                backgroundColor: hoverColor,
              }}
            >
              <span className="text-[9px] font-mono font-bold text-white bg-black/60 px-1 rounded shadow-sm">
                {hoverColor}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 mt-6 w-full">
          <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
            <span
              className="w-9 h-9 rounded-full border-2 border-white shadow-inner shrink-0"
              style={{ backgroundColor: hoverColor }}
            />
            <div className="flex-1">
              <p className="text-[9px] text-gray-400 font-bold">اللون تحت القلم</p>
              <p className="text-xs font-mono font-bold text-[#1A2B4C]">{hoverColor}</p>
            </div>
            <label className="flex items-center gap-1 cursor-pointer bg-white hover:bg-gray-100 border px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 transition-colors shadow-sm">
              <span>تعديل يدوي</span>
              <input
                type="color"
                value={hoverColor}
                onChange={(e) => {
                  setHoverColor(e.target.value.toUpperCase());
                }}
                className="w-4 h-4 p-0 border-0 rounded cursor-pointer shrink-0 bg-transparent"
              />
            </label>
          </div>

          {"EyeDropper" in window && (
            <button
              onClick={triggerSystemEyeDropper}
              type="button"
              className="w-full h-10 bg-[#1A2B4C] hover:bg-opacity-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Pipette size={14} className="text-[#F15C64]" /> استخدام قطارة شاشة الحاسوب 🪄
            </button>
          )}

          <button
            onClick={() => onSelect(hoverColor)}
            type="button"
            className="w-full h-10 bg-[#F15C64] text-white hover:bg-opacity-95 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
          >
            تأكيد واختيار هذا اللون
          </button>
        </div>
      </div>
    </div>
  );
}

const compressImage = async (file: File, adminSessionToken: string | null): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.5);
        fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(adminSessionToken ? { Authorization: `Bearer ${adminSessionToken}` } : {}),
            },
            body: JSON.stringify({ image: base64 })
        })
        .then(async (res) => {
            const data = await res.json();
            if (res.ok && data.url) {
              resolve(data.url);
              return;
            }
            console.error(`Image upload failed: ${res.status}`);
            alert("تعذر رفع الصورة إلى التخزين السحابي؛ سيتم حفظ النسخة المضغوطة داخل بيانات المتجر. أعد إعداد Cloudinary لتجنب زيادة حجم قاعدة البيانات.");
            resolve(base64);
        })
        .catch(err => {
            console.error(err);
            alert("تعذر الاتصال بتخزين الصور؛ سيتم حفظ النسخة المضغوطة داخل بيانات المتجر.");
            resolve(base64); // Fallback to base64 if upload fails
        });
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
};

const isNewArrivalEnabled = (value: unknown): boolean =>
  value === true ||
  value === 1 ||
  (typeof value === "string" &&
    ["true", "1"].includes(value.trim().toLowerCase()));

const getProductColorChoices = (product: any) => {
  const choices: Array<{ colorCode: string; colorName: string; image: string }> = [];
  if (product?.image) {
    choices.push({
      colorCode: product.imageColor || "#FFC0CB",
      colorName: "اللون الأساسي",
      image: product.image,
    });
  }
  (product?.images || []).forEach((image: string, index: number) => {
    choices.push({
      colorCode: product.imageColors?.[index] || "#CCCCCC",
      colorName: `خيار إضافي ${index + 1}`,
      image,
    });
  });
  return choices;
};

const getSizeColorStockKey = (colorCode: string, size: string) =>
  `${colorCode.trim().toLowerCase()}::${size.trim().toLowerCase()}`;

export default function Admin() {
  const {
    products,
    setProducts,
    categories,
    setCategories,
    orders,
    setOrders,
    shippingPrices,
    setShippingPrices,
    settings,
    setSettings,
    abandonedCartCount,
    setAbandonedCartCount,
    dismissedAbandonedNotifications,
    setDismissedAbandonedNotifications,
  } = useStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [inventoryNotifications, setInventoryNotifications] = useState<any[]>([]);
  const [unreadInventoryNotifications, setUnreadInventoryNotifications] = useState(0);
  const orderDeletionInProgress = React.useRef(new Set<string>());

  React.useEffect(() => () => setStoreAdminSessionToken(null), []);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 1024;
    }
    return true;
  });
  const [orderIdSearchQuery, setOrderIdSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const updateContactVisibility = (key: string, enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      contactVisibility: {
        ...current.contactVisibility,
        [key]: enabled,
      },
    }));
  };

  // Modals state
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingShipping, setEditingShipping] = useState<any>(null);
  const [samplerActive, setSamplerActive] = useState<{
    imageUrl: string;
    onSelect: (hex: string) => void;
  } | null>(null);

  // Calculate product stats dynamically based on orders
  const productStats = React.useMemo(() => {
    const statsMap: Record<number, { name?: string; image?: string; salesCount: number; totalRevenue: number; totalCost: number; netProfit: number }> = {};
    
    // Populate from products to make sure all products are registered
    products.forEach((p) => {
      statsMap[p.id] = {
        name: p.name,
        image: p.image,
        salesCount: 0,
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
      };
    });

    // Accumulate from all orders that are NOT cancelled
    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      
      if (order.cartItems && Array.isArray(order.cartItems)) {
        order.cartItems.forEach((item: any) => {
          const prod = products.find((p) => p.id === item.id);
          const numericPrice = item.numericPrice ?? prod?.numericPrice ?? 0;
          const costPrice = item.costPrice ?? prod?.costPrice ?? 0;
          const qty = item.quantity || 0;

          if (!statsMap[item.id]) {
            statsMap[item.id] = { 
              name: item.productName || prod?.name || "منتج محذوف",
              image: item.productImage || prod?.image,
              salesCount: 0, 
              totalRevenue: 0, 
              totalCost: 0, 
              netProfit: 0 
            };
          }
          statsMap[item.id].salesCount += qty;
          statsMap[item.id].totalRevenue += qty * numericPrice;
          statsMap[item.id].totalCost += qty * costPrice;
          statsMap[item.id].netProfit += qty * (numericPrice - costPrice);
        });
      }
    });

    return statsMap;
  }, [orders, products]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitLoading(true);

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        const token = typeof data.token === "string" ? data.token : null;
        setAdminSessionToken(token);
        setStoreAdminSessionToken(token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (err) {
      setLoginError("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isAuthenticated || !adminSessionToken) return;

    let isActive = true;
    fetch("/api/orders", {
      headers: { Authorization: `Bearer ${adminSessionToken}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setAdminSessionToken(null);
          setStoreAdminSessionToken(null);
          setOrders([]);
          return [];
        }
        if (!response.ok) throw new Error(`Failed to load orders: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (isActive && Array.isArray(data)) setOrders(data);
      })
      .catch((error) => console.error("Failed to load admin orders", error));

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, adminSessionToken, setOrders]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    let isActive = true;
    const loadInventoryNotifications = async () => {
      try {
        const response = await fetch("/api/admin/inventory-notifications", {
          headers: { Authorization: `Bearer ${adminSessionToken}` },
        });
        if (response.status === 401) {
          setIsAuthenticated(false);
          setAdminSessionToken(null);
          setStoreAdminSessionToken(null);
          setOrders([]);
          return;
        }
        if (!response.ok) {
          throw new Error(`Failed to load inventory notifications: ${response.status}`);
        }
        const result = await response.json();
        if (isActive) {
          setInventoryNotifications(Array.isArray(result.notifications) ? result.notifications : []);
          setUnreadInventoryNotifications(Number(result.unreadCount) || 0);
        }
      } catch (error) {
        console.error("Failed to load inventory notifications", error);
      }
    };

    void loadInventoryNotifications();
    const intervalId = window.setInterval(loadInventoryNotifications, 20000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, adminSessionToken]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#101114] via-[#292B30] to-[#101114] p-4 font-sans select-none" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-150 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#1A2B4C] p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-white/20">
                <Lock className="text-[#F15C64]" size={28} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-2">لوحة التحكم السرية</h2>
              <p className="text-gray-300 text-xs">LA BOOM CLOTHES • الوصول مخصص للإدارة فقط</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6" autoComplete="off">
            {loginError && (
              <div className="bg-red-50 border border-red-150 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A2B4C]">اسم المستخدم أو الهاتف</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                autoComplete="off"
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl focus:border-[#F15C64] focus:ring-2 focus:ring-[#F15C64]/10 transition-all text-sm font-bold text-[#1A2B4C] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1A2B4C]">كلمة المرور</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl focus:border-[#F15C64] focus:ring-2 focus:ring-[#F15C64]/10 transition-all text-sm font-bold text-[#1A2B4C] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full py-3.5 bg-[#F15C64] hover:bg-[#d84a51] text-white font-black text-sm rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "تسجيل الدخول الآمن"
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center text-xs">
            <Link to="/" className="text-gray-400 hover:text-[#1A2B4C] font-bold transition-colors">
              العودة إلى المتجر الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Action handlers
  const markInventoryNotificationRead = async (notification: any) => {
    if (notification.readAt) return;
    try {
      const response = await fetch(
        `/api/admin/inventory-notifications/${notification.id}/read`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminSessionToken}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
      const readAt = new Date().toISOString();
      setInventoryNotifications((current) =>
        current.map((item) => item.id === notification.id ? { ...item, readAt } : item),
      );
      setUnreadInventoryNotifications((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Failed to mark inventory notification as read", error);
      alert("تعذر تحديث حالة الإشعار");
    }
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldOrder = orders.find((o) => o.id === editingOrder.id);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSessionToken}`,
        },
        body: JSON.stringify(editingOrder),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to save order: ${response.status}`);
      }

      if (Array.isArray(result.products) && result.products.length > 0) {
        const updatedProducts = new Map(result.products.map((product: any) => [product.id, product]));
        setProducts((currentProducts) =>
          currentProducts.map((product) => updatedProducts.get(product.id) || product),
        );
      }
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === editingOrder.id
            ? { ...editingOrder, inventoryState: result.inventoryState }
            : order,
        ),
      );

      if (
        oldOrder &&
        oldOrder.status !== "cancelled" &&
        editingOrder.status === "cancelled" &&
        Array.isArray(oldOrder.cartItems)
      ) {
        setProducts((currentProducts) =>
          currentProducts.map((product) => {
            const item = oldOrder.cartItems.find((cartItem: any) => cartItem.id === product.id);
            return item
              ? { ...product, salesCount: Math.max(0, (product.salesCount || 0) - item.quantity) }
              : product;
          }),
        );
      }
      if (result.inventoryWarning) alert(result.inventoryWarning);
      setEditingOrder(null);
    } catch (error) {
      console.error(`Failed to save order ${editingOrder.id}`, error);
      alert(error instanceof Error ? error.message : "تعذر حفظ الطلب وتحديث المخزون");
    }
  };
  const deleteOrder = async (id: string) => {
    if (orderDeletionInProgress.current.has(id)) return;
    const orderToDelete = orders.find((o) => o.id === id);
    if (!orderToDelete) {
      console.error(`Cannot delete order ${id}: order was not found`);
      return;
    }

    orderDeletionInProgress.current.add(id);
    try {
      if (orderToDelete.status === "deleted") {
        const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminSessionToken}` },
        });
        if (!response.ok) {
          throw new Error(`Failed to permanently delete order ${id}: ${response.status}`);
        }
        setOrders((currentOrders) => currentOrders.filter((order) => order.id !== id));
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSessionToken}`,
        },
        body: JSON.stringify({ ...orderToDelete, status: "deleted" }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to move order ${id} to trash: ${response.status}`);
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === id
            ? { ...order, status: "deleted", inventoryState: result.inventoryState }
            : order,
        ),
      );
      if (Array.isArray(result.products) && result.products.length > 0) {
        const updatedProducts = new Map(result.products.map((product: any) => [product.id, product]));
        setProducts((currentProducts) =>
          currentProducts.map((product) => updatedProducts.get(product.id) || product),
        );
      }
      if (
        orderToDelete.status !== "cancelled" &&
        orderToDelete.status !== "shipped" &&
        Array.isArray(orderToDelete.cartItems)
      ) {
        setProducts((currentProducts) =>
          currentProducts.map((product) => {
            const item = orderToDelete.cartItems.find((cartItem: any) => cartItem.id === product.id);
            return item
              ? { ...product, salesCount: Math.max(0, (product.salesCount || 0) - item.quantity) }
              : product;
          }),
        );
      }
    } catch (error) {
      console.error(`Failed to delete order ${id}`, error);
      alert(error instanceof Error ? error.message : "تعذر نقل الطلب إلى سلة المهملات");
    } finally {
      orderDeletionInProgress.current.delete(id);
    }
  };
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const colorChoices = getProductColorChoices(editingProduct);
    const derivedVariants = colorChoices.map((choice) => {
      const previous = editingProduct.colorVariants?.find(
        (variant: any) => String(variant.colorCode).toLowerCase() === choice.colorCode.toLowerCase(),
      );
      return { ...choice, ...(previous?.stockQty !== undefined ? { stockQty: previous.stockQty } : {}) };
    });
    const sizes = [...new Set<string>((editingProduct.sizes || []).map((size: any) => String(size).trim()).filter(Boolean))];
    const variantSizeStock: Record<string, number | string> = { ...(editingProduct.variantSizeStock || {}) };
    const sizeStock: Record<string, number | string> = { ...(editingProduct.sizeStock || {}) };
    let stockQty = Number(editingProduct.stockQty) || 0;

    if (sizes.length > 0 && derivedVariants.length > 0) {
      const keys = derivedVariants.flatMap((variant) =>
        sizes.map((size) => getSizeColorStockKey(variant.colorCode, size)),
      );
      const configured = keys.some((key) => variantSizeStock[key] !== undefined && variantSizeStock[key] !== "");
      if (configured && keys.some((key) =>
        variantSizeStock[key] === undefined ||
        variantSizeStock[key] === "" ||
        !Number.isSafeInteger(Number(variantSizeStock[key])) ||
        Number(variantSizeStock[key]) < 0,
      )) {
        alert("أدخل كمية صحيحة لكل تركيبة لون ومقاس، أو اترك جميعها فارغة لاستخدام المخزون المشترك.");
        return;
      }
      if (configured) {
        stockQty = keys.reduce((sum, key) => sum + Number(variantSizeStock[key]), 0);
      }
    } else if (sizes.length > 0) {
      const configured = sizes.some((size) => sizeStock[size] !== undefined && sizeStock[size] !== "");
      if (configured && sizes.some((size) =>
        sizeStock[size] === undefined ||
        sizeStock[size] === "" ||
        !Number.isSafeInteger(Number(sizeStock[size])) ||
        Number(sizeStock[size]) < 0,
      )) {
        alert("أدخل كمية صحيحة لكل مقاس، أو اترك جميع المقاسات فارغة لاستخدام المخزون المشترك.");
        return;
      }
      if (configured) {
        stockQty = sizes.reduce<number>((sum, size) => sum + Number(sizeStock[size]), 0);
      }
    }

    const colorsList = derivedVariants.map((v) => v.colorCode);

    const updatedProduct = {
      ...editingProduct,
      stockQty,
      colorVariants: derivedVariants,
      ...(Object.keys(variantSizeStock).length ? { variantSizeStock } : {}),
      ...(Object.keys(sizeStock).length ? { sizeStock } : {}),
      sizes,
      colors: colorsList,
      images: editingProduct.images || [],
      imageColors: editingProduct.imageColors || [],
      isNewArrival: isNewArrivalEnabled(editingProduct.isNewArrival),
      id: editingProduct.id
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSessionToken}`,
        },
        body: JSON.stringify({ ...updatedProduct, id: editingProduct.id || undefined })
      });
      const data = await response.json();
      if (!response.ok || !data.id) {
        throw new Error(data.error || `Failed to save product: ${response.status}`);
      }
      const savedProduct = { ...updatedProduct, id: Number(data.id) };
      setProducts((currentProducts) =>
        editingProduct.id
          ? currentProducts.map((product) => product.id === editingProduct.id ? savedProduct : product)
          : [...currentProducts, savedProduct],
      );
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to save product", error);
      alert(error instanceof Error ? error.message : "تعذر حفظ المنتج");
    }
  };
  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminSessionToken}` },
      });
      if (!response.ok) throw new Error(`Failed to delete product: ${response.status}`);
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
    } catch (error) {
      console.error(`Failed to delete product ${id}`, error);
      alert(error instanceof Error ? error.message : "تعذر حذف المنتج");
    }
  };
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean object to save, remove helper properties
    const { idx, isNew, ...categoryToSave } = editingCategory;
    if (!categoryToSave.keyword) {
      categoryToSave.keyword = categoryToSave.name;
    }
    
    let updatedCategories;
    if (isNew) {
      updatedCategories = [...categories, categoryToSave];
    } else {
      updatedCategories = categories.map((c) =>
          c.name === categoryToSave.name ? categoryToSave : c,
        );
    }
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSessionToken}`,
        },
        body: JSON.stringify(updatedCategories)
      });
      if (!response.ok) throw new Error(`Failed to save categories: ${response.status}`);
      setCategories(updatedCategories);
      setEditingCategory(null);
    } catch (error) {
      console.error("Failed to save categories", error);
      alert(error instanceof Error ? error.message : "تعذر حفظ التصنيفات");
    }
  };
  const deleteCategory = async (name: string) => {
    const updatedCategories = categories.filter((c) => c.name !== name);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSessionToken}`,
        },
        body: JSON.stringify(updatedCategories)
      });
      if (!response.ok) throw new Error(`Failed to delete category: ${response.status}`);
      setCategories(updatedCategories);
    } catch (error) {
      console.error("Failed to delete category", error);
      alert(error instanceof Error ? error.message : "تعذر حذف التصنيف");
    }
  };
  const saveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShipping.isNew) {
      setShippingPrices([...shippingPrices, { ...editingShipping }]);
    } else {
      setShippingPrices(
        shippingPrices.map((s, idx) =>
          idx === editingShipping.idx ? editingShipping : s,
        ),
      );
    }
    setEditingShipping(null);
  };
  const deleteShipping = (idx: number) => {
    setShippingPrices(shippingPrices.filter((_, i) => i !== idx));
  };
  const getStockStatus = (qty: number) => {
    if (qty > 10)
      return { label: "متوفر", color: "bg-green-100 text-green-700" };
    if (qty > 0)
      return {
        label: "قارب على النفاذ",
        color: "bg-orange-100 text-orange-700",
      };
    return { label: "نفذ", color: "bg-red-100 text-red-700" };
  };

  // Stats for dashboard
  const totalSales = Object.values(productStats).reduce(
    (sum, stat) => sum + stat.totalRevenue,
    0,
  );
  const totalPurchasePrice = Object.values(productStats).reduce((sum, stat: any) => sum + stat.totalCost, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const displayOrderId = (id: string) => id.replace(/^AYA-/i, "boom-");

  const filteredOrders = orders.filter((order) => {
    let matchId = true;
    let matchCustomer = true;
    let matchStatus = true;

    if (orderIdSearchQuery.trim()) {
      matchId = displayOrderId(order.id)
        .toLowerCase()
        .includes(orderIdSearchQuery.trim().toLowerCase());
    }

    if (customerSearchQuery.trim()) {
      const q = customerSearchQuery.toLowerCase();
      matchCustomer =
        order.customerName.toLowerCase().includes(q) || order.phone.includes(q);
    }

    if (orderStatusFilter !== "all") {
      matchStatus = order.status === orderStatusFilter;
    } else {
      matchStatus = order.status !== "deleted" && order.status !== "cancelled";
    }

    return matchId && matchCustomer && matchStatus;
  });

  const daysInArabic = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const salesData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateString: d.toISOString().split("T")[0],
      name: daysInArabic[d.getDay()],
      sales: 0,
    };
  });

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const orderDate = order.date ? order.date.split("T")[0] : "";
    const dayData = salesData.find((d) => d.dateString === orderDate);
    if (dayData) {
      dayData.sales += order.total || 0;
    }
  });

  const editingColorChoices = getProductColorChoices(editingProduct || {});

  return (
    <div
      className="flex h-screen bg-gray-50 text-[#1A2B4C] font-body overflow-hidden relative"
      dir="rtl"
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "w-64 translate-x-0" : "w-0 md:w-20 translate-x-full md:translate-x-0 overflow-hidden"} h-full bg-white shadow-xl transition-all duration-300 z-30 flex flex-col fixed md:relative right-0 top-0 bottom-0`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          {isSidebarOpen && (
            <h2 className="text-2xl font-black text-[#F15C64]">
              LA BOOM CLOTHES <span className="text-[#1A2B4C]">Admin</span>
            </h2>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-[#F15C64] hover:bg-[#FDE9EB]"
          >
            <LayoutDashboard size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="الرئيسية"
            id="dashboard"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={ShoppingCart}
            label="الطلبات"
            id="orders"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            badge={pendingOrders}
          />
          <SidebarItem
            icon={AlertCircle}
            label="المنتجات صعبة البيع"
            id="hard-to-sell"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            badge={products.filter((p) => (abandonedCartCount[p.id] || 0) >= 2 && !dismissedAbandonedNotifications.some((id: any) => Number(id) === Number(p.id))).length}
          />
          <SidebarItem
            icon={Package}
            label="المنتجات"
            id="products"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={Tag}
            label="الأقسام"
            id="categories"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={Archive}
            label="المخزون"
            id="inventory"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={Bell}
            label="تنبيهات نفاد المقاسات"
            id="inventory-notifications"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            badge={unreadInventoryNotifications}
          />
          <SidebarItem
            icon={TrendingUp}
            label="الأرباح"
            id="profits"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={Truck}
            label="الشحن"
            id="shipping"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
          <SidebarItem
            icon={Settings}
            label="الإعدادات"
            id="settings_config"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>

        <div className="p-4 border-t border-gray-100 mt-auto flex flex-col gap-2">
          <button
            onClick={() => {
              void fetch("/api/admin/logout", {
                method: "POST",
                headers: { Authorization: `Bearer ${adminSessionToken}` },
              }).catch((error) => console.error("Failed to end admin session", error));
              setStoreAdminSessionToken(null);
              setIsAuthenticated(false);
              setAdminSessionToken(null);
              setOrders([]);
            }}
            className="text-gray-500 hover:text-red-650 hover:bg-red-50 p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-colors w-full cursor-pointer"
            title="تسجيل الخروج من لوحة التحكم"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {isSidebarOpen && (
              <span className="text-sm font-bold">تسجيل الخروج</span>
            )}
          </button>

          <Link
            to="/"
            className="text-gray-500 hover:text-[#F15C64] hover:bg-gray-50 p-3 rounded-xl flex items-center justify-center md:justify-start gap-3 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {isSidebarOpen && (
              <span className="text-sm font-bold">العودة للمتجر</span>
            )}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between md:hidden bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 mb-6 font-body">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:text-[#F15C64] hover:bg-[#FDE9EB] transition-all"
              aria-label="Toggle Sidebar"
            >
              <LayoutDashboard size={20} />
            </button>
            <h2 className="text-base font-black text-[#F15C64]">
              LA BOOM CLOTHES <span className="text-[#1A2B4C] text-xs">لوحة التحكم</span>
            </h2>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-gray-500 hover:text-[#F15C64] bg-gray-50 hover:bg-[#FDE9EB] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
          >
            المتجر
          </Link>
        </div>
        {/* Hard to sell Tab */}
        {activeTab === "hard-to-sell" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-[#1A2B4C] mb-8">
              المنتجات صعبة البيع
            </h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">صورة و اسم</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">عدد مرات التعليق بالسلة</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">السعر</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {(() => {
                      const hardToSellProducts = products.filter((p) => {
                        const count = abandonedCartCount[p.id] || 0;
                        return count >= 2;
                      });
                      return (
                        <>
                          {hardToSellProducts.map((product) => {
                            const isDismissed = dismissedAbandonedNotifications.some((id: any) => Number(id) === Number(product.id));
                            return (
                              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-3">
                                  <img src={product.image || undefined} className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-[#1A2B4C]">{product.name}</span>
                                    {isDismissed ? (
                                      <span className="text-[10px] text-gray-400 font-bold w-fit mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded-lg border border-gray-150">
                                        تمت المعاينة
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold w-fit mt-0.5 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-150 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        تنبيه جديد
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-[#F15C64]">{abandonedCartCount[product.id]}</td>
                                <td className="px-6 py-4 font-bold text-[#1A2B4C]" dir="ltr">{(product.numericPrice || 0).toLocaleString()} د.ج</td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        setDismissedAbandonedNotifications((prev) => {
                                          const existed = prev.some((id: any) => Number(id) === Number(product.id));
                                          if (existed) {
                                            return prev.filter((id: any) => Number(id) !== Number(product.id));
                                          } else {
                                            return [...prev, product.id];
                                          }
                                        });
                                      }} 
                                      className={`p-1.5 rounded transition-colors ${
                                        isDismissed 
                                          ? "text-gray-400 bg-gray-100 hover:text-gray-600" 
                                          : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                      }`}
                                      title={isDismissed ? "إعادة تفعيل التنبيه" : "إلغاء وضع التنبيه النشط (مقروء)"}
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setAbandonedCartCount((prev) => {
                                          const next = { ...prev };
                                          delete next[product.id];
                                          return next;
                                        });
                                        setDismissedAbandonedNotifications((prev) => 
                                          prev.filter((id) => Number(id) !== Number(product.id))
                                        );
                                      }} 
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" 
                                      title="إزالة من القائمة (إعادة تعيين)"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {hardToSellProducts.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-bold">لا يوجد منتجات صعبة البيع حالياً</td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {products.filter((p) => (p.stockQty ?? 0) <= 0).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800">تنبيه المخزون</h3>
                    <p className="text-sm text-red-600 font-medium mt-1">
                      يوجد{" "}
                      {products.filter((p) => (p.stockQty ?? 0) <= 0).length}{" "}
                      منتجات نفذت من المخزون.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="px-4 py-2 bg-white text-red-500 text-sm font-bold rounded-lg shadow-sm hover:bg-red-50 border border-red-100"
                >
                  تحديث المخزون
                </button>
              </div>
            )}
            <h1 className="text-3xl font-bold text-[#1A2B4C] mb-8">
              لوحة التحكم السريعة
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="إجمالي المبيعات (المنتجات)"
                value={`${totalSales.toLocaleString()} د.ج`}
                icon={ShoppingCart}
                color="bg-blue-50 text-blue-500"
              />
              <StatCard
                title="إجمالي الطلبات"
                value={totalOrders}
                icon={Package}
                color="bg-green-50 text-green-500"
              />
              <StatCard
                title="طلبات قيد الانتظار"
                value={pendingOrders}
                icon={LayoutDashboard}
                color="bg-orange-50 text-orange-500"
              />
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-bold mb-2">
                    رقم الطلب القادم
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={settings.nextOrderNumber}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          nextOrderNumber: parseInt(e.target.value) || 0,
                        })
                      }
                      className="border border-gray-200 rounded p-2 text-xl font-black text-[#1A2B4C] w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-6">المبيعات الأسبوعية</h2>
                <div className="h-72 w-full min-w-0 min-h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={salesData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "#F3F4F6" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="sales"
                        fill="#F15C64"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-6">
                  المنتجات الأكثر مبيعاً
                </h2>
                <div className="flex flex-col gap-4">
                  {Object.entries(productStats)
                    .filter(([_, stat]: [string, any]) => stat.salesCount > 0)
                    .sort((a: any, b: any) => {
                      return b[1].salesCount - a[1].salesCount;
                    })
                    .slice(0, 4)
                    .map(([id, stat]: [string, any]) => {
                      return (
                        <div key={id} className="flex items-center gap-3">
                          {stat.image ? (
                            <img
                              src={stat.image}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center text-xs text-gray-400">?</div>
                          )}
                          <div className="flex-1 truncate">
                            <p className="font-bold text-sm text-[#1A2B4C] truncate">
                              {stat.name}
                            </p>
                            <p
                              className="text-xs text-gray-500 font-bold"
                              dir="ltr"
                            >
                              {(stat.totalRevenue / stat.salesCount || 0).toLocaleString()} د.ج
                            </p>
                          </div>
                          <div className="bg-[#FDE9EB] text-[#F15C64] font-bold text-xs px-2 py-1 rounded-md">
                            {stat.salesCount} مبيعات
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                إدارة الطلبات
              </h1>
              <div className="flex gap-4 items-center">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-white rounded-full px-4 py-2 border border-gray-200 text-sm font-bold text-gray-700 outline-none"
                >
                  <option value="all">الكل (نشط)</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="confirmed">تأكيد</option>
                  <option value="shipped">مشحون</option>
                  <option value="cancelled">ملغى</option>
                  <option value="deleted">سلة المهملات</option>
                </select>
                <div
                  className="flex bg-white rounded-full px-4 py-2 border border-gray-200 items-center gap-2"
                  dir="ltr"
                >
                  <Search size={18} className="text-gray-400" />
                  <span className="text-gray-400 text-sm font-bold">
                    #boom-{new Date().getFullYear()}-
                  </span>
                  <input
                    type="text"
                    placeholder="1061"
                    value={orderIdSearchQuery}
                    onChange={(e) => setOrderIdSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-20 text-gray-700"
                  />
                </div>
                <div className="flex bg-white rounded-full px-4 py-2 border border-gray-200 items-center gap-2">
                  <Search size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو الهاتف..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-48"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        رقم الطلب
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الزبون
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        المنتجات المطلوبة (الون / المقاس)
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الولاية
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        المبلغ
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الحالة
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium" dir="ltr">
                          {displayOrderId(order.id)}
                        </td>
                        <td className="px-6 py-4 font-bold text-[#1A2B4C]">
                          {order.customerName}
                          <br />
                          <span className="text-xs text-gray-400 font-medium">
                            {order.phone}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 max-w-[280px]">
                            {order.cartItems && Array.isArray(order.cartItems) && order.cartItems.length > 0 ? (
                              order.cartItems.map((item: any, idx: number) => {
                                const prod = products.find((p) => p.id === item.id);
                                const itemName = item.productName || prod?.name || "منتج محذوف";
                                const itemImage = item.productImage || prod?.image;
                                return (
                                  <div key={idx} className="flex flex-col bg-gray-50/60 rounded-xl p-2.5 border border-gray-100 gap-1 text-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-[#1A2B4C]">
                                      {itemImage ? (
                                        <img src={itemImage} className="w-6 h-6 object-cover rounded border bg-gray-50 shrink-0" />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-gray-100 border flex items-center justify-center text-[8px] text-gray-400 shrink-0">?</div>
                                      )}
                                      <span className="truncate">{itemName}</span>
                                      <span className="text-[#F15C64] font-extrabold bg-red-50 text-[10px] px-1.5 py-0.5 rounded-full shrink-0 mr-auto">
                                        × {item.quantity}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-0.5 font-bold text-[9px]">
                                      {item.selectedColor && (
                                        <span className="inline-flex items-center gap-1 bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-100 shrink-0">
                                          <span className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: item.selectedColor.includes('#') ? item.selectedColor.substring(item.selectedColor.indexOf('#')).replace(')', '') : item.selectedColor }} />
                                          {item.selectedColor.includes('(') ? item.selectedColor.substring(0, item.selectedColor.indexOf('(')).trim() : item.selectedColor}
                                        </span>
                                      )}
                                      {item.selectedSize && (
                                        <span className="bg-white text-[#F15C64] px-1.5 py-0.5 rounded border border-[#FDE9EB] shrink-0">
                                          المقاس: {item.selectedSize}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-gray-400 text-xs font-semibold">عدد السلع: {order.items || 0}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.wilaya}
                          {order.commune && (
                            <div className="text-xs text-gray-500 mt-1">
                              البلدية: {order.commune}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            توصيل:{" "}
                            {order.deliveryType === "desk" ? "مكتب" : "منزل"}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 font-bold text-[#F15C64]"
                          dir="ltr"
                        >
                          {order.total.toLocaleString()} د.ج
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              order.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "pending"
                                  ? "bg-orange-100 text-orange-700"
                                  : order.status === "shipped"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {order.status === "pending"
                              ? "قيد الانتظار"
                              : order.status === "confirmed"
                                ? "تأكيد"
                                : order.status === "shipped"
                                  ? "مشحون"
                                  : order.status === "deleted"
                                    ? "سلة المهملات"
                                    : "ملغى"}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                            title="تفاصيل و حالة الطلب"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                            title={order.status === "deleted" ? "حذف نهائي للطلب" : "نقل الطلب إلى سلة المهملات"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                إدارة المنتجات
              </h1>
              <button
                onClick={() =>
                  setEditingProduct({
                    name: "",
                    price: "",
                    numericPrice: 0,
                    costPrice: 0,
                    stockQty: 0,
                    category: "",
                    image: "",
                    desc: "",
                    colors: [],
                    colorVariants: [],
                    images: [],
                    isNewArrival: false,
                    sizes: [],
                    sizeStock: {},
                    variantSizeStock: {},
                  })
                }
                className="flex bg-[#1A2B4C] hover:bg-opacity-90 text-white rounded-xl px-4 py-2.5 font-bold text-sm items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                إضافة منتج
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        صورة و اسم
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        السعر
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        القسم
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        المخزون (الكمية)
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img
                            src={product.image || undefined}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                          />
                          <span className="font-bold text-[#1A2B4C]">
                            {product.name}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 font-bold text-[#F15C64]"
                          dir="ltr"
                        >
                          {(product.numericPrice || 0).toLocaleString()} د.ج
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {product.category}
                          {product.subcategory ? ` - ${product.subcategory}` : ""}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded font-bold text-xs ${getStockStatus(product.stockQty ?? 0).color}`}
                          >
                            {getStockStatus(product.stockQty ?? 0).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => {
                              const imgColor = product.imageColor || (product.colorVariants && product.colorVariants[0]?.colorCode) || "#FFC0CB";
                              const imgColors = product.imageColors || (product.images || []).map((_, idx) => {
                                return product.colorVariants?.[idx + 1]?.colorCode || "#CCCCCC";
                              });
                              setEditingProduct({
                                ...product,
                                imageColor: imgColor,
                                imageColors: imgColors,
                              });
                            }}
                            className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                إدارة الأقسام
              </h1>
              <button
                onClick={() =>
                  setEditingCategory({ name: "", image: "", isNew: true })
                }
                className="flex bg-[#1A2B4C] hover:bg-opacity-90 text-white rounded-xl px-4 py-2.5 font-bold text-sm items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                إضافة قسم
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center group"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-gray-100 group-hover:border-[#F15C64] transition-colors relative">
                    <img
                      src={cat.image || undefined}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold mb-2 whitespace-pre-line">
                    {cat.name}
                  </h3>
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => setEditingCategory({ ...cat })}
                      className="text-blue-500 p-1 bg-blue-50 rounded"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.name)}
                      className="text-red-500 p-1 bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "inventory-notifications" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                تنبيهات نفاد المقاسات
              </h1>
              {unreadInventoryNotifications > 0 && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-700">
                  {unreadInventoryNotifications} غير مقروء
                </span>
              )}
            </div>
            {inventoryNotifications.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center font-bold text-gray-500">
                لا توجد تنبيهات نفاد مقاسات.
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryNotifications.map((notification) => {
                  const product = products.find((item) => Number(item.id) === Number(notification.productId));
                  return (
                    <div
                      key={notification.id}
                      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between ${
                        notification.readAt ? "border-gray-100" : "border-red-200 bg-red-50/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 rounded-full p-2 ${notification.readAt ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-600"}`}>
                          <Bell size={18} />
                        </span>
                        <div>
                          <p className="font-bold text-[#1A2B4C]">
                            نفد مقاس {notification.size} من المنتج {notification.productName}
                            {notification.color ? ` — اللون ${notification.color}` : ""}.
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            الكمية المتبقية: {notification.quantity} · {new Date(notification.createdAt).toLocaleString("ar-DZ")}
                          </p>
                          {!notification.readAt && (
                            <span className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                              جديد
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {!notification.readAt && (
                          <button
                            type="button"
                            onClick={() => void markInventoryNotificationRead(notification)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
                          >
                            وضع كمقروء
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!product}
                          onClick={async () => {
                            await markInventoryNotificationRead(notification);
                            if (product) {
                              setActiveTab("products");
                              setEditingProduct({ ...product });
                            }
                          }}
                          className="rounded-lg bg-[#1A2B4C] px-3 py-2 text-sm font-bold text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          تعديل مخزون المنتج
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                إدارة المخزون
              </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        المنتج
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الكمية المتوفرة
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        حالة المخزون
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        تعديل المخزون
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {products.map((product) => {
                      const status = getStockStatus(product.stockQty ?? 0);
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img
                              src={product.image || undefined}
                              className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                            />
                            <span className="font-bold text-[#1A2B4C]">
                              {product.name}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 font-bold text-[#1A2B4C]"
                            dir="ltr"
                          >
                            {product.stockQty ?? 0} قطعة
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded font-bold text-xs ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              defaultValue={product.stockQty ?? 0}
                              className="w-20 border border-gray-200 rounded p-1 text-center"
                              onBlur={(e) => {
                                setProducts(
                                  products.map((p) =>
                                    p.id === product.id
                                      ? {
                                          ...p,
                                          stockQty: parseInt(e.target.value),
                                        }
                                      : p,
                                  ),
                                );
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === "shipping" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                أسعار الشحن والولايات
              </h1>
              <button
                onClick={() =>
                  setEditingShipping({ wilaya: "", price: 0, isNew: true })
                }
                className="flex bg-[#1A2B4C] hover:bg-opacity-90 text-white rounded-xl px-4 py-2.5 font-bold text-sm items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                إضافة تسعيرة تخصيص مكاتب
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الولاية
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        سعر التوصيل للمنزل
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        سعر التوصيل للمكتب
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        حالة التوصيل
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {shippingPrices
                      .map((ship, originalIndex) => ({ ...ship, originalIndex }))
                      .sort((a, b) => {
                        const numA = parseInt(a.wilaya) || 0;
                        const numB = parseInt(b.wilaya) || 0;
                        return numA - numB;
                      })
                      .map((ship) => (
                        <tr key={ship.originalIndex} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold text-[#1A2B4C]">
                            {ship.wilaya}
                          </td>
                          <td
                            className="px-6 py-4 font-bold text-[#F15C64]"
                            dir="ltr"
                          >
                            {ship.price} د.ج
                          </td>
                          <td
                            className="px-6 py-4 font-bold text-[#F15C64]"
                            dir="ltr"
                          >
                            {ship.priceDesk ? `${ship.priceDesk} د.ج` : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded font-bold text-xs">
                              متاح
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() =>
                                setEditingShipping({
                                  ...ship,
                                  idx: ship.originalIndex,
                                })
                              }
                              className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteShipping(ship.originalIndex)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Rules */}
            <div className="mt-12 mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1A2B4C]">
                شروط الشحن الإضافية
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              {/* Weight Rule */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-max space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[#1A2B4C]">
                      شرط الوزن
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      تطبيق رسوم إضافية للمنتجات الثقيلة
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings?.shippingRules?.weight?.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shippingRules: {
                            ...settings.shippingRules,
                            weight: {
                              ...settings.shippingRules?.weight,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2B4C]"></div>
                  </label>
                </div>
                {settings?.shippingRules?.weight?.enabled && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        الحد الأقصى للوزن (KG)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings?.shippingRules?.weight?.maxWeight}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            shippingRules: {
                              ...settings.shippingRules,
                              weight: {
                                ...settings.shippingRules?.weight,
                                maxWeight: parseFloat(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full border rounded-lg p-2 bg-gray-50 uppercase text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        سعر الزيادة لكل 1 KG إضافي (د.ج)
                      </label>
                      <input
                        type="number"
                        value={settings?.shippingRules?.weight?.extraPerKg}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            shippingRules: {
                              ...settings.shippingRules,
                              weight: {
                                ...settings.shippingRules?.weight,
                                extraPerKg: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full border rounded-lg p-2 bg-gray-50 text-left text-[#F15C64] font-bold"
                        dir="ltr"
                      />
                    </div>
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl leading-relaxed">
                      <strong>مثال:</strong> إذا كان الحد الأقصى للوزن 5KG
                      والزيادة 50 د.ج، ووزن المنتج 7KG، سيتم إضافة 100 د.ج لسعر
                      التوصيل.
                    </div>
                  </div>
                )}
              </div>

              {/* Dimensions Rule */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-max space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[#1A2B4C]">
                      شرط الأبعاد
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      تطبيق رسوم عند تجاوز الأبعاد القصوى
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings?.shippingRules?.dimensions?.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          shippingRules: {
                            ...settings.shippingRules,
                            dimensions: {
                              ...settings.shippingRules?.dimensions,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A2B4C]"></div>
                  </label>
                </div>
                {settings?.shippingRules?.dimensions?.enabled && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          الطول (cm)
                        </label>
                        <input
                          type="number"
                          value={settings?.shippingRules?.dimensions?.maxLength}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingRules: {
                                ...settings.shippingRules,
                                dimensions: {
                                  ...settings.shippingRules?.dimensions,
                                  maxLength: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full border rounded-lg p-2 bg-gray-50 text-center"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          العرض (cm)
                        </label>
                        <input
                          type="number"
                          value={settings?.shippingRules?.dimensions?.maxWidth}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingRules: {
                                ...settings.shippingRules,
                                dimensions: {
                                  ...settings.shippingRules?.dimensions,
                                  maxWidth: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full border rounded-lg p-2 bg-gray-50 text-center"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          الارتفاع (cm)
                        </label>
                        <input
                          type="number"
                          value={settings?.shippingRules?.dimensions?.maxHeight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              shippingRules: {
                                ...settings.shippingRules,
                                dimensions: {
                                  ...settings.shippingRules?.dimensions,
                                  maxHeight: parseInt(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full border rounded-lg p-2 bg-gray-50 text-center"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        سعر الزيادة الكلية (د.ج)
                      </label>
                      <input
                        type="number"
                        value={settings?.shippingRules?.dimensions?.extraFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            shippingRules: {
                              ...settings.shippingRules,
                              dimensions: {
                                ...settings.shippingRules?.dimensions,
                                extraFee: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full border rounded-lg p-2 bg-gray-50 text-left text-[#F15C64] font-bold"
                        dir="ltr"
                      />
                    </div>
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl leading-relaxed">
                      <strong>ملاحظة:</strong> إذا تجاوز المنتج أي بُعد من
                      الأبعاد المحددة، ستتم إضافة هذه الرسوم تلقائياً.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profits Tab */}
        {activeTab === "profits" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                التقارير والأرباح
              </h1>
            </div>

            {(() => {
              const totalRevenue = Object.values(productStats).reduce((acc, stat: any) => acc + stat.totalRevenue, 0);
              const totalCost = Object.values(productStats).reduce((acc, stat: any) => acc + stat.totalCost, 0);
              const netProfit = Object.values(productStats).reduce((acc, stat: any) => acc + stat.netProfit, 0) as number;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 font-bold mb-1">
                        إجمالي المبيعات (المنتجات)
                      </p>
                      <p className="text-3xl font-black text-[#1A2B4C]" dir="ltr">
                        {totalRevenue.toLocaleString()}{" "}
                        د.ج
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                      <ShoppingCart size={24} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 font-bold mb-1">
                        إجمالي تكلفة الشراء
                      </p>
                      <p className="text-3xl font-black text-rose-500" dir="ltr">
                        {totalCost.toLocaleString()}{" "}
                        د.ج
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 font-bold mb-1">صافي الأرباح</p>
                      <p className={`text-3xl font-black ${netProfit >= 0 ? "text-emerald-500" : "text-[#F15C64]"}`} dir="ltr">
                        {netProfit.toLocaleString()}{" "}
                        د.ج
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netProfit >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-[#F15C64]"}`}>
                      <TrendingUp size={24} />
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <DollarSign className="text-emerald-500" size={20} />
                  أرباح المنتجات مفصلة
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        المنتج
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        الكمية المباعة
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        سعر الشراء
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجمالي سعر الشراء
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        سعر البيع
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجمالي المبيعات
                      </th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">
                        إجمالي الربح
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {Object.entries(productStats)
                      .filter(([_, stat]: [string, any]) => stat.salesCount > 0)
                      .map(([id, stat]: [string, any]) => {
                        const profit = stat.netProfit;
                        const totalSales = stat.totalRevenue;
                        const costPrice = stat.totalCost / stat.salesCount || 0;
                        const numericPrice = stat.totalRevenue / stat.salesCount || 0;
                        return (
                          <tr
                            key={id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-[#1A2B4C] font-bold flex items-center gap-2">
                              {stat.image && (
                                <img
                                  src={stat.image}
                                  className="w-8 h-8 rounded object-cover border"
                                />
                              )}
                              {!stat.image && <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-xs text-gray-400">?</div>}
                              {stat.name}
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-bold">
                              {stat.salesCount}
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-medium">
                              {costPrice.toLocaleString()} د.ج
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-medium" dir="ltr">
                              {stat.totalCost.toLocaleString()} د.ج
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-medium">
                              {numericPrice.toLocaleString()} د.ج
                            </td>
                            <td
                              className="px-6 py-4 text-[#1A2B4C] font-bold"
                              dir="ltr"
                            >
                              {totalSales.toLocaleString()} د.ج
                            </td>
                            <td
                              className={`px-6 py-4 font-bold ${profit >= 0 ? "text-emerald-500" : "text-[#F15C64]"}`}
                              dir="ltr"
                            >
                              {profit.toLocaleString()} د.ج
                            </td>
                          </tr>
                        );
                      })}
                    {Object.values(productStats).filter((stat: any) => stat.salesCount > 0)
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-gray-400 font-medium"
                        >
                          ليس هناك أي مبيعات مسجلة حتى الآن
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Config Tab */}
        {activeTab === "settings_config" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-[#1A2B4C]">
                إعدادات المتجر
              </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="text-[#F15C64]" size={20} />
                  معلومات من نحن
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  value={settings?.aboutUs || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      aboutUs: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all resize-none"
                  placeholder="أدخل النص التعريفي للمتجر هنا..."
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-right">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="text-emerald-500" size={20} />
                  معلومات التواصل
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-phone" className="text-sm font-bold text-gray-700">
                      رقم الهاتف
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.phone !== false} onChange={(e) => updateContactVisibility("phone", e.target.checked)} aria-label="إظهار رقم الهاتف في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-phone"
                      type="text"
                      value={settings?.contact?.phone || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, phone: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-email" className="text-sm font-bold text-gray-700">
                      البريد الإلكتروني
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.email !== false} onChange={(e) => updateContactVisibility("email", e.target.checked)} aria-label="إظهار البريد الإلكتروني في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-email"
                      type="email"
                      value={settings?.contact?.email || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, email: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-address" className="text-sm font-bold text-gray-700">
                      العنوان المكتوب
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.address !== false} onChange={(e) => updateContactVisibility("address", e.target.checked)} aria-label="إظهار العنوان المكتوب في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-address"
                      type="text"
                      value={settings?.contact?.address || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, address: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-address-url" className="text-sm font-bold text-gray-700">
                      رابط خريطة العنوان (Google Maps)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.addressUrl !== false} onChange={(e) => updateContactVisibility("addressUrl", e.target.checked)} aria-label="إظهار رابط خريطة العنوان في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-address-url"
                      type="url"
                      value={settings?.contact?.addressUrl || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, addressUrl: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-instagram" className="text-sm font-bold text-gray-700">
                      رابط إنستغرام
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.instagram !== false} onChange={(e) => updateContactVisibility("instagram", e.target.checked)} aria-label="إظهار رابط إنستغرام في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-instagram"
                      type="url"
                      value={settings?.contact?.instagram || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, instagram: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <label htmlFor="contact-facebook" className="text-sm font-bold text-gray-700">
                      رابط صفحة فيسبوك
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={settings?.contactVisibility?.facebook !== false} onChange={(e) => updateContactVisibility("facebook", e.target.checked)} aria-label="إظهار رابط فيسبوك في الموقع" />
                        إظهار في الموقع
                      </label>
                    </div>
                    <input
                      id="contact-facebook"
                      type="url"
                      value={settings?.contact?.facebook || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          contact: { ...settings?.contact, facebook: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F15C64]/20 focus:border-[#F15C64] transition-all"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-in zoom-in-95"
            dir="rtl"
          >
            <h2 className="text-xl font-bold mb-4">
              تفاصيل الطلب: {editingOrder.id}
            </h2>
            <form onSubmit={saveOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    اسم الزبون
                  </label>
                  <input
                    type="text"
                    value={editingOrder.customerName}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={editingOrder.phone}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    الولاية
                  </label>
                  <select
                    value={editingOrder.wilaya}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        wilaya: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50"
                  >
                    {shippingPrices.map((s) => (
                      <option key={s.wilaya} value={s.wilaya}>
                        {s.wilaya}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    حالة الطلب
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        status: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="confirmed">تأكيد (جاري الشحن)</option>
                    <option value="shipped">تم الشحن / التوصيل</option>
                    <option value="cancelled">ملغى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    نوع التوصيل
                  </label>
                  <select
                    value={editingOrder.deliveryType || "home"}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        deliveryType: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50"
                  >
                    <option value="home">للمنزل</option>
                    <option value="desk">للمكتب (Stop-Desk)</option>
                  </select>
                </div>
              </div>

              {/* Detailed list of products in the edit order modal */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  تفاصيل المنتجات المشتراة:
                </h3>
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {editingOrder.cartItems && Array.isArray(editingOrder.cartItems) && editingOrder.cartItems.length > 0 ? (
                    editingOrder.cartItems.map((item: any, idx: number) => {
                      const prod = products.find((p) => p.id === item.id);
                      return (
                        <div key={idx} className="flex bg-gray-50 p-2.5 rounded-xl border border-gray-100 items-center gap-3">
                          {prod?.image && (
                            <img
                              src={prod.image || undefined}
                              className="w-12 h-12 object-cover rounded-lg border bg-white shrink-0"
                              alt={prod.name}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-[#1A2B4C] truncate mb-1">
                              {prod ? prod.name : "منتج غير معروف"}
                            </h4>
                            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1 bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-150">
                                  <span className="w-2.5 h-2.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: item.selectedColor.includes('#') ? item.selectedColor.substring(item.selectedColor.indexOf('#')).replace(')', '') : item.selectedColor }} />
                                  {item.selectedColor.includes('(') ? item.selectedColor.substring(0, item.selectedColor.indexOf('(')).trim() : item.selectedColor}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="bg-white text-[#F15C64] px-1.5 py-0.5 rounded border border-[#FDE9EB]">
                                  المقاس: {item.selectedSize}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left font-sans shrink-0">
                            <span className="text-xs font-bold text-gray-500 block">
                              × {item.quantity}
                            </span>
                            <span className="text-xs font-black text-[#F15C64]" dir="ltr">
                              {((prod?.numericPrice || 0) * item.quantity).toLocaleString()} د.ج
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-400 font-semibold bg-gray-50 p-3 rounded-lg text-center">
                      عدد المنتجات الاجمالي: {editingOrder.items || 0}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 border rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A2B4C] text-white rounded-lg font-bold hover:bg-opacity-90"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in zoom-in-95"
            dir="rtl"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingProduct.id ? "تعديل منتج" : "إضافة منتج جديد"}
            </h2>
            <form onSubmit={saveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    اسم المنتج
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    صورة المنتج
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50/40 p-2 rounded-xl border border-gray-100 mt-1">
                    {editingProduct.image && (
                      <img
                        src={editingProduct.image || undefined}
                        className="w-12 h-12 object-cover rounded-lg border shrink-0 bg-gray-100"
                        alt="Preview"
                      />
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-2 bg-gray-50 hover:bg-gray-100/50 cursor-pointer transition-colors text-center">
                      <Upload className="text-gray-400 mb-0.5" size={16} />
                      <span className="text-[10px] font-black text-gray-600">
                        اختر صورة من الهاتف
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file, adminSessionToken).then((compressedBase64) => {
                              setEditingProduct({
                                ...editingProduct,
                                image: compressedBase64,
                                imageColor: editingProduct.imageColor || "#FFC0CB", // default color
                              });
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  {editingProduct.image && (
                    <div className="mt-2 flex items-center justify-between bg-[#FDE9EB]/20 border border-[#FDE9EB]/40 p-2 rounded-xl animate-in slide-in-from-top-1 duration-200">
                      <span className="text-[11px] font-bold text-gray-500">لون الصورة الأساسية:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSamplerActive({
                            imageUrl: editingProduct.image,
                            onSelect: (hex) => {
                              setEditingProduct((prev: any) => ({
                                ...prev,
                                imageColor: hex,
                              }));
                            },
                          })
                        }
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition-all"
                      >
                        <span
                          className="w-5 h-5 rounded-full border shadow-inner shrink-0"
                          style={{ backgroundColor: editingProduct.imageColor || "#FFC0CB" }}
                        />
                        <span className="text-[10px] font-mono font-bold text-gray-700">
                          {editingProduct.imageColor || "#FFC0CB"}
                        </span>
                        <Pipette size={12} className="text-[#F15C64]" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="hidden">السعر المعروض</label>
                  <input type="hidden" value={editingProduct.price || ""} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    سعر البيع (رقمي)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.numericPrice}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        numericPrice: parseInt(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    سعر الشراء (التكلفة)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costPrice: parseInt(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    كمية المخزون الإبتدائية
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stockQty || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockQty: parseInt(e.target.value),
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    القسم
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const selectedCat = categories.find(
                        (c) => c.name === e.target.value,
                      );
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                        subcategory: selectedCat?.subcategories?.length
                          ? selectedCat.subcategories[0].name
                          : "",
                      });
                    }}
                    className="w-full border rounded-lg p-2 bg-gray-50"
                  >
                    <option value="">اختر القسم</option>
                    {categories.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const currentCat = categories.find(
                    (c) => c.name === editingProduct.category,
                  );
                  if (
                    currentCat &&
                    currentCat.subcategories &&
                    currentCat.subcategories.length > 0
                  ) {
                    return (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          القسم الصغير
                        </label>
                        <select
                          value={editingProduct.subcategory || ""}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              subcategory: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg p-2 bg-gray-50"
                        >
                          <option value="">اختر القسم الصغير</option>
                          {currentCat.subcategories.map(
                            (sub: any, i: number) => (
                              <option key={i} value={sub.name}>
                                {sub.name}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    المقاسات (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={(editingProduct.sizes || []).join(",")}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        sizes: e.target.value.split(",").map((size) => size.trim()),
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    placeholder="S,M,L"
                  />
                </div>
                {(editingProduct.sizes || []).filter((size: string) => size).length > 0 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      مخزون كل {editingColorChoices.length > 0 ? "تركيبة لون ومقاس" : "مقاس"}
                    </label>
                    {editingColorChoices.length > 0 ? (
                      <div className="space-y-4">
                        {editingColorChoices.map((variant) => (
                          <div key={variant.colorCode} className="rounded-xl border border-gray-100 p-3">
                            <p className="mb-3 text-sm font-bold text-gray-700">
                              <span
                                className="ml-2 inline-block h-3 w-3 rounded-full border border-gray-300 align-middle"
                                style={{ backgroundColor: variant.colorCode }}
                              />
                              {variant.colorName}
                            </p>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              {(editingProduct.sizes || [])
                                .filter((size: string) => size)
                                .map((size: string) => {
                                  const key = getSizeColorStockKey(variant.colorCode, size);
                                  const stock = editingProduct.variantSizeStock?.[key];
                                  return (
                                    <label key={key} className="text-xs font-bold text-gray-600">
                                      {size} · {stock === undefined || stock === "" ? "مشترك" : Number(stock) > 0 ? "متوفر" : "غير متوفر"}
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={stock ?? ""}
                                        onChange={(e) => {
                                          const variantSizeStock = { ...(editingProduct.variantSizeStock || {}) };
                                          if (e.target.value === "") {
                                            delete variantSizeStock[key];
                                          } else {
                                            variantSizeStock[key] = Number(e.target.value);
                                          }
                                          setEditingProduct({ ...editingProduct, variantSizeStock });
                                        }}
                                        className="w-full border rounded-lg p-2 mt-1 bg-gray-50 focus:bg-white"
                                      />
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {(editingProduct.sizes || [])
                          .filter((size: string) => size)
                          .map((size: string) => {
                            const stock = editingProduct.sizeStock?.[size];
                            return (
                              <label key={size} className="text-xs font-bold text-gray-600">
                                {size} · {stock === undefined || stock === "" ? "مشترك" : Number(stock) > 0 ? "متوفر" : "غير متوفر"}
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={stock ?? ""}
                                  onChange={(e) => {
                                    const sizeStock = { ...(editingProduct.sizeStock || {}) };
                                    if (e.target.value === "") {
                                      delete sizeStock[size];
                                    } else {
                                      sizeStock[size] = Number(e.target.value);
                                    }
                                    setEditingProduct({ ...editingProduct, sizeStock });
                                  }}
                                  className="w-full border rounded-lg p-2 mt-1 bg-gray-50 focus:bg-white"
                                />
                              </label>
                            );
                          })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      اترك جميع الحقول فارغة لاستخدام المخزون الإجمالي الحالي. عند إدخال المخزون المستقل يجب إدخال كمية لكل مقاس أو تركيبة.
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white h-24"
                  />
                </div>

                {/* Option to toggle presence in "New arrivals" */}
                <div className="col-span-2 bg-[#FDE9EB]/30 border border-[#FDE9EB] rounded-2xl p-4 mt-2">
                  <label className="relative inline-flex items-center cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isNewArrivalEnabled(editingProduct.isNewArrival)}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          isNewArrival: e.target.checked,
                        })
                      }
                    />
                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#F15C64]"></div>
                    <span className="ms-3 text-sm font-bold text-[#1A2B4C]">
                      عرض هذا المنتج في قسم "وصلنا حديثاً" ليكون متاحاً في الواجهة الرئيسية للمتجر بشكل اختياري
                      <span className={`block mt-1 ${isNewArrivalEnabled(editingProduct.isNewArrival) ? "text-emerald-600" : "text-gray-500"}`}>
                        {isNewArrivalEnabled(editingProduct.isNewArrival)
                          ? "الحالة: مفعّل — سيظهر في الموقع"
                          : "الحالة: غير مفعّل — لن يظهر في الموقع"}
                      </span>
                    </span>
                  </label>
                </div>

                {/* Gallery of extra images with interactive color circles under each */}
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <h3 className="font-bold text-[#1A2B4C] mb-2 flex items-center gap-2">
                    <span className="bg-red-50 text-[#F15C64] p-1.5 rounded-lg text-sm">📷</span>
                    معرض صور الخيارات وألوانها المحددة تلقائياً 🪄
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 font-medium font-semibold leading-relaxed">
                    عند رفع صورة إضافية تظهر تحتها دائرة اللون تلقائياً، يمكنك الضغط عليها لتشغيل القلم السحري وتحديد لون القماش من داخل الصورة بذكاء لربطها ببعضها.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(editingProduct.images || []).map((imgUrl: string, index: number) => {
                      const imageColor = (editingProduct.imageColors && editingProduct.imageColors[index]) || "#CCCCCC";
                      return (
                        <div key={index} className="flex flex-col gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100/80 shadow-sm animate-in zoom-in-95 duration-155">
                          <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-gray-100 group shadow-sm bg-white flex items-center justify-center">
                            <img src={imgUrl || undefined} className="w-full h-full object-cover animate-in fade-in" alt="Gallery thumbnail" />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedImgs = [...(editingProduct.images || [])];
                                updatedImgs.splice(index, 1);
                                const updatedColors = [...(editingProduct.imageColors || [])];
                                updatedColors.splice(index, 1);
                                setEditingProduct({
                                  ...editingProduct,
                                  images: updatedImgs,
                                  imageColors: updatedColors,
                                });
                              }}
                              className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow transition-all scale-95 opacity-80 group-hover:opacity-100 cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Color Circle Representation Under the Image */}
                          <div className="flex flex-col items-center justify-center gap-1.5 border-t border-gray-100/50 pt-2 pb-1">
                            <span className="text-[10px] font-black text-gray-400">لون الصورة:</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSamplerActive({
                                  imageUrl: imgUrl,
                                  onSelect: (hex) => {
                                    const updatedColors = [...(editingProduct.imageColors || [])];
                                    updatedColors[index] = hex;
                                    setEditingProduct((prev: any) => ({
                                      ...prev,
                                      imageColors: updatedColors,
                                    }));
                                  },
                                })
                              }
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white hover:border-gray-100 cursor-pointer shadow-sm transition-all"
                            >
                              <span
                                className="w-4 h-4 rounded-full border shadow-inner shrink-0 animate-pulse duration-1000"
                                style={{ backgroundColor: imageColor }}
                              />
                              <span className="text-[9px] font-mono font-bold text-gray-500">
                                {imageColor}
                              </span>
                              <Pipette size={11} className="text-[#F15C64]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <label className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 hover:bg-gray-100/50 cursor-pointer text-center aspect-[4/5] min-h-[140px] transition-all text-gray-400">
                      <Plus className="mb-1 text-gray-400" size={24} />
                      <span className="text-[10px] font-black">إضافة خيار/لون</span>
                      <span className="text-[8px] text-gray-400 mt-0.5">رفع صورة جديدة</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file, adminSessionToken).then((compressedBase64) => {
                              const existingImgs = editingProduct.images || [];
                              const existingColors = editingProduct.imageColors || [];
                              setEditingProduct({
                                ...editingProduct,
                                images: [...existingImgs, compressedBase64],
                                imageColors: [...existingColors, "#CCCCCC"], // Default color for newly added image
                              });
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Advanced Shipping Rules for Product */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <h3 className="font-bold text-[#1A2B4C] mb-4">
                    إعدادات الشحن الإضافية
                  </h3>

                  <div className="space-y-4">
                    {/* Weight toggle & field */}
                    <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                      <label className="relative inline-flex items-center cursor-pointer mb-2 w-fit">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={editingProduct.applyWeightRule || false}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              applyWeightRule: e.target.checked,
                            })
                          }
                        />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A2B4C]"></div>
                        <span className="ms-3 text-sm font-bold text-gray-700">
                          هذا المنتج يخضع لشرط الوزن
                        </span>
                      </label>
                      {editingProduct.applyWeightRule && (
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            الوزن (KG)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editingProduct.weight || ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                weight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full border rounded-lg p-2 bg-white"
                            placeholder="مثال: 5.5"
                            dir="ltr"
                          />
                        </div>
                      )}
                    </div>

                    {/* Dimensions toggle & fields */}
                    <div className="flex flex-col gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                      <label className="relative inline-flex items-center cursor-pointer mb-2 w-fit">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={editingProduct.applyDimensionsRule || false}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              applyDimensionsRule: e.target.checked,
                            })
                          }
                        />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A2B4C]"></div>
                        <span className="ms-3 text-sm font-bold text-gray-700">
                          هذا المنتج يخضع لشرط الأبعاد
                        </span>
                      </label>
                      {editingProduct.applyDimensionsRule && (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              الطول (cm)
                            </label>
                            <input
                              type="number"
                              value={editingProduct.length || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  length: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full border rounded-lg p-2 bg-white text-center"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              العرض (cm)
                            </label>
                            <input
                              type="number"
                              value={editingProduct.width || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  width: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full border rounded-lg p-2 bg-white text-center"
                              dir="ltr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">
                              الارتفاع (cm)
                            </label>
                            <input
                              type="number"
                              value={editingProduct.height || ""}
                              onChange={(e) =>
                                setEditingProduct({
                                  ...editingProduct,
                                  height: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full border rounded-lg p-2 bg-white text-center"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A2B4C] text-white rounded-lg font-bold hover:bg-opacity-90"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in zoom-in-95"
            dir="rtl"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingCategory.isNew ? "إضافة قسم" : "تعديل القسم"}
            </h2>
            <form onSubmit={saveCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    اسم القسم
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    صورة القسم
                  </label>
                  <div className="flex items-center gap-3 bg-gray-50/45 p-2 rounded-xl border border-gray-100 mt-1">
                    {editingCategory.image && (
                      <img
                        src={editingCategory.image || undefined}
                        className="w-12 h-12 object-cover rounded-lg border shrink-0 bg-gray-100"
                        alt="Preview"
                      />
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-2 bg-gray-50 hover:bg-gray-100/50 cursor-pointer transition-colors text-center">
                      <Upload className="text-gray-400 mb-0.5" size={16} />
                      <span className="text-[10px] font-black text-gray-600">
                        اختر صورة من الهاتف
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file, adminSessionToken).then((compressedBase64) => {
                              setEditingCategory({
                                ...editingCategory,
                                image: compressedBase64,
                              });
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-[#1A2B4C]">
                    الأقسام الصغيرة (اختياري)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCategory({
                        ...editingCategory,
                        subcategories: [
                          ...(editingCategory.subcategories || []),
                          { name: "", image: "" },
                        ],
                      })
                    }
                    className="text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={14} /> إضافة قسم صغير
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingCategory.subcategories || []).map(
                    (sub: any, i: number) => (
                      <div
                        key={i}
                        className="flex gap-2 items-center bg-gray-50 p-2 text-sm rounded-lg border border-gray-100"
                      >
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => {
                            const newSubs = [...editingCategory.subcategories];
                            newSubs[i].name = e.target.value;
                            setEditingCategory({
                              ...editingCategory,
                              subcategories: newSubs,
                            });
                          }}
                          placeholder="اسم القسم الصغير"
                          className="flex-1 border rounded p-1.5 focus:bg-white"
                          required
                        />
                        <div className="flex gap-2 items-center">
                          {sub.image ? (
                            <img src={sub.image || undefined} className="w-8 h-8 object-cover rounded border border-gray-200 animate-in fade-in" alt="Sub preview" />
                          ) : (
                            <div className="w-8 h-8 rounded border border-dashed border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 text-[9px] font-bold shrink-0">بلا صورة</div>
                          )}
                          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-200 py-1.5 px-2.5 rounded text-xs font-bold text-gray-700 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors">
                            <Upload size={13} />
                            <span>رفع صورة</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  compressImage(file, adminSessionToken).then((compressedBase64) => {
                                    const newSubs = [...editingCategory.subcategories];
                                    newSubs[i].image = compressedBase64;
                                    setEditingCategory({
                                      ...editingCategory,
                                      subcategories: newSubs,
                                    });
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSubs = [...editingCategory.subcategories];
                            newSubs.splice(i, 1);
                            setEditingCategory({
                              ...editingCategory,
                              subcategories: newSubs,
                            });
                          }}
                          className="text-white bg-red-500 hover:bg-red-600 p-1.5 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ),
                  )}
                  {!(editingCategory.subcategories?.length > 0) && (
                    <p className="text-xs text-gray-400 text-center py-2 border border-dashed rounded-lg">
                      لا يوجد أقسام صغيرة بعد.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A2B4C] text-white rounded-lg font-bold hover:bg-opacity-90"
                >
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {editingShipping && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4">
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl relative animate-in zoom-in-95"
            dir="rtl"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingShipping.isNew ? "إضافة تسعيرة" : "تعديل تسعيرة الشحن"}
            </h2>
            <form onSubmit={saveShipping} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  الولاية
                </label>
                <select
                  value={editingShipping.wilaya}
                  onChange={(e) =>
                     setEditingShipping({
                       ...editingShipping,
                       wilaya: e.target.value,
                     })
                  }
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white text-sm font-bold text-[#1A2B4C]"
                  required
                >
                  <option value="">اختر الولاية...</option>
                  {wilayasAlgeria.map((w) => (
                     <option key={w} value={w}>
                       {w}
                     </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  سعر التوصيل للمنزل (د.ج)
                </label>
                <input
                  type="number"
                  value={editingShipping.price}
                  onChange={(e) =>
                    setEditingShipping({
                      ...editingShipping,
                      price: parseInt(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  سعر التوصيل للمكتب (اختياري)
                </label>
                <input
                  type="number"
                  value={editingShipping.priceDesk || ""}
                  onChange={(e) =>
                    setEditingShipping({
                      ...editingShipping,
                      priceDesk: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full border rounded-lg p-2 bg-gray-50 focus:bg-white"
                  placeholder="مثال: 200"
                />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setEditingShipping(null)}
                  className="px-4 py-2 border rounded-lg font-bold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A2B4C] text-white rounded-lg font-bold hover:bg-opacity-90"
                >
                  حفظ التسعيرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {samplerActive && (
        <ImageColorSamplerModal
          imageUrl={samplerActive.imageUrl}
          onSelect={(hex) => {
            samplerActive.onSelect(hex);
            setSamplerActive(null);
          }}
          onClose={() => setSamplerActive(null)}
        />
      )}
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  id,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  badge,
}: any) {
  const active = activeTab === id;
  return (
    <button
      onClick={() => {
        setActiveTab(id);
        if (typeof window !== "undefined" && window.innerWidth <= 1024 && setIsSidebarOpen) {
          setIsSidebarOpen(false);
        }
      }}
      className={`flex items-center gap-3 p-3 rounded-xl transition-colors relative ${active ? "bg-[#FDE9EB] text-[#F15C64]" : "text-gray-500 hover:bg-gray-50 hover:text-[#1A2B4C]"}`}
    >
      <Icon size={22} className={active ? "text-[#F15C64]" : ""} />
      {isSidebarOpen && (
        <span className="font-bold text-sm whitespace-nowrap">{label}</span>
      )}

      {badge > 0 && isSidebarOpen && (
        <span className="absolute left-3 bg-[#F15C64] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {!isSidebarOpen && badge > 0 && (
        <span className="absolute top-2 right-2 w-3 h-3 bg-[#F15C64] rounded-full border-2 border-white"></span>
      )}
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-gray-500 text-sm font-bold mb-2">{title}</h3>
        <p
          className="text-2xl font-black text-[#1A2B4C] leading-none"
          dir="ltr"
        >
          {value}
        </p>
      </div>
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={24} />
      </div>
    </div>
  );
}
