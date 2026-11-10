import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/swagger";
import { swaggerEnabled } from "@/lib/swagger-enabled";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!swaggerEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
