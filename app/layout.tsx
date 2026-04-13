import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Order",
  description: "QR Code Food Ordering System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
