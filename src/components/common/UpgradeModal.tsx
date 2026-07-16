'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { CrownOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface LimitEventData {
  feature?: string;
  current?: number;
  allowed?: number;
  message?: string;
}

export default function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LimitEventData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleLimitReached = (e: Event) => {
      const customEvent = e as CustomEvent<LimitEventData>;
      setData(customEvent.detail || null);
      setOpen(true);
    };

    window.addEventListener('zukvo:limit-reached', handleLimitReached);
    return () => {
      window.removeEventListener('zukvo:limit-reached', handleLimitReached);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpgrade = () => {
    setOpen(false);
    router.push('/subscription');
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      zIndex={9999}
      closable={true}
      width={480}
      className="upgrade-limit-modal"
      classNames={{
        content: 'p-0 overflow-hidden bg-transparent shadow-none',
      }}
    >
      {/* Container with Glassmorphism & Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800">
        
        {/* Background Gradients */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative p-8 flex flex-col items-center text-center z-10">
          
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-6">
            <CrownOutlined className="text-4xl text-white" />
          </div>

          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 mb-2">
            Time for an Upgrade!
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-base mb-6 max-w-sm">
            {data?.message ? (
              data.message
            ) : (
              <>
                Your current subscription allows a maximum of <span className="font-semibold text-gray-800 dark:text-gray-100">{data?.allowed || 'allowed'}</span> members. Please upgrade your plan to unlock more capacity.
              </>
            )}
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button 
              onClick={handleUpgrade}
              className="group relative w-full flex justify-center items-center gap-2 rounded-xl py-3 px-6 text-white font-semibold transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all group-hover:bg-[length:200%_auto] group-hover:animate-gradient-x"></div>
              <span className="relative z-10 flex items-center gap-2">
                Upgrade Now <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={handleClose}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .upgrade-limit-modal .ant-modal-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .upgrade-limit-modal .ant-modal-close {
          top: 16px;
          right: 16px;
          z-index: 20;
          color: #9ca3af;
        }
        .upgrade-limit-modal .ant-modal-close:hover {
          color: #1f2937;
          background: rgba(0,0,0,0.05);
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}} />
    </Modal>
  );
}
