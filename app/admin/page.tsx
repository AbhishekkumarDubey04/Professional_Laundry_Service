// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

import type { Order, AdminTab } from "./types";
import { filterLabelStyle, filterInputStyle } from "./styles";
import { 
  LayoutDashboard, ShoppingBag, PlusCircle, 
  Truck, CheckCircle, Settings, Users, LogOut 
} from "lucide-react";
import PickupView from "./components/PickupView";
import SimpleView from "./components/SimpleView";
import OrdersView from "./components/OrdersView";
import WalkInView from "./components/WalkInView";
import DashboardView from "./components/DashboardView";
import ServicesView from "./components/ServicesView";
import CustomersView from "./components/CustomersView";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [date, setDate] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [societyFilter, setSocietyFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  
  const [userRole, setUserRole] = useState<"admin" | "employee">("admin");
  const [isClient, setIsClient] = useState(false);
  
  // Use the mobile layout for all screen sizes (keeps UI consistent)
const isMobile = true;


  // Walk-in order state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSociety, setNewSociety] = useState("PSR Aster");
  const [newBlock, setNewBlock] = useState(""); // NEW: block for walk-ins
  const [newItemsJson, setNewItemsJson] = useState<Record<string, number>>({});
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

  // Set default date = today (used for walk-in orders)
  useEffect(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    setDate(todayISO);
  }, []);

  // Load all orders once on mount
  useEffect(() => {
    setIsClient(true);
    const role = localStorage.getItem("userRole") as "admin" | "employee" | null;
    if (role === "employee") {
      setUserRole("employee");
    }
    void fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      // Always send date=ALL so backend doesn't complain
      const res = await fetch(`/api/admin/orders?date=ALL`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders((data.orders || []) as Order[]);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unexpected error while loading orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function setRowSaving(id: string, value: boolean) {
    setSavingMap((prev) => ({ ...prev, [id]: value }));
  }

  async function saveOrderPartial(
    id: string,
    patch: {
      status?: Order["status"];
      worker_name?: string | null;
      total_price?: number | null;
      base_amount?: number | null;
      items_json?: Record<string, number> | null;
    }
  ) {
    if (!patch || Object.keys(patch).length === 0) return;

    setRowSaving(id, true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...patch,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Update order error:", data);
        setError(data.error || "Failed to update order");
        return;
      }

      const updated: Order = data.order;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      console.error("Update order request error:", err);
      setError("Unexpected error while updating order");
    } finally {
      setRowSaving(id, false);
    }
  }

  function handleStatusChange(id: string, status: Order["status"]) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    void saveOrderPartial(id, { status });
  }

  function handleTotalUpdate(
    id: string,
    total: number | null,
    baseAmount: number | null,
    itemsCounts: Record<string, number> | null
  ) {
    // If there are no items, send an empty object instead of null
    // so the backend actually clears old items_json.
    const sanitizedItems =
      itemsCounts && Object.keys(itemsCounts).length > 0 ? itemsCounts : {};

    const patch: {
      total_price?: number | null;
      base_amount?: number | null;
      items_json?: Record<string, number>; // always send an object
    } = {
      total_price: total,
      base_amount: baseAmount,
      items_json: sanitizedItems,
    };

    void saveOrderPartial(id, patch);
  }

  async function handlePickupConfirm(id: string) {
  const match = orders.find((o) => o.id === id);
  if (!match || match.status !== "NEW") return;

  // If customer already added items during booking, base_amount is already known.
  // When we confirm pickup, auto-set total_price (so billing is not blank).
  const inferredTotal =
    typeof match.total_price === "number" && match.total_price > 0
      ? match.total_price
      : typeof match.base_amount === "number" && match.base_amount > 0
      ? match.base_amount
      : null;

  setOrders((prev) =>
    prev.map((o) =>
      o.id === id
        ? {
            ...o,
            status: "PICKED",
            total_price:
              inferredTotal !== null && (o.total_price == null || o.total_price === 0)
                ? inferredTotal
                : o.total_price,
          }
        : o,
    ),
  );

  void saveOrderPartial(id, {
    status: "PICKED",
    ...(inferredTotal !== null ? { total_price: inferredTotal } : {}),
  });
}


  async function handleCreateWalkInOrder() {
    if (!date) {
      setError("Please select a pickup date first.");
      return;
    }
    if (!newSociety) {
      setError("Please select a society for the walk-in order.");
      return;
    }

    // Use flat number as both customer_name and flat_number
    const flatNumber = newCustomerName || "Walk-in";

    setCreatingWalkIn(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  customer_name: flatNumber,
  phone: newPhone || "",
  society_name: newSociety,
  flat_number: flatNumber,
  pickup_date: date,
  pickup_slot: "Self drop",
  self_drop: true,
  status: "PICKED",
  items_json: Object.keys(newItemsJson).length > 0 ? newItemsJson : null,
  notes: null,
  block: newBlock || null,
}),

      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Create order error:", data);
        setError(data.error || "Failed to create walk-in order");
        return;
      }

      const created: Order = data.order;
      setOrders((prev) => [created, ...prev]);

      setNewCustomerName("");
      setNewPhone("");
      setNewSociety("");
      setNewBlock("");
      setNewItemsJson({});
    } catch (err) {
      console.error("Create order request error:", err);
      setError("Unexpected error while creating walk-in order");
    } finally {
      setCreatingWalkIn(false);
    }
  }

  const societies = Array.from(
    new Set(orders.map((o) => o.society_name))
  ).sort();

  const filteredOrders =
    societyFilter === "ALL"
      ? orders
      : orders.filter((o) => o.society_name === societyFilter);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.express_delivery !== b.express_delivery) {
      return a.express_delivery ? -1 : 1;
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime;
  });

  // Orders tab: only show orders that are already picked up (status === "PICKED")
  // Includes walk-ins because they are also status "PICKED".
  const pickedOrders = sortedOrders.filter((o) => o.status === "PICKED");

  const pickupOrders = sortedOrders.filter(
    (o) => o.status === "NEW" && !o.self_drop
  );

  const ALL_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "DASHBOARD", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "ORDERS", label: "Orders", icon: <ShoppingBag className="w-5 h-5" /> },
    { id: "WALKIN", label: "Walk-in", icon: <PlusCircle className="w-5 h-5" /> },
    { id: "PICKUP", label: "Pickup", icon: <Truck className="w-5 h-5" /> },
    { id: "READY", label: "Ready", icon: <CheckCircle className="w-5 h-5" /> },
    { id: "SERVICES", label: "Services", icon: <Settings className="w-5 h-5" /> },
    { id: "CUSTOMERS", label: "Customers", icon: <Users className="w-5 h-5" /> },
  ];

  const TABS = userRole === "employee" 
    ? ALL_TABS.filter(t => ["ORDERS", "WALKIN", "PICKUP", "READY"].includes(t.id))
    : ALL_TABS;

  // Don't render until client side is hydrated so that userRole matches the server/client HTML
  if (!isClient) return null;

  return (
    <div className="flex h-screen bg-[#F5F5DC] dark:bg-[#0A1128] text-black dark:text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#131B2F] border-r border-black/5 dark:border-white/5 flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#FFA366]">Professional Shop</h1>
          <p className="text-xs text-gray-600 dark:text-[#8E94A3] mt-1">{userRole === "employee" ? "Employee Portal" : "Admin Portal"}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20"
                  : "text-gray-600 dark:text-[#8E94A3] hover:bg-black/5 dark:bg-white/5 hover:text-black dark:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-black/5 dark:border-white/5">
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#131B2F] border-b border-black/5 dark:border-white/5">
          <h1 className="text-lg font-bold text-[#FF6B00]">Professional Shop</h1>
          <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value as AdminTab)}
            className="bg-[#F5F5DC] dark:bg-[#0A1128] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-black dark:text-white"
          >
            {TABS.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
          </select>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Page Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{TABS.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-sm text-gray-600 dark:text-[#8E94A3]">Manage your business operations efficiently.</p>
              </div>

              {/* Global Filter */}
              <div className="flex items-center gap-3 bg-white dark:bg-[#131B2F] p-2 rounded-xl border border-black/5 dark:border-white/5">
                <label className="text-xs font-semibold text-gray-600 dark:text-[#8E94A3] ml-2">Society Filter:</label>
                <select
                  value={societyFilter}
                  onChange={(e) => setSocietyFilter(e.target.value)}
                  className="bg-[#F5F5DC] dark:bg-[#0A1128] border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-black dark:text-white outline-none focus:border-[#FF6B00]"
                >
                  <option value="ALL">All Societies</option>
                  {societies.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Dynamic View Render */}
            <div className="bg-white dark:bg-[#131B2F]/50 backdrop-blur-md rounded-[24px] p-6 border border-black/5 dark:border-white/5 shadow-2xl">
              {activeTab === "PICKUP" ? (
                <PickupView
                  isMobile={isMobile}
                  loading={loading}
                  pickupOrders={pickupOrders}
                  savingMap={savingMap}
                  onPickupConfirm={handlePickupConfirm}
                />
              ) : activeTab === "ORDERS" ? (
                <OrdersView
                  loading={loading}
                  sortedOrders={pickedOrders}
                  savingMap={savingMap}
                  onStatusChange={handleStatusChange}
                  onTotalUpdate={handleTotalUpdate}
                />
              ) : activeTab === "WALKIN" ? (
                <WalkInView
                  isMobile={isMobile}
                  societies={societies}
                  newCustomerName={newCustomerName}
                  newPhone={newPhone}
                  newSociety={newSociety}
                  newBlock={newBlock}
                  newItemsJson={newItemsJson}
                  creatingWalkIn={creatingWalkIn}
                  setNewCustomerName={setNewCustomerName}
                  setNewPhone={setNewPhone}
                  setNewSociety={setNewSociety}
                  setNewBlock={setNewBlock}
                  setNewItemsJson={setNewItemsJson}
                  onCreateWalkIn={handleCreateWalkInOrder}
                />
              ) : activeTab === "DASHBOARD" ? (
                <DashboardView orders={orders} loading={loading} />
              ) : activeTab === "SERVICES" ? (
                <ServicesView />
              ) : activeTab === "CUSTOMERS" ? (
                <CustomersView />
              ) : (
                <SimpleView
                  isMobile={isMobile}
                  loading={loading}
                  sortedOrders={sortedOrders}
                  onMarkDelivered={(id) => handleStatusChange(id, "DELIVERED")}
                />
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
