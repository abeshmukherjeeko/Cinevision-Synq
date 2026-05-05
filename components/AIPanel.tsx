"use client";

import { ExternalLink, Key, Loader2, Sparkles, X } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { actions, useStore } from "../lib/store";
import type { Block, Page } from "../lib/types";

interface AIBlock {
  type: "h2" | "text" | "bullet" | "callout" | "embed";
  text: string;
  url?: string;
  embedKind?: Block["embedKind"];
  meta?: Block["meta"];
}

interface AIResult {
  category: string;
  is_new_category: boolean;
  title: string;
  summary: string;
  tags: string[];
  key_points: string[];
  blocks: AIBlock[];
}

export default function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useStore();
  const rootPages = state.rootOrder
    .map((id) => state.pages[id])
    .filter((p): p is Page => Boolean(p));

  const [input, setInput] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [keyStatus, setKeyStatus] = useState<"checking" | "ok" | "missing">("checking");

  useEffect(() => {
    if (!open) return;
    setKeyStatus("checking");
    fetch("/api/ai/health")
      .then((r) => r.json())
      .then((d) => setKeyStatus(d.keyConfigured ? "ok" : "missing"))
      .catch(() => setKeyStatus("missing"));
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.trim(),
          pages: rootPages.map((p) => p.title),
          hint: hint.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
        return;
      }
      setResult(data.result as AIResult);
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const fileIt = () => {
    if (!result) return;
    let targetPageId: string | null = null;
    if (result.is_new_category) {
      targetPageId = actions.createPage(null, result.category);
    } else {
      const match = rootPages.find(
        (p) => p.title.toLowerCase() === result.category.toLowerCase()
      );
      targetPageId = match?.id ?? actions.createPage(null, result.category);
    }
    const blocks: Block[] = result.blocks.map((b) => ({
      id: nanoid(10),
      type: b.type,
      text: b.text,
      url: b.url,
      embedKind: b.embedKind,
      meta: b.meta,
    }));
    if (result.tags && result.tags.length > 0) {
      blocks.push({
        id: nanoid(10),
        type: "text",
        text: `Tags: ${result.tags.map((t) => `#${t}`).join(" ")}`,
      });
    }
    actions.appendBlocks(targetPageId, blocks);
    actions.setActive(targetPageId);
    setInput("");
    setHint("");
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-[420px] bg-white border-l border-notion-border shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 border-b border-notion-border">
        <div className="flex items-center gap-2 font-semibold text-notion-text">
          <Sparkles size={16} className="text-notion-accent" />
          AI Quick File
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-notion-hover text-notion-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {keyStatus === "missing" && <SetupWalkthrough />}
        {keyStatus !== "missing" && (
        <>
        <div>
          <label className="text-xs uppercase tracking-wide text-notion-muted mb-1 block">
            Paste a link or text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or any text snippet"
            rows={6}
            className="w-full p-2 border border-notion-border rounded text-sm font-mono outline-none focus:border-notion-accent"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-notion-muted mb-1 block">
            Hint (optional)
          </label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder='e.g. "this should go in Videos"'
            className="w-full p-2 border border-notion-border rounded text-sm outline-none focus:border-notion-accent"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          className="w-full flex items-center justify-center gap-2 bg-notion-accent text-white py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-600"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? "Asking Claude…" : "Categorize & summarize"}
        </button>

        {error && (
          <div className="p-3 text-sm rounded bg-red-50 border border-red-200 text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 pt-2 border-t border-notion-border">
            <div className="text-xs uppercase tracking-wide text-notion-muted">Preview</div>

            <div className="text-sm">
              <div className="text-notion-muted">Will file under:</div>
              <div className="font-medium text-notion-text">
                {result.category}{" "}
                {result.is_new_category && (
                  <span className="ml-1 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                    new page
                  </span>
                )}
              </div>
            </div>

            <div className="border border-notion-border rounded p-3 bg-notion-sidebar text-sm space-y-2">
              <div className="font-semibold text-notion-text">{result.title}</div>
              <div className="text-notion-text">{result.summary}</div>
              {result.key_points.length > 0 && (
                <ul className="list-disc ml-5 space-y-0.5 text-notion-text">
                  {result.key_points.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
              )}
              {result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {result.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-1.5 py-0.5 bg-white border border-notion-border rounded text-notion-muted"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fileIt}
              className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800"
            >
              File it
            </button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

function SetupWalkthrough() {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2 text-notion-text font-medium">
        <Key size={14} /> One-time setup
      </div>
      <p className="text-notion-muted">
        The AI panel needs an Anthropic API key to talk to Claude. Takes about 2 minutes:
      </p>

      <ol className="space-y-3 list-decimal ml-5 text-notion-text">
        <li>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer noopener"
            className="text-notion-accent inline-flex items-center gap-1 underline"
          >
            Open the Anthropic Console <ExternalLink size={12} />
          </a>
          {" "}and create an API key. It starts with{" "}
          <code className="px-1 py-0.5 rounded bg-notion-sidebar border border-notion-border text-xs">
            sk-ant-
          </code>
          .
        </li>
        <li>
          In your project folder, create a file named{" "}
          <code className="px-1 py-0.5 rounded bg-notion-sidebar border border-notion-border text-xs">
            .env.local
          </code>{" "}
          (a template{" "}
          <code className="px-1 py-0.5 rounded bg-notion-sidebar border border-notion-border text-xs">
            .env.local.example
          </code>{" "}
          is already there).
        </li>
        <li>
          Paste this line into it (replace with your real key):
          <pre className="mt-1 p-2 rounded bg-notion-sidebar border border-notion-border text-xs font-mono whitespace-pre-wrap break-all">
            ANTHROPIC_API_KEY=sk-ant-...
          </pre>
        </li>
        <li>Stop the dev server (Ctrl+C) and run <code className="px-1 py-0.5 rounded bg-notion-sidebar border border-notion-border text-xs">npm run dev</code> again.</li>
      </ol>

      <div className="p-3 rounded bg-notion-sidebar border border-notion-border text-xs text-notion-muted">
        Your key stays on the server — it's never sent to the browser. Calls to Claude
        cost a fraction of a cent each (~$0.005 per file action).
      </div>

      <button
        onClick={() => location.reload()}
        className="w-full bg-notion-accent text-white py-2 rounded text-sm font-medium hover:bg-blue-600"
      >
        I&apos;ve added my key — reload
      </button>
    </div>
  );
}
