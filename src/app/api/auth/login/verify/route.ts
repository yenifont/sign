import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticatorTransport } from '@simplewebauthn/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { response } = body;

    if (!response) {
        return NextResponse.json({ error: 'Missing response' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const challenge = cookieStore.get('auth-challenge')?.value;

    if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }

    // Find authenticator in DB
    const authenticator = await prisma.authenticator.findUnique({
        where: { credentialID: response.id },
        include: { user: true },
    });

    if (!authenticator) {
        return NextResponse.json({ error: 'Authenticator not found' }, { status: 404 });
    }

    let verification;
    try {
        // Cast to any to bypass potential type mismatch in this specific version
        verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
            expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
            authenticator: {
                credentialID: authenticator.credentialID,
                credentialPublicKey: new Uint8Array(authenticator.credentialPublicKey),
                counter: Number(authenticator.counter),
                transports: authenticator.transports
                    ? (authenticator.transports.split(',') as AuthenticatorTransport[])
                    : undefined,
            },
        } as any);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
        // Update counter
        await prisma.authenticator.update({
            where: { credentialID: authenticator.credentialID },
            data: { counter: BigInt(authenticationInfo.newCounter) },
        });

        // Clear challenge
        cookieStore.delete('auth-challenge');

        // Set session cookie
        cookieStore.set('session', authenticator.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({ verified: true, user: authenticator.user });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
}
