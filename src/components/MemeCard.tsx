"use client";

import { Meme } from "@/lib/types";

interface MemeCardProps {
  meme: Meme;
  onClick: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  giphy: "GIF",
  imgflip: "Imgflip",
  instagram: "Instagram",
};

function formatScore(n?: number): string {
  if (!n) return "";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function MemeCard({ meme, onClick }: MemeCardProps) {
  return (
    <div className="meme-card" onClick={onClick}>
      {meme.isVideo ? (
        <video
          src={meme.url}
          muted
          loop
          playsInline
          preload="metadata"
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => {
            e.currentTarget.pause();
            e.currentTarget.currentTime = 0;
          }}
          style={{ width: "100%", display: "block" }}
        />
      ) : (
        <img
          src={meme.url}
          alt={meme.title}
          loading="lazy"
          style={{ width: "100%", display: "block" }}
          onError={(e) => {
            // Try thumbnail fallback
            if (meme.thumbnail && e.currentTarget.src !== meme.thumbnail) {
              e.currentTarget.src = meme.thumbnail;
            }
          }}
        />
      )}
      <div className="meme-overlay">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: 4,
            }}
          >
            {meme.title}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className={`badge badge-${meme.source}`}>
              {SOURCE_LABELS[meme.source]}
            </span>
            {meme.subreddit && (
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                r/{meme.subreddit}
              </span>
            )}
            {meme.score ? (
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {formatScore(meme.score)} pts
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(meme.sourceUrl, "_blank");
          }}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: 8,
            padding: "6px 8px",
            cursor: "pointer",
            color: "white",
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          Source
        </button>
      </div>
    </div>
  );
}
