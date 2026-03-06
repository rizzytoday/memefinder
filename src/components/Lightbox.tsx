"use client";

import { useEffect } from "react";
import { Meme } from "@/lib/types";

interface LightboxProps {
  meme: Meme;
  onClose: () => void;
}

export function Lightbox({ meme, onClose }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {meme.isVideo ? (
          <video
            src={meme.url}
            controls
            autoPlay
            loop
            style={{ maxWidth: "90vw", maxHeight: "85vh" }}
          />
        ) : (
          <img
            src={meme.url}
            alt={meme.title}
            style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain" }}
          />
        )}
        <div
          style={{
            padding: "12px 16px",
            background: "var(--bg-card)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meme.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              {meme.subreddit ? `r/${meme.subreddit}` : meme.source}
              {meme.author ? ` by ${meme.author}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(meme.url);
              }}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Copy URL
            </button>
            <a
              href={meme.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              Open
            </a>
            <a
              href={meme.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
