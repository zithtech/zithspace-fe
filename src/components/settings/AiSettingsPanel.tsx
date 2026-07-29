'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Segmented,
  Select,
  Input,
  AutoComplete,
  Switch,
  Button,
  Alert,
  Space,
  Typography,
  Spin,
  Tag,
  message,
  theme,
} from 'antd';
import {
  RobotOutlined,
  ThunderboltFilled,
  ApiOutlined,
  KeyOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import {
  AiSettingsService,
  AiSettings,
  AiMode,
  AiProviderKind,
  PlatformCatalogEntry,
} from '@/services/aiSettings.service';

const { Text, Title } = Typography;

const BYO_PROVIDERS: { value: AiProviderKind; label: string; hint: string }[] = [
  { value: 'gemini', label: 'Google Gemini', hint: 'Uses your Gemini API key' },
  { value: 'openai_compatible', label: 'OpenAI-compatible', hint: 'OpenAI, DeepSeek, Groq, OpenRouter, Together…' },
  { value: 'anthropic', label: 'Anthropic (Claude)', hint: 'Uses your Anthropic API key' },
];

interface Props {
  /** When false, inputs/actions are disabled (no settings.manage permission). */
  canManage?: boolean;
}

export default function AiSettingsPanel({ canManage = true }: Props) {
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [current, setCurrent] = useState<AiSettings | null>(null);
  const [catalog, setCatalog] = useState<PlatformCatalogEntry[]>([]);

  // Editable form state
  const [mode, setMode] = useState<AiMode>('platform');
  const [modelKey, setModelKey] = useState<string | undefined>();
  const [provider, setProvider] = useState<AiProviderKind>('openai_compatible');
  const [model, setModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [models, setModels] = useState<string[]>([]);

  const hasSavedKey = !!current?.hasApiKey;

  const load = async () => {
    try {
      setLoading(true);
      const { settings, platformCatalog } = await AiSettingsService.getSettings();
      setCatalog(platformCatalog);
      setCurrent(settings);
      if (settings) {
        setMode(settings.mode);
        setIsActive(settings.isActive);
        if (settings.mode === 'platform') {
          setModelKey(settings.model || platformCatalog[0]?.key);
        } else {
          setProvider((settings.provider as AiProviderKind) || 'openai_compatible');
          setModel(settings.model || '');
          setBaseUrl(settings.baseUrl || '');
        }
      } else {
        setModelKey(platformCatalog[0]?.key);
      }
    } catch (e: any) {
      messageApi.error(e?.message || 'Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTest = async () => {
    try {
      setTesting(true);
      const found = await AiSettingsService.testConnection({
        provider,
        apiKey: apiKey || undefined, // backend falls back to the saved key
        baseUrl: baseUrl || undefined,
        model: model || undefined,
      });
      setModels(found);
      messageApi.success(
        found.length ? `Connected — ${found.length} model${found.length === 1 ? '' : 's'} available` : 'Connected (no model list returned)',
      );
    } catch (e: any) {
      messageApi.error(e?.message || 'Connection test failed — check the key / base URL');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Client-side guardrails matching the backend validation.
    if (mode === 'platform' && !modelKey) {
      messageApi.error('Pick a model');
      return;
    }
    if (mode === 'byo') {
      if (!model) { messageApi.error('Enter a model'); return; }
      if (!apiKey && !hasSavedKey) { messageApi.error('Enter an API key'); return; }
    }
    try {
      setSaving(true);
      const saved = await AiSettingsService.updateSettings({
        mode,
        isActive,
        ...(mode === 'platform'
          ? { modelKey }
          : {
              provider,
              model,
              baseUrl: baseUrl || undefined,
              ...(apiKey ? { apiKey } : {}), // keep existing key if left blank
            }),
      });
      messageApi.success('AI settings saved');
      setApiKey('');
      setCurrent((prev) => ({
        ...(prev as AiSettings),
        ...saved,
        hasApiKey: saved.hasApiKey,
        lastError: null,
        lastErrorAt: null,
      }));
    } catch (e: any) {
      messageApi.error(e?.message || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const showBaseUrl = mode === 'byo' && provider === 'openai_compatible';
  const modelOptions = useMemo(() => models.map((m) => ({ value: m })), [models]);

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ width: 'fit-content', maxWidth: '100%' }}>
      {contextHolder}

      <Card
        variant="borderless"
        className="transparent-card"
        style={{
          width: 'fit-content',
          minWidth: 'min(520px, 100%)',
          maxWidth: '100%',
          borderRadius: 0,
          border: `1px solid ${token.colorBorder}`,
          background: 'transparent',
        }}
        styles={{ body: { padding: 0, background: 'transparent' } }}
      >
        {/* Header Block inside the Card */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: `linear-gradient(180deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}>
          <Space size={14} align="center">
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            }}>
              <RobotOutlined style={{ fontSize: 22 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 16, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.01em' }}>
                AI Provider
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Configure the primary language model provider for workspace AI features.
              </Text>
            </div>
          </Space>
        </div>

        {/* Content Wrapper */}
        <div style={{ padding: '24px 32px' }}>
          {current?.lastError && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 24, borderRadius: 8 }}
              message="Your AI key last failed — falling back to the platform AI"
              description={<Text code style={{ fontSize: 12 }}>{current.lastError}</Text>}
            />
          )}

          <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Mode toggle */}
            <div>
              <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                AI Configuration Mode
              </Text>
              <Segmented
                value={mode}
                onChange={(v) => setMode(v as AiMode)}
                disabled={!canManage}
                size="large"
                options={[
                  { value: 'platform', label: <span><ThunderboltFilled /> &nbsp;Platform (included)</span> },
                  { value: 'byo', label: <span><KeyOutlined /> &nbsp;Bring your own key</span> },
                ]}
              />
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {mode === 'platform' 
                    ? 'Runs on the platform\'s shared API keys with no configuration necessary.' 
                    : 'Configure your own private API key and customize which model is used.'}
                </Text>
              </div>
            </div>

            {mode === 'platform' ? (
              <div>
                <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                  Select Bundled Model
                </Text>
                <Select
                  value={modelKey}
                  onChange={setModelKey}
                  disabled={!canManage}
                  size="large"
                  style={{ width: '100%' }}
                  options={catalog.map((c) => ({ value: c.key, label: `${c.label}` }))}
                  placeholder="Select a bundled model"
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Runs on our keys — no setup or billing configuration needed.
                  </Text>
                </div>
              </div>
            ) : (
              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                    Provider
                  </Text>
                  <Select
                    value={provider}
                    onChange={(v) => { setProvider(v); setModels([]); }}
                    disabled={!canManage}
                    size="large"
                    style={{ width: '100%' }}
                    options={BYO_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
                  />
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {BYO_PROVIDERS.find((p) => p.value === provider)?.hint}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                    API Key {hasSavedKey && <Tag color="success" icon={<CheckCircleFilled />} style={{ marginLeft: 6, borderRadius: 4 }}>configured</Tag>}
                  </Text>
                  <Input.Password
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={!canManage}
                    size="large"
                    autoComplete="off"
                    placeholder={hasSavedKey ? (current?.apiKeyMasked || '•••• saved — leave blank to keep') : 'Paste your API key'}
                    prefix={<KeyOutlined style={{ color: token.colorTextTertiary, marginRight: 6 }} />}
                  />
                </div>

                {showBaseUrl && (
                  <div>
                    <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                      Base URL
                    </Text>
                    <Input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      disabled={!canManage}
                      size="large"
                      placeholder="https://api.deepseek.com"
                      prefix={<ApiOutlined style={{ color: token.colorTextTertiary, marginRight: 6 }} />}
                    />
                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        e.g. https://api.deepseek.com, https://api.openai.com/v1, or https://api.groq.com/openai/v1
                      </Text>
                    </div>
                  </div>
                )}

                <div>
                  <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }}>
                    Model
                  </Text>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <AutoComplete
                      value={model}
                      onChange={(v) => setModel(v)}
                      disabled={!canManage}
                      size="large"
                      options={modelOptions}
                      style={{ flex: 1 }}
                      placeholder="e.g. deepseek-v4-pro"
                      filterOption={(input, option) =>
                        (option?.value as string).toLowerCase().includes(input.toLowerCase())
                      }
                    />
                    <Button
                      icon={<ApiOutlined />}
                      loading={testing}
                      disabled={!canManage}
                      size="large"
                      onClick={handleTest}
                      style={{ flexShrink: 0, fontWeight: 600 }}
                    >
                      Test &amp; Load
                    </Button>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {models.length > 0
                        ? `${models.length} model${models.length === 1 ? '' : 's'} loaded successfully. Pick one from the autocomplete list above.`
                        : 'Click "Test & Load" to validate connection parameters and fetch the model library.'}
                    </Text>
                  </div>
                </div>
              </Space>
            )}

            {/* Active + Save */}
            <div style={{
              marginTop: 16,
              paddingTop: 24,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <Space size={12}>
                <Switch checked={isActive} onChange={setIsActive} disabled={!canManage} />
                <div>
                  <Text style={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                    {isActive ? 'AI Active' : 'AI Inactive'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {isActive ? 'This config is active for all AI features.' : 'Disabled — workspace falls back to default.'}
                  </Text>
                </div>
              </Space>
              <Button
                type="primary"
                icon={<ThunderboltFilled />}
                loading={saving}
                disabled={!canManage}
                onClick={handleSave}
                style={{
                  borderRadius: 8,
                  height: 38,
                  fontWeight: 600,
                  fontSize: 13,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 4px 12px -3px rgba(59, 130, 246, 0.3)',
                }}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
