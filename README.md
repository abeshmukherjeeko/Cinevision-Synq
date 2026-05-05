# Cinevision-Synq

A Notion-style note app: nested pages, block editor (text, headings, lists, todos, callouts, code, embeds), and an AI panel that uses the Claude API to auto-categorize anything you paste — a YouTube link, an article URL, or a snippet of text — and file it into the right page with a clean summary.

## Quick start

```bash
cp .env.local.example .env.local
# put your Anthropic API key in .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Using the AI panel

1. Click the sparkle (top-right or in the sidebar header).
2. Paste a URL (e.g. a YouTube video) or any text.
3. Optional: add a hint like *"this should go in Videos"*.
4. Hit **Categorize & summarize** — Claude picks a target page (or proposes a new one), writes a short summary, extracts tags and key points, and inserts an embed block.
5. Click **File it** to drop the blocks into the chosen page.

Notes are stored in your browser's localStorage (single-user, no backend).

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind
- `@anthropic-ai/sdk` server-side route at `/api/ai`
- Model: `claude-opus-4-7` with `output_config.format` JSON-schema structured output and prompt caching on the system prompt
