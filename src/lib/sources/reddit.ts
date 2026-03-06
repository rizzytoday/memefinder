import { Meme } from "../types";

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MemeFinder/1.0)" },
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

  // Must have some visual content
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
    // Use first image from gallery
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
    // Imgur links without extension — try adding .jpg
    url = d.url.replace(/\?.*$/, "") + ".jpg";
  } else if (!isDirectImage && hasPreview) {
    // Use preview image as the URL (for link posts with preview)
    url = d.preview!.images[0].source.url.replace(/&amp;/g, "&");
  }

  if (d.preview?.images?.[0]) {
    const previewUrl =
      d.preview.images[0].source.url.replace(/&amp;/g, "&");
    thumbnail = previewUrl;
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
  const allMemes: Meme[] = [];
  let cursor: string | undefined;

  // Use one combined multi-sub URL for speed
  const multiSub = SUBREDDITS.join("+");
  const batches = [multiSub];

  const fetches = batches.map(async (sub) => {
    const reqUrl = `https://www.reddit.com/r/${sub}/hot.json?limit=100&raw_json=1${after ? `&after=${after}` : ""}`;
    try {
      const data = await fetchJson(reqUrl) as Record<string, any>;
      if (!data?.data?.children) return [];
      if (!cursor) cursor = data.data.after;
      return (data.data.children || [])
        .map(parseRedditPost)
        .filter((m: Meme | null): m is Meme => m !== null);
    } catch {
      return [];
    }
  });

  const results = await Promise.all(fetches);
  results.forEach((memes) => allMemes.push(...memes));

  // Shuffle to mix subreddits
  allMemes.sort(() => Math.random() - 0.5);

  return { memes: allMemes, after: cursor };
}

export async function searchReddit(query: string, after?: string): Promise<{ memes: Meme[]; after?: string }> {
  const reqUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&type=link&sort=relevance&limit=100&raw_json=1${after ? `&after=${after}` : ""}`;

  try {
    const data = await fetchJson(reqUrl) as Record<string, any>;
    if (!data?.data?.children) return { memes: [] };
    const memes = (data.data.children || [])
      .map(parseRedditPost)
      .filter((m: Meme | null): m is Meme => m !== null);
    return { memes, after: data.data.after };
  } catch {
    return { memes: [] };
  }
}
