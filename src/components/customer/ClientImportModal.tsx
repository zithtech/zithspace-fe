"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Input,
  Button,
  message,
  Tooltip,
  Pagination,
} from "antd";
import {
  Search,
  Building2,
  Check,
  Import,
  X,
  Ban,
  Users,
} from "lucide-react";
import { ClientV2, ClientV2Service } from "@/services/clientV2Service";
import { Customer } from "@/services/customersService";
import type { ColumnsType } from "antd/es/table";
import { StatCards } from "@/components/common/StatCards";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  const debouncedSearch = useDebounce(searchText, 500);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await ClientV2Service.getClients({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
      });
      setClients(response.data || []);
      setTotalRecords(response.pagination?.total || response.data?.length || 0);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      messageApi.error(error.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchClients();
    } else {
      setSearchText("");
      setSelectedClients([]);
      setCurrentPage(1);
      setPageSize(15);
    }
  }, [open, currentPage, pageSize, debouncedSearch]);

  const isClientAlreadyCustomer = (client: ClientV2) =>
    existingCustomers.some(
      (c) => c.companyName.toLowerCase() === client.companyName.toLowerCase()
    );

  const availableClients = useMemo(
    () => clients.filter((c) => !isClientAlreadyCustomer(c)),
    [clients, existingCustomers]
  );

  // filteredClients is removed as search is now server-side

  const handleSelectClient = (clientId: string, checked: boolean) => {
    setSelectedClients((prev) =>
      checked ? [...prev, clientId] : prev.filter((id) => id !== clientId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedClients(checked ? availableClients.map((c) => c.id) : []);
  };

  const handleImport = () => {
    const clientsToImport = availableClients.filter((client) =>
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

  const allOnPageSelected =
    availableClients.length > 0 &&
    availableClients.every((c) => selectedClients.includes(c.id));
  const someOnPageSelected =
    availableClients.some((c) => selectedClients.includes(c.id)) &&
    !allOnPageSelected;

  // StatTile removed in favor of common StatCards component

  const columns: ColumnsType<ClientV2> = [
    {
      title: (
        <input
          type="checkbox"
          checked={allOnPageSelected}
          ref={(el) => {
            if (el) el.indeterminate = someOnPageSelected;
          }}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: "#2563eb" }}
        />
      ),
      key: "select",
      width: 48,
      align: "center",
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedClients.includes(record.id)}
          onChange={(e) => handleSelectClient(record.id, e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer"
          style={{ accentColor: "#2563eb" }}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: "CLIENT",
      key: "client",
      render: (_, record) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              boxShadow: "inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            }}
          >
            {record.companyName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {record.companyName}
            </div>
            <div
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {record.billingContactEmail || record.clientType || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "CODE",
      dataIndex: "clientCode",
      key: "code",
      width: 130,
      render: (text) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums"
          style={{
            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            color: "#475569",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 1px rgba(0,0,0,0.02)",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {text || "—"}
        </span>
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 110,
      render: (_, record) =>
        record.isActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%)",
              color: "#047857",
              border: "1px solid #a7f3d0",
              boxShadow: "0 1px 2px rgba(16, 185, 129, 0.05)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 4px rgba(16, 185, 129, 0.4)" }}
            />
            Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#94a3b8" }}
            />
            Inactive
          </span>
        ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={onClose}
        width={960}
        closable={false}
        footer={null}
        styles={{
          mask: {
            backdropFilter: "blur(4px)",
            background: "rgba(15, 23, 42, 0.45)",
          },
          content: { padding: 0, borderRadius: 20, overflow: "hidden" },
          body: { padding: 0 },
        }}
      >
        {/* HEADER */}
        <div
          className="px-6 py-4 flex items-start justify-between gap-3 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              <Import size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Import clients as customers
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Select clients from the admin system to convert into invoice
                customers
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STATS - Edge to edge */}
        <StatCards
          title="Import Summary"
          statusText="READY"
          statusColor="#3b82f6"
          dotColor="#3b82f6"
          className="border-b border-[var(--border-color)]"
          cells={[
            {
              label: "Total matching",
              value: loading ? "—" : totalRecords,
              icon: <Users size={14} />,
            },
            {
              label: "Available on page",
              value: loading ? "—" : availableClients.length,
              icon: <Check size={14} />,
              color: "#10b981",
            },
            {
              label: "Already customers",
              value: loading ? "—" : clients.length - availableClients.length,
              icon: <Ban size={14} />,
              color: "#f43f5e",
              hint: "(on page)",
            },
          ]}
        />

        {/* BODY */}
        <div className="px-6 py-4">
          {/* TOOLS */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <Input
              placeholder="Search by company, code, email, or tax ID..."
              prefix={
                <Search
                  size={14}
                  style={{ color: "var(--text-secondary)" }}
                />
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="premium-search-input"
              style={{
                width: 360,
                height: 38,
                borderRadius: 8,
                background: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            />
            <div className="flex items-center gap-2">
              {selectedClients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedClients([])}
                  className="text-[12px] font-medium hover:underline"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Clear selection
                </button>
              )}
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedClients.length}
                </span>{" "}
                of {availableClients.length} selected
              </span>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div
              className="flex justify-center items-center h-64 rounded-xl"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="text-center">
                <ZukvoLoader size="md" />
                <div
                  className="mt-3 text-[12px] font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading clients...
                </div>
              </div>
            </div>
          ) : availableClients.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-xl transition-all duration-300"
              style={{
                background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-slate-50) 100%)",
                border: "1px dashed var(--border-color)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-600)",
                  border: "1px solid var(--border-blue-100)",
                }}
              >
                <Building2 size={24} strokeWidth={1.5} />
              </div>
              <div
                className="text-[15px] font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                No clients found
              </div>
              <div
                className="text-[13px] mt-1.5 max-w-sm text-center leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                All admin clients already exist as customers, or none match your search criteria.
              </div>
            </div>
          ) : (
            <div
              className="overflow-hidden shadow-sm"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <Table
                columns={columns}
                dataSource={availableClients}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ y: 'calc(100vh - 480px)', x: 720 }}
                className="client-import-table"
                onRow={(record) => ({
                  onClick: () =>
                    handleSelectClient(
                      record.id,
                      !selectedClients.includes(record.id)
                    ),
                  className: "cursor-pointer",
                })}
                rowClassName={(record) =>
                  selectedClients.includes(record.id)
                    ? "client-row-selected"
                    : ""
                }
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3 border-t sticky bottom-0 z-10"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
            boxShadow: "0 -4px 20px -2px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Pagination
            className="client-import-pagination"
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            pageSizeOptions={[10, 15, 20, 25, 50, 100]}
            size="small"
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
          />
          <div className="flex items-center gap-4">
            <Tooltip
              title={
                selectedClients.length === 0
                  ? "Tap a row or check the box to select clients"
                  : ""
              }
            >
              <span
                className="text-[12px] transition-colors"
                style={{ color: selectedClients.length > 0 ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {selectedClients.length > 0 ? (
                  <>
                    Ready to import{" "}
                    <span
                      className="font-bold text-blue-600"
                    >
                      {selectedClients.length}
                    </span>{" "}
                    client{selectedClients.length !== 1 ? "s" : ""}
                  </>
                ) : (
                  "Select clients"
                )}
              </span>
            </Tooltip>
            <div className="h-5 w-px bg-[var(--border-color)]"></div>
            <Button onClick={onClose} style={{ borderRadius: 8, height: 38, fontWeight: 500 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<Import size={15} />}
              onClick={handleImport}
              disabled={selectedClients.length === 0}
              className="import-btn-premium"
              style={{
                borderRadius: 8,
                height: 38,
                fontWeight: 600,
                padding: "0 20px",
                background: selectedClients.length > 0 ? "#2563eb" : undefined,
              }}
            >
              Import{" "}
              {selectedClients.length > 0
                ? `${selectedClients.length}`
                : "Clients"}
            </Button>
          </div>
        </div>
      </Modal>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .client-import-table.ant-table-wrapper,
        .client-import-table.ant-table-wrapper .ant-table,
        .client-import-table.ant-table-wrapper .ant-table-container,
        .client-import-table.ant-table-wrapper .ant-table-header,
        .client-import-table.ant-table-wrapper .ant-table-thead > tr > th,
        .client-import-table.ant-table-wrapper .ant-table-thead > tr > th:first-child,
        .client-import-table.ant-table-wrapper .ant-table-thead > tr > th:last-child {
          border-radius: 0 !important;
        }
        .client-import-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 12px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
          border-radius: 0 !important;
        }
        .client-import-table .ant-table-tbody > tr > td {
          padding: 8px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .client-import-table .ant-table-tbody > tr:nth-child(even) > td {
          background-color: #f8fafc !important;
        }
        .client-import-table .ant-table-row:hover > td {
          background-color: inherit !important;
        }
        .client-import-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .client-import-table .client-row-selected > td {
          background-color: var(--bg-blue-50) !important;
        }
        .client-import-table .client-row-selected > td:first-child {
          position: relative;
        }
        .client-import-table .client-row-selected > td:first-child::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background-color: #3b82f6;
        }
        .client-import-table .client-row-selected:hover > td {
          background-color: #eff6ff !important;
        }
        
        /* Premium Search Input */
        .premium-search-input {
          transition: all 0.2s ease !important;
        }
        .premium-search-input:hover {
          border-color: #93c5fd !important;
        }
        .premium-search-input.ant-input-affix-wrapper-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        
        /* Premium Import Button */
        .import-btn-premium:not(:disabled) {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2) !important;
          transition: all 0.2s ease !important;
        }
        .import-btn-premium:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3) !important;
        }
        
        /* Square Pagination */
        .client-import-pagination .ant-pagination-item,
        .client-import-pagination .ant-pagination-prev .ant-pagination-item-link,
        .client-import-pagination .ant-pagination-next .ant-pagination-item-link {
          border-radius: 6px !important;
        }
      `,
        }}
      />
    </>
  );
}
