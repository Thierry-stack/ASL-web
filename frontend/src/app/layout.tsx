import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const CHATLING_BOT_ID = "7161629733";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sign Language LMS",
  description: "Learn sign language online — video courses and community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="chtl-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.chtlConfig = { chatbotId: "${CHATLING_BOT_ID}" };`,
          }}
        />
        <Script
          id="chtl-script"
          src="https://chatling.ai/js/embed.js"
          strategy="afterInteractive"
          async
          data-id={CHATLING_BOT_ID}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
