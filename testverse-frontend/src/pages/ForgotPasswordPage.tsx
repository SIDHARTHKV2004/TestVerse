import React, { useState } from 'react';

interface ForgotPasswordPageProps {
  onNavigate?: (page: string) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // This is a placeholder - implement actual password reset API
      // const response = await fetch('http://localhost:8080/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes, always show success
      setSuccess(true);
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#000000]">
          <div className="w-full max-w-sm p-6 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-[#666666] text-sm mb-4">
                We've sent password reset instructions to <strong className="text-white">{email}</strong>
              </p>
              <button
                  onClick={() => onNavigate?.('login')}
                  className="text-[#ff6b00] hover:text-[#ff8c38] transition-colors text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="flex items-center justify-center min-h-screen bg-[#000000] p-4">
        <div className="w-full max-w-sm p-6 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
            <p className="text-sm text-[#666666] mt-1">
              Enter your email to receive reset instructions
            </p>
          </div>

          {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#666666] mb-1">Email Address</label>
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                  placeholder="Enter your email"
              />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
                onClick={() => onNavigate?.('login')}
                className="text-sm text-[#666666] hover:text-white transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
  );
};

export default ForgotPasswordPage;