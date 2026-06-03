"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Segmented,
  Tag,
  Dropdown,
  AutoComplete,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import {
  planVariantPricesService,
  PlanVariantPrice,
  PriceInput,
} from "@/services/pricing/planVariantPricesService";
import {
  planVariantsService,
  PlanVariant,
  BillingCycle,
} from "@/services/pricing/planVariantsService";

interface Props {
  planId: string;
}

const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "INR",
  "GBP",
  "CAD",
  "AUD",
  "SGD",
  "AED",
  "JPY",
  "CHF",
];

const CYCLE_COLORS: Record<string, string> = {
  MONTHLY: "blue",
  QUARTERLY: "geekblue",
  YEARLY: "purple",
  ONE_TIME: "gold",
};

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

export default function PlanPricesTab({ planId }: Props) {
  const [rows, setRows] = useState<PlanVariantPrice[]>([]);
  const [variants, setVariants] = useState<PlanVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanVariantPrice | null>(null);
  const [form] = Form.useForm<PriceInput>();
  const [saving, setSaving] = useState(false);

  async function loadVariants() {
    try {
      const res = await planVariantsService.list({ planId, limit: 200 });
      setVariants(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load variants");
    }
  }
  async function loadPrices() {
    setLoading(true);
    try {
      const res = await planVariantPricesService.list({ planId, limit: 200 });
      setRows(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load prices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      currencyCode: "USD",
      basePrice: 0,
      setupFee: 0,
      planVariantId: variants[0]?.id,
    });
    setModalOpen(true);
  }
  function openEdit(row: PlanVariantPrice) {
    setEditing(row);
    form.setFieldsValue({
      planVariantId: row.planVariantId,
      currencyCode: row.currencyCode,
      basePrice: row.basePrice,
      setupFee: row.setupFee,
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        const { planVariantId, ...patch } = values;
        await planVariantPricesService.update(editing.id, patch);
        message.success("Price updated");
      } else {
        await planVariantPricesService.create(values);
        message.success("Price created");
      }
      setModalOpen(false);
      loadPrices();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(row: PlanVariantPrice) {
    try {
      await planVariantPricesService.archive(row.id);
      message.success("Archived");
      loadPrices();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PlanVariantPrice) {
    try {
      await planVariantPricesService.restore(row.id);
      message.success("Restored");
      loadPrices();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PlanVariantPrice) {
    Modal.confirm({
      title: "Delete price?",
      content: `${row.variantCode} · ${row.currencyCode} will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await planVariantPricesService.remove(row.id);
          message.success("Deleted");
          loadPrices();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const variantOptions = useMemo(
    () =>
      variants.map((v) => ({
        value: v.id,
        label: (
          <span>
            {v.name}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{v.code}</span>
          </span>
        ),
      })),
    [variants]
  );

  const columns: ColumnsType<PlanVariantPrice> = useMemo(
    () => [
      {
        title: "Variant",
        width: 280,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">{row.variantName}</div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.variantCode}</div>
          </div>
        ),
      },
      {
        title: "Cycle",
        dataIndex: "billingCycle",
        width: 130,
        render: (v: string | null) =>
          v ? (
            <Tag color={CYCLE_COLORS[v] || "default"} bordered={false} className="!font-mono !text-[11px]">
              {v}
            </Tag>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
      {
        title: "Currency",
        dataIndex: "currencyCode",
        width: 110,
        render: (v: string) => (
          <Tag color="default" bordered className="!font-mono !text-[11.5px]">
            {v}
          </Tag>
        ),
      },
      {
        title: "Base price",
        dataIndex: "basePrice",
        width: 160,
        align: "right" as const,
        render: (v: number, row) => (
          <span className="font-mono text-[12.5px] text-slate-900 dark:text-slate-100">
            {formatAmount(v, row.currencyCode)}
          </span>
        ),
      },
      {
        title: "Setup fee",
        dataIndex: "setupFee",
        width: 140,
        align: "right" as const,
        render: (v: number, row) =>
          v > 0 ? (
            <span className="font-mono text-[12.5px] text-slate-700 dark:text-slate-300">
              {formatAmount(v, row.currencyCode)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
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
    <div className="py-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-[13px] text-slate-500 dark:text-slate-400">
          One price row per variant per currency. Add a row for each currency you sell in.
        </div>
        <Button
          type="primary"
          size="small"
          icon={<Plus size={14} />}
          onClick={openCreate}
          disabled={variants.length === 0}
          className="!flex !items-center !gap-1"
        >
          New price
        </Button>
      </div>

      <Table<PlanVariantPrice>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              description={
                variants.length === 0
                  ? "Create a variant first, then add prices."
                  : "No prices yet."
              }
            />
          ),
        }}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create price"}
        confirmLoading={saving}
        title={editing ? "Edit price" : "New price"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Variant"
            name="planVariantId"
            rules={[{ required: true, message: "Variant is required" }]}
          >
            <Select
              options={variantOptions}
              disabled={!!editing}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Currency"
              name="currencyCode"
              tooltip="ISO 4217 code (3 letters)."
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
            <Form.Item label="Status" name="status" initialValue="active">
              <Segmented
                options={[
                  { label: "Active", value: "active" },
                  { label: "Archived", value: "archived" },
                ]}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Base price"
              name="basePrice"
              rules={[
                { required: true, message: "Base price is required" },
                {
                  validator: (_, v) =>
                    v === undefined || v === null || v >= 0
                      ? Promise.resolve()
                      : Promise.reject("Must be ≥ 0"),
                },
              ]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                placeholder="0.00"
                className="!w-full"
              />
            </Form.Item>
            <Form.Item
              label="Setup fee"
              name="setupFee"
              tooltip="One-time fee added on first invoice. Leave 0 for none."
              initialValue={0}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                placeholder="0.00"
                className="!w-full"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
