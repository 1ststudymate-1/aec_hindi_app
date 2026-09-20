import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpenText, GraduationCap, Menu, PenLine, ScrollText, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "मुख्य पृष्ठ", testid: "nav-home-link", icon: Sparkles },
  { to: "/ikai/1", label: "इकाई 1 — पत्र व निबंध", testid: "nav-unit-1-link", icon: PenLine },
  { to: "/ikai/2", label: "इकाई 2 — व्याकरण", testid: "nav-unit-2-link", icon: BookOpenText },
  { to: "/abhyas", label: "अभ्यास प्रश्न", testid: "nav-quiz-link", icon: GraduationCap },
  { to: "/pariksha", label: "परीक्षा योजना", testid: "nav-exam-link", icon: ScrollText },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex items-center gap-3 transition-opacity duration-150 hover:opacity-80"
            data-testid="brand-home-link"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-heading text-lg leading-none">हि</span>
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-[17px] font-semibold tracking-tight text-foreground">
                हिंदी व्याकरण अध्ययन मंच
              </span>
              <span className="block text-[11px] tracking-wide text-muted-foreground">
                AEC हिंदी (अनिवार्य) · सिदो कान्हू मुर्मू विश्वविद्यालय, दुमका
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" data-testid="desktop-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                    isActive || (item.to !== "/" && pathname.startsWith(item.to))
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="मेन्यू खोलें" data-testid="mobile-nav-trigger">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[84vw] max-w-sm">
                <SheetHeader>
                  <SheetTitle className="font-heading">पाठ्यक्रम</SheetTitle>
                </SheetHeader>
                <nav className="mt-2 flex flex-col gap-1 px-4 pb-6" data-testid="mobile-nav">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      data-testid={`mobile-${item.testid}`}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150",
                          isActive
                            ? "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground hover:bg-secondary/60",
                        )
                      }
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-heading text-base font-semibold">हिंदी व्याकरण अध्ययन मंच</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                FYUGP सामान्य पाठ्यक्रम AEC हिंदी (अनिवार्य) — कुल क्रेडिट 02, शिक्षण घंटे 30. सिदो कान्हू
                मुर्मू विश्वविद्यालय, दुमका के पाठ्यक्रम के अनुसार तैयार निःशुल्क अध्ययन सामग्री।
              </p>
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold">संदर्भ ग्रंथ</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>1. आधुनिक हिन्दी व्याकरण और रचना — वासुदेवनन्दन प्रसाद, भारती भवन, पटना</li>
                <li>2. हिन्दी व्याकरण — कामता प्रसाद गुरु</li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold">परीक्षा एक नज़र में</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>पूर्णांक — 50 अंक</li>
                <li>अवधि — 1.5 घंटे</li>
                <li>उत्तीर्णांक — 20 अंक</li>
                <li>समूह क — 5 × 1 = 5 अंक (अनिवार्य)</li>
                <li>समूह ख — 6 में से 3 × 15 = 45 अंक</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
