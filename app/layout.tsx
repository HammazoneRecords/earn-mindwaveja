import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Earn | MindWave Jamaica",
  description: "Transcribe videos, earn real JMD. Powered by MindWave Jamaica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main style={{ minHeight: "calc(100vh - 60px)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
