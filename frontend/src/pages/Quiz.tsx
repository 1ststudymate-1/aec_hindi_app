import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, Trophy, XCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Question, TopicSummary } from "@/lib/types";
import { saveBestScore } from "@/lib/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MIXED = "mixed";

export default function Quiz() {
  const [topicSlug, setTopicSlug] = useState<string>(MIXED);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: () => apiGet<TopicSummary[]>("/topics"),
    retry: false,
  });

  const { data: questions, isError, isPending } = useQuery({
    queryKey: ["questions", "mcq", topicSlug],
    queryFn: () => apiGet<Question[]>(`/questions?qtype=mcq&topic_slug=${topicSlug}`),
    retry: false,
  });

  const labels = useMemo(() => {
    const map: Record<string, string> = { [MIXED]: "सभी विषय (मिश्रित)" };
    (topics ?? []).forEach((t) => {
      map[t.slug] = t.title;
    });
    return map;
  }, [topics]);

  const list = questions ?? [];
  const q = list[current];
  const correctCount = Object.values(answers).filter(Boolean).length;
  const attempted = Object.keys(answers).length;

  function reset(nextTopic?: string) {
    if (nextTopic) setTopicSlug(nextTopic);
    setCurrent(0);
    setPicked(null);
    setAnswers({});
    setFinished(false);
  }

  function choose(i: number) {
    if (picked !== null || !q) return;
    setPicked(i);
    setAnswers((prev) => ({ ...prev, [q.id]: i === q.answer_index }));
  }

  function advance() {
    if (current + 1 >= list.length) {
      const total = list.length || 1;
      const finalCorrect = Object.values(answers).filter(Boolean).length;
      saveBestScore(topicSlug, Math.round((finalCorrect / total) * 100));
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setPicked(null);
  }

  const percent = list.length ? Math.round((correctCount / list.length) * 100) : 0;

  return (
    <div data-testid="quiz-page">
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline">अभ्यास</Badge>
          <h1 className="mt-4 font-heading text-[30px] leading-tight font-semibold tracking-tight sm:text-[38px]">
            अभ्यास प्रश्न — बहुविकल्पीय
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-muted-foreground">
            विषय चुनें और उत्तर दें। हर उत्तर के तुरंत बाद सही उत्तर और उसकी व्याख्या दिखाई जाएगी। अंत में
            आपका अंक-सारांश मिलेगा।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Select
              value={topicSlug}
              onValueChange={(value: string) => reset(value)}
              data-testid="quiz-topic-select"
            >
              <SelectTrigger className="h-auto min-h-11 w-full max-w-sm whitespace-normal" aria-label="अभ्यास का विषय चुनें" data-testid="quiz-topic-trigger">
                <SelectValue>{(v) => labels[v as string] ?? "विषय चुनें"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MIXED} data-testid="quiz-topic-option-mixed">सभी विषय (मिश्रित)</SelectItem>
                {(topics ?? []).map((t) => (
                  <SelectItem key={t.slug} value={t.slug} data-testid={`quiz-topic-option-${t.slug}`}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => reset()} data-testid="quiz-restart-button">
              <RefreshCw className="mr-1 size-4" /> फिर से शुरू करें
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {isError ? (
          <p className="text-center text-sm text-muted-foreground" data-testid="quiz-error-state">
            प्रश्न अभी लोड नहीं हो सके। कृपया पृष्ठ पुनः लोड करें।
          </p>
        ) : isPending ? <p role="status" data-testid="quiz-loading-state">प्रश्न लोड हो रहे हैं…</p> : list.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground" data-testid="quiz-empty-state">
            इस विषय के लिए अभी बहुविकल्पीय प्रश्न उपलब्ध नहीं हैं — कृपया दूसरा विषय चुनें या मिश्रित
            अभ्यास करें।
          </p>
        ) : finished ? (
          <Card className="border-border" data-testid="quiz-result-card">
            <CardContent className="p-8 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Trophy className="size-7" />
              </span>
              <h2 className="mt-5 font-heading text-2xl font-semibold">अभ्यास पूर्ण!</h2>
              <p className="mt-3 text-[15px] text-muted-foreground" data-testid="quiz-score-text">
                {list.length} प्रश्नों में से <strong className="text-foreground">{correctCount}</strong> सही
                — {percent}%
              </p>
              <div className="mx-auto mt-5 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                {percent >= 80
                  ? "उत्तम! यह विषय आपकी पकड़ में है।"
                  : percent >= 50
                    ? "अच्छा प्रयास — तालिकाओं को एक बार और दोहराएँ।"
                    : "विषय-सामग्री एक बार पूरी पढ़कर फिर अभ्यास करें।"}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button onClick={() => reset()} data-testid="quiz-retry-button">
                  <RefreshCw className="mr-1 size-4" /> दोबारा अभ्यास करें
                </Button>
                <Link
                  to="/pariksha"
                  className={buttonVariants({ variant: "outline" })}
                  data-testid="quiz-to-exam-link"
                >
                  परीक्षा योजना देखें
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : q ? (
          <>
            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
              <span data-testid="quiz-progress-text">
                प्रश्न {current + 1} / {list.length}
              </span>
              <span data-testid="quiz-running-score">
                सही {correctCount} · हल किए {attempted}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${((current + (picked === null ? 0 : 1)) / list.length) * 100}%` }}
              />
            </div>

            <Card className="mt-6 border-border" data-testid="quiz-question-card">
              <CardContent className="p-6 sm:p-8">
                <p className="font-heading text-[19px] leading-snug font-semibold" data-testid="quiz-question-text">
                  {q.question}
                </p>

                <div className="mt-6 space-y-3">
                  {(q.options ?? []).map((opt, i) => {
                    const isCorrect = i === q.answer_index;
                    const isPicked = i === picked;
                    const revealed = picked !== null;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => choose(i)}
                        disabled={revealed}
                        data-testid={`quiz-option-${i}`}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-7 transition-colors duration-150",
                          !revealed && "border-border bg-background hover:border-primary/60 hover:bg-secondary/50",
                          revealed && isCorrect && "border-[#15803D] bg-[#F0FDF4] text-[#14532D]",
                          revealed && isPicked && !isCorrect && "border-destructive bg-destructive/10",
                          revealed && !isCorrect && !isPicked && "border-border opacity-70",
                        )}
                      >
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary font-heading text-[12px] font-semibold">
                          {["क", "ख", "ग", "घ"][i] ?? i + 1}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && isCorrect ? (
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#15803D]" />
                        ) : null}
                        {revealed && isPicked && !isCorrect ? (
                          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {picked !== null ? (
                  <div
                    className="mt-6 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
                    data-testid="quiz-explanation"
                  >
                    <p className="text-[12px] font-semibold tracking-widest uppercase text-[#B45309] dark:text-amber-300">
                      व्याख्या
                    </p>
                    <p className="mt-1 text-[15px] leading-8 text-[#78350F] dark:text-amber-100">
                      {q.explanation}
                    </p>
                  </div>
                ) : null}

                <div className="mt-7 flex justify-end">
                  <Button onClick={advance} disabled={picked === null} data-testid="quiz-next-button">
                    {current + 1 >= list.length ? "परिणाम देखें" : "अगला प्रश्न"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
