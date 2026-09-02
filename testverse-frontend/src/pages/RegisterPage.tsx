import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Mail, Lock, User, UserCog, AlertCircle, CheckCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'DEVELOPER'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate
        if (!formData.name.trim()) {
            setError('Name is required');
            setLoading(false);
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role
            };

            console.log('📤 Registering user:', userData);
            const response = await register(userData);
            console.log('📥 Registration response:', response);

            setSuccess(true);
            setError(null);

            // Show success message
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err: any) {
            console.error('❌ Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#ff6b00] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                    <p className="text-[#666666] text-sm mt-1">Join TestVerse - Software Testing Learn</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-start gap-2">
                        <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
              ✅ Registration successful!
              <br />
              Please wait for admin approval. You will receive an email when approved.
              <br />
              <span className="text-xs">Redirecting to login...</span>
            </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                                placeholder="John Doe"
                                required
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                                placeholder="you@example.com"
                                required
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                                placeholder="Min 6 characters"
                                required
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                                placeholder="Confirm your password"
                                required
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm text-[#666666] mb-1">Role</label>
                        <div className="relative">
                            <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#ff6b00]"
                                disabled={loading || success}
                            >
                                <option value="DEVELOPER">Developer</option>
                                <option value="TESTER">Tester</option>
                            </select>
                        </div>
                        <p className="text-[10px] text-[#666666] mt-1">
                            ⚡ Admin role can only be assigned by existing admin
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : success ? '✅ Registered!' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-[#666666] mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#ff6b00] hover:underline">
                        Login
                    </Link>
                </p>

                <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    <p className="text-xs text-[#666666] text-center">
                        📝 After registration, you'll need <strong className="text-white">admin approval</strong> to login.
                        <br />
                        Contact your admin to approve your account.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;