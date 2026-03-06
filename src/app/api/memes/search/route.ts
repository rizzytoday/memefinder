import { NextResponse } from "next/server";
import { searchReddit } from "@/lib/sources/reddit";
import { searchGiphy } from "@/lib/sources/giphy";
import { searchImgflip } from "@/lib/sources/imgflip";
import { Meme } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const source = searchParams.get("source") || "all";

  if (!q) {
    return NextResponse.json({ memes: [] });
  }

  const fetchers: Promise<Meme[]>[] = [];

  if (source === "all" || source === "reddit") {
    fetchers.push(searchReddit(q));
  }
  if (source === "all" || source === "giphy") {
    fetchers.push(searchGiphy(q));
  }
  if (source === "all" || source === "imgflip") {
    fetchers.push(searchImgflip(q));
  }

  // Use allSettled so one failing source doesn't block others
  const results = await Promise.allSettled(fetchers);
  const memes: Meme[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      memes.push(...r.value);
    }
  }

  memes.sort((a, b) => (b.score || 0) - (a.score || 0));

  return NextResponse.json({ memes });
}
