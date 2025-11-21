import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    const body = await request.json();
    const { email, response } = body;

    if (!email || !response) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Retrieve challenge from cookie
    const cookieStore = await cookies();
    const challenge = cookieStore.get('reg-challenge')?.value;

    if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Verify registration
    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000',
            expectedRPID: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo as any;

        // 4. Save authenticator to DB
        await prisma.authenticator.create({
            data: {
                credentialID,
                credentialPublicKey: Buffer.from(credentialPublicKey),
                counter: BigInt(counter),
                credentialDeviceType,
                credentialBackedUp,
                transports: response.response.transports?.join(',') || null,
                userId: user.id,
            },
        });

        // 5. Clear challenge
        cookieStore.delete('reg-challenge');

        return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
}
