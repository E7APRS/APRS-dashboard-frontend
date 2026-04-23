'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export default function CompleteProfilePage() {
    const { session, profile, loading, profileLoading, setProfile } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: '',
        qthLocator: '',
        callsign: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // If profile already exists, redirect to home
    if (!loading && !profileLoading && profile) {
        router.replace('/');
        return null;
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const { firstName, lastName, address, city, country, qthLocator, callsign } = form;
        if (!firstName || !lastName || !address || !city || !country || !qthLocator || !callsign) {
            setError('All fields are required.');
            return;
        }

        if (!session) {
            setError('Not authenticated.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email: session.user.email,
                    address,
                    city,
                    country,
                    qthLocator,
                    callsign,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to save profile.');
                return;
            }

            // Update profile in AuthProvider directly — prevents redirect loop
            const savedProfile = await res.json();
            setProfile(savedProfile);

            router.replace('/');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-brand-onyx text-gray-600 dark:text-gray-300">
                Loading...
            </div>
        );
    }

    if (!session) {
        router.replace('/login');
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-brand-onyx transition-colors py-8">
            {/* Grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--brand-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid-color) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative bg-white dark:bg-brand-onyx border border-gray-500/85 dark:border-gray-500/85 rounded-2xl p-8 flex flex-col items-center gap-5 w-96 shadow-xl dark:shadow-none">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2">
                    <Image
                        src="/e7aprs.png"
                        alt="E7APRS"
                        width={64}
                        height={64}
                        className="object-contain"
                        priority
                    />
                    <div className="text-center">
                        <h1 className="font-rajdhani font-bold text-3xl text-gray-800 dark:text-brand-silver tracking-widest uppercase leading-none">
                            E7APRS
                        </h1>
                        <p className="font-rajdhani text-xs text-brand-dark-orange dark:text-brand-orange tracking-widest uppercase mt-0.5">
                            Complete Your Profile
                        </p>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-500/85 dark:bg-gray-500/85" />

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-roboto -mt-2">
                    Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{session.user.email}</span>
                </p>

                {error && (
                    <div className="w-full text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <InputField name="firstName" label="First Name" value={form.firstName} onChange={onChange} />
                        <InputField name="lastName" label="Last Name" value={form.lastName} onChange={onChange} />
                    </div>

                    <InputField name="address" label="Address" value={form.address} onChange={onChange} />
                    <InputField name="city" label="City" value={form.city} onChange={onChange} />
                    <InputField name="country" label="Country" value={form.country} onChange={onChange} />
                    <InputField name="qthLocator" label="QTH Locator" placeholder="e.g. JN94gc" value={form.qthLocator} onChange={onChange} />

                    <InputField
                        name="callsign"
                        label="Callsign"
                        placeholder="e.g. E73ABC"
                        value={form.callsign}
                        onChange={onChange}
                    />

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-1 bg-brand-dark-orange dark:bg-brand-orange text-white font-semibold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity font-roboto disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx"
                    >
                        {submitting ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function InputField({
    name,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
}: {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div>
            <label
                htmlFor={name}
                className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 font-roboto uppercase tracking-wide"
            >
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-onyx text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark-orange dark:focus:ring-brand-orange focus:border-transparent font-roboto"
            />
        </div>
    );
}
