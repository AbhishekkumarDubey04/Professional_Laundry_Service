"use client";

import { useState, useEffect } from "react";

interface Service {
  id: string;
  name: string;
  price: number;
  icon: string;
}

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [icon, setIcon] = useState("✨");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setName("");
    setPrice("");
    setIcon("✨");
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setIcon(service.icon);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setSaving(true);
    try {
      const payload = {
        name,
        price: parseFloat(price),
        icon,
      };

      if (editingService) {
        // Edit
        const res = await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingService.id, ...payload }),
        });
        if (res.ok) {
          const { service } = await res.json();
          setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
          closeModal();
        }
      } else {
        // Add
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const { service } = await res.json();
          setServices((prev) => [...prev, service]);
          closeModal();
        }
      }
    } catch (err) {
      console.error("Failed to save service:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`/api/services?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete service:", err);
    }
  };

  if (loading) {
    return <div style={{ fontSize: 12, padding: 20, textAlign: "center" }}>Loading services...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          fontSize: 12,
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 600 }}>Manage Services</div>
        <button
          onClick={openAddModal}
          style={{
            padding: "6px 12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Add New
        </button>
      </div>

      {services.length === 0 ? (
        <div style={{ fontSize: 12, textAlign: "center", color: "#6b7280", padding: 20 }}>
          No services found.
        </div>
      ) : (
        services.map((service) => (
          <div
            key={service.id}
            style={{
              borderRadius: 14,
              border: "1px solid #E5E7EB",
              padding: 12,
              background: "#ffffff",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#111827",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  fontSize: 20,
                  padding: 8,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                }}
              >
                {service.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{service.name}</div>
                <div style={{ }}>Base Price: ₹{service.price}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => openEditModal(service)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#F3F4F6",
                  color: "#111827",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FCA5A5",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 16,
              width: "100%",
              maxWidth: 360,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
              {editingService ? "Edit Service" : "Add Service"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Service Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ironing"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 15"
                  step="0.5"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                  }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    backgroundColor: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
