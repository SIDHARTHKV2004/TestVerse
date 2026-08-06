import React, { useState } from 'react';

interface RegisterPageProps {
    onNavigate?: (page: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'TESTER',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [requiresApproval, setRequiresApproval] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setRequiresApproval(data.requiresApproval || false);
                setTimeout(() => {
                    onNavigate?.('login');
                }, 4000);
            } else {
                setError(data.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#000000]">
                <div className="w-full max-w-sm p-6 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg text-center">
                    {requiresApproval ? (
                        <>
                            <div className="text-6xl mb-4">⏳</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                            <p className="text-[#666666] text-sm mb-2">
                                Your account has been created and is waiting for admin approval.
                            </p>
                            <p className="text-[#666666] text-sm">
                                You will be able to login once the admin approves your request.
                            </p>
                            <p className="text-xs text-[#444444] mt-4">Redirecting to login...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
                            <p className="text-[#666666] text-sm">Redirecting to login...</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#000000] p-4">
            <div className="w-full max-w-sm p-6 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    <p className="text-sm text-[#666666] mt-1">Join the TestVerse community</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                            placeholder="Enter your name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Username *</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                            placeholder="Choose a username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Password *</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                            placeholder="Create a password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Confirm Password *</label>
                        <input
                            type="password"
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                            placeholder="Confirm your password"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                        >
                            <option value="TESTER">Tester</option>
                            <option value="DEVELOPER">Developer</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-[#666666]">
                        Already have an account?{' '}
                        <button
                            onClick={() => onNavigate?.('login')}
                            className="text-[#ff6b00] hover:text-[#ff8c38] transition-colors"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;