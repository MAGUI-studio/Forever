import { ForeverToaster } from "@/components/ui/ForeverToaster";
import {rootMetadata} from "@/lib/seo";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata=rootMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${jakarta.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased bg-[var(--forever-paper,#F1F1F1)] text-[var(--forever-ink,#3D2501)] selection:bg-[var(--forever-sand,#C7B79D)] selection:text-[var(--forever-ink,#3D2501)] w-full overflow-x-hidden">
        <div className="w-full max-w-440 mx-auto relative bg-[var(--forever-paper,#F1F1F1)]">
          {children}
        </div>
        <ForeverToaster />
      </body>
    </html>
  );
}
