export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "numbered"
  | "todo"
  | "quote"
  | "code"
  | "divider"
  | "callout"
  | "image"
  | "embed";

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
  url?: string;
  embedKind?: "youtube" | "twitter" | "vimeo" | "spotify" | "image" | "link";
  meta?: { title?: string; description?: string; thumb?: string };
}

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  pages: Record<string, Page>;
  rootOrder: string[];
  activePageId: string | null;
}
