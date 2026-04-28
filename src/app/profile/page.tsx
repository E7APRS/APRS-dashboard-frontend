'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { BACKEND_URL } from '@/lib/config';

export default function ProfilePage() {
    const { session, profile, loading, profileLoading, setProfile } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: '',
        qthLocator: '',
    });
    const [formLoaded, setFormLoaded] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Reset image error state when avatar changes (e.g. after upload)
    useEffect(() => {
        setImgError(false);
    }, [profile?.avatarUrl]);

    // Populate form once when profile first loads — not on every profile update
    // (avatar upload calls setProfile which would otherwise reset unsaved edits)
    useEffect(() => {
        if (profile && !formLoaded) {
            setForm({
                firstName: profile.firstName,
                lastName: profile.lastName,
                address: profile.address,
                city: profile.city,
                country: profile.country,
                qthLocator: profile.qthLocator,
            });
            setFormLoaded(true);
        }
    }, [profile, formLoaded]);

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess('');
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!form.firstName || !form.lastName || !form.address || !form.city) {
            setError('First name, last name, address and city are required.');
            return;
        }

        if (!session || !profile) return;

        setSaving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: profile.email,
                    address: form.address,
                    city: form.city,
                    country: form.country,
                    qthLocator: form.qthLocator,
                    callsign: profile.callsign,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to save profile.');
                return;
            }

            const updated = await res.json();
            setProfile(updated);
            setSuccess('Profile updated.');
        } catch {
            setError('Something went wrong.');
        } finally {
            setSaving(false);
        }
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !session) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be under 2 MB.');
            return;
        }

        setError('');
        setUploadingAvatar(true);

        try {
            const dataUrl = await readFileAsDataUrl(file);

            const res = await fetch(`${BACKEND_URL}/api/auth/avatar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ image: dataUrl }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error ?? 'Failed to upload avatar.');
                return;
            }

            const updated = await res.json();
            setProfile(updated);
        } catch {
            setError('Failed to upload avatar.');
        } finally {
            setUploadingAvatar(false);
            // Reset file input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    if (loading || profileLoading) {
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

    if (!profile) {
        router.replace('/complete-profile');
        return null;
    }

    const avatarSrc = profile.avatarUrl
        ? `${BACKEND_URL}${profile.avatarUrl}?v=${encodeURIComponent(profile.updatedAt)}`
        : null;

    const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-brand-onyx transition-colors">
            {/* Grid texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--brand-grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--brand-grid-color) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Top bar */}
            <div className="relative bg-white dark:bg-brand-onyx border-b border-gray-500/85 dark:border-gray-500/85 shadow-sm dark:shadow-none">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-6 py-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-dark-orange dark:hover:text-brand-orange transition-colors font-roboto"
                    >
                        &larr; Back to map
                    </button>
                    <span className="ml-auto">
                        <Image src="/e7aprs.png" alt="E7APRS" width={40} height={40} className="object-contain" />
                    </span>
                </div>
            </div>

            <div className="relative max-w-2xl mx-auto px-6 py-8">
                <div className="bg-white dark:bg-brand-onyx border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
                    {/* Avatar section */}
                    <div className="flex flex-col items-center pt-8 pb-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                {avatarSrc && !imgError ? (
                                    <img
                                        src={avatarSrc}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-400 font-rajdhani select-none">
                                        {initials}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100"
                                aria-label="Change avatar"
                            >
                                <CameraIcon />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                        {uploadingAvatar && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-roboto">Uploading...</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-roboto">
                            Click to change photo
                        </p>
                    </div>

                    {/* Profile form */}
                    <div className="px-6 pb-6">
                        {error && (
                            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="First Name"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={onChange}
                                />
                                <Field
                                    label="Last Name"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={onChange}
                                />
                            </div>

                            <Field
                                label="Address"
                                name="address"
                                value={form.address}
                                onChange={onChange}
                            />

                            <Field
                                label="City"
                                name="city"
                                value={form.city}
                                onChange={onChange}
                            />

                            <Field
                                label="Country"
                                name="country"
                                value={form.country}
                                onChange={onChange}
                                required={false}
                            />

                            <Field
                                label="QTH Locator"
                                name="qthLocator"
                                value={form.qthLocator}
                                onChange={onChange}
                                required={false}
                            />

                            {/* Read-only fields */}
                            <ReadOnlyField label="Email" value={profile.email} />
                            <ReadOnlyField label="Callsign" value={profile.callsign} />

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full mt-2 bg-brand-dark-orange dark:bg-brand-orange text-white font-semibold py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity font-roboto disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark-orange dark:focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-brand-onyx"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    required = true,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
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
                type="text"
                value={value}
                onChange={onChange}
                required={required}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-brand-onyx text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark-orange dark:focus:ring-brand-orange focus:border-transparent font-roboto"
            />
        </div>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 font-roboto uppercase tracking-wide">
                {label}
            </label>
            <div className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-onyx text-gray-500 dark:text-gray-400 font-roboto cursor-not-allowed">
                {value}
            </div>
        </div>
    );
}

function CameraIcon() {
    return (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
    );
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
