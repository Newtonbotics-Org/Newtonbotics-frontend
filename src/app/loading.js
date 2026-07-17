import LazyLoader from "./components/LazyLoader";

/**
 * Next.js App Router loading UI — shown during route transitions.
 */
export default function Loading() {
  return <LazyLoader variant="page" label="NewtonBotics" />;
}
