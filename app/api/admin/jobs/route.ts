import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { calculatePay } from "@/lib/pay";

// POST — add a new job
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, video_url, platform, duration_secs, reward_type, reward_detail, language_tags } =
    await req.json();

  if (!title || !video_url || !platform || !duration_secs) {
    return NextResponse.json({ error: "title, video_url, platform, duration_secs required" }, { status: 400 });
  }

  const { pay_jmd, addon_enabled, addon_type } = calculatePay(Number(duration_secs));

  const result = await pool.query(
    `INSERT INTO jobs (title, video_url, platform, duration_secs, pay_jmd, reward_type, reward_detail,
                       addon_enabled, addon_type, language_tags, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      title, video_url, platform, duration_secs, pay_jmd,
      reward_type ?? "cash", reward_detail ?? null,
      addon_enabled, addon_type,
      language_tags ?? ["english"],
      session.userId,
    ]
  );

  return NextResponse.json({ ok: true, job: result.rows[0] });
}

// GET — all jobs (admin view)
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query("SELECT * FROM jobs ORDER BY created_at DESC");
  return NextResponse.json({ jobs: result.rows });
}
