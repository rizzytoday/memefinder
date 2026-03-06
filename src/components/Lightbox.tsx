"use client";

import { useEffect, useState } from "react";
import { Meme } from "@/lib/types";

interface LightboxProps {
  meme: Meme;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function Lightbox({ meme, onClose, onCopy, onDownload }: LightboxProps) {
  const [copied, setCopied] = useState(false);

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

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(meme.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
              onClick={onCopy}
              className="lightbox-btn"
              title="Copy image to clipboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Image
            </button>
            <button
              onClick={handleCopyUrl}
              className="lightbox-btn"
            >
              {copied ? "Copied!" : "Copy URL"}
            </button>
            <button
              onClick={onDownload}
              className="lightbox-btn lightbox-btn-primary"
              title="Download"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </button>
            <a
              href={meme.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="lightbox-btn"
              style={{ textDecoration: "none" }}
            >
              Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
