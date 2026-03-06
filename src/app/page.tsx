"use client";

import { useState, useEffect, useRef } from "react";
import { Meme } from "@/lib/types";
import { SearchBar } from "@/components/SearchBar";
import { MemeCard } from "@/components/MemeCard";
import { Lightbox } from "@/components/Lightbox";
import { SourceTabs } from "@/components/SourceTabs";

type Source = "all" | "reddit" | "giphy" | "imgflip";

export default function Home() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const url = activeQuery
      ? `/api/memes/search?q=${encodeURIComponent(activeQuery)}&source=${source}`
      : `/api/memes/trending?source=${source}`;

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setMemes(data.memes || []);
          setLoading(false);
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

  const handleSearch = () => {
    setActiveQuery(query.trim());
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
            <button
              onClick={() => {
                // Force re-fetch by toggling a dummy state
                setActiveQuery((prev) => prev + " ");
                setTimeout(() => setActiveQuery((prev) => prev.trim()), 0);
              }}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                color: "var(--text-primary)",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Refresh
            </button>
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
        <div className="meme-grid">
          {memes.map((meme) => (
            <MemeCard
              key={meme.id}
              meme={meme}
              onClick={() => setSelectedMeme(meme)}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedMeme && (
        <Lightbox
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
        />
      )}
    </div>
  );
}
