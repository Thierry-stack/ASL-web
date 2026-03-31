import { NextResponse } from "next/server";
import { publicAppUrl } from "@/lib/server/public-app-url";

export const runtime = "nodejs";

export async function GET() {
  const base = publicAppUrl();
  return NextResponse.redirect(`${base}/donate?momo=return`, 302);
}
