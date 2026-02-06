import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function parseId(param: string) {
  const id = Number(param);
  return Number.isNaN(id) ? null : id;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const holding = await prisma.holding.findUnique({ where: { id } });

  if (!holding) {
    return NextResponse.json({ error: "Holding not found" }, { status: 404 });
  }

  return NextResponse.json({ data: holding });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();

  const holding = await prisma.holding.update({
    where: { id },
    data: {
      ticker: body.ticker,
      name: body.name ?? null,
      shares: body.shares !== undefined ? Number(body.shares) : undefined,
      buy_price:
        body.buy_price !== undefined ? Number(body.buy_price) : undefined,
      current_price:
        body.current_price !== undefined
          ? Number(body.current_price)
          : undefined,
      sector: body.sector ?? null,
      country: body.country ?? null,
      themes: body.themes,
      notes: body.notes ?? null
    }
  });

  return NextResponse.json({ data: holding });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.holding.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
