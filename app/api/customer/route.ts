import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

// GET /api/customer?phone=xxxxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Missing phone query param" }, { status: 400 });
    }

    const trimmed = phone.trim();

    const customers = db.getCustomers();
    const customer = customers.find((c: any) => c.phone === trimmed) || null;

    return NextResponse.json({ customer }, { status: 200 });
  } catch (err) {
    console.error("Customer API error:", err);
    return NextResponse.json({ error: "Unexpected error in /api/customer" }, { status: 500 });
  }
}
