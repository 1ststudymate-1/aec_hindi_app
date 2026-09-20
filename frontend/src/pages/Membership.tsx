import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpenText, CalendarDays, Check, ChevronRight, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { accessDate, googleLoginUrl, useAuth } from "@/lib/access";
import type { AdminUnlock, AuthState, OrderView, PaymentVerification, Plan } from "@/lib/access";
import { loadCheckout } from "@/lib/razorpay";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.body && typeof error.body === "object" && "detail" in error.body && typeof error.body.detail === "string") return error.body.detail;
  return "अनुरोध पूरा नहीं हुआ। इंटरनेट जाँचें और फिर प्रयास करें।";
}

export default function Membership() {
  const auth = useAuth();
  const user = !auth.isError ? auth.data?.user : null;
  const client = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const plan = useQuery({ queryKey: ["billing-plan"], queryFn: () => apiGet<Plan>("/billing/plan"), retry: false });
  const enabled = !plan.isError && plan.data?.enabled === true;
  const active = Boolean(user?.has_access);
  async function confirmed(result: AuthState) {
    await client.invalidateQueries({ queryKey: ["auth"] });
    if (result.user?.has_access) {
      setNotice("आपका पैक सक्रिय है। अब पढ़ाई शुरू करें।");
      toast.success("अध्ययन पहुँच सक्रिय है।");
    } else {
      setNotice("अभी किसी पूर्ण भुगतान की पुष्टि नहीं मिली। पैसे कटे हों तो थोड़ी देर बाद स्थिति फिर जाँचें; दोबारा भुगतान न करें।");
    }
  }
  const verify = useMutation({
    mutationFn: (payload: PaymentVerification) => apiPost<AuthState>("/billing/verify", payload),
    onSuccess: confirmed,
    onError: (error) => { setNotice(errorMessage(error)); toast.error(errorMessage(error)); },
    onSettled: () => setCheckoutOpen(false),
  });
  const reconcile = useMutation({ mutationFn: () => apiPost<AuthState>("/billing/reconcile"), onSuccess: confirmed,
    onError: (error) => { setNotice(errorMessage(error)); toast.error(errorMessage(error)); } });
  const adminUnlock = useMutation({
    mutationFn: (payload: AdminUnlock) => apiPost<AuthState>("/auth/admin-unlock", payload),
    onSuccess: async (result) => {
      await client.invalidateQueries({ queryKey: ["auth"] });
      setAdminPassword("");
      if (result.user?.has_access) toast.success("एडमिन पहुँच सक्रिय हो गई।");
    },
    onError: (error) => { toast.error(errorMessage(error)); },
  });
  const create = useMutation({
    mutationFn: async () => { await loadCheckout(); return apiPost<OrderView>("/billing/orders"); },
    onSuccess: (order) => {
      if (!window.Razorpay || !user) { setNotice("भुगतान विंडो नहीं खुली। पृष्ठ फिर खोलें।"); return; }
      setCheckoutOpen(true);
      setNotice("");
      const checkout = new window.Razorpay({ key: order.key_id, order_id: order.order_id,
        amount: order.amount, currency: order.currency, name: "Kiji Technology",
        description: "Hindi study access - 6 calendar months", prefill: { name: user.name, email: user.email },
        theme: { color: "#C2410C" }, handler: (result) => verify.mutate(result),
        modal: { confirm_close: true, ondismiss: () => { setCheckoutOpen(false); setNotice("भुगतान विंडो बंद हो गई। पैसे कटे हों तो भुगतान स्थिति जाँचें।"); } },
      });
      checkout.on("payment.failed", () => { setCheckoutOpen(false); setNotice("भुगतान पूरा नहीं हुआ। पैसे कटे हों तो स्थिति जाँचें।"); });
      checkout.open();
    },
    onError: (error) => { setNotice(errorMessage(error)); toast.error(errorMessage(error)); },
  });
  const busy = checkoutOpen || create.isPending || verify.isPending || reconcile.isPending;
  return (
    <div className="membership-page" data-testid="membership-page">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground" data-testid="membership-breadcrumb">
          Kiji Technology <ChevronRight className="size-3" /> {active ? "मेरा खाता" : "अध्ययन सदस्यता"}
        </div>
        <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <section className="min-w-0 pt-2 lg:pt-5">
            <Badge variant="outline" className="border-primary/25 bg-primary/5 px-3 py-1.5 text-primary" data-testid="membership-label">हिंदी में सीखें। आत्मविश्वास से लिखें।</Badge>
            <h1 className="mt-7 font-heading text-[36px] leading-[1.45] font-semibold tracking-tight sm:text-5xl sm:leading-[1.4]" data-testid="membership-title">
              आपकी हिंदी की तैयारी,<br /><span className="text-primary">अब एक जगह।</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground" data-testid="membership-description">
              आसान हिंदी में अध्याय, समझने के लिए उदाहरण और अपनी तैयारी परखने के लिए अभ्यास। अपने मोबाइल या कंप्यूटर से, अपनी गति से पढ़ें।
            </p>
            <div className="mt-9 space-y-5 border-l-2 border-primary/20 pl-5">
              {[
                [BookOpenText, "समझें, फिर अभ्यास करें", "अध्यायवार सामग्री, विषयवार MCQ और मॉडल उत्तर"],
                [Smartphone, "छोटी स्क्रीन, पूरी पढ़ाई", "मोबाइल, टैबलेट और कंप्यूटर पर सुविधाजनक अनुभव"],
                [CalendarDays, "एक पैक, 6 महीने", "उसी Google खाते से किसी भी डिवाइस पर अपनी पहुँच खोलें"],
              ].map(([Icon, title, subtitle], i) => {
                const FeatureIcon = Icon as typeof BookOpenText;
                return <div className="flex gap-4" key={i} data-testid={`membership-feature-${i}`}>
                  <FeatureIcon className="mt-1 size-5 shrink-0 text-primary" />
                  <div><h2 className="text-base font-semibold">{String(title)}</h2><p className="mt-1 text-sm leading-7 text-muted-foreground">{String(subtitle)}</p></div>
                </div>;
              })}
            </div>
            <p className="mt-8 text-xs leading-6 text-muted-foreground" data-testid="membership-progress-note">खरीदी हुई पहुँच खाते से जुड़ी है। पढ़ाई की प्रगति और क्विज़ स्कोर अभी इसी ब्राउज़र में सहेजे जाते हैं।</p>
          </section>

          <Card className="relative min-w-0 overflow-hidden border-border shadow-[0_18px_55px_-25px_#70431e55]" data-testid="membership-plan-card">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/70 px-6 py-4" data-testid="plan-card-label">
              <span className="text-sm font-semibold">{active ? "आपकी अध्ययन पहुँच" : "पूरा अध्ययन पैक"}</span><LockKeyhole className="size-4 text-primary" />
            </div>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-end gap-3" data-testid="membership-price"><span className="font-heading text-6xl font-semibold tracking-tight">₹349</span><span className="pb-2 text-base text-muted-foreground">/ 6 महीने</span></div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="membership-price-terms">एकमुश्त भुगतान। अपने-आप नवीनीकरण या पैसे की कटौती नहीं।</p>
              <ul className="my-7 space-y-3 border-y border-border py-6" data-testid="plan-includes">
                {["सभी अध्यायों की हिंदी अध्ययन सामग्री", "अध्यायवार MCQ और उत्तर-व्याख्या", "समूह क / ख के मॉडल प्रश्न और उत्तर", "सिलेबस और परीक्षा योजना की पूरी जानकारी"].map((item, i) => <li key={item} className="flex gap-3 text-sm leading-6" data-testid={`plan-includes-${i}`}><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}
              </ul>
              {user && <div className="mb-5 rounded-xl bg-secondary/60 p-4" data-testid="account-profile">
                <p className="font-medium" data-testid="account-name">नमस्ते, {user.name}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground" data-testid="account-email">{user.email}</p>
                <p className="mt-3 text-sm leading-7" data-testid="account-access-status">{user.access_mode === "admin" ? "एडमिन पहुँच सक्रिय · असीमित" : active ? `पैक सक्रिय · ${accessDate(user.access_until)} तक (भारतीय समय)` : user.access_until ? `पैक समाप्त · ${accessDate(user.access_until)} (भारतीय समय)` : "पैक अभी सक्रिय नहीं है।"}</p>
              </div>}
              {plan.data?.mode === "test" && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm leading-7 text-amber-900" data-testid="payment-test-mode">TEST MODE — केवल परीक्षण भुगतान; वास्तविक पैसे नहीं कटेंगे। यह पहुँच Live Mode में मान्य नहीं होगी।</p>}
              {!enabled && !active && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950" role="status" data-testid="payment-disabled-notice">
                {plan.isError ? "भुगतान की उपलब्धता जाँची नहीं जा सकी।" : "भुगतान अभी चालू नहीं है। Razorpay की कुंजियाँ जुड़ने के बाद खरीद उपलब्ध होगी।"} अभी कोई राशि नहीं ली जाएगी और लॉगिन मात्र से अध्ययन सामग्री नहीं खुलेगी।
              </div>}
              {auth.isError ? <Button variant="outline" className="w-full" onClick={() => void auth.refetch()} data-testid="membership-auth-retry">खाता फिर जाँचें</Button> : auth.isPending ? <p role="status" data-testid="membership-auth-check" className="text-sm">खाता जाँचा जा रहा है…</p> : active ?
                <Link to="/" className={buttonVariants({ size: "lg" }) + " w-full"} data-testid="account-start-study">पढ़ाई शुरू करें <ArrowRight className="size-4" /></Link> : <>
                  {!user && <a href={googleLoginUrl()} className={buttonVariants({ variant: "outline", size: "lg" }) + " mb-3 w-full gap-3"} data-testid="google-login-link"><SiGoogle size={17} /> Google से लॉगिन करें</a>}
                  <Button size="lg" className="w-full gap-2" disabled={!user || !enabled || busy} onClick={() => create.mutate()} data-testid="buy-plan-button">
                    <LockKeyhole className="size-4" />{busy ? "भुगतान की पुष्टि जारी है…" : enabled ? "₹349 में पैक खरीदें" : "खरीद अभी उपलब्ध नहीं"}
                  </Button>
                </>}
              {user && enabled && !active && <Button variant="ghost" className="mt-3 w-full" disabled={busy} onClick={() => reconcile.mutate()} data-testid="check-payment-button">पैसे कट गए? भुगतान स्थिति जाँचें</Button>}
              {user && !active && <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4" data-testid="admin-unlock-section">
                <p className="text-xs font-medium text-muted-foreground" data-testid="admin-unlock-label">एडमिन खाता (admin@kiji.com से Google लॉगिन करें, फिर पासवर्ड डालें)</p>
                <div className="mt-2 flex gap-2">
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="पासवर्ड डालें" data-testid="admin-unlock-input" />
                  <Button variant="outline" disabled={!adminPassword || adminUnlock.isPending}
                    onClick={() => adminUnlock.mutate({ password: adminPassword })} data-testid="admin-unlock-button">
                    {adminUnlock.isPending ? "जाँच रहे हैं…" : "अनलॉक करें"}
                  </Button>
                </div>
              </div>}
              {notice && <p className="mt-4 text-sm leading-7" role="status" data-testid="payment-status-message">{notice}</p>}
              {plan.isError && <Button variant="ghost" className="mt-3 w-full" onClick={() => void plan.refetch()} data-testid="plan-retry-button">भुगतान उपलब्धता फिर जाँचें</Button>}
              <p className="mt-5 flex gap-2 text-xs leading-6 text-muted-foreground" data-testid="secure-access-note"><ShieldCheck className="mt-1 size-4 shrink-0" />भुगतान की पुष्टि के बाद 6 कैलेंडर महीने की पहुँच मिलेगी। समाप्ति तिथि आपके खाते में दिखाई जाएगी।</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}