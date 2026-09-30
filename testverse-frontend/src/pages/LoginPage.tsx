import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';

// ─── Shared input base matching Registration styling ─────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #CBD5E1',
  borderRadius: '10px',
  padding: '11px 14px 11px 42px',
  color: '#0F172A',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ email: string; password: string }>({
    email: '',
    password: '',
  });

  // ── Focus-aware input style ────────────────────────────────────────────────
  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === name ? '#0062E0' : '#CBD5E1',
    boxShadow: focusedField === name
      ? '0 0 0 3px rgba(0, 98, 224, 0.12)'
      : 'none',
  });

  // ── Reusable label style ──────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '7px',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  };

  // ── Icon inside input ─────────────────────────────────────────────────────
  const iconStyle = (name: string): React.CSSProperties => ({
    position: 'absolute',
    left: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: focusedField === name ? '#0062E0' : '#94A3B8',
    transition: 'color 0.2s',
    pointerEvents: 'none',
  });

  // ── Login Handler (Preserving all auth & routing logic) ───────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.password.trim()) throw new Error('Password is required');

      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('❌ Login error:', err);
      if (err instanceof Error) {
        setError(err.message || 'Login failed. Please verify your credentials.');
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      {/* ═══════════════════════════════════════════════════════════════════
          AUTH CARD (VISUAL TWIN TO REGISTRATION CARD)
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '32px 32px',
          boxShadow: '0 20px 40px -15px rgba(0, 98, 224, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* ── Card header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '20px',
              padding: '4px 12px',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0062E0',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(0, 98, 224, 0.4)',
              }}
            />
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#0062E0',
                letterSpacing: '0.12em',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              ACCOUNT LOGIN
            </span>
          </div>

          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '22px',
              color: '#0F172A',
              margin: '0 0 6px',
              letterSpacing: '-0.01em',
            }}
          >
            Sign in
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', margin: 0 }}>
            Welcome back — enter your credentials to access TestVerse
          </p>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '10px 13px',
              marginBottom: '20px',
              color: '#DC2626',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Login Form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email Address */}
          <div>
            <label htmlFor="login-email" style={labelStyle}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle('email')} />
              <input
                id="login-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={fieldStyle('email')}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
              <label htmlFor="login-password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#0062E0',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0050B8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#0062E0')}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle('password')} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('password'), paddingRight: '42px' }}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '13px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              background: loading
                ? '#E2E8F0'
                : 'linear-gradient(135deg, #0062E0 0%, #00B388 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: loading ? '#94A3B8' : '#ffffff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.15s',
              letterSpacing: '0.01em',
              opacity: loading ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = '0 10px 25px -5px rgba(0, 98, 224, 0.35)';
                btn.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.boxShadow = 'none';
              btn.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '20px',
            borderTop: '1px solid #F1F5F9',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', margin: 0 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#0062E0', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0050B8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0062E0')}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};

export default LoginPage;