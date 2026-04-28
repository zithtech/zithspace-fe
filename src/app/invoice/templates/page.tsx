"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Button,
  Card,
  Tag,
  Empty,
  Skeleton,
  Input,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Divider,
  Dropdown,
  Modal,
  Table,
  Segmented,
  message,
  Badge
} from "antd";
import type { MenuProps } from "antd";
import {
  Plus,
  Settings,
  Edit3,
  Trash2,
  Search,
  FileText,
  Layers,
  LayoutGrid,
  List,
  MoreVertical,
  Copy,
  PlusCircle,
  LucideIcon,
  CheckCircle2,
  AlertCircle,
  Check,
  Star,
  CheckCircle,
  FileText as FileIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useInvoiceTemplates, useDeleteInvoiceTemplate } from "@/hooks/useInvoiceTemplates";
import InvoiceTemplateDrawer from "./InvoiceTemplateDrawer";
import { InvoiceTemplate } from "@/services/invoiceTemplateService";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

const { Title, Text } = Typography;

export default function InvoiceTemplatePage() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<InvoiceTemplate | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();

  const { data: templates, isLoading } = useInvoiceTemplates();
  const deleteMutation = useDeleteInvoiceTemplate();

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplateId(template.id);
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setSelectedTemplateId(undefined);
    setDrawerVisible(true);
  };

  const handleDelete = (template: InvoiceTemplate) => {
    setTemplateToDelete(template);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteMutation.mutateAsync(templateToDelete.id);
      messageApi.success("Template deleted successfully");
      setDeleteModalVisible(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error("Delete template error:", error);

      // Check if it's a foreign key constraint violation
      if (error?.code === '23001' || error?.message?.includes('foreign key constraint')) {
        messageApi.error(
          "Cannot delete template: This template is being used by existing invoices. Please delete or reassign those invoices first.",
          6
        );
      } else {
        messageApi.error(error?.message || "Failed to delete template");
      }
    }
  };

  const filteredTemplates = templates?.filter(t =>
    t.name.toLowerCase().includes(searchText.toLowerCase()) ||
    t.billingType.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalTemplates = filteredTemplates?.length || 0;
  const defaultTemplates = filteredTemplates?.filter(t => t.isDefault).length || 0;
  const activeTemplates = filteredTemplates?.filter(t => t.isActive).length || 0;
  const inactiveTemplates = filteredTemplates?.filter(t => !t.isActive).length || 0;

  const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: any, icon: any, color: string }) => (
    <Card
      styles={{ body: { padding: "12px 18px" } }}
      style={{
        borderRadius: 18,
        border: "1px solid var(--border-slate-100)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        height: "100%",
        background: "var(--customers-card-bg)",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 2 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{value}</div>
        </div>
        <div style={{
          color,
          background: `${color}15`,
          padding: 10,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 16px ${color}10`
        }}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  );

  // Table columns
  const columns = [
    {
      title: "TEMPLATE NAME",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: InvoiceTemplate) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
            <FileText size={16} />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {value}
              {record.isDefault && (
                <CheckCircle2 size={14} className="text-blue-500" />
              )}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{record.billingType}</div>
          </div>
        </div>
      ),
    },
    {
      title: "FIELDS",
      dataIndex: "fields",
      key: "fields",
      render: (_: any, record: InvoiceTemplate) => (
        <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Layers size={14} style={{ color: 'var(--text-slate-400)' }} />
          {record._count?.fields || 0} Custom Fields
        </div>
      ),
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      render: (value: string) => <Text style={{ color: "var(--text-secondary)" }}>{value || "—"}</Text>,
      ellipsis: true,
    },
    {
      title: "TYPE",
      dataIndex: "billingType",
      key: "billingType",
      render: (value: string) => (
        <Tag className="rounded-md border-none px-2 font-semibold" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)' }}>
          {value.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isDefault",
      key: "isDefault",
      render: (isDefault: boolean) => (
        isDefault ? (
          <Tag className="rounded-md border-none px-2 font-bold" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
            DEFAULT
          </Tag>
        ) : (
          <Tag className="rounded-md border-none px-2 font-medium" style={{ backgroundColor: 'var(--bg-slate-50)', color: 'var(--text-slate-400)' }}>
            ACTIVE
          </Tag>
        )
      ),
    },
    {
      title: "ACTION",
      key: "action",
      width: 80,
      render: (_: any, record: InvoiceTemplate) => {
        const menuItems: MenuProps['items'] = [
          {
            key: "edit",
            icon: <Edit3 size={14} />,
            label: "Edit Template",
            onClick: () => handleEdit(record),
          },
          {
            key: "copy",
            icon: <Copy size={14} />,
            label: "Duplicate",
            disabled: true
          },
          {
            type: 'divider'
          },
          {
            key: "delete",
            danger: true,
            icon: <Trash2 size={14} />,
            label: "Delete",
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreVertical size={18} style={{ color: 'var(--text-slate-400)' }} />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div style={{
        margin: "0 -24px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)"
      }}>
        <TimeTrackingHeader
          style={{ padding: '9.5px 32px' }}
          icon={<Layers size={20} color="#8b5cf6" />}
          title="Invoice Templates"
          description="Design and manage structures for professional invoices."
          extra={
            <div style={{ display: "flex", gap: 10, alignItems: 'center' }}>
              <Segmented
                disabled={isLoading}
                options={[
                  {
                    value: "card",
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px' }}>
                        <LayoutGrid size={14} />
                      </div>
                    )
                  },
                  {
                    value: "table",
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px' }}>
                        <List size={14} />
                      </div>
                    )
                  },
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as "card" | "table")}
                style={{ padding: 4, borderRadius: 10 }}
              />
              <Input
                placeholder="Search templates..."
                prefix={<Search size={16} className="text-slate-400 mr-2" />}
                allowClear
                size="middle"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260, borderRadius: 8, height: 38, backgroundColor: "var(--bg-slate-50)" }}
              />
              <Button
                type="primary"
                size="middle"
                icon={<Plus size={16} />}
                onClick={handleCreate}
                style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600, background: "var(--customers-header-icon-color)", border: "none" }}
              >
                Add Template
              </Button>
            </div>
          }
        />

        <div style={{ padding: "16px 32px 32px 32px" }}>

        {/* ================= STATS ================= */}
        <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Total Templates" value={isLoading ? "..." : totalTemplates} icon={Layers} color="var(--customers-header-icon-color)" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Active Templates" value={isLoading ? "..." : activeTemplates} icon={CheckCircle} color="#10b981" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Inactive Templates" value={isLoading ? "..." : inactiveTemplates} icon={AlertCircle} color="#f43f5e" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Primary Templates" value={isLoading ? "..." : defaultTemplates} icon={Star} color="#f59e0b" />
          </Col>
        </Row>



        {/* ================= CONTENT ================= */}
        {isLoading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4].map(i => (
              <Col xs={24} sm={12} md={8} lg={6} key={i}>
                <Card style={{ borderRadius: 20 }}>
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : !filteredTemplates || filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)' }}>
            <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <FileText size={32} style={{ color: 'var(--text-slate-400)' }} />
            </div>
            <Title level={4} style={{ color: "var(--text-secondary)" }}>{searchText ? "No results found" : "No templates here yet"}</Title>
            <Text style={{ color: "var(--text-slate-400)" }} className="mb-6">{searchText ? "Try a different search term" : "Create your first professional invoice template to get started."}</Text>
            {!searchText && (
              <Button type="primary" size="large" onClick={handleCreate} style={{ borderRadius: 12, height: 44 }}>
                Create Template
              </Button>
            )}
          </div>
        ) : viewMode === "card" ? (
          <Row gutter={[24, 24]}>
            {filteredTemplates.map((template) => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                <Card
                  className="template-card transition-all duration-300"
                  style={{
                    borderRadius: 20,
                    border: template.isDefault ? "1.5px solid var(--customers-header-icon-color)" : "1.5px solid var(--border-slate-100)",
                    height: '100%',
                    background: "linear-gradient(135deg, var(--bg-pure-white) 0%, var(--bg-slate-50) 100%)",
                    boxShadow: template.isDefault ? "0 8px 16px -4px var(--customers-header-icon-color)15, 0 0 0 1px var(--customers-header-icon-color)05" : "0 4px 6px -2px var(--border-slate-200)30",
                    cursor: 'pointer'
                  }}
                  styles={{ body: { padding: "24px", height: '100%', display: 'flex', flexDirection: 'column' } }}
                  onClick={() => router.push(`/invoice/newinvoice?templateId=${template.id}`)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div style={{ 
                      background: template.isDefault ? "var(--customers-header-icon-bg)" : "var(--bg-blue-50)", 
                      padding: 12, 
                      borderRadius: 16, 
                      color: template.isDefault ? "var(--customers-header-icon-color)" : "var(--text-sky-500)",
                      display: "flex",
                      boxShadow: template.isDefault ? "0 0 0 4px var(--customers-header-icon-color)10" : "0 0 0 4px var(--bg-blue-50)40",
                      position: 'relative'
                    }}>
                      <FileText size={22} strokeWidth={2.5} />
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "edit",
                            icon: <Edit3 size={14} />,
                            label: "Edit Template",
                            onClick: (e) => { e.domEvent.stopPropagation(); handleEdit(template); }
                          },
                          {
                            key: "delete",
                            danger: true,
                            icon: <Trash2 size={14} />,
                            label: "Delete",
                            onClick: (e) => { e.domEvent.stopPropagation(); handleDelete(template); }
                          },
                        ]
                      }}
                      trigger={["click"]}
                    >
                      <Button 
                        style={{ border: 'none', background: 'transparent' }} 
                        icon={<MoreVertical size={20} style={{ color: 'var(--text-slate-400)' }} />} 
                        onClick={(e) => e.stopPropagation()} 
                      />
                    </Dropdown>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Title level={5} style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)", fontSize: "16px", letterSpacing: '-0.02em' }}>{template.name}</Title>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ backgroundColor: "var(--bg-blue-50)", border: '1px solid var(--bg-blue-100)' }}>
                      <div className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--text-sky-500)' }} />
                      <Text style={{ color: "var(--text-sky-600)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {template.billingType}
                      </Text>
                    </div>
                  </div>

                  <div className="flex-1">
                    <Text className="line-clamp-2 text-sm leading-relaxed" style={{ display: 'block', minHeight: 40, color: 'var(--text-secondary)', fontWeight: 400 }}>
                      {template.description || "Professionally structured billing layout for efficient invoicing."}
                    </Text>
                  </div>

                  <Divider className="my-5" style={{ borderColor: "var(--border-slate-100)" }} />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Structure ({template._count?.fields || 0})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 opacity-80">
                      {template.fields?.length ? (
                        template.fields.slice(0, 3).map(f => (
                          <Tag key={f.id} className="rounded-md border-none px-2 font-bold m-0" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)', fontSize: 10 }}>
                            {f.fieldLabel}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary" italic className="text-[11px]">System default fields</Text>
                      )}
                      {(template.fields?.length || 0) > 3 && (
                        <Tag className="rounded-md border-none px-2 font-bold m-0" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)', fontSize: 10 }}>
                          +{(template.fields?.length || 0) - 3}
                        </Tag>
                      )}
                    </div>
                  </div>

                  {template.isDefault && (
                    <div className="mt-5 pt-1 border-t border-slate-50">
                      <Space size={4}>
                        <Check size={12} style={{ color: "var(--customers-header-icon-color)" }} strokeWidth={3} />
                        <span style={{ color: 'var(--customers-header-icon-color)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Primary Template
                        </span>
                      </Space>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                className="flex items-center justify-center border-dashed border-2 cursor-pointer hover:bg-slate-50/50 transition-all duration-300"
                style={{ borderRadius: 20, height: '100%', minHeight: 310, borderColor: 'var(--border-slate-200)', backgroundColor: 'var(--bg-slate-50/20)' }}
                onClick={handleCreate}
              >
                <div className="text-center">
                  <div className="size-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-blue-50/50)', color: 'var(--text-sky-400)' }}>
                    <PlusCircle size={28} strokeWidth={2} />
                  </div>
                  <Text strong style={{ color: 'var(--text-slate-400)', fontSize: 14 }}>Create Template</Text>
                  <div className="text-[10px] mt-1 opacity-50 text-slate-400">Design custom billing structure</div>
                </div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Card
            bordered={false}
            className="shadow-sm border overflow-hidden"
            style={{ borderRadius: 20, borderColor: 'var(--border-color)', backgroundColor: 'var(--customers-card-bg)' }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredTemplates}
              pagination={{
                pageSize: 10,
                style: { padding: "16px 24px" }
              }}
              className="templates-table"
              onRow={(record) => ({
                onClick: () => router.push(`/invoice/newinvoice?templateId=${record.id}`),
                className: 'cursor-pointer hover:bg-slate-50'
              })}
            />
          </Card>
        )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .template-card:hover { 
          border-color: var(--customers-header-icon-color) !important;
          box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.12) !important;
        }
        .templates-table .ant-table-thead > tr > th {
          background-color: var(--bg-table-header) !important;
          color: var(--text-secondary) !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 8px 16px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .templates-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .templates-table .ant-table-row:hover > td {
          background-color: var(--bg-blue-50) !important;
        }
        .ant-segmented { background: var(--bg-slate-100) !important; padding: 4px !important; border-radius: 12px !important; }
        .ant-segmented-item { border-radius: 9px !important; transition: all 0.3s !important; }
        .ant-segmented-item-selected { 
          background: white !important; 
          border-radius: 9px !important; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important; 
          color: var(--customers-header-icon-color) !important;
        }
      `}} />

      {/* Create/Edit Drawer */}
      <InvoiceTemplateDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        templateId={selectedTemplateId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTemplateToDelete(null);
        }}
        footer={null}
        width={440}
        centered
        closable={false}
        styles={{
          body: { padding: 0, overflow: 'hidden', borderRadius: '24px' },
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.6)' },
          content: { borderRadius: '24px', padding: 0, backgroundColor: 'var(--customers-modal-bg)' }
        }}
        className="overflow-hidden"
      >
        <div className="relative">
          {/* Decorative Background Header */}
          <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, var(--customers-delete-header-bg), var(--customers-modal-bg))' }}>
            {/* Icon Container */}
            <div className="w-20 h-20 rounded-[20px] flex items-center justify-center border relative z-10 bottom-[-24px]" style={{ backgroundColor: 'var(--customers-modal-bg)', borderColor: 'var(--customers-delete-icon-bg)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: 'var(--customers-delete-icon-bg)', color: 'var(--customers-delete-icon-color)', borderColor: 'var(--customers-delete-icon-bg)' }}>
                <Trash2 size={28} strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="px-8 pt-10 pb-8 text-center flex flex-col items-center">
            <h3 className="text-2xl font-extrabold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Delete Template permanently?
            </h3>

            <p className="text-[14px] leading-relaxed mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Are you absolutely sure? This action will permanently erase template, including:
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8 w-full">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><FileIcon size={14} style={{ color: 'var(--customers-header-icon-color)' }} /> Template Data</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Edit3 size={14} style={{ color: '#f59e0b' }} /> Layout Design</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Settings size={14} style={{ color: '#10b981' }} /> Configuration</span>
            </div>

            <div className="flex w-full gap-4">
              <Button
                size="large"
                className="flex-1 rounded-[16px] h-14 font-bold border-none transition-colors" style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setDeleteModalVisible(false);
                  setTemplateToDelete(null);
                }}
              >
                Keep Template
              </Button>
              <Button
                size="large"
                danger
                type="primary"
                loading={deleteMutation.isPending}
                className="flex-1 rounded-[16px] h-14 font-bold border-none shadow-sm transition-all" style={{ backgroundColor: '#ef4444' }}
                onClick={confirmDelete}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}