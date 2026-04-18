"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      style={{
        color: path === href ? "var(--brand-green)" : "var(--text-secondary)",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {label}
    </Link>
  );

  return (
    <nav
      style={{
        height: 60,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 50,
      }}
    >
      <Link href="/" style={{ color: "var(--brand-green)", fontWeight: 800, fontSize: 18, textDecoration: "none" }}>
        earn<span style={{ color: "var(--text-secondary)" }}>.mindwaveja</span>
      </Link>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {link("/jobs", "Jobs")}
        {link("/standings", "Standings")}
        {link("/dashboard", "Dashboard")}
        <Link
          href="/signup"
          style={{
            background: "var(--brand-green)",
            color: "#0f1117",
            padding: "6px 16px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
