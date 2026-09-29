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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#0062E0] to-[#00B388] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Forgot Password</h1>
            <p className="text-slate-500 text-sm mt-1">We'll send you a password reset link</p>
          </div>

          {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
          )}

          {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Password reset link sent!</p>
                  <p className="text-xs mt-1 text-emerald-600">Check your email for the reset instructions.</p>
                </div>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-10 pr-4 py-2.5 text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 text-sm transition-all"
                    placeholder="you@example.com"
                    required
                    disabled={loading || success}
                />
              </div>
            </div>

            <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#0062E0] hover:bg-[#0050B8] text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              {loading ? 'Sending...' : success ? '✓ Reset Link Sent' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
                to="/login"
                className="text-sm font-medium text-slate-500 hover:text-[#0062E0] transition-colors inline-flex items-center gap-1"
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