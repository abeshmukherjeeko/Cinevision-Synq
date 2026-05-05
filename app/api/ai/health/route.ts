import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  return NextResponse.json({
    keyConfigured: key.startsWith("sk-ant-") && key.length > 20,
  });
}
