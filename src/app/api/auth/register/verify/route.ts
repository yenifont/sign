import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRPID, getOrigin } from '@/lib/auth';

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
            const expectedOrigin = getOrigin(request);
            const expectedRPID = getRPID(request);

            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin,
                expectedRPID,
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

        // Log registrationInfo structure for debugging
        console.log('RegistrationInfo received:', {
            keys: Object.keys(registrationInfo),
            hasCredential: !!registrationInfo.credential,
            credentialKeys: registrationInfo.credential ? Object.keys(registrationInfo.credential) : [],
        });

        // Extract data from registrationInfo - structure may vary by SimpleWebAuthn version
        // SimpleWebAuthn v13+ uses registrationInfo.credential structure
        const credential = (registrationInfo as any).credential;

        if (!credential) {
            console.error('No credential found in registrationInfo:', Object.keys(registrationInfo));
            return NextResponse.json({ error: 'Invalid registration response structure' }, { status: 400 });
        }

        const credentialPublicKey = credential.publicKey;
        const credentialID = credential.id; // This is a base64 string
        const counter = credential.counter ?? 0;
        const credentialDeviceType = credential.deviceType || 'unknown';
        const credentialBackedUp = credential.backedUp ?? false;

        // Validate required fields
        if (!credentialPublicKey || !credentialID || counter === undefined) {
            console.error('Missing required registration info:', {
                credentialPublicKey: !!credentialPublicKey,
                credentialID: !!credentialID,
                counter,
                registrationInfoKeys: Object.keys(registrationInfo),
                fullRegistrationInfo: JSON.stringify(registrationInfo, null, 2),
            });
            return NextResponse.json({
                error: 'Invalid registration data',
                details: {
                    hasCredentialPublicKey: !!credentialPublicKey,
                    hasCredentialID: !!credentialID,
                    hasCounter: counter !== undefined,
                }
            }, { status: 400 });
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
