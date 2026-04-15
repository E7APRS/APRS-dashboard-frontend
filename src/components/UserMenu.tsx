'use client';

import { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface Props {
    profile: UserProfile;
    onSignOut: () => void;
    onProfile: () => void;
}

export default function UserMenu({ profile, onSignOut, onProfile }: Props) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const avatarSrc = profile.avatarUrl
        ? `${BACKEND_URL}${profile.avatarUrl}`
        : null;

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-brand-dark-orange dark:hover:border-brand-orange transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx flex items-center justify-center bg-gray-200 dark:bg-gray-700"
                aria-label="User menu"
            >
                {avatarSrc ? (
                    <img
                        src={avatarSrc}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 font-rajdhani select-none">
                        {initials}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-none z-50 py-1 overflow-hidden">
                    {/* User info header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 font-roboto truncate">
                            {profile.firstName} {profile.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-roboto truncate">
                            {profile.callsign}
                        </p>
                    </div>

                    <button
                        onClick={() => { setOpen(false); onProfile(); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-roboto flex items-center gap-2"
                    >
                        <ProfileIcon />
                        Profile
                    </button>

                    <button
                        onClick={() => { setOpen(false); onSignOut(); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-roboto flex items-center gap-2"
                    >
                        <SignOutIcon />
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

function ProfileIcon() {
    return (
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
    );
}

function SignOutIcon() {
    return (
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
    );
}
