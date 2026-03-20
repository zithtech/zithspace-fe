// "use client";

// import React, { useState } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import { 
//   Space, 
//   Typography, 
//   Button, 
//   Card, 
//   Tag, 
//   Empty, 
//   Skeleton,
//   Input,
//   Tooltip,
//   Popconfirm,
//   Row,
//   Col,
//   Badge,
//   Divider
// } from "antd";
// import { 
//   PlusOutlined, 
//   SettingOutlined, 
//   EditOutlined, 
//   DeleteOutlined,
//   SearchOutlined,
//   FileTextOutlined,
//   BlockOutlined
// } from "@ant-design/icons";
// import { useInvoiceTemplates, useDeleteInvoiceTemplate } from "@/hooks/useInvoiceTemplates";
// import InvoiceTemplateDrawer from "./InvoiceTemplateDrawer";
// import { InvoiceTemplate } from "@/services/invoiceTemplateService";

// const { Title, Text } = Typography;

// export default function InvoiceTemplatePage() {
//   const [drawerVisible, setDrawerVisible] = useState(false);
//   const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
//   const [searchText, setSearchText] = useState("");

//   const { data: templates, isLoading } = useInvoiceTemplates();
//   const deleteMutation = useDeleteInvoiceTemplate();

//   const handleEdit = (template: InvoiceTemplate) => {
//     setSelectedTemplateId(template.id);
//     setDrawerVisible(true);
//   };

//   const handleCreate = () => {
//     setSelectedTemplateId(undefined);
//     setDrawerVisible(true);
//   };

//   const filteredTemplates = templates?.filter(t => 
//     t.name.toLowerCase().includes(searchText.toLowerCase()) ||
//     t.billingType.toLowerCase().includes(searchText.toLowerCase())
//   );

//   return (
//     <MainLayout>
//       <div style={{ padding: '24px' }}>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center', 
//           marginBottom: 32 
//         }}>
//           <Space align="center" size="middle">
//             <div style={{ 
//               width: 48, 
//               height: 48, 
//               background: '#1677ff', 
//               borderRadius: '12px', 
//               display: 'flex', 
//               alignItems: 'center', 
//               justifyContent: 'center',
//               color: '#fff',
//               fontSize: '24px'
//             }}>
//               <SettingOutlined />
//             </div>
//             <div>
//               <Title level={2} style={{ margin: 0 }}>Invoice Templates</Title>
//               <Text type="secondary">Manage your billing structures and custom fields</Text>
//             </div>
//           </Space>
//           <Button 
//             type="primary" 
//             size="large" 
//             icon={<PlusOutlined />} 
//             onClick={handleCreate}
//           >
//             Create Template
//           </Button>
//         </div>

//         <div style={{ marginBottom: 24 }}>
//           <Input
//             placeholder="Search templates..."
//             prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
//             onChange={(e) => setSearchText(e.target.value)}
//             style={{ maxWidth: 350, borderRadius: '8px' }}
//             allowClear
//             size="large"
//           />
//         </div>

//         {isLoading ? (
//           <Row gutter={[24, 24]}>
//             {[1, 2, 3, 4].map(i => (
//               <Col xs={24} sm={12} md={8} lg={6} key={i}>
//                 <Card style={{ borderRadius: '12px' }}>
//                    <Skeleton active />
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         ) : filteredTemplates && filteredTemplates.length > 0 ? (
//           <Row gutter={[24, 24]}>
//             {filteredTemplates.map((template) => (
//               <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
//                 <Badge.Ribbon 
//                   text={template.billingType.toUpperCase()} 
//                   color={template.isDefault ? "blue" : "cyan"}
//                 >
//                   <Card 
//                     hoverable
//                     style={{ 
//                       borderRadius: '12px', 
//                       height: '100%', 
//                       display: 'flex', 
//                       flexDirection: 'column',
//                       border: template.isDefault ? '2px solid #1677ff' : '1px solid #f0f0f0'
//                     }}
//                     actions={[
//                       <Tooltip key="edit" title="Edit Template">
//                         <EditOutlined onClick={() => handleEdit(template)} />
//                       </Tooltip>,
//                       <Popconfirm
//                         key="delete"
//                         title="Delete Template"
//                         description="Are you sure you want to delete this template?"
//                         onConfirm={() => deleteMutation.mutate(template.id)}
//                         okText="Yes"
//                         cancelText="No"
//                         okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//                       >
//                         <DeleteOutlined style={{ color: '#ff4d4f' }} />
//                       </Popconfirm>
//                     ]}
//                     styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
//                   >
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 4 }}>
//                         <FileTextOutlined style={{ color: '#1677ff', fontSize: '18px' }} />
//                         <Title level={4} style={{ margin: 0, fontSize: '16px' }}>{template.name}</Title>
//                       </div>
//                       <Text type="secondary" ellipsis={{ tooltip: template.description }}>
//                         {template.description || "No description provided"}
//                       </Text>
//                     </div>

//                     <Divider style={{ margin: '12px 0' }} />
                    
//                     <div style={{ flex: 1 }}>
//                       <Text strong type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: '12px', textTransform: 'uppercase' }}>
//                         Fields ({template._count?.fields || 0})
//                       </Text>
//                       <Space wrap size={[4, 8]}>
//                         {template.fields?.length ? (
//                           template.fields.slice(0, 5).map(f => (
//                             <Tag key={f.id} style={{ borderRadius: '4px', margin: 0 }}>
//                               {f.fieldLabel}
//                             </Tag>
//                           ))
//                         ) : (
//                           <Text type="secondary" italic style={{ fontSize: '13px' }}>
//                             <BlockOutlined /> Basic billing fields
//                           </Text>
//                         )}
//                         {template.fields && template.fields.length > 5 && (
//                           <Tag style={{ borderRadius: '4px', margin: 0 }}>+{template.fields.length - 5}</Tag>
//                         )}
//                       </Space>
//                     </div>

//                     {template.isDefault && (
//                       <div style={{ marginTop: 16 }}>
//                         <Tag color="blue" bordered={false}>DEFAULT TEMPLATE</Tag>
//                       </div>
//                     )}
//                   </Card>
//                 </Badge.Ribbon>
//               </Col>
//             ))}
//           </Row>
//         ) : (
//           <Empty 
//             image={Empty.PRESENTED_IMAGE_SIMPLE} 
//             description="No templates found. Create one to get started!"
//             style={{ marginTop: 100 }}
//           />
//         )}

//         <InvoiceTemplateDrawer
//           visible={drawerVisible}
//           onClose={() => setDrawerVisible(false)}
//           templateId={selectedTemplateId}
//         />
//       </div>
//     </MainLayout>
//   );
// }


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
  PlusOutlined, 
  SettingOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  BlockOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MoreOutlined,
  CopyOutlined
} from "@ant-design/icons";
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

  // Table columns
  const columns = [
    {
      title: "Template Name",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: InvoiceTemplate) => (
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <Text strong>{value}</Text>
          {record.isDefault && (
            <Tag color="blue" bordered={false}>DEFAULT</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Billing Type",
      dataIndex: "billingType",
      key: "billingType",
      render: (value: string) => (
        <Tag color="cyan" bordered={false}>{value.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value: string) => value || "-",
      ellipsis: true,
    },
    {
      title: "Fields",
      key: "fields",
      render: (_: any, record: InvoiceTemplate) => (
        <Text>{record._count?.fields || 0} fields</Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_: any, record: InvoiceTemplate) => {
        const menuItems: MenuProps['items'] = [
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit",
            onClick: () => handleEdit(record),
          },
          {
            key: "delete",
            danger: true,
            label: "Delete",
            onClick: () => handleDelete(record),
          },
        ];
        
        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <div onClick={(e) => e.stopPropagation()}>
              <MoreOutlined className="cursor-pointer text-gray-400" />
            </div>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ padding: 10 }}>
        <Card className="shadow-sm border-gray-200 h-full flex flex-col pb-40">
          {/* Header */}
          <div className="flex flex-row items-center justify-between gap-4 mb-3 flex-nowrap">
            {/* LEFT */}
            <div className="flex flex-col shrink-0">
              {/* Icon + Title */}
              <div className="flex items-center space-x-3">
                <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                <Title level={3} className="!mb-0 !text-gray-900">
                  Invoice Templates
                </Title>
              </div>

              {/* Description */}
              <Typography.Paragraph type="secondary" className="mt-1 !mb-0">
                Manage your billing structures and custom fields
              </Typography.Paragraph>

              {/* TAG */}
              <div className="mt-2">
                <Tag color="purple">
                  Templates: <strong>{totalTemplates}</strong>
                </Tag>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-row items-center gap-3 flex-nowrap">
              <Segmented
                options={[
                  { label: "Card", value: "card", icon: <AppstoreOutlined /> },
                  { label: "Table", value: "table", icon: <MenuFoldOutlined /> },
                ]}
                value={viewMode}
                onChange={(value) => setViewMode(value as "card" | "table")}
              />

              <Input.Search
                placeholder="Search templates..."
                allowClear
                size="middle"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64"
              />

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="h-11 shrink-0"
              >
                Create Template
              </Button>
            </div>
          </div>

          <Divider style={{ marginTop: "0" }} />

          {/* Templates List */}
          <div className="mt-6">
            {isLoading ? (
              <Row gutter={[16, 16]}>
                {[1, 2, 3, 4].map(i => (
                  <Col xs={24} sm={12} md={8} lg={6} key={i}>
                    <Card style={{ borderRadius: '12px' }}>
                      <Skeleton active />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : !filteredTemplates || filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-gray-400">
                {searchText ? "No templates match your search" : "No templates added yet"}
              </div>
            ) : viewMode === "card" ? (
              <Row gutter={[16, 16]}>
                {filteredTemplates.map((template) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                    <div className="gradient-border-wrapper">
                      <Card 
                        hoverable 
                        className="relative bg-white cursor-pointer" 
                        bodyStyle={{ padding: 16 }}
                        onClick={() => router.push(`/invoicepro/newinvoice?templateId=${template.id}`)}
                        style={{ 
                          border: template.isDefault ? '2px solid #1677ff' : undefined
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base font-semibold">
                              <FileTextOutlined />
                            </div>

                            <div>
                              <Typography.Text className="block font-medium text-gray-800">
                                {template.name}
                              </Typography.Text>

                              <Typography.Text type="secondary" className="text-xs">
                                {template.billingType}
                              </Typography.Text>
                            </div>
                          </div>

                          <Dropdown
                            menu={{ 
                              items: [
                                {
                                  key: "edit",
                                  icon: <EditOutlined />,
                                  label: "Edit",
                                  onClick: () => handleEdit(template),
                                },
                                {
                                  key: "delete",
                                  danger: true,
                                  label: "Delete",
                                  onClick: () => handleDelete(template),
                                },
                              ] 
                            }}
                            trigger={["click"]}
                          >
                            <div onClick={(e) => e.stopPropagation()}>
                              <MoreOutlined className="cursor-pointer text-gray-400" />
                            </div>
                          </Dropdown>
                        </div>

                        {/* Description */}
                        <div className="mt-4 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <FileTextOutlined className="text-gray-400 mt-1" />
                            <span className="line-clamp-2">
                              {template.description || "No description provided"}
                            </span>
                          </div>
                        </div>

                        {/* Fields */}
                        <Divider className="my-3" />
                        <div>
                          <Typography.Text className="text-xs text-gray-500 block mb-2">
                            Fields ({template._count?.fields || 0})
                          </Typography.Text>
                          <Space wrap size={[4, 8]}>
                            {template.fields?.length ? (
                              template.fields.slice(0, 5).map(f => (
                                <Tag key={f.id} style={{ borderRadius: '4px', margin: 0 }}>
                                  {f.fieldLabel}
                                </Tag>
                              ))
                            ) : (
                              <Text type="secondary" italic style={{ fontSize: '13px' }}>
                                <BlockOutlined /> Basic billing fields
                              </Text>
                            )}
                            {template.fields && template.fields.length > 5 && (
                              <Tag style={{ borderRadius: '4px', margin: 0 }}>
                                +{template.fields.length - 5}
                              </Tag>
                            )}
                          </Space>
                        </div>

                        {/* Default Badge */}
                        {template.isDefault && (
                          <div className="absolute top-2 right-12">
                            <Tag color="blue" bordered={false}>DEFAULT</Tag>
                          </div>
                        )}
                      </Card>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredTemplates}
                pagination={{ pageSize: 10 }}
                className="mt-4"
                onRow={(record) => ({
                  onClick: () => router.push(`/invoicepro/newinvoice?templateId=${record.id}`),
                  className: 'cursor-pointer'
                })}
              />
            )}
          </div>
        </Card>

        {/* Create/Edit Drawer */}
        <InvoiceTemplateDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          templateId={selectedTemplateId}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteModalVisible}
          title="Delete Template"
          okText="Delete"
          okType="danger"
          cancelText="Cancel"
          confirmLoading={deleteMutation.isPending}
          onOk={confirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setTemplateToDelete(null);
          }}
        >
          <p>
            Are you sure you want to delete the template <strong>"{templateToDelete?.name}"</strong>? 
            This action cannot be undone.
          </p>
        </Modal>
      </div>
    </MainLayout>
  );
}