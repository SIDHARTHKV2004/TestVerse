import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';

// ─── Shared input base ────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'rgba(2,4,10,0.7)',
  border: '1px solid rgba(56,189,248,0.12)',
  borderRadius: '10px',
  padding: '11px 14px 11px 42px',
  color: '#ffffff',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // ── Focus-aware input style ──────────────────────────────────────────────
  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === name ? '#38BDF8' : 'rgba(56,189,248,0.12)',
    boxShadow: focusedField === name
      ? '0 0 0 2px rgba(56,189,248,0.16), 0 0 14px rgba(56,189,248,0.08)'
      : 'none',
  });

  // ── Login handler (unchanged) ────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.password.trim()) throw new Error('Password is required');

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
    <AuthBackground
      headline="TEST. BUILD. SHIP."
      subtitle="Your workspace for software quality."
    >
      {/* ═══════════════════════════════════════════════════════════════════
          GLASS AUTH CARD
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'rgba(5,8,22,0.82)',
          border: '1px solid rgba(56,189,248,0.14)',
          borderRadius: '18px',
          padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `
            0 0 0 1px rgba(56,189,248,0.04),
            0 4px 60px rgba(0,0,0,0.7),
            0 0 80px rgba(56,189,248,0.04),
            inset 0 1px 0 rgba(255,255,255,0.04)
          `,
        }}
      >
        {/* ── Card header ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>

          {/* Auth badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(56,189,248,0.07)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '18px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#38BDF8',
                display: 'inline-block',
                boxShadow: '0 0 6px #38BDF8',
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#38BDF8',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              SECURE LOGIN
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '22px',
              color: '#ffffff',
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#64748B',
              margin: 0,
            }}
          >
            Sign in to your TestVerse account
          </p>
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              padding: '10px 13px',
              marginBottom: '22px',
              color: '#F87171',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Email */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '7px',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusedField === 'email' ? '#38BDF8' : '#334155',
                  transition: 'color 0.2s',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={fieldStyle('email')}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '7px',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{
                  position: 'absolute',
                  left: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: focusedField === 'password' ? '#38BDF8' : '#334155',
                  transition: 'color 0.2s',
                  pointerEvents: 'none',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('password'), paddingRight: '42px' }}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#334155')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginTop: '-10px' }}>
            <Link
              to="/forgot-password"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: '#475569',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38BDF8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? 'rgba(56,189,248,0.4)'
                : 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 60%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: loading ? 'rgba(255,255,255,0.7)' : '#000000',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.15s',
              letterSpacing: '0.01em',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = '0 0 28px rgba(56,189,248,0.45), 0 0 60px rgba(59,130,246,0.2)';
                btn.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.boxShadow = 'none';
              btn.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '26px',
            paddingTop: '22px',
            borderTop: '1px solid rgba(56,189,248,0.07)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#334155', margin: 0 }}>
            No account yet?{' '}
            <Link
              to="/register"
              style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7DD3FC')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#38BDF8')}
            >
              Create account
            </Link>
          </p>
        </div>

        {/* ── Admin approval note ──────────────────────────────────────── */}
        <div
          style={{
            marginTop: '16px',
            background: 'rgba(56,189,248,0.03)',
            border: '1px solid rgba(56,189,248,0.07)',
            borderRadius: '8px',
            padding: '10px 13px',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: '#1E293B',
              margin: 0,
              textAlign: 'center',
              letterSpacing: '0.04em',
            }}
          >
            🔒 ACCOUNT REQUIRES{' '}
            <span style={{ color: '#334155' }}>ADMIN APPROVAL</span>
            {' '}AFTER REGISTRATION
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};

export default LoginPage;