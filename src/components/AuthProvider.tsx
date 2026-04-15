'use client';

import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import type {Session} from '@supabase/supabase-js';
import {createClient} from '@/lib/supabase';
import {UserProfile} from '@/lib/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

interface AuthContextValue {
    session: Session | null;
    profile: UserProfile | null;
    loading: boolean;
    profileLoading: boolean;
    /** Update profile state directly (e.g. after saving from a form). */
    setProfile: (profile: UserProfile | null) => void;
    /** Re-fetch profile from the backend using the current session token. */
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    session: null,
    profile: null,
    loading: true,
    profileLoading: true,
    setProfile: () => {},
    refreshProfile: async () => {},
});

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const supabase = createClient();

    const fetchProfile = useCallback(async (accessToken: string) => {
        setProfileLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                headers: {Authorization: `Bearer ${accessToken}`},
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else {
                // 404 = profile not yet created (e.g. Google OAuth first login)
                setProfile(null);
            }
        } catch {
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (session?.access_token) {
            await fetchProfile(session.access_token);
        }
    }, [session, fetchProfile]);

    useEffect(() => {
        // Handle PKCE auth code that landed on any page (email confirm, OAuth redirect, etc.)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const init = async () => {
            if (code) {
                await supabase.auth.exchangeCodeForSession(code).catch(() => {});
                // Clean up the URL so the code isn't reused
                window.history.replaceState({}, '', window.location.pathname);
            }

            const {data} = await supabase.auth.getSession();
            setSession(data.session);
            setLoading(false);
            if (data.session) {
                fetchProfile(data.session.access_token);
            } else {
                setProfileLoading(false);
            }
        };
        init();

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchProfile(session.access_token);
            } else {
                setProfile(null);
                setProfileLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{session, profile, loading, profileLoading, setProfile, refreshProfile}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
