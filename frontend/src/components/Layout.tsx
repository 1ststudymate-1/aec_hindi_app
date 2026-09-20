import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpenText, FileText, GraduationCap, LogOut, Menu, PenLine, ScrollText, Sparkles, UserRound, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { googleLoginUrl, useAuth } from "@/lib/access";
import { endSession } from "@/lib/session";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "मुख्य पृष्ठ", testid: "nav-home-link", icon: Sparkles },
  { to: "/ikai/1", label: "इकाई 1 — पत्र व निबंध", testid: "nav-unit-1-link", icon: PenLine },
  { to: "/ikai/2", label: "इकाई 2 — व्याकरण", testid: "nav-unit-2-link", icon: BookOpenText },
  { to: "/abhyas", label: "अभ्यास प्रश्न", testid: "nav-quiz-link", icon: GraduationCap },
  { to: "/pariksha", label: "परीक्षा योजना", testid: "nav-exam-link", icon: ScrollText },
  { to: "/syllabus", label: "सिलेबस", testid: "nav-syllabus-link", icon: FileText },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { data, isError } = useAuth();
  const user = isError ? null : data?.user;
  const logout = useMutation({ mutationFn: () => endSession("/membership") });
  useEffect(() => {
    setOpen(false);
    toast.dismiss(); // A previous page's reading notification must not cover quiz choices.
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group flex min-w-0 shrink-0 items-center gap-3 transition-opacity duration-150 hover:opacity-80"
            data-testid="brand-home-link"
          >
            <span className="font-heading text-[19px] font-semibold tracking-tight text-foreground sm:text-[22px]" data-testid="brand-name">Kiji <span className="text-primary">Technology</span></span>
          </Link>

          <nav className="ml-auto hidden items-center gap-0.5 xl:flex" data-testid="desktop-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                data-testid={item.testid}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-2 py-2.5 text-[12px] font-medium transition-colors duration-150",
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

          <Link to={user ? "/account" : "#"} onClick={user ? undefined : (e) => { e.preventDefault(); window.location.assign(googleLoginUrl()); }} className="ml-auto flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-xs transition-colors duration-150 hover:bg-secondary xl:ml-2" aria-label={user ? "मेरा खाता" : "Google से लॉगिन करें"} data-testid="header-account-link"><UserRound className="size-4" /><span className="hidden sm:inline">{user ? "मेरा खाता" : "लॉगिन"}</span></Link>
          {user && <Button variant="ghost" size="icon" aria-label="लॉगआउट करें" disabled={logout.isPending} onClick={() => logout.mutate()} data-testid="header-logout-button"><LogOut className="size-4" /></Button>}
          <div className="xl:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="मेन्यू खोलें" data-testid="mobile-nav-trigger">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto" showCloseButton={false} data-testid="mobile-nav-sheet">
                <SheetHeader>
                  <SheetTitle className="font-heading" data-testid="mobile-menu-heading">Kiji Technology</SheetTitle>
                  <Button variant="ghost" size="icon" className="absolute top-3 right-3" aria-label="मेन्यू बंद करें" onClick={() => setOpen(false)} data-testid="mobile-nav-close"><X className="size-5" /></Button>
                </SheetHeader>
                <nav className="mt-2 flex flex-col gap-1 px-4 pb-6" data-testid="mobile-nav">
                  {NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setOpen(false)}
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

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-border bg-secondary/40" data-testid="site-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div><p className="font-heading text-lg font-semibold" data-testid="footer-brand">Kiji Technology</p><p className="mt-2 text-xs leading-6 text-muted-foreground" data-testid="footer-description">हिंदी में अध्ययन, अभ्यास और बेहतर अभिव्यक्ति। स्वतंत्र शैक्षिक मंच।</p></div>
          <div className="flex flex-wrap items-center gap-5 text-xs"><Link to="/syllabus" className="py-2 text-muted-foreground transition-colors hover:text-primary" data-testid="footer-syllabus-link">सिलेबस</Link><Link to="/account" className="py-2 text-muted-foreground transition-colors hover:text-primary" data-testid="footer-account-link">मेरा खाता</Link><span data-testid="footer-developer-credit">Developer by Kiji Technology</span></div>
        </div>
      </footer>
    </div>
  );
}
