import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS SMAN 2 Padalarang",
  description: "Sistem Informasi Pembelajaran Terpadu SMA Negeri 2 Padalarang",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-sman2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
