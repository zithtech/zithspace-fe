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
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import { pagesService, PricingPage, PageInput } from "@/services/pricing/pagesService";
import { slugifyCode } from "@/lib/codeSlugify";
import { modulesService, PricingModule } from "@/services/pricing/modulesService";
import { sectionsService, Section } from "@/services/pricing/sectionsService";

type StatusFilter = "active" | "archived" | "all";

export default function PagesCatalogPage() {
  const [rows, setRows] = useState<PricingPage[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [modules, setModules] = useState<PricingModule[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sectionFilter, setSectionFilter] = useState<string | undefined>(undefined);
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPage | null>(null);
  const [form] = Form.useForm<PageInput>();
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

  const formSectionId = Form.useWatch<string | undefined>("__sectionId" as any, form);

  async function loadSections() {
    try {
      const res = await sectionsService.list({ limit: 200, status: "active" });
      setSections(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load sections");
    }
  }
  async function loadModules() {
    try {
      const res = await modulesService.list({ limit: 500, status: "active" });
      setModules(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load modules");
    }
  }
  async function load() {
    setLoading(true);
    try {
      const res = await pagesService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        sectionId: sectionFilter,
        moduleId: moduleFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
    loadModules();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter, sectionFilter, moduleFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Filter: reset module if section changes and current module isn't in it
  useEffect(() => {
    if (sectionFilter && moduleFilter) {
      const m = modules.find((x) => x.id === moduleFilter);
      if (m && m.sectionId !== sectionFilter) setModuleFilter(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFilter]);

  const moduleOptionsForFilter = useMemo(
    () =>
      modules
        .filter((m) => !sectionFilter || m.sectionId === sectionFilter)
        .map((m) => ({ value: m.id, label: m.name })),
    [modules, sectionFilter]
  );

  // Modal: a virtual "section" selector that narrows the module list
  const moduleOptionsForModal = useMemo(() => {
    const fsid = formSectionId;
    return modules
      .filter((m) => !fsid || m.sectionId === fsid)
      .map((m) => ({
        value: m.id,
        label: (
          <span>
            {m.name}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{m.code}</span>
          </span>
        ),
      }));
  }, [modules, formSectionId]);

  function openCreate() {
    setEditing(null);
    setCodeManuallyEdited(false);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      displayOrder: 0,
      moduleId: undefined as any,
      ...(sectionFilter ? ({ __sectionId: sectionFilter } as any) : {}),
      ...(moduleFilter ? ({ moduleId: moduleFilter } as any) : {}),
    });
    setModalOpen(true);
  }
  function openEdit(row: PricingPage) {
    setEditing(row);
    form.setFieldsValue({
      __sectionId: row.sectionId,
      moduleId: row.moduleId,
      code: row.code,
      name: row.name,
      path: row.path ?? "",
      description: row.description ?? "",
      displayOrder: row.displayOrder,
      status: row.status,
    } as any);
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      const payload = { ...values } as any;
      delete payload.__sectionId;
      setSaving(true);
      if (editing) {
        await pagesService.update(editing.id, payload);
        message.success("Page updated");
      } else {
        await pagesService.create(payload);
        message.success("Page created");
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

  async function onArchive(row: PricingPage) {
    try {
      await pagesService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PricingPage) {
    try {
      await pagesService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PricingPage) {
    Modal.confirm({
      title: "Delete page?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await pagesService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<PricingPage> = useMemo(
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
        title: "Path",
        dataIndex: "path",
        render: (v: string | null) =>
          v ? (
            <span className="font-mono text-[12px] text-slate-600 dark:text-slate-400">{v}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
      {
        title: "Module",
        width: 200,
        render: (_: any, row) =>
          row.moduleName ? (
            <span className="text-[13px] text-slate-700 dark:text-slate-300">
              {row.moduleName}
              <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.moduleCode}</span>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
      { title: "Order", dataIndex: "displayOrder", width: 80, align: "right" as const },
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
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pages</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Routable pages inside a module. Navigation only — features attached to pages drive entitlement.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
          disabled={modules.length === 0}
          className="!flex !items-center !gap-1"
        >
          New page
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
            placeholder="Search by code, name or path"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!max-w-xs"
          />
          <Select
            allowClear
            value={sectionFilter}
            onChange={(v) => {
              setPage(1);
              setSectionFilter(v);
            }}
            placeholder="All sections"
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            className="!min-w-[180px]"
          />
          <Select
            allowClear
            value={moduleFilter}
            onChange={(v) => {
              setPage(1);
              setModuleFilter(v);
            }}
            placeholder="All modules"
            options={moduleOptionsForFilter}
            className="!min-w-[200px]"
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
        <Table<PricingPage>
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
                  modules.length === 0
                    ? "Create a module first, then add pages."
                    : statusFilter === "archived"
                    ? "No archived pages"
                    : "No pages yet"
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
        okText={editing ? "Save changes" : "Create page"}
        confirmLoading={saving}
        title={editing ? "Edit page" : "New page"}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Section" name="__sectionId" tooltip="Narrows the module list. Not saved.">
              <Select
                allowClear
                placeholder="Optional"
                options={sections.map((s) => ({ value: s.id, label: s.name }))}
                onChange={() => form.setFieldValue("moduleId", undefined)}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item label="Module" name="moduleId" rules={[{ required: true, message: "Module is required" }]}>
              <Select placeholder="Select a module" options={moduleOptionsForModal} showSearch optionFilterProp="label" />
            </Form.Item>
          </div>
          <Form.Item
            label="Code"
            name="code"
            tooltip="UPPER_SNAKE_CASE. Globally unique across all pages."
            rules={[
              { required: true, message: "Code is required" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Must be UPPER_SNAKE_CASE (e.g. LEADS_LIST)" },
            ]}
          >
            <Input placeholder="LEADS_LIST" disabled={!!editing} onChange={() => setCodeManuallyEdited(true)} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Leads list" />
          </Form.Item>
          <Form.Item label="Path" name="path" tooltip="Routable URL in the app (e.g. /leads).">
            <Input placeholder="/leads" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Display order" name="displayOrder" initialValue={0}>
              <InputNumber min={0} className="!w-full" />
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
        </Form>
      </Modal>
    </div>
  );
}
