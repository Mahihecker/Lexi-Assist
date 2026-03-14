// app/layout.js
"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DocumentProvider } from "@/context/DocumentContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Lexi Assist</title>
      </head>
      <body className={inter.className}>
        <DocumentProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </DocumentProvider>
      </body>
    </html>
  );
}