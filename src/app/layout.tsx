import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brainwriting — Writers' Room Ideation",
  description: "A real-time collaborative ideation tool for creative teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-bg-primary text-text-primary font-body">
        {children}
      </body>
    </html>
  );
}
