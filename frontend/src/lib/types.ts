// Hand-written mirrors of the Pydantic models in backend/models/study.py — keep both in sync.

export type BlockKind =
  | "paragraph"
  | "points"
  | "numbered"
  | "table"
  | "definition"
  | "example"
  | "tip"
  | "highlight";

export interface Block {
  kind: BlockKind;
  heading?: string | null;
  text?: string | null;
  items?: string[] | null;
  headers?: string[] | null;
  rows?: string[][] | null;
}

export interface Section {
  heading: string;
  blocks: Block[];
}

export interface TopicSummary {
  id: string;
  slug: string;
  unit: number;
  title: string;
  subtitle: string;
  icon: string;
  read_minutes: number;
  order: number;
  tags: string[];
}

export interface Topic extends TopicSummary {
  sections: Section[];
}

export type QType = "mcq" | "short" | "descriptive";

export interface Question {
  id: string;
  qtype: QType;
  topic_slug: string;
  unit: number;
  question: string;
  options?: string[] | null;
  answer_index?: number | null;
  explanation?: string | null;
  answer?: string | null;
  marks: number;
}

export interface Stats {
  topics: number;
  mcqs: number;
  shorts: number;
  descriptives: number;
}
