"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job } from "@/lib/types";

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function platformBadge(p: string) {
  const map: Record<string, string> = { youtube: "#ff4444", tiktok: "#69c9d0", instagram: "#e1306c", other: "#666" };
  return <span style={{ background: map[p] ?? "#666", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{p}</span>;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ reward: "", platform: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.reward) params.set("reward", filter.reward);
    if (filter.platform) params.set("platform", filter.platform);
    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Available Jobs</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 14 }}>
        Claim a video, transcribe it, get paid. One active job at a time.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.reward}
          onChange={(e) => setFilter((f) => ({ ...f, reward: e.target.value }))}
        >
          <option value="">All rewards</option>
          <option value="cash">Cash (JMD)</option>
          <option value="voucher">Meal Voucher</option>
          <option value="gift_code">Gift Code</option>
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.platform}
          onChange={(e) => setFilter((f) => ({ ...f, platform: e.target.value }))}
        >
          <option value="">All platforms</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Loading jobs...</p>}

      {!loading && jobs.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>No jobs available right now. Check back soon.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {jobs.map((job) => (
          <div key={job.id} className="card" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                {platformBadge(job.platform)}
                {job.language_tags.map((t) => (
                  <span key={t} style={{ fontSize: 11, color: "var(--brand-green)", border: "1px solid var(--brand-green)", padding: "2px 8px", borderRadius: 4 }}>{t}</span>
                ))}
                {job.addon_enabled && (
                  <span style={{ fontSize: 11, color: "var(--brand-gold)", border: "1px solid var(--brand-gold)", padding: "2px 8px", borderRadius: 4 }}>+Bonus reward</span>
                )}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 16 }}>{job.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{fmtDuration(job.duration_secs)}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ color: "var(--brand-green)", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
                {job.reward_type === "cash" ? `$${job.pay_jmd.toLocaleString()}` : job.reward_detail ?? job.reward_type}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 12 }}>
                {job.reward_type === "cash" ? "JMD" : "reward"}
              </p>
              <Link
                href={`/jobs/${job.id}`}
                style={{ background: "var(--brand-green)", color: "#0f1117", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
              >
                View & Claim
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
