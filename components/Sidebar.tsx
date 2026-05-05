"use client";

import { ChevronRight, Download, FileText, Plus, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { actions, childrenOf, useStore } from "../lib/store";
import type { Page } from "../lib/types";

interface Props {
  onOpenSearch: () => void;
}

export default function Sidebar({ onOpenSearch }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = actions.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const replace = confirm(
      "Replace your current notes with the contents of this backup?\n\nClick Cancel to merge instead (keeps your existing pages).",
    );
    try {
      actions.importJSON(text, replace ? "replace" : "merge");
    } catch (err) {
      alert((err as Error).message);
    }
  };
  const state = useStore();
  const roots = state.rootOrder
    .map((id) => state.pages[id])
    .filter((p): p is Page => Boolean(p));

  return (
    <aside className="w-60 shrink-0 bg-notion-sidebar border-r border-notion-border flex flex-col text-sm">
      <div className="p-3 border-b border-notion-border flex items-center justify-between">
        <div className="font-semibold text-notion-text">My Workspace</div>
        <button
          onClick={onOpenSearch}
          title="Search (⌘K)"
          className="p-1.5 rounded hover:bg-notion-hover text-notion-muted hover:text-notion-text"
        >
          <Search size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-2 text-xs uppercase tracking-wide text-notion-muted">
          Pages
        </div>
        {roots.map((p) => (
          <PageNode key={p.id} page={p} depth={0} />
        ))}
        <button
          onClick={() => actions.createPage(null, "Untitled")}
          className="mt-1 mx-2 flex items-center gap-1.5 px-2 py-1 text-notion-muted hover:bg-notion-hover hover:text-notion-text rounded w-[calc(100%-1rem)]"
        >
          <Plus size={14} /> New page
        </button>
      </div>

      <div className="p-2 border-t border-notion-border flex items-center gap-1">
        <button
          onClick={handleExport}
          title="Export all notes as JSON"
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded hover:bg-notion-hover text-xs text-notion-muted hover:text-notion-text"
        >
          <Download size={12} /> Export
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          title="Import notes from a backup"
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded hover:bg-notion-hover text-xs text-notion-muted hover:text-notion-text"
        >
          <Upload size={12} /> Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportPicked}
        />
      </div>
      <div className="px-3 pb-2 text-[11px] text-notion-muted">
        Saved locally in this browser
      </div>
    </aside>
  );
}

function PageNode({ page, depth }: { page: Page; depth: number }) {
  const state = useStore();
  const kids = childrenOf(state, page.id);
  const [open, setOpen] = useState(true);
  const [hover, setHover] = useState(false);
  const active = state.activePageId === page.id;

  return (
    <div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => actions.setActive(page.id)}
        className={`group flex items-center gap-1 px-2 py-1 mx-2 rounded cursor-pointer ${
          active ? "bg-notion-hover" : "hover:bg-notion-hover"
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={`shrink-0 p-0.5 rounded hover:bg-black/5 ${
            kids.length === 0 ? "opacity-0" : "opacity-60"
          }`}
        >
          <ChevronRight
            size={12}
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
        <span className="shrink-0 w-5 text-center">{page.icon || <FileText size={14} className="inline" />}</span>
        <span className="flex-1 truncate text-notion-text">
          {page.title || "Untitled"}
        </span>
        {hover && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.createPage(page.id, "Untitled");
                setOpen(true);
              }}
              title="Add subpage"
              className="p-0.5 rounded hover:bg-black/10 text-notion-muted"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${page.title || "Untitled"}" and its subpages?`)) {
                  actions.deletePage(page.id);
                }
              }}
              title="Delete"
              className="p-0.5 rounded hover:bg-black/10 text-notion-muted"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {open && kids.map((k) => <PageNode key={k.id} page={k} depth={depth + 1} />)}
    </div>
  );
}
