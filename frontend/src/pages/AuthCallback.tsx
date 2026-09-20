import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { googleLoginUrl } from "@/lib/access";
import type { AuthState, SessionExchange } from "@/lib/access";
import { buttonVariants } from "@/components/ui/button";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const processed = useRef(false);
  const exchange = useMutation({
    mutationFn: (payload: SessionExchange) => apiPost<AuthState>("/auth/session", payload),
    onSuccess: () => { beginSession(); navigate("/account", { replace: true }); },
  });
  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const session_id = new URLSearchParams(location.hash.slice(1)).get("session_id");
    if (session_id) exchange.mutate({ session_id });
  }, [location.hash, exchange.mutate]);
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 py-12" data-testid="auth-callback-page">
      <p className="font-heading text-2xl font-semibold" data-testid="callback-brand">Kiji Technology</p>
      <h1 className="mt-8 text-xl" data-testid="callback-heading">आपकी पढ़ाई, आपके खाते के साथ</h1>
      <p className="mt-4 leading-8 text-muted-foreground" role="status" data-testid="callback-message">
        {exchange.isError ? "Google लॉगिन की पुष्टि नहीं हो सकी या लिंक की अवधि समाप्त हो गई है। कृपया दोबारा लॉगिन करें।" : "सुरक्षित Google लॉगिन के बाद आपके खाते पर ले जाया जाएगा।"}
      </p>
      {exchange.isError && <a className={buttonVariants({ variant: "outline" }) + " mt-6"} href={googleLoginUrl()} data-testid="callback-retry-link">Google से फिर लॉगिन करें</a>}
    </main>
  );
}