import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Topaz Upscaling - Image Enhancement Techniques",
  description: "Manual upscaling techniques: Bicubic, Sharpening, Edge-Aware, Frequency Separation",
  keywords: "upscaling, image enhancement, bicubic interpolation, sharpening, edge detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
