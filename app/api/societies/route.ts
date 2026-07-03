import { NextResponse } from "next/server";
import { db } from "../../lib/db";

// GET /api/societies
// Returns all societies ordered alphabetically by name.
export async function GET() {
  try {
    const societies = db.getSocieties();
    societies.sort((a: any, b: any) => a.name.localeCompare(b.name));
    return NextResponse.json({ societies }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/societies] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading societies" },
      { status: 500 }
    );
  }
}

// POST /api/societies
// Body: { name: string }
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
    };

    const rawName = body.name ?? "";
    const name = rawName.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Society name is required" },
        { status: 400 }
      );
    }

    const societies = db.getSocieties();
    const existing = societies.find((s: any) => s.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      return NextResponse.json(
        { error: "A society with this name already exists" },
        { status: 409 }
      );
    }

    const society = db.insertSociety({ name, created_at: new Date().toISOString() });
    return NextResponse.json({ society }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/societies] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating society" },
      { status: 500 }
    );
  }
}
