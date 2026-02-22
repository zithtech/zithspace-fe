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
  Modal,
  message,
} from "antd";
import { EditOutlined, SearchOutlined, UserOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { EmployeeSalaryRecord } from "../../types/salary";
import { salaryService } from "../../services/salaryService";
import SalaryDetailsDrawer from "./SalaryDetailsDrawer";
import EditSalaryDrawer from "./EditSalaryDrawer";


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
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<EmployeeSalaryRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setRecordToDelete(record);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    const recordId = recordToDelete.id || (recordToDelete as any)._id;
    if (!recordId) {
      message.error("Cannot delete: Record ID missing");
      return;
    }

    setDeleteLoading(true);
    try {
      await salaryService.deleteSalary(recordId);
      message.success("Salary record deleted successfully");
      setIsDeleteModalVisible(false);
      setRecordToDelete(null);
      fetchSalaries();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Delete operation failed:", error);
      message.error(`Failed to delete: ${error.message || "Unknown error"}`);
    } finally {
      setDeleteLoading(false);
    }
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(record);
                }}
              />
            </Tooltip>
            <Tooltip title="Edit Details">
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#6b7280" }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record);
                }}
              />
            </Tooltip>
            <Tooltip title="Delete Record">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Delete button clicked!");
                  handleDelete(record);
                }}
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

      {/* Delete Confirmation Modal */}
      <Modal
        title={<span style={{ color: '#ff4d4f' }}>Delete Salary Record</span>}
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setRecordToDelete(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true, loading: deleteLoading }}
        destroyOnClose
      >
        <p style={{ fontSize: 15 }}>
          Are you sure you want to delete the salary record for <strong>
            {recordToDelete?.employee 
              ? `${recordToDelete.employee.first_name} ${recordToDelete.employee.last_name}` 
              : (recordToDelete?.employee_name || "this employee")}
          </strong>?
        </p>
        <p style={{ color: '#6b7280', fontSize: 13 }}>
          This action is permanent and will remove all salary history for this employee.
        </p>
      </Modal>
    </div>
  );
}