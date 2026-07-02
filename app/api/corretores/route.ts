import { NextResponse } from "next/server";
import { getBrokerRows } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ data: getBrokerRows() });
}
