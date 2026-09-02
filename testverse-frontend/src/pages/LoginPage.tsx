import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!formData.password.trim()) {
        throw new Error('Password is required');
      }

      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
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
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-[#666666] text-sm mt-1">Login to your TestVerse account</p>
          </div>

          {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#666666] mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-10 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444444] hover:text-[#666666] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                  to="/forgot-password"
                  className="text-sm text-[#666666] hover:text-[#ff6b00] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#666666]">
              Don't have an account?{' '}
              <Link
                  to="/register"
                  className="text-[#ff6b00] hover:underline font-medium hover:text-[#ff8c38] transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <p className="text-xs text-[#666666] text-center">
              🔒 Your account needs <strong className="text-white">admin approval</strong> after registration.
              <br />
              Contact your admin to activate your account.
            </p>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;