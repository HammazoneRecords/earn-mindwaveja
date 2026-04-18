import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ user: null });
  }

  const result = await pool.query(
    `SELECT id, email, display_name, phone, tier, accuracy_score, jobs_completed,
            ts_display, ts_format, show_on_leaderboard
     FROM users WHERE id = $1`,
    [session.userId]
  );

  return NextResponse.json({ user: result.rows[0] ?? null });
}
