// Mirrors backend/models/access.py. Auth tokens never enter JavaScript.
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
export interface UserView {
  user_id: string; name: string; email: string; picture: string;
  has_access: boolean; access_until: string | null; access_mode: "live" | "test" | "admin" | null;
}
export interface AuthState { user: UserView | null }
export interface SessionExchange { session_id: string }
export interface Message { message: string }
export interface AdminUnlock { password: string }
export interface Plan { amount: number; currency: string; months: number; enabled: boolean; mode: "disabled" | "test" | "live" }
export interface OrderView { order_id: string; key_id: string; amount: number; currency: string; mode: "test" | "live" }
export interface PaymentVerification { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
export function useAuth() {
  return useQuery({ queryKey: ["auth"], queryFn: () => apiGet<AuthState>("/auth/me"),
    retry: false, staleTime: 0, refetchInterval: 30000, refetchOnWindowFocus: "always" });
}
export function googleLoginUrl() {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const redirect = window.location.origin + "/account";
  return `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
}
export function accessDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("hi-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "—";
}