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
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";

import { useState } from "react";
import { useReimbursements } from "@/hooks/useReimbursements";
import { Reimbursement } from "@/types/reimbursement";

export default function FinanceTab() {
  /* ===== DATA FROM HOOK ===== */
  const { data, loading } = useReimbursements();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  // ===== FILTER STATES =====
  const [filters, setFilters] = useState({
    employee: "all",
    department: "all",
    category: "all",
    status: "all",
  });

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
      render: (status) => (
        <Tag
          color={
            status === "Approved"
              ? "green"
              : status === "Rejected"
                ? "red"
                : "orange"
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
      {/* ===== TOP ACTION BAR ===== */}
   

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
        placement="right"
        width={500}
        open={open}
        onClose={() => setOpen(false)}
        bodyStyle={{ padding: 0, background: "#f8fafc" }}
      >
        {selectedRow && (
          <div className="h-full text-[13px] text-gray-700">
            {/* ================= HEADER ================= */}
            <div className="relative bg-white px-6 py-4 border-b">
              {/* Accent */}
              <span className="absolute left-0 top-0 h-full w-[4px] bg-blue-600 rounded-r" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selectedRow.requestId}
                  </div>
                  <div className="text-xs text-gray-500">
                    Reimbursement Request
                  </div>
                </div>

                <Tag
                  color={
                    selectedRow.status === "APPROVED"
                      ? "green"
                      : selectedRow.status === "REJECTED"
                        ? "red"
                        : "orange"
                  }
                  className="rounded-full px-3 text-[11px]"
                >
                  {selectedRow.status}
                </Tag>
              </div>
            </div>

            {/* ================= BODY ================= */}
            <div className="px-6 py-5 space-y-6">
              {/* ===== DETAILS GRID ===== */}
              <div className="rounded-2xl bg-white border shadow-sm p-5">
                <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Request Details
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {/* Request ID */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Request ID
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedRow.requestId}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Status
                    </div>
                    <Tag
                      color={
                        selectedRow.status === "APPROVED"
                          ? "green"
                          : selectedRow.status === "REJECTED"
                            ? "red"
                            : "orange"
                      }
                      className="mt-1"
                    >
                      {selectedRow.status}
                    </Tag>
                  </div>

                  {/* Employee */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Employee
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedRow.employee.name}
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Department
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedRow.employee.department}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Category
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedRow.category}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="text-[11px] text-gray-500">
                      Amount
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      ₹{selectedRow.amount}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== AMOUNT HIGHLIGHT ===== */}
              <div className="
            flex justify-between items-center
            px-6 py-4
            rounded-xl
            bg-gradient-to-r from-gray-900 to-gray-800
            text-white
            shadow-lg
          ">
                <span className="text-xs uppercase tracking-wider text-gray-300">
                  Total Amount
                </span>
                <span className="text-2xl font-extrabold">
                  ₹{selectedRow.amount}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
