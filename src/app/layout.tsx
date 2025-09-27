"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import Navbar from "./components/Navbar";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>
          VeriBite - Verified consumption, predicted one bite at a time
        </title>
        <meta
          name="description"
          content="VeriBite is a Web3 dApp for making and verifying food consumption predictions."
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,168,107,0.15)_1px,_transparent_0)] bg-[size:20px_20px] animate-pulse"></div>
                <div className="relative z-10">
                  <NextTopLoader />
                  <Navbar />
                  <main>{children}</main>
                </div>
              </div>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
