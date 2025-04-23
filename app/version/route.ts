export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    app_name: process.env.APP_NAME || "unknown",
    app_version: process.env.APP_VERSION || "unknown",
    commit_sha: process.env.COMMIT_SHA || "unknown",
  });
}
