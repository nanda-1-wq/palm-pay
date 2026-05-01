import { NextResponse } from "next/server";
import { fetchPUSDCirculation } from "@/lib/palm-api";

export async function GET() {
  try {
    const data = await fetchPUSDCirculation();
    return NextResponse.json(
      { ok: true, ...data },
      {
        headers: {
          // Allow the browser to cache for 5 min too — aligns with server cache
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[/api/reserves] failed to fetch Palm USD API:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Reserve data temporarily unavailable",
      },
      { status: 503 }
    );
  }
}
