"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { ITEM_PRICES } from "../admin/constants";

type OrderStatus = "NEW" | "PICKED" | "DELIVERED" | "CANCELLED";

interface OrderSummary {
  id: string;
  created_at: string;
  pickup_date: string;
  pickup_slot: string;
  society_name: string;
  flat_number: string;
  status: OrderStatus;
  estimated_total: number | null;
  total_price: number | null;
  express_delivery: boolean;
  self_drop: boolean;
  notes?: string | null;

  // optional – if /api/my-orders returns items_json we will use it
  items_json?: Record<string, number> | null;
  items_estimated_total?: number | null;
}

interface MyOrdersApiResponse {
  orders?: OrderSummary[];
  error?: string;
}

interface SingleOrderApiResponse {
  order?: OrderSummary;
  error?: string;
}

const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1";
const inputClass = "w-full rounded-lg border border-gray-300 dark:border-white/10 px-2.5 py-2 text-[13px] outline-none text-gray-900 dark:text-white bg-white dark:bg-[#131B2F] focus:border-[#FF6B00]";

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("Failed to parse JSON response:", err, text);
    return null;
  }
}

type ItemPriceDef = { label: string; price: number };
const ITEM_PRICES_MAP: Record<string, ItemPriceDef> =
  ITEM_PRICES as unknown as Record<string, ItemPriceDef>;

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

type ItemsDraft = Record<string, string>;

function buildItemsJsonFromDraft(draft: ItemsDraft): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(draft)) {
    if (!raw) continue;
    const num = parseInt(raw, 10);
    if (!num || num <= 0) continue;
    result[key] = num;
  }
  return result;
}

function computeItemsTotalFromDraft(draft: ItemsDraft): number {
  let total = 0;
  for (const [key, raw] of Object.entries(draft)) {
    if (!raw) continue;
    const num = parseInt(raw, 10);
    if (!num || num <= 0) continue;
    const def = ITEM_PRICES_MAP[key];
    if (!def) continue;
    total += num * def.price;
  }
  return total;
}

function buildDraftFromRawItems(raw: unknown): ItemsDraft {
  const draft: ItemsDraft = {};
  if (raw == null) return draft;

  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse items_json string", err);
      return draft;
    }
  }

  if (parsed && typeof parsed === "object") {
    const entries = Object.entries(parsed as Record<string, unknown>);
    for (const [key, value] of entries) {
      if (typeof value === "number" && value > 0) {
        draft[key] = String(value);
      }
    }
  }

  return draft;
}

export default function MyOrders(props: { onBack: () => void }) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPickupDate, setEditPickupDate] = useState("");
  const [editPickupSlot, setEditPickupSlot] = useState<"Morning" | "Evening">(
    "Morning",
  );
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Items editing: per-order map + active modal order
  const [itemsDraftByOrder, setItemsDraftByOrder] = useState<
    Record<string, ItemsDraft>
  >({});
  const [itemsModalOrderId, setItemsModalOrderId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ironingUserInfo");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          phone?: string;
        };
        if (parsed.phone) setPhone(parsed.phone);
      } catch {
        // ignore
      }
    }
  }, []);

  const fetchOrders = async () => {
    setError("");
    setHasSearched(true);

    if (!phone.trim()) {
      setError("Enter your mobile number.");
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/my-orders?phone=${encodeURIComponent(phone.trim())}`,
      );
      const text = await res.text();

      const data = safeJsonParse<MyOrdersApiResponse>(text);
      if (!data) {
        setError("Unexpected server response while loading your orders.");
        setOrders([]);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to load orders.");
        setOrders([]);
        return;
      }

      setOrders(data.orders ?? []);
    } catch (err) {
      console.error("Fetch my orders error:", err);
      setError("Unexpected error while loading your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: OrderStatus) => {
    if (status === "NEW") return "Booked";
    if (status === "PICKED") return "Picked up / In progress";
    if (status === "DELIVERED") return "Delivered";
    return "Cancelled";
  };

  const statusColor = (status: OrderStatus) => {
    if (status === "NEW") return "#1d4ed8";
    if (status === "PICKED") return "#f97316";
    if (status === "DELIVERED") return "#16a34a";
    return "#6b7280";
  };

  // Only NEW + not billed yet can be changed/cancelled
  const canModifyOrCancel = (order: OrderSummary) =>
    order.status === "NEW" && !order.total_price;

  const startEdit = (order: OrderSummary) => {
    setEditingId(order.id);
    setEditPickupDate(order.pickup_date);
    setEditPickupSlot(
      order.pickup_slot.toLowerCase().includes("evening")
        ? "Evening"
        : "Morning",
    );
    setEditNotes(order.notes ?? "");
  };

  const resetEdit = () => {
    setEditingId(null);
    setEditPickupDate("");
    setEditPickupSlot("Morning");
    setEditNotes("");
  };

  async function loadOrderItems(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      const text = await res.text();
      const data = safeJsonParse<SingleOrderApiResponse>(text);

      if (!res.ok || !data?.order) {
        return;
      }

      const raw = (data.order as { items_json?: unknown }).items_json;
      const base = buildDraftFromRawItems(raw);

      if (Object.keys(base).length === 0) return;

      setItemsDraftByOrder((prev) => ({
        ...prev,
        [orderId]: base,
      }));
    } catch (err) {
      console.error("Failed to load order items", err);
    }
  }

  // --- Items edit helpers ---

  const openItemsModal = (order: OrderSummary) => {
    const orderId = order.id;

    // Open modal immediately
    setItemsModalOrderId(orderId);

    // If we already built a draft once, reuse it
    setItemsDraftByOrder((prev) => {
      if (prev[orderId]) return prev;

      const raw = (order as { items_json?: unknown }).items_json;
      const base = buildDraftFromRawItems(raw);

      if (Object.keys(base).length === 0) {
        // nothing to add right now – maybe this order list didn't include items_json
        return prev;
      }

      return {
        ...prev,
        [orderId]: base,
      };
    });

    // If the order object we have doesn't carry items_json, fetch full order once
    const hasItemsJson =
      (order as { items_json?: unknown }).items_json !== undefined &&
      (order as { items_json?: unknown }).items_json !== null;

    if (!hasItemsJson) {
      void loadOrderItems(orderId);
    }
  };

  const handleModalItemChange = (key: string, value: string) => {
    if (!itemsModalOrderId) return;

    const cleaned = value.replace(/[^0-9]/g, "");
    setItemsDraftByOrder((prev) => {
      const current = prev[itemsModalOrderId] || {};
      return {
        ...prev,
        [itemsModalOrderId]: {
          ...current,
          [key]: cleaned,
        },
      };
    });
  };

  const closeItemsModal = () => {
    setItemsModalOrderId(null);
  };

  const handleUpdateOrder = async (e: FormEvent, orderId: string) => {
    e.preventDefault();
    if (!editPickupDate) return;

    setSavingEdit(true);
    setError("");

    try {
      const payload: {
        pickup_date: string;
        pickup_slot: "Morning" | "Evening";
        notes: string | null;
        items_json?: Record<string, number>;
        items_estimated_total?: number | null;
        base_amount?: number | null;
        estimated_total?: number | null;
      } = {
        pickup_date: editPickupDate,
        pickup_slot: editPickupSlot,
        notes: editNotes.trim() || null,
      };

      const draft = itemsDraftByOrder[orderId];
      if (draft) {
        const itemsJson = buildItemsJsonFromDraft(draft);
        const itemsTotal = computeItemsTotalFromDraft(draft);

        if (Object.keys(itemsJson).length > 0) {
          payload.items_json = itemsJson;
          payload.items_estimated_total = itemsTotal || null;
          payload.base_amount = itemsTotal || null;
          payload.estimated_total = itemsTotal || null;
        }
      }

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = safeJsonParse<SingleOrderApiResponse>(text);

      if (!data) {
        setError(
          "Unexpected server response while updating your order. Please try again.",
        );
        return;
      }

      if (!res.ok) {
        setError(data.error || "Could not update order.");
        return;
      }

      if (!data.order) {
        setError("Updated order not returned by server.");
        return;
      }

      const updated = data.order;

      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
      );
      resetEdit();
    } catch (err) {
      console.error("Update order error:", err);
      setError("Unexpected error while updating order.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Cancel this order? This cannot be undone.");
    if (!confirmed) return;

    setCancellingId(orderId);
    setError("");

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
        }),
      });

      const text = await res.text();
      const data = safeJsonParse<SingleOrderApiResponse>(text);
      if (!data) {
        setError(
          "Unexpected server response while cancelling your order. Please contact the shop.",
        );
        return;
      }

      if (!res.ok) {
        setError(data.error || "Could not cancel order.");
        return;
      }

      if (!data.order) {
        setError("Updated order not returned by server.");
        return;
      }

      const updated = data.order;

      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
      );
    } catch (err) {
      console.error("Cancel order error:", err);
      setError("Unexpected error while cancelling order.");
    } finally {
      setCancellingId(null);
    }
  };

  const modalOrder = itemsModalOrderId
    ? orders.find((o) => o.id === itemsModalOrderId) ?? null
    : null;

  const editingOrder = editingId
    ? orders.find((o) => o.id === editingId) ?? null
    : null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <button
          type="button"
          onClick={props.onBack}
          style={{
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          ← Home
        </button>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            
            margin: 0,
          }}
        >
          My Orders
        </h2>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          padding: 14,
          
          fontSize: 13,
          
        }}
      >
        <p style={{ marginBottom: 8 }}>
          Enter your mobile number to see your recent ironing orders.
        </p>
        <label className={labelClass}>Mobile Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={fetchOrders}
          style={{
            marginTop: 10,
            width: "100%",
            borderRadius: 8,
            padding: "8px 12px",
            backgroundColor: "#6b7280",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "View Orders"}
        </button>

        {error && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#b91c1c",
              backgroundColor: "#fee2e2",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && hasSearched && !error && orders.length === 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              
            }}
          >
            No recent orders found for this number.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 8,
            }}
          >
            {orders.map((o) => {
              const editable = canModifyOrCancel(o);
              const isEditing = editingId === o.id;

              return (
                <div
                  key={o.id}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    
                    padding: 10,
                    opacity: isEditing ? 0.9 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        
                      }}
                    >
                      Pickup: {o.pickup_date} · {o.pickup_slot}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: "2px 8px",
                        backgroundColor: statusColor(o.status),
                        color: "#f9fafb",
                      }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      
                      marginBottom: 2,
                    }}
                  >
                    {o.society_name} · Flat {o.flat_number}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      
                      marginBottom: 4,
                    }}
                  >
                    {o.self_drop
                      ? "Method: Self drop & pickup from shop"
                      : "Method: Doorstep pickup & delivery"}
                  </div>
                  <div style={{ fontSize: 12, }}>
                    {o.total_price != null ? (
                      <>
                        Amount paid: <strong>₹{o.total_price}</strong>{" "}
                        {o.express_delivery && (
                          <span style={{ color: "#f97316" }}>
                            (including express)
                          </span>
                        )}
                      </>
                    ) : o.estimated_total != null ? (
                      <>
                        Estimated amount:{" "}
                        <strong>₹{o.estimated_total}</strong>{" "}
                        <span style={{ }}>
                          (final amount after ironing)
                        </span>
                      </>
                    ) : (
                      <span style={{ }}>
                        Amount will be confirmed on delivery or pickup.
                      </span>
                    )}
                  </div>

                  {o.notes && !isEditing && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        
                      }}
                    >
                      Notes: {o.notes}
                    </div>
                  )}

                  {/* Modify / Cancel actions (NEW orders only) */}
                  {editable && !isEditing && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        fontSize: 11,
                        
                      }}
                    >
                      <div style={{ flex: "1 1 100%" }}>
                        You can modify pickup date/time, notes, and items
                        until clothes are picked up.
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(o)}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          border: "1px solid #d1d5db",
                          
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Modify
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(o.id)}
                        disabled={cancellingId === o.id}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          border: "1px solid #fecaca",
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor:
                            cancellingId === o.id ? "not-allowed" : "pointer",
                          opacity: cancellingId === o.id ? 0.7 : 1,
                        }}
                      >
                        {cancellingId === o.id ? "Cancelling…" : "Cancel"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Items modal */}
        {modalOrder && (
          <ItemsModal
            order={modalOrder}
            items={itemsDraftByOrder[modalOrder.id] || {}}
            onChange={handleModalItemChange}
            onClose={closeItemsModal}
            onSave={closeItemsModal}
          />
        )}

        {/* Edit order modal */}
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            editPickupDate={editPickupDate}
            editPickupSlot={editPickupSlot}
            editNotes={editNotes}
            savingEdit={savingEdit}
            itemsDraft={itemsDraftByOrder[editingOrder.id] || {}}
            onChangePickupDate={setEditPickupDate}
            onChangePickupSlot={setEditPickupSlot}
            onChangeNotes={setEditNotes}
            onClose={resetEdit}
            onSubmit={(e) => handleUpdateOrder(e, editingOrder.id)}
            onOpenItems={() => openItemsModal(editingOrder)}
          />
        )}
      </div>
    </div>
  );
}

function ItemsModal(props: {
  order: OrderSummary;
  items: ItemsDraft;
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

  const decrement = (key: string) => {
    const { num } = getValuePair(key);
    const next = Math.max(0, num - 1);
    onChange(key, next === 0 ? "" : String(next));
  };

  const increment = (key: string) => {
    const { num } = getValuePair(key);
    const next = num + 1;
    onChange(key, String(next));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex justify-center items-center z-[9999] p-3">
      <div className="w-full max-w-[520px] max-h-[90vh] rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#131B2F] flex flex-col p-3 shadow-[0_20px_45px_rgba(0,0,0,0.25)] text-gray-900 dark:text-white">
        {/* Header */}
        <div className="flex justify-between gap-2 items-center mb-2.5">
          <div>
            <div className="text-sm font-bold">Edit items</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {order.society_name} • Flat {order.flat_number}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 dark:border-white/10 px-2.5 py-1 text-xs bg-white dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A374A] transition-colors"
          >
            Close
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A1128]">
          <div className="grid grid-cols-1 gap-2.5 text-[13px]">
            {ITEM_GROUPS.map((group) => (
              <div
                key={group.title}
                className="p-2 rounded-lg bg-white dark:bg-[#1E293B] border border-transparent dark:border-white/5"
              >
                {/* group header */}
                <div className="text-sm font-bold mb-1.5 text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-1">
                  {group.title}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {group.keys.map((key) => {
                    const def = ITEM_PRICES_MAP[key];
                    if (!def) return null;

                    const { raw } = getValuePair(key);
                    const label = def.label;

                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center gap-2"
                      >
                        <span>
                          {label}
                          <span className="text-gray-900 dark:text-gray-300">
                            {" "}
                            — ₹{def.price}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => decrement(key)}
                            className="w-[26px] h-[26px] rounded-full border border-gray-300 dark:border-white/10 bg-white dark:bg-[#2A374A] text-gray-900 dark:text-white text-base leading-none cursor-pointer flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#3B4A60] transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={raw}
                            onChange={handleTypedChange(key)}
                            inputMode="numeric"
                            className="w-[54px] rounded-full border border-gray-300 dark:border-white/10 bg-white dark:bg-[#131B2F] text-gray-900 dark:text-white px-1.5 py-1 text-[13px] text-center outline-none focus:border-[#FF6B00]"
                          />
                          <button
                            type="button"
                            onClick={() => increment(key)}
                            className="w-[26px] h-[26px] rounded-full border border-gray-300 dark:border-white/10 bg-white dark:bg-[#2A374A] text-gray-900 dark:text-white text-base leading-none cursor-pointer flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#3B4A60] transition-colors"
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
        <div className="mt-2.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs bg-white dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A374A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-full border-none px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-400 to-green-500 text-green-900 cursor-pointer hover:opacity-90 transition-opacity"
          >
            Save items
          </button>
        </div>
      </div>
    </div>
  );
}

function EditOrderModal(props: {
  order: OrderSummary;
  editPickupDate: string;
  editPickupSlot: "Morning" | "Evening";
  editNotes: string;
  savingEdit: boolean;
  itemsDraft: ItemsDraft;
  onChangePickupDate: (value: string) => void;
  onChangePickupSlot: (value: "Morning" | "Evening") => void;
  onChangeNotes: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onOpenItems: () => void;
}) {
  const {
    order,
    editPickupDate,
    editPickupSlot,
    editNotes,
    savingEdit,
    itemsDraft,
    onChangePickupDate,
    onChangePickupSlot,
    onChangeNotes,
    onClose,
    onSubmit,
    onOpenItems,
  } = props;

  const draftItemsTotal =
    itemsDraft && Object.keys(itemsDraft).length > 0
      ? computeItemsTotalFromDraft(itemsDraft)
      : null;

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex justify-center items-center z-[9998] p-3">
      <div className="w-full max-w-[520px] max-h-[90vh] rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#131B2F] flex flex-col p-3 shadow-[0_20px_45px_rgba(0,0,0,0.25)] text-gray-900 dark:text-white">
        {/* Header */}
        <div className="flex justify-between gap-2 items-center mb-2">
          <div>
            <div className="text-sm font-bold">Modify your order</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {order.society_name} • Flat {order.flat_number}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 dark:border-white/10 px-2.5 py-1 text-xs bg-white dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A374A] transition-colors"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto p-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A1128] flex flex-col gap-2"
        >
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">
            Update pickup details and items
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Pickup Date</label>
              <input
                type="date"
                value={editPickupDate}
                onChange={(e) => onChangePickupDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Pickup Time</label>
              <select
                value={editPickupSlot}
                onChange={(e) =>
                  onChangePickupSlot(
                    e.target.value === "Evening" ? "Evening" : "Morning",
                  )
                }
                className={inputClass}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          {/* Items edit summary + button */}
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            <div className="mb-1">
              Items (optional):{" "}
              {draftItemsTotal != null
                ? `Estimated total ₹${draftItemsTotal}`
                : "No items selected yet."}
            </div>
            <button
              type="button"
              onClick={onOpenItems}
              className="rounded-full border border-gray-300 dark:border-white/10 px-2.5 py-1 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A374A] transition-colors"
            >
              Edit items
            </button>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => onChangeNotes(e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-[11px] font-semibold bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A374A] transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="rounded-full border-none px-3 py-1.5 text-[11px] font-semibold bg-blue-600 text-white cursor-pointer hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
