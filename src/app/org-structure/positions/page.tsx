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
  Popconfirm,
  App,
  Dropdown,
} from "antd";
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
import { drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";



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
  const { modal } = App.useApp();

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
            <Popconfirm
              title="Remove position?"
              description="This will permanently delete this role."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
              </Tooltip>
            </Popconfirm>
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

  const renderPositionCard = (record: PositionViewData) => {
    const [c0, c1] = accentFor(record.code || record.title || "");
    const avatar = (record.code?.substring(0, 2) || record.title?.substring(0, 2) || "PS").toUpperCase();
    const canAct = canUpdateOrgPosition || canDeleteOrgPosition;
    const context = [record.departmentName, record.subDepartmentName].filter(Boolean).join(" › ");
    const menu = {
      items: [
        ...(canUpdateOrgPosition ? [{ key: "edit", label: "Edit position", icon: <Edit size={14} /> }] : []),
        ...(canDeleteOrgPosition ? [{ key: "delete", danger: true, label: "Delete", icon: <Trash2 size={14} /> }] : []),
      ],
      onClick: ({ key, domEvent }: any) => {
        domEvent?.stopPropagation?.();
        if (key === "edit") handleEdit(record);
        else if (key === "delete") {
          modal.confirm({
            title: "Remove position?",
            content: "This will permanently delete this role.",
            okText: "Delete",
            cancelText: "Cancel",
            okButtonProps: { danger: true },
            onOk: () => handleDelete(record.id),
          });
        }
      },
    };
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
            <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
              <button type="button" className="omx-card-actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal size={16} />
              </button>
            </Dropdown>
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
                  {editingKey ? "Save Changes" : "Create Position"}
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
                  {editingKey ? <Edit size={18} /> : <Trophy size={18} />}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {editingKey ? "Edit Position" : "New Position"}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Configure a role with its grade and department classification.
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
                onValuesChange={(changed) => {
                  if (changed.title !== undefined && !editingKey) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.title) });
                  }
                }}
              >
                <SectionCard
                  icon={<TagIcon />}
                  title="Identity"
                  subtitle="Naming and identifier"
                  step="STEP 1"
                >
                  <Form.Item
                    name="title"
                    label="Position title"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. Senior Software Engineer" />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="Auto-generated" />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<Building2 />}
                  title="Classification"
                  subtitle="Grade and department"
                  step="STEP 2"
                >
                  <Form.Item
                    name="gradeId"
                    label="Grade"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Select
                      placeholder="Select grade"
                      loading={gradesLoading}
                      showSearch
                      optionFilterProp="label"
                      options={grades.map((g: any) => ({ value: g.key, label: g.name }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="departmentId"
                    label="Department"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Select
                      placeholder="Select department"
                      loading={departmentsLoading}
                      showSearch
                      optionFilterProp="label"
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    />
                  </Form.Item>
                  <Form.Item 
                    name="subDepartmentId" 
                    label="Sub-department"
                    style={{ marginBottom: 14 }}
                  >
                    <Select
                      placeholder="Select sub-department (optional)"
                      loading={subDepartmentsLoading}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={subDepartments.map((sd) => ({ value: sd.id, label: sd.name }))}
                    />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<Settings />}
                  title="Operations"
                  subtitle="Status and description"
                  step="STEP 3"
                >
                  <Form.Item 
                    name="status" 
                    valuePropName="checked" 
                    initialValue={true} 
                    label="Active status" 
                    tooltip="Enable this position for recruitment and assignment."
                    style={{ marginBottom: 14 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item 
                    name="description" 
                    label="Role description (optional)"
                    style={{ marginBottom: 14 }}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Define the core responsibilities…"
                      maxLength={240}
                      showCount
                    />
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
    </>
  );
}
