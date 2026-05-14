import { buildAvatarRequestUrl } from '@/lib/avatar-proxy';

export function buildAvatarSrc(avatarUrl: string | null, updatedAt: string, initials?: string | null) {
    return buildAvatarRequestUrl(avatarUrl, updatedAt, initials);
}
