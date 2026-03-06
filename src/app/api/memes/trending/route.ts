import { NextResponse } from "next/server";
import { fetchRedditTrending } from "@/lib/sources/reddit";
import { fetchGiphyTrending } from "@/lib/sources/giphy";
import { fetchImgflipTemplates } from "@/lib/sources/imgflip";
import { Meme } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "all";
  const after = searchParams.get("after") || undefined;

  const fetchers: Promise<Meme[]>[] = [];

  if (source === "all" || source === "reddit") {
    fetchers.push(fetchRedditTrending(after).then((r) => r.memes));
  }
  if (source === "all" || source === "giphy") {
    fetchers.push(fetchGiphyTrending());
  }
  if (source === "all" || source === "imgflip") {
    fetchers.push(fetchImgflipTemplates().then((m) => m.slice(0, 20)));
  }

  const settled = await Promise.allSettled(fetchers);
  const results: Meme[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") results.push(...r.value);
  }

  if (source === "all") {
    results.sort(() => Math.random() - 0.5);
  }

  return NextResponse.json({ memes: results });
}
