import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticatorTransport } from '@simplewebauthn/server';
import { getRPID, getOrigin } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { response } = body;

        if (!response) {
            return NextResponse.json({ error: 'Missing response' }, { status: 400 });
        }

        if (!response.id) {
            return NextResponse.json({ error: 'Missing credential ID in response' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const challenge = cookieStore.get('auth-challenge')?.value;

        if (!challenge) {
            return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
        }

        // Find authenticator in DB - response.id is base64 string
        const authenticator = await prisma.authenticator.findUnique({
            where: { credentialID: response.id },
            include: { user: true },
        });

        if (!authenticator) {
            console.error('Authenticator not found for ID:', response.id);
            return NextResponse.json({ error: 'Authenticator not found. Please register a passkey first.' }, { status: 404 });
        }

        let verification;
        try {
            // Convert credentialPublicKey from Buffer to Uint8Array
            const publicKey = new Uint8Array(authenticator.credentialPublicKey);

            // Ensure counter is a valid number
            const counterValue = authenticator.counter
                ? (typeof authenticator.counter === 'bigint'
                    ? Number(authenticator.counter)
                    : Number(authenticator.counter))
                : 0;

            const authenticatorObj = {
                credentialID: authenticator.credentialID,
                credentialPublicKey: publicKey,
                counter: counterValue,
                transports: authenticator.transports
                    ? (authenticator.transports.split(',') as AuthenticatorTransport[])
                    : undefined,
            };



            const expectedOrigin = getOrigin(request);
            const expectedRPID = getRPID(request);

            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin,
                expectedRPID,
                authenticator: authenticatorObj,
            } as any);
        } catch (error: any) {
            console.error('Verification error details:', error);
            return NextResponse.json({
                error: 'Verification failed: ' + (error.message || 'Unknown error')
            }, { status: 400 });
        }

        const { verified, authenticationInfo } = verification;

        if (!verified) {
            return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
        }

        // Log authenticationInfo structure for debugging
        console.log('AuthenticationInfo received:', {
            hasAuthenticationInfo: !!authenticationInfo,
            authenticationInfoKeys: authenticationInfo ? Object.keys(authenticationInfo) : [],
            authenticationInfo: authenticationInfo,
        });

        // Update counter if authenticationInfo exists and has newCounter
        if (authenticationInfo) {
            try {
                // SimpleWebAuthn v13+ uses authenticationInfo.newCounter
                const newCounter = (authenticationInfo as any).newCounter ?? (authenticationInfo as any).counter;

                if (newCounter !== undefined) {
                    await prisma.authenticator.update({
                        where: { credentialID: authenticator.credentialID },
                        data: { counter: BigInt(newCounter) },
                    });
                } else {
                    console.warn('No counter found in authenticationInfo, skipping counter update');
                }
            } catch (dbError: any) {
                console.error('Database update error:', dbError);
                // Continue even if counter update fails
            }
        } else {
            console.warn('No authenticationInfo returned, skipping counter update');
        }

        // Clear challenge
        cookieStore.delete('auth-challenge');

        // Set session cookie
        cookieStore.set('session', authenticator.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({
            verified: true,
            user: {
                id: authenticator.user.id,
                email: authenticator.user.email,
            }
        });
    } catch (error: any) {
        console.error('Login verify error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to verify authentication' },
            { status: 500 }
        );
    }
}
