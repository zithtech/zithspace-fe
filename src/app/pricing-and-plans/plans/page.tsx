"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  InputNumber,
  Segmented,
  Dropdown,
  Empty,
  App,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  ChevronRight,
  Package,
} from "lucide-react";
import { plansService, PricingPlan, PlanInput } from "@/services/pricing/plansService";
import { slugifyCode } from "@/lib/codeSlugify";

type StatusFilter = "active" | "archived" | "all";

export default function PlansPage() {
  const { modal } = App.useApp();
  const router = useRouter();

  const [rows, setRows] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Stats — total counts independent of current filter
  const [activeTotal, setActiveTotal] = useState<number | null>(null);
  const [archivedTotal, setArchivedTotal] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPlan | null>(null);
  const [form] = Form.useForm<PlanInput>();
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
      const res = await plansService.list({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const [active, archived] = await Promise.all([
        plansService.list({ limit: 1, status: "active" }),
        plansService.list({ limit: 1, status: "archived" }),
      ]);
      setActiveTotal(active.pagination.total);
      setArchivedTotal(archived.pagination.total);
    } catch {
      // silent — stats are non-critical
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    // Wizard route — keep the modal only for edit
    router.push("/pricing-and-plans/plans/create");
  }
  function openEdit(row: PricingPlan) {
    setEditing(row);
    form.setFieldsValue({
      code: row.code,
      name: row.name,
      description: row.description ?? "",
      displayOrder: row.displayOrder,
      status: row.status,
    });
    setModalOpen(true);
  }

  async function submit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await plansService.update(editing.id, values);
        message.success("Plan updated");
      } else {
        await plansService.create(values);
        message.success("Plan created");
      }
      setModalOpen(false);
      load();
      loadStats();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(row: PricingPlan) {
    try {
      await plansService.archive(row.id);
      message.success("Archived");
      load();
      loadStats();
    } catch (e: any) {
      message.error(e?.message || "Archive failed");
    }
  }
  async function onRestore(row: PricingPlan) {
    try {
      await plansService.restore(row.id);
      message.success("Restored");
      load();
      loadStats();
    } catch (e: any) {
      message.error(e?.message || "Restore failed");
    }
  }
  function onDelete(row: PricingPlan) {
    modal.confirm({
      title: "Delete plan?",
      content: (
        <span>
          <span className="font-medium">{row.name}</span> will be permanently removed.
          This fails if any variants exist — archive first.
        </span>
      ),
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await plansService.remove(row.id);
          message.success("Deleted");
          load();
          loadStats();
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  const columns: ColumnsType<PricingPlan> = useMemo(
    () => [
      {
        title: "Plan",
        dataIndex: "name",
        render: (v: string, row) => (
          <Link
            href={`/pricing-and-plans/plans/${row.id}`}
            className="inline-flex items-center gap-2.5 group"
          >
            <span className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors">
              <Package size={14} />
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors flex items-center gap-1">
                {v}
                <ChevronRight
                  size={14}
                  className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors"
                />
              </div>
              <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                {row.code}
              </div>
            </div>
          </Link>
        ),
      },
      {
        title: "Description",
        dataIndex: "description",
        render: (v: string | null) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400 line-clamp-2 max-w-md">
              {v}
            </span>
          ) : (
            <span className="text-[12px] italic text-slate-400 dark:text-slate-500">
              No description
            </span>
          ),
      },
      {
        title: "Order",
        dataIndex: "displayOrder",
        width: 90,
        align: "right" as const,
        render: (v: number) => (
          <span className="font-mono text-[12.5px] text-slate-600 dark:text-slate-400">{v}</span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 130,
        render: (v: string) => <StatusPill status={v as "active" | "archived"} />,
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

  const totalAll =
    activeTotal !== null && archivedTotal !== null ? activeTotal + archivedTotal : null;

  return (
    <div className="px-8 py-7 max-w-[1280px]">
      {/* ──────── Hero ──────── */}
      <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Plans
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Top-level plan definitions. Plans hold mapped features and house variants — each variant
            gets its own price and limits.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Plus size={15} />}
          onClick={openCreate}
          className="!flex !items-center !gap-1.5 !h-10"
        >
          New plan
        </Button>
      </div>

      {/* ──────── Stats strip ──────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard label="Total plans" value={totalAll} accent="slate" />
        <SummaryCard label="Active" value={activeTotal} accent="emerald" dot="emerald" />
        <SummaryCard label="Archived" value={archivedTotal} accent="slate" dot="slate" />
      </div>

      {/* ──────── Toolbar ──────── */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
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

      {/* ──────── Table ──────── */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#131B2D] overflow-hidden">
        <Table<PricingPlan>
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
            emptyText: rows.length === 0 && !loading ? (
              <EmptyPlans
                isArchivedFilter={statusFilter === "archived"}
                onCreate={openCreate}
              />
            ) : (
              <Empty />
            ),
          }}
        />
      </div>

      {/* ──────── Edit modal ──────── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        okText={editing ? "Save changes" : "Create plan"}
        confirmLoading={saving}
        title={
          <div>
            <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              {editing ? "Edit plan" : "New plan"}
            </div>
            <div className="mt-0.5 text-[12px] font-normal text-slate-500 dark:text-slate-400">
              {editing
                ? `Code ${editing.code} is locked once the plan exists.`
                : "Variants and features are configured on the plan detail page after creation."}
            </div>
          </div>
        }
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
          <SectionHeader>Identity</SectionHeader>
          <Form.Item
            label="Code"
            name="code"
            tooltip="UPPER_SNAKE_CASE. Globally unique. Variants reuse this as a prefix (e.g. STARTER_MONTHLY)."
            rules={[
              { required: true, message: "Code is required" },
              {
                pattern: /^[A-Z][A-Z0-9_]*$/,
                message: "Must be UPPER_SNAKE_CASE (e.g. STARTER)",
              },
            ]}
          >
            <Input
              placeholder="STARTER"
              disabled={!!editing}
              onChange={() => setCodeManuallyEdited(true)}
            />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Starter" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="What this plan is for, who it targets." />
          </Form.Item>

          <SectionHeader>Display</SectionHeader>
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

// ============================================================
// Visual atoms
// ============================================================

function StatusPill({ status }: { status: "active" | "archived" }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-[11.5px] font-medium text-emerald-700 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[11.5px] font-medium text-slate-600 dark:text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
      Archived
    </span>
  );
}

function SummaryCard({
  label,
  value,
  accent = "slate",
  dot,
}: {
  label: string;
  value: number | null;
  accent?: "slate" | "emerald";
  dot?: "emerald" | "slate";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-slate-900 dark:text-slate-100"
      : "text-slate-900 dark:text-slate-100";
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#131B2D] px-5 py-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {dot ? (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dot === "emerald"
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-slate-400 dark:bg-slate-500"
            }`}
          />
        ) : null}
        {label}
      </div>
      <div className={`mt-1.5 text-[24px] font-semibold tabular-nums ${valueColor}`}>
        {value === null ? "—" : value}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1 mb-2 first:mt-0">
      {children}
    </div>
  );
}

function EmptyPlans({
  isArchivedFilter,
  onCreate,
}: {
  isArchivedFilter: boolean;
  onCreate: () => void;
}) {
  if (isArchivedFilter) {
    return (
      <div className="py-12 px-6 text-center">
        <div className="inline-flex w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 items-center justify-center mb-3">
          <Archive size={18} className="text-slate-400 dark:text-slate-500" />
        </div>
        <div className="text-[13.5px] font-medium text-slate-700 dark:text-slate-300">
          No archived plans
        </div>
        <div className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
          Archived plans show up here once you archive an active one.
        </div>
      </div>
    );
  }
  return (
    <div className="py-12 px-6 text-center">
      <div className="inline-flex w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 items-center justify-center mb-3">
        <Package size={18} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div className="text-[14px] font-medium text-slate-800 dark:text-slate-200">
        No plans yet
      </div>
      <div className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        Create your first plan — pick features that come with it, then add variants for monthly /
        yearly pricing.
      </div>
      <Button
        type="primary"
        icon={<Plus size={14} />}
        onClick={onCreate}
        className="!mt-4 !flex !items-center !gap-1.5 !mx-auto"
      >
        New plan
      </Button>
    </div>
  );
}
