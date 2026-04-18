import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { getDailyCap } from "@/lib/pay";
import { sendClaimConfirmed } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check job is still available
    const jobRes = await client.query(
      "SELECT * FROM jobs WHERE id = $1 AND status = 'available' FOR UPDATE",
      [jobId]
    );
    if (!jobRes.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Job not available" }, { status: 409 });
    }
    const job = jobRes.rows[0];

    // Check user has no active claim
    const activeRes = await client.query(
      "SELECT id FROM claims WHERE user_id = $1 AND status = 'active'",
      [session.userId]
    );
    if (activeRes.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "You already have an active claim. Submit it first." }, { status: 409 });
    }

    // Daily cap for bronze users
    const userRes = await client.query(
      "SELECT tier, daily_job_count, daily_reset_at FROM users WHERE id = $1",
      [session.userId]
    );
    const user = userRes.rows[0];
    const cap = getDailyCap(user.tier);
    const now = new Date();
    const resetAt = user.daily_reset_at ? new Date(user.daily_reset_at) : null;
    const count = resetAt && now < resetAt ? user.daily_job_count : 0;

    if (count >= cap) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `Daily limit reached (${cap} jobs/day for ${user.tier} tier)` }, { status: 429 });
    }

    // Claim window: 24h short videos, 48h long
    const hours = job.duration_secs > 40 * 60 ? 48 : 24;
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const claimRes = await client.query(
      `INSERT INTO claims (job_id, user_id, expires_at) VALUES ($1, $2, $3) RETURNING *`,
      [jobId, session.userId, expiresAt]
    );

    // Mark job as claimed
    await client.query("UPDATE jobs SET status = 'claimed' WHERE id = $1", [jobId]);

    // Update daily count
    const nextReset = new Date(now);
    nextReset.setHours(23, 59, 59, 999);
    await client.query(
      "UPDATE users SET daily_job_count = $1, daily_reset_at = $2 WHERE id = $3",
      [count + 1, resetAt && now < resetAt ? resetAt : nextReset, session.userId]
    );

    await client.query("COMMIT");

    // Send email (non-blocking)
    const emailRes = await pool.query("SELECT email FROM users WHERE id = $1", [session.userId]);
    sendClaimConfirmed(emailRes.rows[0].email, job.title, expiresAt).catch(console.error);

    return NextResponse.json({ ok: true, claim: claimRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Failed to claim job" }, { status: 500 });
  } finally {
    client.release();
  }
}
