import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Mail, Lock, User, UserCog, AlertCircle, CheckCircle, GraduationCap, Eye, EyeOff } from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';

// ─── Mentor interface ─────────────────────────────────────────────────────────
interface Mentor {
  id: string;
  name: string;
}

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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mentorId, setMentorId] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'DEVELOPER',
  });

  // ── Focus-aware input style ────────────────────────────────────────────────
  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === name ? '#38BDF8' : 'rgba(56,189,248,0.12)',
    boxShadow: focusedField === name
      ? '0 0 0 2px rgba(56,189,248,0.16), 0 0 14px rgba(56,189,248,0.08)'
      : 'none',
  });

  // ── Load mentors on role change ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const targetDepartment = formData.role === 'TESTER' ? 'TESTING' : 'DEVELOPMENT';

    const loadMentors = async () => {
      setMentorsLoading(true);
      try {
        const fetchedMentors = await authApi.getMentorsByDepartment(targetDepartment);
        if (isMounted) setMentors(fetchedMentors || []);
      } catch (err) {
        console.error('Failed to load mentors:', err);
        if (isMounted) setMentors([]);
      } finally {
        if (isMounted) setMentorsLoading(false);
      }
    };

    setMentorId('');
    loadMentors();
    return () => { isMounted = false; };
  }, [formData.role]);

  // ── Error helper — always scrolls even if same message ────────────────────
  const showError = (message: string) => {
    setError(message);
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  // ── Form submission (unchanged) ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) { showError('Name is required'); setLoading(false); return; }
    if (!formData.email.trim()) { showError('Email is required'); setLoading(false); return; }
    if (formData.password.length < 6) { showError('Password must be at least 6 characters'); setLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { showError('Passwords do not match'); setLoading(false); return; }

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };
      console.log('📤 Registering user:', userData);
      const response = await register(userData);
      console.log('📥 Registration response:', response);

      setSuccess(true);
      setError(null);
      setTimeout(() => { navigate('/login'); }, 3000);

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      showError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    color: focusedField === name ? '#38BDF8' : '#334155',
    transition: 'color 0.2s',
    pointerEvents: 'none',
  });

  return (
    <AuthBackground
      headline="TEST. BUILD. SHIP."
      subtitle="Join the TestVerse workspace."
    >
      {/* ═══════════════════════════════════════════════════════════════════
          GLASS AUTH CARD
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: 'rgba(5,8,22,0.82)',
          border: '1px solid rgba(56,189,248,0.14)',
          borderRadius: '18px',
          padding: '32px 32px',
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
        {/* ── Card header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: 'rgba(56,189,248,0.07)',
              border: '1px solid rgba(56,189,248,0.2)',
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
              NEW ACCOUNT
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
            Create account
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#64748B', margin: 0 }}>
            Join TestVerse — Software Testing Workspace
          </p>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div
            ref={errorRef}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              padding: '10px 13px',
              marginBottom: '20px',
              color: '#F87171',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Success ───────────────────────────────────────────────────── */}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: 'rgba(34,197,94,0.07)',
              border: '1px solid rgba(34,197,94,0.22)',
              borderRadius: '10px',
              padding: '10px 13px',
              marginBottom: '20px',
              color: '#4ADE80',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              Registration successful! Awaiting admin approval.{' '}
              <span style={{ opacity: 0.65 }}>Redirecting to login...</span>
            </span>
          </div>
        )}

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={iconStyle('name')} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={fieldStyle('name')}
                placeholder="John Doe"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={iconStyle('email')} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={fieldStyle('email')}
                placeholder="you@example.com"
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle('password')} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('password'), paddingRight: '42px' }}
                placeholder="Min 6 characters"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: '13px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#334155',
                  display: 'flex', alignItems: 'center', padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#334155')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={iconStyle('confirmPassword')} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('confirmPassword'), paddingRight: '42px' }}
                placeholder="Confirm your password"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: '13px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#334155',
                  display: 'flex', alignItems: 'center', padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#334155')}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={labelStyle}>Role</label>
            <div style={{ position: 'relative' }}>
              <UserCog size={15} style={iconStyle('role')} />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                onFocus={() => setFocusedField('role')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...fieldStyle('role'),
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
                disabled={loading || success}
              >
                <option value="DEVELOPER">Developer</option>
                <option value="TESTER">Tester</option>
              </select>
            </div>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#1E293B',
                marginTop: '5px',
                letterSpacing: '0.04em',
              }}
            >
              ⚡ ADMIN ROLE — ASSIGNED BY EXISTING ADMIN ONLY
            </p>
          </div>

          {/* Mentor */}
          <div>
            <label style={labelStyle}>Mentor</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={15} style={iconStyle('mentor')} />
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                onFocus={() => setFocusedField('mentor')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...fieldStyle('mentor'),
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: mentorsLoading ? 'wait' : 'pointer',
                  opacity: mentorsLoading ? 0.55 : 1,
                }}
                disabled={loading || success || mentorsLoading}
              >
                <option value="">
                  {mentorsLoading
                    ? 'Loading mentors...'
                    : mentors.length === 0
                    ? 'No mentors available'
                    : 'Select a Mentor'}
                </option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              marginTop: '4px',
              width: '100%',
              background: loading || success
                ? 'rgba(56,189,248,0.4)'
                : 'linear-gradient(135deg, #38BDF8 0%, #3B82F6 60%, #8B5CF6 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: loading || success ? 'rgba(255,255,255,0.7)' : '#000000',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading || success ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.15s',
              letterSpacing: '0.01em',
              opacity: loading || success ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && !success) {
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
            {loading ? 'Creating Account...' : success ? '✓ Account Created' : 'Send Join Request →'}
          </button>
        </form>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(56,189,248,0.07)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#334155', margin: 0 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7DD3FC')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#38BDF8')}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* ── Admin note ────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '14px',
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
            📝 ADMIN APPROVAL REQUIRED BEFORE FIRST LOGIN
          </p>
        </div>
      </div>
    </AuthBackground>
  );
};

export default RegisterPage;