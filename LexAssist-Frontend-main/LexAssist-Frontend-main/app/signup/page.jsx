// app/signup/page.js

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiClient from "@/lib/apiClient"; // <<< 1. IMPORT THE API CLIENT
import Link from "next/link";
import Image from "next/image";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setError(""); // Clear previous errors

//     if (formData.password !== formData.confirmPassword) {
//       setError("Passwords do not match");
//       return;
//     }

//     try {
//       // Step A: Create the user in Firebase Authentication
//       await createUserWithEmailAndPassword(
//         auth,
//         formData.email,
//         formData.password
//       );

//       // <<< 2. CREATE THE FIRST CHAT ON THE BACKEND
//       // After the user is created, our apiClient can now make an authenticated request.
//       // This creates an empty conversation for the new user, so the chat page isn't blank.
//       await apiClient.post("/chats");

//       // Step B: Redirect to the main application
//       router.push("/chatbot");
//     } catch (err) {
//       if (err.code === "auth/email-already-in-use") {
//         setError("Email is already in use. Try logging in.");
//       } else if (err.code === "auth/invalid-email") {
//         setError("Invalid email format.");
//       } else if (err.code === "auth/weak-password") {
//         setError("Password should be at least 6 characters.");
//       } else {
//         console.error("Signup error:", err);
//         setError("Signup failed. Please try again.");
//       }
//     }
//   };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
    }

    try {
        // Step 1: Create the user in Firebase. This part is working.
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
        );
        
        // --- THE DEFINITIVE FIX ---

        // Step 2: Manually get the ID token from the newly created user.
        // This forces the app to wait until the token is 100% ready.
        const token = await userCredential.user.getIdToken();

        // Step 3: Make the API call, but MANUALLY add the Authorization header.
        // This bypasses any timing issues with the apiClient interceptor.
        await apiClient.post("/chats", 
            {}, // The body of the POST request is empty, which is fine
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        // Step 4: If the API call succeeds, redirect.
        router.push("/chatbot");

    } catch (err) {
        // This will now catch any legitimate errors
        console.error("An error occurred during signup:", err);
        if (err.code === "auth/email-already-in-use") {
            setError("Email is already in use. Try logging in.");
        } else {
            setError("Signup failed. Please check the console and try again.");
        }
    }
  };

  // --- Paste your full JSX component here ---
  return (
    <div className="flex justify-center items-center min-h-screen bg-[var(--legal-cream)] p-6">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-xl rounded-2xl overflow-hidden border border-[var(--legal-border)]">
        {/* Left Section */}
        <div className="w-full md:w-1/2 flex justify-center items-center bg-white p-6">
          <div className="w-full max-w-md p-8">
            <h2 className="text-2xl font-semibold text-[var(--legal-ink)] mb-2">
              Create an Account
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Join Lexi Assist for instant legal insights.
            </p>
            <form onSubmit={handleSignup}>
              <div className="mb-4 text-left">
                <label
                  htmlFor="name"
                  className="block font-medium text-[var(--legal-ink)] mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-[var(--legal-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--legal-gold)] focus:bg-white transition"
                />
              </div>

              <div className="mb-4 text-left">
                <label
                  htmlFor="email"
                  className="block font-medium text-[var(--legal-ink)] mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-[var(--legal-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--legal-gold)] focus:bg-white transition"
                />
              </div>

              <div className="mb-4 text-left">
                <label
                  htmlFor="password"
                  className="block font-medium text-[var(--legal-ink)] mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-[var(--legal-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--legal-gold)] focus:bg-white transition"
                />
              </div>

              <div className="mb-4 text-left">
                <label
                  htmlFor="confirm-password"
                  className="block font-medium text-[var(--legal-ink)] mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  name="confirmPassword"
                  required
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="text-black w-full px-4 py-3 border border-[var(--legal-border)] rounded-lg bg-[var(--legal-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--legal-gold)] focus:bg-white transition"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center mb-2">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-[var(--legal-gold)] text-white py-3 rounded-lg text-lg font-semibold mt-4 hover:bg-[var(--legal-gold-hover)] shadow-md transition-colors"
              >
                Sign Up
              </button>

              <p className="text-[var(--legal-ink)] text-sm mt-4 text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[var(--legal-gold)] font-semibold hover:underline"
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 bg-[var(--legal-navy)] text-white flex flex-col justify-center items-center p-8 text-center">
          <div className="mb-5">
            <Image
              src="/logo.png"
              alt="Lexi Assist Logo"
              width={150}
              height={150}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Lexi Assist</h1>
          <p className="text-base leading-relaxed">
            Unlock the power of AI-driven legal assistance and document
            analysis.
          </p>
        </div>
      </div>
    </div>
  );
}