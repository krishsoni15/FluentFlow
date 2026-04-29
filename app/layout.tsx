import "@/styles/globals.css";
import { Metadata } from "next";
import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";
import { Providers } from "@/components/Providers";
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "FluentFlow - AI Communication Coach",
    template: `%s - FluentFlow`,
  },
  icons: {
    icon: [
      {
        url: "/WhatsApp_Image_2026-04-27_at_7.17.30_PM-removebg-preview%20(1).png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/WhatsApp_Image_2026-04-27_at_7.17.30_PM-removebg-preview%20(1).png",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/WhatsApp_Image_2026-04-27_at_7.17.30_PM-removebg-preview%20(1).png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans`}
      lang="en"
    >
      <head />
      <body className="min-h-screen bg-black text-white" suppressHydrationWarning>
        <Providers>
          <main className="min-h-screen w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
