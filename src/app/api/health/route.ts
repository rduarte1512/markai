import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sessionConfigured = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 24);

  try {
    const sql = getSql();
    await sql`select 1 as connected`;

    return NextResponse.json({
      status: sessionConfigured ? "ok" : "degraded",
      app: "MarkAI",
      database: "connected",
      sessions: sessionConfigured ? "configured" : "missing",
      timestamp: new Date().toISOString(),
    });
  } catch (cause) {
    console.error("Health check database error:", cause);

    return NextResponse.json(
      {
        status: "degraded",
        app: "MarkAI",
        database: process.env.DATABASE_URL ? "connection_failed" : "missing",
        sessions: sessionConfigured ? "configured" : "missing",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
