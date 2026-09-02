'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Joyride = dynamic(() => import('react-joyride').then((mod) => mod.Joyride), { ssr: false });
import { EventData, STATUS, EVENTS, ACTIONS, TooltipRenderProps } from 'react-joyride';
import { useTour } from '@/context/TourContext';
import { useTheme } from '@/context/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';

import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

function CustomTooltip({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      {...tooltipProps}
      style={{
        backgroundColor: isDark ? '#111827' : '#ffffff',
        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        borderRadius: '20px',
        padding: '24px',
        boxSizing: 'border-box',
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '420px',
        maxWidth: '100%',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        animation: 'tourFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes robotFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        .tour-primary-btn {
          background: #4F46E5 !important;
          outline: none !important;
        }
        .tour-primary-btn:hover {
          background: #4338ca !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3), 0 2px 4px -1px rgba(79, 70, 229, 0.2) !important;
        }
        .tour-primary-btn:active {
          transform: translateY(0) !important;
          box-shadow: none !important;
        }
        .tour-back-btn:hover {
          background: ${isDark ? '#374151' : '#f3f4f6'} !important;
          color: ${isDark ? '#f9fafb' : '#111827'} !important;
        }
        .tour-close-btn:hover {
          background: ${isDark ? '#374151' : '#f3f4f6'} !important;
        }
      `}</style>

      <button
        {...closeProps}
        className="tour-close-btn"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: isDark ? '#9ca3af' : '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          zIndex: 10
        }}
      >
        <X size={16} />
      </button>

      {/* Robot Guide Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '2px solid #4F46E5',
          animation: 'robotFloat 3s ease-in-out infinite',
          boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
        }}>
          <img src="/images/robot-guide.jpg" alt="Buddy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', paddingRight: '28px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Buddy
          </span>
          <div style={{
            background: isDark ? '#1f2937' : '#f3f4f6',
            padding: '8px 12px',
            borderRadius: '12px',
            borderTopLeftRadius: '2px',
            fontSize: '13px',
            color: isDark ? '#d1d5db' : '#4b5563',
            fontStyle: 'italic',
          }}>
            "I will guide you step by step!"
          </div>
        </div>
      </div>

      {step.title && (
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: isDark ? '#f9fafb' : '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {index === 0 ? <span style={{ fontSize: '20px' }}>👋</span> : <Sparkles size={18} style={{ color: '#4F46E5' }} />}
          {step.title}
        </h3>
      )}

      <div style={{
        fontSize: '14px',
        color: isDark ? '#9ca3af' : '#4b5563',
        lineHeight: 1.6,
        marginBottom: '24px'
      }}>
        {step.content}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '8px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <button
          {...backProps}
          className="tour-back-btn"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: isDark ? '#94a3b8' : '#64748b',
            padding: '10px 14px',
            borderRadius: '10px',
            cursor: index > 0 ? 'pointer' : 'default',
            opacity: index > 0 ? 1 : 0,
            pointerEvents: index > 0 ? 'auto' : 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxSizing: 'border-box'
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', flex: 1, padding: '0 16px' }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '120px', 
            height: '4px', 
            backgroundColor: isDark ? '#334155' : '#e2e8f0', 
            borderRadius: '4px',
            marginBottom: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((index + 1) / size) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4F46E5, #6366f1)',
              borderRadius: '4px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
          <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>
            {index + 1} OF {size}
          </span>
        </div>

        {!(step as any).hideNextButton && (
          <button
            {...primaryProps}
            className="tour-primary-btn"
            style={{
              border: 'none',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
              boxSizing: 'border-box',
              flexShrink: 0
            }}
          >
            {isLastStep ? 'Finish' : 'Next'} {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

const isTourRouteMatch = (stepRoute?: string, currentPath?: string) => {
  if (!stepRoute || !currentPath) return true;
  if (currentPath === stepRoute) return true;
  // Match /tickets/select with active project ticket boards /projects/:id/tickets
  if (stepRoute === '/tickets/select' && currentPath.startsWith('/projects/') && currentPath.includes('/tickets')) {
    return true;
  }
  if (stepRoute.startsWith('/qa-workspace') && currentPath.startsWith('/projects/') && currentPath.includes('/qa-workspace')) {
    return true;
  }
  if (stepRoute === '/documenthub' && currentPath.startsWith('/documenthub')) {
    return true;
  }
  return false;
};

export const ProductTour: React.FC = () => {
  const { run, steps, stepIndex, setStepIndex, completeTour, skipTour } = useTour();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!run || !steps.length) return;

    const currentStepDef = steps[stepIndex];
    if (!currentStepDef) return;

    let intervalId: NodeJS.Timeout | undefined = undefined;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    const waitForTarget = () => {
      const match = isTourRouteMatch(currentStepDef.route, pathname);
      if (currentStepDef.route && !match) {
        setIsReady(false);
        router.push(currentStepDef.route);
        return;
      }

      if (currentStepDef.target === 'body') {
        setIsReady(true);
        return;
      }

      // Check for DOM element
      const el = document.querySelector(currentStepDef.target as string);
      if (el) {
        setIsReady(true);
        return;
      }

      // Element not yet in DOM, poll for it
      setIsReady(false);
      let attempts = 0;
      intervalId = setInterval(() => {
        attempts++;
        const found = document.querySelector(currentStepDef.target as string);
        if (found) {
          setIsReady(true);
          clearInterval(intervalId);
        } else if (attempts > 30) {
          // If genuinely missing after 3s, skip to prevent stalling
          clearInterval(intervalId);
          setStepIndex(stepIndex + 1);
        }
      }, 100);
    };

    waitForTarget();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [run, steps, stepIndex, pathname, router]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, index, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (status === STATUS.SKIPPED) {
        skipTour();
      } else {
        completeTour();
      }
    } else if (type === EVENTS.STEP_AFTER) {
      // Advance or go back
      let increment = action === 'prev' ? -1 : 1;
      const currentStep = steps[index] as any;
      
      // If we clicked Next on a step that is configured to skip the next step
      if (action === 'next' && currentStep?.skipNextOnNext) {
        increment = 2;
      }
      
      const newIndex = index + increment;
      setStepIndex(newIndex);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      const targetStep = steps[index];
      // If we are about to navigate, ignore the not-found error
      if (targetStep?.route && !isTourRouteMatch(targetStep.route, pathname)) {
        return;
      }
      // Otherwise, the element is genuinely missing on the correct page, so skip it
      const newIndex = index + (action === 'prev' ? -1 : 1);
      setStepIndex(newIndex);
    }
  };

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run && isReady} // Only run when the target is confirmed in DOM
      scrollToFirstStep
      stepIndex={stepIndex}
      steps={steps.map(s => ({ ...s, skipBeacon: true, disableOverlayClose: true, spotlightClicks: true })) as any}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: isDark ? '#1e293b' : '#fff',
          zIndex: 900,
          overlayColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
          spotlightPadding: 4,
          width: 400,
        },
        tooltip: {
          padding: 0,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        overlay: {
          zIndex: 900,
        },
        spotlight: {
          borderRadius: '8px',
        }
      } as any}
    />
  );
};
