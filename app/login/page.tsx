"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Log In</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 14 }}>Welcome back.</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Email</label>
          <input className="input" type="email" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Password</label>
          <input className="input" type="password" value={form.password} onChange={set("password")} required />
        </div>
        {error && <p style={{ color: "var(--brand-red)", fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
        No account? <Link href="/signup" style={{ color: "var(--brand-green)" }}>Sign up free</Link>
      </p>
    </div>
  );
}
