"use client";

import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { actions, useStore } from "../lib/store";
import type { Block, BlockType, Page } from "../lib/types";
import { detectEmbed } from "../lib/embed";
import Embed from "./Embed";

const SLASH_ITEMS: { type: BlockType; label: string; hint: string }[] = [
  { type: "text", label: "Text", hint: "Plain paragraph" },
  { type: "h1", label: "Heading 1", hint: "Big section heading" },
  { type: "h2", label: "Heading 2", hint: "Medium section heading" },
  { type: "h3", label: "Heading 3", hint: "Small section heading" },
  { type: "bullet", label: "Bulleted list", hint: "• item" },
  { type: "numbered", label: "Numbered list", hint: "1. item" },
  { type: "todo", label: "To-do", hint: "☐ task" },
  { type: "quote", label: "Quote", hint: "Sidebar quote" },
  { type: "callout", label: "Callout", hint: "Highlighted note" },
  { type: "code", label: "Code", hint: "Monospace block" },
  { type: "divider", label: "Divider", hint: "Horizontal line" },
  { type: "embed", label: "Embed", hint: "YouTube, Twitter, link…" },
];

export default function Editor({ page }: { page: Page }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-12 pt-14 md:pt-16 pb-32">
        <PageHeader page={page} />
        <BlockList page={page} />
      </div>
    </div>
  );
}

function PageHeader({ page }: { page: Page }) {
  const [editingIcon, setEditingIcon] = useState(false);
  return (
    <div className="mb-4">
      <div className="relative inline-block">
        <button
          onClick={() => setEditingIcon((v) => !v)}
          className="text-6xl leading-none hover:bg-notion-hover rounded p-1 -ml-1"
        >
          {page.icon || "📄"}
        </button>
        {editingIcon && (
          <div className="absolute z-10 mt-1 p-2 bg-white border border-notion-border rounded shadow-lg grid grid-cols-8 gap-1">
            {"📄📝📒📚📥📤💡🎬🎵🎨🧠🔥⭐️✅🗂️📁📌🌟🚀🐛🧪🛠️📊".split("").map((e) => (
              <button
                key={e}
                onClick={() => {
                  actions.setPageIcon(page.id, e);
                  setEditingIcon(false);
                }}
                className="text-xl hover:bg-notion-hover rounded p-1"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        value={page.title}
        onChange={(e) => actions.renamePage(page.id, e.target.value)}
        placeholder="Untitled"
        className="block w-full mt-2 text-3xl md:text-4xl font-bold text-notion-text outline-none bg-transparent placeholder:text-notion-border"
      />
    </div>
  );
}

function BlockList({ page }: { page: Page }) {
  const blocks = page.blocks;
  const focusBlockId = useRef<string | null>(null);
  const focusAt = useRef<"start" | "end">("end");

  useEffect(() => {
    if (!focusBlockId.current) return;
    const el = document.querySelector<HTMLElement>(
      `[data-block-id="${focusBlockId.current}"] [data-editable]`
    );
    if (el) {
      el.focus();
      // Place caret
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(focusAt.current === "start");
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    focusBlockId.current = null;
  });

  const setBlocks = (next: Block[]) => actions.setBlocks(page.id, next);

  const updateBlock = (id: string, patch: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const insertBlockAfter = (id: string, type: BlockType = "text", patch: Partial<Block> = {}) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const nb: Block = { id: nanoid(10), type, text: "", ...patch };
    const next = [...blocks];
    next.splice(idx + 1, 0, nb);
    setBlocks(next);
    focusBlockId.current = nb.id;
    focusAt.current = "end";
  };

  const deleteBlock = (id: string, mergeToPrev = false) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (blocks.length === 1) {
      // Reset to a single empty text block
      setBlocks([{ id: nanoid(10), type: "text", text: "" }]);
      return;
    }
    const removed = blocks[idx];
    const next = blocks.filter((b) => b.id !== id);
    if (mergeToPrev && idx > 0) {
      const prev = next[idx - 1];
      next[idx - 1] = { ...prev, text: prev.text + removed.text };
      focusBlockId.current = prev.id;
      focusAt.current = "end";
    } else {
      const target = next[idx] ?? next[idx - 1];
      if (target) {
        focusBlockId.current = target.id;
        focusAt.current = "end";
      }
    }
    setBlocks(next);
  };

  return (
    <div>
      {blocks.map((b) => (
        <BlockRow
          key={b.id}
          block={b}
          onChange={(patch) => updateBlock(b.id, patch)}
          onInsertAfter={(type, patch) => insertBlockAfter(b.id, type, patch)}
          onDelete={(merge) => deleteBlock(b.id, merge)}
          onConvert={(type) => updateBlock(b.id, { type, text: b.text })}
        />
      ))}
    </div>
  );
}

interface RowProps {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onInsertAfter: (type?: BlockType, patch?: Partial<Block>) => void;
  onDelete: (mergeToPrev?: boolean) => void;
  onConvert: (type: BlockType) => void;
}

function BlockRow({ block, onChange, onInsertAfter, onDelete, onConvert }: RowProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_ITEMS.filter((it) =>
    slashFilter ? it.label.toLowerCase().includes(slashFilter.toLowerCase()) : true
  );

  useEffect(() => {
    setSlashIndex(0);
  }, [slashFilter, slashOpen]);

  // Keep DOM in sync when block.text changes externally (avoid clobbering caret on user typing).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerText !== block.text) el.innerText = block.text;
  }, [block.text]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = (e.target as HTMLDivElement).innerText;
    onChange({ text });

    // Slash menu trigger: line starts with "/" and no space yet
    const trimmed = text.trimStart();
    if (text === "/" || /^\/[^\s]*$/.test(text)) {
      setSlashOpen(true);
      setSlashFilter(trimmed.slice(1));
    } else {
      setSlashOpen(false);
      setSlashFilter("");
    }
  };

  const applySlash = (type: BlockType) => {
    if (type === "embed") {
      const url = prompt("Paste a URL to embed:");
      setSlashOpen(false);
      if (!url) {
        onChange({ text: "" });
        return;
      }
      const det = detectEmbed(url);
      onChange({
        type: "embed",
        text: "",
        url: det.embedUrl ?? url,
        embedKind: det.kind,
        meta: { title: url },
      });
      return;
    }
    if (type === "divider") {
      onChange({ type: "divider", text: "" });
      setSlashOpen(false);
      onInsertAfter("text");
      return;
    }
    onConvert(type);
    onChange({ text: "" });
    setSlashOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (slashOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => Math.min(i + 1, filteredItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredItems[slashIndex];
        if (item) applySlash(item.type);
        return;
      }
      if (e.key === "Escape") {
        setSlashOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // List continuation: stay in the same block type
      const continueType: BlockType[] = ["bullet", "numbered", "todo"];
      const next = continueType.includes(block.type) ? block.type : "text";
      // If line is empty in a list, exit to plain text
      if (continueType.includes(block.type) && !block.text.trim()) {
        onConvert("text");
        return;
      }
      onInsertAfter(next);
      return;
    }

    if (e.key === "Backspace" && (e.target as HTMLDivElement).innerText === "") {
      e.preventDefault();
      // Convert formatted blocks back to text first; on plain text, delete
      if (block.type !== "text") {
        onConvert("text");
      } else {
        onDelete(true);
      }
      return;
    }
  };

  // Render embed block as static (non-contenteditable) with caption input.
  if (block.type === "embed") {
    return (
      <div data-block-id={block.id} className="group relative my-1">
        <Embed block={block} />
        <input
          value={block.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Caption (optional)"
          className="block w-full text-sm text-notion-muted bg-transparent outline-none placeholder:text-notion-border"
        />
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div data-block-id={block.id} className="my-3">
        <hr className="border-notion-border" />
      </div>
    );
  }

  return (
    <div data-block-id={block.id} className="group relative flex items-start gap-1 py-0.5">
      {block.type === "todo" && (
        <input
          type="checkbox"
          checked={Boolean(block.checked)}
          onChange={(e) => onChange({ checked: e.target.checked })}
          className="mt-1.5"
        />
      )}
      {block.type === "bullet" && <span className="mt-0.5 select-none text-notion-muted">•</span>}
      {block.type === "numbered" && <span className="mt-0.5 select-none text-notion-muted">1.</span>}

      <div
        ref={ref}
        data-editable
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder="Type '/' for commands…"
        className={editableClass(block)}
      />

      {slashOpen && <SlashMenu items={filteredItems} index={slashIndex} onPick={applySlash} />}
    </div>
  );
}

function editableClass(block: Block) {
  const base =
    "flex-1 outline-none whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-notion-border";
  switch (block.type) {
    case "h1":
      return `${base} text-3xl font-bold text-notion-text mt-4`;
    case "h2":
      return `${base} text-2xl font-bold text-notion-text mt-3`;
    case "h3":
      return `${base} text-xl font-semibold text-notion-text mt-2`;
    case "quote":
      return `${base} pl-3 border-l-4 border-notion-text/70 italic text-notion-text`;
    case "callout":
      return `${base} bg-notion-sidebar border border-notion-border rounded p-3`;
    case "code":
      return `${base} bg-notion-sidebar border border-notion-border rounded p-3 font-mono text-sm`;
    case "todo":
      return `${base} text-notion-text ${block.checked ? "line-through text-notion-muted" : ""}`;
    default:
      return `${base} text-notion-text`;
  }
}

function SlashMenu({
  items,
  index,
  onPick,
}: {
  items: { type: BlockType; label: string; hint: string }[];
  index: number;
  onPick: (t: BlockType) => void;
}) {
  return (
    <div className="absolute z-20 left-6 top-7 w-72 max-h-80 overflow-y-auto bg-white border border-notion-border rounded shadow-lg py-1">
      <div className="px-3 py-1 text-xs uppercase tracking-wide text-notion-muted">Basic blocks</div>
      {items.length === 0 ? (
        <div className="px-3 py-2 text-sm text-notion-muted">No matches</div>
      ) : (
        items.map((it, i) => (
          <button
            key={it.type}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(it.type);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm flex justify-between items-center ${
              i === index ? "bg-notion-hover" : "hover:bg-notion-hover"
            }`}
          >
            <span className="text-notion-text">{it.label}</span>
            <span className="text-xs text-notion-muted">{it.hint}</span>
          </button>
        ))
      )}
    </div>
  );
}
