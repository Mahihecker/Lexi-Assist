"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // This path should work correctly
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Good practice to clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/chatbot"); // We will create this page next
    } catch (err) {
      console.error("Login Error:", err); // Log the actual error for debugging
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[var(--legal-cream)]">
      <div className="flex w-4/5 max-w-5xl min-h-[70vh] rounded-2xl overflow-hidden shadow-xl border border-[var(--legal-border)]">
        {/* Left */}
        <div className="w-1/2 bg-[var(--legal-navy)] text-white flex flex-col justify-center items-center px-8 text-center">
          <Image src="/logo.png" alt="Lexi Assist Logo" width={150} height={150} className="mb-6" />
          <h1 className="text-3xl mb-2 font-semibold">Welcome to Lexi Assist</h1>
          <p className="text-base leading-relaxed text-white/90">
            Your AI-powered legal assistant for instant legal insights and document analysis.
          </p>
        </div>

        {/* Right */}
        <div className="w-1/2 bg-white flex flex-col justify-center items-center px-10">
          <h2 className="text-2xl text-[var(--legal-ink)] font-semibold mb-5">Login</h2>
          <form className="w-full" onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="text-[var(--legal-ink)] block font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-[var(--legal-border)] rounded-lg text-black focus:ring-2 focus:ring-[var(--legal-gold)] focus:border-transparent outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="text-[var(--legal-ink)] block font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full p-3 border border-[var(--legal-border)] rounded-lg text-black focus:ring-2 focus:ring-[var(--legal-gold)] focus:border-transparent outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="w-full text-right mb-4">
              <Link href="#" className="text-[var(--legal-gold)] text-sm font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>
            <button type="submit" className="w-full bg-[var(--legal-gold)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--legal-gold-hover)] transition-colors shadow-md">
              Login
            </button>
            <p className="text-[var(--legal-ink)] mt-4 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[var(--legal-gold)] font-semibold hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  
  );
}