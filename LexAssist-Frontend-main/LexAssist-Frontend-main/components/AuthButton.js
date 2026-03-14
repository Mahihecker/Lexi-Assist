"use client";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth"; // Import the signOut function
import { useRouter } from "next/navigation"; // Import the router

export default function AuthButton() {
    const [user, loading, error] = useAuthState(auth);
    const router = useRouter(); // Initialize the router

    // --- Sign Out Logic ---
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // After signing out, redirect the user to the homepage
            router.push('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // While Firebase is checking the auth state, show a placeholder
    if (loading) {
        return (
            <div className="bg-gray-500 px-4 py-2 rounded animate-pulse w-[88px] h-[36px]"></div>
        );
    }

    return (
        <div>
            {user ? (
                <button 
                    onClick={handleSignOut}
                    className="px-4 py-2 rounded-lg border border-white/40 text-white hover:bg-white/10 transition-colors font-medium"
                >
                    Sign Out
                </button>
            ) : (
                <Link 
                    href="/login" 
                    className="inline-block bg-[var(--legal-gold)] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[var(--legal-gold-hover)] transition-colors shadow-sm"
                >
                    Login
                </Link>
            )}
        </div>
    );
}