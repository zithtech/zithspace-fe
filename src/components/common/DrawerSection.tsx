import React from 'react';

export const drawerFormStyles = `
  .customer-drawer-form .ant-form-item-label > label {
    font-size: 13px !important;
    font-weight: 600 !important;
    color: var(--text-slate-800, #1e293b) !important;
    letter-spacing: .01em;
    height: auto !important;
    min-height: 18px !important;
    white-space: normal !important;
    line-height: 1.4 !important;
    align-items: flex-start !important;
    padding-top: 2px !important;
  }
  .customer-drawer-card {
    background: transparent !important;
  }
  [data-theme='dark'] .customer-drawer-form .ant-form-item-label > label {
    color: #e2e8f0 !important;
  }
  [data-theme='dark'] .customer-drawer-card {
    background: transparent !important;
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .customer-drawer-header,
  [data-theme='dark'] .customer-drawer-footer {
    background: var(--customers-page-bg, #0B0F1A) !important;
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .customer-drawer-card > div:first-child,
  [data-theme='dark'] .customer-drawer-card .divide-y > * {
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .leave-drawer-root .ant-drawer-content,
  [data-theme='dark'] .leave-drawer-root .ant-drawer-body {
    background: var(--customers-page-bg, #0B0F1A) !important;
  }
  [data-theme='dark'] .customer-drawer-form .ant-input,
  [data-theme='dark'] .customer-drawer-form .ant-select-selector,
  [data-theme='dark'] .customer-drawer-form .ant-picker,
  [data-theme='dark'] .customer-drawer-form .ant-input-number {
    background: transparent !important;
    border-color: #334155 !important;
    color: #f3f4f6 !important;
  }
  .customer-drawer-form .ant-input,
  .customer-drawer-form .ant-select-selector,
  .customer-drawer-form .ant-picker,
  .customer-drawer-form .ant-input-number,
  .customer-drawer-form .ant-input-password {
    border-radius: 8px !important;
    background: var(--bg-pure-white, #ffffff) !important;
    border: 1px solid var(--border-slate-300, #cbd5e1) !important;
    color: var(--text-slate-900, #0f172a) !important;
  }
  .customer-drawer-form .ant-input:focus,
  .customer-drawer-form .ant-input-focused,
  .customer-drawer-form .ant-select-selector:focus,
  .customer-drawer-form .ant-select-focused .ant-select-selector,
  .customer-drawer-form .ant-input-textarea-show-count:focus-within,
  .customer-drawer-form .ant-input-textarea-affix-wrapper:focus-within {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
  }
  
  /* Fix textarea wrappers to prevent double borders */
  .customer-drawer-form .ant-input-textarea-show-count,
  .customer-drawer-form .ant-input-textarea-affix-wrapper {
    border-radius: 8px !important;
    background: var(--bg-pure-white, #ffffff) !important;
    border: 1px solid var(--border-slate-300, #cbd5e1) !important;
    overflow: hidden;
  }
  .customer-drawer-form .ant-input-textarea-show-count textarea.ant-input,
  .customer-drawer-form .ant-input-textarea-affix-wrapper textarea.ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 10px 14px !important;
  }
  
  [data-theme='dark'] .customer-drawer-form .ant-input-textarea-show-count,
  [data-theme='dark'] .customer-drawer-form .ant-input-textarea-affix-wrapper {
    background: transparent !important;
    border-color: #334155 !important;
  }
  .customer-drawer-form .sd-trigger {
    height: 40px !important;
    padding: 6px 12px !important;
  }
`;

export const commonDrawerProps = {
  rootClassName: "leave-drawer-root",
  width: 720,
  closable: false,
  destroyOnClose: true,
  styles: {
    header: { display: 'none' as const },
    body: { padding: 0, background: 'var(--customers-page-bg, #0B0F1A)' },
    footer: { padding: 0, border: 'none' },
    wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
    mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
  }
};

export const SectionHeader = ({
  num,
  title,
  subtitle,
  icon: Icon,
}: {
  num?: string | React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: any;
}) => (
  <div
    className="mx-5 pt-4 pb-3 flex items-start gap-3 mb-2"
    style={{ borderBottom: '1px dashed var(--border-color)' }}
  >
    <div
      className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold"
      style={{
        background: 'rgba(59,130,246,0.10)',
        color: '#3b82f6',
        border: '1px solid rgba(59,130,246,0.22)',
      }}
    >
      {num ? num : <Icon size={13} strokeWidth={2.25} />}
    </div>
    <div>
      <div
        className="text-[13px] font-bold leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className="text-[11px] font-medium mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

export function SectionCard({
  icon,
  title,
  subtitle,
  step,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  step?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="customer-drawer-card rounded-none overflow-hidden"
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        marginBottom: 16,
      }}
    >
      <SectionHeader num={step ? step.replace('STEP ', '0') : undefined} title={title} subtitle={subtitle} icon={() => icon} />
      <div className="px-5 py-5 space-y-4">
        {children}
      </div>
    </div>
  );
}
