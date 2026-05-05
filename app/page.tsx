"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import CommandPalette from "../components/CommandPalette";
import Editor from "../components/Editor";
import Sidebar from "../components/Sidebar";
import { getActivePage, useStore } from "../lib/store";

export default function Home() {
  const state = useStore();
  const page = getActivePage(state);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-close mobile drawer after navigating to a page
  useEffect(() => {
    setSidebarOpen(false);
  }, [state.activePageId]);

  return (
    <main className="flex h-[100dvh] w-screen overflow-hidden">
      <Sidebar
        onOpenSearch={() => setSearchOpen(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col relative min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          className="md:hidden absolute top-3 left-3 z-10 p-2 rounded border border-notion-border bg-white hover:bg-notion-hover text-notion-text shadow-sm"
        >
          <Menu size={16} />
        </button>
        {page ? (
          <Editor page={page} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-notion-muted">
            Loading…
          </div>
        )}
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
