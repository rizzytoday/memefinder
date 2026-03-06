import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = "https://www.reddit.com/r/memes/hot.json?limit=3&raw_json=1";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MemeFinder/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      bodyPreview: (await res.text()).slice(0, 500),
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : "unknown",
    });
  }
}
