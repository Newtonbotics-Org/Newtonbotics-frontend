"use client";

export default function AuthPageShell({ children, withGrid = true, variant = "default" }) {
  const blobOne = variant === "brand" ? "bg-red-500/10" : "bg-sky-500/15";
  const blobTwo = variant === "brand" ? "bg-indigo-500/10" : "bg-indigo-500/15";

  return (
    <div className="relative min-h-[calc(100svh-5rem)] flex items-center justify-center overflow-visible bg-[#070b12] text-white">
      <div className="absolute inset-0 -z-10">
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

      <div className="relative z-10 w-full container mx-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
          {children}
        </div>
      </div>
    </div>
  );
}
