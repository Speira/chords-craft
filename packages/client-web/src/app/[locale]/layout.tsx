import type { Metadata } from "next";
import { Geist, Geist_Mono, Prosto_One } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Footer, Header } from "~/components";
import { AuthHeaderNav, AuthProvider } from "~/features/auth";
import { I18nProvider } from "~/lib/next-intl";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const prostoOne = Prosto_One({
  variable: "--font-prosto-one",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Chords Craft",
  description: "Create and share musical chord charts",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/favicon-apple-180x180.png",
  },
};
export const viewport = {
  themeColor: "#556e84", // ✅ correct
};
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return (
    <AuthProvider locale={locale}>
      <ThemeProvider attribute="class">
        <html lang={locale} suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} ${prostoOne.variable} antialiased`}>
            <I18nProvider locale={locale}>
              <Header endNode={<AuthHeaderNav />} />
              {children}
              <Footer />
            </I18nProvider>
          </body>
        </html>
      </ThemeProvider>
    </AuthProvider>
  );
}
