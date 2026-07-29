'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { TenantService } from '@/services/tenantService';
import {
  Card,
  Typography,
  Space,
  Input,
  Button,
  Tooltip,
  Alert,
  Spin,
  Popconfirm,
  message,
  theme,
} from 'antd';
import {
  KeyOutlined,
  CopyOutlined,
  ReloadOutlined,
  ApiOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function ChromeExtensionPage() {
  const { token } = theme.useToken();
  const { isLoading: authLoading } = useAuth();
  const { canReadSettings, canUpdateSettings } = usePermission();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const [installKey, setInstallKey] = useState<string | null>(null);
  const [installKeyLoading, setInstallKeyLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Route guard — mirrors the General Settings page.
  useEffect(() => {
    if (!authLoading && !canReadSettings) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadSettings, router]);

  const fetchInstallKey = useCallback(async () => {
    setInstallKeyLoading(true);
    try {
      const res = await TenantService.getExtensionInstallKey();
      setInstallKey(res.installKey);
    } catch (err) {
      messageApi.error('Failed to load the install key.');
    } finally {
      setInstallKeyLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (canReadSettings) fetchInstallKey();
  }, [canReadSettings, fetchInstallKey]);

  const handleGenerateKey = async () => {
    const isRotate = !!installKey;
    setGeneratingKey(true);
    try {
      const res = await TenantService.generateExtensionInstallKey();
      setInstallKey(res.installKey);
      messageApi.success(isRotate ? 'Install key rotated.' : 'Install key generated.');
    } catch (err) {
      messageApi.error('Failed to generate the install key.');
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyInstallKey = async () => {
    if (!installKey) return;
    try {
      await navigator.clipboard.writeText(installKey);
      messageApi.success('Install key copied to clipboard');
    } catch {
      messageApi.error('Could not copy — please copy manually');
    }
  };

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ padding: '24px', maxWidth: 820, margin: '0 auto' }}>
        {/* Header */}
        <Space size={14} align="center" style={{ marginBottom: 4 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}>
            <ApiOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>Chrome Extension</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Connect the ZithPort browser extension to this workspace
            </Text>
          </div>
        </Space>

        <Card
          style={{ marginTop: 20, borderRadius: 12 }}
          styles={{ body: { padding: 24 } }}
        >
          <Space size={12} align="center" style={{ marginBottom: 16 }}>
            <KeyOutlined style={{ fontSize: 18, color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 15 }}>Extension Install Key</Text>
          </Space>

          <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
            Share this key with your team. On the extension&apos;s <b>Connect your workspace</b> screen they
            paste it once, and every lead they save is sent to this workspace.
          </Paragraph>

          {installKeyLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : installKey ? (
            <>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                Your workspace install key
              </Text>
              <Space.Compact style={{ width: '100%', maxWidth: 620 }}>
                <Input
                  readOnly
                  value={installKey}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                  onFocusCapture={(e) => (e.target as HTMLInputElement).select()}
                />
                <Tooltip title="Copy">
                  <Button icon={<CopyOutlined />} onClick={copyInstallKey} />
                </Tooltip>
              </Space.Compact>

              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12 }}>
                Rotating the key immediately stops the old one from working — anyone still using it will need
                the new key.
              </Paragraph>

              {canUpdateSettings && (
                <Popconfirm
                  title="Rotate install key?"
                  description="The current key stops working immediately. You'll need to redistribute the new key."
                  okText="Rotate"
                  cancelText="Cancel"
                  onConfirm={handleGenerateKey}
                >
                  <Button icon={<ReloadOutlined />} loading={generatingKey} style={{ marginTop: 4 }}>
                    Rotate key
                  </Button>
                </Popconfirm>
              )}
            </>
          ) : (
            <div>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                No install key has been generated for this workspace yet.
              </Text>
              {canUpdateSettings ? (
                <Button type="primary" icon={<KeyOutlined />} loading={generatingKey} onClick={handleGenerateKey}>
                  Generate install key
                </Button>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="Ask a workspace admin to generate an install key."
                />
              )}
            </div>
          )}
        </Card>

        {/* Quick how-to */}
        <Card style={{ marginTop: 16, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
          <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>How your team connects</Text>
          <ol style={{ margin: 0, paddingLeft: 18, color: token.colorTextSecondary, fontSize: 13, lineHeight: 2 }}>
            <li>Install the ZithPort extension from the Chrome Web Store.</li>
            <li>Open it and paste the install key above on the <b>Connect your workspace</b> screen.</li>
            <li>Log in with their workspace account — leads they save now land here.</li>
          </ol>
        </Card>
      </div>
    </MainLayout>
  );
}
