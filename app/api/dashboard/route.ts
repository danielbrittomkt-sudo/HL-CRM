import { NextResponse } from "next/server";
import { conversionByMonth, folders, funnel, getExecutiveMetrics, heatmap, insights } from "@/lib/data";
import { lgpdNotice } from "@/lib/security";

export async function GET() {
  return NextResponse.json({
    metrics: getExecutiveMetrics(),
    conversionByMonth,
    funnel,
    heatmap,
    folders,
    insights,
    security: lgpdNotice()
  });
}
