'use client';

import React from 'react';
import { Tabs, Tooltip } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import ReimbursementMailConfiguration from './ReimbursementMailConfiguration';

export default function SettingsPanel() {
  const items = [
    {
      key: 'mail',
      label: 'Mail Configuration',
      children: <ReimbursementMailConfiguration />,
    },
  ];

  return (
    <div className="rb2-panel">
      <div className="rb2-header" style={{ padding: '24px 24px 14px 24px', marginBottom: 0 }}>
        <div className="rb2-header-about">
          <div className="rb2-header-icon"><SettingOutlined /></div>
          <div>
            <div className="rb2-header-title">Configuration</div>
            <div className="rb2-header-sub">Reimbursement preferences and mail settings</div>
          </div>
        </div>
        <Tooltip title="Refresh">
          <button type="button" className="rb2-ghost-btn" onClick={() => window.location.reload()}>
            <ReloadOutlined />
          </button>
        </Tooltip>
      </div>
      <div className="rb2-panel-body">
        <Tabs
          defaultActiveKey="mail"
          items={items}
          className="rb2-settings-tabs"
          style={{ minHeight: 600 }}
        />
      </div>
      <style jsx global>{`
        .rb2-settings-tabs .ant-tabs-nav {
          margin-left: 24px !important;
          margin-right: 24px !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-bottom: 16px !important;
        }
        .rb2-settings-tabs .ant-tabs-tab:first-child {
          margin-left: 0 !important;
        }
        .rb2-settings-tabs .ant-tabs-content-holder {
          padding: 0 24px 24px 24px;
          display: flex; flex-direction: column; flex: 1; min-height: 0;
        }
        .rb2-settings-tabs .ant-tabs-content,
        .rb2-settings-tabs .ant-tabs-tabpane {
          display: flex; flex-direction: column; flex: 1; min-height: 0;
        }
        .rb2-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border-slate-200); flex-wrap: wrap; }
        .rb2-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .rb2-header-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(148,163,184,0.12); color: #94A3B8; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .rb2-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.2; }
        .rb2-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; line-height: 1.2; }
        .rb2-ghost-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; }
        .rb2-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
      `}</style>
    </div>
  );
}
