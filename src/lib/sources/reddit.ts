import { Meme } from "../types";

// Reddit OAuth — app-only auth (no user login needed)
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || "";
const REDDIT_SECRET = process.env.REDDIT_SECRET || "";

let cachedToken: { token: string; expires: number } | null = null;

async function getRedditToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  if (!REDDIT_CLIENT_ID || !REDDIT_SECRET) return null;

  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_SECRET}`)}`,
        "User-Agent": "MemeFinder/1.0",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

async function redditFetch(path: string): Promise<Record<string, any> | null> {
  const token = await getRedditToken();
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://oauth.reddit.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "MemeFinder/1.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const SUBREDDITS = [
  "memes",
  "dankmemes",
  "me_irl",
  "ProgrammerHumor",
  "programmingmemes",
  "MemeEconomy",
  "wholesomememes",
  "shitposting",
  "terriblefacebookmemes",
  "196",
  "okbuddyretard",
  "AdviceAnimals",
  "BikiniBottomTwitter",
  "PrequelMemes",
  "lotrmemes",
  "HistoryMemes",
  "antimeme",
  "surrealmemes",
  "bonehurtingjuice",
  "comedyheaven",
  "memeeconomy",
  "2meirl4meirl",
  "starterpacks",
  "blursedimages",
  "cursedimages",
  "hmm",
  "whenthe",
  "weirddalle",
  "aiMemes",
];

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    subreddit: string;
    author: string;
    score: number;
    is_video: boolean;
    is_gallery?: boolean;
    post_hint?: string;
    created_utc: number;
    preview?: {
      images: Array<{
        source: { url: string; width: number; height: number };
        resolutions: Array<{ url: string; width: number; height: number }>;
      }>;
    };
    media?: {
      reddit_video?: { fallback_url: string; width: number; height: number };
    };
    media_metadata?: Record<
      string,
      {
        status: string;
        e: string;
        m: string;
        s: { u: string; x: number; y: number };
        p: Array<{ u: string; x: number; y: number }>;
      }
    >;
    gallery_data?: {
      items: Array<{ media_id: string }>;
    };
    thumbnail?: string;
    thumbnail_width?: number;
    thumbnail_height?: number;
    over_18: boolean;
    stickied: boolean;
    domain?: string;
    url_overridden_by_dest?: string;
  };
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function isImgurUrl(url: string): boolean {
  return /imgur\.com/i.test(url) && !/\/a\/|\/gallery\//i.test(url);
}

function parseRedditPost(post: RedditPost): Meme | null {
  const d = post.data;
  if (d.over_18 || d.stickied) return null;

  const isVideo = d.is_video && !!d.media?.reddit_video;
  const isDirectImage = d.post_hint === "image" || isImageUrl(d.url);
  const hasPreview = !!d.preview?.images?.[0]?.source?.url;
  const isGallery = d.is_gallery && !!d.media_metadata;
  const isImgur = isImgurUrl(d.url);

  if (!isVideo && !isDirectImage && !hasPreview && !isGallery && !isImgur)
    return null;

  let url = d.url;
  let thumbnail = d.thumbnail;
  let width = d.preview?.images?.[0]?.source?.width;
  let height = d.preview?.images?.[0]?.source?.height;

  if (isVideo && d.media?.reddit_video) {
    url = d.media.reddit_video.fallback_url;
    width = d.media.reddit_video.width;
    height = d.media.reddit_video.height;
  } else if (isGallery && d.media_metadata && d.gallery_data) {
    const firstId = d.gallery_data.items[0]?.media_id;
    const meta = firstId ? d.media_metadata[firstId] : undefined;
    if (meta?.s?.u) {
      url = meta.s.u.replace(/&amp;/g, "&");
      width = meta.s.x;
      height = meta.s.y;
    } else if (hasPreview) {
      url = d.preview!.images[0].source.url.replace(/&amp;/g, "&");
    } else {
      return null;
    }
  } else if (isImgur && !isImageUrl(d.url)) {
    url = d.url.replace(/\?.*$/, "") + ".jpg";
  } else if (!isDirectImage && hasPreview) {
    url = d.preview!.images[0].source.url.replace(/&amp;/g, "&");
  }

  if (d.preview?.images?.[0]) {
    thumbnail = d.preview.images[0].source.url.replace(/&amp;/g, "&");
  }

  return {
    id: `reddit-${d.id}`,
    title: d.title,
    url: url.replace(/&amp;/g, "&"),
    thumbnail,
    source: "reddit",
    sourceUrl: `https://reddit.com${d.permalink}`,
    subreddit: d.subreddit,
    author: d.author,
    score: d.score,
    isVideo,
    width,
    height,
    createdAt: d.created_utc,
  };
}

export async function fetchRedditTrending(
  after?: string
): Promise<{ memes: Meme[]; after?: string }> {
  const multiSub = SUBREDDITS.join("+");
  const path = `/r/${multiSub}/hot?limit=100&raw_json=1${after ? `&after=${after}` : ""}`;

  const data = await redditFetch(path);
  if (!data?.data?.children) return { memes: [], after: undefined };

  const memes = (data.data.children || [])
    .map(parseRedditPost)
    .filter((m: Meme | null): m is Meme => m !== null);

  // Shuffle to mix subreddits
  memes.sort(() => Math.random() - 0.5);

  return { memes, after: data.data.after };
}

export async function searchReddit(query: string, after?: string): Promise<{ memes: Meme[]; after?: string }> {
  const path = `/search?q=${encodeURIComponent(query)}&type=link&sort=relevance&limit=100&raw_json=1${after ? `&after=${after}` : ""}`;

  const data = await redditFetch(path);
  if (!data?.data?.children) return { memes: [] };

  const memes = (data.data.children || [])
    .map(parseRedditPost)
    .filter((m: Meme | null): m is Meme => m !== null);

  return { memes, after: data.data.after };
}
