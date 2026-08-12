"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useMemo, useState, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  InputNumber,
  Row,
  Col,
  Switch,
  Tooltip,
  Drawer,
  App,
  Popover,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  ShieldCheck,
  Edit,
  Plus,
  Layers,
  User,
  X,
  Tag as TagIcon,
  Hash,
  Settings,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { useGrades, GradeViewData } from "@/hooks/useGrades";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgModuleScaffold, OrgStatDef, OrgView } from "@/components/org-structure/OrgModuleScaffold";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";



export default function GradesPage() {
  useActivitySource({ section: "ADMIN", module: "OrgStructure", page: "OrgStructureGrades" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrgGrade, canCreateOrgGrade, canUpdateOrgGrade, canDeleteOrgGrade, canReadActivityLog } = usePermission();

  useEffect(() => {
    if (!authLoading && !canReadOrgGrade) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgGrade, router]);

  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [view, setView] = useState<OrgView>("grid");

  const { dataSource, loading, addGrade, updateGrade, deleteGrade } = useGrades();

  const totalGrades = dataSource.length;
  const activeGrades = dataSource.filter((g) => g.status === "Active").length;
  const inactiveGrades = totalGrades - activeGrades;
  const maxLevel = dataSource.reduce((m, g) => Math.max(m, g.levelOrder || 0), 0);

  const filteredData = useMemo(() => {
    if (!search.trim()) return dataSource;
    const q = search.toLowerCase();
    return dataSource.filter((r) =>
      [r.code, r.codes, r.name, String(r.levelOrder), r.description || "", r.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search, dataSource]);

  const generateNextCode = () => {
    let maxNum = 0;
    let prefix = "G";
    dataSource.forEach((g) => {
      const match = g.code.match(/^([^\d]*)(\d+)$/);
      if (match) {
        prefix = match[1] || "G";
        const num = parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${maxNum + 1}`;
  };

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({
      code: generateNextCode(),
      status: true,
      levelOrder: dataSource.length + 1,
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: GradeViewData) => {
    setEditingKey(record.key);
    form.setFieldsValue({ ...record, status: record.isActive });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteGrade(id);
    if (success) {
      message.success("Grade removed successfully");
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();

      const isDuplicateCode = dataSource.some(
        (g) =>
          g.code.toLowerCase() === formValues.code.toLowerCase() && g.key !== editingKey,
      );
      if (isDuplicateCode) {
        message.error("A grade with this code already exists. Please use a different code.");
        return;
      }

      const isDuplicateName = dataSource.some(
        (g) =>
          g.name.toLowerCase() === formValues.name.trim().toLowerCase() && g.key !== editingKey,
      );
      if (isDuplicateName) {
        message.error("This grade name already exists.");
        return;
      }

      const values = {
        name: formValues.name,
        code: formValues.code,
        codes: formValues.codes,
        levelOrder: formValues.levelOrder ?? (editingKey ? (dataSource.find((g) => g.key === editingKey)?.levelOrder ?? 999) : (dataSource.length + 1)),
        description: formValues.description,
        isActive: !!formValues.status,
      };

      setSubmitting(true);
      const success = editingKey
        ? await updateGrade(editingKey, values)
        : await addGrade(values);
      setSubmitting(false);

      if (success) {
        setIsDrawerOpen(false);
        // api.success({
        //   message: editingKey ? "Grade Updated" : "Grade Added",
        //   description: `Grade "${values.name}" successfully ${editingKey ? "updated" : "added"}.`,
        //   placement: "topRight",
        //   duration: 2,
        // });
        message.success(`Grade "${values.name}" successfully ${editingKey ? "updated" : "added"}.`)
      }
    } catch (error) {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ZukvoLoader size="lg" message="Loading Grades..." />
      </div>
    );
  }

  if (!canReadOrgGrade) return null;

  const columns = [
    {
      title: "Grade",
      key: "identity",
      width: 250,
      render: (_: any, record: GradeViewData) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.codes}</span>
          </div>
        </div>
      ),
    },
    /*
    {
      title: "Hierarchy Level",
      dataIndex: "levelOrder",
      key: "levelOrder",
      align: "center" as const,
      width: 160,
      render: (level: number) => (
        <span className="orgx-row-level">
          <Hash size={11} />
          Level {level}
        </span>
      ),
    },
    */
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 300,
      ellipsis: { showTitle: false },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          <span className="orgx-row-desc">{description || "No description provided"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <span className={`orgx-status-pill ${status === "Active" ? "is-active" : "is-inactive"}`}>
          <span className="orgx-status-dot" />
          {status}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: GradeViewData) => (
        <div className="orgx-row-actions">
          {canUpdateOrgGrade && (
            <Tooltip title="Edit Grade">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgGrade && (
            <ConfirmDialog
              title="Remove grade?"
              description="This will permanently delete this grade level."
              confirmText="Delete"
              tone="danger"
              placement="bottomRight"
              onConfirm={() => handleDelete(record.key)}
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
              </Tooltip>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  const CARD_ACCENTS: [string, string][] = [
    ["#3b82f6", "#2563eb"],
    ["#10b981", "#059669"],
    ["#64748b", "#475569"],
  ];
  const accentFor = (key: string): [string, string] => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return CARD_ACCENTS[h % CARD_ACCENTS.length];
  };

  const stats: OrgStatDef[] = [
    { key: "total", label: "Total Grades", value: totalGrades, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active Grades", value: activeGrades, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "inactive", label: "Inactive Grades", value: inactiveGrades, icon: <User size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
    { key: "top", label: "Top Tier", value: maxLevel ? `L${maxLevel}` : "—", icon: <Hash size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
  ];

  const gradeMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const renderGradeCard = (record: GradeViewData) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const canAct = canUpdateOrgGrade || canDeleteOrgGrade;
    const actionContent = (
      <div className="ant-dropdown-menu" style={{ border: 'none', boxShadow: 'none' }}>
        {canUpdateOrgGrade && (
          <div 
            className="ant-dropdown-menu-item" 
            onClick={(e) => { e.stopPropagation(); setOpenCardId(null); handleEdit(record); }}
          >
            {gradeMenuLabel("Edit grade", "Modify name, code or status", <Edit size={14} />, "#3b82f6", "rgba(59,130,246,0.10)")}
          </div>
        )}
        {canDeleteOrgGrade && (
          <ConfirmDialog
            title="Remove grade?"
            description="This will permanently delete this grade level."
            confirmText="Delete"
            tone="danger"
            placement="bottomRight"
            onConfirm={async () => {
              await handleDelete(record.key);
              setOpenCardId(null);
            }}
          >
            <div className="ant-dropdown-menu-item ant-dropdown-menu-item-danger" onClick={(e) => e.stopPropagation()}>
              {gradeMenuLabel("Delete", "Permanently remove this grade", <Trash2 size={14} />, "#ef4444", "rgba(239,68,68,0.10)")}
            </div>
          </ConfirmDialog>
        )}
      </div>
    );

    return (
      <div className="omx-card">
        <div className="omx-card-top">
          <div className="omx-card-avatar" style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)` }}>
            {record.code}
          </div>
          <div className="omx-card-id">
            <div className="omx-card-title">{record.name}</div>
            <div className="omx-card-sub">{record.codes}</div>
          </div>
          {canAct && (
            <Popover 
              content={actionContent} 
              trigger="click" 
              placement="bottomRight"
              open={openCardId === record.key}
              onOpenChange={(open) => {
                setOpenCardId(open ? record.key : null);
              }}
              overlayClassName="pp-action-pop"
              arrow={false}
            >
              <button type="button" className="omx-card-actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal size={16} />
              </button>
            </Popover>
          )}
        </div>
        <div className="omx-card-desc">{record.description || "No description provided"}</div>
        <div className="omx-card-foot">
          <span className={`omx-pill ${record.status === "Active" ? "is-active" : "is-inactive"}`}>
            <span className="omx-pill-dot" />
            {record.status}
          </span>
          <span className="omx-card-foot-key">{record.code}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* {contextHolder} */}
      <div className="orgx-shell">
          <TimeTrackingHeader
            icon={<ShieldCheck size={20} color="#3b82f6" />}
            title="Grade Hierarchy"
            description="Define and manage organization grade levels and reporting tiers."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              marginBottom: 8,
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
            extra={
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {canReadActivityLog && (
                  <Button
                    icon={<History size={15} />}
                    onClick={() => setHistoryOpen(true)}
                    style={{ borderRadius: 10, height: 38, fontWeight: 600, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    History
                  </Button>
                )}
                {canCreateOrgGrade && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Grade
                  </Button>
                )}
              </div>
            }
          />

          <OrgModuleScaffold<GradeViewData>
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, code, or slug…"
            meta={<><strong>{filteredData.length}</strong> of {totalGrades} grades</>}
            view={view}
            onViewChange={setView}
            loading={loading}
            stats={stats}
            columns={columns}
            data={filteredData}
            rowKey="key"
            renderCard={renderGradeCard}
            emptyTitle="No grades found"
            emptySubtitle="Define your first grade level to build the hierarchy."
            emptyAction={
              canCreateOrgGrade ? (
                <Button type="primary" icon={<Plus size={15} />} onClick={handleAdd} className="orgx-primary-btn">
                  New Grade
                </Button>
              ) : undefined
            }
          />

          {/* Create / Edit Drawer */}
          <Drawer
            rootClassName="leave-drawer-root"
            title={null}
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            width={720}
            closable={false}
            destroyOnClose
            styles={{
              header: { display: 'none' },
              body: { padding: 0, background: 'var(--customers-page-bg)' },
              footer: { padding: 0, border: 'none' },
              wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
              mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
            }}
            footer={
              <div
                className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500, marginRight: 'auto' }}>
                  Fields marked required must be filled
                </span>
                <Button onClick={() => setIsDrawerOpen(false)} style={{ borderRadius: 8, height: 36 }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={handleSave}
                  style={{ borderRadius: 8, height: 36, padding: '0 18px', fontWeight: 600, background: '#2563eb' }}
                  icon={editingKey ? <Edit size={14} /> : <Plus size={14} />}
                >
                  {editingKey ? "Save Changes" : "Create Grade"}
                </Button>
              </div>
            }
          >
            <style>{formStyles}</style>
            <div
              className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
              style={{
                background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(59,130,246,0.10)',
                    color: '#3b82f6',
                    border: '1px solid var(--border-blue-200)',
                  }}
                >
                  {editingKey ? <Edit size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {editingKey ? "Edit Grade" : "New Grade Level"}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Define a tier in the organization hierarchy with its code and order.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 16, flex: 1, overflowY: 'auto', background: 'var(--customers-page-bg)' }}>
              <Form 
                form={form} 
                layout="horizontal"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                labelAlign="left"
                colon={false}
                requiredMark="optional"
                className="customer-drawer-form"
              >
                <SectionCard
                  icon={<TagIcon />}
                  title="Identity"
                  subtitle="Grade naming and identifier"
                  step="STEP 1"
                >
                  <Form.Item
                    name="name"
                    label="Grade name"
                    rules={[{ required: true, message: "Please enter grade name" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input
                      placeholder="e.g. Senior Manager"
                      onChange={(e) => {
                        if (!editingKey) {
                          form.setFieldsValue({ codes: generateCodeFromName(e.target.value) });
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Reference code"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. G1" />
                  </Form.Item>
                  <Form.Item
                    name="codes"
                    label="ID slug"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. SENIOR_MANAGER" />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<Settings />}
                  title="Operations"
                  subtitle="Status and description"
                  step="STEP 2"
                >
                  <Form.Item 
                    name="status" 
                    valuePropName="checked" 
                    initialValue={true} 
                    label="Active status" 
                    tooltip="When active, this grade is assignable to positions."
                    style={{ marginBottom: 14 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item 
                    name="description" 
                    label="Description (optional)"
                    style={{ marginBottom: 14 }}
                  >
                    <Input.TextArea rows={3} placeholder="Roles or criteria for this grade…" maxLength={200} showCount />
                  </Form.Item>
                </SectionCard>
              </Form>
            </div>
          </Drawer>
        </div>
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          module="OrgStructure"
        />
        <style jsx global>{`
          .orgx-shell .saas-header-container {
            padding: 9.5px 32px !important;
          }

          @media (max-width: 1024px) {
            .orgx-shell .saas-header-container {
              padding: 9px 16px !important;
            }
          }

          /* Remove table header rounded corners */
          .orgx-shell .ant-table-thead > tr > th {
            border-radius: 0px !important;
          }
          .orgx-shell .ant-table-wrapper .ant-table-container {
            border-radius: 0px !important;
          }

          /* Premium action dropdown — matches Proposal page */
          .pp-action-pop .ant-popover-inner {
            padding: 0 !important;
            border-radius: 0px !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .pp-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0px !important; min-width: 220px;
            overflow: hidden !important;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          }
          .pp-action-pop .ant-dropdown-menu-item {
            padding: 0 !important; border-radius: 0px !important; margin: 1px 0;
            transition: background .12s ease;
          }
          .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
          .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
          .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
          .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
          .pp-menu-ic {
            width: 30px; height: 30px; border-radius: 0px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
          }
          .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
          .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
          .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
          .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          [data-theme='dark'] .pp-action-pop .ant-dropdown-menu {
            background: #0B0F1A !important; border-color: #1E293B !important;
          }
          [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover { background: #161B22 !important; }
          [data-theme='dark'] .pp-menu-title { color: #cbd5e1 !important; }
          [data-theme='dark'] .pp-menu-desc { color: #64748b !important; }
        `}</style>
    </>
  );
}
