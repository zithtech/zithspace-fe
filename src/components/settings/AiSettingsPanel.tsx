'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Input,
  Switch,
  Button,
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
  CloudServerOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { SearchableDropdown, SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import {
  AiSettingsService,
  AiSettings,
  AiMode,
  AiProviderKind,
  PlatformCatalogEntry,
} from '@/services/aiSettings.service';

const { Text } = Typography;

const BYO_PROVIDERS: { value: AiProviderKind; label: string; hint: string; short: string }[] = [
  { value: 'gemini', label: 'Google Gemini', hint: 'Uses your Gemini API key', short: 'GM' },
  { value: 'openai_compatible', label: 'OpenAI-compatible', hint: 'OpenAI, DeepSeek, Groq, OpenRouter, Together…', short: 'AI' },
  { value: 'anthropic', label: 'Anthropic (Claude)', hint: 'Uses your Anthropic API key', short: 'AN' },
];

/**
 * Scoped styling for the panel. Kept local to the component so the premium
 * treatment (mode cards, numbered steps, summary rail) can't leak into — or be
 * broken by — the rest of the settings page.
 */
const panelStyles = `
  .aip-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 296px;
    gap: 28px;
    align-items: start;
  }
  @media (max-width: 1180px) {
    .aip-grid { grid-template-columns: minmax(0, 1fr); }
  }

  .aip-step { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .aip-step-num {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 800; letter-spacing: 0.02em;
    background: var(--bg-blue-50, #eff6ff);
    color: var(--text-blue-600, #2563eb);
    border: 1px solid var(--border-blue-200, #bfdbfe);
  }
  .aip-step-title {
    font-size: 12px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--text-secondary);
  }

  .aip-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) { .aip-modes { grid-template-columns: 1fr; } }

  .aip-mode-card {
    position: relative; text-align: left; cursor: pointer;
    padding: 14px 16px; border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-secondary, #fff);
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  .aip-mode-card:hover:not(.is-disabled) {
    transform: translateY(-1px);
    border-color: var(--border-blue-200, #bfdbfe);
    box-shadow: 0 6px 18px -10px rgba(15, 23, 42, 0.35);
  }
  .aip-mode-card.is-selected {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6, 0 8px 20px -12px rgba(37, 99, 235, 0.55);
  }
  .aip-mode-card.is-disabled { cursor: not-allowed; opacity: .6; }
  .aip-mode-head { display: flex; align-items: center; gap: 10px; }
  .aip-mode-icon {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-slate-50, #f8fafc);
    color: var(--text-slate-500, #64748b);
    border: 1px solid var(--border-color, #e2e8f0);
    transition: background .16s ease, color .16s ease, border-color .16s ease;
  }
  .aip-mode-card.is-selected .aip-mode-icon {
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    color: #2563EB;
    border-color: var(--border-blue-200, #bfdbfe);
  }
  .aip-mode-name { font-size: 13.5px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
  .aip-mode-desc { display: block; margin-top: 8px; font-size: 11.5px; line-height: 1.5; color: var(--text-secondary); }
  .aip-mode-check { position: absolute; top: 12px; right: 12px; color: #2563EB; font-size: 15px; }

  .aip-label {
    display: block; margin-bottom: 7px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.045em;
    text-transform: uppercase; color: var(--text-slate-400, #94a3b8);
  }
  .aip-hint { display: block; margin-top: 7px; font-size: 11.5px; line-height: 1.5; color: var(--text-secondary); }

  .aip-rail {
    border-radius: 14px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-slate-50, #f8fafc);
    overflow: hidden;
  }
  .aip-rail-head {
    padding: 12px 16px;
    border-bottom: 1px dashed var(--border-color, #e2e8f0);
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .aip-rail-title {
    font-size: 11px; font-weight: 800; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--text-secondary);
  }
  .aip-rail-body { padding: 6px 16px 14px; }
  .aip-rail-row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
    padding: 9px 0; border-bottom: 1px solid var(--border-color, #eef2f7);
  }
  .aip-rail-row:last-child { border-bottom: none; }
  .aip-rail-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400, #94a3b8); white-space: nowrap; }
  .aip-rail-val {
    font-size: 12.5px; font-weight: 600; color: var(--text-primary);
    text-align: right; word-break: break-word; min-width: 0;
  }
  .aip-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

  .aip-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 11px; border-radius: 999px;
    font-size: 11.5px; font-weight: 700; white-space: nowrap;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--bg-secondary, #fff);
    color: var(--text-secondary);
  }
  .aip-pill.is-on {
    border-color: rgba(16, 185, 129, 0.35);
    background: rgba(16, 185, 129, 0.08);
    color: #047857;
  }
  .aip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-slate-300, #cbd5e1); }
  .aip-pill.is-on .aip-dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18); }

  .aip-notice {
    display: flex; gap: 10px; padding: 12px 14px; margin-bottom: 22px;
    border-radius: 10px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-left: 3px solid #f87171;
    background: var(--bg-slate-50, #f8fafc);
  }
`;

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

  /** A blue tile used as the option badge, so the dropdown stays on-palette. */
  const badgeFor = (text: string) => (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9.5,
        fontWeight: 800,
        background: 'var(--bg-blue-50, #eff6ff)',
        color: 'var(--text-blue-600, #2563eb)',
        border: '1px solid var(--border-blue-200, #bfdbfe)',
      }}
    >
      {text}
    </div>
  );

  const catalogOptions: SearchableDropdownOption[] = useMemo(
    () =>
      catalog.map((c) => ({
        value: c.key,
        label: c.label,
        description: c.provider,
        badge: badgeFor(c.provider ? c.provider.slice(0, 2).toUpperCase() : 'AI'),
      })),
    [catalog],
  );

  const providerOptions: SearchableDropdownOption[] = useMemo(
    () =>
      BYO_PROVIDERS.map((p) => ({
        value: p.value,
        label: p.label,
        description: p.hint,
        badge: badgeFor(p.short),
      })),
    [],
  );

  const modelOptions: SearchableDropdownOption[] = useMemo(
    () => models.map((m) => ({ value: m, label: m })),
    [models],
  );

  const providerLabel = BYO_PROVIDERS.find((p) => p.value === provider)?.label ?? '—';
  const selectedCatalog = catalog.find((c) => c.key === modelKey);

  /** True when the editor holds changes that have not been saved yet. */
  const isDirty = useMemo(() => {
    if (!current) return true;
    if (mode !== current.mode || isActive !== current.isActive) return true;
    if (mode === 'platform') return modelKey !== current.model;
    return (
      provider !== current.provider ||
      model !== (current.model || '') ||
      baseUrl !== (current.baseUrl || '') ||
      !!apiKey
    );
  }, [current, mode, isActive, modelKey, provider, model, baseUrl, apiKey]);

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const modeCard = (
    value: AiMode,
    icon: React.ReactNode,
    name: string,
    desc: string,
    chip?: string,
  ) => (
    <div
      role="radio"
      aria-checked={mode === value}
      tabIndex={canManage ? 0 : -1}
      className={`aip-mode-card ${mode === value ? 'is-selected' : ''} ${canManage ? '' : 'is-disabled'}`}
      onClick={() => canManage && setMode(value)}
      onKeyDown={(e) => {
        if (!canManage) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setMode(value);
        }
      }}
    >
      {mode === value && <CheckCircleFilled className="aip-mode-check" />}
      <div className="aip-mode-head">
        <div className="aip-mode-icon">{icon}</div>
        <div>
          <div className="aip-mode-name">{name}</div>
          {chip && (
            <Text style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-slate-400)', letterSpacing: '0.04em' }}>
              {chip}
            </Text>
          )}
        </div>
      </div>
      <span className="aip-mode-desc">{desc}</span>
    </div>
  );

  const railRow = (label: string, value: React.ReactNode) => (
    <div className="aip-rail-row">
      <span className="aip-rail-key">{label}</span>
      <span className="aip-rail-val">{value || <span style={{ color: 'var(--text-slate-300)' }}>—</span>}</span>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {contextHolder}
      <style>{panelStyles}</style>

      <div
        style={{
          width: '100%',
          border: `1px solid ${token.colorBorder}`,
          background: 'transparent',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: `linear-gradient(180deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
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

          <span className={`aip-pill ${current?.isActive ? 'is-on' : ''}`}>
            <span className="aip-dot" />
            {!current
              ? 'Not configured'
              : current.isActive
                ? `Active · ${current.mode === 'platform' ? 'Platform' : 'Your key'}`
                : 'Inactive'}
          </span>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 24px 20px' }}>
          {current?.lastError && (
            <div className="aip-notice">
              <WarningFilled style={{ color: '#f87171', fontSize: 15, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ display: 'block', fontSize: 12.5, color: 'var(--text-primary)' }}>
                  Your AI key last failed — falling back to the platform AI
                </Text>
                <Text className="aip-mono" style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                  {current.lastError}
                </Text>
              </div>
            </div>
          )}

          <div className="aip-grid">
            {/* ── Configuration column ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
              <div>
                <div className="aip-step">
                  <span className="aip-step-num">01</span>
                  <span className="aip-step-title">Configuration mode</span>
                </div>
                <div className="aip-modes" role="radiogroup" aria-label="AI configuration mode">
                  {modeCard(
                    'platform',
                    <ThunderboltFilled style={{ fontSize: 14 }} />,
                    'Platform',
                    'Runs on the platform’s shared API keys. No setup or billing configuration needed.',
                    'INCLUDED',
                  )}
                  {modeCard(
                    'byo',
                    <KeyOutlined style={{ fontSize: 14 }} />,
                    'Bring your own key',
                    'Use your own private API key and choose exactly which model powers AI features.',
                    'ADVANCED',
                  )}
                </div>
              </div>

              {mode === 'platform' ? (
                <div>
                  <div className="aip-step">
                    <span className="aip-step-num">02</span>
                    <span className="aip-step-title">Bundled model</span>
                  </div>
                  <span className="aip-label">Model</span>
                  <SearchableDropdown
                    value={modelKey}
                    onChange={(v) => setModelKey(v || undefined)}
                    options={catalogOptions}
                    disabled={!canManage}
                    placeholder="Select a bundled model"
                    searchPlaceholder="Search models…"
                    itemNoun="models"
                    allowClear={false}
                    showSelectedAvatar
                    width="100%"
                    style={{ width: '100%' }}
                  />
                  <span className="aip-hint">
                    Runs on our keys — usage is included in your plan.
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <div className="aip-step">
                      <span className="aip-step-num">02</span>
                      <span className="aip-step-title">Provider &amp; credentials</span>
                    </div>

                    <span className="aip-label">Provider</span>
                    <SearchableDropdown
                      value={provider}
                      onChange={(v) => { if (v) { setProvider(v as AiProviderKind); setModels([]); } }}
                      options={providerOptions}
                      disabled={!canManage}
                      placeholder="Select a provider"
                      searchPlaceholder="Search providers…"
                      itemNoun="providers"
                      allowClear={false}
                      showSelectedAvatar
                      width="100%"
                      style={{ width: '100%' }}
                    />
                    <span className="aip-hint">
                      {BYO_PROVIDERS.find((p) => p.value === provider)?.hint}
                    </span>
                  </div>

                  <div>
                    <span className="aip-label">
                      API key
                      {hasSavedKey && (
                        <Tag color="success" icon={<CheckCircleFilled />} style={{ marginLeft: 8, borderRadius: 4, textTransform: 'none' }}>
                          configured
                        </Tag>
                      )}
                    </span>
                    <Input.Password
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={!canManage}
                      size="large"
                      autoComplete="off"
                      placeholder={hasSavedKey ? (current?.apiKeyMasked || '•••• saved — leave blank to keep') : 'Paste your API key'}
                      prefix={<KeyOutlined style={{ color: token.colorTextTertiary, marginRight: 6 }} />}
                    />
                    <span className="aip-hint">
                      Stored encrypted. Leave blank to keep the key you already saved.
                    </span>
                  </div>

                  {showBaseUrl && (
                    <div>
                      <span className="aip-label">Base URL</span>
                      <Input
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        disabled={!canManage}
                        size="large"
                        placeholder="https://api.deepseek.com"
                        prefix={<ApiOutlined style={{ color: token.colorTextTertiary, marginRight: 6 }} />}
                      />
                      <span className="aip-hint">
                        e.g. https://api.deepseek.com, https://api.openai.com/v1, or https://api.groq.com/openai/v1
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="aip-step">
                      <span className="aip-step-num">03</span>
                      <span className="aip-step-title">Model</span>
                    </div>
                    <span className="aip-label">Model</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* freeText lets a model that the provider never listed
                            still be typed in and used. */}
                        <SearchableDropdown
                          value={model || undefined}
                          onChange={(v) => setModel(v || '')}
                          options={modelOptions}
                          disabled={!canManage}
                          freeText
                          hideAvatar
                          placeholder="e.g. deepseek-v4-pro"
                          searchPlaceholder="Search or type a model…"
                          itemNoun="models"
                          width="100%"
                          style={{ width: '100%' }}
                          emptyComponent={
                            <div style={{ padding: '18px 12px', textAlign: 'center' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                No models loaded yet — run “Test &amp; Load”, or type a model name.
                              </Text>
                            </div>
                          }
                        />
                      </div>
                      <Button
                        icon={<ApiOutlined />}
                        loading={testing}
                        disabled={!canManage}
                        size="large"
                        onClick={handleTest}
                        style={{ flexShrink: 0, fontWeight: 600, borderRadius: 8 }}
                      >
                        Test &amp; Load
                      </Button>
                    </div>
                    <span className="aip-hint">
                      {models.length > 0
                        ? `${models.length} model${models.length === 1 ? '' : 's'} loaded — pick one from the list above.`
                        : 'Run “Test & Load” to validate the credentials and fetch the model library.'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ── Summary rail ─────────────────────────────────────────── */}
            <aside className="aip-rail">
              <div className="aip-rail-head">
                <span className="aip-rail-title">Configuration</span>
                {isDirty && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-blue-600, #2563eb)' }}>
                    UNSAVED
                  </span>
                )}
              </div>
              <div className="aip-rail-body">
                {railRow('Mode', mode === 'platform' ? 'Platform (included)' : 'Bring your own key')}
                {mode === 'platform'
                  ? railRow('Model', selectedCatalog?.label)
                  : railRow('Provider', providerLabel)}
                {mode === 'byo' && railRow('Model', <span className="aip-mono">{model}</span>)}
                {mode === 'byo' && showBaseUrl && railRow('Base URL', <span className="aip-mono">{baseUrl}</span>)}
                {mode === 'byo' &&
                  railRow(
                    'API key',
                    apiKey ? (
                      'New key entered'
                    ) : hasSavedKey ? (
                      <span style={{ color: '#047857' }}>
                        <CheckCircleFilled style={{ marginRight: 5 }} />
                        Configured
                      </span>
                    ) : (
                      'Not set'
                    ),
                  )}
                {mode === 'byo' && railRow('Models loaded', models.length ? `${models.length}` : null)}
                {railRow('Status', isActive ? 'Active' : 'Inactive')}
              </div>
            </aside>
          </div>
        </div>

        {/* ── Footer: activation + save ───────────────────────────────────── */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorFillAlter,
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
          <Space size={10}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-slate-400)' }}>
              <CloudServerOutlined />
              {mode === 'platform' ? 'Managed by the platform' : 'Runs on your own credentials'}
            </span>
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
          </Space>
        </div>
      </div>
    </div>
  );
}
