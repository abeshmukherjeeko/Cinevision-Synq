import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { detectEmbed } from "../../../lib/embed";

export const runtime = "nodejs";

const SYSTEM = `You are an organizing assistant inside a Notion-like note app. Given a user's clipping (a URL, a snippet of text, or both) and the list of existing top-level pages, you decide which page it belongs in and produce ready-to-insert blocks that summarize the content.

Rules:
- Pick the single best matching page from the existing list. Only set is_new_category to true if no existing page is a reasonable home, and propose a short, evergreen page name (1-3 words, Title Case).
- The generated blocks should read like polished notes — a title heading, one or two short paragraphs of summary, optional bullet points of key takeaways, and tags. Keep it tight: the user is filing this for later.
- For URLs, always include exactly one embed block. For YouTube/Vimeo/Spotify the embed renders as a player. For all other URLs it renders as a link bookmark — that is correct.
- For pure text snippets (no URL), omit the embed block.
- Never invent facts about the linked content. If you cannot confidently summarize from the URL alone, write a brief generic note (e.g. "Saved for later — open the link to read.") rather than hallucinating.

Return only valid JSON matching the provided schema.`;

const SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      description: "Name of the target page. Must match one of the provided existing pages, unless is_new_category is true.",
    },
    is_new_category: {
      type: "boolean",
      description: "True only if a brand-new page should be created.",
    },
    title: {
      type: "string",
      description: "Short title for this entry (used as the H2 heading).",
    },
    summary: {
      type: "string",
      description: "1-3 sentence summary in plain text.",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Up to 5 short keyword tags, lowercase.",
    },
    key_points: {
      type: "array",
      items: { type: "string" },
      description: "0-5 short bullet takeaways. Empty if not applicable.",
    },
    blocks: {
      type: "array",
      description: "Notion blocks to insert in order. Always start with an h2 title, then text summary, then optional bullets, then optional embed.",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["h2", "text", "bullet", "callout", "embed"],
          },
          text: { type: "string" },
          url: { type: "string" },
        },
        required: ["type", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["category", "is_new_category", "title", "summary", "tags", "key_points", "blocks"],
  additionalProperties: false,
};

interface ReqBody {
  input: string;
  pages: string[];
  hint?: string;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const input = (body.input ?? "").trim();
  if (!input) return NextResponse.json({ error: "Empty input." }, { status: 400 });

  const pages = Array.isArray(body.pages) && body.pages.length > 0 ? body.pages : ["Inbox"];
  const hint = (body.hint ?? "").trim();

  const userMessage = [
    `Existing pages (pick one as the category):\n- ${pages.join("\n- ")}`,
    hint ? `User hint about where this should go: "${hint}"` : null,
    `Clipping:\n${input}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "file_clipping",
          description:
            "Categorize the clipping into a page and produce ready-to-insert blocks. Always call this tool exactly once.",
          input_schema: SCHEMA as Anthropic.Messages.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "file_clipping" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Model did not call the structuring tool." },
        { status: 502 }
      );
    }
    const parsed = toolUse.input as any;

    // Server-side enrichment of embed blocks: classify each URL so the client
    // can render the right player/card without re-parsing.
    if (Array.isArray(parsed.blocks)) {
      parsed.blocks = parsed.blocks.map((b: any) => {
        if (b.type === "embed" && typeof b.url === "string" && b.url) {
          const det = detectEmbed(b.url);
          return {
            ...b,
            url: det.embedUrl ?? b.url,
            embedKind: det.kind,
            meta: { title: b.text || b.url },
          };
        }
        return b;
      });
    }

    return NextResponse.json({
      result: parsed,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cache_read: response.usage.cache_read_input_tokens ?? 0,
        cache_write: response.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (e: any) {
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid ANTHROPIC_API_KEY." },
        { status: 401 }
      );
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited. Try again shortly." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Anthropic API error: ${e.message}` }, { status: 502 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
