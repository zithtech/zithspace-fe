"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Table,
  Input,
  Button,
  message,
  Tooltip
} from "antd";
import {
  Search,
  Building2,
  Check,
  Import,
  X,
  Ban,
  Users
} from "lucide-react";
import { ClientV2, ClientV2Service } from "@/services/clientV2Service";
import { Customer } from "@/services/customersService";
import type { ColumnsType } from "antd/es/table";


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
  existingCustomers }: ClientImportModalProps) {
  const [clients, setClients] = useState<ClientV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      fetchClients();
    } else {
      setSearchText("");
      setSelectedClients([]);
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await ClientV2Service.getClients({ limit: 100 });
      setClients(response.data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      messageApi.error(error.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  const isClientAlreadyCustomer = (client: ClientV2) =>
    existingCustomers.some(
      (c) => c.companyName.toLowerCase() === client.companyName.toLowerCase()
    );

  const availableClients = useMemo(
    () => clients.filter((c) => !isClientAlreadyCustomer(c)),
    [clients, existingCustomers]
  );

  const filteredClients = useMemo(() => {
    const q = searchText.toLowerCase();
    return availableClients.filter(
      (client) =>
        client.companyName.toLowerCase().includes(q) ||
        client.clientCode.toLowerCase().includes(q) ||
        client.billingContactEmail?.toLowerCase().includes(q) ||
        client.gstVatTaxId?.toLowerCase().includes(q) ||
        client.pan?.toLowerCase().includes(q) ||
        client.vatNumber?.toLowerCase().includes(q)
    );
  }, [availableClients, searchText]);

  const handleSelectClient = (clientId: string, checked: boolean) => {
    setSelectedClients((prev) =>
      checked ? [...prev, clientId] : prev.filter((id) => id !== clientId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedClients(checked ? filteredClients.map((c) => c.id) : []);
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

  const allOnPageSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selectedClients.includes(c.id));
  const someOnPageSelected =
    filteredClients.some((c) => selectedClients.includes(c.id)) &&
    !allOnPageSelected;

  // Stat tile — premium minimal accent strip
  const StatTile = ({
    label,
    value,
    icon: Icon,
    accent }: {
      label: string;
      value: string | number;
      icon: any;
      accent: string;
    }) => (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)"
      }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}14`,
          color: accent,
          border: `1px solid ${accent}33`
        }}
      >
        <Icon size={15} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div
          className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="text-[18px] font-bold leading-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );

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
      )
    },
    {
      title: "CLIENT",
      key: "client",
      render: (_, record) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)"
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
      )
    },
    {
      title: "CODE",
      dataIndex: "clientCode",
      key: "code",
      width: 130,
      render: (text) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums"
          style={{
            background: "var(--bg-slate-50)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}
        >
          {text || "—"}
        </span>
      )
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
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0"
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#10b981" }}
            />
            Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "var(--bg-slate-50)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)"
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#94a3b8" }}
            />
            Inactive
          </span>
        )
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
            background: "rgba(15, 23, 42, 0.45)"
          },
          content: { padding: 0, borderRadius: 20, overflow: "hidden" },
          body: { padding: 0 }
        }}
      >
        {/* HEADER */}
        <div
          className="px-6 py-4 flex items-start justify-between gap-3 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)"
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)"
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

        {/* BODY */}
        <div className="px-6 py-5">
          {/* STATS */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile
              label="Total clients"
              value={loading ? "—" : clients.length}
              icon={Users}
              accent="#2563eb"
            />
            <StatTile
              label="Available to import"
              value={loading ? "—" : availableClients.length}
              icon={Check}
              accent="#10b981"
            />
            <StatTile
              label="Already customers"
              value={loading ? "—" : clients.length - availableClients.length}
              icon={Ban}
              accent="#f43f5e"
            />
          </div>

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
              style={{
                width: 360,
                height: 36,
                borderRadius: 8,
                background: "var(--bg-secondary)",
                borderColor: "var(--border-color)"
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
                border: "1px solid var(--border-color)"
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
              className="flex flex-col items-center justify-center py-16 rounded-xl"
              style={{
                background: "var(--bg-secondary)",
                border: "1.5px dashed var(--border-color)"
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)"
                }}
              >
                <Building2 size={20} strokeWidth={2} />
              </div>
              <div
                className="text-[14px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Nothing to import
              </div>
              <div
                className="text-[12px] mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                All admin clients already exist as customers, or none are
                available.
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)"
              }}
            >
              <Table
                columns={columns}
                dataSource={filteredClients}
                rowKey="id"
                pagination={{
                  pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 8,
                  showSizeChanger: false,
                  style: { padding: "12px 20px" },
                  showTotal: (total, range) =>
                    `${range[0]}–${range[1]} of ${total}`
                }}
                size="middle"
                scroll={{ x: 720 }}
                className="client-import-table"
                onRow={(record) => ({
                  onClick: () =>
                    handleSelectClient(
                      record.id,
                      !selectedClients.includes(record.id)
                    ),
                  className: "cursor-pointer"
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
          className="px-6 py-3 flex items-center justify-between gap-3 border-t"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-color)"
          }}
        >
          <Tooltip
            title={
              selectedClients.length === 0
                ? "Tap a row or check the box to select clients"
                : ""
            }
          >
            <span
              className="text-[12px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {selectedClients.length > 0 ? (
                <>
                  Ready to import{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selectedClients.length}
                  </span>{" "}
                  client{selectedClients.length !== 1 ? "s" : ""}
                </>
              ) : (
                "Select one or more clients to continue"
              )}
            </span>
          </Tooltip>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<Import size={14} />}
              onClick={handleImport}
              disabled={selectedClients.length === 0}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
                background:
                  selectedClients.length > 0 ? "#2563eb" : undefined
              }}
            >
              Import{" "}
              {selectedClients.length > 0
                ? `${selectedClients.length} client${selectedClients.length !== 1 ? "s" : ""
                }`
                : "clients"}
            </Button>
          </div>
        </div>
      </Modal>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .client-import-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .client-import-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .client-import-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .client-import-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .client-import-table .client-row-selected > td {
          background-color: var(--bg-blue-50) !important;
        }
        .client-import-table .client-row-selected:hover > td {
          background-color: var(--bg-blue-50) !important;
        }
      ` }}
      />
    </>
  );
}
