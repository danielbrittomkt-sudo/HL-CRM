import { NextResponse } from "next/server";
import { getClientRows } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ data: getClientRows() });
}
