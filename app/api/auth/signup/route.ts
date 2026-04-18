import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password, display_name, phone, trn, linkedin_url, facebook_url, instagram_url } =
    await req.json();

  if (!email || !password || !display_name) {
    return NextResponse.json({ error: "email, password and display_name required" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, phone, trn, linkedin_url, facebook_url, instagram_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, display_name, tier`,
      [email.toLowerCase().trim(), hash, display_name, phone ?? null, trn ?? null,
       linkedin_url ?? null, facebook_url ?? null, instagram_url ?? null]
    );

    const user = result.rows[0];
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = user.id;
    session.email = user.email;
    session.tier = user.tier;
    session.isGrader = false;
    session.isAdmin = false;
    await session.save();

    return NextResponse.json({ ok: true, user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
