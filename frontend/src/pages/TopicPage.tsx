import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, ListTree } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Topic, TopicSummary } from "@/lib/types";
import { isCompleted, toggleCompleted } from "@/lib/progress";
import ContentSections from "@/components/ContentBlocks";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export default function TopicPage() {
  const { slug = "" } = useParams();
  const { hash } = useLocation();
  const [done, setDone] = useState(false);

  const { data: topic, isError, isLoading } = useQuery({
    queryKey: ["topic", slug],
    queryFn: () => apiGet<Topic>(`/topics/${slug}`),
    retry: false,
  });

  const { data: siblings } = useQuery({
    queryKey: ["topics", topic?.unit ?? "all"],
    queryFn: () => apiGet<TopicSummary[]>(topic ? `/topics?unit=${topic.unit}` : "/topics"),
    enabled: Boolean(topic),
    retry: false,
  });

  useEffect(() => {
    setDone(isCompleted(slug));
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (topic && hash.startsWith("#section-")) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, topic]);

  const list = siblings ?? [];
  const index = list.findIndex((t) => t.slug === slug);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  function onToggle() {
    const nowDone = toggleCompleted(slug);
    setDone(nowDone);
    toast[nowDone ? "success" : "info"](
      nowDone ? "विषय पूर्ण चिह्नित किया गया" : "पूर्ण-चिह्न हटा दिया गया",
    );
  }

  return (
    <div data-testid="topic-page">
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
            <Link to="/" className="transition-colors duration-150 hover:text-foreground" data-testid="breadcrumb-home">
              मुख्य पृष्ठ
            </Link>
            <span>/</span>
            <Link
              to={`/ikai/${topic?.unit ?? 1}`}
              className="transition-colors duration-150 hover:text-foreground"
              data-testid="breadcrumb-unit"
            >
              इकाई {topic?.unit ?? "—"}
            </Link>
          </div>
          <h1
            className="mt-4 max-w-3xl font-heading text-[30px] leading-tight font-semibold tracking-tight sm:text-[38px]"
            data-testid="topic-title"
          >
            {topic?.title ?? (isLoading ? "लोड हो रहा है…" : "विषय")}
          </h1>
          {topic ? (
            <>
              <p className="mt-3 max-w-3xl text-[15px] leading-8 text-muted-foreground">{topic.subtitle}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  <Clock className="mr-1 size-3" /> {topic.read_minutes} मिनट
                </Badge>
                {topic.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* outline */}
        <aside className="min-w-0 lg:sticky lg:top-24 lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
              <ListTree className="size-4 text-primary" /> इस विषय में
            </h2>
            <nav className="mt-3 space-y-1" data-testid="topic-outline">
              {(topic?.sections ?? []).map((s, i) => (
                <a
                  key={i}
                  href={`#section-${i}`}
                  className="block rounded-lg px-3 py-2 text-[13px] leading-6 text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
                  data-testid={`outline-link-${i}`}
                >
                  {s.heading}
                </a>
              ))}
            </nav>
            <Button
              onClick={onToggle}
              disabled={!topic || isError}
              variant={done ? "secondary" : "default"}
              className="mt-4 w-full"
              data-testid="mark-read-button"
            >
              {done ? (
                <>
                  <CheckCircle2 className="mr-1 size-4" /> पढ़ लिया
                </>
              ) : (
                <>
                  <Circle className="mr-1 size-4" /> पढ़ लिया चिह्नित करें
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* content */}
        <article className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-10 lg:col-span-9">
          {isError ? (
            <p className="text-sm text-muted-foreground" data-testid="topic-error-state">
              यह विषय-सामग्री अभी लोड नहीं हो सकी। कृपया पृष्ठ पुनः लोड करें या इकाई-सूची से दूसरा विषय चुनें।
            </p>
          ) : topic ? (
            <ContentSections sections={topic.sections} />
          ) : (
            <p className="text-sm text-muted-foreground">सामग्री लोड हो रही है…</p>
          )}

          {/* pagination */}
          <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Link
                to={`/vishay/${prev.slug}`}
                className={buttonVariants({ variant: "outline" }) + " h-auto min-h-11 max-w-full py-3 text-center whitespace-normal"}
                data-testid="prev-topic-link"
              >
                <ArrowLeft className="mr-1 size-4" /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                to={`/vishay/${next.slug}`}
                className={buttonVariants() + " h-auto min-h-11 max-w-full py-3 text-center whitespace-normal"}
                data-testid="next-topic-link"
              >
                {next.title} <ArrowRight className="ml-1 size-4" />
              </Link>
            ) : (
              <Link to="/abhyas" className={buttonVariants()} data-testid="topic-to-quiz-link">
                अभ्यास प्रश्न हल करें <ArrowRight className="ml-1 size-4" />
              </Link>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
