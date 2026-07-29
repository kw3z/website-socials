import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quesz — Links & Socials",
  description: "All my socials, projects, and links in one place. Anime, Arch User, Pixel Art, Games.",
  keywords: ["Quesz", "links", "socials", "developer", "anime", "gaming", "linux"],
  openGraph: {
    title: "Quesz — Links & Socials",
    description: "All my socials, projects, and links in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
