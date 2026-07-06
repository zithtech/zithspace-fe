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
  Popover,
} from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
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
  const [openCardId, setOpenCardId] = useState<string | null>(null);

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
            <ConfirmDialog
              title="Remove employment type?"
              description="This will permanently delete this employment type."
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
    { key: "total", label: "Total Types", value: totalTypes, icon: <Layers size={14} />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)" },
    { key: "active", label: "Active", value: activeTypes, icon: <ShieldCheck size={14} />, color: "#10b981", tint: "rgba(16,185,129,0.10)" },
    { key: "inactive", label: "Inactive", value: inactiveTypes, icon: <User size={14} />, color: "#64748b", tint: "rgba(100,116,139,0.10)" },
    { key: "coverage", label: "Coverage", value: `${totalTypes > 0 ? Math.round((activeTypes / totalTypes) * 100) : 0}%`, icon: <Briefcase size={14} />, color: "#6366f1", tint: "rgba(99,102,241,0.10)" },
  ];

  const etMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );

  const renderEmploymentTypeCard = (record: EmploymentType) => {
    const [c0, c1] = accentFor(record.code || record.name || "");
    const canAct = canUpdateOrgEmploymentType || canDeleteOrgEmploymentType;
    
    const actionContent = (
      <div className="ant-dropdown-menu" style={{ border: 'none', boxShadow: 'none' }}>
        {canUpdateOrgEmploymentType && (
          <div 
            className="ant-dropdown-menu-item" 
            onClick={(e) => { e.stopPropagation(); setOpenCardId(null); handleEdit(record); }}
          >
            {etMenuLabel("Edit type", "Modify name, code or status", <Edit size={14} />, "#3b82f6", "rgba(59,130,246,0.10)")}
          </div>
        )}
        {canDeleteOrgEmploymentType && (
          <ConfirmDialog
            title="Remove employment type?"
            description="This will permanently delete this employment type."
            confirmText="Delete"
            tone="danger"
            placement="bottomRight"
            onConfirm={async () => {
              await handleDelete(record.id);
              setOpenCardId(null);
            }}
          >
            <div className="ant-dropdown-menu-item ant-dropdown-menu-item-danger" onClick={(e) => e.stopPropagation()}>
              {etMenuLabel("Delete", "Permanently remove this type", <Trash2 size={14} />, "#ef4444", "rgba(239,68,68,0.10)")}
            </div>
          </ConfirmDialog>
        )}
      </div>
    );

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
          <Drawer
            className="orgx-drawer"
            width={520}
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
                  {editingKey ? "Save Changes" : "Create Type"}
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
                <Briefcase size={18} />
              </div>
              <div className="orgx-drawer__hero-text">
                <div className="orgx-drawer__hero-eyebrow">Employment Type</div>
                <div className="orgx-drawer__hero-title">
                  {editingKey ? "Edit Type" : "New Employment Type"}
                </div>
                <div className="orgx-drawer__hero-sub">
                  Configure a contract type used when onboarding members.
                </div>
              </div>
            </div>

            <div className="orgx-drawer__body">
              <Form form={form} layout="vertical" requiredMark={false}>
                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <TagIcon size={11} /> Identity
                  </div>
                  <Form.Item
                    name="typeName"
                    label="Type name"
                    rules={[{ required: true, message: "Please enter type name" }]}
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
                  >
                    <Input placeholder="e.g. FULL_TIME" />
                  </Form.Item>
                </div>

                <div className="orgx-section">
                  <div className="orgx-section__title">
                    <Settings size={11} /> Controls
                  </div>
                  <div className="orgx-toggle-row">
                    <div className="orgx-toggle-row__text">
                      <div className="orgx-toggle-row__title">Active status</div>
                      <div className="orgx-toggle-row__sub">
                        Allow using this type for new employee contracts.
                      </div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" initialValue={true} style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description (optional)">
                    <Input.TextArea
                      rows={3}
                      placeholder="Requirements or details for this employment category…"
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
