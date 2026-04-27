"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Input,
  Button,
  Spin,
  message,
  Typography,
  Tag,
  Space,
  Card,
  Avatar,
  Divider,
  Tooltip,
} from "antd";
import {
  Search,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Check,
  Import,
  X,
  Globe,
  Fingerprint,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { ClientV2, ClientV2Service } from "@/services/clientV2Service";
import { Customer } from "@/services/customersService";
import type { ColumnsType } from "antd/es/table";

const { Text, Title } = Typography;

interface ClientImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (clients: ClientV2[]) => void;
  existingCustomers: Customer[];
}

export default function ClientImportModal({
  open,
  onClose,
  onImport,
  existingCustomers,
}: ClientImportModalProps) {
  const [clients, setClients] = useState<ClientV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch clients when modal opens
  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log("Fetching clients...");
      const response = await ClientV2Service.getClients({ limit: 100 });
      console.log("Clients response:", response);
      
      // apiUtils.getPaginated returns: { data: clients[], pagination: {...} }
      // No 'success' field in the transformed response
      setClients(response.data || []);
      console.log("Clients set:", response.data?.length || 0, "clients loaded");
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      messageApi.error(error.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  // Check if client already exists as customer
  const isClientAlreadyCustomer = (client: ClientV2) => {
    return existingCustomers.some(
      (customer) =>
        customer.companyName.toLowerCase() === client.companyName.toLowerCase()
    );
  };

  // Filter clients to exclude already existing customers, then apply search
  const availableClients = clients.filter((client) => !isClientAlreadyCustomer(client));
  
  const filteredClients = availableClients.filter((client) =>
    client.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
    client.clientCode.toLowerCase().includes(searchText.toLowerCase()) ||
    (client.billingContactEmail && client.billingContactEmail.toLowerCase().includes(searchText.toLowerCase())) ||
    (client.gstVatTaxId && client.gstVatTaxId.toLowerCase().includes(searchText.toLowerCase())) ||
    (client.pan && client.pan.toLowerCase().includes(searchText.toLowerCase())) ||
    (client.vatNumber && client.vatNumber.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredClients.map((client) => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleImport = () => {
    const clientsToImport = filteredClients.filter((client) =>
      selectedClients.includes(client.id)
    );
    
    if (clientsToImport.length === 0) {
      messageApi.warning("Please select at least one client to import");
      return;
    }

    onImport(clientsToImport);
    onClose();
    setSelectedClients([]);
    setSearchText("");
  };

  const columns: ColumnsType<ClientV2> = [
    {
      title: (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={availableClients.length > 0 && selectedClients.length === availableClients.length}
            ref={(el) => {
              if (el) {
                el.indeterminate = selectedClients.length > 0 && selectedClients.length < availableClients.length;
              }
            }}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
            style={{ accentColor: '#3b82f6' }}
          />
          <span className="text-xs font-medium" style={{ color: '#64748b' }}>
            SELECT ALL
          </span>
        </div>
      ),
      key: "select-all",
      width: 120,
      align: 'center',
      render: (_, record) => {
        const isSelected = selectedClients.includes(record.id);
        
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleSelectClient(record.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              style={{ accentColor: '#3b82f6' }}
            />
          </div>
        );
      },
    },
    {
      title: "CLIENT INFORMATION",
      key: "client",
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3 truncate">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--customers-avatar-bg)', color: 'var(--customers-avatar-text)' }}>
            {record.companyName.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {record.companyName}
            </div>
            {record.clientType && (
              <div className="text-[10px] truncate" style={{ color: 'var(--text-slate-500)' }}>
                {record.clientType}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "CLIENT CODE",
      dataIndex: "clientCode",
      key: "code",
      width: 140,
      render: (text) => (
        <Text strong style={{ color: 'var(--customers-header-icon-color)', fontWeight: 700 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 120,
      render: (_, record) => (
        <Tag
          color={record.isActive ? "success" : "default"}
          className="hover:opacity-80 transition-opacity m-0"
          style={{
            padding: "4px 10px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: "1",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: "none",
            textTransform: "uppercase",
            letterSpacing: "0.02em"
          }}
        >
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
      ];

  
  return (
    <>
      {contextHolder}
      <Modal
        title={
          <div className="flex items-center gap-4" style={{ paddingRight: 8 }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white"
              }}
            >
              <Import size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }} ellipsis>
                Import Clients as Customers
              </Title>
              <Text type="secondary" style={{ fontSize: 14, color: "var(--text-secondary)" }} ellipsis>
                Select clients from the admin system to convert them to invoice customers
              </Text>
            </div>
            <div className="flex-shrink-0 mr-2">
              <Button
                type="primary"
                icon={<Import size={16} />}
                onClick={handleImport}
                disabled={selectedClients.length === 0}
                size="large"
                style={{ 
                  borderRadius: 8, 
                  height: 44, 
                  fontWeight: 600,
                  background: selectedClients.length > 0 
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                    : "var(--bg-slate-200)",
                  border: "none",
                  boxShadow: selectedClients.length > 0 
                    ? "0 4px 12px rgba(102, 126, 234, 0.4)" 
                    : "none"
                }}
              >
                Import {selectedClients.length} Client{selectedClients.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1000}
        styles={{
          body: { padding: "24px" },
          header: { 
            borderBottom: "1px solid #e5e7eb",
            padding: "20px 24px",
            borderRadius: "16px 16px 0 0"
          },
          content: { padding: 0 },
          footer: {
            borderTop: "1px solid #e5e7eb",
            padding: "16px 24px",
            borderRadius: "0 0 16px 16px"
          }
        }}
        footer={null}
      >
        <div>
          {/* Enhanced Search Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by company name, client code, email, or tax ID..."
                prefix={<Search size={18} style={{ color: 'var(--text-slate-400)' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="large"
                style={{ 
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--customers-card-bg)"
                }}
                allowClear
                className="focus-within:border-purple-500 focus-within:shadow-lg transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {selectedClients.length} of {availableClients.length} selected
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards - Matching Customer Page Style */}
          <div className="grid grid-cols-3 gap-4 mb-6">
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {clients.length}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-slate-400)" }}>
                    Total Clients
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#dbeafe", color: "#3b82f6" }}
                >
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
              </div>
            </Card>
            
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {availableClients.length}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-slate-400)" }}>
                    Available to Import
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#d1fae5", color: "#10b981" }}
                >
                  <Check size={20} strokeWidth={2.5} />
                </div>
              </div>
            </Card>
            
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {clients.length - availableClients.length}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-slate-400)" }}>
                    Already Customers
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#fee2e2", color: "#f43f5e" }}
                >
                  <Ban size={20} strokeWidth={2.5} />
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Clients Table - Invoice Page Style */}
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-600 font-medium">Loading clients...</div>
              </div>
            </div>
          ) : (
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                border: "1px solid var(--customers-card-border)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                overflow: "hidden",
                backgroundColor: "var(--customers-card-bg)"
              }}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={columns}
                dataSource={filteredClients}
                rowKey="id"
                pagination={{
                  pageSize: 8,
                  showSizeChanger: false,
                  showQuickJumper: false,
                  style: { padding: "16px 24px" },
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} clients`,
                  position: ['bottomCenter'],
                }}
                size="middle"
                scroll={{ x: 800, y: 450 }}
                rowClassName={() => "client-import-table-row"}
              />
            </Card>
          )}
        </div>
      </Modal>
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .client-import-table-row:hover {
          background-color: #f8fafc !important;
        }
        .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 8px 16px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        
        /* Dark theme specific styles - only apply when data-theme is dark */
        [data-theme='dark'] .client-import-table-row:hover {
          background-color: var(--customers-table-row-hover) !important;
        }
        [data-theme='dark'] .ant-table-thead > tr > th {
          background-color: var(--customers-table-header-bg) !important;
          color: var(--customers-table-header-text) !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-tbody > tr > td {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-pagination {
          background-color: var(--customers-card-bg) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item {
          background-color: var(--customers-card-bg) !important;
          border-color: var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item a {
          color: var(--text-primary) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item-active {
          background-color: var(--customers-header-icon-color) !important;
          border-color: var(--customers-header-icon-color) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-prev,
        [data-theme='dark'] .ant-table-pagination .ant-pagination-next {
          background-color: var(--customers-card-bg) !important;
          border-color: var(--border-color) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-prev button,
        [data-theme='dark'] .ant-table-pagination .ant-pagination-next button {
          color: var(--text-primary) !important;
        }
        [data-theme='dark'] .ant-table-pagination .ant-pagination-total-text {
          color: var(--text-primary) !important;
        }
        `
      }} />
    </>
  );
}
