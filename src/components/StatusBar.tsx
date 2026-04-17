'use client';

import Image from 'next/image';
import UserMenu from './UserMenu';
import {UserProfile} from '@/lib/types';

interface Props {
    connected: boolean;
    activeSources: string[];
    deviceCount: number;
    profile: UserProfile;
    onSignOut: () => void;
    onProfile: () => void;
    onSettings: () => void;
}

export default function StatusBar({connected, activeSources, deviceCount, profile, onSignOut, onProfile, onSettings}: Props) {
    return (
        <header
            className="relative z-[1100] flex items-center gap-4 px-4 py-0 bg-white dark:bg-brand-onyx border-b border-gray-500/85 dark:border-gray-500/85 text-xs text-gray-600 dark:text-gray-400 h-20 flex-shrink-0 shadow-sm dark:shadow-none">
            {/* Brand identity */}
            <div className="flex items-center gap-2.5 mr-2">
                <Image
                    src="/e7aprs.png"
                    alt="E7APRS"
                    width={93}
                    height={93}
                    className="object-contain"
                    priority
                />
                <div className="flex flex-col leading-none">
          <span
              className="font-rajdhani font-bold text-[24px] text-base text-gray-700 dark:text-brand-silver tracking-widest uppercase">
            E7APRS
          </span>
                    <span
                        className="font-rajdhani text-[12px] text-brand-dark-orange dark:text-brand-orange tracking-widest uppercase">
            DMR &amp; APRS Network
          </span>
                </div>
            </div>

            {/* Divider */}
            <span className="w-px h-6 bg-gray-500/85 dark:bg-gray-500/85"/>

            {/* Connection status */}
            <div className="flex items-center gap-1.5">
        <span
            className={`inline-block w-2 h-2 rounded-full ring-1 ring-brand-onyx/70 dark:ring-white/70 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        />
                <span className={connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
            </div>

            {activeSources.length > 0 && (
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 dark:text-gray-500">|</span>
                    <span>
            Sources:{' '}
                        <span
                            className="text-brand-onyx dark:text-brand-silver font-medium">{activeSources.join(', ')}</span>
          </span>
                </div>
            )}

            <div className="flex items-center gap-1.5">
                <span className="text-gray-500 dark:text-gray-500">|</span>
                <span>
          Devices: <span className="text-brand-dark-orange dark:text-brand-orange font-semibold">{deviceCount}</span>
        </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <UserMenu profile={profile} onSignOut={onSignOut} onProfile={onProfile} onSettings={onSettings} />
            </div>
        </header>
    );
}
