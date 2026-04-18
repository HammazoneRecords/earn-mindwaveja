import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [claimRes, historyRes] = await Promise.all([
    pool.query(`
      SELECT c.id, c.job_id, c.expires_at, j.title as job_title
      FROM claims c
      JOIN jobs j ON j.id = c.job_id
      WHERE c.user_id = $1 AND c.status = 'active'
      LIMIT 1
    `, [session.userId]),
    pool.query(`
      SELECT s.id, s.submitted_at, s.status, s.quality_score, j.title as job_title
      FROM submissions s
      JOIN jobs j ON j.id = s.job_id
      WHERE s.user_id = $1
      ORDER BY s.submitted_at DESC
      LIMIT 20
    `, [session.userId]),
  ]);

  return NextResponse.json({
    active_claim: claimRes.rows[0] ?? null,
    history: historyRes.rows,
  });
}
