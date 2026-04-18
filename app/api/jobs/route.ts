import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/jobs — list available jobs with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reward = searchParams.get("reward"); // cash | voucher | gift_code
  const platform = searchParams.get("platform");
  const maxDuration = searchParams.get("max_duration"); // seconds

  const topic = searchParams.get("topic");
  const priority = searchParams.get("priority");

  let query = `
    SELECT id, title, platform, duration_secs, pay_jmd, reward_type, reward_detail,
           addon_enabled, addon_type, language_tags, topic, priority, status, created_at
    FROM jobs
    WHERE status = 'available'
  `;
  const params: (string | number)[] = [];
  let i = 1;

  if (reward) { query += ` AND reward_type = $${i++}`; params.push(reward); }
  if (platform) { query += ` AND platform = $${i++}`; params.push(platform); }
  if (maxDuration) { query += ` AND duration_secs <= $${i++}`; params.push(Number(maxDuration)); }
  if (topic) { query += ` AND topic = $${i++}`; params.push(topic); }
  if (priority) { query += ` AND priority = $${i++}`; params.push(Number(priority)); }

  // Sort: priority asc (1=high first), then newest
  query += " ORDER BY priority ASC, created_at DESC";

  const result = await pool.query(query, params);
  return NextResponse.json({ jobs: result.rows });
}
