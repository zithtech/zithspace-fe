"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  Select,
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
  GitBranch,
  Edit,
  Plus,
  Layers,
  ShieldCheck,
  User,
  X,
  Tag as TagIcon,
  Settings,
  Building2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgModuleScaffold, OrgStatDef, OrgView } from "@/components/org-structure/OrgModuleScaffold";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";



export default function SubDepartmentsPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureSubDepartments" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg, canReadActivityLog } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const { modal } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [view, setView] = useState<OrgView>("grid");

  const { departments, loading: departmentsLoading } = useDepartments();
  const {
    subDepartments,
    loading: subDepartmentsLoading,
    fetchSubDepartments,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment,
  } = useSubDepartments();

  const filteredData = useMemo(() => {
    return subDepartments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesDepartment =
        !departmentFilter || item.parentDepartmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [subDepartments, searchText, statusFilter, departmentFilter]);

  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrg, router]);

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Loading Sub-Departments..." />
      </div>
    );
  }

  if (!canReadOrg) return null;

  const totalSubDepartments = subDepartments.length;
  const activeSubDepartments = subDepartments.filter((d) => d.isActive).length;
  const inactiveSubDepartments = totalSubDepartments - activeSubDepartments;
  const uniqueParents = new Set(subDepartments.map((s) => s.parentDepartmentId).filter(Boolean));

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSubDepartment(id);
    if (success) {
      api.success({
        message: "Sub-Department Removed",
        description: "The sub-department has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
      fetchSubDepartments();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const success = editingId
        ? await updateSubDepartment(editingId, values)
        : await createSubDepartment(values);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Sub-Department ${editingId ? "Updated" : "Created"}`,
          description: `The sub-department "${values.name}" has been successfully saved.`,
          placement: "topRight",
          duration: 2,
        });
        fetchSubDepartments();
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Sub-Department",
      key: "identity",
      width: 250,
      render: (_: any, record: any) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "SD"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Parent Department",
      dataIndex: "parentDepartmentId",
      key: "parentDepartmentId",
      width: 200,
      render: (parentDepartmentId: string, record: any) => {
        const deptName =
          record.parentDepartment?.name ||
          departments.find((d) => d.id === parentDepartmentId)?.name;
        return (
          <span className={`orgx-row-soft-tag${!deptName ? " is-muted" : ""}`}>
            {deptName || "Not assigned"}
          </span>
        );
      },
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
      render: (_: any, record: any) => (
        <div className="orgx-row-actions">
          {canManageOrg && (
            <>
              <Tooltip title="Edit Sub-Department">
                <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
              </Tooltip>
              <Popconfirm
                title="Remove sub-department?"
                description="This will permanently delete this sub-department."
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete">
                  <Button type="text" size="small" danger icon={<Trash2 size={15} />} />
                </Tooltip>
              </Popconfirm>
            </>
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
    { key: "total", label: "Total Sub-Departments", value: totalSubDepartments, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active", value: activeSubDepartments, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "inactive", label: "Inactive", value: inactiveSubDepartments, icon: <User size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
    { key: "parents", label: "Parent Coverage", value: uniqueParents.size, icon: <Building2 size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
  ];

  const renderSubDepartmentCard = (record: any) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const deptName =
      record.parentDepartment?.name ||
      departments.find((d) => d.id === record.parentDepartmentId)?.name;
    const menu = {
      items: [
        ...(canManageOrg
          ? [
              { key: "edit", label: "Edit sub-department", icon: <Edit size={14} /> },
              { key: "delete", danger: true, label: "Delete", icon: <Trash2 size={14} /> },
            ]
          : []),
      ],
      onClick: ({ key, domEvent }: any) => {
        domEvent?.stopPropagation?.();
        if (key === "edit") handleEdit(record);
        else if (key === "delete") {
          modal.confirm({
            title: "Remove sub-department?",
            content: "This will permanently delete this sub-department.",
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
            {record.code?.substring(0, 2) || "SD"}
          </div>
          <div className="omx-card-id">
            <div className="omx-card-title">{record.name}</div>
            <div className="omx-card-sub">{record.code}</div>
          </div>
          {canManageOrg && (
            <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
              <button type="button" className="omx-card-actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal size={16} />
              </button>
            </Dropdown>
          )}
        </div>
        <div className="omx-card-desc">{record.description || "No description provided"}</div>
        <div className="omx-card-foot">
          <span className={`omx-pill ${record.isActive ? "is-active" : "is-inactive"}`}>
            <span className="omx-pill-dot" />
            {record.isActive ? "Active" : "Inactive"}
          </span>
          <span className="omx-chip">
            <span className="omx-chip-dot" />
            {deptName || "Not assigned"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="orgx-shell">
        <TimeTrackingHeader
            icon={<GitBranch size={20} color="#3b82f6" />}
            title="Sub-Departments"
            description="Define specialized organizational branches and nested business units."
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
                {canManageOrg && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Sub-Department
                  </Button>
                )}
              </div>
            }
          />

          <OrgModuleScaffold<any>
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search by name, code, or description…"
            meta={<><strong>{filteredData.length}</strong> of {totalSubDepartments} sub-departments</>}
            view={view}
            onViewChange={setView}
            onRefresh={fetchSubDepartments}
            loading={subDepartmentsLoading}
            stats={stats}
            columns={columns}
            data={filteredData}
            rowKey="id"
            renderCard={renderSubDepartmentCard}
            emptyTitle="No sub-departments found"
            emptySubtitle="Create your first sub-department to organize nested business units."
            emptyAction={
              canManageOrg ? (
                <Button type="primary" icon={<Plus size={15} />} onClick={handleAdd} className="orgx-primary-btn">
                  New Sub-Department
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
                  icon={editingId ? <Edit size={14} /> : <Plus size={14} />}
                >
                  {editingId ? "Save Changes" : "Create Sub-Department"}
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
                  {editingId ? <Edit size={18} /> : <GitBranch size={18} />}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {editingId ? "Edit Sub-Department" : "New Sub-Department"}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Configure a specialized branch within a parent department.
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
                  if (changed.name !== undefined && !editingId) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.name) });
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
                    name="name"
                    label="Sub-Department name"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. Talent Acquisition" />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="Auto-generated from name" />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<Building2 />}
                  title="Parent Context"
                  subtitle="Parent department selection"
                  step="STEP 2"
                >
                  <Form.Item
                    name="parentDepartmentId"
                    label="Parent department"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Select
                      placeholder="Select parent department"
                      loading={departmentsLoading}
                      showSearch
                      optionFilterProp="label"
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
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
                    name="isActive" 
                    valuePropName="checked" 
                    initialValue={true} 
                    label="Active status" 
                    tooltip="Enable or disable this organizational branch."
                    style={{ marginBottom: 14 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item 
                    name="description" 
                    label="Description (optional)"
                    style={{ marginBottom: 14 }}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Define the core responsibilities of this unit…"
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
