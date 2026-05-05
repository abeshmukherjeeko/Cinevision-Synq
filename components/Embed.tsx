"use client";

import { ExternalLink } from "lucide-react";
import type { Block } from "../lib/types";

export default function Embed({ block }: { block: Block }) {
  const { embedKind = "link", url = "", text, meta } = block;

  if (embedKind === "youtube" && url) {
    return (
      <div className="my-2 rounded overflow-hidden border border-notion-border">
        <div className="aspect-video">
          <iframe
            src={url}
            title={text || meta?.title || "YouTube"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {(text || meta?.title) && (
          <div className="px-3 py-2 text-sm text-notion-muted bg-notion-sidebar">
            {text || meta?.title}
          </div>
        )}
      </div>
    );
  }

  if (embedKind === "vimeo" && url) {
    return (
      <div className="my-2 rounded overflow-hidden border border-notion-border aspect-video">
        <iframe src={url} allow="autoplay; fullscreen" allowFullScreen className="w-full h-full" />
      </div>
    );
  }

  if (embedKind === "spotify" && url) {
    return (
      <iframe
        src={url}
        className="my-2 w-full rounded border border-notion-border"
        height={152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    );
  }

  if (embedKind === "image" && url) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={url} alt={text || "image"} className="my-2 max-w-full rounded border border-notion-border" />;
  }

  // Link bookmark card
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="my-2 flex gap-3 p-3 rounded border border-notion-border hover:bg-notion-hover transition-colors no-underline"
    >
      {meta?.thumb && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={meta.thumb} alt="" className="w-20 h-20 object-cover rounded shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-notion-text truncate">
          {meta?.title || text || url}
        </div>
        {meta?.description && (
          <div className="text-xs text-notion-muted line-clamp-2 mt-0.5">{meta.description}</div>
        )}
        <div className="text-xs text-notion-muted mt-1 flex items-center gap-1 truncate">
          <ExternalLink size={11} /> {url}
        </div>
      </div>
    </a>
  );
}
