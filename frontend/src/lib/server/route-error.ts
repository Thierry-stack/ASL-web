import { NextResponse } from "next/server";

export function handleRouteError(err: unknown): NextResponse {
  console.error(err);
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2021") {
      return NextResponse.json(
        { error: "Database tables are missing. Run: npx prisma db push" },
        { status: 503 },
      );
    }
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
