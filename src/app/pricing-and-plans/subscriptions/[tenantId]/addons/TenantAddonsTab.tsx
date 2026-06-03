"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Tag,
  Segmented,
  Dropdown,
  Empty,
  Alert,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, MoreHorizontal, Pencil, X, Trash2 } from "lucide-react";
import { addonsService, PricingAddon } from "@/services/pricing/addonsService";
import {
  tenantAddonsService,
  TenantAddon,
  TenantAddonStatus,
} from "@/services/pricing/tenantAddonsService";

interface Props {
  tenantId: string;
}

type ScopeFilter = "active" | "all";

const STATUS_COLORS: Record<TenantAddonStatus, string> = {
  pending: "default",
  active: "green",
  canceled: "default",
  expired: "default",
};

const TYPE_COLORS: Record<string, string> = {
  FEATURE: "green",
  LIMIT_EXTENSION: "gold",
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

export default function TenantAddonsTab({ tenantId }: Props) {
  const [rows, setRows] = useState<TenantAddon[]>([]);
  const [addons, setAddons] = useState<PricingAddon[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ScopeFilter>("active");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<{ addonId: string; quantity: number }>();
  const [creating, setCreating] = useState(false);
  const createAddonIdWatch = Form.useWatch("addonId", createForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TenantAddon | null>(null);
  const [editForm] = Form.useForm<{ quantity: number }>();
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadAddons() {
    try {
      const res = await addonsService.list({ limit: 500, status: "active" });
      setAddons(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load addon catalog");
    }
  }
  async function load() {
    setLoading(true);
    try {
      const res = await tenantAddonsService.list({
        tenantId,
        status: scope === "active" ? "active" : undefined,
        limit: 200,
      });
      setRows(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load tenant addons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddons();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, scope]);

  const selectedAddon = useMemo(
    () => addons.find((a) => a.id === createAddonIdWatch),
    [addons, createAddonIdWatch]
  );

  function openCreate() {
    createForm.resetFields();
    createForm.setFieldsValue({ quantity: 1 } as any);
    setCreateOpen(true);
  }

  async function submitCreate() {
    try {
      const v = await createForm.validateFields();
      setCreating(true);
      await tenantAddonsService.create({
        tenantId,
        addonId: v.addonId,
        quantity: v.quantity,
      });
      message.success("Add-on purchased");
      setCreateOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Failed");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(row: TenantAddon) {
    setEditing(row);
    editForm.resetFields();
    editForm.setFieldsValue({ quantity: row.quantity });
    setEditOpen(true);
  }
  async function submitEdit() {
    if (!editing) return;
    try {
      const v = await editForm.validateFields();
      setSavingEdit(true);
      await tenantAddonsService.updateQuantity(editing.id, v.quantity);
      message.success("Quantity updated");
      setEditOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  }

  function onCancel(row: TenantAddon) {
    Modal.confirm({
      title: "Cancel add-on?",
      content: `${row.addonName || row.addonCode} (x${row.quantity}) will be marked canceled. The row stays for history.`,
      okText: "Cancel add-on",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantAddonsService.cancel(row.id);
          message.success("Canceled");
          load();
        } catch (e: any) {
          message.error(e?.message || "Cancel failed");
        }
      },
    });
  }
  function onDelete(row: TenantAddon) {
    Modal.confirm({
      title: "Delete add-on row?",
      content: `Permanently removes this canceled/expired row. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await tenantAddonsService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<TenantAddon> = useMemo(
    () => [
      {
        title: "Add-on",
        width: 280,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">
              {row.addonName || row.addonCode}
              {!row.addonId ? (
                <span className="ml-1 text-orange-500" title="Catalog row deleted post-purchase">⚠</span>
              ) : null}
            </div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.addonCode}</div>
          </div>
        ),
      },
      {
        title: "Type",
        dataIndex: "addonType",
        width: 140,
        render: (v: string | null) =>
          v ? (
            <Tag color={TYPE_COLORS[v] || "default"} bordered={false} className="!font-mono !text-[11px]">
              {v}
            </Tag>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
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
                +{row.quantity} {row.limitUnit || row.limitName}
                <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.limitCode}</span>
              </span>
            );
          }
          return <span className="text-slate-400 dark:text-slate-500">—</span>;
        },
      },
      {
        title: "Qty",
        dataIndex: "quantity",
        width: 70,
        align: "right" as const,
        render: (v: number) => <span className="font-mono text-[12.5px]">{v}</span>,
      },
      {
        title: "Total",
        width: 160,
        align: "right" as const,
        render: (_: any, row) => (
          <div>
            <div className="font-mono text-[12.5px] text-slate-900 dark:text-slate-100">
              {formatAmount(row.totalPrice, row.currencyCode)}
            </div>
            {row.quantity > 1 ? (
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatAmount(row.unitPrice, row.currencyCode)} × {row.quantity}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 110,
        render: (v: TenantAddonStatus) => (
          <Tag color={STATUS_COLORS[v]} bordered={false}>{v}</Tag>
        ),
      },
      {
        title: "Started",
        dataIndex: "startsAt",
        width: 120,
        render: (v: string) => (
          <span className="text-[12.5px] text-slate-600 dark:text-slate-400">
            {v ? new Date(v).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 60,
        render: (_, row) => {
          const isActiveLike = row.status === "pending" || row.status === "active";
          return (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  isActiveLike && row.addonType !== "FEATURE"
                    ? {
                        key: "edit",
                        label: (<span className="flex items-center gap-2"><Pencil size={14} /> Edit quantity</span>),
                        onClick: () => openEdit(row),
                      }
                    : null,
                  isActiveLike
                    ? {
                        key: "cancel",
                        label: (<span className="flex items-center gap-2"><X size={14} /> Cancel</span>),
                        onClick: () => onCancel(row),
                      }
                    : null,
                  !isActiveLike
                    ? {
                        key: "delete",
                        danger: true,
                        label: (<span className="flex items-center gap-2"><Trash2 size={14} /> Delete row</span>),
                        onClick: () => onDelete(row),
                      }
                    : null,
                ].filter(Boolean) as any,
              }}
            >
              <Button type="text" icon={<MoreHorizontal size={16} />} />
            </Dropdown>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const isLimitExtension = selectedAddon?.addonType === "LIMIT_EXTENSION";

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3 px-1 gap-3 flex-wrap">
        <div className="text-[13px] text-slate-500 dark:text-slate-400">
          Purchased add-ons. FEATURE add-ons are always qty 1. LIMIT_EXTENSION stack
          across purchases (qty 10 + qty 5 = 15 extra units).
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={scope}
            onChange={(v) => setScope(v as ScopeFilter)}
            options={[
              { label: "Active", value: "active" },
              { label: "All", value: "all" },
            ]}
          />
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={openCreate}
            disabled={addons.length === 0}
            className="!flex !items-center !gap-1"
          >
            Add purchase
          </Button>
        </div>
      </div>

      <Table<TenantAddon>
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
                addons.length === 0
                  ? "No add-ons in the catalog yet."
                  : scope === "active"
                  ? "No active add-ons for this tenant."
                  : "No add-on purchases yet."
              }
            />
          ),
        }}
      />

      {/* Create modal */}
      <Modal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={submitCreate}
        okText="Purchase"
        confirmLoading={creating}
        title="Add add-on purchase"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Add-on"
            name="addonId"
            rules={[{ required: true, message: "Add-on is required" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select an add-on"
              options={addons.map((a) => ({
                value: a.id,
                label: (
                  <span>
                    {a.name}
                    <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{a.code}</span>
                    <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">
                      ({a.addonType} · {formatAmount(a.price, a.currencyCode)})
                    </span>
                  </span>
                ),
              }))}
            />
          </Form.Item>
          {selectedAddon ? (
            <Alert
              type="info"
              showIcon
              className="!mb-3"
              message={
                <span>
                  <span className="font-mono font-semibold">
                    {formatAmount(selectedAddon.price, selectedAddon.currencyCode)}
                  </span>{" "}
                  {isLimitExtension ? "per unit" : `per ${selectedAddon.billingCycle.toLowerCase()}`}
                  {isLimitExtension && selectedAddon.limitUnit ? (
                    <span className="text-slate-500 dark:text-slate-400"> (unit: {selectedAddon.limitUnit})</span>
                  ) : null}
                </span>
              }
            />
          ) : null}
          <Form.Item
            label="Quantity"
            name="quantity"
            tooltip={
              isLimitExtension
                ? `How many units of ${selectedAddon?.limitName || "this limit"} to add.`
                : "FEATURE add-ons are always quantity 1."
            }
            rules={[
              { required: true, message: "Quantity is required" },
              {
                validator: (_, v) =>
                  v && Number.isInteger(v) && v > 0
                    ? Promise.resolve()
                    : Promise.reject("Must be a positive integer"),
              },
            ]}
          >
            <InputNumber
              min={1}
              step={1}
              precision={0}
              disabled={!isLimitExtension && !!selectedAddon}
              className="!w-full"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit quantity modal */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={submitEdit}
        okText="Save"
        confirmLoading={savingEdit}
        title="Edit quantity"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" requiredMark="optional" preserve={false}>
          {editing ? (
            <div className="mb-3 text-[12.5px] text-slate-600 dark:text-slate-400">
              {editing.addonName || editing.addonCode} ·{" "}
              {formatAmount(editing.unitPrice, editing.currencyCode)} per unit
            </div>
          ) : null}
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: "Quantity is required" },
              {
                validator: (_, v) =>
                  v && Number.isInteger(v) && v > 0
                    ? Promise.resolve()
                    : Promise.reject("Must be a positive integer"),
              },
            ]}
          >
            <InputNumber min={1} step={1} precision={0} className="!w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
