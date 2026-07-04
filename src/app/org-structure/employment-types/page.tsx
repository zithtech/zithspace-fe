"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Form,
  Switch,
  notification,
  Spin,
  Tooltip,
  Drawer,
  Popconfirm,
  App,
  Dropdown,
} from "antd";
import {
  Briefcase,
  Edit,
  Plus,
  Layers,
  ShieldCheck,
  User,
  X,
  Tag as TagIcon,
  Settings,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { EmploymentType } from "@/services/employmentTypeService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { OrgModuleScaffold, OrgStatDef, OrgView } from "@/components/org-structure/OrgModuleScaffold";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { drawerFormStyles as formStyles, SectionCard, SectionHeader } from "@/components/common/DrawerSection";



export default function EmploymentTypesPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureEmploymentTypes" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOrgEmploymentType,
    canCreateOrgEmploymentType,
    canUpdateOrgEmploymentType,
    canDeleteOrgEmploymentType,
    canReadActivityLog
  } = usePermission();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [view, setView] = useState<OrgView>("grid");
  const { modal } = App.useApp();

  const {
    employmentTypes,
    loading,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
  } = useEmploymentTypes();

  useEffect(() => {
    if (!authLoading && !canReadOrgEmploymentType) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOrgEmploymentType, router]);

  const totalTypes = employmentTypes.length;
  const activeTypes = employmentTypes.filter((t) => t.isActive).length;
  const inactiveTypes = totalTypes - activeTypes;

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

  const handleEdit = (record: EmploymentType) => {
    setEditingKey(record.id);
    form.setFieldsValue({ ...record, typeName: record.name });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteEmploymentType(id);
    if (success) {
      api.success({
        message: "Employment Type Removed",
        description: "The employment type has been successfully deleted.",
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
        name: formValues.typeName,
        description: formValues.description,
        isActive: formValues.isActive,
      };
      setSubmitting(true);
      const success = editingKey
        ? await updateEmploymentType(editingKey, payload)
        : await createEmploymentType(payload);
      if (success) {
        setIsDrawerOpen(false);
        api.success({
          message: `Employment Type ${editingKey ? "Updated" : "Added"}`,
          description: `Employment type "${formValues.typeName}" was successfully saved.`,
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

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return employmentTypes;
    const q = searchText.toLowerCase();
    return employmentTypes.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q),
    );
  }, [employmentTypes, searchText]);

  if (authLoading) {
    return (
      <div className="orgx-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Loading Employment Types..." />
      </div>
    );
  }

  if (!canReadOrgEmploymentType) return null;

  const columns = [
    {
      title: "Employment Type",
      key: "identity",
      width: 250,
      render: (_: any, record: EmploymentType) => (
        <div className="orgx-row-name">
          <div className="orgx-row-name__avatar">{record.code?.substring(0, 2) || "ET"}</div>
          <div className="orgx-row-name__text">
            <div className="orgx-row-name__title">{record.name}</div>
            <span className="orgx-row-name__code">{record.code}</span>
          </div>
        </div>
      ),
    },
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
      render: (_: any, record: EmploymentType) => (
        <div className="orgx-row-actions">
          {canUpdateOrgEmploymentType && (
            <Tooltip title="Edit Type">
              <Button type="text" size="small" icon={<Edit size={15} />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canDeleteOrgEmploymentType && (
            <Popconfirm
              title="Remove employment type?"
              description="This will permanently delete this employment type."
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
    { key: "total", label: "Total Types", value: totalTypes, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active", value: activeTypes, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "inactive", label: "Inactive", value: inactiveTypes, icon: <User size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
    { key: "coverage", label: "Coverage", value: `${totalTypes > 0 ? Math.round((activeTypes / totalTypes) * 100) : 0}%`, icon: <Briefcase size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
  ];

  const renderEmploymentTypeCard = (record: EmploymentType) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const canAct = canUpdateOrgEmploymentType || canDeleteOrgEmploymentType;
    const menu = {
      items: [
        ...(canUpdateOrgEmploymentType ? [{ key: "edit", label: "Edit type", icon: <Edit size={14} /> }] : []),
        ...(canDeleteOrgEmploymentType ? [{ key: "delete", danger: true, label: "Delete", icon: <Trash2 size={14} /> }] : []),
      ],
      onClick: ({ key, domEvent }: any) => {
        domEvent?.stopPropagation?.();
        if (key === "edit") handleEdit(record);
        else if (key === "delete") {
          modal.confirm({
            title: "Remove employment type?",
            content: "This will permanently delete this employment type.",
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
            {record.code?.substring(0, 2) || "ET"}
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
          <span className="omx-card-foot-key">{record.code}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="orgx-shell">
        <TimeTrackingHeader
            icon={<Briefcase size={20} color="#3b82f6" />}
            title="Employment Types"
            description="Define and manage workforce contract types and employment structures."
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
                {canCreateOrgEmploymentType && (
                  <Button
                    type="primary"
                    icon={<Plus size={15} />}
                    onClick={handleAdd}
                    className="orgx-primary-btn"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    New Type
                  </Button>
                )}
              </div>
            }
          />

          <OrgModuleScaffold<EmploymentType>
            search={searchText}
            onSearchChange={setSearchText}
            searchPlaceholder="Search by name, code, or description…"
            meta={<><strong>{filteredData.length}</strong> of {totalTypes} employment types</>}
            view={view}
            onViewChange={setView}
            loading={loading}
            stats={stats}
            columns={columns}
            data={filteredData}
            rowKey="id"
            renderCard={renderEmploymentTypeCard}
            emptyTitle="No employment types found"
            emptySubtitle="Define your first contract type to onboard members."
            emptyAction={
              canCreateOrgEmploymentType ? (
                <Button type="primary" icon={<Plus size={15} />} onClick={handleAdd} className="orgx-primary-btn">
                  New Employment Type
                </Button>
              ) : undefined
            }
          />

          {/* Create / Edit Drawer */}
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
                  {editingKey ? "Save Changes" : "Create Type"}
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
                  {editingKey ? <Edit size={18} /> : <Briefcase size={18} />}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {editingKey ? "Edit Type" : "New Employment Type"}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Configure a contract type used when onboarding members.
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
                  subtitle="Naming and identifier"
                  step="STEP 1"
                >
                  <Form.Item
                    name="typeName"
                    label="Type name"
                    rules={[{ required: true, message: "Please enter type name" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input
                      placeholder="e.g. Full-Time Regular"
                      onChange={(e) => {
                        if (!editingKey) {
                          form.setFieldsValue({ code: generateCodeFromName(e.target.value) });
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 14 }}
                  >
                    <Input placeholder="e.g. FULL_TIME" />
                  </Form.Item>
                </SectionCard>

                <SectionCard
                  icon={<Settings />}
                  title="Controls"
                  subtitle="Active status and details"
                  step="STEP 2"
                >
                  <Form.Item 
                    name="isActive" 
                    valuePropName="checked" 
                    initialValue={true} 
                    label="Active status" 
                    tooltip="Allow using this type for new employee contracts."
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
                      placeholder="Requirements or details for this employment category…"
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
