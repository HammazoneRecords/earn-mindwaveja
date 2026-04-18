"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Job, Participant, EventMarker, TranscriptSegment, User } from "@/lib/types";

// ─── Timestamp helpers ────────────────────────────────────────────────────────
function fmtTs(secs: number, fmt: "short" | "long") {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return fmt === "long"
    ? `${m}:${s.toFixed(1).padStart(4, "0")}`
    : `${m}:${String(Math.floor(s)).padStart(2, "0")}`;
}

// ─── Participant panel ────────────────────────────────────────────────────────
function ParticipantPanel({
  participants, events,
  onAddParticipant, onAddEvent, onInsert,
}: {
  participants: Participant[];
  events: EventMarker[];
  onAddParticipant: (name: string) => void;
  onAddEvent: (label: string) => void;
  onInsert: (text: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newEvent, setNewEvent] = useState("");

  return (
    <div className="card" style={{ padding: 16, width: 220, flexShrink: 0 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        Participants
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {participants.map((p) => (
          <button
            key={p.name}
            onClick={() => onInsert(`[${p.name}]: `)}
            style={{
              background: "var(--bg-input)", border: "1px solid var(--border)",
              color: "var(--text-primary)", borderRadius: 6, padding: "6px 10px",
              fontSize: 13, cursor: "pointer", textAlign: "left", fontWeight: 500,
            }}
          >
            {p.name}
          </button>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="input" value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Add person..." style={{ fontSize: 12, padding: "6px 10px" }}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) { onAddParticipant(newName.trim()); setNewName(""); } }}
          />
        </div>
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
        Events
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {/* Default events */}
        {["laughter", "crosstalk", "music playing", "background noise"].map((ev) => (
          <button
            key={ev}
            onClick={() => onInsert(`[${ev}] `)}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-secondary)", borderRadius: 6, padding: "5px 10px",
              fontSize: 12, cursor: "pointer", textAlign: "left",
            }}
          >
            [{ev}]
          </button>
        ))}
        {events.filter((ev) => !["laughter","crosstalk","music playing","background noise"].includes(ev.label)).map((ev) => (
          <button
            key={ev.label}
            onClick={() => onInsert(`[${ev.label}] `)}
            style={{
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--text-secondary)", borderRadius: 6, padding: "5px 10px",
              fontSize: 12, cursor: "pointer", textAlign: "left",
            }}
          >
            [{ev.label}]
          </button>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="input" value={newEvent} onChange={(e) => setNewEvent(e.target.value)}
            placeholder="Custom event..." style={{ fontSize: 12, padding: "6px 10px" }}
            onKeyDown={(e) => { if (e.key === "Enter" && newEvent.trim()) { onAddEvent(newEvent.trim()); setNewEvent(""); } }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function JobEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [claim, setClaim] = useState<{ id: string; expires_at: string } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<EventMarker[]>([]);
  const [text, setText] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);

  // Timestamp display prefs (from user, default inline+short)
  const tsDisplay = user?.ts_display ?? "inline";
  const tsFormat = user?.ts_format ?? "short";

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then((r) => r.json()).then((d) => setJob(d.job));
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user));
  }, [id]);

  // Insert text at cursor
  const insertAtCursor = (insert: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = text.slice(0, start) + insert + text.slice(end);
    setText(newVal);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + insert.length, start + insert.length);
    }, 0);
  };

  const addTimestamp = () => {
    if (tsDisplay === "hidden") return;
    // Use video current time if available (future: wire to embedded player)
    const ts = `[${fmtTs(0, tsFormat)}] `;
    insertAtCursor(ts);
  };

  const claimJob = async () => {
    if (!user) { router.push("/login"); return; }
    setClaiming(true); setError("");
    const res = await fetch(`/api/jobs/${id}/claim`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setClaiming(false); return; }
    setClaim(data.claim);
    setClaiming(false);
  };

  const submit = async () => {
    if (!claim) return;
    setSubmitting(true); setError("");

    // Build segments from raw text (simple: one segment per line that has a timestamp)
    const lines = text.split("\n").filter(Boolean);
    const segments: TranscriptSegment[] = lines.map((line, i) => ({
      ts_start: `0:${i * 4}`,
      ts_end: `0:${(i + 1) * 4}`,
      speaker: null,
      text: line,
      gaps: [],
    }));

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claim_id: claim.id,
        transcript: segments,
        transcript_text: text,
        participants,
        events,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    router.push("/dashboard");
  };

  if (!job) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading...</div>;

  const timeLeft = claim
    ? Math.max(0, Math.floor((new Date(claim.expires_at).getTime() - Date.now()) / 1000 / 60))
    : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{job.title}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{job.platform}</span>
          <span style={{ color: "var(--brand-green)", fontWeight: 700 }}>
            {job.reward_type === "cash" ? `J$${job.pay_jmd.toLocaleString()}` : job.reward_detail ?? job.reward_type}
          </span>
          {claim && timeLeft !== null && (
            <span style={{ color: timeLeft < 60 ? "var(--brand-red)" : "var(--text-secondary)", fontSize: 13 }}>
              ⏱ {timeLeft}m remaining
            </span>
          )}
        </div>
      </div>

      {/* Video embed */}
      <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", background: "#000", aspectRatio: "16/9", maxHeight: 360 }}>
        {job.platform === "youtube" ? (
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(job.video_url)}`}
            style={{ width: "100%", height: "100%", border: "none" }}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
            <a href={job.video_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-green)" }}>
              Open video in new tab ↗
            </a>
          </div>
        )}
      </div>

      {/* Claim or editor */}
      {!claim ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
            Claim this job to start transcribing. You'll have {job.duration_secs > 40 * 60 ? "48" : "24"} hours to submit.
          </p>
          {error && <p style={{ color: "var(--brand-red)", marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" onClick={claimJob} disabled={claiming}>
            {claiming ? "Claiming..." : "Claim This Job"}
          </button>
        </div>
      ) : (
        <div>
          {/* Timestamp preferences */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Timestamps:</span>
            {["inline", "margin", "hidden"].map((opt) => (
              <button
                key={opt}
                onClick={async () => {
                  if (!user) return;
                  await fetch("/api/auth/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ts_display: opt }),
                  });
                  setUser((u) => u ? { ...u, ts_display: opt as "inline" | "margin" | "hidden" } : u);
                }}
                style={{
                  fontSize: 12, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                  background: tsDisplay === opt ? "var(--brand-green)" : "var(--bg-input)",
                  color: tsDisplay === opt ? "#0f1117" : "var(--text-secondary)",
                  border: "1px solid var(--border)", fontWeight: 600,
                }}
              >
                {opt}
              </button>
            ))}
            <button
              onClick={addTimestamp}
              title="Insert timestamp at cursor"
              style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                background: "var(--bg-input)", color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              + Timestamp
            </button>
            <button
              onClick={() => setPanelOpen((v) => !v)}
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, cursor: "pointer", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              {panelOpen ? "Hide panel" : "Show panel"}
            </button>
          </div>

          {/* Editor + panel */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input"
                style={{
                  minHeight: 380, resize: "vertical", fontFamily: "monospace",
                  fontSize: 14, lineHeight: 1.7, padding: 16,
                }}
                placeholder={`Start typing your transcription here.\n\nUse the panel on the right to insert speaker names and events.\nClick "+ Timestamp" to mark the current video position.\n\nPatois and English — write exactly what you hear.`}
              />
            </div>
            {panelOpen && (
              <ParticipantPanel
                participants={participants}
                events={events}
                onAddParticipant={(name) => setParticipants((p) => [...p, { name }])}
                onAddEvent={(label) => setEvents((ev) => [...ev, { label }])}
                onInsert={insertAtCursor}
              />
            )}
          </div>

          {error && <p style={{ color: "var(--brand-red)", marginTop: 12 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn-primary" onClick={submit} disabled={submitting || !text.trim()}>
              {submitting ? "Submitting..." : "Submit Transcription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? "";
}
