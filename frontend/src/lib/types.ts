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

export interface SyllabusItem { title: string; slug: string; available: boolean }
export interface SyllabusUnit { unit: number; title: string; items: SyllabusItem[] }
export interface Syllabus {
  title: string; source: string; credits: number; teaching_hours: number;
  full_marks: number; pass_marks: number; duration_minutes: number; evaluation: string;
  objectives: string[]; outcomes: string[]; units: SyllabusUnit[]; references: string[]; notes: string[];
}
