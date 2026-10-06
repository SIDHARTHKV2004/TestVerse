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
  department?: string;
  domain?: string;
  email?: string;
  activeCount?: number;
}

// ─── Shared input base ────────────────────────────────────────────────────────
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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mentorId, setMentorId] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [mentorLoadError, setMentorLoadError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });

  const roleLabel = formData.role === 'TESTER' ? 'Tester' : formData.role === 'DEVELOPER' ? 'Developer' : '';
  const hasMentors = !mentorsLoading && mentors.length > 0;
  const isMentorUnavailable =
    Boolean(formData.role) &&
    !mentorsLoading &&
    !hasMentors;
  const isSubmitBlocked = loading || success || mentorsLoading || !formData.role || isMentorUnavailable || !mentorId;

  const formatDepartment = (dept?: string) => {
    if (!dept) return '';
    return dept;
  };

  // ── Focus-aware input style ────────────────────────────────────────────────
  const fieldStyle = (name: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focusedField === name ? '#0062E0' : '#CBD5E1',
    boxShadow: focusedField === name
      ? '0 0 0 3px rgba(0,98,224,0.12)'
      : 'none',
  });

  // ── Load mentors on role change ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!formData.role) {
      setMentors([]);
      setMentorId('');
      setMentorsLoading(false);
      setMentorLoadError(null);
      return;
    }

    const currentRoleLabel = formData.role === 'TESTER' ? 'Tester' : 'Developer';

    const loadMentors = async () => {
      setMentorsLoading(true);
      setMentorLoadError(null);
      try {
        const fetchedMentors = await authApi.getEligibleMentors(formData.role);
        if (isMounted) {
          const list = fetchedMentors || [];
          setMentors(list);
          if (list.length === 0) {
            setMentorId('');
            setMentorLoadError('No active faculty available for this role.');
          } else if (list.length === 1) {
            setMentorId(String(list[0].id));
          } else {
            setMentorId('');
          }
        }
      } catch (err: any) {
        console.error('Failed to load mentors:', err);
        if (isMounted) {
          setMentors([]);
          setMentorId('');
          setMentorLoadError(`Failed to load ${currentRoleLabel} faculty. Please try again later.`);
        }
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

  // ── Form submission ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) { showError('Name is required'); setLoading(false); return; }
    if (!formData.email.trim()) { showError('Email is required'); setLoading(false); return; }
    if (formData.password.length < 6) { showError('Password must be at least 6 characters'); setLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { showError('Passwords do not match'); setLoading(false); return; }
    if (!formData.role) {
      showError('Please select a role.');
      setLoading(false);
      return;
    }

    // Mentor validation
    if (mentorsLoading) {
      showError('Please wait for mentors to finish loading.');
      setLoading(false);
      return;
    }
    if (!hasMentors || mentorLoadError) {
      showError(mentorLoadError || 'No active faculty available for this role.');
      setLoading(false);
      return;
    }
    if (!mentorId.trim()) {
      showError(`Please select a ${roleLabel} mentor. Mentor assignment is strictly required.`);
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        mentorId: mentorId.trim(),
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
    color: focusedField === name ? '#0062E0' : '#94A3B8',
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
              NEW ACCOUNT
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

        {/* ── Success ───────────────────────────────────────────────────── */}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              padding: '10px 13px',
              marginBottom: '20px',
              color: '#059669',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              Registration successful! Awaiting admin approval.{' '}
              <span style={{ opacity: 0.75 }}>Redirecting to login...</span>
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '13px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#334155',
                  display: 'flex', alignItems: 'center', padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
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
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '13px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#94A3B8',
                  display: 'flex', alignItems: 'center', padding: '0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#475569')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#94A3B8')}
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
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
                  backgroundColor: '#ffffff',
                  color: '#0F172A',
                }}
                disabled={loading || success}
              >
                <option value="" disabled>Select your role...</option>
                <option value="DEVELOPER">Developer</option>
                <option value="TESTER">Tester</option>
              </select>
            </div>
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                color: '#64748B',
                marginTop: '5px',
                letterSpacing: '0.04em',
              }}
            >
              ⚡ ADMIN ROLE — ASSIGNED BY EXISTING ADMIN ONLY
            </p>
          </div>

          {/* Mentor */}
          <div>
            <label style={labelStyle}>
              Mentor <span style={{ color: '#0062E0' }}>*</span>
            </label>

            {/* When no role is selected */}
            {!formData.role && (
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  color: '#64748B',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <GraduationCap size={16} style={{ color: '#94A3B8' }} />
                <span>Please select a role above to view available mentors.</span>
              </div>
            )}

            {/* When mentors are loading */}
            {mentorsLoading && (
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  color: '#64748B',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <GraduationCap size={16} style={{ color: '#0062E0' }} />
                <span>Loading {roleLabel} mentors...</span>
              </div>
            )}

            {/* Warning banner when no mentors available or load failed */}
            {!mentorsLoading && mentorLoadError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.4',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{mentorLoadError}</span>
              </div>
            )}

            {/* Exactly one mentor: auto-selected */}
            {!mentorsLoading && mentors.length === 1 && (
              <div
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  boxShadow: '0 4px 12px rgba(0, 98, 224, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={16} style={{ color: '#0062E0' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                      {mentors[0].name}
                    </span>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#DBEAFE',
                      border: '1px solid #93C5FD',
                      borderRadius: '20px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#0062E0',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Automatically selected
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginLeft: '24px', marginBottom: '4px' }}>
                  {formatDepartment(mentors[0].department)}
                </div>
                <div style={{ fontSize: '12px', color: '#0062E0', fontFamily: 'JetBrains Mono, monospace', marginLeft: '24px' }}>
                  {mentors[0].activeCount ?? 0} active {roleLabel}s under this mentor
                </div>
              </div>
            )}

            {/* Multiple mentors: user selects one */}
            {!mentorsLoading && mentors.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mentors.map((mentor) => {
                  const isSelected = mentorId === String(mentor.id);
                  return (
                    <div
                      key={mentor.id}
                      onClick={() => setMentorId(String(mentor.id))}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : '#F8FAFC',
                        border: isSelected ? '1px solid #0062E0' : '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        boxShadow: isSelected ? '0 4px 14px rgba(0, 98, 224, 0.08)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <GraduationCap size={15} style={{ color: isSelected ? '#0062E0' : '#64748B' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                            {mentor.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: '#DBEAFE',
                              border: '1px solid #93C5FD',
                              borderRadius: '20px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontFamily: 'JetBrains Mono, monospace',
                              color: '#0062E0',
                              fontWeight: 600,
                            }}
                          >
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginLeft: '23px', marginBottom: '4px' }}>
                        {formatDepartment(mentor.department)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#0062E0', fontFamily: 'JetBrains Mono, monospace', marginLeft: '23px' }}>
                        {mentor.activeCount ?? 0} active {roleLabel}s under this mentor
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Helper text */}
            {hasMentors && (
              <p
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: mentors.length > 1 && !mentorId ? '#D97706' : '#0062E0',
                  marginTop: '6px',
                  letterSpacing: '0.04em',
                }}
              >
                {mentors.length > 1 && !mentorId
                  ? `⚡ Please select a ${roleLabel} mentor to proceed`
                  : `⚡ ${roleLabel} mentor assignment is required for registration`}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitBlocked}
            style={{
              marginTop: '4px',
              width: '100%',
              background: isSubmitBlocked
                ? '#E2E8F0'
                : 'linear-gradient(135deg, #0062E0 0%, #00B388 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 16px',
              color: isSubmitBlocked ? '#94A3B8' : '#ffffff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isSubmitBlocked ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, box-shadow 0.2s, transform 0.15s',
              letterSpacing: '0.01em',
              opacity: isSubmitBlocked ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitBlocked) {
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
            {loading
              ? 'Creating Account...'
              : success
              ? '✓ Account Created'
              : mentorsLoading
              ? 'Loading Mentors...'
              : !formData.role
              ? 'Select a Role'
              : isMentorUnavailable
              ? `Registration Blocked — No ${roleLabel} Mentor`
              : !mentorId
              ? `Select a ${roleLabel} Mentor`
              : 'Send Join Request →'}
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
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#0062E0', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0050B8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0062E0')}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* ── Admin note ────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '10px 13px',
          }}
        >
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              color: '#64748B',
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