"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Input, Select, Button, Tag, Modal, message, Space, Tooltip, Dropdown } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { salaryService } from "../../services/salaryService";
import { EmployeeSalaryRecord } from "../../types/salary";
import EditSalaryDrawer from "./EditSalaryDrawer";
import SalaryDetailsDrawer from "./SalaryDetailsDrawer";

const { confirm } = Modal;

interface SalaryManagementTableProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function SalaryManagementTable({
  refreshTrigger = 0,
  onRefresh,
}: SalaryManagementTableProps) {
  const [records, setRecords] = useState<EmployeeSalaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Drawer states
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeSalaryRecord | null>(null);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await salaryService.fetchEmployeeSalaries();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch salary records:", error);
      message.error("Failed to load salary records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getEmployeeName = (record: EmployeeSalaryRecord) => {
    if (record.employee) {
      return `${record.employee.first_name} ${record.employee.last_name}`;
    }
    return record.employee_name || "—";
  };

  const getEmployeeCode = (record: EmployeeSalaryRecord) => {
    return record.employee?.employee_code || record.employee_code || "—";
  };

  const formatCurrency = (amount?: number | string) => {
    const num = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const name = getEmployeeName(r).toLowerCase();
      const code = getEmployeeCode(r).toLowerCase();
      const matchesSearch =
        !searchText ||
        name.includes(searchText.toLowerCase()) ||
        code.includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.is_active) ||
        (statusFilter === "inactive" && !r.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [records, searchText, statusFilter]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleView = (record: EmployeeSalaryRecord) => {
    setSelectedRecord(record);
    setDetailDrawerVisible(true);
  };

  const handleEdit = (record: EmployeeSalaryRecord) => {
    setSelectedRecord(record);
    setEditDrawerVisible(true);
  };

  const handleDelete = (record: EmployeeSalaryRecord) => {
    confirm({
      title: "Delete Salary Record",
      icon: <ExclamationCircleOutlined />,
      content: (
        <span>
          Are you sure you want to delete the salary record for{" "}
          <strong>{getEmployeeName(record)}</strong>? This action cannot be
          undone.
        </span>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await salaryService.deleteSalary(record.id);
          message.success("Salary record deleted successfully");
          fetchRecords();
          onRefresh?.();
        } catch (error) {
          message.error("Failed to delete salary record");
        }
      },
    });
  };

  const handleDrawerClose = (shouldRefresh?: boolean) => {
    setEditDrawerVisible(false);
    setDetailDrawerVisible(false);
    setSelectedRecord(null);
    if (shouldRefresh) {
      fetchRecords();
      onRefresh?.();
    }
  };

  // ─── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <div>
          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
            {getEmployeeName(record)}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {getEmployeeCode(record)}
          </div>
        </div>
      ),
      sorter: (a: EmployeeSalaryRecord, b: EmployeeSalaryRecord) =>
        getEmployeeName(a).localeCompare(getEmployeeName(b)),
    },
    {
      title: "Department",
      key: "department",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <div>
          <div style={{ fontSize: 13, color: "#374151" }}>
            {record.department || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {record.designation || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Annual CTC",
      key: "annual_ctc",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
          {formatCurrency(record.current_annual_ctc)}
        </span>
      ),
      sorter: (a: EmployeeSalaryRecord, b: EmployeeSalaryRecord) =>
        Number(a.current_annual_ctc || 0) - Number(b.current_annual_ctc || 0),
    },
    {
      title: "Monthly CTC",
      key: "monthly_ctc",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {formatCurrency(
            record.current_monthly_ctc ||
              Number(record.current_annual_ctc || 0) / 12
          )}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: any, record: EmployeeSalaryRecord) => (
        <Tag color={record.is_active ? "green" : "default"}>
          {record.is_active ? "Active" : "Inactive"}
        </Tag>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value: any, record: EmployeeSalaryRecord) =>
        record.is_active === value,
    },
    {
      title: "Salary Structure",
      key: "structure",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <span style={{ color: "#64748b", fontSize: 13 }}>
          {record.salary_structure?.name || "—"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: any, record: EmployeeSalaryRecord) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              style={{ color: "#6366f1" }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#0ea5e9" }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              style={{ color: "#ef4444" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="Search employees..."
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchRecords();
            onRefresh?.();
          }}
          style={{ marginLeft: "auto" }}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredRecords}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} records`,
        }}
        style={{ borderRadius: 0 }}
        size="middle"
        locale={{
          emptyText: (
            <div style={{ padding: "40px 0", color: "#94a3b8" }}>
              {searchText
                ? "No matching records found"
                : "No salary records available"}
            </div>
          ),
        }}
      />

      {/* Drawers */}
      <EditSalaryDrawer
        visible={editDrawerVisible}
        onClose={handleDrawerClose}
        record={selectedRecord}
      />
      <SalaryDetailsDrawer
        visible={detailDrawerVisible}
        onClose={() => handleDrawerClose()}
        record={selectedRecord}
      />
    </div>
  );
}