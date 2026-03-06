"use client";

import { Meme } from "@/lib/types";

interface MemeCardProps {
  meme: Meme;
  onClick: () => void;
  onCopy: () => void;
  onDownload: () => void;
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

export function MemeCard({ meme, onClick, onCopy, onDownload }: MemeCardProps) {
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
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="card-action-btn"
            title="Copy image"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="card-action-btn"
            title="Download"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(meme.sourceUrl, "_blank");
            }}
            className="card-action-btn"
            title="View source"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
