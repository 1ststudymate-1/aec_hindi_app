import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardList, Eye, EyeOff, Info, Timer } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Question } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SCHEME = [
  { label: "पूर्णांक", value: "50 अंक" },
  { label: "उत्तीर्णांक", value: "20 अंक" },
  { label: "परीक्षा अवधि", value: "1.5 घंटे" },
  { label: "कुल क्रेडिट", value: "02" },
  { label: "शिक्षण घंटे", value: "30" },
  { label: "मूल्यांकन", value: "केवल सत्रांत विश्वविद्यालय परीक्षा" },
];

const OUTCOMES = [
  "हिंदी व्याकरण के प्रमुख घटकों का सैद्धांतिक और व्यावहारिक ज्ञान प्राप्त करेंगे।",
  "शुद्ध और सुसंगत हिंदी लेखन के लिए व्याकरण का व्यावहारिक प्रयोग करना सीखेंगे।",
  "अनौपचारिक, औपचारिक, आवेदन-पत्र, व्यावसायिक पत्र, संपादक को पत्र लिखने में सक्षम होंगे।",
  "विभिन्न विषयों पर प्रभावी निबंध लेखन की तकनीकों को आत्मसात करेंगे और परीक्षा व प्रतियोगिता में लागू कर सकेंगे।",
];

function AnswerCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border" data-testid={`question-card-${q.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 font-heading text-[12px] font-semibold text-primary">
                {index + 1}
              </span>
              <Badge variant="secondary" className="font-normal">
                {q.marks} अंक
              </Badge>
            </div>
            <p className="mt-3 text-[15.5px] leading-8 font-medium">{q.question}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          className="mt-4"
          data-testid={`reveal-answer-button-${q.id}`}
        >
          {open ? (
            <>
              <EyeOff className="mr-1 size-3.5" /> उत्तर छिपाएँ
            </>
          ) : (
            <>
              <Eye className="mr-1 size-3.5" /> उत्तर देखें
            </>
          )}
        </Button>
        {open ? (
          <div
            className="mt-4 rounded-xl border-l-4 border-primary bg-primary/5 px-5 py-4"
            data-testid={`answer-text-${q.id}`}
          >
            <p className="text-[15px] leading-8 whitespace-pre-line text-foreground/90">{q.answer}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Exam() {
  const { data: shorts } = useQuery({
    queryKey: ["questions", "short"],
    queryFn: () => apiGet<Question[]>("/questions?qtype=short"),
    retry: false,
  });

  const { data: descriptives } = useQuery({
    queryKey: ["questions", "descriptive"],
    queryFn: () => apiGet<Question[]>("/questions?qtype=descriptive"),
    retry: false,
  });

  return (
    <div data-testid="exam-page">
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Badge variant="outline">परीक्षा योजना</Badge>
          <h1 className="mt-4 font-heading text-[30px] leading-tight font-semibold tracking-tight sm:text-[38px]">
            सत्रांत परीक्षा (ESE) — प्रश्नपत्र का प्रारूप
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-muted-foreground">
            AEC हिंदी (अनिवार्य) — पेपर : हिंदी व्याकरण। नीचे आधिकारिक अंक-विभाजन, दोनों समूहों के नियम,
            और अभ्यास हेतु समूह क व समूह ख के मॉडल प्रश्न-उत्तर दिए गए हैं।
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SCHEME.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card px-4 py-3"
                data-testid={`scheme-${s.label}`}
              >
                <p className="text-[11px] tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-heading text-[15px] font-semibold leading-snug">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* group rules */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border" data-testid="group-a-rules-card">
            <CardContent className="p-7">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="size-5" />
              </span>
              <h2 className="mt-4 font-heading text-xl font-semibold">समूह क — अनिवार्य</h2>
              <ul className="mt-3 space-y-2 text-[15px] leading-8 text-foreground/90">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-primary" />
                  पाँच अति लघु उत्तरीय प्रश्न — प्रत्येक 1 अंक
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-primary" />
                  कुल 5 अंक; सभी प्रश्न अनिवार्य हैं
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-primary" />
                  उत्तर एक-दो पंक्तियों में — परिभाषा, भेद या अंतर पूछा जाता है
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border" data-testid="group-b-rules-card">
            <CardContent className="p-7">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Timer className="size-5" />
              </span>
              <h2 className="mt-4 font-heading text-xl font-semibold">समूह ख — विकल्प सहित</h2>
              <ul className="mt-3 space-y-2 text-[15px] leading-8 text-foreground/90">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-accent" />
                  छह वर्णनात्मक प्रश्न — प्रत्येक 15 अंक
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-accent" />
                  किन्हीं तीन के उत्तर देने हैं — कुल 45 अंक
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-2 size-4 shrink-0 text-accent" />
                  आवश्यकतानुसार प्रश्न छोटे-छोटे भागों में विभाजित हो सकते हैं
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-4 text-[14.5px] leading-7 text-[#1E3A8A] dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
          <Info className="mt-1 size-4 shrink-0" />
          <p>
            अंक-गणित : समूह क (5 × 1 = 5) + समूह ख (3 × 15 = 45) = <strong>50 अंक</strong>. डेढ़ घंटे में
            तीन वर्णनात्मक उत्तर लिखने हैं, अतः प्रत्येक उत्तर के लिए लगभग 25 मिनट नियोजित कीजिए।
          </p>
        </div>

        {/* question banks */}
        <Tabs defaultValue="group-a" className="mt-12">
          <TabsList variant="line" data-testid="exam-tabs">
            <TabsTrigger value="group-a" data-testid="tab-group-a">
              समूह क — मॉडल प्रश्न
            </TabsTrigger>
            <TabsTrigger value="group-b" data-testid="tab-group-b">
              समूह ख — मॉडल प्रश्न
            </TabsTrigger>
            <TabsTrigger value="outcomes" data-testid="tab-outcomes">
              पाठ्यक्रम परिणाम
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group-a" className="mt-6">
            <p className="mb-5 text-[14.5px] leading-7 text-muted-foreground">
              अति लघु उत्तरीय प्रश्न (1 अंक) — उत्तर देखने से पहले स्वयं लिखकर मिलाइए।
            </p>
            <div className="grid gap-4 lg:grid-cols-2" data-testid="group-a-questions">
              {(shorts ?? []).map((q, i) => (
                <AnswerCard key={q.id} q={q} index={i} />
              ))}
            </div>
            {shorts && shorts.length === 0 ? (
              <p className="text-sm text-muted-foreground">प्रश्न उपलब्ध नहीं हैं।</p>
            ) : null}
          </TabsContent>

          <TabsContent value="group-b" className="mt-6">
            <p className="mb-5 text-[14.5px] leading-7 text-muted-foreground">
              वर्णनात्मक प्रश्न (15 अंक) — प्रत्येक के साथ अंक पाने योग्य उत्तर-रूपरेखा दी गई है।
            </p>
            <div className="grid gap-4" data-testid="group-b-questions">
              {(descriptives ?? []).map((q, i) => (
                <AnswerCard key={q.id} q={q} index={i} />
              ))}
            </div>
            {descriptives && descriptives.length === 0 ? (
              <p className="text-sm text-muted-foreground">प्रश्न उपलब्ध नहीं हैं।</p>
            ) : null}
          </TabsContent>

          <TabsContent value="outcomes" className="mt-6">
            <Card className="border-border">
              <CardContent className="p-7">
                <h3 className="font-heading text-lg font-semibold">प्रश्नपत्र का परिणाम</h3>
                <ul className="mt-4 space-y-3" data-testid="outcomes-list">
                  {OUTCOMES.map((o, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-8 text-foreground/90">
                      <CheckCircle2 className="mt-1.5 size-4 shrink-0 text-primary" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-8 font-heading text-lg font-semibold">संदर्भ ग्रंथ</h3>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] leading-8 text-foreground/90">
                  <li>आधुनिक हिन्दी व्याकरण और रचना — वासुदेवनन्दन प्रसाद, भारती भवन, पटना</li>
                  <li>हिन्दी व्याकरण — कामता प्रसाद गुरु</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/abhyas" className={buttonVariants()} data-testid="exam-to-quiz-link">
            अभ्यास प्रश्न हल करें
          </Link>
          <Link to="/ikai/2" className={buttonVariants({ variant: "outline" })} data-testid="exam-to-unit2-link">
            इकाई 2 दोहराएँ
          </Link>
        </div>
      </div>
    </div>
  );
}
