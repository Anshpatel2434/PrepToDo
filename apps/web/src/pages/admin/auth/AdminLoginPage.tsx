import React, { useState } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
    const { login, error: authError } = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login({ email, password });
        } catch (err) {
            // Error handled by hook
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 font-sans text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-xl border border-[#2a2d3a] bg-[#1a1d27] p-8 shadow-2xl"
            >
                <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">Admin Portal</h1>
                <p className="mb-8 text-center text-sm text-[#94a3b8]">Restricted Access Area</p>

                {authError && (
                    <div className="mb-6 rounded-lg border border-red-900/50 bg-red-900/20 p-3 text-center text-sm text-red-200">
                        {authError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                            placeholder="admin@preptodo.app"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-[#2a2d3a] bg-[#0f1117] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-lg bg-[#6366f1] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? 'Verifying...' : 'Authenticate'}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-[#52525b]">
                    <p>Protected by secure session monitoring</p>
                    <p className="mt-1">IP Address Logged</p>
                </div>
            </motion.div>
        </div>
    );
}
