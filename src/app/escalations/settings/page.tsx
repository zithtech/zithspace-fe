'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Form,
  Input,
  Row,
  Col,
  App,
  Popconfirm,
  Tooltip,
  ColorPicker,
  Switch,
  Segmented,
  Drawer,
  Skeleton,
  Empty,
  Slider,
  Dropdown,
  Select,
} from 'antd';
import {
  SettingOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  UpSquareOutlined,
  CheckSquareOutlined,
  CheckCircleFilled,
  CloseOutlined,
  InfoCircleOutlined,
  TagsOutlined,
  FireOutlined,
  FlagOutlined,
  StarOutlined,
  BulbOutlined,
  CheckOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  ReloadOutlined,
  AlertOutlined,
  RiseOutlined,
  UnorderedListOutlined,
  MenuOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { EscalationSettingsService } from '@/services/escalationSettings';
import { useActivitySource } from '@/hooks/useActivitySource';

const { Text } = Typography;

const BLUE_PRIMARY = 'var(--premium-blue)';

interface EscalationCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

interface EscalationPriority {
  id: string;
  name: string;
  weight: number;
  color: string | null;
  isActive: boolean;
}

interface EscalationStatus {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  isDefault?: boolean;
  isFinal?: boolean;
}

type TabKey = 'categories' | 'priorities' | 'statuses';

/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
  delta?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, subtle, loading, chart, delta }) => (
  <div className="es-stat-card">
    <div className="es-stat-top">
      <div className="es-stat-left">
        <span className="es-stat-icon" style={{ background: `${accent}1c`, color: accent }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="es-stat-label">{label}</span>
          {subtle && <span style={{ fontSize: 10, color: 'var(--text-slate-400)', marginTop: 1 }}>{subtle}</span>}
        </div>
      </div>
      {delta !== undefined && delta > 0 && (
        <Tooltip title="New this week">
          <span
            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold px-[6px] py-[2px] rounded-full"
            style={{ color: accent, background: `${accent}1c` }}
          >
            <RiseOutlined style={{ fontSize: 11 }} />+{delta}
          </span>
        </Tooltip>
      )}
    </div>

    <div className="es-stat-bottom">
      <div className="es-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="es-stat-value">{value}</span>
        )}
      </div>
      {chart && (
        <div className="es-stat-spark">{chart}</div>
      )}
    </div>
  </div>
);

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;
  const width = 72;
  const height = 28;
  const bottomPadding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    let y = height - bottomPadding;
    if (max > min) {
      y = height - bottomPadding - ((d - min) / range) * (height - bottomPadding - 2);
    }
    return { x, y };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x},${points[i].y}`;
  }

  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const isFlat = data.every(d => d === data[0]);
  const flatY = 2;
  const flatPathD = `M 0,${flatY} L ${width},${flatY}`;
  const flatFillD = `${flatPathD} L ${width},${height} L 0,${height} Z`;

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={isFlat ? flatFillD : fillD} fill={`url(#${gradId})`} />
      <path d={isFlat ? flatPathD : pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const getStylizedTrend = (total: number) => {
  if (total === 0) return [0, 0, 0, 0, 0, 0, 0];
  return [0.0, 0.3, 0.25, 0.5, 0.65, 0.8, 1.0].map(r => r * total);
};

/* -------------------------------------------------------------------------- */
/*                       Color preset swatches                                */
/* -------------------------------------------------------------------------- */

const COLOR_PRESETS: { hex: string; name: string }[] = [
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#10b981', name: 'Green' },
  { hex: '#94a3b8', name: 'Grey' },
  { hex: '#f59e0b', name: 'Light Orange' },
];

const normalizeColor = (color?: any): string => {
  if (!color) return '#94a3b8'; // default grey
  const c = String(color).toLowerCase();
  if (c === '#3b82f6' || c === 'blue' || c.includes('blue') || c === '#0ea5e9' || c === '#06b6d4' || c === '#6366f1' || c === '#096dd9') {
    return '#3b82f6'; // blue
  }
  if (c === '#10b981' || c === 'green' || c.includes('green') || c === '#25d366' || c === '#14a800' || c === '#1dbf73') {
    return '#10b981'; // green
  }
  if (c === '#f59e0b' || c === 'orange' || c.includes('orange') || c === '#ff7a18' || c === '#ff7c00' || c === '#ec4899' || c === '#ef4444' || c === '#8b5cf6') {
    return '#f59e0b'; // light orange
  }
  return '#94a3b8'; // grey
};

const severityBucket = (w: number): { label: string; color: string } => {
  if (w >= 80) return { label: 'Critical', color: '#ef4444' };
  if (w >= 60) return { label: 'High', color: '#f97316' };
  if (w >= 30) return { label: 'Medium', color: '#f59e0b' };
  return { label: 'Low', color: '#10b981' };
};

/* -------------------------------------------------------------------------- */
/*                    Drawer Body — premium SaaS form                         */
/* -------------------------------------------------------------------------- */

interface SettingsDrawerBodyProps {
  activeTab: TabKey;
  form: any;
  editingItem: any;
  onSubmit: (values: any) => void;
}

const SettingsDrawerBody: React.FC<SettingsDrawerBodyProps> = ({
  activeTab,
  form,
  editingItem,
  onSubmit,
}) => {
  // Live values
  const watchedName: string = Form.useWatch('name', form) || '';
  const watchedDescription: string = Form.useWatch('description', form) || '';
  const watchedColorRaw = Form.useWatch('color', form);
  const watchedColor = normalizeColor(watchedColorRaw);
  const watchedWeight: number = Form.useWatch('weight', form) ?? 0;
  const watchedIsActive: boolean = Form.useWatch('isActive', form) ?? true;
  const watchedIsDefault: boolean = Form.useWatch('isDefault', form) ?? false;
  const watchedIsFinal: boolean = Form.useWatch('isFinal', form) ?? false;

  const bucket = severityBucket(watchedWeight);

  // Step done flags
  const stepIdentityDone = !!watchedName.trim();
  const stepAppearanceDone = !!watchedColor;

  /* Preview chip */
  const previewChip = () => {
    const displayName = watchedName.trim() || `New ${activeTab === 'categories' ? 'category' : activeTab === 'priorities' ? 'priority' : 'status'}`;

    if (activeTab === 'categories') {
      return (
        <div className="es-preview-chip is-category" style={{ ['--swatch' as any]: watchedColor }}>
          <span className="es-preview-chip__bar" />
          <span className="es-preview-chip__name">{displayName}</span>
        </div>
      );
    }
    if (activeTab === 'priorities') {
      return (
        <div className="es-preview-chip is-priority" style={{ ['--swatch' as any]: watchedColor }}>
          <span className="es-preview-chip__dot" />
          <span className="es-preview-chip__name">{displayName.toUpperCase()}</span>
          <span className="es-preview-chip__weight">{watchedWeight}</span>
        </div>
      );
    }
    return (
      <div className="es-preview-chip is-status" style={{ ['--swatch' as any]: watchedColor }}>
        <span className="es-preview-chip__pulse" />
        <span className="es-preview-chip__name">{displayName}</span>
        {watchedIsDefault && (
          <span className="es-preview-chip__flag is-default">
            <StarOutlined /> Default
          </span>
        )}
        {watchedIsFinal && (
          <span className="es-preview-chip__flag is-final">
            <CheckCircleFilled /> Final
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Hero with live preview */}
      <div className="es-drawer__hero">
        <div className="es-drawer__hero-top">
          <div className="es-drawer__hero-icon">
            {activeTab === 'categories' ? (
              <TagsOutlined />
            ) : activeTab === 'priorities' ? (
              <FireOutlined />
            ) : (
              <FlagOutlined />
            )}
          </div>
          <div className="es-drawer__hero-text">
            <div className="es-drawer__hero-title">
              {editingItem ? 'Edit' : 'New'}{' '}
              {activeTab === 'categories' ? 'Category' : activeTab === 'priorities' ? 'Priority' : 'Status'}
            </div>
            <div className="es-drawer__hero-sub">
              {activeTab === 'categories' && 'Define an issue type for grouping escalations.'}
              {activeTab === 'priorities' && 'Add a severity level with a numeric weight for triage.'}
              {activeTab === 'statuses' && 'Define a lifecycle stage and its behaviour.'}
            </div>
          </div>
        </div>

        <div className="es-drawer__hero-preview">
          <span className="es-drawer__hero-preview-label">Live preview</span>
          {previewChip()}
        </div>
      </div>

      {/* Body */}
      <div className="es-drawer__body">
        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          {/* Section 1: Identity */}
          <div className={`es-section${stepIdentityDone ? ' is-done' : ''}`}>
            <div className="es-section__header">
              <div className="es-section__step">{stepIdentityDone ? <CheckOutlined /> : '1'}</div>
              <div className="es-section__icon">
                <AppstoreOutlined />
              </div>
              <div className="es-section__text">
                <div className="es-section__title">Identity</div>
                <div className="es-section__sub">A clear name everyone can recognise</div>
              </div>
            </div>

            <Form.Item
              name="name"
              label="Display name"
              rules={[
                { required: true, message: 'Enter a name' },
                { 
                  pattern: /^[a-zA-Z0-9\s.,!?'"()-]+$/, 
                  message: 'Name can only contain letters, numbers, and basic punctuation' 
                }
              ]}
            >
              <Input
                placeholder={
                  activeTab === 'categories'
                    ? 'e.g. Deployment Failure'
                    : activeTab === 'priorities'
                      ? 'e.g. Critical'
                      : 'e.g. In Review'
                }
                className="es-input"
                maxLength={64}
                showCount
                onKeyPress={(e) => {
                  if (!/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            {activeTab === 'categories' && (
              <Form.Item name="description" label="Description (optional)">
                <Input.TextArea
                  rows={3}
                  placeholder="Briefly describe when this category should be used"
                  className="es-textarea"
                  maxLength={240}
                  showCount
                />
              </Form.Item>
            )}
          </div>

          {/* Section: Severity (priorities only) */}
          {activeTab === 'priorities' && (
            <div className="es-section">
              <div className="es-section__header">
                <div className="es-section__step">2</div>
                <div className="es-section__icon" style={{ color: bucket.color, background: `${bucket.color}14` }}>
                  <FireOutlined />
                </div>
                <div className="es-section__text">
                  <div className="es-section__title">Severity weight</div>
                  <div className="es-section__sub">Higher weight = higher severity. 80+ shows as High Priority on the dashboard.</div>
                </div>
                <div className="es-section__badge" style={{ background: `${bucket.color}14`, color: bucket.color, borderColor: `${bucket.color}40` }}>
                  {bucket.label}
                </div>
              </div>

              <div className="es-severity">
                <Form.Item name="weight" style={{ marginBottom: 0 }}>
                  <Slider
                    min={0}
                    max={100}
                    className="es-severity-slider"
                    tooltip={{ formatter: (v) => `${v}` }}
                    marks={{
                      0: <span className="es-severity-mark">Low</span>,
                      30: <span className="es-severity-mark">Med</span>,
                      60: <span className="es-severity-mark">High</span>,
                      80: <span className="es-severity-mark is-critical">Critical</span>,
                      100: '',
                    }}
                  />
                </Form.Item>
                <div className="es-severity-value">
                  <span className="es-severity-value__big">{watchedWeight}</span>
                  <span className="es-severity-value__sub">/ 100</span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Appearance (compact) */}
          <div className={`es-section${stepAppearanceDone ? ' is-done' : ''}`}>
            <div className="es-section__header">
              <div className="es-section__step">
                {stepAppearanceDone ? <CheckOutlined /> : activeTab === 'priorities' ? '3' : '2'}
              </div>
              <div className="es-section__icon">
                <BgColorsOutlined />
              </div>
              <div className="es-section__text">
                <div className="es-section__title">Appearance</div>
                <div className="es-section__sub">Pick a color &amp; visibility</div>
              </div>
            </div>

            <div className="es-appearance-row">
              <div className="es-swatch-row">
                {COLOR_PRESETS.map((c) => {
                  const isSelected = watchedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <Tooltip key={c.hex} title={c.name}>
                      <button
                        type="button"
                        className={`es-swatch${isSelected ? ' is-selected' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => form.setFieldValue('color', c.hex)}
                        aria-label={c.name}
                      >
                        {isSelected && <CheckOutlined />}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>

              <Form.Item name="color" noStyle>
                <Select
                  style={{ width: 140 }}
                  options={[
                    { value: '#3b82f6', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} /> Blue</span> },
                    { value: '#10b981', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} /> Green</span> },
                    { value: '#94a3b8', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#94a3b8' }} /> Grey</span> },
                    { value: '#f59e0b', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} /> Light Orange</span> },
                  ]}
                />
              </Form.Item>
            </div>

            <div className="es-visibility-row">
              <Form.Item
                name="isActive"
                valuePropName="checked"
                initialValue={true}
                noStyle
              >
                <Switch size="small" />
              </Form.Item>
              <div className={`es-visibility-state${watchedIsActive ? ' is-on' : ' is-off'}`}>
                {watchedIsActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                <span>
                  {watchedIsActive ? 'Visible to new escalations' : 'Hidden from new escalations'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Behavior (statuses only) */}
          {activeTab === 'statuses' && (
            <div className="es-section">
              <div className="es-section__header">
                <div className="es-section__step">3</div>
                <div className="es-section__icon">
                  <BulbOutlined />
                </div>
                <div className="es-section__text">
                  <div className="es-section__title">Behavior</div>
                  <div className="es-section__sub">How this status behaves in the lifecycle</div>
                </div>
              </div>

              <div className="es-toggle-cards">
                <Form.Item name="isDefault" valuePropName="checked" hidden>
                  <Switch />
                </Form.Item>
                <button
                  type="button"
                  className={`es-toggle-card${watchedIsDefault ? ' is-on is-default' : ''}`}
                  onClick={() => form.setFieldValue('isDefault', !watchedIsDefault)}
                >
                  <div className="es-toggle-card__icon">
                    <StarOutlined />
                  </div>
                  <div className="es-toggle-card__text">
                    <div className="es-toggle-card__title">Default status</div>
                    <div className="es-toggle-card__sub">New escalations start with this status</div>
                  </div>
                  <span className={`es-toggle-card__switch${watchedIsDefault ? ' is-on' : ''}`}>
                    <span className="es-toggle-card__thumb" />
                  </span>
                </button>

                <Form.Item name="isFinal" valuePropName="checked" hidden>
                  <Switch />
                </Form.Item>
                <button
                  type="button"
                  className={`es-toggle-card${watchedIsFinal ? ' is-on is-final' : ''}`}
                  onClick={() => form.setFieldValue('isFinal', !watchedIsFinal)}
                >
                  <div className="es-toggle-card__icon">
                    <CheckCircleFilled />
                  </div>
                  <div className="es-toggle-card__text">
                    <div className="es-toggle-card__title">Final state</div>
                    <div className="es-toggle-card__sub">Terminal stage — counts toward "resolved" stats</div>
                  </div>
                  <span className={`es-toggle-card__switch${watchedIsFinal ? ' is-on' : ''}`}>
                    <span className="es-toggle-card__thumb" />
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="es-info-banner">
            <InfoCircleOutlined />
            <span>
              {editingItem ? 'Saving will update this item across all related escalations instantly.' : 'This item becomes available the moment you save.'}
            </span>
          </div>

          {/* Description suppressed in form summary, but description still bound for categories */}
          {activeTab !== 'categories' && watchedDescription && null}
        </Form>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function EscalationSettingsPage() {
  console.log("Forcing HMR reload for EscalationSettingsPage");
  useActivitySource({ section: "WORK", module: "Escalations", page: "EscalationSettings" });
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canManageEscalations } = usePermission();

  const [activeTab, setActiveTab] = useState<TabKey>('categories');
  const [categories, setCategories] = useState<EscalationCategory[]>([]);
  const [priorities, setPriorities] = useState<EscalationPriority[]>([]);
  const [statuses, setStatuses] = useState<EscalationStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const { message } = App.useApp();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    if (type === 'success') {
      message.success(`${title} - ${description}`);
    } else {
      message.error(`${title} - ${description}`);
    }
  };

  /* ----------------------------- Fetchers ---------------------------------- */

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, p, s] = await Promise.all([
        EscalationSettingsService.getCategories(),
        EscalationSettingsService.getPriorities(),
        EscalationSettingsService.getStatuses(),
      ]);
      setCategories(c || []);
      setPriorities(p || []);
      setStatuses(s || []);
    } catch (error: any) {
      notifyPremium(
        'error',
        'Fetch Failed',
        'Failed to fetch settings: ' + (error.message || 'Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  // Route guard
  useEffect(() => {
    if (!authLoading && user && !canManageEscalations) {
      router.push('/escalations');
    }
  }, [user, authLoading, canManageEscalations, router]);

  useEffect(() => {
    if (canManageEscalations) fetchAll();
  }, [canManageEscalations]);

  /* ----------------------------- Stats ------------------------------------- */

  const stats = useMemo(() => {
    return {
      categoriesTotal: categories.length,
      categoriesActive: categories.filter((c) => c.isActive).length,
      categoriesInactive: categories.filter((c) => !c.isActive).length,
      prioritiesTotal: priorities.length,
      prioritiesActive: priorities.filter((p) => p.isActive).length,
      prioritiesAvgWeight:
        priorities.length > 0
          ? Math.round(
            priorities.reduce((sum, p) => sum + (p.weight || 0), 0) / priorities.length,
          )
          : 0,
      statusesTotal: statuses.length,
      statusesActive: statuses.filter((s) => s.isActive).length,
      statusesDefault: statuses.filter((s) => s.isDefault).length,
      statusesFinal: statuses.filter((s) => s.isFinal).length,
    };
  }, [categories, priorities, statuses]);

  /* --------------------------- Modal handlers ------------------------------ */

  const handleOpenDrawer = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        ...item,
        color: item.color || '#3b82f6',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ color: '#3b82f6', weight: 0, isActive: true });
    }
    setDrawerOpen(true);
  };

  const handleSave = async (values: any) => {
    const colorValue =
      typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || values.color;
    const payload = { ...values, color: colorValue };

    setSaving(true);
    try {
      if (activeTab === 'categories') {
        if (editingItem)
          await EscalationSettingsService.updateCategory(editingItem.id, payload);
        else await EscalationSettingsService.createCategory(payload);
        notifyPremium(
          'success',
          `Category ${editingItem ? 'Updated' : 'Created'}`,
          `The category has been ${editingItem ? 'updated' : 'added'} successfully.`,
        );
      } else if (activeTab === 'priorities') {
        if (editingItem)
          await EscalationSettingsService.updatePriority(editingItem.id, payload);
        else await EscalationSettingsService.createPriority(payload);
        notifyPremium(
          'success',
          `Priority ${editingItem ? 'Updated' : 'Created'}`,
          `The priority has been ${editingItem ? 'updated' : 'added'} successfully.`,
        );
      } else {
        if (editingItem)
          await EscalationSettingsService.updateStatus(editingItem.id, payload);
        else await EscalationSettingsService.createStatus(payload);
        notifyPremium(
          'success',
          `Status ${editingItem ? 'Updated' : 'Created'}`,
          `The status has been ${editingItem ? 'updated' : 'added'} successfully.`,
        );
      }
      setDrawerOpen(false);
      fetchAll();
    } catch (error: any) {
      notifyPremium('error', 'Save Failed', 'Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'categories') await EscalationSettingsService.deactivateCategory(id);
      else if (activeTab === 'priorities') await EscalationSettingsService.deactivatePriority(id);
      else await EscalationSettingsService.deactivateStatus(id);
      notifyPremium(
        'success',
        'Deactivated',
        'The item has been retired from escalation settings.',
      );
      fetchAll();
    } catch (error: any) {
      notifyPremium(
        'error',
        'Deactivation Failed',
        'Failed to deactivate: ' + (error.message || 'Unknown error'),
      );
    }
  };

  /* ----------------------------- Columns ----------------------------------- */

  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EscalationCategory) => (
        <div className="es-row-main">
          <span
            className="es-color-chip"
            style={{ ['--swatch' as any]: normalizeColor(record.color) }}
          />
          <div className="es-row-text">
            <div className="es-row-title">{name}</div>
            {record.description && <div className="es-row-sub">{record.description}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <span className={`es-status-pill ${active ? 'is-active' : 'is-inactive'}`}>
          <span className="es-status-dot" />
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationCategory) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              title="Retire Category?"
              description="Inactive items won't appear in new escalations."
              confirmText="Retire"
              cancelText="Cancel"
              placement="topRight"
              onConfirm={() => handleDelete(record.id)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Retire">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </div>
            </ConfirmDialog>
          </div>
        ),
    },
  ];

  const priorityColumns = [
    {
      title: 'Priority',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EscalationPriority) => (
        <div className="es-row-main">
          <span
            className="es-color-chip is-square"
            style={{ ['--swatch' as any]: normalizeColor(record.color) }}
          />
          <div className="es-row-text">
            <div className="es-row-title">{name}</div>
            <div className="es-row-sub">Weight {record.weight}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'weight',
      key: 'weight',
      width: 220,
      render: (weight: number) => (
        <div className="es-weight-row">
          <div className="es-weight-track">
            <span
              className="es-weight-fill"
              style={{ width: `${Math.min(100, Math.max(0, weight))}%` }}
            />
          </div>
          <span className="es-weight-label">{weight}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <span className={`es-status-pill ${active ? 'is-active' : 'is-inactive'}`}>
          <span className="es-status-dot" />
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationPriority) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              title="Retire Priority?"
              description="Inactive items won't appear in new escalations."
              confirmText="Retire"
              cancelText="Cancel"
              placement="topRight"
              onConfirm={() => handleDelete(record.id)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Retire">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </div>
            </ConfirmDialog>
          </div>
        ),
    },
  ];

  const statusColumns = [
    {
      title: 'Status',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: EscalationStatus) => (
        <div className="es-row-main">
          <span
            className="es-color-chip"
            style={{ ['--swatch' as any]: normalizeColor(record.color) }}
          />
          <div className="es-row-text">
            <div className="es-row-title">{name}</div>
            <div className="es-row-flags">
              {record.isDefault && (
                <span className="es-flag is-default">
                  <StarOutlined /> Default
                </span>
              )}
              {record.isFinal && (
                <span className="es-flag is-final">
                  <CheckCircleFilled /> Final
                </span>
              )}
              {!record.isDefault && !record.isFinal && (
                <span className="es-row-sub">Intermediate state</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (active: boolean) => (
        <span className={`es-status-pill ${active ? 'is-active' : 'is-inactive'}`}>
          <span className="es-status-dot" />
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationStatus) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined style={{ fontSize: 16 }} />}
              title="Retire Status?"
              description="Inactive items won't appear in new escalations."
              confirmText="Retire"
              cancelText="Cancel"
              placement="topRight"
              onConfirm={() => handleDelete(record.id)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Retire">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </div>
            </ConfirmDialog>
          </div>
        ),
    },
  ];

  /* ----------------------------- Active section --------------------------- */

  const activeSection = useMemo(() => {
    if (activeTab === 'categories') {
      return {
        data: categories,
        columns: categoryColumns,
        singular: 'Category',
        empty: 'No categories yet — create one to start grouping escalations.',
      };
    }
    if (activeTab === 'priorities') {
      return {
        data: priorities,
        columns: priorityColumns,
        singular: 'Priority',
        empty: 'No priorities yet — add severity levels to triage escalations.',
      };
    }
    return {
      data: statuses,
      columns: statusColumns,
      singular: 'Status',
      empty: 'No statuses yet — define the lifecycle stages of an escalation.',
    };
  }, [activeTab, categories, priorities, statuses, canManageEscalations]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return activeSection.data;
    return activeSection.data.filter((item: any) => {
      const nameMatch = item.name?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  }, [activeSection.data, searchQuery]);

  /* ------------------------------ Render ----------------------------------- */

  return (
    <MainLayout>
      <div className="es-shell">
        {mobileSidebarOpen && (
          <div className="es-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />
        )}
        {/* ============================ SIDEBAR ============================ */}
        <aside className={`es-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
          <div className="es-sidebar-top">
            <div className="es-side-head">
              <div className="es-side-logo"><SettingOutlined style={{ color: BLUE_PRIMARY }} /></div>
              <div className="es-side-head-text">
                <div className="es-side-title">Settings</div>
                <div className="es-side-subtitle">Escalations Data</div>
              </div>
            </div>

            {canManageEscalations && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="es-create-btn"
                onClick={() => handleOpenDrawer()}
                block
              >
                Add {activeSection.singular}
              </Button>
            )}
          </div>

          <div className="es-side-scroll">
            <div className="es-side-section-label">Master Data</div>
            <div className="es-side-list">
              <button
                type="button"
                className={`es-view-item ${activeTab === 'categories' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                <span className="es-view-icon" style={{ color: activeTab === 'categories' ? '#3B82F6' : 'var(--text-slate-400)' }}><BlockOutlined /></span>
                <span className="es-view-label">Categories</span>
                <span className="es-view-count">{categories.length}</span>
              </button>
              <button
                type="button"
                className={`es-view-item ${activeTab === 'priorities' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('priorities')}
              >
                <span className="es-view-icon" style={{ color: activeTab === 'priorities' ? '#ef4444' : 'var(--text-slate-400)' }}><UpSquareOutlined /></span>
                <span className="es-view-label">Priorities</span>
                <span className="es-view-count">{priorities.length}</span>
              </button>
              <button
                type="button"
                className={`es-view-item ${activeTab === 'statuses' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('statuses')}
              >
                <span className="es-view-icon" style={{ color: activeTab === 'statuses' ? '#10b981' : 'var(--text-slate-400)' }}><CheckSquareOutlined /></span>
                <span className="es-view-label">Statuses</span>
                <span className="es-view-count">{statuses.length}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="es-main">
          <div className="es-topbar">
            <Button
              className="es-mobile-menu-btn"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileSidebarOpen(true)}
              style={{ marginRight: 8 }}
            />
            <div className="es-search-wrap">
              <SearchOutlined className="es-search-icon" />
              <input
                className="es-search"
                placeholder={`Search ${activeSection.singular.toLowerCase()}s…`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="es-topbar-meta">
              <span className="es-meta-item"><span className="es-pulse" /><strong>{activeSection.data.length}</strong> total {activeSection.singular.toLowerCase()}s</span>
            </div>
            <div className="es-topbar-actions">
              <div className="es-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="es-ghost-btn" onClick={fetchAll}><ReloadOutlined spin={loading} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="es-divider" />

          {/* Stats overview */}
          <div className="es-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <StatCard
              label="Categories"
              value={stats.categoriesTotal}
              icon={<TagsOutlined />}
              accent="#3b82f6"
              subtle="Issue type buckets"
              loading={loading && stats.categoriesTotal === 0}
              chart={
                stats.categoriesTotal > 0 ? (
                  <Sparkline data={getStylizedTrend(stats.categoriesTotal)} color="#3b82f6" />
                ) : null
              }
            />

            <StatCard
              label="Priorities"
              value={stats.prioritiesTotal}
              icon={<FireOutlined />}
              accent="#ef4444"
              subtle={
                stats.prioritiesTotal > 0
                  ? `Avg weight ${stats.prioritiesAvgWeight}`
                  : 'No priorities yet'
              }
              loading={loading && stats.prioritiesTotal === 0}
              chart={
                stats.prioritiesTotal > 0 ? (
                  <Sparkline data={getStylizedTrend(stats.prioritiesTotal)} color="#ef4444" />
                ) : null
              }
            />

            <StatCard
              label="Statuses"
              value={stats.statusesTotal}
              icon={<FlagOutlined />}
              accent="#10b981"
              subtle="Lifecycle stages"
              loading={loading && stats.statusesTotal === 0}
              chart={
                stats.statusesTotal > 0 ? (
                  <Sparkline data={getStylizedTrend(stats.statusesTotal)} color="#10b981" />
                ) : null
              }
            />
          </div>

          {/* Switcher + content card */}
          {/* Table / Panel */}
          <div className="es-body">
            {!loading && activeSection.data.length === 0 ? (
              <div className="es-empty">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: 'var(--text-slate-500)', fontSize: 13 }}>
                      {activeSection.empty}
                    </span>
                  }
                >
                  {canManageEscalations && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleOpenDrawer()}
                      className="es-primary-btn"
                    >
                      Add {activeSection.singular}
                    </Button>
                  )}
                </Empty>
              </div>
            ) : view === 'list' ? (
              <div className="es-table-wrap">
                <Table
                  className="es-table"
                  size="small"
                  dataSource={filteredData as any}
                  columns={activeSection.columns as any}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  rowClassName={() => 'es-row'}
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('.ant-popconfirm, .ant-popover, button, input, .ant-select, .ant-dropdown-trigger')) return;
                      handleOpenDrawer(record);
                    },
                    className: 'es-row',
                  })}
                />
              </div>
            ) : (
              <div className="es-grid">
                {loading ? (
                  <div className="es-grid-loading">Loading…</div>
                ) : (
                  filteredData.map((item: any) => {
                    if (activeTab === 'categories') {
                      return (
                        <div key={item.id} className="ec-card group transition-all flex flex-col relative cursor-pointer" onClick={() => handleOpenDrawer(item)}>
                          <div className="ec-top">
                            <div
                              className="ec-avatar"
                              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                            >
                              {item.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ec-identity-body">
                              <div className="ec-title">{item.name}</div>
                              <div className="ec-category-line">
                                <span className="ec-category-key">Description:</span>
                                <span className="ec-category-val" title={item.description || 'No description'}>
                                  {item.description || 'No description'}
                                </span>
                              </div>
                            </div>
                            {canManageEscalations && (
                              <Dropdown
                                overlayClassName="es-action-pop"
                                menu={{
                                  items: [
                                    {
                                      key: 'edit',
                                      label: (
                                        <div className="es-menu-item">
                                          <span className="es-menu-ic" style={{ color: '#64748b', background: 'rgba(100,116,139,0.10)' }}><EditOutlined /></span>
                                          <span className="es-menu-text">
                                            <span className="es-menu-title">Edit</span>
                                            <span className="es-menu-desc">Modify this {activeSection.singular.toLowerCase()}</span>
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e: any) => { e.domEvent.stopPropagation(); handleOpenDrawer(item); }
                                    },
                                    { type: 'divider' as const },
                                    {
                                      key: 'delete',
                                      danger: true,
                                      label: (
                                        <div className="es-menu-item">
                                          <span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.10)' }}><DeleteOutlined /></span>
                                          <span className="es-menu-text">
                                            <span className="es-menu-title">Retire</span>
                                            <span className="es-menu-desc">Remove from active use</span>
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e: any) => { e.domEvent.stopPropagation(); handleDelete(item.id); }
                                    },
                                  ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                              >
                                <button type="button" className="ec-actions" onClick={(e) => e.stopPropagation()}>
                                  <EllipsisOutlined />
                                </button>
                              </Dropdown>
                            )}
                          </div>
                          <div className="ec-foot">
                            <div className="ec-foot-row">
                              <span className="ec-foot-item">
                                <span className="ec-foot-key">Status:</span>
                                <span className={`es-status-pill ${item.isActive ? 'is-active' : 'is-inactive'}`}>
                                  <span className="es-status-dot" />
                                  {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (activeTab === 'priorities') {
                      return (
                        <div key={item.id} className="ec-card group transition-all flex flex-col relative cursor-pointer" onClick={() => handleOpenDrawer(item)}>
                          <div className="ec-top">
                            <div
                              className="ec-avatar"
                              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                            >
                              {item.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ec-identity-body">
                              <div className="ec-title">{item.name}</div>
                              <div className="ec-category-line">
                                <span className="ec-category-key">Weight:</span>
                                <span className="ec-category-val">{item.weight}</span>
                              </div>
                            </div>
                            {canManageEscalations && (
                              <Dropdown
                                overlayClassName="es-action-pop"
                                menu={{
                                  items: [
                                    {
                                      key: 'edit',
                                      label: (
                                        <div className="es-menu-item">
                                          <span className="es-menu-ic" style={{ color: '#64748b', background: 'rgba(100,116,139,0.10)' }}><EditOutlined /></span>
                                          <span className="es-menu-text">
                                            <span className="es-menu-title">Edit</span>
                                            <span className="es-menu-desc">Modify this {activeSection.singular.toLowerCase()}</span>
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e: any) => { e.domEvent.stopPropagation(); handleOpenDrawer(item); }
                                    },
                                    { type: 'divider' as const },
                                    {
                                      key: 'delete',
                                      danger: true,
                                      label: (
                                        <div className="es-menu-item">
                                          <span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.10)' }}><DeleteOutlined /></span>
                                          <span className="es-menu-text">
                                            <span className="es-menu-title">Retire</span>
                                            <span className="es-menu-desc">Remove from active use</span>
                                          </span>
                                        </div>
                                      ),
                                      onClick: (e: any) => { e.domEvent.stopPropagation(); handleDelete(item.id); }
                                    },
                                  ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                              >
                                <button type="button" className="ec-actions" onClick={(e) => e.stopPropagation()}>
                                  <EllipsisOutlined />
                                </button>
                              </Dropdown>
                            )}
                          </div>
                          <div className="ec-foot">
                            <div className="ec-foot-row">
                              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-slate-400)', flexShrink: 0 }}>Weight</span>
                                <div style={{ flex: 1, height: 6, background: 'var(--border-slate-200)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, Math.max(2, item.weight))}%`,
                                    background: normalizeColor(item.color),
                                    borderRadius: 99,
                                    transition: 'width 0.3s ease',
                                  }} />
                                </div>
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-slate-700)', flexShrink: 0, minWidth: 20, textAlign: 'right' }}>{item.weight}</span>
                              </div>
                            </div>
                            <div className="ec-foot-row" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                              <span className="ec-foot-item">
                                <span className="ec-foot-key">Status:</span>
                                <span className={`es-status-pill ${item.isActive ? 'is-active' : 'is-inactive'}`}>
                                  <span className="es-status-dot" />
                                  {item.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} className="ec-card group transition-all flex flex-col relative cursor-pointer" onClick={() => handleOpenDrawer(item)}>
                        <div className="ec-top">
                          <div
                            className="ec-avatar"
                            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
                          >
                            {item.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ec-identity-body">
                            <div className="ec-title">{item.name}</div>
                            <div className="es-row-flags" style={{ marginTop: 2 }}>
                              {item.isDefault && (
                                <span className="es-flag is-default" style={{ marginRight: 6 }}>
                                  <StarOutlined /> Default
                                </span>
                              )}
                              {item.isFinal && (
                                <span className="es-flag is-final">
                                  <CheckCircleFilled /> Final
                                </span>
                              )}
                              {!item.isDefault && !item.isFinal && (
                                <span className="es-row-sub" style={{ fontSize: 11 }}>Intermediate state</span>
                              )}
                            </div>
                          </div>
                          {canManageEscalations && (
                            <Dropdown
                              overlayClassName="es-action-pop"
                              menu={{
                                items: [
                                  {
                                    key: 'edit',
                                    label: (
                                      <div className="es-menu-item">
                                        <span className="es-menu-ic" style={{ color: '#64748b', background: 'rgba(100,116,139,0.10)' }}><EditOutlined /></span>
                                        <span className="es-menu-text">
                                          <span className="es-menu-title">Edit</span>
                                          <span className="es-menu-desc">Modify this {activeSection.singular.toLowerCase()}</span>
                                        </span>
                                      </div>
                                    ),
                                    onClick: (e: any) => { e.domEvent.stopPropagation(); handleOpenDrawer(item); }
                                  },
                                  { type: 'divider' as const },
                                  {
                                    key: 'delete',
                                    danger: true,
                                    label: (
                                      <div className="es-menu-item">
                                        <span className="es-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.10)' }}><DeleteOutlined /></span>
                                        <span className="es-menu-text">
                                          <span className="es-menu-title">Retire</span>
                                          <span className="es-menu-desc">Remove from active use</span>
                                        </span>
                                      </div>
                                    ),
                                    onClick: (e: any) => { e.domEvent.stopPropagation(); handleDelete(item.id); }
                                  },
                                ]
                              }}
                              trigger={['click']}
                              placement="bottomRight"
                            >
                              <button type="button" className="ec-actions" onClick={(e) => e.stopPropagation()}>
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                          )}
                        </div>
                        <div className="ec-foot">
                          <div className="ec-foot-row">
                            <span className="ec-foot-item">
                              <span className="ec-foot-key">Status:</span>
                              <span className={`es-status-pill ${item.isActive ? 'is-active' : 'is-inactive'}`}>
                                <span className="es-status-dot" />
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>

        {/* CRUD Drawer */}
        <Drawer
          className="es-drawer"
          placement="right"
          width={440}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          styles={{
            header: { display: 'none' },
            body: { padding: 0, background: 'var(--bg-pure-white)' },
            content: { background: 'var(--bg-pure-white)' },
            footer: { padding: 0, border: 'none' },
          }}
          footer={
            <div className="es-drawer__footer">
              <Button htmlType="button" onClick={() => { setDrawerOpen(false); form.resetFields(); }} className="es-btn-ghost">
                Cancel
              </Button>
              <Button
                type="primary"
                loading={saving}
                onClick={() => form.submit()}
                className="es-btn-primary"
              >
                {editingItem ? 'Save Changes' : `Create ${activeSection.singular}`}
              </Button>
            </div>
          }
        >
          <button
            className="es-drawer__close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close"
          >
            <CloseOutlined />
          </button>

          {drawerOpen && (
            <SettingsDrawerBody
              activeTab={activeTab}
              form={form}
              editingItem={editingItem}
              onSubmit={handleSave}
            />
          )}
        </Drawer>
      </div>

      <style jsx global>{`
        .es-shell { display: flex; margin: 0 -16px; min-height: calc(100vh - 64px); background: var(--bg-pure-white); }
        .es-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid var(--border-slate-200); background: var(--bg-pure-white); display: flex; flex-direction: column; position: sticky; top: 0; height: calc(100vh - 64px); }
        .es-sidebar-top { padding: 14px 14px 12px 18px; }
        .es-side-head { display: flex; align-items: center; gap: 10px; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 1px solid var(--border-slate-100); }
        .es-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .es-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .es-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .es-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .es-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.07em; }
        .es-create-btn { height: 32px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important; background: #3B82F6 !important; border: none !important; box-shadow: none !important; margin-bottom: 4px; }
        .es-create-btn:hover { background: #2563EB !important; }
        .es-create-btn .anticon { font-size: 12px !important; }
        .es-side-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 6px 16px; scrollbar-width: none; -ms-overflow-style: none; }
        .es-side-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .es-side-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px; }
        .es-side-scroll > .es-side-section-label:first-child { margin-top: 6px; }
        .es-side-list { display: flex; flex-direction: column; gap: 1px; }
        .es-view-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 10px; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: background .12s ease; text-align: left; }
        .es-view-item:hover { background: var(--bg-slate-50); }
        .es-view-item.is-active { background: var(--bg-blue-50); }
        .es-view-item.is-active .es-view-label { color: var(--text-slate-900); font-weight: 600; }
        .es-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .es-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .es-view-count { font-size: 11.5px; font-weight: 600; color: var(--text-slate-400); min-width: 18px; text-align: right; }
        .es-view-item.is-active .es-view-count { color: #3B82F6; font-weight: 700; background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0; }
        .es-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
        .es-body { flex: 1 0 auto; }
        .es-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .es-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .es-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .es-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .es-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .es-search::placeholder { color: var(--text-slate-400); }
        .es-kbd {
          font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
          border-radius: 5px; padding: 1px 6px;
        }
        .es-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .es-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .es-meta-dot { color: var(--text-slate-300); }
        .es-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .es-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .es-ghost-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; }
        .es-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }
        .es-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }
        .es-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        
        /* Segmented buttons */
        .es-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 8px; overflow: hidden; background: var(--bg-pure-white); }
        .es-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .es-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        /* Premium action dropdown */
        .es-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 220px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .es-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .es-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .es-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .es-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .es-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .es-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .es-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .es-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .es-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .es-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .es-action-pop .ant-dropdown-menu-item-danger .es-menu-title { color: #ef4444; }
        .es-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .es-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        /* Table */
        .es-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .es-table,
        .es-table.ant-table-wrapper,
        .es-table .ant-table,
        .es-table .ant-table-wrapper,
        .es-table .ant-table-container,
        .es-table .ant-table-content,
        .es-table .ant-table-header,
        .es-table .ant-table-body {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .es-table .ant-table-thead > tr > th, .es-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em !important;
          text-transform: uppercase !important; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
          border-radius: 0 !important;
          border-start-start-radius: 0 !important;
          border-start-end-radius: 0 !important;
        }
        .es-table .ant-table-thead > tr > th::before { display: none !important; }
        .es-table .ant-table-thead > tr > th:first-child {
          border-start-start-radius: 0 !important;
          border-top-left-radius: 0 !important;
        }
        .es-table .ant-table-thead > tr > th:last-child {
          border-start-end-radius: 0 !important;
          border-top-right-radius: 0 !important;
        }
        .es-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; background: var(--bg-pure-white) !important; }
        .es-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .es-table .ant-table-tbody > tr:last-child > td:first-child { border-bottom-left-radius: 0 !important; }
        .es-table .ant-table-tbody > tr:last-child > td:last-child { border-bottom-right-radius: 0 !important; }
        .es-table .ant-table-tbody > tr.es-row:hover > td { background: var(--bg-slate-50) !important; }
        .es-table .ant-table-selection-column { padding-inline: 6px !important; }

        /* Grid */
        .es-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; align-items: start; }
        .ec-card { max-width: 100%; }
        .es-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .es-mobile-menu-btn { display: none !important; }

        @media (max-width: 1100px) {
          .es-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 820px) {
          .es-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .es-main { height: auto; overflow: visible; }
          .es-body { overflow: visible; }

          .es-mobile-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
          }
          .es-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .es-sidebar.is-open { left: 0; }
          .es-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
          .es-topbar-actions { width: 100%; justify-content: flex-start; }
          .es-topbar-meta { display: none; }
          .es-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
        }

        @media (max-width: 700px) {
          .es-grid { grid-template-columns: 1fr; }
          .es-stats { grid-template-columns: 1fr !important; }
        }

        /* Card view rules */
        .ec-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
        }
        .ec-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .ec-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .ec-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .ec-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .ec-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .ec-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ec-category-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .ec-category-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .ec-category-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ec-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .ec-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .ec-foot-row + .ec-foot-row { border-top: 1px solid var(--border-slate-200); }
        .ec-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .ec-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .ec-foot-val { font-size: 11.5px; color: var(--text-slate-700); }
        .ec-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        /* Toggle switches */
        .es-toggle-card {
          border-radius: 8px !important;
          transform: none !important;
          transition: none !important;
        }
        .es-toggle-card:hover {
          transform: none !important;
          box-shadow: none !important;
        }
        [data-theme='dark'] .es-toggle-card {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-toggle-card:hover {
          border-color: #1F2937 !important;
        }

        /* Stats card styles */
        .es-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 10px 14px; min-height: 80px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 6px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          transition: none !important;
          transform: none !important;
        }
        .es-stat-card:hover {
          transform: none !important;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04) !important;
          border-color: var(--border-slate-200) !important;
        }
        .es-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .es-stat-left { display: flex; align-items: center; gap: 8px; }
        .es-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .es-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .es-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .es-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .es-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .es-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
        .es-stat-spark { opacity: 0.95; }

        [data-theme='dark'] .es-shell {
          background:
            radial-gradient(1200px 400px at 0% -100px, rgba(59, 130, 246, 0.08), transparent 60%),
            radial-gradient(900px 360px at 100% -120px, rgba(139, 92, 246, 0.08), transparent 55%),
            #0B0F1A;
        }
        [data-theme='dark'] .es-sidebar {
          background: #0B0F1A !important;
          border-right-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-side-head {
          border-bottom-color: #1F2937;
        }
        [data-theme='dark'] .es-side-title {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-view-item:hover {
          background: #161B22;
        }
        [data-theme='dark'] .es-view-item.is-active {
          background: rgba(59, 130, 246, 0.15);
        }
        [data-theme='dark'] .es-view-label {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-view-item.is-active .es-view-label {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-search-wrap {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-search {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-ghost-btn {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          color: #94A3B8;
        }
        [data-theme='dark'] .es-divider {
          background: #1F2937;
        }
        [data-theme='dark'] .es-stat-card {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
          transform: none !important;
        }
        [data-theme='dark'] .es-stat-card:hover {
          border-color: #1F2937 !important;
          box-shadow: none !important;
          transform: none !important;
        }
        [data-theme='dark'] .es-stat-label {
          color: #94A3B8;
        }
        [data-theme='dark'] .es-stat-value {
          color: #FFFFFF;
        }
        [data-theme='dark'] .es-table-wrap {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-table .ant-table-thead > tr > th {
          background: #161B22 !important;
          border-bottom-color: #374151 !important;
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .es-table .ant-table-tbody > tr > td {
          background: #0B0F1A !important;
          border-bottom-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-table .ant-table-tbody > tr.es-row:hover > td {
          background: #161B22 !important;
        }
        [data-theme='dark'] .es-row-title {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .es-row-sub {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .es-segmented {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .es-segmented button.is-active {
          background: #161B22 !important;
          color: #FFFFFF;
        }
        [data-theme='dark'] .ec-card {
          background: #0B0F1A !important;
          border-color: #1F2937 !important;
        }
        [data-theme='dark'] .ec-top {
          border-bottom-color: #1F2937 !important;
        }
        [data-theme='dark'] .ec-title {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .ec-category-val {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .ec-foot {
          background: #161B22 !important;
          border-top-color: #1F2937 !important;
        }
        [data-theme='dark'] .ec-foot-row {
          border-top-color: #1F2937 !important;
        }
        [data-theme='dark'] .ec-foot-val {
          color: #94A3B8 !important;
        }

        .es-status-pill {
          padding: 2px 8px !important;
          font-size: 10px !important;
          height: 20px !important;
          line-height: 1 !important;
          letter-spacing: 0.03em !important;
        }
        .es-status-dot {
          width: 5px !important;
          height: 5px !important;
        }
      `}</style>
    </MainLayout>
  );
}
