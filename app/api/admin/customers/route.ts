import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

function normalizeFlat(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const society = (url.searchParams.get("society") ?? "").trim();
    const flatInput = (url.searchParams.get("flat") ?? "").trim();

    if (!society && !flatInput) {
      const customers = db.getCustomers();
      return NextResponse.json({ customers }, { status: 200 });
    }

    if (!society || !flatInput) {
      return NextResponse.json({ matches: [] }, { status: 200 });
    }

    const normalizedFlat = normalizeFlat(flatInput);

    const customers = db.getCustomers();
    const matches = customers.filter((row: any) => {
      if (row.society_name !== society) return false;
      const a = row.flat_number ? normalizeFlat(row.flat_number) : "";
      const b = row.customer_name ? normalizeFlat(row.customer_name) : "";
      return a === normalizedFlat || b === normalizedFlat;
    });

    return NextResponse.json({ matches }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/customers] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error while searching customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.phone_number || !body.name) {
      return NextResponse.json({ error: "Phone number and name are required" }, { status: 400 });
    }
    const customer = db.upsertCustomer(body);
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/customers] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error while creating customer" }, { status: 500 });
  }
}
