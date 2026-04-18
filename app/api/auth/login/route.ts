import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const result = await pool.query(
    "SELECT id, email, password_hash, tier, display_name FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );

  const user = result.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = user.id;
  session.email = user.email;
  session.tier = user.tier;
  session.isGrader = user.is_grader ?? false;
  session.isAdmin = user.is_admin ?? false;
  await session.save();

  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, tier: user.tier, display_name: user.display_name } });
}
