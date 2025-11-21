
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

async function test() {
    console.log('Starting key test...');

    const mockResponse = {
        id: 'AaBbCcDd-_',
        rawId: 'AaBbCcDd-_',
        response: {
            authenticatorData: 'mock-auth-data',
            clientDataJSON: 'mock-client-data',
            signature: 'mock-signature',
            userHandle: 'mock-user-handle'
        },
        type: 'public-key',
        clientExtensionResults: {},
        authenticatorAttachment: 'platform'
    };

    const publicKeyUint8 = new Uint8Array([1, 2, 3, 4, 5]);
    const publicKeyBuffer = Buffer.from([1, 2, 3, 4, 5]);

    const testCases = [
        { name: 'Uint8Array', key: publicKeyUint8 },
        { name: 'Buffer', key: publicKeyBuffer }
    ];

    for (const testCase of testCases) {
        console.log(`Testing with ${testCase.name}...`);
        const mockAuthenticator = {
            credentialID: 'AaBbCcDd-_',
            credentialPublicKey: testCase.key,
            counter: 0,
            transports: undefined
        };

        try {
            await verifyAuthenticationResponse({
                response: mockResponse as any,
                expectedChallenge: 'mock-challenge',
                expectedOrigin: 'https://login-one-gilt.vercel.app',
                expectedRPID: 'login-one-gilt.vercel.app',
                authenticator: mockAuthenticator as any,
                credential: mockAuthenticator as any,
            });
            console.log(`Success with ${testCase.name} (unexpected)`);
        } catch (error: any) {
            console.log(`Error with ${testCase.name}:`, error.message);
            if (error.message.includes('Must declare either "leafCert" or "credentialPublicKey"')) {
                console.log(`REPRODUCED ERROR with ${testCase.name}!`);
            }
        }
    }
}

test();
