import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/image.jpg";
import LogoDark from "@/assets/image-dark.png";
// import { TeamCarousel } from "@/components/team-carousel";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 w-full flex justify-center border-b border-b-foreground/10 bg-background/80 backdrop-blur">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/protected"}>
                <div className="flex justify-center py-2">
                  {/* Light mode logo */}
                  <Image
                    src={Logo}
                    alt="Logo Light"
                    width={80}
                    height={80}
                    className="block dark:hidden"
                  />

                  {/* Dark mode logo */}
                  <Image
                    src={LogoDark}
                    alt="Logo Dark"
                    width={80}
                    height={80}
                    className="hidden dark:block"
                  />
                </div>
              </Link>
            </div>

            {/* 2. Wrap the Auth logic in Suspense */}
            <Suspense
              fallback={
                <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
              }
            >
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </Suspense>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-1 w-full flex flex-col sm:gap-20 max-w-5xl p-1">
          <Hero />
        </div>
        <Footer />
      </div>
    </main>
  );
}


export function Footer() {
  return (
    // <main className="min-h-screen flex flex-col items-center">
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <footer className="w-full py-16 border-t">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-3">
              <h3 className="text-2xl font-bold">Inventory Management System</h3>
              <h4 className="text-xl font-semibold">
                Department of Trade and Industry
              </h4>
              <p className="text-sm">
                An official platform for monitoring, tracking, and managing office
                assets and equipment to ensure accountability, accuracy, and
                efficient resource utilization.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold">CONTACT INFORMATION</h3>
              <div className="text-sm space-y-1">
                <p>Department of Trade and Industry – Region X</p>
                <p>G/F State Investment Trust Inc. Building</p>
                <p>Tiano–Hayes Streets</p>
                <p>Cagayan de Oro City, Misamis Oriental</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Email:</span>
                <a
                  href="mailto:r10.misamisoriental@dti.gov.ph"
                  className="text-sm hover:text-white transition"
                >
                  r10.misamisoriental@dti.gov.ph
                </a>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://x.com/DtiPhilippines"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black hover:bg-neutral-800 rounded-full p-2 transition"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2H21.5l-7.19 8.21L22.5 22h-6.64l-5.2-6.8L4.5 22H1.244l7.69-8.79L1.5 2h6.8l4.7 6.2L18.244 2zm-2.326 18h1.85L7.6 4h-2l10.318 16z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/DTI.Philippines/"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 rounded-full p-2 transition"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a2 2 0 012-2h3z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@DTI_Philippines"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.54c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
                    <polygon
                      points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                      fill="black"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex justify-between items-center text-xs ">
            <p>
              Developed by{" "}
              <a
                href="https://github.com/3hird-K"
                target="_blank"
                className="font-semibold"
                rel="noreferrer"
              >
                3hirdK
              </a>
            </p>
            <p>
              Powered by{" "}
              <a
                href="https://www.dti.gov.ph/"
                target="_blank"
                className="font-bold"
                rel="noreferrer"
              >
                DTI-Misamis Oriental
              </a>
            </p>

            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </div>
    // {/* </main> */ }
  );
}



export function Hero() {
  return (
    // Increased top padding (pt-20) to give the logo room below the navbar
    <section className="flex flex-col items-center justify-center text-center gap-8 px-6 pt-20 pb-12 sm:gap-10 sm:py-32">

      {/* Title Container */}
      <div className="flex w-full max-w-4xl flex-col items-center space-y-6">
        {/* Title: Using a more aggressive scale for mobile impact */}
        <h1 className="text-4xl font-extrabold tracking-tighter text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Department of Trade and Industry – Misamis Oriental
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