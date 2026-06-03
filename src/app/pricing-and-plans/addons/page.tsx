"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  InputNumber,
  Segmented,
  Tag,
  Select,
  Dropdown,
  AutoComplete,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import {
  addonsService,
  PricingAddon,
  AddonInput,
  AddonType,
  BillingCycle,
  ADDON_BILLING_CYCLES,
  ADDON_TYPES,
} from "@/services/pricing/addonsService";
import { slugifyCode } from "@/lib/codeSlugify";
import { featuresService, PricingFeature } from "@/services/pricing/featuresService";
import { limitsService, PricingLimit } from "@/services/pricing/limitsService";

type StatusFilter = "active" | "archived" | "all";

const TYPE_COLORS: Record<AddonType, string> = {
  FEATURE: "green",
  LIMIT_EXTENSION: "gold",
};

const CYCLE_COLORS: Record<BillingCycle, string> = {
  MONTHLY: "blue",
  QUARTERLY: "geekblue",
  YEARLY: "purple",
  ONE_TIME: "gold",
};

const COMMON_CURRENCIES = ["USD", "EUR", "INR", "GBP", "CAD", "AUD", "SGD", "AED", "JPY", "CHF"];

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function AddonsPage() {
  const [rows, setRows] = useState<PricingAddon[]>([]);
  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [limits, setLimits] = useState<PricingLimit[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<AddonType | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingAddon | null>(null);
  const [form] = Form.useForm<AddonInput>();
  const [saving, setSaving] = useState(false);

  // Auto-fill code from name (create mode only, until the user edits code manually)
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const codeAutofillNameWatch = Form.useWatch("name", form);
  useEffect(() => {
    if (editing) return;
    if (codeManuallyEdited) return;
    const auto = slugifyCode(codeAutofillNameWatch || "");
    if ((form.getFieldValue("code") || "") !== auto) {
      form.setFieldValue("code", auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeAutofillNameWatch, editing, codeManuallyEdited]);

  const addonTypeWatch = Form.useWatch<AddonType | undefined>("addonType", form);

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

  async function load() {
    setLoading(true);
    try {
      const res = await addonsService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        addonType: typeFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load addons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setCodeManuallyEdited(false);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      addonType: "FEATURE",
      billingCycle: "MONTHLY",
      currencyCode: "USD",
      price: 0,
    });
    setModalOpen(true);
  }
  function openEdit(row: PricingAddon) {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      name: row.name,
      addonType: row.addonType,
      featureId: row.featureId ?? undefined,
      limitId: row.limitId ?? undefined,
      billingCycle: row.billingCycle,
      price: row.price,
      currencyCode: row.currencyCode,
      description: row.description ?? "",
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      // Strip the field that doesn't apply
      const payload: AddonInput = {
        code: values.code,
        name: values.name,
        addonType: values.addonType,
        featureId: values.addonType === "FEATURE" ? values.featureId : null,
        limitId: values.addonType === "LIMIT_EXTENSION" ? values.limitId : null,
        billingCycle: values.billingCycle,
        price: values.price,
        currencyCode: values.currencyCode,
        description: values.description ?? null,
        status: values.status,
      };
      setSaving(true);
      if (editing) {
        await addonsService.update(editing.id, payload);
        message.success("Addon updated");
      } else {
        await addonsService.create(payload);
        message.success("Addon created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(row: PricingAddon) {
    try {
      await addonsService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PricingAddon) {
    try {
      await addonsService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PricingAddon) {
    Modal.confirm({
      title: "Delete addon?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await addonsService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const featureOptions = useMemo(
    () =>
      features.map((f) => ({
        value: f.id,
        label: (
          <span>
            {f.name}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{f.code}</span>
          </span>
        ),
      })),
    [features]
  );
  const limitOptions = useMemo(
    () =>
      limits.map((l) => ({
        value: l.id,
        label: (
          <span>
            {l.name}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{l.code}</span>
            <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">({l.unit})</span>
          </span>
        ),
      })),
    [limits]
  );

  const columns: ColumnsType<PricingAddon> = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        width: 200,
        render: (v: string) => (
          <span className="font-mono text-[12.5px] text-slate-800 dark:text-slate-200">{v}</span>
        ),
      },
      { title: "Name", dataIndex: "name" },
      {
        title: "Type",
        dataIndex: "addonType",
        width: 150,
        render: (v: AddonType) => (
          <Tag color={TYPE_COLORS[v]} bordered={false} className="!font-mono !text-[11px]">
            {v}
          </Tag>
        ),
      },
      {
        title: "Grants",
        width: 240,
        render: (_: any, row) => {
          if (row.addonType === "FEATURE" && row.featureName) {
            return (
              <span className="text-[12.5px] text-slate-700 dark:text-slate-300">
                {row.featureName}
                <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.featureCode}</span>
              </span>
            );
          }
          if (row.addonType === "LIMIT_EXTENSION" && row.limitName) {
            return (
              <span className="text-[12.5px] text-slate-700 dark:text-slate-300">
                {row.limitName}
                <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.limitCode}</span>
                <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">({row.limitUnit}/unit)</span>
              </span>
            );
          }
          return <span className="text-slate-400 dark:text-slate-500">—</span>;
        },
      },
      {
        title: "Cycle",
        dataIndex: "billingCycle",
        width: 130,
        render: (v: BillingCycle) => (
          <Tag color={CYCLE_COLORS[v]} bordered={false} className="!font-mono !text-[11px]">
            {v}
          </Tag>
        ),
      },
      {
        title: "Price",
        width: 160,
        align: "right" as const,
        render: (_: any, row) => (
          <span className="font-mono text-[12.5px] text-slate-900 dark:text-slate-100">
            {formatAmount(row.price, row.currencyCode)}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 110,
        render: (v: string) =>
          v === "active" ? (
            <Tag color="green" bordered={false}>active</Tag>
          ) : (
            <Tag color="default" bordered={false}>archived</Tag>
          ),
      },
      {
        title: "",
        key: "actions",
        width: 60,
        render: (_, row) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "edit",
                  label: (<span className="flex items-center gap-2"><Pencil size={14} /> Edit</span>),
                  onClick: () => openEdit(row),
                },
                row.status === "active"
                  ? {
                      key: "archive",
                      label: (<span className="flex items-center gap-2"><Archive size={14} /> Archive</span>),
                      onClick: () => onArchive(row),
                    }
                  : {
                      key: "restore",
                      label: (<span className="flex items-center gap-2"><RotateCcw size={14} /> Restore</span>),
                      onClick: () => onRestore(row),
                    },
                { type: "divider" as const },
                {
                  key: "delete",
                  danger: true,
                  label: (<span className="flex items-center gap-2"><Trash2 size={14} /> Delete</span>),
                  onClick: () => onDelete(row),
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="px-8 py-7">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Add-ons</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Standalone purchasable extras. Each addon either grants a feature (e.g. WHATSAPP) or
            extends a limit (e.g. EXTRA_USERS at $X/seat).
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
          disabled={features.length === 0 && limits.length === 0}
          className="!flex !items-center !gap-1"
        >
          New add-on
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
            placeholder="Search by code or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!max-w-xs"
          />
          <Select
            allowClear
            value={typeFilter}
            onChange={(v) => {
              setPage(1);
              setTypeFilter(v);
            }}
            placeholder="All types"
            options={ADDON_TYPES.map((t) => ({ value: t, label: t }))}
            className="!min-w-[180px]"
          />
        </div>
        <Segmented
          value={statusFilter}
          onChange={(v) => {
            setPage(1);
            setStatusFilter(v as StatusFilter);
          }}
          options={[
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
            { label: "All", value: "all" },
          ]}
        />
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#131B2D] overflow-hidden">
        <Table<PricingAddon>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description={statusFilter === "archived" ? "No archived add-ons" : "No add-ons yet"}
              />
            ),
          }}
        />
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create add-on"}
        confirmLoading={saving}
        title={editing ? "Edit add-on" : "New add-on"}
        destroyOnClose
        width={620}
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Type"
            name="addonType"
            tooltip="FEATURE grants a feature flag. LIMIT_EXTENSION sells extra units of a metered limit."
            rules={[{ required: true }]}
          >
            <Segmented
              options={[
                { label: "Feature", value: "FEATURE" },
                { label: "Limit extension", value: "LIMIT_EXTENSION" },
              ]}
              onChange={() => {
                // Clear the other grant field when type flips
                form.setFieldValue("featureId", undefined);
                form.setFieldValue("limitId", undefined);
              }}
            />
          </Form.Item>

          {addonTypeWatch === "FEATURE" ? (
            <Form.Item
              label="Feature granted"
              name="featureId"
              rules={[{ required: true, message: "Feature is required" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={featureOptions}
                placeholder="Select a feature"
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="Limit extended"
              name="limitId"
              tooltip="Quantity is set per tenant purchase (e.g. tenant buys 10 extra users)."
              rules={[{ required: true, message: "Limit is required" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={limitOptions}
                placeholder="Select a limit"
              />
            </Form.Item>
          )}

          <Form.Item
            label="Code"
            name="code"
            tooltip="UPPER_SNAKE_CASE. Globally unique."
            rules={[
              { required: true, message: "Code is required" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Must be UPPER_SNAKE_CASE" },
            ]}
          >
            <Input placeholder={addonTypeWatch === "FEATURE" ? "WHATSAPP" : "EXTRA_USERS"} disabled={!!editing} onChange={() => setCodeManuallyEdited(true)} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder={addonTypeWatch === "FEATURE" ? "WhatsApp integration" : "Extra users"} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div className="grid grid-cols-3 gap-3">
            <Form.Item
              label="Cycle"
              name="billingCycle"
              rules={[{ required: true, message: "Cycle is required" }]}
            >
              <Select options={ADDON_BILLING_CYCLES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              tooltip={
                addonTypeWatch === "LIMIT_EXTENSION"
                  ? "Price per unit (multiplied by quantity at purchase)."
                  : "Price per cycle."
              }
              rules={[
                { required: true, message: "Price is required" },
                {
                  validator: (_, v) =>
                    v === undefined || v === null || v >= 0
                      ? Promise.resolve()
                      : Promise.reject("Must be ≥ 0"),
                },
              ]}
            >
              <InputNumber min={0} step={0.01} precision={2} placeholder="0.00" className="!w-full" />
            </Form.Item>
            <Form.Item
              label="Currency"
              name="currencyCode"
              rules={[
                { required: true, message: "Currency is required" },
                { pattern: /^[A-Z]{3}$/, message: "Must be 3 uppercase letters" },
              ]}
            >
              <AutoComplete
                options={COMMON_CURRENCIES.map((c) => ({ value: c }))}
                placeholder="USD"
                filterOption={(input, option) =>
                  (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <Form.Item label="Status" name="status" initialValue="active">
            <Segmented
              options={[
                { label: "Active", value: "active" },
                { label: "Archived", value: "archived" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
