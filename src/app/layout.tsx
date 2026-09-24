import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import ThemeToggle from "./ThemeToggle";

export const metadata: Metadata = {
  title: "B2C Portal",
  description: "Collect campaign information from B2C/Agents",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <div className="fixed bottom-5 right-5 z-50"><ThemeToggle /></div>
      </body>
    </html>
  );
}
