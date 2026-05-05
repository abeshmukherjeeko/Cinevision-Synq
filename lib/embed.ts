export type EmbedKind = "youtube" | "twitter" | "vimeo" | "spotify" | "image" | "link";

export function detectEmbed(url: string): { kind: EmbedKind; embedUrl?: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) {
        return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` };
      }
    }
    if (host === "twitter.com" || host === "x.com") {
      return { kind: "twitter" };
    }
    if (host === "open.spotify.com") {
      return {
        kind: "spotify",
        embedUrl: url.replace("open.spotify.com/", "open.spotify.com/embed/"),
      };
    }
    if (/\.(png|jpe?g|gif|webp|svg)$/i.test(u.pathname)) {
      return { kind: "image", embedUrl: url };
    }
    return { kind: "link" };
  } catch {
    return { kind: "link" };
  }
}
