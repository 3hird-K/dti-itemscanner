import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/provider/providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Department of Trade and Industry - Misamis Oriental",
  description:
    "The official Department of Trade and Industry - Misamis Oriental Service Portal.",
  keywords: [
    "DTI",
    "DTI Misamis Oriental",
    "Department of Trade and Industry",
    "Department of Trade and Industry Misamis Oriental",
    "Service",
    "Misamis Oriental",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased overflow-x-hidden`}>
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
