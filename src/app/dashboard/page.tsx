'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user, loading, logout, checkAuth } = useAuth();
    const { register: registerPasskey, loading: passkeyLoading, error: passkeyError, success: passkeySuccess } = useWebAuthn();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (passkeySuccess) {
            checkAuth();
        }
    }, [passkeySuccess, checkAuth]);

    const handleAddPasskey = async () => {
        if (!user?.email) return;
        try {
            await registerPasskey(user.email);
        } catch (error) {
            console.error('Passkey registration error:', error);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Dashboard
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 mb-6">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'overview'
                                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === 'security'
                                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Security
                        </button>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Overview</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Password</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.hasPassword ? '✓ Set' : '✗ Not set'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Passkey</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.hasPasskey ? `✓ ${user.authenticators.length} device(s)` : '✗ Not set'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h2>
                            
                            {/* Passkey Section */}
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                Passkey Authentication
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Add a passkey for passwordless login using your device's biometric authentication or security key.
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {passkeyError && (
                                        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            {passkeyError}
                                        </div>
                                    )}

                                    {/* Success Message */}
                                    {passkeySuccess && (
                                        <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                            {passkeySuccess}
                                        </div>
                                    )}

                                    {/* Passkey Status */}
                                    {user.hasPasskey && (
                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Registered Devices ({user.authenticators.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {user.authenticators.map((auth, index) => (
                                                    <div key={auth.id} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {auth.deviceType || `Device ${index + 1}`}
                                                        </span>
                                                        <span className="text-green-600 dark:text-green-400">✓ Active</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Passkey Button */}
                                    <button
                                        onClick={handleAddPasskey}
                                        disabled={passkeyLoading}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {passkeyLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Setting up...</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span>{user.hasPasskey ? 'Add Another Passkey' : 'Enable Passkey'}</span>
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

