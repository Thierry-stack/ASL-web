import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
