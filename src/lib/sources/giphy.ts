import { Meme } from "../types";

const TENOR_KEY = process.env.TENOR_API_KEY || "";
const CLIENT_KEY = "memefinder";

interface TenorResult {
  id: string;
  title: string;
  content_description: string;
  itemurl: string;
  url: string;
  media_formats: {
    gif?: { url: string; dims: [number, number] };
    tinygif?: { url: string; dims: [number, number] };
    mediumgif?: { url: string; dims: [number, number] };
    mp4?: { url: string; dims: [number, number] };
    tinymp4?: { url: string; dims: [number, number] };
  };
  created: number;
}

function parseTenor(result: TenorResult): Meme {
  const gif = result.media_formats.gif || result.media_formats.mediumgif;
  const thumb = result.media_formats.tinygif;

  return {
    id: `tenor-${result.id}`,
    title: result.content_description || result.title || "GIF",
    url: gif?.url || result.url,
    thumbnail: thumb?.url,
    source: "giphy", // keeping badge as "giphy" since it's the GIF category
    sourceUrl: result.itemurl || result.url,
    isVideo: false,
    width: gif?.dims?.[0],
    height: gif?.dims?.[1],
    createdAt: result.created,
  };
}

export async function fetchGiphyTrending(): Promise<Meme[]> {
  try {
    const res = await fetch(
      `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&client_key=${CLIENT_KEY}&limit=30`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(parseTenor);
  } catch {
    return [];
  }
}

export async function searchGiphy(query: string): Promise<Meme[]> {
  try {
    const res = await fetch(
      `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&client_key=${CLIENT_KEY}&q=${encodeURIComponent(query)}&limit=30`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(parseTenor);
  } catch {
    return [];
  }
}
