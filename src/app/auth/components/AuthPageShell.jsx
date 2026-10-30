"use client";

export default function AuthPageShell({ children, withGrid = true, variant = "default" }) {
  const blobOne = "bg-red-500/10";
  const blobTwo = "bg-white/5";

  return (
    <div className="relative min-h-[calc(100svh-5rem)] flex items-center justify-center overflow-x-hidden bg-[#070b12] text-white nb-auth-shell">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -left-10 w-[40rem] h-[40rem] rounded-full ${blobOne} blur-3xl`} />
        <div className={`absolute bottom-[-8rem] right-[-6rem] w-[42rem] h-[42rem] rounded-full ${blobTwo} blur-3xl`} />
        {variant === "brand" && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[900px] rounded-full bg-white/[0.03] blur-3xl" />
        )}
        {withGrid && (
          <div
            className="absolute inset-0 opacity-[0.08] hidden md:block"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "46px 46px",
            }}
          />
        )}
      </div>

      <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 py-6">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[minmax(240px,28rem)_minmax(280px,36rem)] xl:grid-cols-[minmax(280px,32rem)_minmax(320px,42rem)] lg:justify-center lg:items-start lg:gap-10">
          {children}
        </div>
      </div>
    </div>
  );
}
