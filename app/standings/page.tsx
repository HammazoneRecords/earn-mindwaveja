export const dynamic = 'force-dynamic';

import pool from "@/lib/db";
import { LeaderboardEntry, Tier } from "@/lib/types";

const tierColors: Record<Tier, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#f0a500", diamond: "#7df9ff",
};

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await pool.query(`
    SELECT display_name, tier, accuracy_score, jobs_completed
    FROM users
    WHERE show_on_leaderboard = true AND jobs_completed > 0
    ORDER BY accuracy_score DESC, jobs_completed DESC
    LIMIT 50
  `);
  return result.rows;
}

export default async function StandingsPage() {
  const board = await getLeaderboard();

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Standings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
        Top transcribers ranked by accuracy score. Opt out in your profile settings.
      </p>

      {board.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No standings yet — be the first to complete a job.</p>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 100px 80px 80px", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>#</span><span>Name</span><span>Tier</span><span style={{ textAlign: "right" }}>Accuracy</span><span style={{ textAlign: "right" }}>Jobs</span>
          </div>
          {board.map((entry, i) => (
            <div
              key={`${entry.display_name}-${i}`}
              style={{
                display: "grid", gridTemplateColumns: "40px 1fr 100px 80px 80px",
                padding: "14px 20px", borderBottom: i < board.length - 1 ? "1px solid var(--border)" : "none",
                background: i < 3 ? "rgba(255,255,255,0.02)" : "transparent",
                alignItems: "center",
              }}
            >
              <span style={{ color: i < 3 ? "var(--brand-gold)" : "var(--text-muted)", fontWeight: i < 3 ? 800 : 400 }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <span style={{ fontWeight: 600 }}>{entry.display_name}</span>
              <span style={{ color: tierColors[entry.tier] ?? "#fff", fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>
                {entry.tier}
              </span>
              <span style={{ textAlign: "right", color: "var(--brand-green)", fontWeight: 700 }}>
                {Number(entry.accuracy_score).toFixed(0)}
              </span>
              <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                {entry.jobs_completed}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
