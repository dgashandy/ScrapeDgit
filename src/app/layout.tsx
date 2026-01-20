import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ScrapeDgit - AI-Driven E-commerce Search",
    description: "Find the best products across Indonesian e-commerce platforms using AI-powered search and recommendations.",
    keywords: ["e-commerce", "indonesia", "tokopedia", "shopee", "lazada", "blibli", "bukalapak", "ai", "search"],
    authors: [{ name: "ScrapeDgit" }],
    openGraph: {
        title: "ScrapeDgit - AI-Driven E-commerce Search",
        description: "Find the best products across Indonesian e-commerce platforms",
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
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
