// components/ProtectedRoute.js
"use client";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
    const [user, loading, error] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
        // If not loading and no user is authenticated, redirect to login
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // If loading, show a simple loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--legal-navy)] text-white">
                Loading session...
            </div>
        );
    }
    
    // If there's a user, render the children components (the actual page)
    if (user) {
        return <>{children}</>;
    }

    // If no user and not loading (e.g., redirecting), render nothing
    return null;
}