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
  Space,
  Dropdown,
  Tooltip,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import { sectionsService, Section, SectionInput } from "@/services/pricing/sectionsService";
import { slugifyCode } from "@/lib/codeSlugify";

type StatusFilter = "active" | "archived" | "all";

export default function SectionsCatalogPage() {
  const [rows, setRows] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form] = Form.useForm<SectionInput>();
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
      const res = await sectionsService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load sections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter]);

  // Debounced search
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
    form.setFieldsValue({ status: "active", displayOrder: 0 });
    setModalOpen(true);
  }
  function openEdit(row: Section) {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      name: row.name,
      description: row.description ?? "",
      displayOrder: row.displayOrder,
      icon: row.icon ?? "",
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await sectionsService.update(editing.id, values);
        message.success("Section updated");
      } else {
        await sectionsService.create(values);
        message.success("Section created");
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return; // form validation
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(row: Section) {
    try {
      await sectionsService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: Section) {
    try {
      await sectionsService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: Section) {
    Modal.confirm({
      title: "Delete section?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await sectionsService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<Section> = useMemo(
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
        title: "Order",
        dataIndex: "displayOrder",
        width: 90,
        align: "right" as const,
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
                  label: (
                    <span className="flex items-center gap-2">
                      <Pencil size={14} /> Edit
                    </span>
                  ),
                  onClick: () => openEdit(row),
                },
                row.status === "active"
                  ? {
                      key: "archive",
                      label: (
                        <span className="flex items-center gap-2">
                          <Archive size={14} /> Archive
                        </span>
                      ),
                      onClick: () => onArchive(row),
                    }
                  : {
                      key: "restore",
                      label: (
                        <span className="flex items-center gap-2">
                          <RotateCcw size={14} /> Restore
                        </span>
                      ),
                      onClick: () => onRestore(row),
                    },
                { type: "divider" as const },
                {
                  key: "delete",
                  danger: true,
                  label: (
                    <span className="flex items-center gap-2">
                      <Trash2 size={14} /> Delete
                    </span>
                  ),
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
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sections</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Top-level navigation grouping. Not billable — used to organise modules.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
          className="!flex !items-center !gap-1"
        >
          New section
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
          placeholder="Search by code or name"
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

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#131B2D] overflow-hidden">
        <Table<Section>
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
                  statusFilter === "archived"
                    ? "No archived sections"
                    : "No sections yet"
                }
              />
            ),
          }}
        />
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create section"}
        confirmLoading={saving}
        title={editing ? "Edit section" : "New section"}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item
            label="Code"
            name="code"
            tooltip="Stable identifier referenced in features and code. UPPER_SNAKE_CASE."
            rules={[
              { required: true, message: "Code is required" },
              {
                pattern: /^[A-Z][A-Z0-9_]*$/,
                message: "Must be UPPER_SNAKE_CASE (e.g. CRM)",
              },
            ]}
          >
            <Input placeholder="CRM" disabled={!!editing} onChange={() => setCodeManuallyEdited(true)} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="CRM" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Optional description shown in admin." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Display order" name="displayOrder" initialValue={0}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item label="Icon" name="icon" tooltip="Lucide icon name (optional).">
              <Input placeholder="Layers" />
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
