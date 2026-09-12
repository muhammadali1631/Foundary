import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "../components/theme-provider";
import Header from "../components/Header";
import { Toaster } from "sonner";
import { LenisProvider } from "../components/LenisProvider";
import StructuredData from "../components/StructuredData";

const SITE_URL = "https://foundary.aurahub.dev/";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Foundary — AI App Builder | Turn a Prompt into a Live App",
    template: "%s | Foundary",
  },
  description:
    "Foundary is the AI app builder that turns a plain-English prompt into a working React + Tailwind app. AI writes the code, installs the right npm packages, and renders a live preview in your browser in under 30 seconds. Start free — no credit card required.",
  keywords: [
    "AI app builder",
    "AI website builder",
    "prompt to app",
    "AI code generator",
    "build apps with AI",
    "AI React app generator",
    "no-code app builder",
    "AI app generator",
    "text to app",
    "turn prompt into app",
    "AI frontend generator",
    "live preview AI builder",
    "Gemini AI app builder",
    "free AI app builder",
  ],
  applicationName: "Foundary",
  creator: "Foundary",
  publisher: "Foundary",
  authors: [{ name: "Foundary", url: new URL(SITE_URL) }],
  category: "developer",
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    siteName: "Foundary",
    url: new URL(SITE_URL),
    title: "Foundary — AI App Builder | Turn a Prompt into a Live App",
    description:
      "Describe your app idea in plain English. Foundary's AI writes React + Tailwind code, installs the packages, and renders a live preview in your browser in seconds. Start free.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foundary — AI App Builder | Turn a Prompt into a Live App",
    description:
      "Describe your app idea in plain English. Foundary's AI writes React + Tailwind code, installs the packages, and renders a live preview in your browser in seconds. Start free.",
    creator: "@Alishahzad2000M",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-short.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Foundary",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Foundary",
  alternateName: "Foundary AI App Builder",
  url: SITE_URL,
  description:
    "Foundary is the AI app builder that turns a plain-English prompt into a working React + Tailwind app with a live preview in your browser.",
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}?prompt={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Foundary",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Foundary is the AI app builder that turns a plain-English prompt into a working React + Tailwind app. AI writes the code, installs the packages, and renders a live preview in your browser.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "10 generations per month. No credit card required.",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "9",
      priceCurrency: "USD",
      description: "50 generations per month, image uploads.",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "29",
      priceCurrency: "USD",
      description:
        "150 generations per month, priority AI, and Pro Agent access.",
    },
  ],
  featureList: [
    "AI app generation from natural language prompts",
    "Live preview powered by Sandpack",
    "Full source code editing",
    "Smart npm package validation",
    "AI error recovery",
    "Image-aware prompts",
    "One-click Vite + React export",
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Foundary",
  url: SITE_URL,
  logo: `${SITE_URL}logo.png`,
  description:
    "Foundary is an AI app builder that turns prompts into production-ready React + Tailwind apps with live preview.",
  sameAs: [
    "https://github.com/muhammadali1631",
    "https://x.com/Alishahzad2000M",
    "https://www.linkedin.com/in/ali-web-dev/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${geistMono.variable} font-sans`}
      >
        <StructuredData data={websiteSchema} />
        <StructuredData data={softwareSchema} />
        <StructuredData data={organizationSchema} />
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LenisProvider>
              <Header />
              <div>{children}</div>
              <Toaster richColors />
            </LenisProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}