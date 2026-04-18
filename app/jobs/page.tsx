"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job } from "@/lib/types";

const TOPICS = [
  "Culture & Lifestyle",
  "Music & Entertainment",
  "News & Current Affairs",
  "Business & Finance",
  "Sports",
  "Food & Cooking",
  "Comedy",
  "Education",
  "Politics",
  "Religion & Spirituality",
  "General",
];

const PRIORITY_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: "High Priority", color: "#ec3237", desc: "Critical for dataset — rare Patois, unique speakers" },
  2: { label: "Medium Priority", color: "#f0a500", desc: "Good dataset value" },
  3: { label: "Low Priority", color: "#4a5168", desc: "Standard content" },
};

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function platformBadge(p: string) {
  const map: Record<string, string> = {
    youtube: "#ff4444", tiktok: "#69c9d0", instagram: "#e1306c", other: "#666",
  };
  return (
    <span style={{ background: map[p] ?? "#666", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, textTransform: "capitalize" }}>
      {p}
    </span>
  );
}

function priorityDot(p: 1 | 2 | 3) {
  const c = PRIORITY_LABELS[p]?.color ?? "#666";
  return <span title={PRIORITY_LABELS[p]?.desc} style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, marginRight: 6 }} />;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState("");
  const [filter, setFilter] = useState({ priority: "", maxDuration: "", reward: "" });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTopic) params.set("topic", activeTopic);
    if (filter.priority) params.set("priority", filter.priority);
    if (filter.maxDuration) params.set("max_duration", filter.maxDuration);
    if (filter.reward) params.set("reward", filter.reward);

    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .finally(() => setLoading(false));
  }, [activeTopic, filter]);

  // Group jobs by topic
  const grouped = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    const t = job.topic ?? "General";
    acc[t] = acc[t] ? [...acc[t], job] : [job];
    return acc;
  }, {});

  const setF = (k: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilter((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Available Jobs</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 14 }}>
        Claim a video, transcribe it, get paid. One active job at a time.
      </p>

      {/* Topic tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => setActiveTopic("")}
          style={{
            padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
            background: activeTopic === "" ? "var(--brand-green)" : "transparent",
            color: activeTopic === "" ? "#0f1117" : "var(--text-secondary)",
          }}
        >
          All Topics
        </button>
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTopic(t === activeTopic ? "" : t)}
            style={{
              padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
              background: activeTopic === t ? "var(--brand-green)" : "transparent",
              color: activeTopic === t ? "#0f1117" : "var(--text-secondary)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
        <select className="input" style={{ width: "auto", fontSize: 13 }} value={filter.priority} onChange={setF("priority")}>
          <option value="">All priorities</option>
          <option value="1">🔴 High priority</option>
          <option value="2">🟡 Medium priority</option>
          <option value="3">⚫ Low priority</option>
        </select>
        <select className="input" style={{ width: "auto", fontSize: 13 }} value={filter.maxDuration} onChange={setF("maxDuration")}>
          <option value="">Any length</option>
          <option value="180">Under 3 min</option>
          <option value="600">Under 10 min</option>
          <option value="1200">Under 20 min</option>
          <option value="2700">Under 45 min</option>
        </select>
        <select className="input" style={{ width: "auto", fontSize: 13 }} value={filter.reward} onChange={setF("reward")}>
          <option value="">All rewards</option>
          <option value="cash">Cash (JMD)</option>
          <option value="voucher">Meal Voucher</option>
          <option value="gift_code">Gift Code</option>
        </select>
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Loading jobs...</p>}

      {!loading && jobs.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>No jobs available for this filter. Check back soon or try a different topic.</p>
        </div>
      )}

      {/* Grouped by topic */}
      {!loading && Object.entries(grouped).map(([topic, topicJobs]) => (
        <div key={topic} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{topic}</h2>
            <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "2px 10px", borderRadius: 999 }}>
              {topicJobs.length} job{topicJobs.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topicJobs.map((job) => (
              <div
                key={job.id}
                className="card"
                style={{
                  padding: "18px 22px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  gap: 16, flexWrap: "wrap",
                  borderLeft: `3px solid ${PRIORITY_LABELS[job.priority]?.color ?? "var(--border)"}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    {platformBadge(job.platform)}
                    {job.language_tags.map((t) => (
                      <span key={t} style={{ fontSize: 11, color: "var(--brand-green)", border: "1px solid var(--brand-green)", padding: "2px 7px", borderRadius: 4 }}>
                        {t}
                      </span>
                    ))}
                    {job.addon_enabled && (
                      <span style={{ fontSize: 11, color: "var(--brand-gold)", border: "1px solid var(--brand-gold)", padding: "2px 7px", borderRadius: 4 }}>
                        +Bonus reward
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDuration(job.duration_secs)}</span>
                    <span style={{ fontSize: 12, color: PRIORITY_LABELS[job.priority]?.color, fontWeight: 600 }}>
                      {priorityDot(job.priority)}{PRIORITY_LABELS[job.priority]?.label}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "var(--brand-green)", fontWeight: 800, fontSize: 20, marginBottom: 2 }}>
                    {job.reward_type === "cash" ? `$${job.pay_jmd.toLocaleString()}` : job.reward_detail ?? job.reward_type}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 10 }}>
                    {job.reward_type === "cash" ? "JMD" : "reward"}
                  </p>
                  <Link
                    href={`/jobs/${job.id}`}
                    style={{ background: "var(--brand-green)", color: "#0f1117", padding: "7px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}
                  >
                    View & Claim
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
