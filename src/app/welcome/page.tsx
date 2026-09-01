'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import Image from 'next/image';
import {
  RocketOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/services/authService';
import { useProduct } from '@/context/ProductContext';
import ZukvoLoader from '@/components/common/ZukvoLoader';

import ZukvoLogoImg from '@/assets/logo/Zukvologo.png';
import TestiezMarkImg from '@/assets/logo/testiez/mark.png';
import TestiezWordmarkImg from '@/assets/logo/testiez/wordmark.png';

interface OnboardCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
  route: string;
  tag?: string;
  /** Logos to show as integration badges */
  integrations?: { label: string; color: string }[];
  isPrimary?: boolean;
}

function FloatingOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%', background: color, filter: 'blur(70px)',
      opacity: 0.4, animation: `orbFloat 8s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none',
    }} />
  );
}

function FloatingShape({ shape, x, y, size, color, delay, rotate = 0 }: {
  shape: 'circle' | 'square' | 'triangle' | 'hexagon';
  x: string; y: string; size: number; color: string; delay: number; rotate?: number;
}) {
  const base: React.CSSProperties = {
    position: 'absolute', left: x, top: y,
    animation: `shapeFloat 6s ease-in-out ${delay}s infinite alternate`,
    pointerEvents: 'none',
  };

  if (shape === 'circle') {
    return <div style={{ ...base, width: size, height: size, borderRadius: '50%', border: `1.5px solid ${color}`, opacity: 0.18 }} />;
  }
  if (shape === 'square') {
    return <div style={{ ...base, width: size, height: size, border: `1.5px solid ${color}`, borderRadius: 6, opacity: 0.18, transform: `rotate(${rotate}deg)`, animation: `shapeSpin 20s linear ${delay}s infinite` }} />;
  }
  if (shape === 'triangle') {
    return (
      <div style={{ ...base, width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}`, opacity: 0.12 }} />
    );
  }
  return (
    <div style={{ ...base, width: size, height: size, background: color, opacity: 0.10, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' }} />
  );
}

function MiniDashboard({ accent }: { accent: string }) {
  return (
    <div style={{
      width: '100%', height: 80, borderRadius: 10,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
      padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, marginTop: 14, overflow: 'hidden',
    }}>
      {[1, 2].map(r => (
        <div key={r} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: r === 1 ? accent : 'rgba(255,255,255,0.18)' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ width: '28%', height: 4, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', marginTop: 3 }}>
        {[55, 80, 40, 95, 65, 50, 88].map((h, i) => (
          <div key={i} style={{
            flex: 1, height: h * 0.22, borderRadius: '2px 2px 0 0',
            background: i % 2 === 0 ? accent : 'rgba(255,255,255,0.1)', opacity: i === 3 ? 1 : 0.75,
          }} />
        ))}
      </div>
    </div>
  );
}

function CardItem({
  card, onClick, accent, isHovered, onHover,
}: {
  card: OnboardCard; onClick: () => void; accent: string;
  isHovered: boolean; onHover: (id: string | null) => void;
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(card.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'relative', borderRadius: 18, padding: '20px 22px',
        background: 'rgba(255,255,255,0.06)',
        border: isHovered ? '1.5px solid rgba(255,255,255,0.22)' : '1.5px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(22px)', cursor: 'pointer',
        transition: 'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.1)'
          : '0 4px 16px rgba(0,0,0,0.22)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}
    >


      {/* Primary ribbon */}
      {card.isPrimary && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: card.gradient,
          padding: '3px 13px 3px 16px',
          borderRadius: '0 18px 0 12px',
          fontSize: 9, fontWeight: 800, color: '#fff',
          letterSpacing: '0.09em', textTransform: 'uppercase',
        }}>
          Step 1
        </div>
      )}

      {/* Icon + title inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: card.gradient, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff', boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          transform: isHovered ? 'scale(1.12) rotate(-6deg)' : 'scale(1) rotate(0deg)',
        }}>
          {card.icon}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {card.label}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
        {card.description}
      </div>

      {/* Integration badges */}
      {card.integrations && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {card.integrations.map((intg) => (
            <div key={intg.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.07)', border: `1px solid ${intg.color}44`,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 10.5, fontWeight: 600, color: intg.color,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: intg.color, display: 'inline-block' }} />
              {intg.label}
            </div>
          ))}
        </div>
      )}

      {/* CTA row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, marginTop: 14,
        color: isHovered ? '#fff' : 'rgba(255,255,255,0.38)',
        fontSize: 12.5, fontWeight: 700, transition: 'color 0.3s ease',
      }}>
        <span>{card.isPrimary ? 'Create Project' : 'Connect & Migrate'}</span>
        <ArrowRightOutlined style={{ transition: 'transform 0.3s ease', transform: isHovered ? 'translateX(4px)' : 'translateX(0)', fontSize: 11 }} />
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { manifest, brand, isTestiez } = useProduct();
  const [actionLoading, setActionLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  if (isLoading) return <ZukvoLoader message="Loading..." />;
  if (user && user.onboardingCompleted) {
    router.replace(manifest.homeRoute);
    return null;
  }

  const handleAction = async (destination: string) => {
    try {
      setActionLoading(true);
      router.push(destination);
    } catch (err: any) {
      message.error(err?.message || 'Something went wrong.');
      setActionLoading(false);
    }
  };

  const accent = brand.accent;
  const isTestiezBrand = isTestiez;

  const bgGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#060d1f 0%,#0b1830 50%,#08111e 100%)'
    : 'linear-gradient(135deg,#07090f 0%,#0d1117 50%,#0f1420 100%)';
  const primaryGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#2a78d6 0%,#1a5cbf 100%)'
    : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)';
  const secondaryGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#0ea5e9 0%,#2a78d6 100%)'
    : 'linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)';
  const accentAlt = isTestiezBrand ? '#0ea5e9' : '#8b5cf6';

  const cards: OnboardCard[] = [
    {
      id: 'project',
      isPrimary: true,
      icon: <RocketOutlined />,
      label: 'Create your first project',
      description: isTestiezBrand
        ? 'Set up a QA project from scratch. Organise sprints, define test scope, and get your team aligned from day one.'
        : 'Start from scratch and set up a project to organise your team\'s work, sprints, and deliverables.',
      gradient: primaryGrad,
      route: '/projects/manage',
    },
    {
      id: 'migrate',
      icon: <LinkOutlined />,
      label: 'Import from Jira or Linear',
      description: 'Already using another tool? Connect your workspace and migrate your existing projects, tickets, and data in minutes.',
      gradient: secondaryGrad,
      route: '/integrations',
      integrations: [
        { label: 'Jira', color: '#2684FF' },
        { label: 'Linear', color: '#5E6AD2' },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes orbFloat { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(-40px) translateX(18px); } }
        @keyframes shapeFloat { 0% { transform: translateY(0); } 100% { transform: translateY(-22px); } }
        @keyframes shapeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pulseRing { 0% { transform:scale(0.92); opacity:0.65; } 100% { transform:scale(1.45); opacity:0; } }
        @keyframes logoBreathe { 0%,100% { filter:drop-shadow(0 0 14px ${accent}55); } 50% { filter:drop-shadow(0 0 30px ${accent}99); } }
        @keyframes badgePop { from { opacity:0; transform:scale(0.8) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes gridPan { 0% { background-position:0 0; } 100% { background-position:40px 40px; } }
        @keyframes scanline { 0% { top:-30%; } 100% { top:120%; } }
        .w-card-enter { animation: fadeSlideUp 0.55s cubic-bezier(0.34,1.2,0.64,1) both; }
        .welcome-wrap { font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
      `}</style>

      <div className="welcome-wrap" style={{ minHeight: '100vh', width: '100vw', background: bgGrad, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Animated grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '40px 40px', animation: 'gridPan 10s linear infinite',
        }} />

        {/* Scanline */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: '20%', background: 'linear-gradient(transparent,rgba(255,255,255,0.012),transparent)', animation: 'scanline 14s linear infinite', pointerEvents: 'none', zIndex: 0 }} />



        {/* 2D shapes */}
        <FloatingShape shape="circle"   x="7%"  y="12%" size={80}  color={accent}    delay={0}   />
        <FloatingShape shape="square"   x="84%" y="8%"  size={52}  color={accentAlt} delay={1.2} rotate={25} />
        <FloatingShape shape="hexagon"  x="88%" y="52%" size={90}  color={accent}    delay={0.6} />
        <FloatingShape shape="triangle" x="4%"  y="68%" size={60}  color={accentAlt} delay={2}   />
        <FloatingShape shape="circle"   x="52%" y="82%" size={38}  color={accent}    delay={0.9} />
        <FloatingShape shape="square"   x="18%" y="4%"  size={36}  color={accentAlt} delay={1.8} rotate={45} />
        <FloatingShape shape="hexagon"  x="73%" y="78%" size={55}  color={isTestiezBrand ? '#10b981' : '#ec4899'} delay={2.4} />
        <FloatingShape shape="triangle" x="60%" y="5%"  size={44}  color={accent}    delay={3}   />
        <FloatingShape shape="square"   x="42%" y="90%" size={30}  color={accentAlt} delay={0.4} rotate={15} />

        {/* Main content — two-column split */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%', maxWidth: 1280,
          minHeight: '100vh', padding: '0 40px',
          display: 'flex', alignItems: 'flex-start', paddingTop: '10vh', gap: 0,
          animation: 'fadeIn 0.7s ease both',
        }}>

          {/* ══ LEFT — hero content ══════════════════════════════════════ */}
          <div style={{
            flex: '0 0 48%', maxWidth: 520,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: '40px 48px 40px 0',
            animation: 'fadeSlideUp 0.65s ease both',
          }}>
            {/* Logo with animated rings */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
              <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: `1px solid ${accent}66`, animation: 'pulseRing 2.8s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: -7,  borderRadius: '50%', border: `1px solid ${accent}44`, animation: 'pulseRing 2.8s ease-out 1s infinite' }} />
              <div style={{
                width: 80, height: 80, borderRadius: 22,
                background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(12px)', animation: 'logoBreathe 4s ease-in-out infinite', overflow: 'hidden',
              }}>
                <Image
                  src={isTestiezBrand ? TestiezMarkImg : ZukvoLogoImg}
                  alt={isTestiezBrand ? 'Testiez' : 'Zukvo'}
                  width={56} height={56} style={{ objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Brand wordmark */}
            {isTestiezBrand ? (
              <Image src={TestiezWordmarkImg} alt="Testiez" height={32} width={124} style={{ objectFit: 'contain', marginBottom: 20, filter: 'brightness(1.15)' }} />
            ) : (
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', background: primaryGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 20, lineHeight: 1 }}>
                Zukvo
              </div>
            )}

            <h1 style={{ fontSize: 'clamp(28px,3.2vw,48px)', fontWeight: 800, color: '#fff', textAlign: 'left', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 18px' }}>
              {isTestiezBrand ? 'Your QA workspace\nis ready' : 'Your workspace\nis ready'}
            </h1>

            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.52)', textAlign: 'left', lineHeight: 1.7, margin: '0 0 28px' }}>
              Every great workflow starts with a project. Create one from scratch or bring your existing work over from Jira or Linear.
            </p>

            {/* Product badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 40, padding: '5px 14px 5px 10px',
              animation: 'badgePop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.45s both',
              alignSelf: 'flex-start',
            }}>
              <ThunderboltOutlined style={{ color: accent, fontSize: 13 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em' }}>
                {isTestiezBrand ? 'TESTIEZ — QA DELIVERY PLATFORM' : 'ZUKVO — FULL DELIVERY SUITE'}
              </span>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 60, color: 'rgba(255,255,255,0.18)', fontSize: 11, letterSpacing: '0.03em' }}>
              {isTestiezBrand
                ? '© Testiez by ZithTech'
                : '© Zukvo by ZithTech'}
            </div>
          </div>

          {/* ── Divider */}
          <div style={{
            width: 1, alignSelf: 'stretch', margin: '80px 0',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, transparent)',
            flexShrink: 0,
          }} />

          {/* ══ RIGHT — cards ════════════════════════════════════════════ */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start', padding: '40px 0 40px 48px', gap: 14,
          }}>
            {/* Section label */}
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
                How would you like to get started?
              </span>
            </div>

            {/* Cards stacked */}
            {cards.map((card, i) => (
              <div key={card.id} className="w-card-enter" style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
                <CardItem card={card} onClick={() => handleAction(card.route)} accent={accent} isHovered={hoveredCard === card.id} onHover={setHoveredCard} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
