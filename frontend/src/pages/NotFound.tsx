import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6" data-testid="not-found-page">
      <p className="font-heading text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold">यह पृष्ठ उपलब्ध नहीं है</h1>
      <p className="mt-3 text-[15px] leading-8 text-muted-foreground">
        जिस पृष्ठ की आप खोज कर रहे हैं, वह हटा दिया गया है या पता बदल गया है। नीचे से मुख्य पृष्ठ पर लौटें।
      </p>
      <Link to="/" className={buttonVariants({ size: "lg" }) + " mt-8"} data-testid="not-found-home-link">
        मुख्य पृष्ठ पर जाएँ
      </Link>
    </div>
  );
}
