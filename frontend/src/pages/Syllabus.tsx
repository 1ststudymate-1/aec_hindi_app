import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, FileText } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Syllabus as SyllabusData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Syllabus() {
  const { data, isError, isPending, refetch } = useQuery({ queryKey: ["syllabus"], queryFn: () => apiGet<SyllabusData>("/syllabus"), retry: false });
  return <div data-testid="syllabus-page">
    <section className="border-b border-border bg-secondary/40"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge variant="outline" data-testid="syllabus-label"><FileText className="mr-1 size-3" /> पाठ्यक्रम मार्गदर्शिका</Badge>
      <h1 className="mt-5 font-heading text-3xl leading-relaxed font-semibold sm:text-4xl" data-testid="syllabus-heading">सिलेबस — हिंदी व्याकरण</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="syllabus-intro">पाठ्यक्रम के विषय, उद्देश्य, परिणाम और परीक्षा का अंक-विभाजन एक जगह। विषय के नाम पर टैप करके उसका अध्याय खोलें।</p>
    </div></section>
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      {isError ? <div data-testid="syllabus-error"><p className="leading-8">सिलेबस लोड नहीं हो सका। कृपया फिर प्रयास करें।</p><Button className="mt-3" onClick={() => void refetch()} data-testid="syllabus-retry">फिर प्रयास करें</Button></div> : isPending ? <p role="status" data-testid="syllabus-loading">सिलेबस लोड हो रहा है…</p> : data && <>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7" data-testid="syllabus-course-info">
          <p className="font-semibold" data-testid="syllabus-course-title">{data.title}</p><p className="mt-2 text-sm leading-7 text-muted-foreground" data-testid="syllabus-source">{data.source}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">{[["क्रेडिट", data.credits], ["शिक्षण घंटे", data.teaching_hours], ["पूर्णांक", data.full_marks], ["उत्तीर्णांक", data.pass_marks], ["अवधि (मिनट)", data.duration_minutes]].map(([label, value], i) => <div key={i} className="rounded-xl bg-secondary/60 p-4" data-testid={`syllabus-stat-${i}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
          <p className="mt-4 text-sm" data-testid="syllabus-evaluation">मूल्यांकन : {data.evaluation}</p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">{data.units.map((unit) => <Card key={unit.unit} className="min-w-0" data-testid={`syllabus-unit-${unit.unit}`}><CardContent className="p-5 sm:p-7">
          <h2 className="font-heading text-xl font-semibold" data-testid={`syllabus-unit-heading-${unit.unit}`}>इकाई {unit.unit} — {unit.title}</h2>
          <ul className="mt-5 divide-y divide-border">{unit.items.map((item, i) => <li key={`${item.slug}-${i}`} data-testid={`syllabus-item-${unit.unit}-${i}`}>
            <Link to={`/vishay/${item.slug}${item.title === "विभक्ति" ? "#section-2" : ""}`} className="flex min-h-12 items-center gap-3 rounded-lg py-3 text-sm leading-7 transition-colors duration-150 hover:bg-secondary/70 hover:text-primary" data-testid={`syllabus-topic-${unit.unit}-${i}`}>
              <CheckCircle2 className={`size-4 shrink-0 ${item.available ? "text-green-700" : "text-amber-700"}`} /><span className="flex-1">{item.title}</span><span className="text-xs text-muted-foreground">{item.available ? "पढ़ें" : "अभी अनुपलब्ध"}</span><ArrowUpRight className="size-4" />
            </Link>
          </li>)}</ul>
        </CardContent></Card>)}</div>
        <div className="grid items-start gap-8 lg:grid-cols-2">{[{ key: "objectives", title: "प्रश्नपत्र का उद्देश्य", items: data.objectives }, { key: "outcomes", title: "प्रश्नपत्र का परिणाम", items: data.outcomes }].map((group) => <section key={group.key} data-testid={`syllabus-${group.key}`}><h2 className="font-heading text-2xl font-semibold" data-testid={`syllabus-${group.key}-heading`}>{group.title}</h2><ol className="mt-5 list-decimal space-y-4 pl-5 text-[15px] leading-8">{group.items.map((item, i) => <li key={i} data-testid={`syllabus-${group.key}-${i}`}>{item}</li>)}</ol></section>)}</div>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7" data-testid="syllabus-notes"><h2 className="font-heading text-xl font-semibold" data-testid="syllabus-notes-heading">परीक्षा और आवश्यक जानकारी</h2><ul className="mt-4 space-y-3 text-sm leading-7">{data.notes.map((note, i) => <li key={i} data-testid={`syllabus-note-${i}`}>{note}</li>)}</ul><Link to="/pariksha" className={buttonVariants({ variant: "outline" }) + " mt-6"} data-testid="syllabus-exam-link">परीक्षा योजना और मॉडल उत्तर</Link></section>
        <section data-testid="syllabus-references"><h2 className="font-heading text-xl font-semibold" data-testid="syllabus-references-heading">संदर्भ ग्रंथ</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7">{data.references.map((ref, i) => <li key={i} data-testid={`syllabus-reference-${i}`}>{ref}</li>)}</ol></section>
      </>}
    </div>
  </div>;
}