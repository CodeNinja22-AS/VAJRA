import type { Metadata } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import 'mapbox-gl/dist/mapbox-gl.css';

// Fix font import
import { Inter as InterFont } from "next/font/google";
const inter = InterFont({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VAJRA - AI Weather Nowcasting",
  description: "AI Weather Nowcasting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
