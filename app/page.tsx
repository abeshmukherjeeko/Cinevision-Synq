"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import AIPanel from "../components/AIPanel";
import Editor from "../components/Editor";
import Sidebar from "../components/Sidebar";
import { getActivePage, useStore } from "../lib/store";

export default function Home() {
  const state = useStore();
  const page = getActivePage(state);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar onOpenAI={() => setAiOpen(true)} />
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-3 right-4 z-10">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded border border-notion-border bg-white hover:bg-notion-hover text-notion-text shadow-sm"
            title="Open AI panel"
          >
            <Sparkles size={14} className="text-notion-accent" /> Ask AI
          </button>
        </div>
        {page ? (
          <Editor page={page} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-notion-muted">
            Loading…
          </div>
        )}
      </div>
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </main>
  );
}
