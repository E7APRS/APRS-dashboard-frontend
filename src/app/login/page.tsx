'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithGoogle() {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${baseUrl}/auth/callback`,
            },
        });
    }

    async function signInWithPassword(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                return;
            }

            router.replace('/');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-brand-onyx transition-colors">
            {/* Subtle grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--brand-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid-color) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div
                className="relative bg-white dark:bg-brand-onyx border border-gray-500/85 dark:border-gray-500/85 rounded-2xl p-10 flex flex-col items-center gap-6 w-96 shadow-xl dark:shadow-none">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <Image
                        src="/e7aprs.png"
                        alt="E7APRS"
                        width={80}
                        height={80}
                        className="object-contain"
                        priority
                    />
                    <div className="text-center">
                        <h1 className="font-rajdhani font-bold text-4xl text-gray-800 dark:text-brand-silver tracking-widest uppercase leading-none">
                            E7APRS
                        </h1>
                        <p className="font-rajdhani text-xs text-brand-dark-orange dark:text-brand-orange tracking-widest uppercase mt-0.5">
                            DMR &amp; APRS Network
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gray-500/85 dark:bg-gray-500/85" />

                {/* Subtitle */}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-roboto -mt-2">
                    Real-time GPS tracking &amp; position reporting
                </p>

                {error && (
                    <div className="w-full text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 -mt-2">
                        {error}
                    </div>
                )}

                {/* Email / Password form */}
                <form onSubmit={signInWithPassword} className="w-full flex flex-col gap-3 -mt-1">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 font-roboto uppercase tracking-wide"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-onyx text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark-orange dark:focus:ring-brand-orange focus:border-transparent font-roboto"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 font-roboto uppercase tracking-wide"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-onyx text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark-orange dark:focus:ring-brand-orange focus:border-transparent font-roboto"
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-dark-orange dark:bg-brand-orange text-white font-semibold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity font-roboto disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Separator */}
                <div className="w-full flex items-center gap-3 -my-1">
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-roboto uppercase tracking-wide">or</span>
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
                </div>

                {/* Google sign in */}
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-3 w-full justify-center bg-white dark:bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors font-roboto border border-gray-500 dark:border-gray-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx"
                >
                    <GoogleIcon />
                    Sign in with Google
                </button>

                {/* Register link */}
                <p className="text-sm text-gray-500 dark:text-gray-400 font-roboto">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-brand-dark-orange dark:text-brand-orange hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4" />
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853" />
            <path
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"
                fill="#FBBC05" />
            <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335" />
        </svg>
    );
}
