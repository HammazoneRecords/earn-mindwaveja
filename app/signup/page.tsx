"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: "", email: "", password: "", phone: "",
    trn: "", linkedin_url: "", facebook_url: "", instagram_url: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/jobs");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
        Email is all you need to start. Add TRN or social links to move up tiers faster.
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Display Name *</label>
          <input className="input" value={form.display_name} onChange={set("display_name")} required placeholder="What should we call you?" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email *</label>
          <input className="input" type="email" value={form.email} onChange={set("email")} required placeholder="your@email.com" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Password *</label>
          <input className="input" type="password" value={form.password} onChange={set("password")} required minLength={8} placeholder="Min 8 characters" />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Phone (for JMD transfer)</label>
          <input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="876-XXX-XXXX" />
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Trust boosters <span style={{ color: "var(--brand-green)" }}>(optional — speeds up your tier)</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" value={form.trn} onChange={set("trn")} placeholder="TRN number" />
            <input className="input" value={form.linkedin_url} onChange={set("linkedin_url")} placeholder="LinkedIn URL" />
            <input className="input" value={form.facebook_url} onChange={set("facebook_url")} placeholder="Facebook URL" />
            <input className="input" value={form.instagram_url} onChange={set("instagram_url")} placeholder="Instagram URL" />
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Your transcriptions help train AI to understand Caribbean voices and languages — including Patois.
          Your info is used only for identity verification and payout processing.
        </p>

        {error && <p style={{ color: "var(--brand-red)", fontSize: 14 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account & Start Earning"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
        Already have an account? <Link href="/login" style={{ color: "var(--brand-green)" }}>Log in</Link>
      </p>
    </div>
  );
}
