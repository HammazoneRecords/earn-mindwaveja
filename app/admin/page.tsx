"use client";

import { useEffect, useState } from "react";
import { Job } from "@/lib/types";

const PLATFORMS = ["youtube", "tiktok", "instagram", "other"];
const REWARD_TYPES = ["cash", "voucher", "gift_code"];

export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({
    title: "", video_url: "", platform: "youtube",
    duration_secs: "", reward_type: "cash", reward_detail: "",
    language_tags: "patois,english",
  });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/admin/jobs").then((r) => r.json()).then((d) => setJobs(d.jobs ?? []));

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setMsg("");
    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duration_secs: Number(form.duration_secs),
        language_tags: form.language_tags.split(",").map((t) => t.trim()),
      }),
    });
    const data = await res.json();
    if (res.ok) { setMsg("Job added."); load(); }
    else setMsg(data.error);
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Admin — Job Pool</h1>

      {/* Add job form */}
      <div className="card" style={{ padding: 24, marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Add New Job</h2>
        <form onSubmit={addJob} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Title *</label>
            <input className="input" value={form.title} onChange={set("title")} required placeholder="Describe the video briefly" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Video URL *</label>
            <input className="input" value={form.video_url} onChange={set("video_url")} required placeholder="https://..." />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Platform *</label>
            <select className="input" value={form.platform} onChange={set("platform")}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Duration (seconds) *</label>
            <input className="input" type="number" value={form.duration_secs} onChange={set("duration_secs")} required placeholder="e.g. 480 = 8 min" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Reward Type</label>
            <select className="input" value={form.reward_type} onChange={set("reward_type")}>
              {REWARD_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Reward Detail</label>
            <input className="input" value={form.reward_detail} onChange={set("reward_detail")} placeholder="e.g. KFC Meal Voucher" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Language Tags (comma separated)</label>
            <input className="input" value={form.language_tags} onChange={set("language_tags")} placeholder="patois,english" />
          </div>
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn-primary" type="submit" disabled={adding}>{adding ? "Adding..." : "Add Job"}</button>
            {msg && <span style={{ fontSize: 13, color: msg === "Job added." ? "var(--brand-green)" : "var(--brand-red)" }}>{msg}</span>}
          </div>
        </form>
      </div>

      {/* Jobs table */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>All Jobs ({jobs.length})</h2>
      <div className="card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {["Title", "Platform", "Duration", "Pay", "Status", "Reward"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px 16px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{job.platform}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{Math.floor(job.duration_secs / 60)}m</td>
                <td style={{ padding: "12px 16px", color: "var(--brand-green)", fontWeight: 700 }}>J${Number(job.pay_jmd).toLocaleString()}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 4, fontWeight: 600,
                    background: job.status === "available" ? "rgba(164,207,76,0.15)" : "rgba(255,255,255,0.05)",
                    color: job.status === "available" ? "var(--brand-green)" : "var(--text-secondary)",
                  }}>
                    {job.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{job.reward_detail ?? job.reward_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
