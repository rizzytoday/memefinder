"use client";

type Source = "all" | "reddit" | "giphy" | "imgflip";

interface SourceTabsProps {
  active: Source;
  onChange: (source: Source) => void;
}

const TABS: { value: Source; label: string; color: string }[] = [
  { value: "all", label: "All Sources", color: "var(--text-primary)" },
  { value: "reddit", label: "Reddit", color: "#ff4500" },
  { value: "giphy", label: "GIFs", color: "#00ff99" },
  { value: "imgflip", label: "Imgflip", color: "#3b82f6" },
];

export function SourceTabs({ active, onChange }: SourceTabsProps) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {TABS.map((tab) => (
        <button
          key={tab.value}
          className={`tab ${active === tab.value ? "active" : ""}`}
          onClick={() => onChange(tab.value)}
          style={
            active === tab.value
              ? { borderColor: tab.color, color: tab.color }
              : undefined
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
