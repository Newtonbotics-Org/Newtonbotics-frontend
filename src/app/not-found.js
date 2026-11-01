import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NotFoundState from "@/components/lab/NotFoundState";

export default function NotFound() {
  return (
    <NotFoundState
      eyebrow="Page not found"
      title="This part isn't in our inventory."
      message="The page you're looking for doesn't exist or has been moved. Drive the bot while you're here, or head back to the lab."
      gameLabel="Page not found"
      actions={
        <>
          <Link href="/" className="nb-btn nb-btn-primary">
            Go home <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/Projects" className="nb-btn nb-btn-secondary">
            Browse projects
          </Link>
        </>
      }
    >
      <p
        aria-hidden="true"
        className="m-0 font-display font-semibold leading-[0.85] tracking-[-0.05em] text-ink"
        style={{ fontSize: "clamp(5rem, 14vw, 11rem)" }}
      >
        4<span className="text-signal">0</span>4
      </p>
    </NotFoundState>
  );
}
