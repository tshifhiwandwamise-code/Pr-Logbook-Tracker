import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pr Logbook Tracker",
  description:
    "Professional Registration Intelligence Platform for ECSA PrEng and SACPCMP PrCM candidates.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <a className="skip-to-content" href="#main">
          Skip to content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
