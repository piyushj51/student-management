import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import AppShell from "@/components/AppShell";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Student Management System',
  description: 'A full-stack Next.js student management system built with MUI.',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        <ThemeRegistry>
          <AppShell>{children}</AppShell>
        </ThemeRegistry>
      </body>
    </html>
  );
}
