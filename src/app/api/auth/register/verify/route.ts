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
    let verification;
    try {
        verification = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: 'https://login-one-gilt.vercel.app',
            expectedRPID: 'login-one-gilt.vercel.app',
        });
    } catch (error: any) {
        console.error('Verification error details:', error);
        return NextResponse.json({ 
            error: 'Verification failed: ' + (error.message || 'Unknown error') 
        }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (!verified) {
        return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
    }

    if (!registrationInfo) {
        console.error('Verification succeeded but no registrationInfo returned');
        return NextResponse.json({ error: 'Invalid registration response' }, { status: 400 });
    }

    const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo as any;

        // Validate required fields
        if (!credentialPublicKey || !credentialID || counter === undefined) {
            console.error('Missing required registration info:', { credentialPublicKey: !!credentialPublicKey, credentialID: !!credentialID, counter });
            return NextResponse.json({ error: 'Invalid registration data' }, { status: 400 });
        }

        // 4. Save authenticator to DB
        try {
            // Convert credentialPublicKey to Buffer if it's not already
            let publicKeyBuffer: Buffer;
            if (Buffer.isBuffer(credentialPublicKey)) {
                publicKeyBuffer = credentialPublicKey;
            } else if (credentialPublicKey instanceof Uint8Array) {
                publicKeyBuffer = Buffer.from(credentialPublicKey);
            } else if (Array.isArray(credentialPublicKey)) {
                publicKeyBuffer = Buffer.from(credentialPublicKey);
            } else {
                console.error('Invalid credentialPublicKey type:', typeof credentialPublicKey);
                return NextResponse.json({ error: 'Invalid credential public key format' }, { status: 400 });
            }

            await prisma.authenticator.create({
                data: {
                    credentialID,
                    credentialPublicKey: publicKeyBuffer,
                    counter: BigInt(counter || 0),
                    credentialDeviceType: credentialDeviceType || 'unknown',
                    credentialBackedUp: credentialBackedUp ?? false,
                    transports: response.response?.transports?.join(',') || null,
                    userId: user.id,
                },
            });
        } catch (dbError: any) {
            console.error('Database error:', dbError);
            return NextResponse.json({ error: 'Failed to save authenticator: ' + (dbError.message || 'Unknown error') }, { status: 500 });
        }

        // 5. Clear challenge
        cookieStore.delete('reg-challenge');

        return NextResponse.json({ verified: true });
    } catch (error: any) {
        console.error('Registration verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify registration' },
            { status: 500 }
        );
    }
}
