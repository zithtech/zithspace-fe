"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  Select,
  App,
  Tooltip,
  Switch,
  Drawer,
  Popover,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  Building2,
  Edit,
  Plus,
  Layers,
  ShieldCheck,
  User,
  X,
  Tag as TagIcon,
  Settings,
  Users as UsersIcon,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { MembersService } from "@/services/membersService";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/services/departmentService";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgModuleScaffold, OrgStatDef, OrgView } from "@/components/org-structure/OrgModuleScaffold";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";



export default function DepartmentsPage() {
  useActivitySource({ section: "ADMIN", module: "OrgStructure", page: "OrgStructureDepartments" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOrgDepartment,
    canCreateOrgDepartment,
    canUpdateOrgDepartment,
    canDeleteOrgDepartment,
    canReadActivityLog
  } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [view, setView] = useState<OrgView>("grid");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  const { employmentTypes, loading: employmentTypesLoading } = useEmploymentTypes();
  const { allDepartments, paginatedDepartments, totalCount, loading, createDepartment, updateDepartment, deleteDepartment, refresh } = useDepartments({
    page: pagination.current,
    limit: pagination.pageSize,
    search: searchText,
  });
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!authLoading && !canReadOrgDepartment) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgDepartment, router]);

  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [searchText, statusFilter]);

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ZukvoLoader size="lg" message="Loading Departments..." />
      </div>
    );
  }

  if (!canReadOrgDepartment) return null;

  const totalDepartments = allDepartments.length;
  const activeDepartments = allDepartments.filter((d) => d.isActive).length;
  const inactiveDepartments = totalDepartments - activeDepartments;
  const withLeader = allDepartments.filter((d: any) => d.head?.name || d.headId).length;
  const withoutLeader = totalDepartments - withLeader;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") return "";
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: Department) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record, departmentName: record.name });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteDepartment(id);
    if (success) {
      message.success("Department Removed");
    }
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.departmentName,
        employmentType: formValues.employmentType,
        headId: formValues.headId,
        description: formValues.description,
        isActive: formValues.isActive,
      };
      setSubmitting(true);
      const success = editingKey
        ? await updateDepartment(editingKey, payload)
        : await createDepartment(payload);
      if (success) {
        setIsDrawerOpen(false);
        message.success(`Department ${editingKey ? "Updated" : "Added"}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Department",
      key: "identity",
      width: 250,
      render: (_: any, record: Department) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "DP"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Employment Type",
      dataIndex: "employmentType",
      key: "employmentType",
      width: 180,
      render: (type: string) => (
        <span className={`orgx-row-soft-tag${!type ? " is-muted" : ""}`}>{type || "Not assigned"}</span>
      ),
    },
    {
      title: "Department Head",
      dataIndex: "head",
      key: "head",
      width: 220,
      render: (head: any) => (
        <div className="orgx-row-leader">
          {head?.name ? (
            <>
              <div className="orgx-row-leader__avatar">{head.name.charAt(0).toUpperCase()}</div>
              <span className="orgx-row-leader__name">{head.name}</span>
            </>
          ) : (
            <span className="orgx-row-leader__name is-muted">No head assigned</span>
          )}
        </div>
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
      render: (_: any, record: Department) => (
        <div className="orgx-row-actions">
          {canUpdateOrgDepartment && (
            <Tooltip title="Edit Department">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgDepartment && (
            <ConfirmDialog
              title="Remove department?"
              description="This will permanently delete this department."
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
    { key: "total", label: "Total Departments", value: totalDepartments, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active", value: activeDepartments, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "leader", label: "With Leader", value: withLeader, icon: <UsersIcon size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
    { key: "inactive", label: "Inactive", value: inactiveDepartments, icon: <User size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
  ];

  const deptMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const renderDepartmentCard = (record: Department) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const canAct = canUpdateOrgDepartment || canDeleteOrgDepartment;
    const head = (record as any).head;
    
    const actionContent = (
      <div className="ant-dropdown-menu" style={{ border: 'none', boxShadow: 'none' }}>
        {canUpdateOrgDepartment && (
          <div 
            className="ant-dropdown-menu-item" 
            onClick={(e) => { e.stopPropagation(); setOpenCardId(null); handleEdit(record); }}
          >
            {deptMenuLabel("Edit department", "Modify name, code or status", <Edit size={14} />, "#3b82f6", "rgba(59,130,246,0.10)")}
          </div>
        )}
        {canDeleteOrgDepartment && (
          <ConfirmDialog
            title="Remove department?"
            description="This will permanently delete this department."
            confirmText="Delete"
            tone="danger"
            placement="bottomRight"
            onConfirm={async () => {
              await handleDelete(record.id);
              setOpenCardId(null);
            }}
          >
            <div className="ant-dropdown-menu-item ant-dropdown-menu-item-danger" onClick={(e) => e.stopPropagation()}>
              {deptMenuLabel("Delete", "Permanently remove this department", <Trash2 size={14} />, "#ef4444", "rgba(239,68,68,0.10)")}
            </div>
          </ConfirmDialog>
        )}
      </div>
    );

    return (
      <div className="omx-card">
        <div className="omx-card-top">
          <div className="omx-card-avatar" style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)` }}>
            {record.code?.substring(0, 2) || "DP"}
          </div>
          <div className="omx-card-id">
            <div className="omx-card-title">{record.name}</div>
            <div className="omx-card-sub">{record.code}</div>
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
        <div className="omx-card-desc">{record.description || "No description provided"}</div>
        <div className="omx-card-foot">
          <span className={`omx-pill ${record.isActive ? "is-active" : "is-inactive"}`}>
            <span className="omx-pill-dot" />
            {record.isActive ? "Active" : "Inactive"}
          </span>
          <span className="omx-chip">
            <span className="omx-chip-dot" />
            {head?.name || record.employmentType || "Unassigned"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      
      <div className="orgx-shell">
        <TimeTrackingHeader
            icon={<Building2 size={20} color="#3b82f6" />}
            title="Departments"
            description="Manage organizational units, reporting lines, and strategic divisions."
            onRefresh={refresh}
            refreshing={loading}
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
                {canCreateOrgDepartment && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Department
                  </Button>
                )}
              </div>
            }
          />

          <OrgModuleScaffold<Department>
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search by name, code, or employment type..."
            meta={<><strong>{paginatedDepartments.length}</strong> of {totalCount} departments</>}
            view={view}
            onViewChange={setView}
            loading={loading}
            stats={stats}
            columns={columns}
            data={paginatedDepartments}
            rowKey="id"
            serverPagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: totalCount,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize })
            }}
            renderCard={renderDepartmentCard}
            emptyTitle="No departments found"
            emptySubtitle="Create your first department to organize your teams and reporting lines."
            emptyAction={
              canCreateOrgDepartment ? (
                <Button type="primary" icon={<Plus size={15} />} onClick={handleAdd} className="orgx-primary-btn">
                  New Department
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
                  {editingKey ? "Save Changes" : "Create Department"}
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
                  {editingKey ? <Edit size={18} /> : <Building2 size={18} />}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {editingKey ? "Edit Department" : "New Department"}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Configure an organizational unit, its leader and employment context.
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
                onValuesChange={(changed, values) => {
                  if (changed.departmentName !== undefined && !editingKey) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.departmentName) });
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
                    name="departmentName"
                    label="Department name"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. Research & Development" />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. RD_DEPT" />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<UsersIcon />}
                  title="Leadership & Context"
                  subtitle="Department head and employment setting"
                  step="STEP 2"
                >
                  <Form.Item 
                    name="employmentType" 
                    label="Employment context"
                    style={{ marginBottom: 14 }}
                  >
                    <SearchableDropdown
                      placeholder="Select employment type"
                      options={employmentTypes
                        .filter((et) => et.isActive)
                        .map((t) => ({ value: t.name, label: t.name }))}
                    />
                  </Form.Item>
                  <Form.Item 
                    name="headId" 
                    label="Department head"
                    style={{ marginBottom: 14 }}
                  >
                    <SearchableDropdown
                      placeholder="Select leader"
                      options={members.map((m) => ({ value: m.value, label: m.label, avatarUrl: m.avatarUrl }))}
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
                    tooltip="Allow units and positions within this department."
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
                      placeholder="Define strategic objectives…"
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
