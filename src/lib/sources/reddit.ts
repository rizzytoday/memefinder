import { Meme } from "../types";

// Using meme-api.com — free Reddit meme proxy (no auth needed, no IP blocks)
const MEME_API = "https://meme-api.com/gimme";

const SUBREDDITS = [
  "memes",
  "dankmemes",
  "me_irl",
  "ProgrammerHumor",
  "wholesomememes",
  "shitposting",
  "AdviceAnimals",
  "BikiniBottomTwitter",
  "PrequelMemes",
  "HistoryMemes",
  "antimeme",
  "comedyheaven",
  "starterpacks",
  "blursedimages",
  "whenthe",
];

interface MemeApiResult {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
}

function parseMemeApi(m: MemeApiResult): Meme | null {
  if (m.nsfw || m.spoiler) return null;
  const isVideo = m.url.includes(".mp4") || m.url.includes("v.redd.it");

  return {
    id: `reddit-${m.postLink.split("/comments/")[1]?.split("/")[0] || m.title.slice(0, 20)}`,
    title: m.title,
    url: m.url,
    thumbnail: m.preview?.[m.preview.length - 1],
    source: "reddit",
    sourceUrl: m.postLink,
    subreddit: m.subreddit,
    author: m.author,
    score: m.ups,
    isVideo,
    createdAt: Date.now() / 1000,
  };
}

export async function fetchRedditTrending(
  _after?: string
): Promise<{ memes: Meme[]; after?: string }> {
  const allMemes: Meme[] = [];

  // Fetch from multiple subreddits in parallel (50 per sub, 5 subs at a time)
  const shuffled = [...SUBREDDITS].sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, 8);

  const fetches = batch.map(async (sub) => {
    try {
      const res = await fetch(`${MEME_API}/${sub}/20`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.memes || [])
        .map(parseMemeApi)
        .filter((m: Meme | null): m is Meme => m !== null);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetches);
  for (const r of results) {
    if (r.status === "fulfilled") allMemes.push(...r.value);
  }

  // Shuffle to mix subreddits
  allMemes.sort(() => Math.random() - 0.5);

  // Always return "has more" since the API always has random memes
  return { memes: allMemes, after: "more" };
}

export async function searchReddit(query: string, _after?: string): Promise<{ memes: Meme[]; after?: string }> {
  // meme-api.com doesn't support search, so fetch from subreddits
  // and do client-side title matching
  const allMemes: Meme[] = [];
  const q = query.toLowerCase();

  // Fetch a big batch from general meme subs
  const subs = ["memes", "dankmemes", "me_irl", "ProgrammerHumor", "wholesomememes", "shitposting", "AdviceAnimals"];

  const fetches = subs.map(async (sub) => {
    try {
      const res = await fetch(`${MEME_API}/${sub}/50`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.memes || [])
        .map(parseMemeApi)
        .filter((m: Meme | null): m is Meme => m !== null);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetches);
  for (const r of results) {
    if (r.status === "fulfilled") allMemes.push(...r.value);
  }

  // Filter by query matching title or subreddit
  const matched = allMemes.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      (m.subreddit && m.subreddit.toLowerCase().includes(q))
  );

  // If no title matches, return all (search is best-effort since API doesn't support it)
  const result = matched.length > 0 ? matched : allMemes;
  result.sort((a, b) => (b.score || 0) - (a.score || 0));

  return { memes: result, after: "more" };
}
