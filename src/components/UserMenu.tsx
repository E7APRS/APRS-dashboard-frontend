'use client';

import { useEffect, useRef, useState } from 'react';
import { UserProfile } from '@/lib/types';
import { BACKEND_URL } from '@/lib/config';

interface Props {
    profile: UserProfile;
    onSignOut: () => void;
    onProfile: () => void;
    onSettings: () => void;
}

export default function UserMenu({ profile, onSignOut, onProfile, onSettings }: Props) {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Reset error state when avatarUrl changes (e.g. after upload)
    useEffect(() => {
        setImgError(false);
    }, [profile.avatarUrl]);

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
        ? `${BACKEND_URL}${profile.avatarUrl}?v=${encodeURIComponent(profile.updatedAt)}`
        : null;

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-brand-dark-orange dark:hover:border-brand-orange transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx flex items-center justify-center bg-gray-200 dark:bg-gray-700"
                aria-label="User menu"
            >
                {avatarSrc && !imgError ? (
                    <img
                        src={avatarSrc}
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 font-rajdhani select-none">
                        {initials}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-brand-onyx border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-none z-50 py-1 overflow-hidden">
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
                        onClick={() => { setOpen(false); onSettings(); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-roboto flex items-center gap-2"
                    >
                        <SettingsIcon />
                        Settings
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

function SettingsIcon() {
    return (
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.248a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
