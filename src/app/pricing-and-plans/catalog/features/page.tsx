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
  Select,
  Dropdown,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, MoreHorizontal, Pencil, Archive, RotateCcw, Trash2 } from "lucide-react";
import {
  featuresService,
  PricingFeature,
  FeatureInput,
  FeatureType,
  FEATURE_TYPES,
  featureTypeLabel,
} from "@/services/pricing/featuresService";
import { slugifyCode } from "@/lib/codeSlugify";
import { sectionsService, Section } from "@/services/pricing/sectionsService";
import { modulesService, PricingModule } from "@/services/pricing/modulesService";
import { pagesService, PricingPage } from "@/services/pricing/pagesService";

type StatusFilter = "active" | "archived" | "all";

const TYPE_COLORS: Record<FeatureType, string> = {
  MODULE: "blue",
  PAGE: "cyan",
  ACTION: "geekblue",
  AI: "magenta",
  AUTOMATION: "purple",
  LIMIT: "gold",
  INTEGRATION: "green",
  ADDON: "orange",
};

export default function FeaturesCatalogPage() {
  const [rows, setRows] = useState<PricingFeature[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [modules, setModules] = useState<PricingModule[]>([]);
  const [pages, setPages] = useState<PricingPage[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [typeFilter, setTypeFilter] = useState<FeatureType | undefined>(undefined);
  const [sectionFilter, setSectionFilter] = useState<string | undefined>(undefined);
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined);
  const [pageFilter, setPageFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingFeature | null>(null);
  const [form] = Form.useForm<FeatureInput & { sectionId?: string }>();
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


  const formSectionId = Form.useWatch("sectionId", form);
  const formModuleId = Form.useWatch("moduleId", form);

  async function loadLookups() {
    try {
      const [s, m, p] = await Promise.all([
        sectionsService.list({ limit: 200, status: "active" }),
        modulesService.list({ limit: 500, status: "active" }),
        pagesService.list({ limit: 1000, status: "active" }),
      ]);
      setSections(s.data);
      setModules(m.data);
      setPages(p.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load lookups");
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await featuresService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        featureType: typeFilter,
        sectionId: sectionFilter,
        moduleId: moduleFilter,
        pageId: pageFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load features");
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
  }, [page, pageSize, statusFilter, typeFilter, sectionFilter, moduleFilter, pageFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Cascade: clear narrower filter when broader filter changes
  useEffect(() => {
    if (sectionFilter && moduleFilter) {
      const m = modules.find((x) => x.id === moduleFilter);
      if (m && m.sectionId !== sectionFilter) {
        setModuleFilter(undefined);
        setPageFilter(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFilter]);
  useEffect(() => {
    if (moduleFilter && pageFilter) {
      const p = pages.find((x) => x.id === pageFilter);
      if (p && p.moduleId !== moduleFilter) setPageFilter(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter]);

  const moduleOptionsForFilter = useMemo(
    () =>
      modules
        .filter((m) => !sectionFilter || m.sectionId === sectionFilter)
        .map((m) => ({ value: m.id, label: m.name })),
    [modules, sectionFilter]
  );
  const pageOptionsForFilter = useMemo(
    () =>
      pages
        .filter((p) => !moduleFilter || p.moduleId === moduleFilter)
        .filter((p) => !sectionFilter || p.sectionId === sectionFilter)
        .map((p) => ({ value: p.id, label: p.name })),
    [pages, moduleFilter, sectionFilter]
  );

  // Modal cascades
  const moduleOptionsForModal = useMemo(
    () =>
      modules
        .filter((m) => !formSectionId || m.sectionId === formSectionId)
        .map((m) => ({
          value: m.id,
          label: (
            <span>
              {m.name}
              <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{m.code}</span>
            </span>
          ),
        })),
    [modules, formSectionId]
  );
  const pageOptionsForModal = useMemo(
    () =>
      pages
        .filter((p) => !formModuleId || p.moduleId === formModuleId)
        .filter((p) => !formSectionId || p.sectionId === formSectionId)
        .map((p) => ({
          value: p.id,
          label: (
            <span>
              {p.name}
              <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{p.code}</span>
            </span>
          ),
        })),
    [pages, formModuleId, formSectionId]
  );

  function openCreate() {
    setEditing(null);
    setCodeManuallyEdited(false);
    form.resetFields();
    form.setFieldsValue({
      status: "active",
      featureType: "ACTION" as FeatureType,
      sectionId: sectionFilter,
      moduleId: moduleFilter,
      pageId: pageFilter,
    });
    setModalOpen(true);
  }
  function openEdit(row: PricingFeature) {
    setEditing(row);
    form.setFieldsValue({
      sectionId: row.sectionId ?? undefined,
      moduleId: row.moduleId ?? undefined,
      pageId: row.pageId ?? undefined,
      code: row.code,
      name: row.name,
      featureType: row.featureType,
      description: row.description ?? "",
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      const payload: FeatureInput = {
        code: values.code,
        name: values.name,
        featureType: values.featureType,
        description: values.description ?? null,
        status: values.status,
        sectionId: values.sectionId ?? null,
        moduleId: values.moduleId ?? null,
        pageId: values.pageId ?? null,
      };
      setSaving(true);
      if (editing) {
        await featuresService.update(editing.id, payload);
        message.success("Feature updated");
      } else {
        await featuresService.create(payload);
        message.success("Feature created");
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

  async function onArchive(row: PricingFeature) {
    try {
      await featuresService.archive(row.id);
      message.success("Archived");
      load();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PricingFeature) {
    try {
      await featuresService.restore(row.id);
      message.success("Restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PricingFeature) {
    Modal.confirm({
      title: "Delete feature?",
      content: `"${row.name}" will be permanently removed. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await featuresService.remove(row.id);
          message.success("Deleted");
          load();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<PricingFeature> = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        width: 240,
        render: (v: string) => (
          <span className="font-mono text-[12.5px] text-slate-800 dark:text-slate-200">{v}</span>
        ),
      },
      { title: "Name", dataIndex: "name" },
      {
        title: "Type",
        dataIndex: "featureType",
        width: 130,
        render: (v: FeatureType) => (
          <Tag color={TYPE_COLORS[v]} bordered={false} className="!text-[11px]">
            {featureTypeLabel(v)}
          </Tag>
        ),
      },
      {
        title: "Scope",
        width: 280,
        render: (_: any, row) => {
          const parts: string[] = [];
          if (row.sectionName) parts.push(row.sectionName);
          if (row.moduleName) parts.push(row.moduleName);
          if (row.pageName) parts.push(row.pageName);
          if (!parts.length) return <span className="text-slate-400 dark:text-slate-500">— global —</span>;
          return (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">
              {parts.join(" › ")}
            </span>
          );
        },
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
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Features</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Billable / controllable units. Plans entitle features; add-ons grant features. Scope is optional.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
          className="!flex !items-center !gap-1"
        >
          New feature
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
            options={FEATURE_TYPES.map((t) => ({ value: t, label: featureTypeLabel(t) }))}
            className="!min-w-[140px]"
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
            className="!min-w-[160px]"
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
            className="!min-w-[180px]"
          />
          <Select
            allowClear
            value={pageFilter}
            onChange={(v) => {
              setPage(1);
              setPageFilter(v);
            }}
            placeholder="All pages"
            options={pageOptionsForFilter}
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
        <Table<PricingFeature>
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
                  statusFilter === "archived" ? "No archived features" : "No features yet"
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
        okText={editing ? "Save changes" : "Create feature"}
        confirmLoading={saving}
        title={editing ? "Edit feature" : "New feature"}
        destroyOnClose
        width={620}
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Type"
              name="featureType"
              rules={[{ required: true, message: "Type is required" }]}
            >
              <Select options={FEATURE_TYPES.map((t) => ({ value: t, label: featureTypeLabel(t) }))} />
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
            tooltip="UPPER_SNAKE_CASE. Globally unique. Used by code (e.g. EntitlementService)."
            rules={[
              { required: true, message: "Code is required" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Must be UPPER_SNAKE_CASE (e.g. SPRINT_AI)" },
            ]}
          >
            <Input placeholder="SPRINT_AI" disabled={!!editing} onChange={() => setCodeManuallyEdited(true)} />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Sprint AI insights" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div className="text-[12px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1 mb-2">
            Scope (optional)
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Form.Item label="Section" name="sectionId">
              <Select
                allowClear
                placeholder="—"
                options={sections.map((s) => ({ value: s.id, label: s.name }))}
                showSearch
                optionFilterProp="label"
                onChange={() => {
                  form.setFieldValue("moduleId", undefined);
                  form.setFieldValue("pageId", undefined);
                }}
              />
            </Form.Item>
            <Form.Item label="Module" name="moduleId">
              <Select
                allowClear
                placeholder="—"
                options={moduleOptionsForModal}
                showSearch
                optionFilterProp="label"
                onChange={() => form.setFieldValue("pageId", undefined)}
              />
            </Form.Item>
            <Form.Item label="Page" name="pageId">
              <Select
                allowClear
                placeholder="—"
                options={pageOptionsForModal}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
