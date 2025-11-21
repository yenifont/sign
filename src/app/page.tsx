'use client';

import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useState, useEffect } from 'react';

export default function Home() {
    const { register, login, loading, error, success } = useWebAuthn();
    const [email, setEmail] = useState('');

    // Activate Conditional UI on mount
    useEffect(() => {
        // Start authentication with no email to trigger autofill
        login();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                    Passkey Login
                </h1>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-100">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-100">
                        {success}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="username webauthn"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="name@example.com"
                        />
                    </div>

                    <button
                        onClick={() => register(email)}
                        disabled={loading || !email}
                        className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Register New Passkey'}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-500 bg-white dark:bg-gray-800">
                                or
                            </span>
                        </div>
                    </div>

                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                        Click the email field to sign in with an existing Passkey.
                    </p>
                </div>
            </div>
        </main>
    );
}
