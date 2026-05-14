import { NextRequest } from 'next/server';
import { proxyAvatarResponse } from '@/lib/avatar-proxy';

export async function GET(request: NextRequest) {
    const src = request.nextUrl.searchParams.get('src');
    const initials = request.nextUrl.searchParams.get('initials');


    return proxyAvatarResponse(src, initials);
}
