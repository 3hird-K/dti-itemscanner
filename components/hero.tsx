export function Hero() {
  return (
    // Increased top padding (pt-20) to give the logo room below the navbar
    <section className="flex flex-col items-center justify-center text-center gap-8 px-6 pt-20 pb-12 sm:gap-10 sm:py-32">

      {/* Title Container */}
      <div className="flex w-full max-w-4xl flex-col items-center space-y-6">
        {/* Title: Using a more aggressive scale for mobile impact */}
        <h1 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Department of Trade and Industry – Cagayan de Oro City
        </h1>

        <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:max-w-xl sm:text-lg md:text-xl">
          Manage and monitor{" "}
          <span className="font-semibold text-primary">office assets,</span>{" "}
          oversee <span className="font-semibold text-primary">inventory records,</span>{" "}
          and maintain{" "}
          <span className="font-semibold text-primary">accurate equipment tracking</span>{" "}
          through a centralized digital system.
        </p>

        <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground/60 sm:max-w-2xl sm:text-base">
          An official inventory management platform of the Department of Trade and
          Industry, designed to support efficient asset monitoring, secure
          documentation, and transparent reporting of office resources.
        </p>
      </div>

      {/* Gradient Divider: More vibrant to separate from the Team section */}
      <div className="mt-4 h-px w-full max-w-[100px] bg-gradient-to-r from-transparent via-primary/50 to-transparent sm:max-w-md" />

    </section>
  );
}