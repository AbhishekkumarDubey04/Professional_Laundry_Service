import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderData = body.order;
    const customerData = body.customer; // optional

    if (!orderData) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    const insertedOrder = db.insertOrder(orderData);

    if (customerData && customerData.phone_number) {
      db.upsertCustomer(customerData);
    }

    return NextResponse.json({ success: true, order: insertedOrder });
  } catch (error: any) {
    console.error("[POST /api/orders] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
