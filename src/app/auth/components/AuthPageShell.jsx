import ArmSchematic from "./ArmSchematic";

/**
 * Split auth layout: blueprint panel with the animated arm on the left, form column on the right.
 * The whole layout starts a gap below the floating navbar so nothing tucks under it, and the arm
 * panel is dropped on small screens.
 */
export default function AuthPageShell({ children, width = "max-w-[440px]" }) {
  return (
    <main className="nb-dark flex min-h-[calc(100svh-var(--nb-nav-height,72px))] flex-wrap bg-paper pt-4 text-ink">
      <section className="nb-blueprint hidden min-w-0 flex-[1_1_480px] items-center justify-center overflow-hidden border-t border-line p-10 lg:flex">
        <ArmSchematic className="h-auto max-h-[460px] w-full max-w-[640px]" />
      </section>

      <section className="flex min-w-0 flex-[1_1_480px] items-center justify-center border-t border-line bg-surface px-4 py-12 sm:px-6 sm:py-16 lg:border-l">
        <div className={`flex w-full flex-col gap-7 ${width}`}>{children}</div>
      </section>
    </main>
  );
}
