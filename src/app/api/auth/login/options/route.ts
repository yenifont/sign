import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticatorTransport } from '@simplewebauthn/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { email } = body;

    let user;
    if (email) {
        user = await prisma.user.findUnique({
            where: { email },
            include: { authenticators: true },
        });
    }

    const options = await generateAuthenticationOptions({
        rpID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
        allowCredentials: user?.authenticators.map((authenticator) => ({
            id: authenticator.credentialID,
            type: 'public-key',
            transports: authenticator.transports
                ? (authenticator.transports.split(',') as AuthenticatorTransport[])
                : undefined,
        })),
        userVerification: 'preferred',
    });

    const cookieStore = await cookies();
    cookieStore.set('auth-challenge', options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 5,
    });

    return NextResponse.json({ ...options, mediation: email ? 'optional' : 'conditional' });
}
