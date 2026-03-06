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
  const redditAfter = searchParams.get("reddit_after") || undefined;
  const tenorPos = searchParams.get("tenor_pos") || undefined;
  const page = parseInt(searchParams.get("page") || "0");

  const results: Meme[] = [];
  let nextRedditAfter: string | undefined;
  let nextTenorPos: string | undefined;

  const fetchers: Promise<void>[] = [];

  if (source === "all" || source === "reddit") {
    fetchers.push(
      fetchRedditTrending(redditAfter).then((r) => {
        results.push(...r.memes);
        nextRedditAfter = r.after;
      }).catch(() => {})
    );
  }

  // Only include Tenor GIFs on first page for "all", or always for "giphy" tab
  if (source === "giphy" || (source === "all" && page === 0)) {
    fetchers.push(
      fetchGiphyTrending(tenorPos).then((r) => {
        results.push(...r.memes);
        nextTenorPos = r.next;
      }).catch(() => {})
    );
  }

  // Only include Imgflip on first page
  if ((source === "all" || source === "imgflip") && page === 0) {
    fetchers.push(
      fetchImgflipTemplates().then((m) => {
        results.push(...m.slice(0, 20));
      }).catch(() => {})
    );
  }

  await Promise.allSettled(fetchers);

  if (source === "all") {
    results.sort(() => Math.random() - 0.5);
  }

  return NextResponse.json({
    memes: results,
    cursors: {
      reddit_after: nextRedditAfter,
      tenor_pos: nextTenorPos,
    },
  });
}
