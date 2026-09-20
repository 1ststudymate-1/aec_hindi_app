import type { PaymentVerification } from "./access";

export interface CheckoutOptions {
  key: string; order_id: string; amount: number; currency: string; name: string;
  description: string; prefill: { name: string; email: string }; theme: { color: string };
  handler: (result: PaymentVerification) => void;
  modal: { ondismiss: () => void; confirm_close: boolean };
}
interface Checkout { open: () => void; on: (event: "payment.failed", callback: () => void) => void }
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => Checkout } }
let loading: Promise<void> | null = null;
export function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timer = window.setTimeout(() => { script.remove(); reject(new Error("checkout timeout")); }, 15000);
    script.onload = () => { window.clearTimeout(timer); window.Razorpay ? resolve() : reject(new Error("checkout unavailable")); };
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error("checkout unavailable")); };
    document.body.appendChild(script);
  }).catch((error: unknown) => { loading = null; throw error; });
  return loading;
}