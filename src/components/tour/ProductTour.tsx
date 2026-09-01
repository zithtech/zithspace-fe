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
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: isDark 
          ? '0 0 0 1px rgba(255,255,255,0.05), 0 20px 40px rgba(0,0,0,0.8)' 
          : '0 0 0 1px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.1)',
        width: '380px',
        maxWidth: '100%',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        animation: 'tourFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tour-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }
        .tour-back-btn:hover {
          background: ${isDark ? '#1e293b' : '#f1f5f9'} !important;
        }
        .tour-close-btn:hover {
          color: ${isDark ? '#f8fafc' : '#1e293b'} !important;
          background: ${isDark ? '#1e293b' : '#f1f5f9'} !important;
        }
      `}</style>
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #4F46E5, #06b6d4, #10b981)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      />

      <button
        {...closeProps}
        className="tour-close-btn"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: isDark ? '#64748b' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          transition: 'all 0.2s',
        }}
      >
        <X size={16} />
      </button>

      {step.title && (
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '18px',
          fontWeight: 700,
          color: isDark ? '#f8fafc' : '#0f172a',
          paddingRight: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {index === 0 ? <span style={{ fontSize: '20px' }}>👋</span> : <Sparkles size={18} style={{ color: '#4F46E5' }} />}
          {step.title}
        </h3>
      )}

      <div style={{
        fontSize: '14.5px',
        color: isDark ? '#94a3b8' : '#475569',
        lineHeight: 1.6,
        marginBottom: '28px'
      }}>
        {step.content}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '8px'
      }}>
        <button
          {...backProps}
          className="tour-back-btn"
          style={{
            border: 'none',
            background: 'transparent',
            color: isDark ? '#94a3b8' : '#64748b',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: index > 0 ? 'pointer' : 'default',
            opacity: index > 0 ? 1 : 0,
            pointerEvents: index > 0 ? 'auto' : 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '6px',
                  backgroundColor: i === index ? '#4F46E5' : (isDark ? '#334155' : '#e2e8f0'),
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: isDark ? '#475569' : '#cbd5e1', fontWeight: 600, letterSpacing: '1px' }}>
            {index + 1} OF {size}
          </span>
        </div>

        <button
          {...primaryProps}
          className="tour-primary-btn"
          style={{
            border: 'none',
            background: '#4F46E5',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
          }}
        >
          {isLastStep ? 'Finish' : 'Next'} {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}

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

    let intervalId: NodeJS.Timeout;

    const waitForTarget = () => {
      setIsReady(false);

      if (currentStepDef.route && pathname !== currentStepDef.route) {
        // Need to navigate first
        router.push(currentStepDef.route);
        return; // wait for next render cycle with new pathname
      }

      if (currentStepDef.target === 'body') {
        setIsReady(true);
        return;
      }

      // Check for DOM element
      const checkElement = () => {
        const el = document.querySelector(currentStepDef.target as string);
        if (el) {
          setIsReady(true);
          clearInterval(intervalId);
        }
      };

      checkElement();
      if (!isReady) {
        intervalId = setInterval(checkElement, 500);
      }
    };

    waitForTarget();

    return () => {
      if (intervalId) clearInterval(intervalId);
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
      if (targetStep?.route && pathname !== targetStep.route) {
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
          zIndex: 2000,
          overlayColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
          spotlightPadding: 4,
        },
        overlay: {
          zIndex: 2000,
        },
        spotlight: {
          borderRadius: '8px',
        }
      } as any}
    />
  );
};
