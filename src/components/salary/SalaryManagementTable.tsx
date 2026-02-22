import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Tooltip,
  Input,
  Select,
  Avatar,
} from "antd";
import { EditOutlined, SearchOutlined, UserOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { EmployeeSalaryRecord } from "../../types/salary";
import { salaryService } from "../../services/salaryService";
import SalaryDetailsDrawer from "./SalaryDetailsDrawer";
import EditSalaryDrawer from "./EditSalaryDrawer";
import { Modal, message } from "antd";

const { Text } = Typography;

export default function SalaryManagementTable({ 
  refreshTrigger,
  onRefresh
}: { 
  refreshTrigger?: number;
  onRefresh?: () => void;
}) {
  const [data, setData] = useState<EmployeeSalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Drawer state
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<EmployeeSalaryRecord | null>(null);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const result = await salaryService.fetchEmployeeSalaries();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch salaries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, [refreshTrigger]);

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.employee_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employee_code?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.employee_id?.toLowerCase().includes(searchText.toLowerCase());

    const matchesDept =
      departmentFilter === "All Departments" ||
      item.department === departmentFilter;

    const matchesStatus =
      statusFilter === "All Status" ||
      (statusFilter === "Active" ? item.is_active : !item.is_active);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepartments = Array.from(
    new Set(data.map((item) => item.department).filter(Boolean))
  );

  const handleView = (record: EmployeeSalaryRecord) => {
    setSelectedRecord(record);
    setViewDrawerVisible(true);
  };

  const handleEdit = (record: EmployeeSalaryRecord) => {
    setSelectedRecord(record);
    setEditDrawerVisible(true);
  };

  const handleDrawerClose = (refresh?: boolean) => {
    setViewDrawerVisible(false);
    setEditDrawerVisible(false);
    setSelectedRecord(null);
    if (refresh) {
      fetchSalaries();
      if (onRefresh) onRefresh();
    }
  };

  const handleDelete = (record: EmployeeSalaryRecord) => {
    const recordId = record.id || (record as any)._id;
    const employeeName = record.employee 
      ? `${record.employee.first_name} ${record.employee.last_name}` 
      : (record.employee_name || record.employee_id || "this employee");

    console.log("Record to delete:", record);
    console.log("Detected ID:", recordId);

    if (!recordId) {
      console.error("No record ID found for deletion. Available keys:", Object.keys(record));
      message.error("Cannot delete: Record ID missing in data");
      return;
    }

    Modal.confirm({
      title: "Delete Salary Record",
      content: `Are you sure you want to delete the salary record for ${employeeName}? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          console.log(`Action: Calling deleteSalary service for ID: ${recordId}`);
          await salaryService.deleteSalary(recordId);
          message.success("Salary record deleted successfully");
          
          // Force immediate local reload
          await fetchSalaries();
          
          // Trigger parent refresh for dashboard dashboard sync
          if (onRefresh) {
            console.log("Action: Triggering parent dashboard refresh");
            onRefresh();
          }
        } catch (error: any) {
          console.error("Delete operation failed:", error);
          const errorMsg = error.message || "Unknown error";
          message.error(`Failed to delete record: ${errorMsg}`);
          throw error;
        }
      },
    });
  };

  const formatCurrency = (amount?: number | string) => {
    if (amount === undefined || amount === null || amount === "") return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "-";
    return numAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "employee_id",
      key: "employee_id",
      render: (_: any, record: EmployeeSalaryRecord) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text strong style={{ fontSize: 14, color: "#111827" }}>
              {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : (record.employee_name || "Employee Name")}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.employee?.employee_code || record.employee_code || "EMP-001"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (_Dept: string, record: EmployeeSalaryRecord) => (
        <Text type="secondary" style={{ fontSize: 14 }}>
          {record.salary_structure?.name || "Standard Structure"}
        </Text>
      ),
    },
    {
      title: "Annual CTC",
      dataIndex: "current_annual_ctc",
      key: "current_annual_ctc",
      render: (amount: number) => (
        <Text strong style={{ fontSize: 14 }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "Monthly CTC",
      dataIndex: "current_monthly_ctc",
      key: "current_monthly_ctc",
      render: (amount: number) => (
        <Text strong style={{ fontSize: 14 }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: "VPF",
      dataIndex: "vpf_percentage",
      key: "vpf_percentage",
      // width: 130,
      render: (val: number | string, record: EmployeeSalaryRecord) => {
        if (!record.is_additional_pf_active) {
          return (
            <Tag
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: 20,
                border: "none",
                padding: "0 10px",
                fontWeight: 500,
              }}
            >
              Inactive
            </Tag>
          );
        }
        const percentage =
          val ?? (record.additional_pf_pct ? record.additional_pf_pct : undefined);
        return percentage ? (
          <Tag
            style={{
              background: "#e6f4ea",
              color: "#1e8e3e",
              borderRadius: 20,
              border: "none",
              padding: "0 10px",
              fontWeight: 500,
            }}
          >
            {percentage}%
          </Tag>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (isActive: boolean) => (
        <Tag
          style={{
            background: isActive ? "#e6f4ea" : "#f1f5f9",
            color: isActive ? "#1e8e3e" : "#64748b",
            borderRadius: 20,
            border: "none",
            padding: "0 12px",
            fontWeight: 500,
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "action",
      align: "right" as const,
      render: (_: any, record: EmployeeSalaryRecord) => (
        <div className="row-actions">
          <Space>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined style={{ color: "#6b7280" }} />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
            <Tooltip title="Edit Details">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#6b7280" }} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Tooltip title="Delete Record">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 20,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Search & Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Input
          placeholder="Search by name or ID..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 8,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        />

        <Select
          value={departmentFilter}
          onChange={setDepartmentFilter}
          style={{ width: 180, height: 40 }}
          options={[
            { value: "All Departments", label: "All Departments" },
            ...uniqueDepartments.map((dept) => ({ value: dept, label: dept })),
          ]}
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 140, height: 40 }}
          options={[
            { value: "All Status", label: "All Status" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />
      </div>

      <style>{`
        .salary-row .row-actions {
          opacity: 1;
        }
      `}</style>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        rowClassName="salary-row"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Showing ${total} of ${total} employees`,
        }}
      />

      {/* Drawers */}
      <SalaryDetailsDrawer
        visible={viewDrawerVisible}
        onClose={handleDrawerClose}
        record={selectedRecord}
      />
      <EditSalaryDrawer
        visible={editDrawerVisible}
        onClose={handleDrawerClose}
        record={selectedRecord}
      />
    </div>
  );
}