import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const holdings = await prisma.holding.findMany({
    orderBy: { ticker: "asc" }
  });

  return NextResponse.json({ data: holdings });
}

export async function POST(request: Request) {
  const body = await request.json();

  const missingFields: string[] = [];
  if (!body.ticker) missingFields.push("ticker");
  if (body.shares === undefined) missingFields.push("shares");
  if (body.buy_price === undefined) missingFields.push("buy_price");
  if (body.current_price === undefined) missingFields.push("current_price");
  if (!body.themes) missingFields.push("themes");

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }

  const holding = await prisma.holding.create({
    data: {
      ticker: body.ticker,
      name: body.name ?? null,
      shares: Number(body.shares),
      buy_price: Number(body.buy_price),
      current_price: Number(body.current_price),
      sector: body.sector ?? null,
      country: body.country ?? null,
      themes: body.themes,
      notes: body.notes ?? null
    }
  });

  return NextResponse.json({ data: holding }, { status: 201 });
}
