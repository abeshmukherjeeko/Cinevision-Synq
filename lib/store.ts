"use client";

import { nanoid } from "nanoid";
import { useEffect, useSyncExternalStore } from "react";
import type { AppState, Block, BlockType, Page } from "./types";

const KEY = "notion-clone:v1";

function newPage(parentId: string | null = null, title = "Untitled", icon = "📄"): Page {
  const now = Date.now();
  return {
    id: nanoid(10),
    parentId,
    title,
    icon,
    blocks: [{ id: nanoid(10), type: "text", text: "" }],
    createdAt: now,
    updatedAt: now,
  };
}

function seed(): AppState {
  const welcome = newPage(null, "Welcome", "👋");
  welcome.blocks = [
    { id: nanoid(10), type: "h1", text: "Welcome to your Notion" },
    {
      id: nanoid(10),
      type: "text",
      text: "Type / for blocks. Press Enter for a new line. Shift+Enter for soft break.",
    },
    { id: nanoid(10), type: "h2", text: "Try the AI panel" },
    {
      id: nanoid(10),
      type: "text",
      text: "Click the sparkle icon (top-right). Paste a YouTube link or article URL and let Claude file it for you.",
    },
    { id: nanoid(10), type: "divider", text: "" },
    { id: nanoid(10), type: "callout", text: "Tip: drag pages in the sidebar to nest them." },
  ];
  const inbox = newPage(null, "Inbox", "📥");
  const reading = newPage(null, "Reading", "📚");
  const videos = newPage(null, "Videos", "🎬");
  const ideas = newPage(null, "Ideas", "💡");

  return {
    pages: {
      [welcome.id]: welcome,
      [inbox.id]: inbox,
      [reading.id]: reading,
      [videos.id]: videos,
      [ideas.id]: ideas,
    },
    rootOrder: [welcome.id, inbox.id, reading.id, videos.id, ideas.id],
    activePageId: welcome.id,
  };
}

let state: AppState = { pages: {}, rootOrder: [], activePageId: null };
let initialized = false;
const listeners = new Set<() => void>();

function load(): AppState {
  if (typeof window === "undefined") return { pages: {}, rootOrder: [], activePageId: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  return seed();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): AppState {
  return state;
}

function getServerSnapshot(): AppState {
  return { pages: {}, rootOrder: [], activePageId: null };
}

export function useStore() {
  // Hydrate once on the client.
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    state = load();
    emit();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(mutator: (s: AppState) => AppState) {
  state = mutator(state);
  emit();
}

export const actions = {
  setActive(id: string) {
    update((s) => ({ ...s, activePageId: id }));
  },
  createPage(parentId: string | null = null, title = "Untitled") {
    const page = newPage(parentId, title);
    update((s) => {
      const pages = { ...s.pages, [page.id]: page };
      const rootOrder = parentId === null ? [...s.rootOrder, page.id] : s.rootOrder;
      return { ...s, pages, rootOrder, activePageId: page.id };
    });
    return page.id;
  },
  deletePage(id: string) {
    update((s) => {
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const p of Object.values(s.pages)) {
          if (p.parentId && toDelete.has(p.parentId) && !toDelete.has(p.id)) {
            toDelete.add(p.id);
            changed = true;
          }
        }
      }
      const pages = { ...s.pages };
      toDelete.forEach((pid) => delete pages[pid]);
      const rootOrder = s.rootOrder.filter((pid) => !toDelete.has(pid));
      const activePageId =
        s.activePageId && toDelete.has(s.activePageId)
          ? rootOrder[0] ?? null
          : s.activePageId;
      return { ...s, pages, rootOrder, activePageId };
    });
  },
  renamePage(id: string, title: string) {
    update((s) => {
      const page = s.pages[id];
      if (!page) return s;
      return {
        ...s,
        pages: { ...s.pages, [id]: { ...page, title, updatedAt: Date.now() } },
      };
    });
  },
  setPageIcon(id: string, icon: string) {
    update((s) => {
      const page = s.pages[id];
      if (!page) return s;
      return {
        ...s,
        pages: { ...s.pages, [id]: { ...page, icon, updatedAt: Date.now() } },
      };
    });
  },
  setBlocks(id: string, blocks: Block[]) {
    update((s) => {
      const page = s.pages[id];
      if (!page) return s;
      return {
        ...s,
        pages: {
          ...s.pages,
          [id]: { ...page, blocks, updatedAt: Date.now() },
        },
      };
    });
  },
  appendBlocks(id: string, blocks: Block[]) {
    update((s) => {
      const page = s.pages[id];
      if (!page) return s;
      // Trim a single trailing empty text block before appending, so inserts feel clean.
      const existing = [...page.blocks];
      const last = existing[existing.length - 1];
      if (last && last.type === "text" && !last.text.trim()) existing.pop();
      return {
        ...s,
        pages: {
          ...s.pages,
          [id]: {
            ...page,
            blocks: [...existing, ...blocks, { id: nanoid(10), type: "text", text: "" }],
            updatedAt: Date.now(),
          },
        },
      };
    });
  },
  newBlock(type: BlockType = "text", patch: Partial<Block> = {}): Block {
    return { id: nanoid(10), type, text: "", ...patch };
  },
};

export function getActivePage(s: AppState): Page | null {
  return s.activePageId ? s.pages[s.activePageId] ?? null : null;
}

export function childrenOf(s: AppState, parentId: string | null): Page[] {
  return Object.values(s.pages)
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.createdAt - b.createdAt);
}
