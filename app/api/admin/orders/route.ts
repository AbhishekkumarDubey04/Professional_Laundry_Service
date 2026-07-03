import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

const STATUS_PRIORITY: Record<string, number> = {
  NEW: 0,
  PICKED: 1,
  READY: 2,
};

function safeTime(v: unknown): number {
  if (typeof v !== "string" || !v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "ALL";

    let orders = db.getOrders();

    if (date !== "ALL") {
      orders = orders.filter((o: any) => o.pickup_date === date);
    }

    orders.sort((a: any, b: any) => {
      const pa = STATUS_PRIORITY[a.status ?? ""] ?? 99;
      const pb = STATUS_PRIORITY[b.status ?? ""] ?? 99;
      if (pa !== pb) return pa - pb;

      const ta = safeTime(a.created_at);
      const tb = safeTime(b.created_at);
      return tb - ta; // newest first within same status
    });

    return NextResponse.json({ orders: orders.slice(0, 1999) });
  } catch (err) {
    console.error("Admin GET /api/admin/orders unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error while loading orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const bodyUnknown: unknown = await request.json();
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;

    const customer_name = typeof body.customer_name === "string" ? body.customer_name : "";
    const phone = typeof body.phone === "string" ? body.phone : "";
    const society_name = typeof body.society_name === "string" ? body.society_name : "";
    const flat_number = typeof body.flat_number === "string" ? body.flat_number : "";
    const pickup_date = typeof body.pickup_date === "string" ? body.pickup_date : "";
    const pickup_slot = typeof body.pickup_slot === "string" ? body.pickup_slot : "";
    const notes = typeof body.notes === "string" ? body.notes : null;
    const status = typeof body.status === "string" ? body.status : "NEW";
    const self_drop = !!body.self_drop;
    const block = typeof body.block === "string" ? body.block : null;

    if (!customer_name || !phone || !society_name || !flat_number || !pickup_date || !pickup_slot) {
      return NextResponse.json({ error: "Missing required fields for order creation" }, { status: 400 });
    }

    db.upsertCustomer({ customer_name, phone, society_name, flat_number, block });

    const insertedOrder = db.insertOrder({
      customer_name,
      phone,
      society_name,
      flat_number,
      pickup_date,
      pickup_slot,
      notes,
      status,
      self_drop,
      block,
    });

    return NextResponse.json({ order: insertedOrder }, { status: 201 });
  } catch (err) {
    console.error("Admin POST /api/admin/orders error:", err);
    return NextResponse.json({ error: "Unexpected error while creating order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const bodyUnknown: unknown = await request.json();
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;
    const status = typeof body.status === "string" ? (body.status as string) : null;
    const ids = Array.isArray(body.ids) ? body.ids : null;
    const idsStr = ids?.filter((x) => typeof x === "string") as string[] | undefined;

    if (idsStr && idsStr.length > 0 && status) {
      const nowIso = new Date().toISOString();
      const bulkPatch: Record<string, unknown> = { status };

      if (status === "PICKED") bulkPatch.picked_at = nowIso;
      if (status === "READY") bulkPatch.ready_at = nowIso;
      if (status === "DELIVERED") bulkPatch.delivered_at = nowIso;

      idsStr.forEach((id) => {
        db.updateOrder(id, bulkPatch);
      });

      return NextResponse.json({ success: true });
    }

    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Missing order id for update" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if (status) {
      patch.status = status;
      const nowIso = new Date().toISOString();
      if (status === "PICKED") patch.picked_at = nowIso;
      if (status === "READY") patch.ready_at = nowIso;
      if (status === "DELIVERED") patch.delivered_at = nowIso;
    }

    if (typeof body.worker_name === "string" || body.worker_name === null) patch.worker_name = body.worker_name;
    if (typeof body.total_price === "number" || body.total_price === null) patch.total_price = body.total_price;
    if (typeof body.base_amount === "number" || body.base_amount === null) patch.base_amount = body.base_amount;
    if (typeof body.items_json === "object" && body.items_json !== null && !Array.isArray(body.items_json)) {
      patch.items_json = body.items_json as Record<string, unknown>;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedOrder = db.updateOrder(id, patch);
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    console.error("Admin PATCH /api/admin/orders error:", err);
    return NextResponse.json({ error: "Unexpected error while updating orders" }, { status: 500 });
  }
}