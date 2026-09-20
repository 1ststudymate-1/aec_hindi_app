import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  PenLine,
  Target,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Stats, TopicSummary } from "@/lib/types";
import { getCompleted } from "@/lib/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const OBJECTIVES = [
  "हिंदी व्याकरण की बुनियादी संरचना और उसकी उपयोगिता का व्यावहारिक ज्ञान।",
  "भाषिक शुद्धता, स्पष्टता और प्रभावशील अभिव्यक्ति के लिए व्याकरणिक नियमों की समझ।",
  "औपचारिक व अनौपचारिक पत्र लेखन के स्वरूपों और प्रयोजनों से परिचय।",
  "सामाजिक, साहित्यिक, राष्ट्रीय और सांस्कृतिक विषयों पर निबंध लेखन में दक्षता।",
];

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    retry: false,
  });

  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: () => apiGet<TopicSummary[]>("/topics"),
    retry: false,
  });

  const completed = getCompleted();
  const unit1 = (topics ?? []).filter((t) => t.unit === 1);
  const unit2 = (topics ?? []).filter((t) => t.unit === 2);
  const done = (topics ?? []).filter((t) => completed.includes(t.slug)).length;
  const total = topics?.length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div data-testid="home-page">
      {/* hero */}
      <section className="border-b border-border bg-gradient-to-br from-[#2A170A] to-[#1A1F2C] text-[#FFFDF9]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <Badge
              className="border-transparent bg-[#EA580C] text-white"
              data-testid="hero-course-badge"
            >
              FYUGP · AEC हिंदी (अनिवार्य) · क्रेडिट 02
            </Badge>
            <h1 className="mt-5 font-heading text-[34px] leading-[1.15] font-semibold tracking-tight sm:text-[46px]">
              हिंदी व्याकरण — पूरा पाठ्यक्रम,
              <span className="block text-[#FED7AA]">एक ही जगह हिंदी में</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#D6CEBF]">
              सिदो कान्हू मुर्मू विश्वविद्यालय, दुमका के पाठ्यक्रम के अनुसार — इकाई 1 (पत्र लेखन एवं
              निबंध) और इकाई 2 (संधि, समास, वर्ण, वाक्य शुद्धि, मुहावरे, लोकोक्ति, कारक-विभक्ति, उपसर्ग,
              प्रत्यय, पल्लवन, संक्षेपण, अनेक शब्दों के लिए एक शब्द) की पूरी सामग्री, अभ्यास प्रश्न और
              परीक्षा-योजना।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/ikai/1"
                className={buttonVariants({ size: "lg" })}
                data-testid="hero-start-unit1-button"
              >
                इकाई 1 से शुरू करें
                <ArrowRight className="ml-1 size-4" />
              </Link>
              <Link
                to="/pariksha"
                className={
                  buttonVariants({ variant: "outline", size: "lg" }) +
                  " border-white/30 bg-white/5 text-white hover:bg-white/15"
                }
                data-testid="hero-exam-scheme-button"
              >
                परीक्षा योजना देखें
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm">
              <h2 className="font-heading text-lg font-semibold">परीक्षा एक नज़र में</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#D6CEBF]">पूर्णांक</dt>
                  <dd className="font-heading text-2xl font-semibold" data-testid="hero-full-marks">
                    50
                  </dd>
                </div>
                <div>
                  <dt className="text-[#D6CEBF]">उत्तीर्णांक</dt>
                  <dd className="font-heading text-2xl font-semibold" data-testid="hero-pass-marks">
                    20
                  </dd>
                </div>
                <div>
                  <dt className="text-[#D6CEBF]">अवधि</dt>
                  <dd className="font-heading text-2xl font-semibold">1.5 घंटे</dd>
                </div>
                <div>
                  <dt className="text-[#D6CEBF]">शिक्षण घंटे</dt>
                  <dd className="font-heading text-2xl font-semibold">30</dd>
                </div>
              </dl>
              <div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-[13px] text-[#D6CEBF]">
                <p>समूह क — पाँच अति लघु उत्तरीय प्रश्न (1 × 5 = 5 अंक), अनिवार्य</p>
                <p>समूह ख — छह वर्णनात्मक प्रश्न, किन्हीं तीन के उत्तर (15 × 3 = 45 अंक)</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* stats strip */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: BookOpenText, label: "कुल विषय", value: stats ? String(stats.topics) : "24", testid: "stat-topics" },
            { icon: GraduationCap, label: "अभ्यास प्रश्न (MCQ)", value: stats ? String(stats.mcqs) : "78", testid: "stat-mcqs" },
            { icon: FileCheck2, label: "समूह क प्रश्न", value: stats ? String(stats.shorts) : "12", testid: "stat-shorts" },
            { icon: Target, label: "समूह ख प्रश्न", value: stats ? String(stats.descriptives) : "9", testid: "stat-descriptives" },
          ].map((s) => (
            <div key={s.testid} className="flex items-center gap-3" data-testid={s.testid}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                <s.icon className="size-5" />
              </span>
              <span>
                <span className="block font-heading text-xl font-semibold leading-none">{s.value}</span>
                <span className="block text-[12px] text-muted-foreground">{s.label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* progress */}
        {total > 0 ? (
          <div
            className="mb-12 rounded-2xl border border-border bg-card p-6 shadow-sm"
            data-testid="progress-widget"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">आपकी अध्ययन प्रगति</h2>
              <p className="text-sm text-muted-foreground" data-testid="progress-count">
                {done} / {total} विषय पूर्ण ({percent}%)
              </p>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              हर विषय के अंत में “पढ़ लिया” बटन दबाइए — प्रगति इसी ब्राउज़र में सुरक्षित रहती है।
            </p>
          </div>
        ) : null}

        {/* units */}
        <h2 className="font-heading text-[26px] font-semibold tracking-tight">पाठ्यक्रम की दो इकाइयाँ</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-8 text-muted-foreground">
          नीचे से कोई भी इकाई चुनें। हर विषय में परिभाषा, नियम, तालिका, उदाहरण और परीक्षा-टिप दी गई है।
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="group overflow-hidden border-border transition-transform duration-200 hover:-translate-y-1" data-testid="unit-1-card">
            <CardContent className="p-7">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PenLine className="size-6" />
              </span>
              <h3 className="mt-5 font-heading text-xl font-semibold">इकाई 1 — पत्र लेखन एवं निबंध</h3>
              <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">
                अनौपचारिक, औपचारिक, आवेदन-पत्र, व्यावसायिक पत्र, संपादक को पत्र और पाँच पूर्ण निबंध —
                पर्यावरण, नैतिकता, विज्ञान, स्वास्थ्य, राष्ट्रीयता।
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {unit1.slice(0, 5).map((t) => (
                  <Badge key={t.slug} variant="secondary" className="font-normal">
                    {t.title}
                  </Badge>
                ))}
                {unit1.length > 5 ? (
                  <Badge variant="outline" className="font-normal">+{unit1.length - 5} और</Badge>
                ) : null}
              </div>
              <Link
                to="/ikai/1"
                className={buttonVariants({ variant: "outline" }) + " mt-6"}
                data-testid="unit-1-card-link"
              >
                इकाई 1 खोलें <ArrowRight className="ml-1 size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-border transition-transform duration-200 hover:-translate-y-1" data-testid="unit-2-card">
            <CardContent className="p-7">
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <BookOpenText className="size-6" />
              </span>
              <h3 className="mt-5 font-heading text-xl font-semibold">इकाई 2 — व्याकरण</h3>
              <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">
                संधि, समास, वर्ण विचार, वाक्य शुद्धि, मुहावरे, लोकोक्तियाँ, कारक-विभक्ति, उपसर्ग, प्रत्यय,
                पल्लवन, संक्षेपण और अनेक शब्दों के लिए एक शब्द।
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {unit2.slice(0, 6).map((t) => (
                  <Badge key={t.slug} variant="secondary" className="font-normal">
                    {t.title}
                  </Badge>
                ))}
                {unit2.length > 6 ? (
                  <Badge variant="outline" className="font-normal">+{unit2.length - 6} और</Badge>
                ) : null}
              </div>
              <Link
                to="/ikai/2"
                className={buttonVariants({ variant: "outline" }) + " mt-6"}
                data-testid="unit-2-card-link"
              >
                इकाई 2 खोलें <ArrowRight className="ml-1 size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* objectives */}
        <div className="mt-14 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-heading text-[26px] font-semibold tracking-tight">प्रश्नपत्र का उद्देश्य</h2>
            <ul className="mt-5 space-y-3" data-testid="objectives-list">
              {OBJECTIVES.map((o, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-8 text-foreground/90">
                  <CheckCircle2 className="mt-1.5 size-4 shrink-0 text-primary" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">अभ्यास से तैयारी परखें</h3>
              <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">
                विषयवार बहुविकल्पीय प्रश्नों के साथ तुरंत उत्तर-व्याख्या और अंत में अंक-सारांश। समूह क और
                समूह ख के मॉडल प्रश्न-उत्तर परीक्षा-योजना पृष्ठ पर हैं।
              </p>
              <Link to="/abhyas" className={buttonVariants() + " mt-5"} data-testid="home-quiz-link">
                अभ्यास प्रारंभ करें <ArrowRight className="ml-1 size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
