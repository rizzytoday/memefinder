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
  const redditAfter = searchParams.get("reddit_after") || undefined;
  const tenorPos = searchParams.get("tenor_pos") || undefined;
  const page = parseInt(searchParams.get("page") || "0");

  if (!q) {
    return NextResponse.json({ memes: [], cursors: {} });
  }

  const memes: Meme[] = [];
  let nextRedditAfter: string | undefined;
  let nextTenorPos: string | undefined;

  const fetchers: Promise<void>[] = [];

  if (source === "all" || source === "reddit") {
    fetchers.push(
      searchReddit(q, redditAfter).then((r) => {
        memes.push(...r.memes);
        nextRedditAfter = r.after;
      }).catch(() => {})
    );
  }

  if (source === "all" || source === "giphy") {
    fetchers.push(
      searchGiphy(q, tenorPos).then((r) => {
        memes.push(...r.memes);
        nextTenorPos = r.next;
      }).catch(() => {})
    );
  }

  // Imgflip only on first page (no pagination)
  if ((source === "all" || source === "imgflip") && page === 0) {
    fetchers.push(
      searchImgflip(q).then((m) => {
        memes.push(...m);
      }).catch(() => {})
    );
  }

  await Promise.allSettled(fetchers);

  // Reddit results first (they have scores/relevance), then GIFs
  memes.sort((a, b) => (b.score || 0) - (a.score || 0));

  return NextResponse.json({
    memes,
    cursors: {
      reddit_after: nextRedditAfter,
      tenor_pos: nextTenorPos,
    },
  });
}
