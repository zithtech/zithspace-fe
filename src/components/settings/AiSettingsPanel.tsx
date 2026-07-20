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
    <div style={{ maxWidth: 720 }}>
      {contextHolder}

      {/* Header */}
      <Space align="center" size={14} style={{ marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: token.colorPrimaryBg, color: token.colorPrimary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 1px ${token.colorPrimaryBorder}`,
        }}>
          <RobotOutlined style={{ fontSize: 20 }} />
        </div>
        <div>
          <Title level={5} style={{ margin: 0 }}>AI Provider</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Use a bundled model, or bring your own provider and key.
          </Text>
        </div>
      </Space>

      {current?.lastError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Your AI key last failed — falling back to the platform AI"
          description={<Text code style={{ fontSize: 12 }}>{current.lastError}</Text>}
        />
      )}

      <Card variant="borderless" style={{ background: 'transparent', border: `1px solid ${token.colorBorder}` }} styles={{ body: { padding: 20 } }}>
        {/* Mode toggle */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Source</Text>
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as AiMode)}
            disabled={!canManage}
            options={[
              { value: 'platform', label: <span><ThunderboltFilled /> &nbsp;Platform (included)</span> },
              { value: 'byo', label: <span><KeyOutlined /> &nbsp;Bring your own key</span> },
            ]}
          />
        </div>

        {mode === 'platform' ? (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Model</Text>
            <Select
              value={modelKey}
              onChange={setModelKey}
              disabled={!canManage}
              style={{ width: '100%', maxWidth: 420 }}
              options={catalog.map((c) => ({ value: c.key, label: `${c.label}` }))}
              placeholder="Select a bundled model"
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Runs on our keys — no setup needed.
              </Text>
            </div>
          </div>
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Provider</Text>
              <Select
                value={provider}
                onChange={(v) => { setProvider(v); setModels([]); }}
                disabled={!canManage}
                style={{ width: '100%', maxWidth: 420 }}
                options={BYO_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {BYO_PROVIDERS.find((p) => p.value === provider)?.hint}
              </Text>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                API key {hasSavedKey && <Tag color="success" icon={<CheckCircleFilled />} style={{ marginLeft: 6 }}>configured</Tag>}
              </Text>
              <Input.Password
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!canManage}
                autoComplete="off"
                placeholder={hasSavedKey ? (current?.apiKeyMasked || '•••• saved — leave blank to keep') : 'Paste your API key'}
                style={{ maxWidth: 420 }}
                prefix={<KeyOutlined style={{ color: token.colorTextTertiary }} />}
              />
            </div>

            {showBaseUrl && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Base URL</Text>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  disabled={!canManage}
                  placeholder="https://api.deepseek.com"
                  style={{ maxWidth: 420 }}
                  prefix={<ApiOutlined style={{ color: token.colorTextTertiary }} />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  e.g. https://api.deepseek.com, https://api.openai.com/v1, https://api.groq.com/openai/v1
                </Text>
              </div>
            )}

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Model</Text>
              <div style={{ display: 'flex', gap: 8, maxWidth: 420, alignItems: 'center' }}>
                <AutoComplete
                  value={model}
                  onChange={(v) => setModel(v)}
                  disabled={!canManage}
                  options={modelOptions}
                  style={{ flex: 1, minWidth: 0 }}
                  placeholder="e.g. deepseek-v4-pro"
                  filterOption={(input, option) =>
                    (option?.value as string).toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  icon={<ApiOutlined />}
                  loading={testing}
                  disabled={!canManage}
                  onClick={handleTest}
                  style={{ flexShrink: 0 }}
                >
                  Test &amp; load
                </Button>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {models.length > 0
                  ? `${models.length} model${models.length === 1 ? '' : 's'} loaded — pick one above.`
                  : 'Click “Test & load” to validate the key and fetch available models.'}
              </Text>
            </div>
          </Space>
        )}

        {/* Active + Save */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Switch checked={isActive} onChange={setIsActive} disabled={!canManage} />
            <Text>{isActive ? 'Enabled' : 'Disabled'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isActive ? 'This config is used for AI features.' : 'Disabled — the platform default is used.'}
            </Text>
          </Space>
          <Button
            type="primary"
            icon={<ThunderboltFilled />}
            loading={saving}
            disabled={!canManage}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
