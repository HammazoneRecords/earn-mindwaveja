"use client";

import { useEffect, useState } from "react";

interface QueueItem {
  id: string;
  job_id: string;
  title: string;
  video_url: string;
  display_name: string;
  email: string;
  transcript_text: string;
  participants: { name: string }[];
  submitted_at: string;
  pay_jmd: number;
}

export default function GraderPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<QueueItem | null>(null);
  const [score, setScore] = useState(80);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/grader").then((r) => r.json()).then((d) => {
      setQueue(d.queue ?? []);
      setLoading(false);
    });
  }, []);

  const grade = async (approved: boolean) => {
    if (!active) return;
    setSubmitting(true);
    await fetch("/api/grader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: active.id, quality_score: score, notes, approved }),
    });
    setQueue((q) => q.filter((item) => item.id !== active.id));
    setActive(null);
    setScore(80);
    setNotes("");
    setSubmitting(false);
  };

  if (loading) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading queue...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: active ? "320px 1fr" : "1fr", gap: 24 }}>
      {/* Queue list */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
          Grader Queue <span style={{ color: "var(--brand-red)", fontSize: 16 }}>({queue.length})</span>
        </h1>
        {queue.length === 0 && <p style={{ color: "var(--text-muted)" }}>Queue is empty. Good work.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className="card"
              style={{
                padding: 16, textAlign: "left", cursor: "pointer", border: "none",
                outline: active?.id === item.id ? "2px solid var(--brand-green)" : undefined,
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{item.title}</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>By {item.display_name}</p>
              <p style={{ color: "var(--brand-green)", fontWeight: 700, fontSize: 13, marginTop: 4 }}>J${Number(item.pay_jmd).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Grade panel */}
      {active && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{active.title}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
            By {active.display_name} · {new Date(active.submitted_at).toLocaleString()}
          </p>

          <a href={active.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-green)", fontSize: 13, marginBottom: 16, display: "block" }}>
            ↗ Open original video
          </a>

          {active.participants.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>
              Participants: {active.participants.map((p) => p.name).join(", ")}
            </p>
          )}

          <div className="card" style={{ padding: 16, marginBottom: 20, maxHeight: 340, overflowY: "auto" }}>
            <pre style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.8, color: "var(--text-primary)", whiteSpace: "pre-wrap", margin: 0 }}>
              {active.transcript_text}
            </pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
              Quality Score: <strong style={{ color: "var(--brand-green)" }}>{score}</strong>
            </label>
            <input
              type="range" min={0} max={100} value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Notes (sent to transcriber)</label>
            <textarea
              className="input" value={notes} onChange={(e) => setNotes(e.target.value)}
              style={{ minHeight: 80, resize: "vertical" }}
              placeholder="Optional feedback..."
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" onClick={() => grade(true)} disabled={submitting}>
              ✓ Approve
            </button>
            <button className="btn-danger" onClick={() => grade(false)} disabled={submitting}>
              ✗ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
