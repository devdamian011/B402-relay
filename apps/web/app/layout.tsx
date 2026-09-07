import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "b402-relay",
  description:
    "An AI agent that autonomously pays for a B402-gated resource, with a live view of the payment flow."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
