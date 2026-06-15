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
  Dropdown,
  App,
} from "antd";
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

export default function DepartmentsPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureDepartments" });
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
  const [api, contextHolder] = notification.useNotification();
  const { modal } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [view, setView] = useState<OrgView>("grid");

  const { employmentTypes, loading: employmentTypesLoading } = useEmploymentTypes();
  const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
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

  const filteredData = useMemo(() => {
    return departments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.employmentType || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchText, statusFilter]);

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Loading Departments..." />
      </div>
    );
  }

  if (!canReadOrgDepartment) return null;

  const totalDepartments = departments.length;
  const activeDepartments = departments.filter((d) => d.isActive).length;
  const inactiveDepartments = totalDepartments - activeDepartments;
  const withLeader = departments.filter((d: any) => d.head?.name || d.headId).length;
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
      api.success({
        message: "Department Removed",
        description: "The department has been successfully deleted.",
        placement: "topRight",
        duration: 2,
      });
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
        api.success({
          message: `Department ${editingKey ? "Updated" : "Added"}`,
          description: `The department "${payload.name}" has been successfully saved.`,
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
            <Popconfirm
              title="Remove department?"
              description="This will permanently delete this department."
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

  const renderDepartmentCard = (record: Department) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const canAct = canUpdateOrgDepartment || canDeleteOrgDepartment;
    const head = (record as any).head;
    const menu = {
      items: [
        ...(canUpdateOrgDepartment ? [{ key: "edit", label: "Edit department", icon: <Edit size={14} /> }] : []),
        ...(canDeleteOrgDepartment ? [{ key: "delete", danger: true, label: "Delete", icon: <Trash2 size={14} /> }] : []),
      ],
      onClick: ({ key, domEvent }: any) => {
        domEvent?.stopPropagation?.();
        if (key === "edit") handleEdit(record);
        else if (key === "delete") {
          modal.confirm({
            title: "Remove department?",
            content: "This will permanently delete this department.",
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
            {record.code?.substring(0, 2) || "DP"}
          </div>
          <div className="omx-card-id">
            <div className="omx-card-title">{record.name}</div>
            <div className="omx-card-sub">{record.code}</div>
          </div>
          {canAct && (
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
            {head?.name || record.employmentType || "Unassigned"}
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
            icon={<Building2 size={20} color="#3b82f6" />}
            title="Departments"
            description="Manage organizational units, reporting lines, and strategic divisions."
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
            searchPlaceholder="Search by name, code, or employment type…"
            meta={<><strong>{filteredData.length}</strong> of {totalDepartments} departments</>}
            view={view}
            onViewChange={setView}
            loading={loading}
            stats={stats}
            columns={columns}
            data={filteredData}
            rowKey="id"
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

          {/* Drawer */}
          <Drawer
            className="orgx-drawer"
            width={540}
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
                  {editingKey ? "Save Changes" : "Create Department"}
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
                <Building2 size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Department</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Department" : "New Department"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure an organizational unit, its leader and employment context.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={(changed) => {
                  if (changed.departmentName !== undefined && !editingKey) {
                    form.setFieldsValue({ code: generateCodeFromName(changed.departmentName) });
                  }
                }}
              >
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Form.Item
                    name="departmentName"
                    label="Department name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. Research & Development" />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. RD_DEPT" />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <UsersIcon size={11} /> Leadership & Context
                  </div>
                  <Form.Item name="employmentType" label="Employment context">
                    <Select
                      placeholder="Select employment type"
                      loading={employmentTypesLoading}
                      allowClear
                      options={employmentTypes
                        .filter((et) => et.isActive)
                        .map((t) => ({ value: t.name, label: t.name }))}
                    />
                  </Form.Item>
                  <Form.Item name="headId" label="Department head">
                    <Select
                      placeholder="Select leader"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={members.map((m) => ({ value: m.value, label: m.label }))}
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
                        Allow units and positions within this department.
                      </div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Define strategic objectives…"
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
    </>
  );
}
