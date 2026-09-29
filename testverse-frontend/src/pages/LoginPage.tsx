import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Rocket,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Cpu,
  Layers
} from 'lucide-react';
import RobotPet from '../components/auth/RobotPet';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
}

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Particle Background Effect (IROHUB Blue & Teal) ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(36, Math.floor((width * height) / 35000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.4 + 0.15,
        pulseSpeed: 0.015 + Math.random() * 0.02,
      });
    }

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections in subtle blue
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.15;
            ctx.strokeStyle = `rgba(0, 98, 224, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles in fresh blue and teal
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;

        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        const dynamicAlpha = p.alpha + Math.sin(tick * p.pulseSpeed) * 0.1;
        const clampedAlpha = Math.max(0.1, Math.min(0.65, dynamicAlpha));

        // Alternate between brand blue and vibrant teal
        if (idx % 2 === 0) {
          ctx.fillStyle = `rgba(0, 98, 224, ${clampedAlpha})`;
        } else {
          ctx.fillStyle = `rgba(0, 179, 136, ${clampedAlpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
    <div className="relative min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] font-['Inter',sans-serif] flex flex-col justify-between overflow-x-hidden selection:bg-[#0062E0] selection:text-white">
      {/* ── Embedded Keyframe & Micro-Animation Styles ──────────────────────── */}
      <style>{`
        @keyframes tvFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tvPulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.04); }
        }
        .animate-fade-in {
          animation: tvFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-delayed {
          animation: tvFadeIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
          opacity: 0;
        }
        .animate-pulse-glow {
          animation: tvPulseGlow 7s ease-in-out infinite;
        }
      `}</style>

      {/* ── Background Layer: Canvas + Technical Grid + Subtle Radial Glows ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Blue & Teal Atmospheric Radials */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0062E0]/[0.07] via-[#00B388]/[0.04] to-transparent blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-[#0062E0]/[0.06] via-[#E6F9F4]/[0.4] to-transparent blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-[750px] h-[550px] rounded-full bg-gradient-to-t from-[#EFF6FF]/[0.6] via-transparent to-transparent blur-2xl" />

        {/* Clean Light Technical Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #0062E0 1px, transparent 1px),
              linear-gradient(to bottom, #0062E0 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Minimalist Tech Crosshairs */}
        <div className="hidden lg:block absolute top-20 left-12 text-[#0062E0]/30 font-mono text-[10px] select-none">
          + LAT_01:8080 // SYS_ONLINE
        </div>
        <div className="hidden lg:block absolute top-20 right-12 text-[#0062E0]/30 font-mono text-[10px] select-none text-right">
          SECURE_HASH: SHA-256 +
        </div>
        <div className="hidden lg:block absolute bottom-12 left-12 text-[#64748B]/30 font-mono text-[10px] select-none">
          [LOC // 0x7F000001]
        </div>

        {/* Interactive Floating Particles Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
      </div>

      {/* ── Top Header / Branding Bar ────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* TestVerse Brand Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0062E0] to-[#00B388] p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center transition-transform hover:scale-105">
            <div className="w-full h-full bg-transparent rounded-[10px] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-[0.14em] text-[#0F172A]">
                TESTVERSE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B388]" />
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#64748B] uppercase">
              Software Testing Platform
            </span>
          </div>
        </div>

        {/* System Telemetry Indicator */}
        <div className="hidden sm:flex items-center space-x-3 bg-white/80 border border-[#E2E8F0] px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B388] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B388]" />
          </span>
          <span className="text-[11px] font-mono text-[#475569] tracking-wider uppercase font-medium">
            Platform Gateway
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
            v2.4.0
          </span>
        </div>
      </header>

      {/* ── Main Content: Two Visual Zones (Desktop) / Balanced Centered ──────── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT ZONE: Futuristic Platform Showcase (Cinematic & Technical)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-7 animate-fade-in pr-4">
            
            {/* Mission Category Chip */}
            <div className="inline-flex items-center gap-2.5 self-start px-3.5 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
              <span className="text-[11px] font-mono tracking-[0.16em] text-[#0062E0] uppercase font-semibold">
                Autonomous Quality Intelligence
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-2">
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                PRECISION TESTING. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0062E0] via-[#0284C7] to-[#00B388]">
                  ZERO REGRESSION.
                </span>
              </h1>
              <p className="text-sm xl:text-base text-[#475569] max-w-lg leading-relaxed pt-1">
                Unified testing ecosystem for engineering teams, automation testers, and mentors. Orchestrate test suites, track live bug diagnostics, and accelerate delivery with military-grade telemetry.
              </p>
            </div>

            {/* Futuristic Telemetry HUD Card */}
            <div className="relative rounded-2xl bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-xl shadow-blue-500/5 overflow-hidden group">
              {/* Subtle top hairline highlight */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#0062E0] to-transparent" />

              {/* HUD Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#0062E0]" />
                  <span className="text-xs font-mono text-[#0F172A] uppercase tracking-wider font-semibold">
                    Core Engine Telemetry
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B388]" />
                  <span className="text-[11px] font-mono text-[#008766] tracking-wider font-semibold">
                    NOMINAL
                  </span>
                </div>
              </div>

              {/* High-Contrast Technical Metric Chips */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
                    Assertion Pass
                  </div>
                  <div className="text-lg font-bold font-mono text-[#0F172A] mt-1">
                    99.98%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <div className="text-[10px] font-mono text-[#0062E0] uppercase tracking-wider font-medium">
                    Sync Latency
                  </div>
                  <div className="text-lg font-bold font-mono text-[#0062E0] mt-1">
                    12ms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F0FDF9] border border-[#A7F3D0]">
                  <div className="text-[10px] font-mono text-[#008766] uppercase tracking-wider font-medium">
                    RBAC Roles
                  </div>
                  <div className="text-lg font-bold font-mono text-[#008766] mt-1">
                    4 Active
                  </div>
                </div>
              </div>

              {/* Live Test Stream Log (Minimalist Monospace Visual) */}
              <div className="space-y-1.5 font-mono text-[11px] text-[#475569] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#0F172A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B388]" />
                    <span>auth.jwt_handshake.verify</span>
                  </span>
                  <span className="text-[#94A3B8]">0.8ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#0F172A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00B388]" />
                    <span>rbac.role_matrix_eval [ADMIN/TESTER]</span>
                  </span>
                  <span className="text-[#94A3B8]">1.2ms</span>
                </div>
                <div className="flex items-center justify-between text-[#475569]">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>pipeline.daemon_ready</span>
                  </span>
                  <span className="text-[#0062E0] font-semibold">STANDBY</span>
                </div>
              </div>
            </div>

            {/* Architecture Pillars */}
            <div className="flex flex-wrap gap-4 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#0062E0]" />
                Role-Based Access Control
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-[#00B388]" />
                Automated Bug Tracking
              </span>
              <span className="text-[#CBD5E1]">•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
                Enterprise Security
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT ZONE: Clean Premium White Login Panel (Main Focus)
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="w-full lg:col-span-5 flex justify-center lg:justify-end animate-fade-in-delayed pt-16 sm:pt-20 lg:pt-0">
            <div ref={cardRef} className="w-full max-w-[440px] relative">
              {/* ── Shimeji Robot Pet — walks on top of the card ── */}
              <RobotPet cardRef={cardRef} />
              
              {/* Subtle Ambient Backing Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#0062E0]/15 via-[#00B388]/10 to-transparent rounded-[24px] blur-xl opacity-70 pointer-events-none" />

              {/* Login Card Container */}
              <div className="relative rounded-2xl p-7 sm:p-9 bg-white border border-[#E2E8F0] shadow-2xl shadow-blue-500/10">
                {/* Subtle Technical Notch / Coordinate */}
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0062E0] shadow-[0_0_8px_#0062E0]" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#0062E0] uppercase font-bold">
                      SECURE GATEWAY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">
                    AUTH // TV-01
                  </span>
                </div>

                {/* Card Title & Subtitle */}
                <div className="mb-7">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                    WELCOME BACK
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1.5 leading-normal">
                    Sign in to continue to TestVerse
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div
                    role="alert"
                    className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-[11px] font-semibold tracking-[0.1em] text-[#475569] uppercase mb-2 font-mono"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail
                          className={`w-4 h-4 transition-colors duration-200 ${
                            focusedField === 'email' ? 'text-[#0062E0]' : 'text-[#94A3B8]'
                          }`}
                        />
                      </div>
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={loading}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="you@example.com"
                        className={`
                          w-full rounded-xl py-3 pl-10 pr-4 text-sm font-sans
                          bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8]
                          border transition-all duration-200 outline-none
                          ${
                            focusedField === 'email'
                              ? 'border-[#0062E0] ring-2 ring-[#0062E0]/15 bg-white shadow-sm'
                              : 'border-[#CBD5E1] hover:border-[#94A3B8]'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="login-password"
                        className="block text-[11px] font-semibold tracking-[0.1em] text-[#475569] uppercase font-mono"
                      >
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-[#64748B] hover:text-[#0062E0] font-medium transition-colors duration-150"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock
                          className={`w-4 h-4 transition-colors duration-200 ${
                            focusedField === 'password' ? 'text-[#0062E0]' : 'text-[#94A3B8]'
                          }`}
                        />
                      </div>
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter your password"
                        className={`
                          w-full rounded-xl py-3 pl-10 pr-11 text-sm font-sans
                          bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8]
                          border transition-all duration-200 outline-none
                          ${
                            focusedField === 'password'
                              ? 'border-[#0062E0] ring-2 ring-[#0062E0]/15 bg-white shadow-sm'
                              : 'border-[#CBD5E1] hover:border-[#94A3B8]'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#0F172A] transition-colors focus:outline-none"
                      >
                        {showPassword ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`
                        w-full group relative flex items-center justify-center gap-2
                        py-3 px-5 rounded-xl font-bold text-sm tracking-[0.08em] uppercase
                        text-white bg-[#0062E0]
                        transition-all duration-200
                        shadow-md shadow-blue-500/25
                        hover:bg-[#0050B8] hover:shadow-lg hover:shadow-blue-500/35
                        hover:-translate-y-0.5 active:translate-y-0
                        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                        overflow-hidden
                      `}
                    >
                      {/* Button shine reflection on hover */}
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.2] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>SIGN IN</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Footer Section: Create Account */}
                <div className="mt-7 pt-5 border-t border-[#F1F5F9] text-center">
                  <p className="text-xs text-[#64748B]">
                    No account yet?{' '}
                    <Link
                      to="/register"
                      className="text-[#0062E0] font-semibold hover:text-[#0050B8] transition-colors ml-1"
                    >
                      Create account
                    </Link>
                  </p>
                </div>

                {/* Enterprise Security Pill */}
                <div className="mt-4 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
                  <span className="text-[10px] font-mono text-[#64748B] tracking-wider uppercase font-medium">
                    Encrypted Session • Multi-Role Access
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Minimalist Bottom Footer ────────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#64748B]">
        <div>
          © 2026 TESTVERSE INC. ALL RIGHTS RESERVED.
        </div>
        <div className="flex items-center space-x-5">
          <span className="hover:text-[#0F172A] transition-colors cursor-default">
            ZERO-REGRESSION ARCHITECTURE
          </span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="text-[#0062E0] font-semibold">
            CLUSTER: US-EAST (12MS)
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;