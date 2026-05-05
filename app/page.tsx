"use client";

import { useEffect, useState } from "react";
import CommandPalette from "../components/CommandPalette";
import Editor from "../components/Editor";
import Sidebar from "../components/Sidebar";
import { getActivePage, useStore } from "../lib/store";

export default function Home() {
  const state = useStore();
  const page = getActivePage(state);
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar onOpenSearch={() => setSearchOpen(true)} />
      <div className="flex-1 flex flex-col relative">
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
