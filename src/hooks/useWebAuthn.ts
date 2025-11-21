import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useState } from 'react';

export function useWebAuthn() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const register = async (email: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Get options
            const optionsRes = await fetch('/api/auth/register/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!optionsRes.ok) {
                const errorText = await optionsRes.text();
                throw new Error(errorText || 'Failed to get registration options');
            }

            const options = await optionsRes.json();

            if (options.error) throw new Error(options.error);

            // 2. Start registration
            let attResp;
            try {
                attResp = await startRegistration(options);
            } catch (err: any) {
                if (err.name === 'InvalidStateError') {
                    throw new Error('This device is already registered for this account.');
                }
                if (err.name === 'NotAllowedError') {
                    throw new Error('Registration cancelled or timed out.');
                }
                throw err;
            }

            // 3. Verify registration
            const verifyRes = await fetch('/api/auth/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, response: attResp }),
            });

            if (!verifyRes.ok) {
                const errorText = await verifyRes.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || 'Verification failed');
                } catch {
                    throw new Error(`Verification error: ${verifyRes.status}`);
                }
            }

            const verifyJSON = await verifyRes.json();

            if (verifyJSON.verified) {
                setSuccess('Registration successful! You can now log in.');
            } else {
                throw new Error('Verification failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email?: string) => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Get options (conditional UI if no email)
            const optionsRes = await fetch('/api/auth/login/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!optionsRes.ok) {
                const errorText = await optionsRes.text();
                throw new Error(errorText || 'Failed to get login options');
            }

            const options = await optionsRes.json();

            if (options.error) throw new Error(options.error);

            // 2. Start authentication
            let asseResp;
            try {
                asseResp = await startAuthentication(options);
            } catch (err: any) {
                if (err.name === 'NotAllowedError') {
                    throw new Error('Login cancelled or timed out.');
                }
                throw err;
            }

            // 3. Verify authentication
            const verifyRes = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: asseResp }),
            });

            if (!verifyRes.ok) {
                const errorText = await verifyRes.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || 'Verification failed');
                } catch {
                    throw new Error(`Verification error: ${verifyRes.status}`);
                }
            }

            const verifyJSON = await verifyRes.json();

            if (verifyJSON.verified) {
                setSuccess('Login successful!');
                // Redirect or update state
                window.location.reload();
            } else {
                throw new Error('Verification failed');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return { register, login, loading, error, success };
}
