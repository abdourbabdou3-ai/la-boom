export const wilayasAlgeria = [
  "1 - أدرار", "2 - الشلف", "3 - الأغواط", "4 - أم البواقي", "5 - باتنة", "6 - بجاية", "7 - بسكرة", "8 - بشار", "9 - البليدة", "10 - البويرة",
  "11 - تمنراست", "12 - تبسة", "13 - تلمسان", "14 - تيارت", "15 - تيزي وزو", "16 - الجزائر", "17 - الجلفة", "18 - جيجل", "19 - سطيف", "20 - سعيدة",
  "21 - سكيكدة", "22 - سيدي بلعباس", "23 - عنابة", "24 - قالمة", "25 - قسنطينة", "26 - المدية", "27 - مستغانم", "28 - المسيلة", "29 - معسكر", "30 - ورقلة",
  "31 - وهران", "32 - البيض", "33 - إليزي", "34 - برج بوعريريج", "35 - بومرداس", "36 - الطارف", "37 - تندوف", "38 - تيسمسيلت", "39 - الوادي", "40 - خنشلة",
  "41 - سوق أهراس", "42 - تيبازة", "43 - ميلة", "44 - عين الدفلى", "45 - النعامة", "46 - عين تموشنت", "47 - غرداية", "48 - غليزان", "49 - تيميمون", "50 - برج باجي مختار",
  "51 - أولاد جلال", "52 - بني عباس", "53 - عين صالح", "54 - عين قزام", "55 - تقرت", "56 - جانت", "57 - المغير", "58 - المنيعة",
  "59 - أفلو", "60 - بريكة", "61 - القنطرة", "62 - بئر العاتر", "63 - العريشة", "64 - قصر الشلالة",
  "65 - عين وسارة", "66 - مسعد", "67 - قصر البخاري", "68 - بوسعادة", "69 - الأبيض سيدي الشيخ"
];

export const initialCategories = [
  { name: 'الإكسسوارات', image: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', keyword: 'إكسسوارات', subcategories: [] },
  { name: 'أطقم كاملة', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', keyword: 'أطقم', subcategories: [] },
  { name: 'بنات', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', keyword: 'بنات', subcategories: [] },
  { name: 'أولاد', image: 'https://images.unsplash.com/photo-1601614407886-f18b32cc6284?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', keyword: 'أولاد', subcategories: [] },
  { name: 'رضع', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80', keyword: 'رضع', subcategories: [{ name: 'الملابس', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4' }, { name: 'السرير', image: 'https://images.unsplash.com/photo-1582282570776-e26b1ee758fe' }, { name: 'الألعاب', image: 'https://images.unsplash.com/photo-1500995617113-cf78940737ee' }] },
];

export const initialProducts = [
  {
    id: 1,
    name: "فستان بناتي ربيعي",
    price: "2,700 د.ج",
    numericPrice: 2700,
    costPrice: 1500,
    stockQty: 50,
    category: "بنات",
    age: "2-12 سنة",
    image: "https://images.unsplash.com/photo-1522771930-78848d9287dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    colors: ["#FFC0CB", "#FFFFFF", "#FF0000"],
    colorVariants: [
      { colorName: "وردي زاهي", colorCode: "#FFC0CB", image: "https://images.unsplash.com/photo-1522771930-78848d9287dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
      { colorName: "أبيض ناصع", colorCode: "#FFFFFF", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
      { colorName: "أحمر دافئ", colorCode: "#FF0000", image: "https://images.unsplash.com/photo-1546872892-db4395460775?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
    ],
    images: [
      "https://images.unsplash.com/photo-1522771930-78848d9287dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    ],
    isNewArrival: true,
    sizes: ["2-4 سنوات", "4-6 سنوات", "6-8 سنوات"],
    description: "فستان ربيعي أنيق بألوان زاهية وتصميم مريح يناسب جميع المناسبات."
  },
  {
    id: 2,
    name: "طقم ولادي كاجوال",
    price: "2,100 د.ج",
    numericPrice: 2100,
    costPrice: 1200,
    stockQty: 25,
    category: "أولاد",
    age: "2-12 سنة",
    image: "https://images.unsplash.com/photo-1546872892-db4395460775?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    colors: ["#0000FF", "#808080"],
    colorVariants: [
      { colorName: "أزرق كلاسيكي", colorCode: "#0000FF", image: "https://images.unsplash.com/photo-1546872892-db4395460775?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" },
      { colorName: "رمادي هادئ", colorCode: "#808080", image: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" }
    ],
    images: [],
    isNewArrival: true,
    sizes: ["4-6 سنوات", "6-8 سنوات", "8-10 سنوات"],
    description: "طقم ولادي كاجوال مريح وعملي، مصنوع من خامات قطنية عالية الجودة."
  },
  {
    id: 3,
    name: "قميص أطفال أنيق",
    price: "2,300 د.ج",
    numericPrice: 2300,
    costPrice: 1400,
    stockQty: 30,
    category: "أولاد",
    age: "2-12 سنة",
    image: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    colors: ["#FFFFFF", "#ADD8E6"],
    colorVariants: [],
    images: [],
    isNewArrival: true,
    sizes: ["2-4 سنوات", "4-6 سنوات", "6-8 سنوات", "8-10 سنوات"],
    description: "قميص أطفال مثالي للمناسبات الرسمية والخروجات الأنيقة."
  },
  {
    id: 4,
    name: "سالوبيت مريح للأطفال",
    price: "2,900 د.ج",
    numericPrice: 2900,
    costPrice: 1800,
    stockQty: 10,
    category: "رضع",
    age: "0-2 سنة",
    image: "https://images.unsplash.com/photo-1563223771-5fe40381ffa8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    colors: ["#FFFF00", "#FFA500"],
    colorVariants: [],
    images: [],
    isNewArrival: false,
    sizes: ["0-6 أشهر", "6-12 شهر", "12-18 شهر", "18-24 شهر"],
    description: "سالوبيت مريح ودافئ للأطفال الرضع بتصميم جذاب."
  }
];

export const initialOrders = [
  {
    id: 'AYA-2024-1058',
    customerName: 'أحمد بن علي',
    phone: '0555123456',
    wilaya: '16 - الجزائر',
    deliveryType: 'home',
    total: 5400,
    items: 2,
    status: 'pending',
    date: '2024-03-21',
    cartItems: [
      { id: 1, quantity: 2, selectedColor: 'وردي زاهي (#FFC0CB)', selectedSize: '4-6 سنوات' }
    ]
  },
  {
    id: 'AYA-2024-1059',
    customerName: 'فاطمة الزهراء',
    phone: '0777123456',
    wilaya: '31 - وهران',
    deliveryType: 'home',
    total: 2900,
    items: 1,
    status: 'confirmed',
    date: '2024-03-21',
    cartItems: [
      { id: 4, quantity: 1, selectedColor: 'أصفر ليموني (#FFFF00)', selectedSize: '6-12 شهر' }
    ]
  },
  {
    id: 'AYA-2024-1060',
    customerName: 'محمد أمين',
    phone: '0666123456',
    wilaya: '23 - عنابة',
    deliveryType: 'desk',
    total: 7800,
    items: 3,
    status: 'shipped',
    date: '2024-03-20',
    cartItems: [
      { id: 2, quantity: 3, selectedColor: 'أزرق سماوي (#0000FF)', selectedSize: '8-10 سنوات' }
    ]
  },
];

export const shippingRates = wilayasAlgeria.map((w, index) => {
  const code = index + 1;
  let price = 600;
  let priceDesk = 400;

  if (code === 16) { // الجزائر
    price = 400;
    priceDesk = 200;
  } else if (code === 31) { // وهران
    price = 800;
    priceDesk = 400;
  } else if (code === 23) { // عنابة
    price = 800;
    priceDesk = 600;
  } else if ([1, 11, 33, 37, 49, 50, 52, 53, 54, 56].includes(code)) {
    // Sahara far south
    price = 1000;
    priceDesk = 800;
  } else if ([7, 8, 12, 13, 20, 22, 30, 32, 29, 36, 39, 40, 41, 45, 46, 47, 51, 55, 57, 58].includes(code)) {
    // Other zones / high plateaus
    price = 800;
    priceDesk = 500;
  } else {
    // Standard central/north
    price = 600;
    priceDesk = 400;
  }

  return { wilaya: w, price, priceDesk };
});
