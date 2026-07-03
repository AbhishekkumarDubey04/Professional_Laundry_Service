import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Order id is required." }, { status: 400 });
    }

    const payload = await request.json();
    const { action, ...updates } = payload;

    const orders = db.getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === id);

    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const currentOrder = orders[orderIndex];

    if (currentOrder.status !== "NEW") {
      return NextResponse.json({ error: "Order cannot be modified (already picked or delivered)." }, { status: 400 });
    }

    if (action === "cancel") {
      const updatedOrder = db.updateOrder(id, { status: "CANCELLED" });
      return NextResponse.json({ order: updatedOrder });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updatedOrder = db.updateOrder(id, updates);
    return NextResponse.json({ order: updatedOrder });
  } catch (err: any) {
    console.error("Unexpected orders/[id] error", err);
    return NextResponse.json({ error: "Unexpected error while updating order." }, { status: 500 });
  }
}
