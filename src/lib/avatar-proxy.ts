import { BACKEND_URL } from '@/lib/config';

export const AVATAR_FALLBACK_CACHE_CONTROL = 'no-store';
export const AVATAR_SUCCESS_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function normalizeInitials(initials: string | null | undefined) {
    const cleaned = (initials ?? '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 2)
        .toUpperCase();

    return cleaned || 'AP';
}

export function buildAvatarPlaceholderSvg(initials: string | null | undefined = 'AP') {
    const safeInitials = escapeXml(normalizeInitials(initials));

    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="Avatar placeholder">
            <defs>
                <linearGradient id="avatarBg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#d1d5db" />
                    <stop offset="100%" stop-color="#9ca3af" />
                </linearGradient>
            </defs>
            <rect width="256" height="256" rx="128" fill="url(#avatarBg)" />
            <circle cx="128" cy="102" r="50" fill="rgba(255,255,255,0.58)" />
            <path d="M48 216c15-43 49-64 80-64s65 21 80 64" fill="rgba(255,255,255,0.58)" />
            <text x="128" y="151" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#374151">${safeInitials}</text>
        </svg>
    `.trim();
}

export function buildAvatarFallbackResponse(initials?: string | null) {
    return new Response(buildAvatarPlaceholderSvg(initials), {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': AVATAR_FALLBACK_CACHE_CONTROL,
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'same-origin',
        },
    });
}

function isSafeAvatarPath(pathname: string) {
    if (!pathname.startsWith('/')) return false;
    if (pathname.includes('..') || pathname.includes('\\')) return false;
    if (pathname.includes('#') || pathname.includes('?')) return false;
    return true;
}

export function resolveAvatarTargetUrl(rawSrc: string) {
    const backendUrl = new URL(BACKEND_URL);

    try {
        const absolute = new URL(rawSrc);
        if (absolute.origin !== backendUrl.origin) return null;
        return isSafeAvatarPath(absolute.pathname) ? absolute : null;
    } catch {
        return isSafeAvatarPath(rawSrc) ? new URL(rawSrc, backendUrl.origin) : null;
    }
}

export function buildAvatarRequestUrl(avatarUrl: string | null, updatedAt: string, initials?: string | null) {
    if (!avatarUrl) return null;

    const params = new URLSearchParams({
        src: avatarUrl,
        v: updatedAt,
    });

    if (initials) params.set('initials', initials);

    return `/api/avatar?${params.toString()}`;
}

export async function proxyAvatarResponse(rawSrc: string | null, initials?: string | null) {
    if (!rawSrc) return buildAvatarFallbackResponse(initials);

    const targetUrl = resolveAvatarTargetUrl(rawSrc);
    if (!targetUrl) return buildAvatarFallbackResponse(initials);

    try {
        const res = await fetch(targetUrl, { cache: 'no-store' });
        const contentType = res.headers.get('content-type') ?? '';

        if (!res.ok || !res.body || !contentType.toLowerCase().startsWith('image/')) {
            return buildAvatarFallbackResponse(initials);
        }

        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.byteLength === 0 || bytes.byteLength > AVATAR_MAX_BYTES) {
            return buildAvatarFallbackResponse(initials);
        }

        return new Response(bytes, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(bytes.byteLength),
                'Cache-Control': AVATAR_SUCCESS_CACHE_CONTROL,
                'X-Content-Type-Options': 'nosniff',
                'Cross-Origin-Resource-Policy': 'same-origin',
            },
        });
    } catch {
        return buildAvatarFallbackResponse(initials);
    }
}

