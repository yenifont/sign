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
            const options = await optionsRes.json();

            if (options.error) throw new Error(options.error);

            // 2. Start registration
            let attResp;
            try {
                attResp = await startRegistration(options);
            } catch (err: any) {
                if (err.name === 'InvalidStateError') {
                    throw new Error('This device is already registered.');
                }
                throw err;
            }

            // 3. Verify registration
            const verifyRes = await fetch('/api/auth/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, response: attResp }),
            });
            const verifyJSON = await verifyRes.json();

            if (verifyJSON.verified) {
                setSuccess('Registration successful!');
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
            const options = await optionsRes.json();

            if (options.error) throw new Error(options.error);

            // 2. Start authentication
            const asseResp = await startAuthentication(options);

            // 3. Verify authentication
            const verifyRes = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ response: asseResp }),
            });
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
