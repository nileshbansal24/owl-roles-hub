import type { Metadata } from "next";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OWL ROLES - Academic Job Board",
  description:
    "Find your next academic position. Browse faculty, research, and administrative roles at top universities worldwide.",
  openGraph: {
    title: "OWL ROLES - Academic Job Board",
    description:
      "Find your next academic position at top universities worldwide.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OWL ROLES - Academic Job Board",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Suspense>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
