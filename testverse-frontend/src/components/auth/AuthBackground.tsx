import React, { useEffect, useRef, useState, useCallback } from 'react';
import RobotPet from './RobotPet';

// ─────────────────────────────────────────────────────────────────────────────
// TESTVERSE AUTH BACKGROUND — Cinematic Gemini-Style
// Particle canvas · cursor glow · rotating card border · 3D tilt · terminal
// Pure CSS animations + lightweight React canvas. No external libraries.
// ─────────────────────────────────────────────────────────────────────────────

const ANIM_STYLES = `
@property --tv-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes tv-border-spin {
  to { --tv-angle: 360deg; }
}
.tv-card-border {
  background: conic-gradient(
    from var(--tv-angle) at 50% 50%,
    #0062e0 0deg,
    #38bdf8 50deg,
    #00b388 130deg,
    #10b981 200deg,
    rgba(255,255,255,0) 250deg,
    rgba(255,255,255,0) 320deg,
    #0062e0 360deg
  );
  animation: tv-border-spin 5s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .tv-card-border { animation: none !important; background: rgba(0,98,224,0.18) !important; }
}

@keyframes tv-fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tv-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes tv-orbDrift {
  0%,100% { transform: translate(0,0) scale(1); opacity: 0.8; }
  33%      { transform: translate(22px,-28px) scale(1.06); opacity: 1; }
  66%      { transform: translate(-16px,16px) scale(0.96); opacity: 0.75; }
}
@keyframes tv-orbDrift2 {
  0%,100% { transform: translate(0,0) scale(1); opacity: 0.7; }
  40%      { transform: translate(-24px,22px) scale(1.08); opacity: 0.9; }
  70%      { transform: translate(18px,-14px) scale(0.94); opacity: 0.65; }
}
@keyframes tv-orbDrift3 {
  0%,100% { transform: translate(0,0) scale(1); opacity: 0.6; }
  50%      { transform: translate(12px,-20px) scale(1.04); opacity: 0.8; }
}
@keyframes tv-beamDrift {
  0%   { transform: translateX(-150%) skewX(-18deg); opacity: 0; }
  8%   { opacity: 1; }
  88%  { opacity: 0.55; }
  100% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
}
@keyframes tv-beamDrift2 {
  0%   { transform: translateX(-120%) skewX(-14deg); opacity: 0; }
  12%  { opacity: 0.7; }
  82%  { opacity: 0.35; }
  100% { transform: translateX(280%) skewX(-14deg); opacity: 0; }
}
@keyframes tv-scanLine {
  0%   { transform: translateY(-3%); opacity: 0; }
  4%   { opacity: 1; }
  95%  { opacity: 0.4; }
  100% { transform: translateY(103vh); opacity: 0; }
}
@keyframes tv-dotPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.8); }
  50%      { box-shadow: 0 0 0 6px rgba(56,189,248,0); }
}
@keyframes tv-dotPulseGreen {
  0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.8); }
  50%      { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
}
@keyframes tv-logoPulse {
  0%,100% { box-shadow: 0 0 18px rgba(56,189,248,0.55), 0 0 36px rgba(59,130,246,0.3); }
  50%      { box-shadow: 0 0 28px rgba(56,189,248,0.85), 0 0 56px rgba(59,130,246,0.45); }
}
@keyframes tv-gridShimmer {
  0%,100% { opacity: 0.03; }
  50%      { opacity: 0.06; }
}
@keyframes tv-headerGlow {
  0%,100% { border-bottom-color: rgba(56,189,248,0.08); }
  50%      { border-bottom-color: rgba(56,189,248,0.18); }
}
@keyframes tv-termCursor {
  0%,100% { opacity: 1; }
  50%      { opacity: 0; }
}
@keyframes tv-cardGlow {
  0%,100% { box-shadow: 0 0 40px rgba(56,189,248,0.06), 0 25px 80px rgba(0,0,0,0.8); }
  50%      { box-shadow: 0 0 60px rgba(56,189,248,0.12), 0 25px 80px rgba(0,0,0,0.8); }
}
@keyframes tv-pillGlow {
  0%,100% { box-shadow: 0 0 8px rgba(56,189,248,0.25); }
  50%      { box-shadow: 0 0 16px rgba(56,189,248,0.5); }
}

@media (prefers-reduced-motion: reduce) {
  .tv-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
  .tv-beam { display: none !important; }
  .tv-scan { display: none !important; }
  canvas   { display: none !important; }
}
`;

// ─── Terminal messages (UI simulation — NOT real infrastructure telemetry) ────
const TERM_MESSAGES = [
  '[AUTH]   Authentication module initialized',
  '[UI]     Login interface ready',
  '[API]    Auth service connected',
  '[SEC]    Secure session handling enabled',
  '[TEST]   Playwright automation workspace ready',
  '[PROJ]   Project module online',
  '[BUG]    Bug tracker active',
  '[TEAM]   Team collaboration module ready',
  '[TASK]   Task management system initialized',
  '[NOTIF]  Notification service connected',
  '[MENTOR] Mentor service available',
  '[ROLE]   Role-based access control enabled',
  '[WS]     Workspace environment stable',
];

const STATUS_ITEMS = [
  { label: 'SYSTEM',       value: 'ONLINE',  color: '#34d399', anim: 'tv-dotPulseGreen' },
  { label: 'AUTH SERVICE', value: 'READY',   color: '#38bdf8', anim: 'tv-dotPulse'      },
  { label: 'SECURE ENV',   value: 'SECURE',  color: '#38bdf8', anim: 'tv-dotPulse'      },
];

const BADGES = [
  '✓ Playwright Ready',
  '✓ Bug Tracking',
  '✓ Project Workspace',
  '✓ Team Collaboration',
];

interface AuthBackgroundProps {
  children: React.ReactNode;
  headline?: string;
  subtitle?: string;
}

const AuthBackground: React.FC<AuthBackgroundProps> = ({
  children,
  headline = 'TEST.\nBUILD.\nSHIP.',
  subtitle = 'Organize testing workflows, bug reports, tasks and team collaboration — all in one place.',
}) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const cursorRef    = useRef<HTMLDivElement>(null);
  const cardRef      = useRef<HTMLDivElement>(null);
  const termBodyRef  = useRef<HTMLDivElement>(null);

  const [termLines, setTermLines] = useState<string[]>(TERM_MESSAGES.slice(0, 5));
  const [termIdx,   setTermIdx]   = useState(5);

  // ── Particle canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = ['#38bdf8', '#3b82f6', '#8b5cf6', '#00f0ff'];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number; color: string; opacity: number;
    };

    let w = 0, h = 0;
    let particles: Particle[] = [];
    let rafId = 0;

    const resize = () => {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };

    const spawn = () => {
      particles = Array.from({ length: 42 }, () => ({
        x:       Math.random() * w,
        y:       Math.random() * h,
        vx:      (Math.random() - 0.5) * 0.28,
        vy:      (Math.random() - 0.5) * 0.28,
        size:    Math.random() * 1.8 + 0.6,
        color:   COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.45 + 0.15,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const len = particles.length;

      for (let i = 0; i < len; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w;  if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;  if (p.y > h) p.y = 0;

        // connecting lines
        for (let j = i + 1; j < len; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56,189,248,${0.07 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      rafId = requestAnimationFrame(draw);
    };

    resize(); spawn(); draw();

    const ro = new ResizeObserver(() => { resize(); spawn(); });
    ro.observe(canvas.parentElement || document.body);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // ── Cursor glow ────────────────────────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // ── Terminal cycling ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTermIdx(prev => {
        const next = prev % TERM_MESSAGES.length;
        setTermLines(lines => {
          const updated = [...lines, TERM_MESSAGES[next]];
          return updated.slice(-7);
        });
        return next + 1;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // auto-scroll terminal
  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [termLines]);

  // ── Card 3D tilt ───────────────────────────────────────────────────────────
  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;  // -1..1
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.018)`;
    el.style.transition = 'transform 0.08s ease-out';
  }, []);

  const resetCardTilt = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
    }
  }, []);

  // ── Corner bracket helper ──────────────────────────────────────────────────
  const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: '16px',
      height: '16px',
      borderColor: 'rgba(56,189,248,0.6)',
      borderStyle: 'solid',
      zIndex: 2,
    };
    const corners: Record<string, React.CSSProperties> = {
      tl: { top: '10px',    left: '10px',  borderWidth: '1.5px 0 0 1.5px', borderTopLeftRadius: '4px' },
      tr: { top: '10px',    right: '10px', borderWidth: '1.5px 1.5px 0 0', borderTopRightRadius: '4px' },
      bl: { bottom: '10px', left: '10px',  borderWidth: '0 0 1.5px 1.5px', borderBottomLeftRadius: '4px' },
      br: { bottom: '10px', right: '10px', borderWidth: '0 1.5px 1.5px 0', borderBottomRightRadius: '4px' },
    };
    return <div style={{ ...base, ...corners[pos] }} />;
  };

  // ── Headline words with gradient ───────────────────────────────────────────
  const headlineWords = headline.split('\n');

  return (
    <>
      <style>{ANIM_STYLES}</style>

      {/* ═══ ROOT ═══════════════════════════════════════════════════════════ */}
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 50%, #F0FDF9 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* ── Particle canvas ─────────────────────────────────────────── */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* ── Cursor glow ──────────────────────────────────────────────── */}
        <div
          ref={cursorRef}
          style={{
            position: 'fixed',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,98,224,0.06) 0%, transparent 65%)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'left 0.12s ease-out, top 0.12s ease-out',
          }}
        />

        {/* ── Dot grid ─────────────────────────────────────────────────── */}
        <div
          className="tv-anim"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,98,224,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
            animation: 'tv-gridShimmer 7s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Line grid ────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,98,224,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,98,224,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* ── Atmospheric glow orbs ────────────────────────────────────── */}
        {/* Blue — bottom left */}
        <div className="tv-anim" style={{
          position: 'absolute', bottom: '-200px', left: '-140px',
          width: '680px', height: '680px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,98,224,0.08) 0%, rgba(56,189,248,0.04) 40%, transparent 70%)',
          animation: 'tv-orbDrift 16s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Teal — mid left */}
        <div className="tv-anim" style={{
          position: 'absolute', top: '15%', left: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,179,136,0.07) 0%, transparent 65%)',
          animation: 'tv-orbDrift2 20s ease-in-out infinite 3s',
          pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Blue tint — top */}
        <div className="tv-anim" style={{
          position: 'absolute', top: '-120px', left: '20%',
          width: '560px', height: '560px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,98,224,0.06) 0%, transparent 68%)',
          animation: 'tv-orbDrift3 24s ease-in-out infinite 6s',
          pointerEvents: 'none', zIndex: 0,
        }} />
        {/* Teal accent — center */}
        <div className="tv-anim" style={{
          position: 'absolute', top: '42%', left: '18%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,179,136,0.05) 0%, transparent 70%)',
          animation: 'tv-orbDrift 13s ease-in-out infinite 2s',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Light beams ──────────────────────────────────────────────── */}
        <div className="tv-beam" style={{
          position: 'absolute', top: '-5%', left: 0,
          width: '32%', height: '130%',
          background: 'linear-gradient(107deg, transparent 0%, rgba(0,240,255,0.04) 28%, rgba(56,189,248,0.07) 50%, rgba(0,240,255,0.04) 72%, transparent 100%)',
          animation: 'tv-beamDrift 26s linear infinite',
          pointerEvents: 'none', zIndex: 2,
        }} />
        <div className="tv-beam" style={{
          position: 'absolute', top: '8%', left: 0,
          width: '20%', height: '115%',
          background: 'linear-gradient(110deg, transparent 0%, rgba(59,130,246,0.05) 40%, rgba(59,130,246,0.08) 55%, transparent 100%)',
          animation: 'tv-beamDrift2 34s linear infinite 9s',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* ── Scan line ────────────────────────────────────────────────── */}
        <div className="tv-scan tv-anim" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.06), transparent)',
          animation: 'tv-scanLine 14s linear infinite',
          pointerEvents: 'none', zIndex: 3,
        }} />

        {/* ═══ HEADER ═════════════════════════════════════════════════════ */}
        <header
          className="tv-anim"
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            borderBottom: '1px solid #E2E8F0',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Left: TESTVERSE Architectural Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg
              role="img"
              aria-label="TESTVERSE"
              viewBox="0 0 320 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                height: '26px',
                width: 'auto',
                display: 'block',
              }}
            >
              <title>TESTVERSE</title>
              <defs>
                <linearGradient id="tv-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0062E0" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>
                <linearGradient id="tv-dark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="100%" stopColor="#003E99" />
                </linearGradient>
                <linearGradient id="tv-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00B388" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="tv-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#0062E0" />
                </linearGradient>
                <linearGradient id="tv-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>
              <g>
                {/* T1 */}
                <path d="M 4 10 L 8 6 L 19 6 L 19 13 L 4 13 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 19 6 L 30 6 L 34 10 L 34 13 L 19 13 Z" fill="url(#tv-blue-grad)" />
                <path d="M 15 13 L 19 13 L 19 38 L 15 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 19 13 L 23 13 L 23 34 L 19 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 19 38 L 23 34 L 23 38 Z" fill="url(#tv-gold-grad)" />

                {/* E1 */}
                <path d="M 40 10 L 44 6 L 44 38 L 40 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 44 6 L 47 6 L 47 38 L 44 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 47 6 L 64 6 L 68 10 L 68 13 L 47 13 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 47 18 L 61 18 L 64 21 L 61 24 L 47 24 Z" fill="url(#tv-teal-grad)" />
                <path d="M 61 18 L 64 21 L 61 21 Z" fill="url(#tv-gold-grad)" />
                <path d="M 47 31 L 68 31 L 68 34 L 64 38 L 47 38 Z" fill="url(#tv-blue-grad)" />

                {/* S1 */}
                <path d="M 78 6 L 98 6 L 102 10 L 98 13 L 83 13 L 80 16 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 74 13 L 80 16 L 78 19 L 74 16 Z" fill="url(#tv-dark-grad)" />
                <path d="M 74 19 L 81 16 L 97 22 L 102 26 L 96 27 L 78 22 Z" fill="url(#tv-blue-grad)" />
                <path d="M 97 22 L 102 26 L 96 26 Z" fill="url(#tv-gold-grad)" />
                <path d="M 96 27 L 102 26 L 102 32 L 96 35 Z" fill="url(#tv-dark-grad)" />
                <path d="M 74 34 L 78 31 L 96 31 L 96 35 L 92 38 L 78 38 L 74 34 Z" fill="url(#tv-teal-grad)" />

                {/* T2 */}
                <path d="M 108 10 L 112 6 L 123 6 L 123 13 L 108 13 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 123 6 L 134 6 L 138 10 L 138 13 L 123 13 Z" fill="url(#tv-blue-grad)" />
                <path d="M 119 13 L 123 13 L 123 38 L 119 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 123 13 L 127 13 L 127 34 L 123 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 123 38 L 127 34 L 127 38 Z" fill="url(#tv-gold-grad)" />

                {/* V */}
                <path d="M 144 10 L 148 6 L 155 6 L 160 32 L 157 35 L 144 10 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 165 6 L 172 6 L 176 10 L 163 35 L 160 32 L 165 6 Z" fill="url(#tv-dark-grad)" />
                <path d="M 157 35 L 163 35 L 160 38 Z" fill="url(#tv-gold-grad)" />

                {/* E2 */}
                <path d="M 182 10 L 186 6 L 186 38 L 182 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 186 6 L 189 6 L 189 38 L 186 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 189 6 L 206 6 L 210 10 L 210 13 L 189 13 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 189 18 L 203 18 L 206 21 L 203 24 L 189 24 Z" fill="url(#tv-teal-grad)" />
                <path d="M 203 18 L 206 21 L 203 21 Z" fill="url(#tv-gold-grad)" />
                <path d="M 189 31 L 210 31 L 210 34 L 206 38 L 189 38 Z" fill="url(#tv-blue-grad)" />

                {/* R */}
                <path d="M 216 10 L 220 6 L 220 38 L 216 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 220 6 L 223 6 L 223 38 L 220 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 223 6 L 240 6 L 245 11 L 245 18 L 240 23 L 223 23 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 223 11 L 236 11 L 239 14.5 L 236 18 L 223 18 Z" fill="#FFFFFF" />
                <path d="M 230 23 L 238 23 L 246 38 L 239 38 Z" fill="url(#tv-teal-grad)" />
                <path d="M 238 23 L 242 27 L 236 27 Z" fill="url(#tv-gold-grad)" />

                {/* S2 */}
                <path d="M 256 6 L 276 6 L 280 10 L 276 13 L 261 13 L 258 16 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 252 13 L 258 16 L 256 19 L 252 16 Z" fill="url(#tv-dark-grad)" />
                <path d="M 252 19 L 259 16 L 275 22 L 280 26 L 274 27 L 256 22 Z" fill="url(#tv-blue-grad)" />
                <path d="M 275 22 L 280 26 L 274 26 Z" fill="url(#tv-gold-grad)" />
                <path d="M 274 27 L 280 26 L 280 32 L 274 35 Z" fill="url(#tv-dark-grad)" />
                <path d="M 252 34 L 256 31 L 274 31 L 274 35 L 270 38 L 256 38 L 252 34 Z" fill="url(#tv-teal-grad)" />

                {/* E3 */}
                <path d="M 286 10 L 290 6 L 290 38 L 286 38 Z" fill="url(#tv-blue-grad)" />
                <path d="M 290 6 L 293 6 L 293 38 L 290 38 Z" fill="url(#tv-dark-grad)" />
                <path d="M 293 6 L 310 6 L 314 10 L 314 13 L 293 13 Z" fill="url(#tv-cyan-grad)" />
                <path d="M 293 18 L 307 18 L 310 21 L 307 24 L 293 24 Z" fill="url(#tv-teal-grad)" />
                <path d="M 307 18 L 310 21 L 307 21 Z" fill="url(#tv-gold-grad)" />
                <path d="M 293 31 L 314 31 L 314 34 L 310 38 L 293 38 Z" fill="url(#tv-blue-grad)" />
              </g>
            </svg>
          </div>

          {/* Right: clean empty area */}
          <div />
        </header>

        {/* ═══ MAIN CONTENT ════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            position: 'relative',
            zIndex: 20,
          }}
        >
          {/* ════════════════════════════════════════════════════════════
              LEFT PANEL — branding & product experience (desktop only)
          ════════════════════════════════════════════════════════════ */}
          <div
            className="hidden lg:flex"
            style={{
              flex: '0 0 480px',
              maxWidth: '480px',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '56px 52px',
              position: 'relative',
              borderRight: '1px solid rgba(56,189,248,0.06)',
              gap: '0',
            }}
          >
            {/* Edge glow on divider */}
            <div style={{
              position: 'absolute', right: '-1px', top: '10%',
              width: '1px', height: '80%',
              background: 'linear-gradient(180deg, transparent, #E2E8F0, transparent)',
              pointerEvents: 'none',
            }} />

            {/* ── WORKSPACE ACTIVE pill ── */}
            <div
              className="tv-anim"
              style={{
                animation: 'tv-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.05s both',
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '32px',
              }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '20px', padding: '5px 14px',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', background: '#0062E0',
                  display: 'inline-block',
                }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px', color: '#0062E0', letterSpacing: '0.12em', fontWeight: 600,
                }}>
                  WORKSPACE ACTIVE
                </span>
              </div>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px', color: '#64748B', letterSpacing: '0.08em',
              }}>
                NODE-01
              </span>
            </div>

            {/* ── Category label ── */}
            <div
              className="tv-anim"
              style={{
                animation: 'tv-fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) 0.1s both',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px', color: '#64748B',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                marginBottom: '16px', fontWeight: 600,
              }}
            >
              SOFTWARE QUALITY WORKSPACE
            </div>

            {/* ── Main headline ── */}
            <div
              className="tv-anim"
              style={{
                animation: 'tv-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.16s both',
                marginBottom: '20px',
              }}
            >
              <h1 style={{ margin: 0, lineHeight: 1.0, letterSpacing: '-0.03em' }}>
                {headlineWords.map((word, i) => (
                  <div key={i} style={{ display: 'block' }}>
                    <span style={{
                      fontWeight: 900,
                      fontSize: 'clamp(38px, 4.2vw, 58px)',
                      background: i === 0
                        ? 'linear-gradient(90deg, #0F172A, #334155)'
                        : i === 1
                        ? 'linear-gradient(90deg, #0062E0, #0284C7)'
                        : 'linear-gradient(90deg, #00B388, #10B981)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {word}
                    </span>
                  </div>
                ))}
              </h1>
            </div>

                    {/* ── Terminal panel ── */}
            <div
              className="tv-anim"
              style={{
                animation: 'tv-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.34s both',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {/* Terminal header */}
              <div style={{
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '8px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px', color: '#64748B', letterSpacing: '0.12em', fontWeight: 600,
                }}>
                  TESTVERSE CORE / AUTH MODULE
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px', color: '#0062E0', letterSpacing: '0.1em', fontWeight: 600,
                  }}>
                    LIVE STREAM
                  </span>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: '#0062E0', display: 'inline-block',
                  }} />
                </div>
              </div>
              {/* Simulation label */}
              <div style={{
                padding: '3px 14px',
                background: '#EFF6FF',
                borderBottom: '1px solid #BFDBFE',
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '8px', color: '#0062E0', letterSpacing: '0.1em', fontWeight: 600,
                }}>
                  ⓘ SIMULATION — UI STATUS DISPLAY
                </span>
              </div>
              {/* Terminal body */}
              <div
                ref={termBodyRef}
                style={{
                  padding: '10px 14px',
                  height: '130px',
                  overflowY: 'hidden',
                  display: 'flex', flexDirection: 'column', gap: '3px',
                  background: '#FFFFFF',
                }}
              >
                {termLines.map((line, i) => {
                  const isLatest = i === termLines.length - 1;
                  const bracket = line.match(/^\[(\w+)\]/)?.[1] ?? '';
                  const rest = line.replace(/^\[\w+\]\s*/, '');
                  return (
                    <div
                      key={i}
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        lineHeight: 1.5,
                        opacity: isLatest ? 1 : 0.4 + (i / termLines.length) * 0.5,
                        display: 'flex', gap: '8px',
                      }}
                    >
                      <span style={{ color: '#0062E0', minWidth: '50px', fontWeight: 600 }}>[{bracket}]</span>
                      <span style={{ color: isLatest ? '#0F172A' : '#64748B' }}>
                        {rest}
                        {isLatest && (
                          <span style={{
                            display: 'inline-block', width: '6px', height: '11px',
                            background: '#0062E0', marginLeft: '2px', verticalAlign: 'middle',
                            animation: 'tv-termCursor 0.9s step-end infinite',
                          }} />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Feature badges ── */}
            <div
              className="tv-anim"
              style={{
                animation: 'tv-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.40s both',
                display: 'flex', flexWrap: 'wrap', gap: '8px',
              }}
            >
              {BADGES.map((badge, i) => (
                <span key={i} style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px', color: '#475569',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px', padding: '4px 10px',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              RIGHT PANEL — auth card slot
          ════════════════════════════════════════════════════════════ */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '84px 24px 48px',
              minHeight: '100%',
            }}
          >
            {/* Subtle ambient glow behind the card */}
            <div style={{
              position: 'absolute',
              width: '500px', height: '500px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)',
              pointerEvents: 'none', zIndex: 0,
            }} />

            {/* ── Tilt wrapper ── */}
            <div
              ref={cardRef}
              onMouseMove={handleCardTilt}
              onMouseLeave={resetCardTilt}
              className="tv-anim"
              style={{
                width: '100%',
                maxWidth: '440px',
                position: 'relative',
                zIndex: 25,
                animation: 'tv-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.08s both',
                willChange: 'transform',
              }}
            >
              {/* ── Shimeji Robot Pet — walks on top of the card ── */}
              <RobotPet cardRef={cardRef} />

              {/* ── Rotating border ── */}
              <div
                className="tv-card-border"
                style={{
                  padding: '1.5px',
                  borderRadius: '20px',
                  position: 'relative',
                }}
              >
                {/* ── Inner glass card ── */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '19px',
                    position: 'relative',
                    boxShadow: '0 20px 50px rgba(0, 98, 224, 0.08)',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                  }}
                >
                  {/* Inset top highlight */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(0,98,224,0.3), transparent)',
                    zIndex: 1,
                  }} />

                  {/* Corner brackets */}
                  <Corner pos="tl" />
                  <Corner pos="tr" />
                  <Corner pos="bl" />
                  <Corner pos="br" />

                  {/* Page content */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile top brand bar ──────────────────────────────────── */}
        {/* Already handled by header — no extra bar needed */}
      </div>
    </>
  );
};

export default AuthBackground;
