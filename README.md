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

## On your phone

The app is mobile-responsive (sidebar collapses into a hamburger drawer) and ships with a PWA manifest, so once it's deployed you can "Add to Home Screen" and it opens like a native app.

To put it on your phone, deploy to **Vercel** (free):

1. Push this repo to GitHub if you haven't already.
2. Sign in to https://vercel.com with your GitHub account.
3. Click **Add New… → Project**, pick the `Cinevision-Synq` repo, hit **Deploy**.
4. After ~1 minute you'll get a URL like `cinevision-synq.vercel.app` — open it on your phone, tap Share → Add to Home Screen.

> ⚠️ Notes are stored in each device's browser, so the phone and the laptop will have *separate* notebooks. Use **Export** on one device and **Import** on the other to copy notes across.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · `lucide-react` icons.
