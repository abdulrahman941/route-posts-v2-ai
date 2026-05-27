import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Providers from "@/components/layout/Providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Route Posts",
  description: "Social platform by Route Academy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
