import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthenticatorTransport } from '@simplewebauthn/server';

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
            const publicKey = authenticator.credentialPublicKey instanceof Buffer 
                ? new Uint8Array(authenticator.credentialPublicKey)
                : new Uint8Array(Buffer.from(authenticator.credentialPublicKey));

            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge: challenge,
                expectedOrigin: 'https://login-one-gilt.vercel.app',
                expectedRPID: 'login-one-gilt.vercel.app',
                authenticator: {
                    credentialID: authenticator.credentialID,
                    credentialPublicKey: publicKey,
                    counter: Number(authenticator.counter),
                    transports: authenticator.transports
                        ? (authenticator.transports.split(',') as AuthenticatorTransport[])
                        : undefined,
                },
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

        if (!authenticationInfo) {
            return NextResponse.json({ error: 'Invalid authentication response' }, { status: 400 });
        }

        // Update counter
        try {
            await prisma.authenticator.update({
                where: { credentialID: authenticator.credentialID },
                data: { counter: BigInt(authenticationInfo.newCounter) },
            });
        } catch (dbError: any) {
            console.error('Database update error:', dbError);
            // Continue even if counter update fails
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
