'use client';

import Image from 'next/image';
import {createClient} from '@/lib/supabase';

export default function LoginPage() {
    const supabase = createClient();

    async function signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-brand-onyx transition-colors">
            {/* Subtle grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(#FF6600 1px, transparent 1px), linear-gradient(90deg, #FF6600 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div
                className="relative bg-white dark:bg-[#111] border border-gray-500/85 dark:border-gray-500/85 rounded-2xl p-10 flex flex-col items-center gap-6 w-80 shadow-xl dark:shadow-none">
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
                <div className="w-full h-px bg-gray-500/85 dark:bg-gray-500/85"/>

                {/* Subtitle */}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-roboto -mt-2">
                    Real-time GPS tracking &amp; position reporting
                </p>

                {/* Sign in */}
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-3 w-full justify-center bg-white dark:bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors font-roboto border border-gray-500 dark:border-gray-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111]"
                >
                    <GoogleIcon/>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"/>
            <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                fill="#34A853"/>
            <path
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"
                fill="#FBBC05"/>
            <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"/>
        </svg>
    );
}
