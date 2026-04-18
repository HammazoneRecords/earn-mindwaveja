"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "@/lib/types";

const tierColors: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#f0a500", diamond: "#7df9ff",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [activeClaim, setActiveClaim] = useState<unknown>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetch("/api/dashboard").then((r) => r.json()).then((d) => {
      setHistory(d.history ?? []);
      setActiveClaim(d.active_claim ?? null);
    });
  }, []);

  if (!user) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>You need to be logged in.</p>
      <Link href="/login" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>Log In</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      {/* Profile header */}
      <div className="card" style={{ padding: 28, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user.display_name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: tierColors[user.tier] ?? "#fff" }}>
              {user.accuracy_score.toFixed(0)}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Accuracy</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: "var(--brand-green)" }}>{user.jobs_completed}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Completed</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: tierColors[user.tier] ?? "#fff", textTransform: "uppercase" }}>
              {user.tier}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Tier</p>
          </div>
        </div>
      </div>

      {/* Active claim */}
      {activeClaim && (
        <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: "rgba(164,207,76,0.4)" }}>
          <p style={{ color: "var(--brand-green)", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Active Job</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontWeight: 600 }}>{(activeClaim as { job_title: string }).job_title}</p>
            <Link
              href={`/jobs/${(activeClaim as { job_id: string }).job_id}`}
              style={{ background: "var(--brand-green)", color: "#0f1117", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
            >
              Continue →
            </Link>
          </div>
        </div>
      )}

      {!activeClaim && (
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/jobs"
            style={{ background: "var(--brand-green)", color: "#0f1117", padding: "10px 22px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 14 }}
          >
            Browse Jobs
          </Link>
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Recent Submissions</h2>
      {history.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No submissions yet. Claim your first job above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(history as { id: string; job_title: string; status: string; quality_score: number; submitted_at: string }[]).map((item) => (
            <div key={item.id} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{item.job_title}</p>
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(item.submitted_at).toLocaleDateString()}</p>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {item.quality_score && <span style={{ color: "var(--brand-green)", fontWeight: 700 }}>{item.quality_score}/100</span>}
                <span style={{
                  fontSize: 12, padding: "3px 10px", borderRadius: 6, fontWeight: 600,
                  background: item.status === "approved" ? "rgba(164,207,76,0.15)" : item.status === "rejected" ? "rgba(236,50,55,0.15)" : "rgba(255,255,255,0.05)",
                  color: item.status === "approved" ? "var(--brand-green)" : item.status === "rejected" ? "var(--brand-red)" : "var(--text-secondary)",
                }}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
