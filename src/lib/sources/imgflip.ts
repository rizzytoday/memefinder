import { Meme } from "../types";

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

export async function fetchImgflipTemplates(): Promise<Meme[]> {
  try {
    const res = await fetch("https://api.imgflip.com/get_memes", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success) return [];
    return (data.data?.memes || []).slice(0, 50).map((m: ImgflipMeme): Meme => ({
      id: `imgflip-${m.id}`,
      title: m.name,
      url: m.url,
      source: "imgflip",
      sourceUrl: `https://imgflip.com/meme/${m.id}`,
      isVideo: false,
      width: m.width,
      height: m.height,
    }));
  } catch {
    return [];
  }
}

export async function searchImgflip(query: string): Promise<Meme[]> {
  // Imgflip doesn't have a search API, so filter templates by name
  const templates = await fetchImgflipTemplates();
  const q = query.toLowerCase();
  return templates.filter(
    (m) => m.title.toLowerCase().includes(q)
  );
}
