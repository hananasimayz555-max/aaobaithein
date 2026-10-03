import type { Metadata, Viewport } from "next";
import { Archivo_Black, DM_Sans } from "next/font/google";
import "./globals.css";

const heading = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-heading" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

// Every page reads live data from the portal, so nothing is prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Aao Baithein · Chal baith, baat kar", template: "%s · Aao Baithein" },
  description:
    "A business community for young Pakistanis. Sit with people who've built something and get real answers on registration, tax, and your first sale.",
};

export const viewport: Viewport = { themeColor: "#14110F" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
