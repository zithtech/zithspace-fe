"use client";

import React from "react";
import { Row, Col, Space, Divider, Typography, Input, Button } from "antd";
import { SearchOutlined, SyncOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface TimeTrackingHeaderProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  subTitle?: React.ReactNode;
  description?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  showIconBox?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function TimeTrackingHeader({
  icon,
  title,
  subTitle,
  description,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  extra,
  style,
  className,
  showIconBox = true,
  onRefresh,
  refreshing,
}: TimeTrackingHeaderProps) {
  return (
    <>
      <div className={`saas-header-container${className ? ` ${className}` : ''}`} style={{
        backdropFilter: 'blur(12px)',
        padding: '8px 32px',
        flexShrink: 0,
        zIndex: 100,
        marginBottom: 12,
        background: 'var(--bg-pure-white)',
        ...style,
      }}>
        <Row justify="space-between" align="middle" gutter={[16, 8]} className="saas-header-row">
          <Col flex="1 1 auto" style={{ minWidth: 0 }} className="saas-header-left-col">
            <div className="saas-header-main-flex">
              {/* Desktop: This behaves like Space. Mobile: This becomes a Column */}
              <div className="saas-header-left-group">
                <div className="saas-header-icon-title-row">
                  {icon && (
                    showIconBox ? (
                      <div className="bh-header-icon-box">
                        {icon}
                      </div>
                    ) : (
                      <div className="saas-header-custom-icon">
                        {icon}
                      </div>
                    )
                  )}
                  <div className="saas-header-title-box">
                    <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}>
                      {title}
                    </Title>
                    {subTitle && (
                      <div style={{ marginTop: 4 }}>
                        {subTitle}
                      </div>
                    )}
                  </div>
                </div>

                {description && <Divider type="vertical" className="bh-header-divider" />}

                {description && (
                  <div className="saas-header-description-box">
                    <Text style={{ fontSize: 12, color: 'var(--text-slate-600)', fontWeight: 600 }}>
                      {description}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Col>
          <Col flex="0 0 auto" className="saas-header-extra-col">
            <Space size={12} align="center" style={{ flexWrap: 'wrap' }} className="saas-header-extra-space">
              {onSearchChange && (
                <div className={`bh-search-box ${searchQuery ? 'active' : ''}`}>
                  <SearchOutlined style={{ color: searchQuery ? '#8b5cf6' : 'var(--text-slate-400)', fontSize: 13 }} />
                  <Input
                    placeholder={searchPlaceholder || "Search time entries..."}
                    variant="borderless"
                    style={{ fontSize: 12, fontWeight: 600, padding: 0 }}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    allowClear
                  />
                </div>
              )}
              {onRefresh && (
                <Button
                  icon={<SyncOutlined spin={refreshing} />}
                  onClick={onRefresh}
                  disabled={refreshing}
                  style={{ height: 38, width: 38, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Refresh"
                />
              )}
              {extra}
            </Space>
          </Col>
        </Row>
      </div>

      <style jsx global>{`
        .saas-header-left-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .saas-header-icon-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .bh-header-icon-box {
          width: 36px; height: 36px;
          background: var(--bg-blue-50, #eff6ff);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59,130,246,0.2);
          flex-shrink: 0;
        }
        .saas-header-custom-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        [data-theme='dark'] .bh-header-icon-box {
          background: rgba(59,130,246,0.15) !important;
          border-color: rgba(59,130,246,0.25) !important;
        }
        .bh-header-divider {
          height: 18px;
          border-left: 1.5px solid var(--border-slate-200);
          margin: 0 !important;
        }
        .bh-search-box {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-slate-50, #f8fafc);
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #e2e8f0);
          width: 240px; height: 38px;
          transition: all 0.2s ease;
        }
        .bh-search-box.active,
        .bh-search-box:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
          background: var(--bg-pure-white, #ffffff);
        }
        .bh-search-box .ant-input-affix-wrapper,
        .bh-search-box .ant-input-affix-wrapper-focused,
        .bh-search-box .ant-input-affix-wrapper:hover,
        .bh-search-box .ant-input-affix-wrapper:focus,
        .bh-search-box input,
        .bh-search-box input:focus,
        .bh-search-box input:hover,
        .bh-search-box .ant-input,
        .bh-search-box .ant-input:focus,
        .bh-search-box .ant-input:hover {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        [data-theme='dark'] .bh-search-box {
          background: rgba(255, 255, 255, 0.02) !important;
          border-color: var(--border-slate-800, #1f2937) !important;
        }
        [data-theme='dark'] .bh-search-box.active,
        [data-theme='dark'] .bh-search-box:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
          background: rgba(0, 0, 0, 0.2) !important;
        }
        .saas-header-container .ant-row {
          row-gap: 8px !important;
           flex-wrap: nowrap !important;
        }
        @media (max-width: 1250px) {
          .saas-header-container .ant-row {
            flex-wrap: wrap !important;
          }
          .saas-header-left-group {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .bh-header-divider {
            display: none !important;
          }
          .saas-header-extra-col {
            width: 100% !important;
            flex: 1 1 100% !important;
            margin-top: 4px;
          }
          .saas-header-extra-space {
            width: 100%;
            justify-content: flex-start !important;
          }
        }
        @media (max-width: 600px) {
          .bh-search-box {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
