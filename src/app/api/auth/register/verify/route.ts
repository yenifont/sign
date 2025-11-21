import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
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
    // Convert user.id to Buffer to match the userID used in registration
    const expectedUserID = Buffer.from(user.id, 'utf-8');
    
    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: 'https://login-one-gilt.vercel.app',
            expectedRPID: 'login-one-gilt.vercel.app',
            expectedUserID: expectedUserID,
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
    } catch (error: any) {
        console.error('Registration verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify registration' },
            { status: 500 }
        );
    }
}
