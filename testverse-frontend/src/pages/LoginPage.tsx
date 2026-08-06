import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate?: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.message?.includes('PENDING') || err.message?.includes('pending')) {
        setError('⏳ Your account is pending approval. Please wait for the admin to approve your request.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000]">
        <div className="w-full max-w-sm p-6 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#ff6b00] rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-white">TV</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-[#666666] mt-1">Sign in to your TestVerse account</p>
          </div>

          {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#666666] mb-1">Email</label>
              <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00] transition-colors"
                  placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm text-[#666666] mb-1">Password</label>
              <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00] transition-colors"
                  placeholder="Enter your password"
              />
            </div>

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <button
                onClick={() => onNavigate?.('register')}
                className="text-[#ff6b00] hover:text-[#ff8c38] transition-colors"
            >
              Create Account
            </button>
            <button
                onClick={() => onNavigate?.('forgot')}
                className="text-[#666666] hover:text-white transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
            <p className="text-xs text-[#444444] text-center">Demo Accounts:</p>
            <div className="mt-2 space-y-1 text-center">
              <p className="text-xs text-[#666666]">Admin: admin@testverse.com / admin123</p>
              <p className="text-xs text-[#666666]">Student: tester@test.com / tester123</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;