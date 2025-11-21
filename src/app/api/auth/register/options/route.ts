import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticatorTransport } from '@simplewebauthn/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { email } = body;

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Get or create user
    let user = await prisma.user.findUnique({
        where: { email },
        include: { authenticators: true },
    });

    if (!user) {
        user = await prisma.user.create({
            data: { email },
            include: { authenticators: true },
        });
    }

    // 2. Generate registration options
    const options = await generateRegistrationOptions({
        rpName: 'Next.js WebAuthn',
        rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
        userID: user.id,
        userName: user.email,
        // Don't prompt users for additional information about the authenticator
        // (Recommended for smoother UX)
        attestationType: 'none',
        // Prevent users from re-registering existing authenticators
        excludeCredentials: user.authenticators.map((authenticator) => ({
            id: authenticator.credentialID,
            type: 'public-key',
            transports: authenticator.transports
                ? (authenticator.transports.split(',') as AuthenticatorTransport[])
                : undefined,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform', // Optional: Force platform authenticator (TouchID/FaceID)
        },
    } as any);

    // 3. Save challenge to cookie (or DB/Redis)
    // In a real app, use a secure session. Here we use a simple cookie.
    const cookieStore = await cookies();
    cookieStore.set('reg-challenge', options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 5, // 5 minutes
    });

    return NextResponse.json(options);
}
