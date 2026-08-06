import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", app: "MarkAI", timestamp: new Date().toISOString() });
}
