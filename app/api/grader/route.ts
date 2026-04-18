import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { calculateSpeedScore, compositeScore } from "@/lib/pay";
import { sendGradeResult, sendPaymentProof } from "@/lib/email";

// GET — grader queue
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isGrader && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await pool.query(`
    SELECT s.id, s.job_id, s.user_id, s.transcript_text, s.participants, s.events,
           s.submitted_at, s.status,
           j.title, j.video_url, j.pay_jmd, j.reward_type, j.reward_detail,
           j.addon_enabled, j.addon_type,
           u.display_name, u.email
    FROM submissions s
    JOIN jobs j ON j.id = s.job_id
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'pending'
    ORDER BY s.submitted_at ASC
  `);

  return NextResponse.json({ queue: result.rows });
}

// POST — submit grade
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isGrader && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submission_id, quality_score, notes, approved } = await req.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const subRes = await client.query(
      "SELECT * FROM submissions WHERE id = $1 FOR UPDATE",
      [submission_id]
    );
    const sub = subRes.rows[0];
    if (!sub) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const status = approved ? "approved" : "rejected";

    // Update submission
    await client.query(
      `UPDATE submissions
       SET quality_score = $1, grader_notes = $2, graded_at = now(),
           status = $3, grader_id = $4
       WHERE id = $5`,
      [quality_score, notes ?? null, status, session.userId, submission_id]
    );

    // Update job status
    await client.query("UPDATE jobs SET status = $1 WHERE id = $2", [status, sub.job_id]);

    if (approved) {
      // Calculate speed score from claim
      const claimRes = await client.query(
        "SELECT claimed_at, expires_at FROM claims WHERE id = $1",
        [sub.claim_id]
      );
      const claim = claimRes.rows[0];
      const speed = calculateSpeedScore(
        new Date(claim.claimed_at),
        new Date(sub.submitted_at),
        new Date(claim.expires_at)
      );
      const composite = compositeScore(quality_score, speed);

      // Write rating
      await client.query(
        `INSERT INTO ratings (user_id, submission_id, quality_score, speed_score, composite_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [sub.user_id, submission_id, quality_score, speed, composite]
      );

      // Update user accuracy rolling average and jobs_completed
      await client.query(`
        UPDATE users SET
          jobs_completed = jobs_completed + 1,
          accuracy_score = (accuracy_score * jobs_completed + $1) / (jobs_completed + 1)
        WHERE id = $2`,
        [quality_score, sub.user_id]
      );

      // Create payment record
      const jobRes = await client.query(
        "SELECT pay_jmd, reward_type, reward_detail FROM jobs WHERE id = $1",
        [sub.job_id]
      );
      const job = jobRes.rows[0];
      const emailRes = await client.query("SELECT email FROM users WHERE id = $1", [sub.user_id]);

      await client.query(
        `INSERT INTO payments (user_id, submission_id, amount_jmd, reward_type, reward_detail, proof_email, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [sub.user_id, submission_id, job.pay_jmd, job.reward_type, job.reward_detail, emailRes.rows[0].email]
      );
    }

    await client.query("COMMIT");

    // Emails (non-blocking)
    const userData = await pool.query("SELECT email FROM users WHERE id = $1", [sub.user_id]);
    const jobData = await pool.query("SELECT title FROM jobs WHERE id = $1", [sub.job_id]);
    sendGradeResult(userData.rows[0].email, jobData.rows[0].title, approved, notes).catch(console.error);

    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
