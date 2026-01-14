"use client";

import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Drawer,
  Row,
  Col,
  message,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, CloseOutlined, DownloadOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";

import { useState } from "react";
import { useReimbursements } from "@/hooks/useReimbursements";
import { Reimbursement } from "@/types/reimbursement";

export default function FinanceTab() {
  /* ===== DATA FROM HOOK ===== */
  const { data, loading } = useReimbursements();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);





  const handlePreview = async (fileName: string) => {
    try {
      setLoadingFile(true);
      const res = await fetch(`/files/${fileName}`, { method: "HEAD" });

      if (res.ok) {
        window.open(`/files/${fileName}`, "_blank");
      } else {
        message.error("File not available");
      }
    } catch {
      message.error("Preview fail");
    } finally {
      setLoadingFile(false);
    }
  };



  const handleDownload = (fileName: string) => {
    const link = document.createElement("a");
    link.href = `/files/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const normalizeFiles = (item: any): string[] => {
    if (Array.isArray(item.attachments)) return item.attachments;
    if (Array.isArray(item.files)) return item.files;
    if (typeof item.attachments === "string") return [item.attachments];
    if (typeof item.files === "string") return [item.files];
    return [];
  };



  // ===== FILTER STATES =====
  const [filters, setFilters] = useState({
    employee: "all",
    department: "all",
    category: "all",
    status: "all",
  });


  const getManagerStatusTag = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Tag color="green">Manager Approved</Tag>;
      case "REJECTED":
        return <Tag color="red">Manager Rejected</Tag>;
      default:
        return <Tag color="orange">Pending Manager Approval</Tag>;
    }
  };
  const getFinanceStatusTag = (status?: string) => {
    if (status === "PAID") {
      return <Tag color="green">Finance Paid</Tag>;
    }
    if (status === "ON_HOLD") {
      return <Tag color="red">Finance On Hold</Tag>;
    }
    return <Tag color="orange">Pending Finance Approval</Tag>;
  };


  /* ===== FILTERED DATA ===== */
  const filteredData = data.filter((r) => {
    // Employee filter
    if (filters.employee !== "all" && r.employee.name !== filters.employee) {
      return false;
    }

    // Department filter
    if (filters.department !== "all" && r.employee.department !== filters.department) {
      return false;
    }

    // Category filter
    if (filters.category !== "all" && r.category !== filters.category) {
      return false;
    }

    // Status filter
    if (filters.status !== "all" && r.status !== filters.status) {
      return false;
    }

    return true;
  });

  /* ===== TABLE COLUMNS (UNCHANGED) ===== */
  const columns: ColumnsType<Reimbursement> = [
    {
      title: "Request ID",
      dataIndex: "requestId",
    },
    {
      title: "Employee",
      render: (_, r) => r.employee.name,
    },
    {
      title: "Department",
      render: (_, r) => r.employee.department,
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Amount",
      render: (_, r) => `₹${r.amount.toLocaleString("en-IN")}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "DRAFT"
              ? "default"
              : status === "PENDING_APPROVAL"
                ? "orange"
                : status === "APPROVED"
                  ? "green"
                  : status === "PAID"
                    ? "blue"
                    : status === "REJECTED"
                      ? "red"
                      : "default"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRow(record);
              setOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    // ===== CSV HEADERS (EXACT AS TABLE) =====
    const headers = [
      "Request ID",
      "Category",
      "Amount",
      "Submitted",
      "Status",
    ];

    // ===== ROW DATA (MAP FROM TABLE DATA) =====
    const rows = data.map((item) => [
      item.requestId,
      item.category,
      item.amount,
      item.status,
    ]);

    // ===== BUILD CSV STRING =====
    const csvContent =
      [
        headers.join(","), // header row
        ...rows.map((row) =>
          row.map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          ).join(",")
        ),
      ].join("\n");

    // ===== CREATE & DOWNLOAD FILE =====
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "reimbursements.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ===== HANDLE FILTER CHANGES =====
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ===== RESET FILTERS =====
  const resetFilters = () => {
    setFilters({
      employee: "all",
      department: "all",
      category: "all",
      status: "all",
    });
    setShowFilters(false);
  };

  const summaryCardClass = `
  h-24
  rounded-2xl
  border border-gray-200
  bg-white
  p-4
  shadow-[0_6px_20px_rgba(0,0,0,0.08)]
`;


  return (
    <>
      {/* ===== SUMMARY CARDS ===== */}
      <Row gutter={[16, 16]}>

        {/* Pending Payment */}
        <Col xs={24} md={8}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">
              Pending Payment
            </div>

            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              ₹630.00
            </div>

            <div className="text-xs text-gray-500 mt-1">
              1 requests
            </div>
          </Card>
        </Col>

        {/* Paid This Month */}
        <Col xs={24} md={8}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">
              Paid This Month
            </div>

            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              ₹0.00
            </div>
          </Card>
        </Col>

        {/* Total All Time */}
        <Col xs={24} md={8}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">
              Total All Time
            </div>

            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              ₹99.99
            </div>
          </Card>
        </Col>

      </Row>





      <div className="flex justify-end items-center mb-4">
        <Button
          type="default"
          className="
      rounded-lg
      shadow-sm
      border-gray-300
      hover:border-blue-500
      hover:text-blue-600
      mr-2
      mt-3
    "
          onClick={exportToCSV}
        >
          Export CSV
        </Button>

        <Button
          type="default"
          className="
      rounded-lg
      border-gray-300
      shadow-sm
      hover:border-blue-500
      hover:text-blue-600
      mt-3
    "
          onClick={() => setShowFilters((prev) => !prev)}
        >
          Advanced Filters
        </Button>
      </div>


      {showFilters && (
        <Card
          className="
      mt-4
      mb-5px
      rounded-xl
      border border-gray-200
      shadow-sm
    "
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Employee */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Employee
              </label>
              <Select
                value={filters.employee}
                onChange={(value) => handleFilterChange("employee", value)}
                className="w-full"
                size="middle"
              >
                <Select.Option value="all">All Employees</Select.Option>
                <Select.Option value="Employee 1"> Ramesh Kumar</Select.Option>
                <Select.Option value="Employee 2">Priya Sharma</Select.Option>
                <Select.Option value="Employee 2">John Carter</Select.Option>
                <Select.Option value="Employee 2">Anita Verma</Select.Option>
              </Select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Department
              </label>
              <Select
                value={filters.department}
                onChange={(value) => handleFilterChange("department", value)}
                className="w-full"
              >
                <Select.Option value="all">All Departments</Select.Option>
                <Select.Option value="HR">HR</Select.Option>
                <Select.Option value="IT">	Operations</Select.Option>
                <Select.Option value="IT">Finance</Select.Option>

              </Select>
            </div>


            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Category
              </label>
              <Select
                value={filters.category}
                onChange={(value) => handleFilterChange("category", value)}
                className="w-full"
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="travel">Travel Policy</Select.Option>
                <Select.Option value="food">Food & Meals Policy</Select.Option>
                <Select.Option value="internet">Internet Policy</Select.Option>
                <Select.Option value="mobile">Mobile Policy</Select.Option>
                <Select.Option value="medical">Medical Policy</Select.Option>
                <Select.Option value="office">Office Supplies Policy</Select.Option>
                <Select.Option value="other">Other Policy</Select.Option>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                className="w-full"
              >
                <Select.Option value="all">All Statuses</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              <Button
                type="default"
                className="w-full"
                onClick={resetFilters}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ===== TABLE ===== */}
      <Card
        className="
          rounded-2xl
          border border-gray-200
          shadow-[0_10px_30px_-15px_rgba(0,0,0,0.18)]
        "
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* ===== DRAWER (UNCHANGED) ===== */}
      <Drawer
        title={
          <div className="pb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                #{selectedRow?.requestId || "REQ-0000"}
              </div>
              <div className="flex items-center gap-3">
                <Tag
                  color={
                    selectedRow?.status === "APPROVED"
                      ? "green"
                      : selectedRow?.status === "REJECTED"
                        ? "red"
                        : "orange"
                  }
                  className="rounded-full px-4 py-1 text-xs font-medium shadow-sm border-0 backdrop-blur-sm"
                >
                  {selectedRow?.status || "PENDING"}
                </Tag>
                <CloseOutlined
                  className="cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-110 text-base transition-all duration-200"
                  onClick={() => setOpen(false)}
                />
              </div>
            </div>
          </div>
        }
        placement="right"
        width={450}
        closeIcon={null}
        open={open}
        styles={{
          body: {
            padding: 10,
            height: "100vh",
            overflow: "hidden",
          },
          header: { padding: "16px 20px 0" },
        }}
      >
        {selectedRow && (
          <div className="h-full flex flex-col text-sm text-gray-700">

            {/* ================= SUMMARY (FIXED) ================= */}
            <div className="flex-shrink-0">
              <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                Request Summary
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-100 space-y-2 shadow-lg">
                {[
                  ["Category", selectedRow.category],
                  ["Total Amount", `₹${selectedRow.amount}`],
                  ["Employee", selectedRow.employee.name],
                  ["Department", selectedRow.employee.department],
                  ["Submitted", selectedRow.submitted],
                  ["Created", selectedRow.created],
                ].map(([label, value], i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs py-1 hover:bg-slate-100 hover:rounded-lg px-2 transition-colors"
                  >
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                ))}

                <div className="flex justify-between text-xs py-1 px-2">
                  <span className="text-gray-500 font-medium">
                    Manager Status
                  </span>

                  <span className="font-bold text-gray-900 ml-4">
                    {getManagerStatusTag(selectedRow.status)}
                  </span>
                </div>


                <div className="flex justify-between text-xs py-1 px-2">
                  <span className="text-gray-500 font-medium">
                    Finance Status
                  </span>

                  <span className="ml-4">
                    {getFinanceStatusTag(selectedRow.financeStatus)}
                  </span>
                </div>

              </div>
            </div>
            <div className="flex-1 overflow-y-auto mt-3 pr-2 space-y-6">

              {/* EXPENSE ITEMS */}
              <div>
                <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                  Expense Items ({selectedRow.expenseItems?.length || 0})
                </div>

                <div className="space-y-2">
                  {selectedRow.expenseItems?.map((item, i) => {
                    const files = normalizeFiles(item);
                    const showFiles = files.slice(0, 4);
                    const hasMoreFiles = files.length > 4;

                    return (
                      <div
                        key={i}
                        className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.date} • ₹{item.amount}
                          </div>
                        </div>

                        {files.length > 0 && (
                          <div className="space-y-1.5 min-w-[180px]">
                            {showFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-white p-2 rounded-lg text-xs border h-8"
                              >
                                <span className="truncate max-w-[90px]">
                                  {file}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    size="small"
                                    type="text"
                                    onClick={() => handlePreview(file)}
                                  >
                                    <EyeOutlined />
                                  </Button>
                                  <Button
                                    size="small"
                                    type="text"
                                    onClick={() => handleDownload(file)}
                                  >
                                    <DownloadOutlined />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {hasMoreFiles && (
                              <Button size="small" type="link">
                                +{files.length - 4} more files
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVITY LOG */}
              <div>
                <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                  Activity Log
                </div>

                <div className="space-y-3">
                  {selectedRow.activityLog.slice(-4).map((log, i) => (
                    <div
                      key={i}
                      className="relative pl-6 border-l-2 border-indigo-200 pr-2"
                    >
                      <span className="absolute -left-2.5 top-1.5 h-3 w-3 rounded-full bg-indigo-500" />
                      <div className="text-sm font-semibold text-gray-900">
                        {log.action}
                      </div>
                      {log.note && (
                        <div className="text-xs text-gray-600 italic">
                          {log.note}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {log.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </Drawer>




    </>
  );
}
