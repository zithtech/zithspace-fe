"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  Select,
  Row,
  Col,
  notification,
  Spin,
  Tooltip,
  Switch,
  Drawer,
  Popover,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Trophy,
  Edit,
  Plus,
  Layers,
  ShieldCheck,
  User,
  Trash2,
  X,
  Tag as TagIcon,
  Settings,
  Building2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useDepartments } from "@/hooks/useDepartments";
import { useGrades } from "@/hooks/useGrades";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions, PositionViewData } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgModuleScaffold, OrgStatDef, OrgView } from "@/components/org-structure/OrgModuleScaffold";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

export default function PositionsPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructurePositions" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOrgPosition,
    canCreateOrgPosition,
    canUpdateOrgPosition,
    canDeleteOrgPosition,
    canReadActivityLog
  } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [subDepartmentFilter, setSubDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [view, setView] = useState<OrgView>("grid");
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const { departments, loading: departmentsLoading } = useDepartments();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();
  const {
    dataSource: positions,
    loading,
    createPosition,
    updatePosition,
    deletePosition,
  } = usePositions();

  useEffect(() => {
    if (!authLoading && !canReadOrgPosition) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgPosition, router]);

  const validPositions = useMemo(() => Array.isArray(positions) ? positions : [], [positions]);

  const filteredData = useMemo(() => {
    return validPositions.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.title?.toLowerCase()?.includes(q) ||
        item.code?.toLowerCase()?.includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesGrade = !gradeFilter || item.gradeId === gradeFilter;
      const matchesDepartment = !departmentFilter || item.departmentId === departmentFilter;
      const matchesSubDepartment =
        !subDepartmentFilter || item.subDepartmentId === subDepartmentFilter;
      return matchesSearch && matchesStatus && matchesGrade && matchesDepartment && matchesSubDepartment;
    });
  }, [validPositions, searchText, statusFilter, gradeFilter, departmentFilter, subDepartmentFilter]);

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Loading Positions..." />
      </div>
    );
  }

  if (!canReadOrgPosition) return null;

  const totalPositions = validPositions.length;
  const activePositions = validPositions.filter((p) => p.isActive).length;
  const uniqueDepts = new Set(validPositions.map((p) => p.departmentId).filter(Boolean)).size;
  const uniqueGrades = new Set(validPositions.map((p) => p.gradeId).filter(Boolean)).size;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: PositionViewData) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record, status: record.isActive });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deletePosition(id);
    if (success) {
      api.success({
        message: "Position Removed",
        description: "The position has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = { ...formValues, isActive: formValues.status };
      setSubmitting(true);
      const success = editingKey
        ? await updatePosition(editingKey, payload)
        : await createPosition(payload);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Position ${editingKey ? "Updated" : "Created"}`,
          description: `The role "${payload.title}" has been successfully saved.`,
          placement: "topRight",
          duration: 2,
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Position",
      key: "identity",
      width: 250,
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "PS"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.title}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Context",
      key: "context",
      width: 200,
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-context">
          <span className="orgx-row-context__main">{record.departmentName || "General"}</span>
          {record.subDepartmentName && (
            <span className="orgx-row-context__sub">{record.subDepartmentName}</span>
          )}
        </div>
      ),
    },
    {
      title: "Grade",
      dataIndex: "gradeName",
      key: "gradeName",
      width: 150,
      render: (grade: string) => (
        <span className={`orgx-row-soft-tag${!grade ? " is-muted" : ""}`}>{grade || "Not assigned"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <span className={`orgx-status-pill ${isActive ? "is-active" : "is-inactive"}`}>
          <span className="orgx-status-dot" />
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, record: PositionViewData) => (
        <div className="orgx-row-actions">
          {canUpdateOrgPosition && (
            <Tooltip title="Edit Position">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgPosition && (
            <ConfirmDialog
              title="Remove position?"
              description="This will permanently delete this role."
              confirmText="Delete"
              tone="danger"
              placement="bottomRight"
              onConfirm={() => handleDelete(record.id)}
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

  const hasAdvancedFilter = !!gradeFilter || !!departmentFilter || !!subDepartmentFilter;

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
    { key: "total", label: "Total Positions", value: totalPositions, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active", value: activePositions, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "departments", label: "Departments", value: uniqueDepts, icon: <Building2 size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
    { key: "grades", label: "Grade Levels", value: uniqueGrades, icon: <User size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
  ];

  const positionMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const renderPositionCard = (record: PositionViewData) => {
    const [c0, c1] = accentFor(record.code || record.title || "");
    const avatar = (record.code?.substring(0, 2) || record.title?.substring(0, 2) || "PS").toUpperCase();
    const canAct = canUpdateOrgPosition || canDeleteOrgPosition;
    const context = [record.departmentName, record.subDepartmentName].filter(Boolean).join(" › ");
    
    const actionContent = (
      <div className="ant-dropdown-menu" style={{ border: 'none', boxShadow: 'none' }}>
        {canUpdateOrgPosition && (
          <div 
            className="ant-dropdown-menu-item" 
            onClick={(e) => { e.stopPropagation(); setOpenCardId(null); handleEdit(record); }}
          >
            {positionMenuLabel("Edit position", "Modify title, grade or status", <Edit size={14} />, "#3b82f6", "rgba(59,130,246,0.10)")}
          </div>
        )}
        {canDeleteOrgPosition && (
          <ConfirmDialog
            title="Remove position?"
            description="This will permanently delete this role."
            confirmText="Delete"
            tone="danger"
            placement="bottomRight"
            onConfirm={async () => {
              await handleDelete(record.id);
              setOpenCardId(null);
            }}
          >
            <div className="ant-dropdown-menu-item ant-dropdown-menu-item-danger" onClick={(e) => e.stopPropagation()}>
              {positionMenuLabel("Delete", "Permanently remove this role", <Trash2 size={14} />, "#ef4444", "rgba(239,68,68,0.10)")}
            </div>
          </ConfirmDialog>
        )}
      </div>
    );

    return (
      <div className="omx-card">
        <div className="omx-card-top">
          <div className="omx-card-avatar" style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)` }}>
            {avatar}
          </div>
          <div className="omx-card-id">
            <div className="omx-card-title">{record.title}</div>
            <div className="omx-card-sub">{record.code || record.gradeName || "—"}</div>
          </div>
          {canAct && (
            <Popover 
              content={actionContent} 
              trigger="click" 
              placement="bottomRight"
              open={openCardId === record.id}
              onOpenChange={(open) => {
                setOpenCardId(open ? record.id : null);
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
        <div className="omx-card-desc">{record.description || context || "No description provided"}</div>
        <div className="omx-card-foot">
          <span className={`omx-pill ${record.isActive ? "is-active" : "is-inactive"}`}>
            <span className="omx-pill-dot" />
            {record.isActive ? "Active" : "Inactive"}
          </span>
          <span className="omx-card-foot-key">{record.gradeName || record.departmentName || ""}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="orgx-shell">
        <TimeTrackingHeader
            icon={<Trophy size={20} color="#3b82f6" />}
            title="Positions"
            description="Define and manage organization roles, grade assignments, and designations."
            style={{
              borderBottom: "1px solid var(--border-slate-200)",
              padding: "9.5px 32px",
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
                {canCreateOrgPosition && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Position
                  </Button>
                )}
              </div>
            }
          />

            <OrgModuleScaffold<PositionViewData>
              search={searchText}
              onSearchChange={setSearchText}
              searchPlaceholder="Search by title or code…"
              view={view}
              onViewChange={setView}
              loading={loading}
              stats={stats}
              columns={columns}
              data={filteredData}
              rowKey="id"
              renderCard={renderPositionCard}
              filters={
                <>
                  <SearchableDropdown
                    placeholder="All statuses"
                    searchPlaceholder="Search statuses"
                    itemNoun="statuses"
                    value={statusFilter ?? undefined}
                    onChange={(v) => setStatusFilter(v ?? null)}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    width={180}
                    style={{ width: 138, height: 32 }}
                  />
                  <SearchableDropdown
                    placeholder="All grades"
                    searchPlaceholder="Search grades"
                    itemNoun="grades"
                    loading={gradesLoading}
                    value={gradeFilter ?? undefined}
                    onChange={(v) => setGradeFilter(v ?? null)}
                    options={(grades ?? []).map((g: any) => ({ value: g.key, label: g.name }))}
                    width={220}
                    style={{ width: 150, height: 32 }}
                    disabled={!grades || grades.length === 0}
                  />
                  <SearchableDropdown
                    placeholder="All departments"
                    searchPlaceholder="Search departments"
                    itemNoun="departments"
                    loading={departmentsLoading}
                    value={departmentFilter ?? undefined}
                    onChange={(v) => {
                      setDepartmentFilter(v ?? null);
                      setSubDepartmentFilter(null);
                    }}
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    width={240}
                    style={{ width: 168, height: 32 }}
                    disabled={departments.length === 0}
                  />
                  <SearchableDropdown
                    placeholder="All sub-depts"
                    searchPlaceholder="Search sub-departments"
                    itemNoun="sub-departments"
                    loading={subDepartmentsLoading}
                    value={subDepartmentFilter ?? undefined}
                    onChange={(v) => setSubDepartmentFilter(v ?? null)}
                    options={subDepartments
                      .filter((sd) => !departmentFilter || sd.parentDepartmentId === departmentFilter)
                      .map((sd) => ({ value: sd.id, label: sd.name }))}
                    width={240}
                    style={{ width: 168, height: 32 }}
                    disabled={subDepartments.length === 0}
                  />
                  {(hasAdvancedFilter || statusFilter) && (
                    <Button
                      className="orgx-clear-btn"
                      onClick={() => {
                        setStatusFilter(null);
                        setGradeFilter(null);
                        setDepartmentFilter(null);
                        setSubDepartmentFilter(null);
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </>
              }
              emptyTitle="No positions found"
              emptySubtitle="Define your first role to populate the org structure."
              emptyAction={
                canCreateOrgPosition ? (
                  <Button type="primary" icon={<Plus size={15} />} onClick={handleAdd} className="orgx-primary-btn">
                    New Position
                  </Button>
                ) : undefined
              }
            />

          {/* Drawer */}
          <Drawer
            className="orgx-drawer"
            width={560}
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            closable={false}
            styles={{ header: { display: "none" }, footer: { padding: 0, border: "none" } }}
            footer={
              <div className="orgx-drawer__footer">
                <Button onClick={() => setIsDrawerOpen(false)} className="orgx-btn-ghost">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={handleSave}
                  className="orgx-btn-primary"
                >
                  {editingKey ? "Save Changes" : "Create Position"}
                </Button>
              </div>
            }
          >
            <button
              type="button"
              className="orgx-drawer__close"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close"
            >
              <X size={14} />
            </button>

            <div className="orgx-drawer__hero">
              <div className="orgx-drawer__hero-icon">
                <Trophy size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Position</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Position" : "New Position"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure a role with its grade and department classification.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={(changed) => {
                  if (changed.title !== undefined && !editingKey) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.title) });
                  }
                }}
              >
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Row gutter={12}>
                    <Col span={15}>
                      <Form.Item
                        name="title"
                        label="Position title"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="e.g. Senior Software Engineer" />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input placeholder="Auto-generated" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Building2 size={11} /> Classification
                  </div>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        name="gradeId"
                        label="Grade"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select grade"
                          loading={gradesLoading}
                          showSearch
                          optionFilterProp="label"
                          options={grades.map((g: any) => ({ value: g.key, label: g.name }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="departmentId"
                        label="Department"
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select department"
                          loading={departmentsLoading}
                          showSearch
                          optionFilterProp="label"
                          options={departments.map((d) => ({ value: d.id, label: d.name }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="subDepartmentId" label="Sub-department (optional)">
                    <Select
                      placeholder="Select sub-department"
                      loading={subDepartmentsLoading}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={subDepartments.map((sd) => ({ value: sd.id, label: sd.name }))}
                    />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Settings size={11} /> Operations
                  </div>
                  <div className="orgx-toggle-row">
                    <div className="orgx-toggle-row__text">
                      <div className="orgx-toggle-row__title">Active status</div>
                      <div className="orgx-toggle-row__sub">
                        Enable this position for recruitment and assignment.
                      </div>
                    </div>
                    <Form.Item name="status" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Role description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Define the core responsibilities…"
                      maxLength={240}
                      showCount
                    />
                  </Form.Item>
                </div>
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
