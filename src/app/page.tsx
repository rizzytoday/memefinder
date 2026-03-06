"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Meme } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { MemeCard } from "@/components/MemeCard";
import { Lightbox } from "@/components/Lightbox";
import { SourceTabs } from "@/components/SourceTabs";

type Source = "all" | "reddit" | "giphy" | "imgflip";

export default function Home() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  }, []);

  // Initial fetch
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setPage(0);
    setHasMore(true);

    const url = activeQuery
      ? `/api/memes/search?q=${encodeURIComponent(activeQuery)}&source=${source}`
      : `/api/memes/trending?source=${source}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          const m = data.memes || [];
          setMemes(m);
          setLoading(false);
          if (m.length < 20) setHasMore(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setMemes([]);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [source, activeQuery]);

  // Infinite scroll — load more
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    const url = activeQuery
      ? `/api/memes/search?q=${encodeURIComponent(activeQuery)}&source=${source}&page=${nextPage}`
      : `/api/memes/trending?source=${source}&page=${nextPage}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const newMemes = data.memes || [];
        if (newMemes.length === 0) {
          setHasMore(false);
        } else {
          // Deduplicate
          setMemes((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const unique = newMemes.filter((m: Meme) => !ids.has(m.id));
            return [...prev, ...unique];
          });
          setPage(nextPage);
        }
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, activeQuery, source]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loading]);

  const handleSearch = () => {
    setActiveQuery(query.trim());
  };

  const handleCopyImage = async (meme: Meme) => {
    try {
      const res = await fetch(meme.url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      showToast("Image copied to clipboard");
    } catch {
      // Fallback: copy URL
      await navigator.clipboard.writeText(meme.url);
      showToast("URL copied (image copy not supported)");
    }
  };

  const handleDownload = async (meme: Meme) => {
    try {
      const res = await fetch(meme.url);
      const blob = await res.blob();
      const ext = meme.isVideo ? "mp4" : meme.url.includes(".gif") ? "gif" : "jpg";
      const filename = `${meme.title.slice(0, 40).replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Downloading...");
    } catch {
      window.open(meme.url, "_blank");
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
      {/* Header */}
      <header
        style={{
          padding: "32px 0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                memefinder
              </h1>
              <a
                href="https://x.com/rizzytoday"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                by @rizzy
              </a>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: "4px 0 0",
              }}
            >
              {activeQuery
                ? `Results for "${activeQuery}"`
                : "Trending across the internet"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {memes.length} memes
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
          />
          <SourceTabs active={source} onChange={setSource} />
        </div>

        {/* Quick search suggestions */}
        {!activeQuery && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              "iron man coding",
              "developer memes",
              "AI memes",
              "drake format",
              "distracted boyfriend",
              "cat memes",
              "this is fine",
              "stonks",
              "programming",
              "elon musk",
              "reaction memes",
              "marvel memes",
              "ape with ak47",
              "office memes",
              "anime memes",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  setActiveQuery(suggestion);
                }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 100,
                  padding: "5px 12px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  transition: "all 0.2s ease",
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {activeQuery && (
          <button
            onClick={() => {
              setQuery("");
              setActiveQuery("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
              fontWeight: 600,
            }}
          >
            Clear search -- show trending
          </button>
        )}
      </header>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "80px 0",
          }}
        >
          <div className="spinner" />
        </div>
      ) : memes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15s1.5-2 4-2 4 2 4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>No memes found</p>
          <p style={{ fontSize: 13 }}>Try a different search or source</p>
        </div>
      ) : (
        <>
          <div className="meme-grid">
            {memes.map((meme) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                onClick={() => setSelectedMeme(meme)}
                onCopy={() => handleCopyImage(meme)}
                onDownload={() => handleDownload(meme)}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div
            ref={sentinelRef}
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            {loadingMore && <div className="spinner" />}
            {!hasMore && memes.length > 0 && (
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                That's all the memes for now
              </span>
            )}
          </div>
        </>
      )}

      {/* Lightbox */}
      {selectedMeme && (
        <Lightbox
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
          onCopy={() => handleCopyImage(selectedMeme)}
          onDownload={() => handleDownload(selectedMeme)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--green)",
            color: "black",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 200,
            animation: "fadeIn 0.15s ease",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
