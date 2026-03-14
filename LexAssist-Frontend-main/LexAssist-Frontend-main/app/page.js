// app/page.js
"use client";
import Image from "next/image";
import Link from "next/link";
// useState is not used, so we can remove it for now
// import { useState } from "react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[Poppins] overflow-x-hidden">
      {/* We will move the Header and Footer to a shared layout file */}

      {/* Hero Section */}
      <section
        className="flex flex-1 justify-center items-center text-center bg-cover bg-center px-4 min-h-[calc(100vh-80px)]" // Ensure it takes up vertical space
        style={{ backgroundImage: "url('/justice.jpg')" }}
      >
        <div className="bg-[var(--legal-navy)]/90 p-8 rounded-xl text-white max-w-xl shadow-xl border border-white/10">
          <h1 className="text-4xl font-semibold mb-4">Your AI-Powered Legal Assistant</h1>
          <p className="text-lg mb-6 text-white/90">Get instant legal insights and document analysis with AI.</p>
          <Link href="/chatbot" className="inline-block bg-[var(--legal-gold)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--legal-gold-hover)] transition-colors shadow-md">
            Ask a Legal Query
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="text-center py-14 bg-[var(--legal-cream)]">
        <h2 className="text-3xl font-semibold mb-10 text-[var(--legal-ink)]">Key Features</h2>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 px-4 md:px-12 max-w-4xl mx-auto">
          <Link href="/chatbot" className="w-full md:w-1/2 group">
            <div className="bg-[var(--legal-navy)] text-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-[var(--legal-navy-light)] transition-all cursor-pointer h-full min-h-[160px] border border-[var(--legal-navy-light)]">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--legal-gold-light)] transition-colors">AI Chatbot</h3>
              <p className="text-white/85 text-sm">Ask legal questions and get AI-powered responses.</p>
            </div>
          </Link>
          <Link href="/document-analyzer" className="w-full md:w-1/2 group">
            <div className="bg-[var(--legal-navy)] text-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-[var(--legal-navy-light)] transition-all cursor-pointer h-full min-h-[160px] border border-[var(--legal-navy-light)]">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--legal-gold-light)] transition-colors">Document Analyzer</h3>
              <p className="text-white/85 text-sm">Upload legal documents for quick analysis.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}