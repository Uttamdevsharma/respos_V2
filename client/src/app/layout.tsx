import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../providers/providers";

export const metadata: Metadata = {
  title: "GastroFlow POS",
  description: "Professional Restaurant POS System for Bangladesh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
