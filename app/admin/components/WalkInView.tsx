// app/admin/components/WalkInView.tsx
"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ITEM_PRICES } from "../constants";

type ItemPriceDef = { label: string; price: number };
const ITEM_PRICES_MAP: Record<string, ItemPriceDef> = ITEM_PRICES as unknown as Record<string, ItemPriceDef>;

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

interface Props {
  isMobile: boolean;
  societies: string[];
  newCustomerName: string; // flat number
  newPhone: string;
  newSociety: string;
  newBlock: string;
  newItemsJson: Record<string, number>;
  creatingWalkIn: boolean;
  setNewCustomerName: (v: string) => void;
  setNewPhone: (v: string) => void;
  setNewSociety: (v: string) => void;
  setNewBlock: (v: string) => void;
  setNewItemsJson: (v: Record<string, number>) => void;
  onCreateWalkIn: () => void;
}

type CustomerMatch = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  society_name: string | null;
  flat_number: string | null;
  block: string | null;
};

const ADD_NEW_VALUE = "__ADD_NEW_SOCIETY__";

export default function WalkInView({
  isMobile,
  societies,
  newCustomerName,
  newPhone,
  newSociety,
  newBlock,
  newItemsJson,
  creatingWalkIn,
  setNewCustomerName,
  setNewPhone,
  setNewSociety,
  setNewBlock,
  setNewItemsJson,
  onCreateWalkIn,
}: Props) {
  const isPSRAster = newSociety === "PSR Aster";

  // Societies list (from /api/societies, with fallback to societies prop)
  const [societyOptions, setSocietyOptions] = useState<string[]>([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [societiesError, setSocietiesError] = useState<string | null>(null);

  // "Add new society" UI state
  const [isAddingSociety, setIsAddingSociety] = useState(false);
  const [newSocietyNameInput, setNewSocietyNameInput] = useState("");
  const [addSocietyError, setAddSocietyError] = useState<string | null>(null);
  const [addingSociety, setAddingSociety] = useState(false);

  // Customer lookup state
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerLookupError, setCustomerLookupError] = useState<string | null>(
    null,
  );

  /**
   * IMPORTANT:
   * We do NOT want lookup to re-run when society changes.
   * But inside lookup, we still want the latest society value.
   * So we store society in a ref.
   */
  const societyRef = useRef(newSociety);
  useEffect(() => {
    societyRef.current = newSociety;
  }, [newSociety]);

  // Load societies from /api/societies
  useEffect(() => {
    let cancelled = false;

    async function loadSocieties() {
      setSocietiesLoading(true);
      setSocietiesError(null);

      try {
        const res = await fetch("/api/societies");
        if (!res.ok) throw new Error("Failed to fetch societies");

        const json = await res.json();
        const list = (json?.societies ?? []).map(
          (s: { name: string }) => s.name,
        ) as string[];

        if (cancelled) return;

        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => a.localeCompare(b));
          setSocietyOptions(sorted);

          // If empty, set default society once
          if (!newSociety) {
            if (sorted.includes("PSR Aster")) setNewSociety("PSR Aster");
            else setNewSociety(sorted[0] ?? "");
          }
        } else {
          const fallback = Array.from(new Set(societies)).sort();
          setSocietyOptions(fallback);
        }
      } catch (err) {
        console.error("Error loading societies", err);
        if (!cancelled) {
          setSocietiesError("Could not load societies. You can still proceed.");
          const fallback = Array.from(new Set(societies)).sort();
          setSocietyOptions(fallback);
        }
      } finally {
        if (!cancelled) setSocietiesLoading(false);
      }
    }

    loadSocieties();

    return () => {
      cancelled = true;
    };
  }, [societies, newSociety, setNewSociety]);

  const effectiveSocietyOptions =
    societyOptions.length > 0
      ? societyOptions
      : Array.from(new Set(societies)).sort();

  const handleSocietyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;

      if (value === ADD_NEW_VALUE) {
        setIsAddingSociety(true);
        setAddSocietyError(null);
        return;
      }

      setNewSociety(value);
      setIsAddingSociety(false);
      setNewSocietyNameInput("");
      setAddSocietyError(null);

      // NOTE: we do NOT trigger lookup here.
      // Lookup happens only when flat changes.
    },
    [setNewSociety],
  );

  const handleAddSociety = useCallback(async () => {
    const name = newSocietyNameInput.trim();

    if (!name) {
      setAddSocietyError("Please enter a society name.");
      return;
    }

    setAddingSociety(true);
    setAddSocietyError(null);

    try {
      const res = await fetch("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddSocietyError(
          data?.error || "Could not add society. Please try again.",
        );
        return;
      }

      const createdName: string = data?.society?.name ?? name;

      setSocietyOptions((prev) =>
        Array.from(new Set([...prev, createdName])).sort((a, b) =>
          a.localeCompare(b),
        ),
      );
      setNewSociety(createdName);
      setIsAddingSociety(false);
      setNewSocietyNameInput("");
      setAddSocietyError(null);
    } catch (err) {
      console.error("Error adding society", err);
      setAddSocietyError("Something went wrong. Please try again.");
    } finally {
      setAddingSociety(false);
    }
  }, [newSocietyNameInput, setNewSociety]);

  const handleCancelAddSociety = useCallback(() => {
    setIsAddingSociety(false);
    setNewSocietyNameInput("");
    setAddSocietyError(null);
  }, []);

  const applyCustomerMatch = useCallback(
    (match: CustomerMatch) => {
      // Always overwrite; clear if missing so older values never stick
      setNewCustomerName(match.flat_number ?? match.customer_name ?? "");
      setNewBlock(match.block ?? "");
      setNewPhone(match.phone ?? "");
      if (match.society_name) setNewSociety(match.society_name);
    },
    [setNewCustomerName, setNewBlock, setNewPhone, setNewSociety],
  );

  /**
   * Customer lookup — ONLY when flat changes
   */
  useEffect(() => {
    const flat = newCustomerName.trim();
    const society = societyRef.current.trim();

    if (!flat || !society) {
      setCustomerMatches([]);
      setCustomerLookupError(null);
      setCustomerLookupLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setCustomerLookupLoading(true);
      setCustomerLookupError(null);

      try {
        const params = new URLSearchParams({ society, flat });

        const res = await fetch(`/api/admin/customers?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to lookup customer");

        const json = await res.json();
        if (cancelled) return;

        const matches = (json?.matches ?? []) as CustomerMatch[];
        setCustomerMatches(matches);

        // ✅ If no matches -> clear phone + block so old values don’t stick
        if (matches.length === 0) {
          setNewPhone("");
          setNewBlock("");
          return;
        }

        // ✅ If exactly one match -> auto-fill
        if (matches.length === 1) {
          applyCustomerMatch(matches[0]);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Error looking up customer", err);
        setCustomerLookupError("Could not check existing customers.");
        setCustomerMatches([]);
      } finally {
        if (!cancelled) setCustomerLookupLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [newCustomerName, applyCustomerMatch, setNewBlock, setNewPhone]);

  const handleItemChange = (key: string, rawValue: string) => {
    const cleaned = rawValue.replace(/[^0-9]/g, "");
    const nextVal = cleaned === "" ? 0 : parseInt(cleaned, 10);
    const updated = { ...newItemsJson };
    if (nextVal > 0) updated[key] = nextVal;
    else delete updated[key];
    setNewItemsJson(updated);
  };

  const incrementItem = (key: string) => {
    const current = newItemsJson[key] || 0;
    setNewItemsJson({ ...newItemsJson, [key]: current + 1 });
  };

  const decrementItem = (key: string) => {
    const current = newItemsJson[key] || 0;
    const next = Math.max(0, current - 1);
    const updated = { ...newItemsJson };
    if (next > 0) updated[key] = next;
    else delete updated[key];
    setNewItemsJson(updated);
  };

  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-black/20 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-colors placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-[#131B2F] rounded-2xl border border-gray-200 dark:border-white/10 p-5 md:p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="p-3 bg-gradient-to-br from-[#FF6B00] to-[#FFA366] text-white rounded-xl shadow-md shadow-[#FF6B00]/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Add Walk-in Order</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">For customers who directly drop clothes at the shop.</p>
          </div>
        </div>

        {/* Inputs */}
        <div className={`grid gap-5 md:gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"}`}>
          {/* Flat number */}
          <div className="space-y-1">
            <label className={labelClass}>Flat number</label>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="G7, T16, S79 etc."
              className={inputClass}
            />

            {customerLookupLoading && newCustomerName.trim() && societyRef.current.trim() && (
              <div className="mt-1.5 text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Checking existing customers…
              </div>
            )}

            {!customerLookupLoading && customerMatches.length === 1 && (
              <div className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Existing customer matched. Details auto-filled.
              </div>
            )}

            {!customerLookupLoading && customerMatches.length > 1 && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                Found multiple customers for this flat:
                <div className="mt-2 flex flex-col gap-2">
                  {customerMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => applyCustomerMatch(m)}
                      className="text-left w-full rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-3 py-2 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-amber-500">{(m.flat_number || m.customer_name || "").toString()} {m.block ? `, ${m.block} Block` : ""}</div>
                      {m.phone && <div className="text-gray-500 dark:text-amber-400/70 mt-0.5 font-mono">{m.phone}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customerLookupError && (
              <div className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                {customerLookupError}
              </div>
            )}
          </div>

          {/* Block */}
          <div className="space-y-1">
            <label className={labelClass}>Block</label>
            {isPSRAster ? (
              <select
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="">Select block</option>
                <option value="A">A Block</option>
                <option value="B">B Block</option>
                <option value="C">C Block</option>
                <option value="D">D Block</option>
                <option value="E">E Block</option>
                <option value="F">F Block</option>
                <option value="G">G Block</option>
              </select>
            ) : (
              <input
                type="text"
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
                placeholder="Optional (e.g. A, B, G)"
                className={inputClass}
              />
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className={labelClass}>Phone number</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="10-digit mobile"
              className={inputClass}
            />
          </div>

          {/* Society */}
          <div className="space-y-1">
            <label className={labelClass}>Society</label>
            {societiesLoading ? (
              <div className={`${inputClass} flex items-center gap-2 text-gray-500`}>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading societies…
              </div>
            ) : (
              <select
                value={newSociety}
                onChange={handleSocietyChange}
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="">Select society</option>
                {effectiveSocietyOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value={ADD_NEW_VALUE}>+ Add new society</option>
              </select>
            )}

            {societiesError && (
              <div className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                {societiesError}
              </div>
            )}

            {isAddingSociety && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newSocietyNameInput}
                  onChange={(e) => setNewSocietyNameInput(e.target.value)}
                  placeholder="New society name"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddSociety}
                  disabled={addingSociety}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${addingSociety ? "bg-emerald-500/50 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20"}`}
                >
                  {addingSociety ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAddSociety}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {addSocietyError && (
              <div className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                {addSocietyError}
              </div>
            )}
          </div>

          {/* Clothes Details (Inline List) */}
          <div className="space-y-4 lg:col-span-4 mt-2 border-t border-gray-100 dark:border-white/5 pt-6">
            <label className={`${labelClass} text-base mb-4`}>Add Items (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {ITEM_GROUPS.map((group) => (
                <div key={group.title} className="bg-gray-50 dark:bg-black/10 rounded-xl p-4 border border-gray-200 dark:border-white/5">
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    {group.title}
                  </div>
                  <div className="space-y-3">
                    {group.keys.map((key) => {
                      const def = ITEM_PRICES_MAP[key];
                      if (!def) return null;
                      const qty = newItemsJson[key] || 0;
                      return (
                        <div key={key} className="flex justify-between items-center gap-4">
                          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 leading-tight">
                            {def.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => decrementItem(key)}
                              className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={qty === 0 ? "" : qty}
                              onChange={(e) => handleItemChange(key, e.target.value)}
                              className="w-10 text-center bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-semibold focus:outline-none focus:border-[#FF6B00]"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => incrementItem(key)}
                              className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
        </div>

        {/* Action Bar */}
        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onCreateWalkIn}
            disabled={creatingWalkIn}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${creatingWalkIn ? "bg-emerald-500/50 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-105 hover:shadow-emerald-500/25"}`}
          >
            {creatingWalkIn ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Adding Order…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Add Walk-in Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
