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

// PUT /api/customer
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // We require a phone number as primary key
    if (!body.phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const customerData = {
      phone: body.phone,
      phone_number: body.phone, // fallback naming convention used in db
      customer_name: body.name,
      email: body.email,
      society_name: body.society,
      block: body.block,
      flat_number: body.flat,
    };

    const updated = db.upsertCustomer(customerData);
    return NextResponse.json({ success: true, customer: updated });
  } catch (err) {
    console.error("Customer PUT API error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
