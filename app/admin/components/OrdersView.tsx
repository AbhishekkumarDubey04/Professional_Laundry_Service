// app/admin/components/OrdersView.tsx
"use client";

import { useState, type ChangeEvent } from "react";
import type { Order, OrderStatus } from "../types";
import { DISCOUNT_OPTIONS, ITEM_PRICES } from "../constants";
// (removed) table styles no longer needed


type ItemPriceDef = { label: string; price: number };

// Helper map so TS is happy when we index by string keys
const ITEM_PRICES_MAP: Record<string, ItemPriceDef> =
  ITEM_PRICES as unknown as Record<string, ItemPriceDef>;

// --- Single source of truth for item labels/prices across desktop + mobile ---
const ITEM_OVERRIDES: Record<string, Partial<ItemPriceDef>> = {
  // change Kurti / Top / Dupatta — ₹10 to Blouse / Top / Dupatta — ₹10
  women_kurti_top: { label: "Blouse / Top / Dupatta", price: 10 },

  // change Long Kurti / Frock — ₹16 to Kurti / Frock — ₹15
  long_kurti_frock: { label: "Kurti / Frock", price: 15 },
};

function getItemDef(key: string): ItemPriceDef | null {
  const base = ITEM_PRICES_MAP[key];
  if (!base) return null;
  const ov = ITEM_OVERRIDES[key];
  return {
    label: ov?.label ?? base.label,
    price: ov?.price ?? base.price,
  };
}

// Grouping + ordering of items for the UI
const ITEM_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Men clothing",
    keys: [
      "men_shirt_kurta_tshirt",
      "men_trouser_jeans_shorts_pyjama",
      "men_coat_blazer_jacket",
      "men_dhoti_lungi",
    ],
  },
  {
    title: "Women Clothing",
    keys: [
      "women_kurti_top",
      "long_kurti_frock",
      "women_leggings_pant_salwar_shorts",
      "women_dress",
      "women_simple_saree",
      "women_heavy_silk_saree",
      "women_lehenga",
    ],
  },
  {
    title: "Kids wear (below 5 years)",
    keys: ["kids_below5"],
  },
  {
    title: "Home items",
    keys: [
      "home_pillow_small_towel",
      "home_curtain_bedsheet_single",
      "home_curtain_bedsheet_double",
    ],
  },
];

type BillingState = Record<string, { base: string; discount: number }>;
type ItemState = Record<string, Record<string, string>>;

interface Props {
  loading: boolean;
  sortedOrders: Order[];
  savingMap: Record<string, boolean>;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onTotalUpdate: (
    id: string,
    total: number | null,
    baseAmount: number | null,
    itemsCounts: Record<string, number> | null
  ) => void;
}

export default function OrdersView({
  loading,
  sortedOrders,
  savingMap,
  onStatusChange,
  onTotalUpdate,
}: Props) {
  // Local overrides for base amount & discount
  const [billingState, setBillingState] = useState<BillingState>({});
  // Local overrides for items quantities (string for easy input)
  const [itemState, setItemState] = useState<ItemState>({});

  // Modal state for mobile/tablet
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [modalItems, setModalItems] = useState<Record<string, string>>({});

  // --- Helpers to combine DB + local state ---

  const getUiBilling = (order: Order): { base: string; discount: number } => {
  const local = billingState[order.id];

  const baseFromDb =
    typeof order.base_amount === "number" && order.base_amount > 0
      ? String(order.base_amount)
      : "";

  // IMPORTANT: don't let empty-string local base override DB base
  const localBase =
    typeof local?.base === "string" ? local.base.trim() : "";

  return {
    base: localBase !== "" ? localBase : baseFromDb,
    discount: typeof local?.discount === "number" ? local.discount : 0,
  };
};


  const getItemsForUi = (order: Order): Record<string, string> => {
    const local = itemState[order.id];
    if (local) return local;

    const fromDb: Record<string, string> = {};
    if (order.items_json) {
      for (const [key, val] of Object.entries(order.items_json)) {
        if (typeof val === "number" && val > 0) {
          fromDb[key] = String(val);
        }
      }
    }
    return fromDb;
  };

  const getMergedItems = (
    order: Order,
    state: ItemState
  ): Record<string, number> => {
    const merged: Record<string, number> = {};

    // Start with DB items
    if (order.items_json) {
      for (const [key, val] of Object.entries(order.items_json)) {
        if (typeof val === "number" && val > 0) {
          merged[key] = val;
        }
      }
    }

    // Overlay local edits
    const local = state[order.id];
    if (local) {
      for (const [key, str] of Object.entries(local)) {
        if (!str) {
          delete merged[key];
          continue;
        }
        const qty = parseInt(str, 10);
        if (!qty || qty <= 0) {
          delete merged[key];
          continue;
        }
        merged[key] = qty;
      }
    }

    return merged;
  };

  const getItemTotal = (order: Order, state: ItemState): number => {
    const merged = getMergedItems(order, state);
    let sum = 0;
    for (const [key, qty] of Object.entries(merged)) {
      const def = getItemDef(key);
      if (!def) continue;
      sum += qty * def.price;
    }
    return sum;
  };

  const buildItemsCounts = (
    order: Order,
    state: ItemState
  ): Record<string, number> | null => {
    const merged = getMergedItems(order, state);
    return Object.keys(merged).length ? merged : null;
  };

  const computeTotals = (
    order: Order,
    overrideBase?: string,
    overrideDiscount?: number,
    overrideItemsState?: ItemState,
    ignoreExistingBase = false
  ): {
    baseAmount: number | null;
    finalTotal: number | null;
    itemsCounts: Record<string, number> | null;
  } => {
    const uiBilling = getUiBilling(order);
    const baseStr = overrideBase !== undefined ? overrideBase : uiBilling.base;
    const discountPercent =
      overrideDiscount !== undefined ? overrideDiscount : uiBilling.discount;

    const itemsStateToUse = overrideItemsState ?? itemState;
    const itemTotal = getItemTotal(order, itemsStateToUse);
    const itemsCounts = buildItemsCounts(order, itemsStateToUse);

    let baseAmount = 0;

    // 1) If we have items, always use them as base
    if (itemTotal > 0) {
      baseAmount = itemTotal;
    } else if (!ignoreExistingBase) {
      // 2) Only fall back to base input / DB base
      //    when we are NOT in an "items changed" calculation.
      if (baseStr) {
        const parsed = parseInt(baseStr, 10);
        if (parsed > 0) baseAmount = parsed;
      } else if (
        typeof order.base_amount === "number" &&
        order.base_amount > 0
      ) {
        baseAmount = order.base_amount;
      }
    }

    if (!baseAmount || baseAmount <= 0) {
      return { baseAmount: null, finalTotal: null, itemsCounts };
    }

    let total = baseAmount;
    if (discountPercent && discountPercent > 0) {
      const discounted = baseAmount - (baseAmount * discountPercent) / 100;
      total = Math.round(discounted);
    }

    return { baseAmount, finalTotal: total, itemsCounts };
  };

  // --- Handlers ---

  const handleBaseChange = (id: string, value: string) => {
    setBillingState((prev) => ({
      ...prev,
      [id]: {
        base: value,
        discount: prev[id]?.discount ?? 0,
      },
    }));
  };

  const handleDiscountChange = (order: Order, discount: number) => {
    setBillingState((prev) => ({
      ...prev,
      [order.id]: {
        base: prev[order.id]?.base ?? getUiBilling(order).base,
        discount,
      },
    }));

    const { baseAmount, finalTotal, itemsCounts } = computeTotals(
      order,
      undefined,
      discount
    );
    void onTotalUpdate(order.id, finalTotal, baseAmount, itemsCounts);
  };

  const handleBaseBlur = (order: Order) => {
    const { baseAmount, finalTotal, itemsCounts } = computeTotals(order);
    void onTotalUpdate(order.id, finalTotal, baseAmount, itemsCounts);
  };

  // (removed) handleItemQtyChange was only used by the old desktop/table UI


  const handlePrintTickets = (order: Order) => {
    const merged = getMergedItems(order, itemState);
    let totalClothes = 0;
    const itemsList: string[] = [];
    
    for (const [key, qty] of Object.entries(merged)) {
      const def = getItemDef(key);
      if (def && qty > 0) {
        totalClothes += qty;
        for (let i = 0; i < qty; i++) {
          itemsList.push(def.label);
        }
      }
    }
    
    if (totalClothes === 0) {
      alert("No clothes added to this order to print tickets for.");
      return;
    }
    
    let ticketsText = `Generating ${totalClothes} tickets for Order #${order.id}:\n\n`;
    itemsList.forEach((label, index) => {
      const ticketIndex = index + 1;
      ticketsText += `Ticket ${ticketIndex}/${totalClothes} | Item: ${label} | ID: ${order.id}-TKT-${ticketIndex}\n`;
    });
    
    alert(ticketsText);
  };

  const handlePrintTags = (order: Order) => {
    const merged = getMergedItems(order, itemState);
    let totalClothes = 0;
    const itemsList: string[] = [];
    
    for (const [key, qty] of Object.entries(merged)) {
      const def = getItemDef(key);
      if (def && qty > 0) {
        totalClothes += qty;
        for (let i = 0; i < qty; i++) {
          itemsList.push(def.label);
        }
      }
    }
    
    if (totalClothes === 0) {
      alert("No clothes added to this order to print tags for.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print tags.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Print Tags - Order #${order.id}</title>
          <style>
            @page {
              size: 30mm 50mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .tag {
              width: 30mm;
              height: 50mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              page-break-after: always;
              font-size: 11px;
              line-height: 1.4;
              box-sizing: border-box;
              padding: 2mm;
              overflow: hidden;
            }
            .tag:last-child {
              page-break-after: auto;
            }
            .bold {
              font-weight: bold;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          ${itemsList.map((itemName, index) => `
            <div class="tag">
              <div class="bold">Order #${order.id}</div>
              <div>${order.customer_name || "Walk-in"}</div>
              <div class="bold">${index + 1} / ${totalClothes}</div>
              <div style="font-size: 10px;">${itemName}</div>
              <div>Wash &amp; Iron</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const handlePrintAllTags = () => {
    let htmlContent = `
      <html>
        <head>
          <title>Print All Tags</title>
          <style>
            @page {
              size: 30mm 50mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .tag {
              width: 30mm;
              height: 50mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              page-break-after: always;
              font-size: 11px;
              line-height: 1.4;
              box-sizing: border-box;
              padding: 2mm;
              overflow: hidden;
            }
            .tag:last-child {
              page-break-after: auto;
            }
            .bold {
              font-weight: bold;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
    `;

    let totalTags = 0;

    sortedOrders.forEach((order) => {
      const merged = getMergedItems(order, itemState);
      let totalClothes = 0;
      const itemsList: string[] = [];
      
      for (const [key, qty] of Object.entries(merged)) {
        const def = getItemDef(key);
        if (def && qty > 0) {
          totalClothes += qty;
          for (let i = 0; i < qty; i++) {
            itemsList.push(def.label);
          }
        }
      }
      
      if (totalClothes > 0) {
        totalTags += totalClothes;
        htmlContent += itemsList.map((itemName, index) => `
          <div class="tag">
            <div class="bold">Order #${order.id}</div>
            <div>${order.customer_name || "Walk-in"}</div>
            <div class="bold">${index + 1} / ${totalClothes}</div>
            <div style="font-size: 10px;">${itemName}</div>
            <div>Wash &amp; Iron</div>
          </div>
        `).join('');
      }
    });

    htmlContent += `
        </body>
      </html>
    `;

    if (totalTags === 0) {
      alert("No clothes added to any orders on this page.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print tags.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  // Modal open/close for mobile
  const openItemsModal = (order: Order) => {
    const current = getItemsForUi(order);
    setModalOrderId(order.id);
    setModalItems(current);
  };

  const closeItemsModal = () => {
    setModalOrderId(null);
    setModalItems({});
  };

  const handleModalChange = (key: string, value: string) => {
    setModalItems((prev) => ({ ...prev, [key]: value }));
  };

  const handleModalSave = (order: Order) => {
    const nextState: ItemState = {
      ...itemState,
      [order.id]: { ...modalItems },
    };

    // Update local UI state
    setItemState(nextState);

    // Recompute totals and inform parent
    const { baseAmount, finalTotal, itemsCounts } = computeTotals(
      order,
      undefined,
      undefined,
      nextState,
      true // ignoreExistingBase when items change via modal
    );

    void onTotalUpdate(order.id, finalTotal, baseAmount, itemsCounts);

    closeItemsModal();
  };

  // --- UI ---

  if (loading) {
    return (
      <div style={{ fontSize: 13, }}>
        Loading picked orders…
      </div>
    );
  }

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        fontSize: 12,
        alignItems: "center",
      }}
    >
      <div style={{ fontWeight: 600 }}>Picked orders (ready to iron)</div>
      <div style={{ fontSize: 11, }}>
        Mark as <strong>READY</strong> once ironing is done.
      </div>
    </div>
  );

  // Mobile / tablet cards + full-screen items modal
  const modalOrder = modalOrderId
    ? sortedOrders.find((o) => o.id === modalOrderId) || null
    : null;

  return (
    <>
      <div style={{ display: "grid", gap: 8 }}>
        {header}
        {sortedOrders.length === 0 && (
          <div style={{ fontSize: 13, padding: "12px 0", color: "#8E94A3" }}>
            No picked orders right now.
          </div>
        )}
        {sortedOrders.map((order) => {
          const billing = getUiBilling(order);
          const itemTotal = getItemTotal(order, itemState);
          const { finalTotal } = computeTotals(order);
          const effectiveTotal = finalTotal ?? order.total_price ?? null;
          const saving = savingMap[order.id] ?? false;

          return (
            <OrderCard
              key={order.id}
              order={order}
              billing={billing}
              itemTotal={itemTotal}
              effectiveTotal={effectiveTotal}
              saving={saving}
              onBaseChange={(val) => handleBaseChange(order.id, val)}
              onBaseBlur={() => handleBaseBlur(order)}
              onDiscountChange={(val) => handleDiscountChange(order, val)}
              onOpenItems={() => openItemsModal(order)}
              onReady={() => onStatusChange(order.id, "READY")}
              onPrintTickets={() => handlePrintTickets(order)}
              onPrintTags={() => handlePrintTags(order)}
            />
          );
        })}
        
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={handlePrintAllTags}
            disabled={sortedOrders.length === 0}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: sortedOrders.length === 0 ? "not-allowed" : "pointer",
              background: sortedOrders.length === 0 
                ? "linear-gradient(to right, #4b5563, #374151)"
                : "linear-gradient(to right, #f97316, #ea580c)",
              color: sortedOrders.length === 0 ? "#9ca3af" : "#fff",
              boxShadow: sortedOrders.length === 0
                ? "none"
                : "0 4px 14px rgba(249, 115, 22, 0.4)",
            }}
          >
            Print All Tags
          </button>
        </div>
      </div>

      {modalOrder && (
        <ItemsModal
          order={modalOrder}
          items={modalItems}
          onChange={handleModalChange}
          onClose={closeItemsModal}
          onSave={() => handleModalSave(modalOrder)}
        />
      )}
    </>
  );
}

function OrderCard(props: {
  order: Order;
  billing: { base: string; discount: number };
  itemTotal: number;
  effectiveTotal: number | null;
  saving: boolean;
  onBaseChange: (value: string) => void;
  onBaseBlur: () => void;
  onDiscountChange: (value: number) => void;
  onOpenItems: () => void;
  onReady: () => void;
  onPrintTickets: () => void;
  onPrintTags: () => void;
}) {
  const {
    order,
    billing,
    itemTotal,
    effectiveTotal,
    saving,
    onBaseChange,
    onBaseBlur,
    onDiscountChange,
    onOpenItems,
    onReady,
    onPrintTickets,
    onPrintTags,
  } = props;

  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #E5E7EB", // light border
        padding: 12,
        background: "#ffffff", // solid white
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)", // subtle shadow
        fontSize: 12,
        color: "#111827", // dark text for readability
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {order.society_name}
          </div>
          <div style={{ fontSize: 11, }}>
            {`Flat: ${order.flat_number}${
              order.block ? `, ${order.block} Block` : ""
            }`}
          </div>
          <div style={{ fontSize: 11, }}>
            {order.self_drop ? "Self drop" : `Pickup: ${order.pickup_slot}`}
            {order.express_delivery && (
              <span style={{ color: "#f97316", marginLeft: 4 }}>• Express</span>
            )}
          </div>
          {order.notes && (
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                
              }}
            >
              Notes: {order.notes}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#060606",
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid #000000",
            alignSelf: "flex-start",
          }}
        >
          PICKED
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 8,
          fontSize: 11,
          marginBottom: 8,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 10,
              
              marginBottom: 2,
            }}
          >
            Base amount (before discount)
          </label>
          <input
            type="number"
            value={billing.base}
            onChange={(e) => onBaseChange(e.target.value)}
            onBlur={onBaseBlur}
            placeholder="₹0"
            style={{
              width: "100%",
              borderRadius: 999,
              border: "1px solid #D1D5DB",
              background: "#F9FAFB",
              color: "#111827",
              padding: "4px 8px",
              fontSize: 11,
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 10,
              
              marginBottom: 2,
            }}
          >
            Discount %
          </label>
          <select
            value={billing.discount}
            onChange={(e) => onDiscountChange(Number(e.target.value))}
            style={{
              width: "100%",
              borderRadius: 999,
              border: "1px solid #D1D5DB",
              background: "#F9FAFB",
              color: "#111827",
              padding: "4px 8px",
              fontSize: 11,
            }}
          >
            {DISCOUNT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom row: Add/Edit items (left) + Final total + READY (right) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              
              marginBottom: 2,
            }}
          >
            Items total: <span style={{ fontWeight: 600 }}>₹{itemTotal}</span>
          </div>
          <button
            type="button"
            onClick={onOpenItems}
            style={{
              borderRadius: 999,
              border: "1px solid #D1D5DB",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 500,
              background: "#F3F4F6",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            Add / Edit items
          </button>
        </div>

        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                
                marginBottom: 2,
              }}
            >
              Final total
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {effectiveTotal === null ? "—" : `₹${effectiveTotal}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              disabled={saving}
              onClick={onPrintTags}
              style={{
                borderRadius: 999,
                border: "1px solid #374151",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                
                
                opacity: saving ? 0.6 : 1,
              }}
            >
              Print Tags
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onPrintTickets}
              style={{
                borderRadius: 999,
                border: "1px solid #374151",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                
                
                opacity: saving ? 0.6 : 1,
              }}
            >
              Print Tickets
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onReady}
              style={{
                borderRadius: 999,
                border: "none",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                background:
                  "linear-gradient(to right, #3b82f6, #2563eb, #1d4ed8)",
                color: "#eff6ff",
                opacity: saving ? 0.6 : 1,
              }}
            >
              Mark READY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemsModal(props: {
  order: Order;
  items: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { order, items, onChange, onClose, onSave } = props;

  const handleTypedChange =
    (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v === "") {
        onChange(key, "");
        return;
      }
      // allow only digits
      const cleaned = v.replace(/[^0-9]/g, "");
      onChange(key, cleaned);
    };

  const getValuePair = (key: string) => {
    const raw = items[key] ?? "";
    const num =
      raw === "" ? 0 : Number.isNaN(parseInt(raw, 10)) ? 0 : parseInt(raw, 10);
    return { raw, num };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "94%",
          maxWidth: 520,
          maxHeight: "90vh",
          borderRadius: 16,
          border: "1px solid #000000",
          backgroundColor: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          flexDirection: "column",
          padding: 12,
          boxShadow: "0 20px 45px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Edit items</div>
            <div style={{ fontSize: 12, }}>
              {`${order.society_name} • Flat ${order.flat_number}${
                order.block ? `, ${order.block} Block` : ""
              }`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: "1px solid #374151",
              padding: "4px 10px",
              fontSize: 12,
              
              
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {/* Items list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 6,
            borderRadius: 10,
            border: "1px solid #111827",
            
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10,
              fontSize: 13, // bigger text
            }}
          >
            {ITEM_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  
                }}
              >
                {/* group header */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 6,
                    
                    borderBottom: "1px solid #1f2937",
                    paddingBottom: 4,
                  }}
                >
                  {group.title}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 8,
                  }}
                >
                  {group.keys.map((key) => {
                    const def = getItemDef(key);
                    if (!def) return null;

                    const { raw, num } = getValuePair(key);

                    const decrement = () => {
                      const next = Math.max(0, num - 1);
                      onChange(key, next === 0 ? "" : String(next));
                    };

                    const increment = () => {
                      const next = num + 1;
                      onChange(key, String(next));
                    };

                    const label = def.label;

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>
                          {label}
                          <span style={{ }}>
                            {" "}
                            — ₹{def.price}
                          </span>
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={decrement}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: "1px solid #374151",
                              
                              
                              fontSize: 16,
                              lineHeight: 1,
                              cursor: "pointer",
                            }}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={raw}
                            onChange={handleTypedChange(key)}
                            inputMode="numeric"
                            style={{
                              width: 54,
                              borderRadius: 999,
                              border: "1px solid #374151",
                              
                              
                              padding: "4px 6px",
                              fontSize: 13,
                              textAlign: "center",
                            }}
                          />
                          <button
                            type="button"
                            onClick={increment}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: "1px solid #374151",
                              
                              
                              fontSize: 16,
                              lineHeight: 1,
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: "1px solid #374151",
              padding: "6px 12px",
              fontSize: 12,
              
              
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              background: "linear-gradient(to right, #4ade80, #22c55e)",
              color: "#022c22",
              cursor: "pointer",
            }}
          >
            Save items
          </button>
        </div>
      </div>
    </div>
  );
}

