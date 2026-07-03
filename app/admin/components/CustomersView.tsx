// app/admin/components/CustomersView.tsx
"use client";

import { useState } from "react";

const INITIAL_CUSTOMERS = [
  { id: "1", name: "John Doe", phone: "+91 98765 43210", orders: 12 },
  { id: "2", name: "Sarah Smith", phone: "+91 87654 32109", orders: 5 },
  { id: "3", name: "Mike Johnson", phone: "+91 76543 21098", orders: 2 },
  { id: "4", name: "Emily Davis", phone: "+91 65432 10987", orders: 8 },
];

export default function CustomersView() {
  const [customers] = useState(INITIAL_CUSTOMERS);

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
        <div style={{ fontWeight: 600 }}>Customer Directory</div>
        <div style={{  fontSize: 11 }}>Total: {customers.length} Users</div>
      </div>

      {customers.map((customer) => (
        <div
          key={customer.id}
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
                width: 40,
                height: 40,
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                color: "#f97316",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              {customer.name[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{customer.name}</div>
              <div style={{ }}>{customer.phone}</div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{customer.orders}</div>
            <div style={{  fontSize: 10 }}>Orders</div>
          </div>
        </div>
      ))}
    </div>
  );
}
