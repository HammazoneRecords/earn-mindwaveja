import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";
import { sendSubmissionReceived } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { claim_id, transcript, transcript_text, participants, events } = await req.json();

  if (!claim_id || !transcript) {
    return NextResponse.json({ error: "claim_id and transcript required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify claim belongs to user and is still active
    const claimRes = await client.query(
      "SELECT * FROM claims WHERE id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE",
      [claim_id, session.userId]
    );
    if (!claimRes.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Claim not found or already submitted" }, { status: 404 });
    }
    const claim = claimRes.rows[0];

    // Check not expired
    if (new Date() > new Date(claim.expires_at)) {
      await client.query("UPDATE claims SET status = 'expired' WHERE id = $1", [claim_id]);
      await client.query("UPDATE jobs SET status = 'available' WHERE id = $1", [claim.job_id]);
      await client.query("COMMIT");
      return NextResponse.json({ error: "Claim window expired — job returned to pool" }, { status: 410 });
    }

    // Create submission
    const subRes = await client.query(
      `INSERT INTO submissions (claim_id, job_id, user_id, transcript, transcript_text, participants, events)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        claim_id, claim.job_id, session.userId,
        JSON.stringify(transcript), transcript_text ?? "",
        JSON.stringify(participants ?? []),
        JSON.stringify(events ?? []),
      ]
    );

    // Update claim and job status
    await client.query(
      "UPDATE claims SET status = 'submitted', submitted_at = now() WHERE id = $1",
      [claim_id]
    );
    await client.query("UPDATE jobs SET status = 'submitted' WHERE id = $1", [claim.job_id]);

    await client.query("COMMIT");

    // Email (non-blocking)
    const jobRes = await pool.query("SELECT title FROM jobs WHERE id = $1", [claim.job_id]);
    const emailRes = await pool.query("SELECT email FROM users WHERE id = $1", [session.userId]);
    sendSubmissionReceived(emailRes.rows[0].email, jobRes.rows[0].title).catch(console.error);

    return NextResponse.json({ ok: true, submission: subRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
