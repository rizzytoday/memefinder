export type MemeSource = "reddit" | "giphy" | "imgflip" | "instagram";

export interface Meme {
  id: string;
  title: string;
  url: string; // direct image/video URL
  thumbnail?: string;
  source: MemeSource;
  sourceUrl: string; // link to original post
  subreddit?: string;
  author?: string;
  score?: number;
  isVideo: boolean;
  width?: number;
  height?: number;
  createdAt?: number;
}

export interface MemeApiResponse {
  memes: Meme[];
  after?: string; // cursor for pagination
}
