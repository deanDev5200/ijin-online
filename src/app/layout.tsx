import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Ijin Online";
const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Sekolah Asrama";

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description:
    "Sistem perizinan asrama digital untuk mengajukan, menyetujui, dan memantau izin siswa.",
  applicationName: appName,
  authors: [{ name: schoolName }],
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        {children}
        <Toaster
          theme="light"
          position="top-center"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
