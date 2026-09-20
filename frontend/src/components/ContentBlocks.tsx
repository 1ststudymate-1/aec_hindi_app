import { BookMarked, Lightbulb, Quote, Sparkles } from "lucide-react";
import type { Block, Section } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function BlockView({ block, idx }: { block: Block; idx: number }) {
  const testid = `content-block-${idx}`;

  switch (block.kind) {
    case "paragraph":
      return (
        <p className="text-[15px] leading-8 text-foreground/90" data-testid={testid}>
          {block.text}
        </p>
      );

    case "points":
    case "numbered": {
      const ordered = block.kind === "numbered";
      return (
        <div data-testid={testid}>
          {block.heading ? (
            <h4 className="mb-2 font-heading text-base font-semibold">{block.heading}</h4>
          ) : null}
          {ordered ? (
            <ol className="list-decimal space-y-2 pl-6 text-[15px] leading-8 text-foreground/90">
              {(block.items ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="space-y-2 text-[15px] leading-8 text-foreground/90">
              {(block.items ?? []).map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    case "table":
      return (
        <div className="overflow-hidden rounded-xl border border-border" data-testid={testid}>
          {block.heading ? (
            <div className="border-b border-border bg-secondary/60 px-4 py-2 font-heading text-sm font-semibold">
              {block.heading}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                {(block.headers ?? []).map((h, i) => (
                  <TableHead key={i} className="font-heading text-[13px] font-semibold text-foreground">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(block.rows ?? []).map((row, i) => (
                <TableRow key={i} className="transition-colors duration-150 hover:bg-secondary/30">
                  {row.map((cell, j) => (
                    <TableCell
                      key={j}
                      className={
                        j === 0
                          ? "align-top text-[14px] leading-7 font-medium text-foreground"
                          : "align-top text-[14px] leading-7 text-foreground/80"
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    case "definition":
      return (
        <div
          className="rounded-xl border-l-4 border-primary bg-primary/5 px-5 py-4"
          data-testid={testid}
        >
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold tracking-widest uppercase text-primary">
            <BookMarked className="size-3.5" />
            {block.heading ?? "परिभाषा"}
          </div>
          <p className="text-[15px] leading-8 whitespace-pre-line text-foreground/90">{block.text}</p>
        </div>
      );

    case "example":
      return (
        <div className="rounded-xl border border-border bg-secondary/40 px-5 py-4" data-testid={testid}>
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold tracking-widest uppercase text-muted-foreground">
            <Quote className="size-3.5" />
            {block.heading ?? "उदाहरण"}
          </div>
          <p className="font-sans text-[14.5px] leading-8 whitespace-pre-line text-foreground/90">
            {block.text}
          </p>
        </div>
      );

    case "tip":
      return (
        <div
          className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-5 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"
          data-testid={testid}
        >
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold tracking-widest uppercase text-[#15803D] dark:text-emerald-300">
            <Lightbulb className="size-3.5" />
            {block.heading ?? "परीक्षा-टिप"}
          </div>
          <p className="text-[15px] leading-8 whitespace-pre-line text-[#14532D] dark:text-emerald-100">
            {block.text}
          </p>
        </div>
      );

    case "highlight":
      return (
        <div
          className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
          data-testid={testid}
        >
          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold tracking-widest uppercase text-[#B45309] dark:text-amber-300">
            <Sparkles className="size-3.5" />
            {block.heading ?? "ध्यान दें"}
          </div>
          <p className="text-[15px] leading-8 whitespace-pre-line text-[#78350F] dark:text-amber-100">
            {block.text}
          </p>
        </div>
      );

    default:
      return null;
  }
}

export default function ContentSections({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-12">
      {sections.map((section, si) => (
        <section key={si} id={`section-${si}`} className="scroll-mt-24" data-testid={`section-${si}`}>
          <h3 className="mb-4 font-heading text-[22px] leading-snug font-semibold tracking-tight text-foreground">
            <span className="mr-2 text-primary">{String(si + 1).padStart(2, "0")}</span>
            {section.heading}
          </h3>
          <div className="space-y-5">
            {section.blocks.map((block, bi) => (
              <BlockView key={bi} block={block} idx={bi} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
