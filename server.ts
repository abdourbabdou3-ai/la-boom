import express from "express";
import path from "path";
import fs from "fs";
import { randomUUID, timingSafeEqual } from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { shippingRates } from "./src/data.ts";

dotenv.config();

if (!process.env.DB_URL || !process.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN must be configured before starting the server");
}

const client = createClient({
  url: process.env.DB_URL,
  authToken: process.env.DB_TOKEN,
});
const adminSessions = new Map<string, number>();
const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function isAdminSessionValid(req: express.Request): boolean {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    const expiresAt = token ? adminSessions.get(token) : undefined;
    if (!token || !expiresAt || expiresAt <= Date.now()) {
        if (token) adminSessions.delete(token);
        return false;
    }
    return true;
}

type InventoryOrderItem = {
    id: number;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
};

class InventoryError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

function parseProductExtraData(value: unknown, productId: number): Record<string, any> {
    if (typeof value !== "string" || value.length === 0) {
        throw new InventoryError(`بيانات المنتج ${productId} غير متاحة لتحديث المخزون`, 409);
    }
    try {
        return JSON.parse(value);
    } catch {
        throw new InventoryError(`تعذر قراءة بيانات مخزون المنتج ${productId}`, 409);
    }
}

function parseOrderCartItems(value: unknown): InventoryOrderItem[] {
    let items = value;
    if (typeof items === "string") {
        try {
            items = JSON.parse(items);
        } catch {
            throw new InventoryError("تعذر قراءة عناصر الطلب لتحديث المخزون", 409);
        }
    }
    if (!Array.isArray(items)) {
        throw new InventoryError("عناصر الطلب غير صالحة لتحديث المخزون", 409);
    }
    return items.map((item: any) => ({
        ...(item && typeof item === "object" ? item : {}),
        id: Number(item?.id),
        quantity: Number(item?.quantity),
        selectedColor: typeof item?.selectedColor === "string" ? item.selectedColor : undefined,
        selectedSize: typeof item?.selectedSize === "string" ? item.selectedSize : undefined,
    }));
}

function inventoryColorKey(selectedColor?: string): string {
    const colorCode = selectedColor?.match(/#[0-9a-f]{3,8}/i)?.[0];
    return (colorCode || selectedColor || "").trim().toLowerCase();
}

function sizeColorStockKey(selectedColor: string | undefined, size: string): string {
    return `${inventoryColorKey(selectedColor)}::${size.trim().toLowerCase()}`;
}

function getInventoryMap(value: unknown): Record<string, any> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? { ...(value as Record<string, any>) }
        : {};
}

function hasConfiguredStock(value: unknown): boolean {
    return value !== null && value !== undefined && value !== "";
}

async function validateOrderInventory(
    transaction: Awaited<ReturnType<typeof client.transaction>>,
    cartItems: InventoryOrderItem[],
) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new InventoryError("لا يحتوي الطلب على عناصر صالحة", 409);
    }

    const quantities = new Map<number, number>();
    for (const item of cartItems) {
        if (
            !Number.isSafeInteger(item.id) ||
            item.id <= 0 ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity <= 0
        ) {
            throw new InventoryError("بيانات كمية المنتجات في الطلب غير صالحة", 400);
        }
        quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
    }

    for (const [productId, quantity] of quantities) {
        const result = await transaction.execute({
            sql: "SELECT stockQty, extraData FROM products WHERE id = ?",
            args: [productId],
        });
        const row = result.rows[0];
        if (!row) {
            throw new InventoryError(`المنتج رقم ${productId} غير موجود`, 409);
        }
        const extra = parseProductExtraData(row.extraData, productId);
        const productItems = cartItems.filter((item) => item.id === productId);
        const sizes = Array.isArray(extra.sizes) ? extra.sizes.map(String) : [];
        const sizeStock = getInventoryMap(extra.sizeStock);
        const variantSizeStock = getInventoryMap(extra.variantSizeStock);
        const variants = Array.isArray(extra.colorVariants) ? extra.colorVariants : [];
        const activeSizes = sizes;
        const hasConfiguredSizeStock = activeSizes.some((size) => hasConfiguredStock(sizeStock[size]));
        const hasCombinationStock = variants.some((variant: any) =>
            activeSizes.some((size) =>
                hasConfiguredStock(variantSizeStock[sizeColorStockKey(variant.colorCode || variant.colorName, size)]),
            ),
        );
        const hasColorStock = variants.some((variant: any) => variant.stockQty !== null && variant.stockQty !== undefined && variant.stockQty !== "");
        const trackedQuantities = new Map<string, number>();

        for (const item of productItems) {
            const size = item.selectedSize?.trim() || "";
            const color = item.selectedColor || "";
            if (sizes.length > 0 && (!size || !sizes.includes(size))) {
                throw new InventoryError(`اختر مقاسًا صالحًا للمنتج ${extra.name || productId}`, 409);
            }
            if (hasCombinationStock && !size) {
                throw new InventoryError(`اختر مقاسًا ولونًا صالحين للمنتج ${extra.name || productId}`, 409);
            }

            const combinationKey = sizeColorStockKey(color, size);
            const addTrackedQuantity = (trackedKey: string, stockValue: unknown) => {
                if (!Number.isSafeInteger(Number(stockValue)) || Number(stockValue) < 0) {
                    throw new InventoryError(`بيانات مخزون المقاس أو اللون للمنتج ${extra.name || productId} غير صالحة`, 409);
                }
                trackedQuantities.set(trackedKey, (trackedQuantities.get(trackedKey) || 0) + item.quantity);
            };
            if (hasCombinationStock) {
                if (!size || !Object.prototype.hasOwnProperty.call(variantSizeStock, combinationKey)) {
                    throw new InventoryError(`مخزون المقاس واللون المختار للمنتج ${extra.name || productId} غير محدد`, 409);
                }
                addTrackedQuantity(`combination:${combinationKey}`, variantSizeStock[combinationKey]);
                continue;
            }

            if (hasConfiguredSizeStock) {
                if (!size || !Object.prototype.hasOwnProperty.call(sizeStock, size)) {
                    throw new InventoryError(`مخزون المقاس ${size || "المطلوب"} للمنتج ${extra.name || productId} غير محدد`, 409);
                }
                addTrackedQuantity(`size:${size}`, sizeStock[size]);
            }

            if (hasColorStock && !color) {
                throw new InventoryError(`يجب تحديد اللون للمنتج ${extra.name || productId}`, 409);
            }
            if (color) {
                const colorCode = inventoryColorKey(color);
                const variant = variants.find((candidate: any) =>
                    inventoryColorKey(String(candidate.colorCode || candidate.colorName || "")) === colorCode,
                );
                if (hasColorStock) {
                    if (!variant || variant.stockQty === null || variant.stockQty === undefined || variant.stockQty === "") {
                        throw new InventoryError(`مخزون اللون المختار للمنتج ${extra.name || productId} غير محدد`, 409);
                    }
                    addTrackedQuantity(`color:${colorCode}`, variant.stockQty);
                }
            }
        }

        for (const [trackedKey, requested] of trackedQuantities) {
            const key = trackedKey.replace(/^(combination|size|color):/, "");
            const available = trackedKey.startsWith("combination:")
                ? Number(variantSizeStock[key])
                : trackedKey.startsWith("size:")
                    ? Number(sizeStock[key])
                    : Number(variants.find((variant: any) =>
                        inventoryColorKey(String(variant.colorCode || variant.colorName || "")) === key,
                    )?.stockQty);
            if (requested > available) {
                const size = trackedKey.startsWith("size:") ? key : productItems.find((item) => item.selectedSize)?.selectedSize;
                throw new InventoryError(
                    size
                        ? `عذرًا، المقاس ${size} من المنتج ${extra.name || productId} غير متوفر بالكمية المطلوبة`
                        : `الكمية المطلوبة من المنتج ${extra.name || productId} تتجاوز المخزون المتاح`,
                    409,
                );
            }
        }

        const currentStock = Number(row.stockQty);
        if (!Number.isSafeInteger(currentStock) || currentStock < 0) {
            throw new InventoryError(`قيمة مخزون المنتج ${extra.name || productId} غير صالحة`, 409);
        }
        if (currentStock < quantity) {
            throw new InventoryError(`الكمية المطلوبة من المنتج ${extra.name || productId} تتجاوز المخزون المتاح`, 409);
        }
    }
}

async function adjustOrderInventory(
    transaction: Awaited<ReturnType<typeof client.transaction>>,
    cartItems: InventoryOrderItem[],
    direction: "deduct" | "restore",
) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new InventoryError("لا يحتوي الطلب على عناصر صالحة لتحديث المخزون", 409);
    }

    const quantities = new Map<number, number>();
    const stockouts: Array<{ productId: number; size: string; color: string | null }> = [];
    for (const item of cartItems) {
        const id = Number(item.id);
        const quantity = Number(item.quantity);
        if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0) {
            throw new InventoryError("بيانات كمية المنتجات في الطلب غير صالحة", 400);
        }
        quantities.set(id, (quantities.get(id) || 0) + quantity);
    }

    for (const [productId, quantity] of quantities) {
        const result = await transaction.execute({
            sql: "SELECT name, stockQty, extraData FROM products WHERE id = ?",
            args: [productId],
        });
        const row = result.rows[0];
        if (!row) {
            throw new InventoryError(`المنتج رقم ${productId} غير موجود؛ لم يتم تعديل المخزون`, 409);
        }

        const currentStock = Number(row.stockQty);
        if (!Number.isSafeInteger(currentStock) || currentStock < 0) {
            throw new InventoryError(`قيمة مخزون المنتج رقم ${productId} غير صالحة`, 409);
        }

        const nextStock = direction === "deduct" ? currentStock - quantity : currentStock + quantity;
        if (direction === "deduct" && nextStock < 0) {
            throw new InventoryError(`الكمية المطلوبة من المنتج رقم ${productId} تتجاوز المخزون المتاح`, 409);
        }
        if (!Number.isSafeInteger(nextStock)) {
            throw new InventoryError(`تجاوزت كمية المنتج رقم ${productId} النطاق المسموح`, 409);
        }

        const extraData = parseProductExtraData(row.extraData, productId);
        const variants = Array.isArray(extraData.colorVariants) ? extraData.colorVariants : [];
        const productItems = cartItems.filter((cartItem) => Number(cartItem.id) === productId);
        const sizeStock = getInventoryMap(extraData.sizeStock);
        const variantSizeStock = getInventoryMap(extraData.variantSizeStock);
        const sizes = Array.isArray(extraData.sizes) ? extraData.sizes.map(String) : [];
        const hasCombinationStock = variants.some((variant: any) =>
            sizes.some((size) =>
                hasConfiguredStock(variantSizeStock[sizeColorStockKey(variant.colorCode || variant.colorName, size)]),
            ),
        );
        const hasConfiguredSizeStock = sizes.some((size: string) => hasConfiguredStock(sizeStock[size]));
        const selectedSizes = new Map<string, number>();
        const selectedCombinations = new Map<string, { size: string; color: string; quantity: number }>();
        for (const item of productItems) {
            const size = item.selectedSize?.trim() || "";
            if (sizes.length > 0 && (!size || !sizes.includes(size))) {
                throw new InventoryError(`المقاس المحدد غير متاح للمنتج رقم ${productId}`, 409);
            }
            if (!size) {
                continue;
            }
            const combinationKey = sizeColorStockKey(item.selectedColor, size);
            if (Object.prototype.hasOwnProperty.call(variantSizeStock, combinationKey)) {
                const combination = selectedCombinations.get(combinationKey);
                selectedCombinations.set(combinationKey, {
                    size,
                    color: item.selectedColor || "",
                    quantity: (combination?.quantity || 0) + Number(item.quantity),
                });
                continue;
            }
            if (hasCombinationStock && size) {
                throw new InventoryError(`مخزون المقاس واللون المختار للمنتج رقم ${productId} غير محدد`, 409);
            }
            if (Object.prototype.hasOwnProperty.call(sizeStock, size)) {
                const sizeQuantity = sizeStock[size];
                if (sizeQuantity === null || sizeQuantity === undefined || sizeQuantity === "") {
                    continue;
                }
                if (!Number.isSafeInteger(Number(sizeQuantity)) || Number(sizeQuantity) < 0) {
                    throw new InventoryError(`قيمة مخزون المقاس للمنتج رقم ${productId} غير صالحة`, 409);
                }
                selectedSizes.set(size, (selectedSizes.get(size) || 0) + Number(item.quantity));
            } else if (hasConfiguredSizeStock && size) {
                throw new InventoryError(`مخزون المقاس ${size} للمنتج رقم ${productId} غير محدد`, 409);
            }
        }
        const hasTrackedVariantStock = variants.some((variant: any) =>
            variant.stockQty !== null &&
            variant.stockQty !== undefined &&
            variant.stockQty !== "" &&
            Number.isSafeInteger(Number(variant.stockQty)),
        );
        if (hasTrackedVariantStock && productItems.some((item) => !item.selectedColor)) {
            throw new InventoryError(
                `يجب تحديد اللون لتحديث مخزون متغيرات المنتج رقم ${productId}`,
                409,
            );
        }
        const selectedColors = new Map<number, number>();
        for (const item of productItems.filter((cartItem) => cartItem.selectedColor)) {
            const colorCode = item.selectedColor?.match(/#[0-9a-f]{3,8}/i)?.[0];
            const variantIndex = variants.findIndex((variant: any) =>
                colorCode
                    ? String(variant.colorCode || "").toLowerCase() === colorCode.toLowerCase()
                    : String(variant.colorName || "") === item.selectedColor,
            );
            const variantHasStock = variantIndex >= 0 &&
                variants[variantIndex].stockQty !== null &&
                variants[variantIndex].stockQty !== undefined &&
                variants[variantIndex].stockQty !== "";
            if (variantHasStock) {
                const combinationKey = sizeColorStockKey(item.selectedColor, item.selectedSize || "");
                if (!Object.prototype.hasOwnProperty.call(variantSizeStock, combinationKey)) {
                    selectedColors.set(
                        variantIndex,
                        (selectedColors.get(variantIndex) || 0) + Number(item.quantity),
                    );
                }
            } else if (variants.some((variant: any) =>
                variant.stockQty !== null &&
                variant.stockQty !== undefined &&
                variant.stockQty !== "" &&
                Number.isSafeInteger(Number(variant.stockQty)),
            )) {
                throw new InventoryError(
                    `تعذر تحديد مخزون اللون المختار للمنتج رقم ${productId}`,
                    409,
                );
            }
        }

        for (const [variantIndex, variantQuantity] of selectedColors) {
            const variantStock = Number(variants[variantIndex].stockQty);
            const nextVariantStock =
                direction === "deduct" ? variantStock - variantQuantity : variantStock + variantQuantity;
            if (direction === "deduct" && nextVariantStock < 0) {
                throw new InventoryError(
                    `الكمية المطلوبة من اللون المحدد للمنتج رقم ${productId} تتجاوز المخزون المتاح`,
                    409,
                );
            }
            if (!Number.isSafeInteger(nextVariantStock)) {
                throw new InventoryError(`قيمة مخزون أحد متغيرات المنتج ${productId} غير صالحة`, 409);
            }
            variants[variantIndex] = { ...variants[variantIndex], stockQty: nextVariantStock };
        }

        for (const [combinationKey, combination] of selectedCombinations) {
            const currentCombinationStock = Number(variantSizeStock[combinationKey]);
            if (!Number.isSafeInteger(currentCombinationStock) || currentCombinationStock < 0) {
                throw new InventoryError(`قيمة مخزون المقاس واللون للمنتج رقم ${productId} غير صالحة`, 409);
            }
            const nextCombinationStock = direction === "deduct"
                ? currentCombinationStock - combination.quantity
                : currentCombinationStock + combination.quantity;
            if (direction === "deduct" && nextCombinationStock < 0) {
                throw new InventoryError(
                    `الكمية المطلوبة للمقاس ${combination.size} من المنتج رقم ${productId} غير متوفرة`,
                    409,
                );
            }
            if (!Number.isSafeInteger(nextCombinationStock)) {
                throw new InventoryError(`قيمة مخزون المقاس واللون للمنتج رقم ${productId} غير صالحة`, 409);
            }
            variantSizeStock[combinationKey] = nextCombinationStock;
            if (currentCombinationStock > 0 && nextCombinationStock === 0) {
                stockouts.push({
                    productId,
                    size: combination.size,
                    color: combination.color || null,
                });
            }
        }

        for (const [size, sizeQuantity] of selectedSizes) {
            const currentSizeStock = Number(sizeStock[size]);
            const nextSizeStock =
                direction === "deduct" ? currentSizeStock - sizeQuantity : currentSizeStock + sizeQuantity;
            if (direction === "deduct" && nextSizeStock < 0) {
                throw new InventoryError(
                    `الكمية المطلوبة للمقاس المحدد للمنتج رقم ${productId} تتجاوز المخزون المتاح`,
                    409,
                );
            }
            if (!Number.isSafeInteger(nextSizeStock)) {
                throw new InventoryError(`قيمة مخزون المقاس للمنتج رقم ${productId} غير صالحة`, 409);
            }
            sizeStock[size] = nextSizeStock;
            if (currentSizeStock > 0 && nextSizeStock === 0) {
                stockouts.push({ productId, size, color: null });
            }
        }

        const updatedExtraDataValue: Record<string, any> = { ...extraData, stockQty: nextStock };
        if (Array.isArray(extraData.colorVariants)) {
            updatedExtraDataValue.colorVariants = variants;
        }
        if (selectedSizes.size > 0) {
            updatedExtraDataValue.sizeStock = sizeStock;
        }
        if (selectedCombinations.size > 0) {
            updatedExtraDataValue.variantSizeStock = variantSizeStock;
        }
        const updatedExtraData = JSON.stringify(updatedExtraDataValue);
        const update = await transaction.execute({
            sql: direction === "deduct"
                ? "UPDATE products SET stockQty = ?, extraData = ? WHERE id = ? AND stockQty >= ?"
                : "UPDATE products SET stockQty = ?, extraData = ? WHERE id = ?",
            args: direction === "deduct"
                ? [nextStock, updatedExtraData, productId, quantity]
                : [nextStock, updatedExtraData, productId],
        });
        if (update.rowsAffected !== 1) {
            throw new InventoryError(`تعذر تحديث مخزون المنتج رقم ${productId} بأمان`, 409);
        }

        for (const stockout of stockouts.filter((item) => item.productId === productId)) {
            await transaction.execute({
                sql: "INSERT INTO inventory_notifications (productId, productName, size, color, quantity, createdAt, readAt) VALUES (?, ?, ?, ?, 0, ?, NULL)",
                args: [
                    productId,
                    String(row.name || extraData.name || `المنتج ${productId}`),
                    stockout.size,
                    stockout.color,
                    new Date().toISOString(),
                ],
            });
        }
    }
}

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function initDb() {
    await client.execute(`CREATE TABLE IF NOT EXISTS categories (name TEXT, keyword TEXT, image TEXT, subcategories TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, numericPrice REAL, costPrice REAL, stockQty INTEGER, category TEXT, subcategory TEXT, age TEXT, description TEXT, image TEXT, extraData TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customerName TEXT, phone TEXT, total REAL, status TEXT, cartItems TEXT, date TEXT, wilaya TEXT, deliveryType TEXT, wilayaCode TEXT, communeId INTEGER, commune TEXT, communeNameAscii TEXT, address TEXT, inventoryState TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS inventory_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, productId INTEGER NOT NULL, productName TEXT NOT NULL, size TEXT NOT NULL, color TEXT, quantity INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, readAt TEXT)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_inventory_notifications_unread ON inventory_notifications(readAt, createdAt)`);
    const orderColumns = await client.execute("PRAGMA table_info(orders)");
    const existingOrderColumns = new Set(
        orderColumns.rows.map((column) => String(column.name)),
    );
    const newOrderColumns = [
        ["wilayaCode", "TEXT"],
        ["communeId", "INTEGER"],
        ["commune", "TEXT"],
        ["communeNameAscii", "TEXT"],
        ["address", "TEXT"],
        ["inventoryState", "TEXT"],
    ];
    for (const [column, type] of newOrderColumns) {
        if (!existingOrderColumns.has(column)) {
            await client.execute(`ALTER TABLE orders ADD COLUMN ${column} ${type}`);
        }
    }
    await client.execute(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
    await client.execute(`CREATE TABLE IF NOT EXISTS user_sessions (deviceId TEXT PRIMARY KEY, cartItems TEXT, likedProducts TEXT, abandonedCartCount TEXT, dismissedAbandonedNotifications TEXT)`);
}

process.on('uncaughtException', (err: any) => {
    if (err.code === 'EPIPE' || (err.message && err.message.includes('WebSocket'))) {
        // Suppress
    } else {
        console.error('Uncaught Exception:', err);
    }
});

process.on('unhandledRejection', (reason: any, promise) => {
    if (reason && (reason.code === 'EPIPE' || (reason.message && reason.message.includes('WebSocket')))) {
        // Suppress
    } else {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    }
});

async function startServer() {
  await initDb();
  // Ensure the column exists if it was created before this change
  try {
      await client.execute(`ALTER TABLE products ADD COLUMN subcategory TEXT`);
  } catch(e) {}
  try {
      await client.execute(`ALTER TABLE products ADD COLUMN colors TEXT`);
  } catch(e) {}
  try {
      await client.execute(`ALTER TABLE products ADD COLUMN sizes TEXT`);
  } catch(e) {}
  try {
      await client.execute(`ALTER TABLE products ADD COLUMN imageColor TEXT`);
  } catch (e) {
  }
  
  try {
      await client.execute(`ALTER TABLE products ADD COLUMN extraData TEXT`);
  } catch(e) {}
  
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
    }
    next();
  });
  app.use(express.json({ limit: "10mb" }));
  const requireAdminSession: express.RequestHandler = (req, res, next) => {
    if (!isAdminSessionValid(req)) {
      res.status(401).json({ error: "Admin authentication required" });
      return;
    }
    next();
  };

  // Serve original video frames directly from "صور الفيديو الاول"
  const videoFramesDir = path.join(process.cwd(), "صور الفيديو الاول");
  if (fs.existsSync(videoFramesDir)) {
    app.use("/build-your-look-frames", express.static(videoFramesDir, {
      maxAge: '1d',
      immutable: true
    }));
  }

  // API to dynamically discover frames in chronological / numerical order
  app.get("/api/build-your-look-frames", (req, res) => {
    try {
      if (!fs.existsSync(videoFramesDir)) {
        return res.status(404).json({ error: "Frames folder not found", frames: [] });
      }
      const files = fs.readdirSync(videoFramesDir)
        .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        .map(f => `/build-your-look-frames/${encodeURIComponent(f)}`);
      res.json({ frames: files, total: files.length });
    } catch (err) {
      console.error("Error reading video frames:", err);
      res.status(500).json({ error: "Failed to read frames", frames: [] });
    }
  });

  app.post("/api/upload", requireAdminSession, async (req, res) => {
    try {
        const { image } = req.body;
        if (typeof image !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,/.test(image)) {
            return res.status(400).json({ error: "No image provided" });
        }
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return res.status(503).json({ error: "Image uploads are not configured" });
        }
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "ayakids",
        });
        res.json({ url: uploadResponse.secure_url });
    } catch (e) {
        console.error("Cloudinary upload failed");
        res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // App Settings
  app.get("/api/settings", async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM app_settings");
        const settingsObj: Record<string, any> = {};
        for (const row of rs.rows) {
            try {
                settingsObj[row.key as string] = JSON.parse(row.value as string);
            } catch (e) {
                settingsObj[row.key as string] = row.value;
            }
        }
        res.json(settingsObj);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireAdminSession, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!["settings", "shippingPrices"].includes(key) || value === undefined) {
            return res.status(400).json({ error: "Invalid settings payload" });
        }
        await client.execute({
            sql: "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
            args: [key, JSON.stringify(value)]
        });
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // User Sessions
  app.get("/api/user-session/:deviceId", async (req, res) => {
    try {
        if (!/^[a-z0-9_-]{16,128}$/i.test(req.params.deviceId)) {
            return res.status(400).json({ error: "Invalid session identifier" });
        }
        const rs = await client.execute({
            sql: "SELECT * FROM user_sessions WHERE deviceId = ?",
            args: [req.params.deviceId]
        });
        if (rs.rows.length > 0) {
            const r = rs.rows[0];
            res.json({
                cartItems: r.cartItems ? JSON.parse(r.cartItems as string) : [],
                likedProducts: r.likedProducts ? JSON.parse(r.likedProducts as string) : [],
                abandonedCartCount: r.abandonedCartCount ? JSON.parse(r.abandonedCartCount as string) : {},
                dismissedAbandonedNotifications: r.dismissedAbandonedNotifications ? JSON.parse(r.dismissedAbandonedNotifications as string) : []
            });
        } else {
            res.json({ cartItems: [], likedProducts: [], abandonedCartCount: {}, dismissedAbandonedNotifications: [] });
        }
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch user session" });
    }
  });

  app.post("/api/user-session/:deviceId", async (req, res) => {
    try {
        if (!/^[a-z0-9_-]{16,128}$/i.test(req.params.deviceId)) {
            return res.status(400).json({ error: "Invalid session identifier" });
        }
        const { cartItems, likedProducts, abandonedCartCount, dismissedAbandonedNotifications } = req.body;
        if (JSON.stringify(req.body).length > 500_000) {
            return res.status(413).json({ error: "Session payload is too large" });
        }
        
        const existing = await client.execute({
            sql: "SELECT deviceId FROM user_sessions WHERE deviceId = ?",
            args: [req.params.deviceId]
        });
        
        if (existing.rows.length > 0) {
            // Update
            const updates = [];
            const args = [];
            if (cartItems !== undefined) { updates.push("cartItems = ?"); args.push(JSON.stringify(cartItems)); }
            if (likedProducts !== undefined) { updates.push("likedProducts = ?"); args.push(JSON.stringify(likedProducts)); }
            if (abandonedCartCount !== undefined) { updates.push("abandonedCartCount = ?"); args.push(JSON.stringify(abandonedCartCount)); }
            if (dismissedAbandonedNotifications !== undefined) { updates.push("dismissedAbandonedNotifications = ?"); args.push(JSON.stringify(dismissedAbandonedNotifications)); }
            
            if (updates.length > 0) {
                args.push(req.params.deviceId);
                await client.execute({
                    sql: `UPDATE user_sessions SET ${updates.join(", ")} WHERE deviceId = ?`,
                    args
                });
            }
        } else {
            // Insert
            await client.execute({
                sql: "INSERT INTO user_sessions (deviceId, cartItems, likedProducts, abandonedCartCount, dismissedAbandonedNotifications) VALUES (?, ?, ?, ?, ?)",
                args: [
                    req.params.deviceId, 
                    JSON.stringify(cartItems || []), 
                    JSON.stringify(likedProducts || []), 
                    JSON.stringify(abandonedCartCount || {}), 
                    JSON.stringify(dismissedAbandonedNotifications || [])
                ]
            });
        }
        res.status(200).json({ success: true });
    } catch (e) {
        console.error("Session save failed");
        res.status(500).json({ error: "Failed to save user session" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM products");
        const products = rs.rows.map(row => {
            let extra = {};
            if (row.extraData) {
                try {
                    extra = JSON.parse(row.extraData as string);
                } catch(e) {}
            }
            const { extraData, ...rest } = row as any;
            return {
                ...rest,
                ...extra,
                id: row.id
            };
        });
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAdminSession, async (req, res) => {
    try {
        const p = req.body;
        const { extraData, ...sanitizedP } = p;
        if (sanitizedP.id) {
            await client.execute({
                sql: "UPDATE products SET name = ?, numericPrice = ?, costPrice = ?, stockQty = ?, category = ?, subcategory = ?, age = ?, description = ?, image = ?, extraData = ? WHERE id = ?",
                args: [sanitizedP.name || "", sanitizedP.numericPrice || 0, sanitizedP.costPrice || 0, sanitizedP.stockQty || 0, sanitizedP.category || "", sanitizedP.subcategory || "", sanitizedP.age || "", sanitizedP.description || "", sanitizedP.image || null, JSON.stringify(sanitizedP), sanitizedP.id]
            });
            res.status(200).json({ success: true, id: sanitizedP.id });
        } else {
            const result = await client.execute({
                sql: "INSERT INTO products (name, numericPrice, costPrice, stockQty, category, subcategory, age, description, image, extraData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [sanitizedP.name || "", sanitizedP.numericPrice || 0, sanitizedP.costPrice || 0, sanitizedP.stockQty || 0, sanitizedP.category || "", sanitizedP.subcategory || "", sanitizedP.age || "", sanitizedP.description || "", sanitizedP.image || null, JSON.stringify(sanitizedP)]
            });
            res.status(200).json({ success: true, id: Number(result.lastInsertRowid) });
        }
    } catch (e) {
        console.error("Product save failed");
        res.status(500).json({ error: "Failed to save product" });
    }
  });

  app.delete("/api/products/:id", requireAdminSession, async (req, res) => {
    try {
        await client.execute({ sql: "DELETE FROM products WHERE id = ?", args: [req.params.id || ""] });
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Orders
  app.get("/api/orders", requireAdminSession, async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM orders");
        const orders = rs.rows.map(o => ({
            ...o,
            cartItems: typeof o.cartItems === 'string' ? JSON.parse(o.cartItems as string) : (o.cartItems || [])
        }));
        res.json(orders);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.delete("/api/orders/:id", requireAdminSession, async (req, res) => {
    try {
        const result = await client.execute({
            sql: "DELETE FROM orders WHERE id = ?",
            args: [req.params.id]
        });
        if (result.rowsAffected === 0) {
            res.status(404).json({ error: "Order not found" });
            return;
        }
        res.status(200).json({ success: true });
    } catch (e) {
        console.error("Failed to permanently delete order");
        res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    let transaction: Awaited<ReturnType<typeof client.transaction>> | undefined;
    try {
        const o = req.body;
        if (typeof o?.id !== "string" || !o.id.trim()) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }

        transaction = await client.transaction("write");
        const existing = await transaction.execute({
            sql: "SELECT * FROM orders WHERE id = ?",
            args: [o.id],
        });
        const oldOrder = existing.rows[0];
        let inventoryState: string;
        let changedProductIds: number[] = [];

        if (!oldOrder) {
            if (o.id.length > 100 || !/^[a-z0-9_-]+$/i.test(o.id)) {
                throw new InventoryError("معرّف الطلب غير صالح", 400);
            }
            const customerName = typeof o.customerName === "string" ? o.customerName.trim() : "";
            const phone = typeof o.phone === "string" ? o.phone.trim() : "";
            const wilaya = typeof o.wilaya === "string" ? o.wilaya.trim() : "";
            const deliveryType = o.deliveryType === "desk" ? "desk" : o.deliveryType === "home" ? "home" : "";
            const wilayaCode = Number(o.wilayaCode);
            const communeId = Number(o.communeId);
            if (
                customerName.length < 2 || customerName.length > 120 ||
                !/^[+\d\s()-]{7,24}$/.test(phone) ||
                wilaya.length < 2 || wilaya.length > 100 ||
                !Number.isSafeInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 69 ||
                !Number.isSafeInteger(communeId) || communeId < 1 ||
                !deliveryType ||
                typeof o.commune !== "string" || o.commune.trim().length < 1 || o.commune.length > 150 ||
                (o.communeNameAscii !== undefined && (typeof o.communeNameAscii !== "string" || o.communeNameAscii.length > 150)) ||
                typeof o.address !== "string" || o.address.length > 500 ||
                (deliveryType === "home" && o.address.trim().length < 1)
            ) {
                throw new InventoryError("بيانات الطلب غير مكتملة أو غير صالحة", 400);
            }
            const cartItems = parseOrderCartItems(o.cartItems);
            if (cartItems.length > 50) {
                throw new InventoryError("يحتوي الطلب على عدد كبير جدًا من المنتجات", 400);
            }
            await validateOrderInventory(transaction, cartItems);
            let subtotal = 0;
            const trustedCartItems = [];
            for (const item of cartItems) {
                const productResult = await transaction.execute({
                    sql: "SELECT name, numericPrice, costPrice, image, extraData FROM products WHERE id = ?",
                    args: [item.id],
                });
                const product = productResult.rows[0];
                if (!product) throw new InventoryError(`المنتج رقم ${item.id} غير موجود`, 409);
                const price = Number(product.numericPrice);
                if (!Number.isFinite(price) || price < 0) {
                    throw new InventoryError(`سعر المنتج رقم ${item.id} غير صالح`, 409);
                }
                const extra = parseProductExtraData(product.extraData, item.id);
                const variants = Array.isArray(extra.colorVariants) ? extra.colorVariants : [];
                const matchedVariant = item.selectedColor
                    ? variants.find((variant: any) => {
                        const selectedCode = item.selectedColor?.match(/#[0-9a-f]{3,8}/i)?.[0];
                        return selectedCode
                            ? String(variant.colorCode || "").toLowerCase() === selectedCode.toLowerCase()
                            : String(variant.colorName || "") === item.selectedColor;
                    })
                    : undefined;
                subtotal += price * item.quantity;
                trustedCartItems.push({
                    id: item.id,
                    quantity: item.quantity,
                    ...(item.selectedColor ? { selectedColor: item.selectedColor } : {}),
                    ...(item.selectedSize ? { selectedSize: item.selectedSize } : {}),
                    productName: product.name,
                    productImage: matchedVariant?.image || product.image,
                    numericPrice: price,
                    costPrice: Number(product.costPrice) || 0,
                    category: extra.category || "",
                });
            }
            if (!Number.isSafeInteger(Math.round(subtotal)) || subtotal < 0) {
                throw new InventoryError("إجمالي الطلب غير صالح", 400);
            }
            const savedSettings = await transaction.execute({
                sql: "SELECT key, value FROM app_settings WHERE key IN ('settings', 'shippingPrices')",
                args: [],
            });
            const storedValues = new Map(savedSettings.rows.map((row) => {
                try {
                    return [String(row.key), JSON.parse(String(row.value))] as const;
                } catch {
                    return [String(row.key), null] as const;
                }
            }));
            const configuredRates = storedValues.get("shippingPrices");
            const rates = Array.isArray(configuredRates) ? configuredRates : shippingRates;
            const requestedWilayaCode = String(o.wilayaCode || "").trim();
            const rate = rates.find((candidate: any) =>
                typeof candidate.wilaya === "string" &&
                candidate.wilaya.trim().normalize("NFC") === wilaya.normalize("NFC"),
            ) || rates.find((candidate: any) =>
                typeof candidate.wilaya === "string" &&
                candidate.wilaya.match(/^\s*(\d+)/)?.[1] === requestedWilayaCode,
            );
            if (!rate) throw new InventoryError("تعذر التحقق من تكلفة التوصيل للولاية المحددة", 400);
            let shippingTotal = Number(deliveryType === "desk" ? rate.priceDesk : rate.price);
            if (!Number.isFinite(shippingTotal) || shippingTotal < 0) {
                throw new InventoryError("تكلفة التوصيل غير صالحة", 409);
            }
            const savedSettingsValue = storedValues.get("settings");
            const shippingRules = savedSettingsValue?.shippingRules;
            for (const item of trustedCartItems) {
                const product = await transaction.execute({
                    sql: "SELECT extraData FROM products WHERE id = ?",
                    args: [item.id],
                });
                const extra = parseProductExtraData(product.rows[0]?.extraData, item.id);
                if (extra.applyWeightRule && shippingRules?.weight?.enabled) {
                    const weight = Number(extra.weight || 0);
                    const maxWeight = Number(shippingRules.weight.maxWeight);
                    const extraPerKg = Number(shippingRules.weight.extraPerKg);
                    if (![weight, maxWeight, extraPerKg].every(Number.isFinite) || maxWeight < 0 || extraPerKg < 0) {
                        throw new InventoryError("إعدادات الشحن حسب الوزن غير صالحة", 409);
                    }
                    if (weight > maxWeight) {
                        shippingTotal += Math.ceil(weight - maxWeight) * extraPerKg * item.quantity;
                    }
                }
                if (extra.applyDimensionsRule && shippingRules?.dimensions?.enabled) {
                    const dimensions = [extra.length || 0, extra.width || 0, extra.height || 0].map(Number);
                    const limits = [
                        shippingRules.dimensions.maxLength,
                        shippingRules.dimensions.maxWidth,
                        shippingRules.dimensions.maxHeight,
                    ].map(Number);
                    const extraFee = Number(shippingRules.dimensions.extraFee);
                    if (
                        ![...dimensions, ...limits, extraFee].every(Number.isFinite) ||
                        limits.some((limit) => limit < 0) ||
                        extraFee < 0
                    ) {
                        throw new InventoryError("إعدادات الشحن حسب الأبعاد غير صالحة", 409);
                    }
                    if (dimensions.some((dimension, index) => dimension > limits[index])) {
                        shippingTotal += extraFee * item.quantity;
                    }
                }
            }
            if (!Number.isSafeInteger(Math.round(subtotal + shippingTotal))) {
                throw new InventoryError("إجمالي الطلب يتجاوز النطاق المسموح", 400);
            }
            const total = Math.round(subtotal + shippingTotal);
            if (!Number.isFinite(Number(o.total)) || Math.round(Number(o.total)) !== total) {
                throw new InventoryError(
                    "تغيرت الأسعار أو تكلفة التوصيل منذ فتح السلة؛ راجع الإجمالي ثم أعد إرسال الطلب",
                    422,
                );
            }
            await transaction.execute({
                sql: "INSERT INTO orders (id, customerName, phone, total, status, cartItems, date, wilaya, deliveryType, wilayaCode, communeId, commune, communeNameAscii, address, inventoryState) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                args: [
                    o.id,
                    customerName,
                    phone,
                    total,
                    "pending",
                    JSON.stringify(trustedCartItems),
                    new Date().toISOString().slice(0, 10),
                    wilaya,
                    deliveryType,
                    wilayaCode,
                    communeId,
                    o.commune.trim(),
                    typeof o.communeNameAscii === "string" ? o.communeNameAscii : null,
                    o.address.trim(),
                    "not_deducted",
                ],
            });
            inventoryState = "not_deducted";
        } else {
            if (!isAdminSessionValid(req)) {
                await transaction.rollback();
                res.status(401).json({ error: "Admin authentication required" });
                return;
            }
            const oldStatus = String(oldOrder.status || "");
            const savedInventoryState = String(oldOrder.inventoryState || "");
            inventoryState = ["not_deducted", "deducted", "shipped", "restocked"].includes(savedInventoryState)
                ? savedInventoryState
                : "unknown";
            const nextStatus = String(o.status || oldStatus);

            if (inventoryState === "not_deducted" && nextStatus === "confirmed") {
                const cartItems = parseOrderCartItems(oldOrder.cartItems);
                await adjustOrderInventory(transaction, cartItems, "deduct");
                inventoryState = "deducted";
                changedProductIds = [...new Set(cartItems.map((item) => item.id))];
            } else if (inventoryState === "deducted" && nextStatus === "shipped") {
                inventoryState = "shipped";
            } else if (
                inventoryState === "deducted" &&
                nextStatus === "cancelled" &&
                oldStatus !== "shipped"
            ) {
                const cartItems = parseOrderCartItems(oldOrder.cartItems);
                await adjustOrderInventory(transaction, cartItems, "restore");
                inventoryState = "restocked";
                changedProductIds = [...new Set(cartItems.map((item) => item.id))];
            } else if (inventoryState === "deducted" && oldStatus === "shipped") {
                inventoryState = "shipped";
            }

            await transaction.execute({
                sql: "UPDATE orders SET status = ?, total = ?, customerName = ?, phone = ?, wilaya = ?, deliveryType = ?, wilayaCode = COALESCE(?, wilayaCode), communeId = COALESCE(?, communeId), commune = COALESCE(?, commune), communeNameAscii = COALESCE(?, communeNameAscii), address = COALESCE(?, address), inventoryState = ? WHERE id = ?",
                args: [
                    nextStatus,
                    o.total ?? oldOrder.total ?? 0,
                    o.customerName ?? oldOrder.customerName ?? "",
                    o.phone ?? oldOrder.phone ?? "",
                    o.wilaya ?? oldOrder.wilaya ?? "",
                    o.deliveryType ?? oldOrder.deliveryType ?? "",
                    o.wilayaCode || null,
                    o.communeId || null,
                    o.commune || null,
                    o.communeNameAscii || null,
                    o.address || null,
                    inventoryState,
                    o.id,
                ],
            });
        }

        const updatedProducts = [];
        for (const productId of changedProductIds) {
            const result = await transaction.execute({
                sql: "SELECT * FROM products WHERE id = ?",
                args: [productId],
            });
            const row = result.rows[0];
            if (!row) continue;
            const extra = parseProductExtraData(row.extraData, productId);
            const { extraData, ...rest } = row as any;
            updatedProducts.push({ ...rest, ...extra, id: row.id });
        }
        await transaction.commit();
        res.status(200).json({
            success: true,
            inventoryState,
            inventoryWarning: inventoryState === "unknown"
                ? "هذا طلب قديم ولا توجد بيانات موثوقة عن خصم مخزونه؛ لم يتم تعديل المخزون تلقائيًا."
                : undefined,
            products: updatedProducts,
        });
    } catch (e) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("Failed to roll back order inventory transaction");
            }
        }
        if (e instanceof InventoryError) {
            res.status(e.status).json({ error: e.message });
            return;
        }
        console.error("Failed to save order and update inventory");
        res.status(500).json({ error: "Failed to save order" });
    } finally {
        transaction?.close();
    }
  });

  app.get("/api/admin/inventory-notifications", requireAdminSession, async (_req, res) => {
    try {
        const result = await client.execute(
            "SELECT * FROM inventory_notifications ORDER BY createdAt DESC, id DESC",
        );
        const unread = await client.execute(
            "SELECT COUNT(*) AS count FROM inventory_notifications WHERE readAt IS NULL",
        );
        res.json({
            notifications: result.rows,
            unreadCount: Number(unread.rows[0]?.count || 0),
        });
    } catch (error) {
        console.error("Failed to load inventory notifications", error);
        res.status(500).json({ error: "Failed to load inventory notifications" });
    }
  });

  app.post("/api/admin/inventory-notifications/:id/read", requireAdminSession, async (req, res) => {
    try {
        const result = await client.execute({
            sql: "UPDATE inventory_notifications SET readAt = COALESCE(readAt, ?) WHERE id = ?",
            args: [new Date().toISOString(), Number(req.params.id)],
        });
        if (result.rowsAffected === 0) {
            res.status(404).json({ error: "Inventory notification not found" });
            return;
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Failed to mark inventory notification as read", error);
        res.status(500).json({ error: "Failed to update inventory notification" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
        const rs = await client.execute("SELECT * FROM categories");
        const categories = rs.rows.map(cat => {
            let subcategories = [];
            if (typeof cat.subcategories === 'string') {
                try {
                    subcategories = JSON.parse(cat.subcategories);
                } catch (e) {
                    console.error("Failed to parse category subcategories");
                }
            } else if (Array.isArray(cat.subcategories)) {
                subcategories = cat.subcategories;
            }
            return {
                ...cat,
                subcategories
            };
        });
        res.json(categories);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdminSession, async (req, res) => {
    try {
        const categories = req.body;
        if (!Array.isArray(categories)) {
            throw new Error("Categories must be an array");
        }
        
        await client.batch([
            { sql: "DELETE FROM categories", args: [] },
            ...categories.map((cat: any) => ({
                sql: "INSERT INTO categories (name, keyword, image, subcategories) VALUES (?, ?, ?, ?)",
                args: [cat.name || "", cat.keyword || "", cat.image || "", typeof cat.subcategories === 'string' ? cat.subcategories : JSON.stringify(cat.subcategories || [])]
            }))
        ], "write");
        res.status(200).json({ success: true });
    } catch (e) {
        console.error("Category save failed");
        res.status(500).json({ error: "Failed to save categories" });
    }
  });

  // Admin Login Verification
  app.post("/api/admin/login", (req, res) => {
    try {
        const { username, password } = req.body;
        const ip = req.ip || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        const attempts = failedLoginAttempts.get(ip);
        if (attempts && attempts.resetAt > now && attempts.count >= 5) {
            res.status(429).json({ error: "محاولات تسجيل الدخول كثيرة؛ حاول مرة أخرى لاحقًا" });
            return;
        }
        if (attempts && attempts.resetAt <= now) failedLoginAttempts.delete(ip);
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;
        const safeEqual = (provided: unknown, expected: string | undefined) => {
            if (typeof provided !== "string" || !expected) return false;
            const providedBuffer = Buffer.from(provided);
            const expectedBuffer = Buffer.from(expected);
            return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
        };
        if (safeEqual(username, adminUser) && safeEqual(password, adminPass)) {
            failedLoginAttempts.delete(ip);
            const token = randomUUID();
            adminSessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
            res.json({ success: true, token });
        } else {
            const current = failedLoginAttempts.get(ip);
            failedLoginAttempts.set(ip, {
                count: (current?.count || 0) + 1,
                resetAt: current?.resetAt && current.resetAt > now ? current.resetAt : now + 15 * 60 * 1000,
            });
            res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/logout", requireAdminSession, (req, res) => {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (token) adminSessions.delete(token);
    res.status(204).end();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
