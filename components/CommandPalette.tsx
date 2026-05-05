"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { actions, useStore } from "../lib/store";
import type { Page } from "../lib/types";

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const state = useStore();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setIdx(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const pages = Object.values(state.pages) as Page[];
    const term = q.trim().toLowerCase();
    if (!term) {
      return pages
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 20);
    }
    return pages
      .filter((p) => p.title.toLowerCase().includes(term))
      .sort((a, b) => a.title.length - b.title.length)
      .slice(0, 20);
  }, [state.pages, q]);

  const choose = (id: string) => {
    actions.setActive(id);
    onClose();
  };

  const createNew = () => {
    const title = q.trim() || "Untitled";
    actions.createPage(null, title);
    onClose();
  };

  if (!open) return null;

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (idx < results.length) choose(results[idx].id);
      else createNew();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-[min(560px,90vw)] bg-white rounded-lg shadow-2xl border border-notion-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 h-12 border-b border-notion-border">
          <Search size={16} className="text-notion-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={handleKey}
            placeholder="Search pages or type to create…"
            className="flex-1 outline-none bg-transparent text-notion-text placeholder:text-notion-muted"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-notion-sidebar border border-notion-border rounded text-notion-muted">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && !q.trim() && (
            <div className="px-4 py-6 text-center text-sm text-notion-muted">
              No pages yet.
            </div>
          )}

          {results.map((p, i) => (
            <button
              key={p.id}
              onMouseEnter={() => setIdx(i)}
              onClick={() => choose(p.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                i === idx ? "bg-notion-hover" : ""
              }`}
            >
              <span className="w-5 text-center">{p.icon || "📄"}</span>
              <span className="flex-1 truncate text-notion-text">
                {p.title || "Untitled"}
              </span>
              {p.parentId && (
                <span className="text-xs text-notion-muted">subpage</span>
              )}
            </button>
          ))}

          {q.trim() && (
            <button
              onMouseEnter={() => setIdx(results.length)}
              onClick={createNew}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-t border-notion-border ${
                idx === results.length ? "bg-notion-hover" : ""
              }`}
            >
              <Plus size={16} className="text-notion-muted" />
              <span className="text-notion-text">
                Create page <span className="font-medium">"{q.trim()}"</span>
              </span>
            </button>
          )}
        </div>

        <div className="px-3 py-2 border-t border-notion-border text-xs text-notion-muted flex gap-3">
          <span>
            <kbd className="px-1 py-0.5 bg-notion-sidebar border border-notion-border rounded">
              ↑↓
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-notion-sidebar border border-notion-border rounded">
              ↵
            </kbd>{" "}
            select
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-notion-sidebar border border-notion-border rounded">
              Esc
            </kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
