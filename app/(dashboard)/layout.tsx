import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Budget Manager",
    description: "Manage your finances with ease",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div className="flex min-h-screen">
                    <Sidebar />
                    <main className="flex-1 md:ml-64 p-6 bg-background">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
