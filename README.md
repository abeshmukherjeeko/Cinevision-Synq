# Cinevision-Synq

A Notion-style note app: nested pages, a block-based editor, and rich embeds — all running locally in your browser.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Features

- **Nested pages** — sidebar with collapsible page tree, hover to add a subpage or delete.
- **Block editor** — type `/` for the slash menu (text, H1/H2/H3, bullet/numbered lists, to-dos, quote, callout, code, divider, embeds). Enter for a new line, Shift+Enter for soft break, Backspace at empty turns the block back into text.
- **Embeds** — paste a YouTube/Vimeo/Spotify URL for a playable embed; any other URL becomes a Notion-style bookmark card.
- **⌘K search** — fuzzy-find any page; type a name and Enter to create one if it doesn't exist.
- **Export / Import** — back up your whole workspace as JSON from the sidebar footer.

Notes are saved to your browser's `localStorage`. There is no backend — it's just you and the browser.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · `lucide-react` icons.
