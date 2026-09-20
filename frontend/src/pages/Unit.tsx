import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Search } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { TopicSummary } from "@/lib/types";
import { getCompleted } from "@/lib/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

const UNIT_META: Record<string, { title: string; blurb: string; outcome: string }> = {
  "1": {
    title: "इकाई 1 — पत्र लेखन एवं निबंध",
    blurb:
      "पत्र के सभी प्रकार — अनौपचारिक, औपचारिक, आवेदन-पत्र, व्यावसायिक पत्र, संपादक को पत्र — प्रारूप और नमूनों के साथ; तथा पर्यावरण, नैतिकता, विज्ञान, स्वास्थ्य और राष्ट्रीयता पर पूर्ण मॉडल निबंध।",
    outcome:
      "पाठ्यक्रम-परिणाम : विविध प्रयोजन आधारित पत्र लिखने में सक्षम होंगे और विभिन्न विषयों पर प्रभावी निबंध लेखन की तकनीक आत्मसात करेंगे।",
  },
  "2": {
    title: "इकाई 2 — व्याकरण",
    blurb:
      "संधि, समास, वर्ण विचार, वाक्य शुद्धि, मुहावरे, लोकोक्तियाँ, कारक-विभक्ति, उपसर्ग, प्रत्यय, पल्लवन, संक्षेपण और अनेक शब्दों के लिए एक शब्द — नियम, तालिका और उदाहरणों के साथ।",
    outcome:
      "पाठ्यक्रम-परिणाम : हिंदी व्याकरण के प्रमुख घटकों का सैद्धांतिक व व्यावहारिक ज्ञान और शुद्ध-सुसंगत हिंदी लेखन के लिए व्याकरण का प्रयोग।",
  },
};

export default function Unit() {
  const { unit = "1" } = useParams();
  const [query, setQuery] = useState("");

  const { data: topics, isError } = useQuery({
    queryKey: ["topics", unit],
    queryFn: () => apiGet<TopicSummary[]>(`/topics?unit=${unit}`),
    retry: false,
  });

  const completed = getCompleted();
  const meta = UNIT_META[unit] ?? UNIT_META["1"];

  const filtered = useMemo(() => {
    const list = topics ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [topics, query]);

  const doneCount = (topics ?? []).filter((t) => completed.includes(t.slug)).length;

  return (
    <div data-testid={`unit-page-${unit}`}>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline" data-testid="unit-badge">
            इकाई {unit}
          </Badge>
          <h1 className="mt-4 max-w-3xl font-heading text-[30px] leading-tight font-semibold tracking-tight sm:text-[38px]">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-muted-foreground">{meta.blurb}</p>
          <div className="mt-6 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 text-[14px] leading-7 text-[#78350F] dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            {meta.outcome}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" data-testid="unit-topic-count">
            {topics ? `${topics.length} विषय` : "विषय लोड हो रहे हैं…"}
            {topics && doneCount > 0 ? ` · ${doneCount} पूर्ण` : ""}
          </p>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="विषय खोजें…"
              className="pl-9"
              data-testid="unit-search-input"
            />
          </div>
        </div>

        {isError ? (
          <div
            className="mt-8 rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground"
            data-testid="unit-empty-state"
          >
            विषय-सूची अभी लोड नहीं हो सकी। कृपया पृष्ठ पुनः लोड करें।
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => {
            const isDone = completed.includes(t.slug);
            return (
              <Card
                key={t.slug}
                className="group flex h-full flex-col border-border transition-transform duration-200 hover:-translate-y-1"
                style={{ animationDelay: `${i * 35}ms` }}
                data-testid={`topic-card-${t.slug}`}
              >
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-semibold text-primary">
                      {String(t.order).padStart(2, "0")}
                    </span>
                    {isDone ? (
                      <Badge
                        className="border-transparent bg-[#15803D] text-white"
                        data-testid={`topic-done-badge-${t.slug}`}
                      >
                        <CheckCircle2 className="mr-1 size-3" /> पूर्ण
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-heading text-[19px] leading-snug font-semibold">{t.title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-7 text-muted-foreground">{t.subtitle}</p>
                  <div className="mt-4 flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {t.read_minutes} मिनट
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" /> {t.tags[0] ?? "व्याकरण"}
                    </span>
                  </div>
                  <Link
                    to={`/vishay/${t.slug}`}
                    className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-5 w-full"}
                    data-testid={`topic-open-link-${t.slug}`}
                  >
                    पढ़ें <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {topics && filtered.length === 0 && !isError ? (
          <p
            className="mt-10 text-center text-sm text-muted-foreground"
            data-testid="unit-no-results"
          >
            “{query}” से मेल खाता कोई विषय नहीं मिला।
          </p>
        ) : null}
      </div>
    </div>
  );
}
