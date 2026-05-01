import { unstable_cache } from "next/cache";

export interface PUSDCirculation {
  /** Total PUSD in circulation (human-readable, e.g. 12_500_000.0) */
  circulation: number;
  /** ISO timestamp of when the figure was last updated by Palm USD */
  updatedAt: string | null;
  /** Raw response payload — kept so we can display whatever the API returns */
  raw: Record<string, unknown>;
}

async function _fetchPUSDCirculation(): Promise<PUSDCirculation> {
  const res = await fetch(`${process.env.PALM_USD_API_BASE ?? "https://api.palmusd.com/v1"}/circulation`, {
    headers: { Accept: "application/json" },
    // Let unstable_cache handle revalidation; skip Next.js fetch cache here
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Palm USD API responded with ${res.status}`);
  }

  const json = await res.json();

  // Normalise the payload — the API may use any of these field names
  const circulation =
    typeof json.circulation === "number"
      ? json.circulation
      : typeof json.total === "number"
      ? json.total
      : typeof json.totalSupply === "number"
      ? json.totalSupply
      : typeof json.amount === "number"
      ? json.amount
      : null;

  if (circulation === null) {
    throw new Error("Unexpected Palm USD API response shape");
  }

  const updatedAt: string | null =
    json.updatedAt ?? json.updated_at ?? json.timestamp ?? null;

  return { circulation, updatedAt, raw: json as Record<string, unknown> };
}

/**
 * Fetch PUSD circulation supply from the Palm USD API.
 * Results are cached for 5 minutes server-side via unstable_cache.
 */
export const fetchPUSDCirculation = unstable_cache(
  _fetchPUSDCirculation,
  ["pusd-circulation"],
  { revalidate: 300 } // 5 minutes
);
