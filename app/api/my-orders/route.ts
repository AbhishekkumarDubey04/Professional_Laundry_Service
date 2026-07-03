import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

// GET /api/my-orders?phone=xxxxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
    }

    const trimmed = phone.trim();
    
    // Get all orders from local db and filter by phone
    const orders = db.getOrders();
    const userOrders = orders
      .filter((o: any) => o.phone === trimmed)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({ orders: userOrders }, { status: 200 });
  } catch (err) {
    console.error("My Orders API error:", err);
    return NextResponse.json({ error: "Unexpected error in /api/my-orders" }, { status: 500 });
  }
}
