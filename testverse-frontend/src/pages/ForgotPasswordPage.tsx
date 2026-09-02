import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!email.trim()) {
        throw new Error('Email is required');
      }

      // TODO: Call backend API to send reset password email
      // For now, simulate success
      console.log('📤 Forgot password request for:', email);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setError(null);

    } catch (err: any) {
      console.error('❌ Forgot password error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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
            <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
            <p className="text-[#666666] text-sm mt-1">We'll send you a reset link</p>
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
                <div>
                  <p>✅ Password reset link sent!</p>
                  <p className="text-xs mt-1">Check your email for the reset link.</p>
                </div>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#666666] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" size={18} />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#444444] focus:outline-none focus:border-[#ff6b00]"
                    placeholder="you@example.com"
                    required
                    disabled={loading || success}
                />
              </div>
            </div>

            <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : success ? '✅ Sent!' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
                to="/login"
                className="text-sm text-[#666666] hover:text-[#ff6b00] transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
  );
};

export default ForgotPasswordPage;