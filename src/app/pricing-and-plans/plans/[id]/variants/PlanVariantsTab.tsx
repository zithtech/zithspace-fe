"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Segmented,
  Tag,
  Dropdown,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import {
  planVariantsService,
  PlanVariant,
  PlanVariantInput,
  BillingCycle,
  BILLING_CYCLES,
} from "@/services/pricing/planVariantsService";

interface Props {
  planId: string;
  planCode: string;
}

const CYCLE_COLORS: Record<BillingCycle, string> = {
  MONTHLY: "blue",
  QUARTERLY: "geekblue",
  YEARLY: "purple",
  ONE_TIME: "gold",
};

const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
  ONE_TIME: "ONE_TIME",
};

export default function PlanVariantsTab({ planId, planCode }: Props) {
  const [rows, setRows] = useState<PlanVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanVariant | null>(null);
  const [form] = Form.useForm<PlanVariantInput>();
  const [saving, setSaving] = useState(false);

  const cycleWatch = Form.useWatch<BillingCycle | undefined>("billingCycle", form);
  const nameWatch = Form.useWatch<string | undefined>("name", form);
  const codeTouched = Form.useWatch<string | undefined>("code", form);

  async function load() {
    setLoading(true);
    try {
      const res = await planVariantsService.list({ planId, limit: 200 });
      setRows(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  // Code suggestion: <PLAN_CODE>_<CYCLE> when creating
  useEffect(() => {
    if (editing) return;
    if (!cycleWatch) return;
    const suggested = `${planCode}_${CYCLE_SUFFIX[cycleWatch]}`;
    const current = form.getFieldValue("code");
    if (!current || isAutoSuggested(current, planCode)) {
      form.setFieldValue("code", suggested);
    }
  }, [cycleWatch, planCode, editing, form]);

  // Name suggestion: "<plan name> <cycle>" — but we only know plan name from header, so use planCode
  useEffect(() => {
    if (editing) return;
    if (!cycleWatch) return;
    const human = cycleWatch.replace("_", " ").toLowerCase();
    const suggested = `${planCode} ${human}`;
    const current = form.getFieldValue("name");
    if (!current || /^[A-Z0-9_]+\s+\w+/.test(current)) {
      form.setFieldValue("name", suggested);
    }
  }, [cycleWatch, planCode, editing, form]);

  function isAutoSuggested(code: string, plan: string) {
    return BILLING_CYCLES.some((c) => code === `${plan}_${CYCLE_SUFFIX[c]}`);
  }

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      billingCycle: "MONTHLY",
    });
    setModalOpen(true);
  }
  function openEdit(row: PlanVariant) {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      name: row.name,
      billingCycle: row.billingCycle,
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await planVariantsService.update(editing.id, values);
        message.success("Variant updated");
      } else {
        // planId is a prop, not a form field — inject it at submit time so we
        // don't depend on a hidden Form.Item being included in validateFields().
        await planVariantsService.create({ ...values, planId });
        message.success("Variant created");
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

  async function onArchive(row: PlanVariant) {
    try {
      await planVariantsService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PlanVariant) {
    try {
      await planVariantsService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PlanVariant) {
    Modal.confirm({
      title: "Delete variant?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await planVariantsService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<PlanVariant> = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        render: (v: string) => (
          <span className="font-mono text-[12.5px] text-slate-800 dark:text-slate-200">{v}</span>
        ),
      },
      { title: "Name", dataIndex: "name", width: 240 },
      {
        title: "Cycle",
        dataIndex: "billingCycle",
        width: 140,
        render: (v: BillingCycle) => (
          <Tag color={CYCLE_COLORS[v]} bordered={false} className="!font-mono !text-[11px]">
            {v}
          </Tag>
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
          Each variant is a buyable SKU. Prices, features and limits attach per variant.
        </div>
        <Button
          type="primary"
          size="small"
          icon={<Plus size={14} />}
          onClick={openCreate}
          className="!flex !items-center !gap-1"
        >
          New variant
        </Button>
      </div>

      <Table<PlanVariant>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        locale={{
          emptyText: (
            <Empty description="No variants yet. Add MONTHLY and YEARLY to start." />
          ),
        }}
      />

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create variant"}
        confirmLoading={saving}
        title={editing ? "Edit variant" : "New variant"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Billing cycle"
              name="billingCycle"
              rules={[{ required: true, message: "Cycle is required" }]}
            >
              <Select
                options={BILLING_CYCLES.map((c) => ({ value: c, label: c }))}
                disabled={!!editing}
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
          <Form.Item
            label="Code"
            name="code"
            tooltip="UPPER_SNAKE_CASE. Globally unique. Auto-suggested from plan code + cycle."
            rules={[
              { required: true, message: "Code is required" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Must be UPPER_SNAKE_CASE" },
            ]}
          >
            <Input placeholder={`${planCode}_MONTHLY`} disabled={!!editing} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder={`${planCode} monthly`} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
