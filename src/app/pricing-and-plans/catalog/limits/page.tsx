"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Segmented,
  Tag,
  Dropdown,
  AutoComplete,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import { limitsService, PricingLimit, LimitInput } from "@/services/pricing/limitsService";
import { slugifyCode } from "@/lib/codeSlugify";

type StatusFilter = "active" | "archived" | "all";

const UNIT_SUGGESTIONS = [
  "users",
  "projects",
  "clients",
  "GB",
  "MB",
  "hours",
  "tokens",
  "calls",
  "requests",
  "messages",
  "emails",
  "fields",
  "seats",
  "records",
];

export default function LimitsCatalogPage() {
  const [rows, setRows] = useState<PricingLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingLimit | null>(null);
  const [form] = Form.useForm<LimitInput>();
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


  async function load() {
    setLoading(true);
    try {
      const res = await limitsService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load limits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter]);

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
    form.setFieldsValue({ status: "active" });
    setModalOpen(true);
  }
  function openEdit(row: PricingLimit) {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      name: row.name,
      unit: row.unit,
      description: row.description ?? "",
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await limitsService.update(editing.id, values);
        message.success("Limit updated");
      } else {
        await limitsService.create(values);
        message.success("Limit created");
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

  async function onArchive(row: PricingLimit) {
    try {
      await limitsService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PricingLimit) {
    try {
      await limitsService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PricingLimit) {
    Modal.confirm({
      title: "Delete limit?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await limitsService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<PricingLimit> = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        width: 220,
        render: (v: string) => (
          <span className="font-mono text-[12.5px] text-slate-800 dark:text-slate-200">{v}</span>
        ),
      },
      { title: "Name", dataIndex: "name" },
      {
        title: "Unit",
        dataIndex: "unit",
        width: 140,
        render: (v: string) => (
          <Tag color="default" bordered className="!font-mono !text-[11.5px]">
            {v}
          </Tag>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        render: (v: string | null) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{v}</span>
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
    <div className="px-8 py-7">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Limits</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Catalog of metered limit <em>types</em>. Each plan variant then assigns a value (e.g. USERS = 30).
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
          className="!flex !items-center !gap-1"
        >
          New limit
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
          placeholder="Search by code, name or unit"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!max-w-sm"
        />
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
        <Table<PricingLimit>
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
                description={
                  statusFilter === "archived" ? "No archived limits" : "No limits yet"
                }
              />
            ),
          }}
        />
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create limit"}
        confirmLoading={saving}
        title={editing ? "Edit limit" : "New limit"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Code"
            name="code"
            tooltip="UPPER_SNAKE_CASE. Globally unique. Referenced by code in EntitlementService."
            rules={[
              { required: true, message: "Code is required" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Must be UPPER_SNAKE_CASE (e.g. USERS, AI_TOKENS)" },
            ]}
          >
            <Input placeholder="USERS" disabled={!!editing} onChange={() => setCodeManuallyEdited(true)} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Users" />
          </Form.Item>
          <Form.Item
            label="Unit"
            name="unit"
            tooltip="What the limit is measured in. Free text (e.g. users, GB, tokens, calls)."
            rules={[{ required: true, message: "Unit is required" }]}
          >
            <AutoComplete
              options={UNIT_SUGGESTIONS.map((u) => ({ value: u }))}
              placeholder="users"
              filterOption={(input, option) =>
                (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Optional. What this limit controls." />
          </Form.Item>
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
