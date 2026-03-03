import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import AppBootstrap from "@/app/_component/AppBootstrap";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boilerplate SNS",
  description: "SNS frontend backed by the API gateway.",
};

type Props = {
  children: ReactNode;
};
export default function RootLayout({
  children,
}: Props) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
