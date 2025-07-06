import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persona Chat - AI-Powered Character Conversations",
  description:
    "Create and chat with unique AI personas. Generate diverse characters with distinct personalities, engage in individual or group conversations, and explore creative storytelling through interactive AI characters.",
  keywords: [
    "AI chat",
    "personas",
    "character generation",
    "artificial intelligence",
    "creative storytelling",
    "interactive chat",
    "AI characters",
  ],
  authors: [{ name: "Persona Chat Team" }],
  creator: "Persona Chat",
  publisher: "Persona Chat",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Persona Chat - AI-Powered Character Conversations",
    description:
      "Create and chat with unique AI personas. Generate diverse characters with distinct personalities and engage in creative conversations.",
    siteName: "Persona Chat",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Persona Chat - AI Character Conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Persona Chat - AI-Powered Character Conversations",
    description:
      "Create and chat with unique AI personas. Generate diverse characters with distinct personalities and engage in creative conversations.",
    images: ["/og-image.jpg"],
    creator: "@personachat",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
