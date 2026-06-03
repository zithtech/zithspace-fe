"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Segmented,
  Switch,
  Input,
  Tag,
  Alert,
  message,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { featuresService, PricingFeature } from "@/services/pricing/featuresService";
import { limitsService, PricingLimit } from "@/services/pricing/limitsService";
import {
  tenantFeatureOverridesService,
  tenantLimitOverridesService,
  TenantFeatureOverride,
  TenantLimitOverride,
  OVERRIDE_UNLIMITED_SENTINEL,
} from "@/services/pricing/tenantOverridesService";

interface Props {
  tenantId: string;
}

function formatLimitValue(value: string): string {
  if (value === OVERRIDE_UNLIMITED_SENTINEL) return "Unlimited";
  if (/^\d+$/.test(value)) return Number(value).toLocaleString("en-US");
  return value;
}

export default function OverridesTab({ tenantId }: Props) {
  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [limits, setLimits] = useState<PricingLimit[]>([]);
  const [featOverrides, setFeatOverrides] = useState<TenantFeatureOverride[]>([]);
  const [limOverrides, setLimOverrides] = useState<TenantLimitOverride[]>([]);
  const [loading, setLoading] = useState(false);

  const [featModalOpen, setFeatModalOpen] = useState(false);
  const [featEditing, setFeatEditing] = useState<TenantFeatureOverride | null>(null);
  const [featForm] = Form.useForm<{ featureId: string; isEnabled: boolean; reason?: string }>();
  const [featSaving, setFeatSaving] = useState(false);

  const [limModalOpen, setLimModalOpen] = useState(false);
  const [limEditing, setLimEditing] = useState<TenantLimitOverride | null>(null);
  const [limForm] = Form.useForm<{
    limitId: string;
    limitValue: string;
    isUnlimited: boolean;
    reason?: string;
  }>();
  const [limSaving, setLimSaving] = useState(false);
  const limIsUnlimitedWatch = Form.useWatch("isUnlimited", limForm);

  async function loadLookups() {
    try {
      const [f, l] = await Promise.all([
        featuresService.list({ limit: 1000, status: "active" }),
        limitsService.list({ limit: 500, status: "active" }),
      ]);
      setFeatures(f.data);
      setLimits(l.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load lookups");
    }
  }
  async function loadOverrides() {
    setLoading(true);
    try {
      const [fo, lo] = await Promise.all([
        tenantFeatureOverridesService.list({ tenantId }),
        tenantLimitOverridesService.list({ tenantId }),
      ]);
      setFeatOverrides(fo);
      setLimOverrides(lo);
    } catch (e: any) {
      message.error(e?.message || "Failed to load overrides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);
  useEffect(() => {
    loadOverrides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // FEATURE overrides
  function openFeatCreate() {
    setFeatEditing(null);
    featForm.resetFields();
    featForm.setFieldsValue({ isEnabled: true });
    setFeatModalOpen(true);
  }
  function openFeatEdit(row: TenantFeatureOverride) {
    setFeatEditing(row);
    featForm.setFieldsValue({
      featureId: row.featureId,
      isEnabled: row.isEnabled,
      reason: row.reason ?? "",
    });
    setFeatModalOpen(true);
  }
  async function submitFeat() {
    try {
      const v = await featForm.validateFields();
      setFeatSaving(true);
      await tenantFeatureOverridesService.upsert({
        tenantId,
        featureId: v.featureId,
        isEnabled: v.isEnabled,
        reason: v.reason ?? null,
      });
      message.success("Feature override saved");
      setFeatModalOpen(false);
      loadOverrides();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setFeatSaving(false);
    }
  }
  function removeFeat(row: TenantFeatureOverride) {
    Modal.confirm({
      title: "Remove feature override?",
      content: `The tenant will revert to the snapshotted entitlement for ${row.featureCode}.`,
      okText: "Remove override",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantFeatureOverridesService.removeByPair({
            tenantId,
            featureId: row.featureId,
          });
          message.success("Override removed");
          loadOverrides();
        } catch (e: any) {
          message.error(e?.message || "Remove failed");
        }
      },
    });
  }

  // LIMIT overrides
  function openLimCreate() {
    setLimEditing(null);
    limForm.resetFields();
    limForm.setFieldsValue({ limitValue: "", isUnlimited: false });
    setLimModalOpen(true);
  }
  function openLimEdit(row: TenantLimitOverride) {
    setLimEditing(row);
    const isUnlimited = row.limitValue === OVERRIDE_UNLIMITED_SENTINEL;
    limForm.setFieldsValue({
      limitId: row.limitId,
      limitValue: isUnlimited ? "" : row.limitValue,
      isUnlimited,
      reason: row.reason ?? "",
    });
    setLimModalOpen(true);
  }
  async function submitLim() {
    try {
      const v = await limForm.validateFields();
      const value = v.isUnlimited ? OVERRIDE_UNLIMITED_SENTINEL : String(v.limitValue).trim();
      if (!v.isUnlimited && !/^\d+$/.test(value)) {
        message.error("Value must be a non-negative integer or Unlimited");
        return;
      }
      setLimSaving(true);
      await tenantLimitOverridesService.upsert({
        tenantId,
        limitId: v.limitId,
        limitValue: value,
        reason: v.reason ?? null,
      });
      message.success("Limit override saved");
      setLimModalOpen(false);
      loadOverrides();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setLimSaving(false);
    }
  }
  function removeLim(row: TenantLimitOverride) {
    Modal.confirm({
      title: "Remove limit override?",
      content: `The tenant will revert to snapshot + add-ons for ${row.limitCode}.`,
      okText: "Remove override",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantLimitOverridesService.removeByPair({
            tenantId,
            limitId: row.limitId,
          });
          message.success("Override removed");
          loadOverrides();
        } catch (e: any) {
          message.error(e?.message || "Remove failed");
        }
      },
    });
  }

  // Catalog options for the modals (exclude features/limits that already have an override on create)
  const overriddenFeatureIds = useMemo(
    () => new Set(featOverrides.map((o) => o.featureId)),
    [featOverrides]
  );
  const overriddenLimitIds = useMemo(
    () => new Set(limOverrides.map((o) => o.limitId)),
    [limOverrides]
  );
  const featureOptionsForCreate = useMemo(
    () =>
      features
        .filter((f) => featEditing || !overriddenFeatureIds.has(f.id))
        .map((f) => ({
          value: f.id,
          label: (
            <span>
              {f.name}
              <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{f.code}</span>
            </span>
          ),
        })),
    [features, overriddenFeatureIds, featEditing]
  );
  const limitOptionsForCreate = useMemo(
    () =>
      limits
        .filter((l) => limEditing || !overriddenLimitIds.has(l.id))
        .map((l) => ({
          value: l.id,
          label: (
            <span>
              {l.name}
              <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{l.code}</span>
              <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">({l.unit})</span>
            </span>
          ),
        })),
    [limits, overriddenLimitIds, limEditing]
  );

  const featColumns: ColumnsType<TenantFeatureOverride> = useMemo(
    () => [
      {
        title: "Feature",
        width: 280,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">{row.featureName || row.featureCode}</div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.featureCode}</div>
          </div>
        ),
      },
      {
        title: "Override",
        dataIndex: "isEnabled",
        width: 140,
        render: (v: boolean) =>
          v ? (
            <Tag color="green" bordered={false}>force ON</Tag>
          ) : (
            <Tag color="red" bordered={false}>force OFF</Tag>
          ),
      },
      {
        title: "Reason",
        dataIndex: "reason",
        render: (v: string | null) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{v}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic text-[12px]">— no reason —</span>
          ),
      },
      {
        title: "",
        key: "actions",
        width: 100,
        align: "right" as const,
        render: (_: any, row) => (
          <div className="flex items-center gap-1 justify-end">
            <Button size="small" type="text" onClick={() => openFeatEdit(row)}>
              Edit
            </Button>
            <Button
              size="small"
              type="text"
              danger
              icon={<Trash2 size={13} />}
              onClick={() => removeFeat(row)}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const limColumns: ColumnsType<TenantLimitOverride> = useMemo(
    () => [
      {
        title: "Limit",
        width: 280,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">{row.limitName || row.limitCode}</div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.limitCode}</div>
          </div>
        ),
      },
      {
        title: "Override value",
        width: 200,
        render: (_: any, row) =>
          row.limitValue === OVERRIDE_UNLIMITED_SENTINEL ? (
            <Tag color="purple" bordered={false}>unlimited</Tag>
          ) : (
            <span className="font-mono text-[13px] text-slate-900 dark:text-slate-100">
              {formatLimitValue(row.limitValue)}
              {row.limitUnit ? (
                <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">{row.limitUnit}</span>
              ) : null}
            </span>
          ),
      },
      {
        title: "Reason",
        dataIndex: "reason",
        render: (v: string | null) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{v}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic text-[12px]">— no reason —</span>
          ),
      },
      {
        title: "",
        key: "actions",
        width: 100,
        align: "right" as const,
        render: (_: any, row) => (
          <div className="flex items-center gap-1 justify-end">
            <Button size="small" type="text" onClick={() => openLimEdit(row)}>
              Edit
            </Button>
            <Button
              size="small"
              type="text"
              danger
              icon={<Trash2 size={13} />}
              onClick={() => removeLim(row)}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="py-4 space-y-6">
      <Alert
        type="warning"
        showIcon
        icon={<AlertTriangle size={14} />}
        message="Overrides win over snapshots and add-ons"
        description="Feature overrides force a feature ON or OFF for this tenant. Limit overrides set an absolute value (snapshot + add-on quantities are ignored). Use sparingly — always include a reason for audit."
      />

      {/* Feature overrides */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Feature overrides
            <span className="ml-1.5 text-slate-500 dark:text-slate-400 normal-case font-normal">
              ({featOverrides.length})
            </span>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={openFeatCreate}
            disabled={features.length === 0}
            className="!flex !items-center !gap-1"
          >
            Add feature override
          </Button>
        </div>
        <Table<TenantFeatureOverride>
          rowKey="id"
          loading={loading}
          dataSource={featOverrides}
          columns={featColumns}
          size="middle"
          pagination={false}
          locale={{ emptyText: "No feature overrides for this tenant." }}
        />
      </div>

      {/* Limit overrides */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Limit overrides
            <span className="ml-1.5 text-slate-500 dark:text-slate-400 normal-case font-normal">
              ({limOverrides.length})
            </span>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={openLimCreate}
            disabled={limits.length === 0}
            className="!flex !items-center !gap-1"
          >
            Add limit override
          </Button>
        </div>
        <Table<TenantLimitOverride>
          rowKey="id"
          loading={loading}
          dataSource={limOverrides}
          columns={limColumns}
          size="middle"
          pagination={false}
          locale={{ emptyText: "No limit overrides for this tenant." }}
        />
      </div>

      {/* Feature override modal */}
      <Modal
        open={featModalOpen}
        onCancel={() => setFeatModalOpen(false)}
        onOk={submitFeat}
        okText={featEditing ? "Save" : "Add override"}
        confirmLoading={featSaving}
        title={featEditing ? "Edit feature override" : "Add feature override"}
        destroyOnClose
      >
        <Form form={featForm} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Feature"
            name="featureId"
            rules={[{ required: true, message: "Feature is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={featureOptionsForCreate}
              disabled={!!featEditing}
              placeholder="Select a feature"
            />
          </Form.Item>
          <Form.Item label="Force" name="isEnabled" initialValue={true}>
            <Segmented
              options={[
                { label: "Force ON", value: true },
                { label: "Force OFF", value: false },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Reason"
            name="reason"
            tooltip="Why this override exists. Shown in audit and helps future-you remember."
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Beta tester, comped Pro for 3 months until 2026-09."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Limit override modal */}
      <Modal
        open={limModalOpen}
        onCancel={() => setLimModalOpen(false)}
        onOk={submitLim}
        okText={limEditing ? "Save" : "Add override"}
        confirmLoading={limSaving}
        title={limEditing ? "Edit limit override" : "Add limit override"}
        destroyOnClose
      >
        <Form form={limForm} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Limit"
            name="limitId"
            rules={[{ required: true, message: "Limit is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={limitOptionsForCreate}
              disabled={!!limEditing}
              placeholder="Select a limit"
            />
          </Form.Item>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <Form.Item
              label="Value"
              name="limitValue"
              tooltip="Absolute value. Snapshot + add-ons are ignored when an override exists."
              rules={[
                {
                  validator: (_, v) => {
                    const unlimited = limForm.getFieldValue("isUnlimited");
                    if (unlimited) return Promise.resolve();
                    if (v === undefined || v === null || v === "") {
                      return Promise.reject("Value is required");
                    }
                    return /^\d+$/.test(String(v).trim())
                      ? Promise.resolve()
                      : Promise.reject("Must be a non-negative integer");
                  },
                },
              ]}
            >
              <Input
                placeholder="100000"
                disabled={limIsUnlimitedWatch}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  limForm.setFieldValue("limitValue", v);
                }}
              />
            </Form.Item>
            <Form.Item label="Unlimited" name="isUnlimited" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item
            label="Reason"
            name="reason"
            tooltip="Why this override exists. Shown in audit."
          >
            <Input.TextArea
              rows={3}
              placeholder="e.g. Migrated from legacy plan with grandfathered 100k AI tokens."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
