import Link from "next/link";

const steps = [
  { n: "1", title: "Sign Up", desc: "Email only — or add TRN, ID, or social for a faster trust boost." },
  { n: "2", title: "Pick a Video", desc: "Browse YouTube, TikTok, and IG clips. Choose your length and reward type." },
  { n: "3", title: "Transcribe", desc: "Watch the video, type what you hear — Patois and English. Use the speaker panel for fast tagging." },
  { n: "4", title: "Get Paid", desc: "Graded within 3 days. Cash, meal vouchers, gift codes, data top-ups." },
];

const rates = [
  { label: "Under 3 min", pay: "$200" },
  { label: "3 – 10 min", pay: "$500" },
  { label: "10 – 20 min", pay: "$900" },
  { label: "20 – 45 min", pay: "$1,380" },
  { label: "45 – 70 min", pay: "$3,500" },
];

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <p style={{ color: "var(--brand-green)", fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase", marginBottom: 16 }}>
          MindWave Earn Program
        </p>
        <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          Transcribe.<br />
          <span style={{ color: "var(--brand-green)" }}>Earn Real JMD.</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 18, maxWidth: 520, margin: "0 auto 32px" }}>
          Get paid to transcribe Caribbean videos. Your work trains AI to understand Patois and English — you&apos;re not just earning, you&apos;re building something real.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
            Start Earning
          </Link>
          <Link href="/jobs" style={{ color: "var(--text-secondary)", padding: "10px 22px", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none", fontSize: 14 }}>
            Browse Jobs
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: "center" }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: 24, position: "relative" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--brand-red)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14, marginBottom: 12,
              }}>{s.n}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{s.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pay rates */}
      <div style={{ marginBottom: 80 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>Pay Rates (JMD)</h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: 32, fontSize: 14 }}>
          Next tier starts 30 seconds past the boundary. Videos over 40 min earn a bonus reward on top.
        </p>
        <div className="card" style={{ overflow: "hidden" }}>
          {rates.map((r, i) => (
            <div key={r.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 24px",
              borderBottom: i < rates.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.label}</span>
              <span style={{ color: "var(--brand-green)", fontWeight: 800, fontSize: 20 }}>{r.pay}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI disclosure */}
      <div className="card" style={{ padding: 32, textAlign: "center", borderColor: "rgba(164,207,76,0.3)" }}>
        <p style={{ color: "var(--brand-green)", fontWeight: 700, marginBottom: 8 }}>Part of Something Bigger</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 560, margin: "0 auto" }}>
          Your transcriptions contribute to building AI that understands Caribbean voices and languages — including Patois.
          You&apos;re not just earning; you&apos;re part of a movement to make sure the Caribbean is represented in the future of AI.
        </p>
      </div>
    </div>
  );
}
