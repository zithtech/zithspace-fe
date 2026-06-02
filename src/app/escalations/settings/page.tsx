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
  notification,
  Popconfirm,
  Tooltip,
  ColorPicker,
  Switch,
  Segmented,
  Drawer,
  Skeleton,
  Empty,
  Slider,
} from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BlockOutlined,
  UpSquareOutlined,
  CheckSquareOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
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
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import { EscalationSettingsService } from '@/services/escalationSettings';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, subtle, loading, chart }) => (
  <div className="es-stat-card" style={{ ['--es-accent' as any]: accent }}>
    <div className="es-stat-head">
      <div
        className="es-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="es-stat-label">{label}</Text>
      <div className="es-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="es-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="es-stat-subtle">{subtle}</Text>}
    {chart && <div className="es-stat-chart">{chart}</div>}
    <span
      className="es-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="es-minibar">
      <div className="es-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="es-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="es-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="es-minibar-legend-item">
            <span className="es-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       Color preset swatches                                */
/* -------------------------------------------------------------------------- */

const COLOR_PRESETS: { hex: string; name: string }[] = [
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#f59e0b', name: 'Amber' },
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#0ea5e9', name: 'Sky' },
  { hex: '#94a3b8', name: 'Slate' },
];

const normalizeHex = (v: any): string => {
  if (!v) return '#3b82f6';
  if (typeof v === 'string') return v;
  return v?.toHexString?.() || '#3b82f6';
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
  const watchedColor = normalizeHex(watchedColorRaw);
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
              rules={[{ required: true, message: 'Enter a name' }]}
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
                <ColorPicker
                  showText
                  className="es-colorpicker"
                  size="middle"
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
                <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 0 }} noStyle>
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

                <Form.Item name="isFinal" valuePropName="checked" style={{ marginBottom: 0 }} noStyle>
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

  const [notify, contextHolder] = notification.useNotification();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    notify[type]({
      message: <span className="premium-notif-title">{title}</span>,
      description: <span className="premium-notif-desc">{description}</span>,
      icon:
        type === 'success' ? (
          <CheckCircleFilled style={{ color: '#10B981' }} />
        ) : (
          <CloseCircleFilled style={{ color: '#EF4444' }} />
        ),
      className: 'premium-notification',
      placement: 'topRight',
      duration: 4,
    });
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
            style={{ ['--swatch' as any]: record.color || BLUE_PRIMARY }}
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
      title: '',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationCategory) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <Popconfirm
              title="Retire this category?"
              description="Inactive items won't appear in new escalations."
              onConfirm={() => handleDelete(record.id)}
              okText="Retire"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Retire">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
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
            style={{ ['--swatch' as any]: record.color || BLUE_PRIMARY }}
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
      title: '',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationPriority) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <Popconfirm
              title="Retire this priority?"
              onConfirm={() => handleDelete(record.id)}
              okText="Retire"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Retire">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
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
            style={{ ['--swatch' as any]: record.color || BLUE_PRIMARY }}
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
      title: '',
      key: 'actions',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: EscalationStatus) =>
        canManageEscalations && (
          <div className="es-row-actions">
            <Tooltip title="Edit">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(record)} />
            </Tooltip>
            <Popconfirm
              title="Retire this status?"
              onConfirm={() => handleDelete(record.id)}
              okText="Retire"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Retire">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
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

  /* ------------------------------ Render ----------------------------------- */

  return (
    <MainLayout>
      {contextHolder}
      <div className="es-shell">
        <TimeTrackingHeader
          icon={<SettingOutlined style={{ fontSize: 20, color: BLUE_PRIMARY }} />}
          title="Escalation Settings"
          description="Manage the master data: categories, priorities, and lifecycle statuses."
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid var(--border-slate-200)',
            padding: '9.5px 32px',
            marginBottom: 20,
          }}
          extra={
            canManageEscalations && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenDrawer()}
                className="es-primary-btn"
              >
                Add {activeSection.singular}
              </Button>
            )
          }
        />

        <div className="es-content">
          {/* Stats overview */}
          <div className="es-stat-grid">
            <StatCard
              label="Categories"
              value={stats.categoriesTotal}
              icon={<TagsOutlined />}
              accent="#3b82f6"
              subtle="Issue type buckets"
              loading={loading && stats.categoriesTotal === 0}
              chart={
                stats.categoriesTotal > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: stats.categoriesActive,
                        color: '#10b981',
                        label: `${stats.categoriesActive} active`,
                      },
                      {
                        value: stats.categoriesInactive,
                        color: '#94a3b8',
                        label: `${stats.categoriesInactive} retired`,
                      },
                    ]}
                  />
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
                  <div className="es-cv-row">
                    <span className="es-cv-dot is-active" />
                    <span>
                      <strong>{stats.prioritiesActive}</strong> active levels
                    </span>
                  </div>
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
                  <MiniBar
                    segments={[
                      {
                        value: stats.statusesDefault,
                        color: '#3b82f6',
                        label: `${stats.statusesDefault} default`,
                      },
                      {
                        value: stats.statusesFinal,
                        color: '#f59e0b',
                        label: `${stats.statusesFinal} final`,
                      },
                      {
                        value: Math.max(
                          stats.statusesTotal - stats.statusesDefault - stats.statusesFinal,
                          0,
                        ),
                        color: '#94a3b8',
                        label: `${Math.max(
                          stats.statusesTotal - stats.statusesDefault - stats.statusesFinal,
                          0,
                        )} other`,
                      },
                    ]}
                  />
                ) : null
              }
            />
          </div>

          {/* Switcher + content card */}
          <div className="es-panel">
            <div className="es-panel__header">
              <Segmented
                className="es-segmented"
                value={activeTab}
                onChange={(val) => setActiveTab(val as TabKey)}
                options={[
                  {
                    label: (
                      <span className="es-seg-opt">
                        <BlockOutlined />
                        Categories
                        <span className="es-seg-pill">{categories.length}</span>
                      </span>
                    ),
                    value: 'categories',
                  },
                  {
                    label: (
                      <span className="es-seg-opt">
                        <UpSquareOutlined />
                        Priorities
                        <span className="es-seg-pill">{priorities.length}</span>
                      </span>
                    ),
                    value: 'priorities',
                  },
                  {
                    label: (
                      <span className="es-seg-opt">
                        <CheckSquareOutlined />
                        Statuses
                        <span className="es-seg-pill">{statuses.length}</span>
                      </span>
                    ),
                    value: 'statuses',
                  },
                ]}
              />

              <Text className="es-panel__meta">
                <strong>{activeSection.data.length}</strong>{' '}
                {activeSection.singular.toLowerCase()}
                {activeSection.data.length === 1 ? '' : 's'}
              </Text>
            </div>

            <div className="es-panel__body">
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
              ) : (
                <Table
                  className="premium-table es-table"
                  dataSource={activeSection.data as any}
                  columns={activeSection.columns as any}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* CRUD Drawer */}
        <Drawer
          className="es-drawer"
          placement="right"
          width={620}
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
              <Button onClick={() => setDrawerOpen(false)} className="es-btn-ghost">
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
    </MainLayout>
  );
}
