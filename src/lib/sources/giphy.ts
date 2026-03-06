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
    source: "giphy",
    sourceUrl: result.itemurl || result.url,
    isVideo: false,
    width: gif?.dims?.[0],
    height: gif?.dims?.[1],
    createdAt: result.created,
  };
}

// Curated search terms for banger GIFs instead of Tenor's trash "featured" feed
const BANGER_QUERIES = [
  "meme reaction",
  "iron man suit up",
  "coding programmer",
  "monkey typing",
  "mind blown",
  "deal with it sunglasses",
  "this is fine fire",
  "surprised pikachu",
  "laughing crying",
  "evil laugh villain",
];

export async function fetchGiphyTrending(pos?: string): Promise<{ memes: Meme[]; next?: string }> {
  // Pick a random banger query instead of using Tenor's "featured" endpoint
  const query = BANGER_QUERIES[Math.floor(Math.random() * BANGER_QUERIES.length)];
  try {
    const res = await fetch(
      `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&client_key=${CLIENT_KEY}&q=${encodeURIComponent(query)}&limit=30${pos ? `&pos=${pos}` : ""}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { memes: [] };
    const data = await res.json();
    return { memes: (data.results || []).map(parseTenor), next: data.next };
  } catch {
    return { memes: [] };
  }
}

export async function searchGiphy(query: string, pos?: string): Promise<{ memes: Meme[]; next?: string }> {
  try {
    const res = await fetch(
      `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&client_key=${CLIENT_KEY}&q=${encodeURIComponent(query)}&limit=30${pos ? `&pos=${pos}` : ""}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { memes: [] };
    const data = await res.json();
    return { memes: (data.results || []).map(parseTenor), next: data.next };
  } catch {
    return { memes: [] };
  }
}
