import { NextResponse } from "next/server";
import { db } from "../../lib/db";

// GET /api/services
export async function GET() {
  try {
    const services = db.getServices();
    return NextResponse.json({ services }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/services] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading services" },
      { status: 500 }
    );
  }
}

// POST /api/services
// Body: { name: string, price: number, icon: string }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, price, icon } = body;

    if (!name || typeof price !== "number") {
      return NextResponse.json(
        { error: "Service name and valid price are required" },
        { status: 400 }
      );
    }

    const service = db.insertService({
      name: name.trim(),
      price,
      icon: icon || "✨",
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating service" },
      { status: 500 }
    );
  }
}

// PUT /api/services
// Body: { id: string, name?: string, price?: number, icon?: string }
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, name, price, icon } = body;

    if (!id) {
      return NextResponse.json({ error: "Service ID required" }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (price !== undefined) updates.price = price;
    if (icon !== undefined) updates.icon = icon;

    const service = db.updateService(id, updates);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service }, { status: 200 });
  } catch (err) {
    console.error("[PUT /api/services] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while updating service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services
// URL query: ?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Service ID required" }, { status: 400 });
    }

    const success = db.deleteService(id);
    if (!success) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/services] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while deleting service" },
      { status: 500 }
    );
  }
}
