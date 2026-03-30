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
  message
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
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useInvoiceTemplates, useDeleteInvoiceTemplate } from "@/hooks/useInvoiceTemplates";
import InvoiceTemplateDrawer from "./InvoiceTemplateDrawer";
import { InvoiceTemplate } from "@/services/invoiceTemplateService";

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
      messageApi.error(error.message || "Failed to delete template");
    }
  };

  const filteredTemplates = templates?.filter(t => 
    t.name.toLowerCase().includes(searchText.toLowerCase()) ||
    t.billingType.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalTemplates = filteredTemplates?.length || 0;
  const defaultTemplates = filteredTemplates?.filter(t => t.isDefault).length || 0;

  const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: any, icon: LucideIcon, color: string }) => (
    <Card 
      styles={{ body: { padding: "12px 16px" } }} 
      style={{ 
        borderRadius: 16, 
        border: "1px solid #f1f5f9", 
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ 
          color, 
          background: `${color}12`, 
          padding: 12, 
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={24} />
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500 text-xs font-bold shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              {value}
              {record.isDefault && (
                <CheckCircle2 size={14} className="text-blue-500" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{record.billingType}</div>
          </div>
        </div>
      ),
    },
    {
      title: "FIELDS",
      dataIndex: "fields",
      key: "fields",
      render: (_: any, record: InvoiceTemplate) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <Layers size={14} className="text-slate-400" />
          {record._count?.fields || 0} Custom Fields
        </div>
      ),
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      render: (value: string) => <Text style={{ color: "#64748b" }}>{value || "—"}</Text>,
      ellipsis: true,
    },
    {
      title: "TYPE",
      dataIndex: "billingType",
      key: "billingType",
      render: (value: string) => (
        <Tag className="rounded-md border-none px-2 font-semibold bg-slate-100 text-slate-600">
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
          <Tag className="rounded-md border-none px-2 font-bold bg-blue-50 text-blue-600">
            DEFAULT
          </Tag>
        ) : (
          <Tag className="rounded-md border-none px-2 font-medium bg-slate-50 text-slate-400">
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
            <Button type="text" icon={<MoreVertical size={18} className="text-slate-400" />} />
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
          padding: "24px 32px",
          background: "#ffffff",
          minHeight: "calc(100vh - 64px)"
      }}>
        {/* ================= HEADER ================= */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Space size={14} align="center">
              <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 14, color: "#334155", display: "flex" }}>
                <Layers size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Invoice Templates</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Design and manage structures for your professional invoices.</Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: 'center' }}>
            <Segmented
              disabled={isLoading}
              options={[
                { 
                  value: "card", 
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
                      <LayoutGrid size={16} />
                    </div>
                  ) 
                },
                { 
                  value: "table", 
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px' }}>
                      <List size={16} />
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
              prefix={<Search size={16} className="text-slate-400 mr-1" />}
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280, borderRadius: 12, height: 44 }}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={handleCreate}
              style={{ borderRadius: 12, height: 44, padding: "0 24px", fontWeight: 600, background: "#2563eb", border: "none" }}
            >
              Add Template
            </Button>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Total Templates" value={isLoading ? "..." : totalTemplates} icon={FileText} color="#3b82f6" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Default Templates" value={isLoading ? "..." : defaultTemplates} icon={CheckCircle2} color="#10b981" />
          </Col>
        </Row>

        <Divider style={{ marginTop: "0", borderTop: "1px solid #f1f5f9" }} />

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
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <FileText size={32} className="text-slate-200" />
             </div>
             <Title level={4} style={{ color: "#64748b" }}>{searchText ? "No results found" : "No templates here yet"}</Title>
             <Text style={{ color: "#94a3b8" }} className="mb-6">{searchText ? "Try a different search term" : "Create your first professional invoice template to get started."}</Text>
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
                  hoverable 
                  className="shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden" 
                  style={{ 
                    borderRadius: 20,
                    border: template.isDefault ? "2px solid #3b82f6" : "1px solid #f1f5f9",
                    height: '100%'
                  }}
                  bodyStyle={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
                  onClick={() => router.push(`/invoice/newinvoice?templateId=${template.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div style={{ background: template.isDefault ? "#eff6ff" : "#f8fafc", padding: 12, borderRadius: 14, color: template.isDefault ? "#3b82f6" : "#64748b", display: "flex" }}>
                       <FileText size={20} />
                    </div>
                    <Dropdown
                      menu={{ 
                        items: [
                          {
                            key: "edit",
                            icon: <Edit3 size={14} />,
                            label: "Edit",
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
                      <Button style={{ border: 'none', background: 'transparent' }} icon={<MoreVertical size={18} className="text-slate-400" />} onClick={(e) => e.stopPropagation()} />
                    </Dropdown>
                  </div>

                  <div className="mb-2">
                    <Title level={5} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{template.name}</Title>
                    <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em" }}>{template.billingType}</Text>
                  </div>

                  <div className="flex-1">
                    <Text className="line-clamp-2 text-slate-500 text-sm italic" style={{ display: 'block', height: 40 }}>
                      {template.description || "Design your ideal billing structure."}
                    </Text>
                  </div>

                  <Divider className="my-3" style={{ borderColor: "#f1f5f9" }} />

                  <div>
                     <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-400 uppercase">
                        <span>Fields ({template._count?.fields || 0})</span>
                        <Tooltip title="View fields">
                           <Layers size={14} />
                        </Tooltip>
                     </div>
                      <div className="flex flex-wrap gap-2">
                        {template.fields?.length ? (
                          template.fields.map(f => (
                            <Tag key={f.id} className="rounded-md border-none px-2 font-medium bg-slate-50 text-slate-600 m-0">
                              {f.fieldLabel}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary" italic className="text-[11px]">Basic billing fields</Text>
                        )}
                      </div>
                  </div>

                  {template.isDefault && (
                    <div className="mt-4">
                       <Tag className="rounded-full bg-blue-600 border-none px-3 py-0.5 text-white font-bold text-[10px]">
                          PRIMARY TEMPLATE
                       </Tag>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
            <Col xs={24} sm={12} md={8} lg={6}>
               <Card 
                  className="flex items-center justify-center bg-slate-50 border-dashed border-2 border-slate-200 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition-all duration-300"
                  style={{ borderRadius: 20, height: '100%', minHeight: 280 }}
                  onClick={handleCreate}
               >
                  <div className="text-center">
                     <div className="size-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <PlusCircle size={24} />
                     </div>
                     <Text strong className="text-slate-500">Add New Template</Text>
                  </div>
               </Card>
            </Col>
          </Row>
        ) : (
          <Card 
            bordered={false} 
            className="shadow-sm border border-slate-100 overflow-hidden" 
            style={{ borderRadius: 20 }}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .templates-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 8px 16px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .templates-table .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .ant-segmented { background: #f1f5f9 !important; }
        .ant-segmented-item-selected { background: #fff !important; border-radius: 9px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important; }
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
        title={
          <div className="flex items-center gap-2 text-red-600">
             <AlertCircle size={20} />
             <span>Delete Template</span>
          </div>
        }
        okText="Delete Permanently"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={deleteMutation.isPending}
        onOk={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTemplateToDelete(null);
        }}
        centered
        style={{ borderRadius: 16 }}
      >
        <p className="py-4 text-slate-600">
          Are you sure you want to delete the template <strong>"{templateToDelete?.name}"</strong>? 
          This will affect any draft invoices currently using this template. 
          <span className="block mt-2 font-bold text-red-500">This action cannot be undone.</span>
        </p>
      </Modal>
    </MainLayout>
  );
}