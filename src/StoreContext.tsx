import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { initialProducts, initialCategories, initialOrders, shippingRates, wilayasAlgeria } from './data';

type GlobalState = {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  orders: any[];
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  shippingPrices: any[];
  setShippingPrices: React.Dispatch<React.SetStateAction<any[]>>;
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  abandonedCartCount: Record<number, number>;
  setAbandonedCartCount: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  dismissedAbandonedNotifications: number[];
  setDismissedAbandonedNotifications: React.Dispatch<React.SetStateAction<number[]>>;
  cartItems: { id: number; quantity: number; selectedColor?: string; selectedSize?: string; }[];
  setCartItems: React.Dispatch<React.SetStateAction<{ id: number; quantity: number; selectedColor?: string; selectedSize?: string; }[]>>;
  likedProducts: number[];
  setLikedProducts: React.Dispatch<React.SetStateAction<number[]>>;
};

const StoreContext = createContext<GlobalState | undefined>(undefined);
let adminSessionToken: string | null = null;

export function setStoreAdminSessionToken(token: string | null) {
  adminSessionToken = token;
}

const aboutUsText = "نحن متجر متخصص في الأزياء الشبابية والملابس الرياضية والأحذية العصرية، نسعى إلى تقديم تشكيلة تجمع بين الأناقة والراحة ومواكبة أحدث صيحات الموضة، لنساعدكم على التعبير عن أسلوبكم وشخصيتكم بكل ثقة.\n\nنحرص على توفير منتجات تناسب أذواقكم واحتياجاتكم، مع الاهتمام بتجربة تسوق سهلة ومريحة وخدمة تليق بكم.\n\nLA BOOM CLOTHES — أسلوبك، هويتك.";
const contactVisibilityDefaults = {
  phone: true,
  address: true,
  addressUrl: true,
  email: true,
  instagram: true,
  facebook: true,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [deviceId] = useState(() => {
      let id = localStorage.getItem("deviceId");
      if (!id) {
          const randomBytes = crypto.getRandomValues(new Uint8Array(16));
          id = Array.from(randomBytes, (value) => value.toString(16).padStart(2, "0")).join("");
          localStorage.setItem("deviceId", id);
      }
      return id;
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [shippingPrices, setShippingPrices] = useState(shippingRates);
  const [settings, setSettings] = useState({
      nextOrderNumber: 1061,
      shippingRules: {
        weight: { enabled: false, maxWeight: 5, extraPerKg: 50 },
        dimensions: { enabled: false, maxLength: 100, maxWidth: 50, maxHeight: 50, extraFee: 300 }
      },
      aboutUs: aboutUsText,
      contactVisibility: contactVisibilityDefaults,
      contact: {
          phone: "0559 20 88 84",
          email: "ayachirouibi@04gmail.com",
          address: "LA BOOM CLOTHES",
          addressUrl: "https://www.google.com/maps/place/Boutique+Aya+Kids/@35.6865764,-0.6524095,17z/data=!3m1!4b1!4m6!3m5!1s0xd7e893bd38ffe9d:0x2ab147fa280cb496!8m2!3d35.6865764!4d-0.6524095!16s%2Fg%2F11jvbng0bc?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D",
          instagram: "https://www.instagram.com/ayakids1",
          facebook: "https://www.facebook.com/AyaKids"
      }
  });

  const [cartItems, setCartItems] = useState<{ id: number; quantity: number, selectedColor?: string, selectedSize?: string }[]>([]);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [abandonedCartCount, setAbandonedCartCount] = useState<Record<number, number>>({});
  const [dismissedAbandonedNotifications, setDismissedAbandonedNotifications] = useState<number[]>([]);

  const isInitialLoad = useRef(true);

  // Load Everything From DB
  useEffect(() => {
    // Standard basic endpoints
    fetch("/api/products").then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : [])).catch(console.error);
    fetch("/api/categories").then(res => res.json()).then(data => setCategories(Array.isArray(data) ? data : [])).catch(console.error);

    // Settings
    fetch("/api/settings").then(res => res.json()).then(data => {
        if (data.shippingPrices) setShippingPrices(data.shippingPrices);
        if (data.settings) {
            const settings = { ...data.settings };
            settings.contactVisibility = {
                ...contactVisibilityDefaults,
                ...data.settings.contactVisibility
            };
            if (typeof settings.aboutUs === "string") {
                settings.aboutUs = aboutUsText;
            }
            if (typeof settings.contact?.address === "string") {
                settings.contact = {
                    ...settings.contact,
                    address: settings.contact.address.replace(/AYA Kids/gi, "LA BOOM CLOTHES")
                };
            }
            setSettings(settings);
        }
    }).catch(console.error);

    // User session
    fetch(`/api/user-session/${deviceId}`).then(res => res.json()).then(data => {
        if (data.cartItems) setCartItems(data.cartItems);
        if (data.likedProducts) setLikedProducts(data.likedProducts);
        if (data.abandonedCartCount) setAbandonedCartCount(data.abandonedCartCount);
        if (data.dismissedAbandonedNotifications) setDismissedAbandonedNotifications(data.dismissedAbandonedNotifications);
        isInitialLoad.current = false;
    }).catch(() => { isInitialLoad.current = false; });
  }, []);

  // Sync Settings to DB whenever they change (debounce/setTimeout could be used but simple effect works fine here)
  useEffect(() => {
      if (isInitialLoad.current) return;
      if (!adminSessionToken) return;
      fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSessionToken}` },
          body: JSON.stringify({ key: "settings", value: settings })
      }).then((response) => {
          if (!response.ok) throw new Error(`Failed to save settings: ${response.status}`);
      }).catch(console.error);
  }, [settings]);

  useEffect(() => {
      if (isInitialLoad.current) return;
      if (!adminSessionToken) return;
      fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminSessionToken}` },
          body: JSON.stringify({ key: "shippingPrices", value: shippingPrices })
      }).then((response) => {
          if (!response.ok) throw new Error(`Failed to save shipping prices: ${response.status}`);
      }).catch(console.error);
  }, [shippingPrices]);

  // Sync User Session to DB
  useEffect(() => {
      if (isInitialLoad.current) return;
      fetch(`/api/user-session/${deviceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItems, likedProducts, abandonedCartCount, dismissedAbandonedNotifications })
      }).catch(console.error);
  }, [cartItems, likedProducts, abandonedCartCount, dismissedAbandonedNotifications]);


  return (
    <StoreContext.Provider value={{ products, setProducts, categories, setCategories, orders, setOrders, shippingPrices, setShippingPrices, settings, setSettings, abandonedCartCount, setAbandonedCartCount, dismissedAbandonedNotifications, setDismissedAbandonedNotifications, cartItems, setCartItems, likedProducts, setLikedProducts }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
