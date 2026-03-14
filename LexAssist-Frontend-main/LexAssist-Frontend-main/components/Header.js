// components/Header.js
"use client";
import Image from "next/image";
import Link from "next/link";
// useState is not used in your final version, so it can be removed
// import { useState } from "react"; 
import AuthButton from "./AuthButton"; // We will create this next

export default function Header() {
  return (
    <header className="flex justify-between items-center px-6 md:px-12 py-4 bg-[var(--legal-navy)] text-white h-[80px] shadow-md">
      <div className="logo">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Image src="/logo.png" alt="Lexi Assist Logo" width={150} height={150} />
        </Link>
      </div>
      <nav className="relative">
        <ul className="flex items-center space-x-6">
          <li><Link href="/chatbot" className="hover:text-[var(--legal-gold-light)] transition-colors font-medium">AI Chatbot</Link></li>
          <li><Link href="/document-analyzer" className="hover:text-[var(--legal-gold-light)] transition-colors font-medium">Document Analyzer</Link></li>
          <li><Link href="/about" className="hover:text-[var(--legal-gold-light)] transition-colors font-medium">About</Link></li>
          <li><Link href="/contact" className="hover:text-[var(--legal-gold-light)] transition-colors font-medium">Contact</Link></li>
          <li><AuthButton /></li>
        </ul>
      </nav>
    </header>
  );
}