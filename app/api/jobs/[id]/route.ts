import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
  if (!result.rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ job: result.rows[0] });
}
