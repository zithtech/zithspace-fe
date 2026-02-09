"use client";

import MainLayout from "@/components/layout/MainLayout";
import React, { useState, useEffect } from "react";
import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Card,
  Typography,
  DatePicker,
  Select,
  Button,
  Table,
  Modal,
  Checkbox,
  Popconfirm,
} from "antd";
import {
  Employee,
  mockEmployees,
  AttendanceResponse,
  ReimbursementResponse,
} from "@/types/salary";

import PayslipModal from "./PayslipModal";
import {
  fetchAttendance,
  fetchReimbursements,
  fetchEmployeeSalary,
   fetchAllowances
} from "@/services/salarySettings.service";
// Dynamic import to avoid SSR issues with xlsx library
// import { exportPayslipExcel } from "./exportPayslipExcel";


const { Title, Text } = Typography;

type SelectionType = "user" | "department" | undefined;
type Allowance = {
  id: number;
  name: string;
  amount: number;
  ytd: number;
};

const Page = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectionType, setSelectionType] = useState<SelectionType>();
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [tableData, setTableData] = useState<Employee[]>([]);

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptUsers, setDeptUsers] = useState<Employee[]>([]);
  const [selectedDeptUsers, setSelectedDeptUsers] = useState<string[]>([]);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);

  const [reimbursements, setReimbursements] =
    useState<ReimbursementResponse | null>(null);
  const [salaryMap, setSalaryMap] = useState<Record<string, any>>({});


  const [allowances, setAllowances] = useState<Allowance[]>([]);
const [isAllowanceModalOpen, setIsAllowanceModalOpen] = useState(false);

  const isValid =
    fromDate &&
    toDate &&
    selectionType &&
    (selectionType === "user" ? selectedUser : selectedDepartment);

  const mergeUniqueEmployees = (oldList: Employee[], newList: Employee[]) => {
    const map = new Map<string, Employee>();

    [...oldList, ...newList].forEach((emp) => {
      map.set(emp.employeeId, emp); // duplicate avoid
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    // 🔴 FUTURE REAL API
    /*
  fetchEmployees().then(setEmployees);
  */

    // 🟡 TEMP DUMMY
    setEmployees(mockEmployees);
  }, []);

  useEffect(() => {
    if (employees.length === 0) return;

    setUsers(Array.from(new Set(employees.map((e) => e.employeeName))));

    setDepartments(Array.from(new Set(employees.map((e) => e.department))));
  }, [employees]);

  const loadSalaryForEmployees = async (emps: Employee[]) => {
    const updates: Record<string, any> = {};

    for (const emp of emps) {
      if (!salaryMap[emp.employeeId]) {
        const salary = await fetchEmployeeSalary(emp.employeeId);

        updates[emp.employeeId] = {
          grossSalary: salary.grossSalary,
          earnings: salary.earnings,
          deductions: salary.deductions,
          deductionsEnabled: salary.deductionsEnabled,
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      setSalaryMap((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleGeneratePayslip = () => {
    // if (selectionType === "user") {
    //   const data = employees.filter((e) => e.employeeName === selectedUser);
    //   setTableData((prev) => mergeUniqueEmployees(prev, data));

    // }

    // if (selectionType === "user") {
    //   const data = employees.filter((e) => e.employeeName === selectedUser);

    //   setTableData((prev) => mergeUniqueEmployees(prev, data));
    // }

    if (selectionType === "user") {
      const data = employees.filter((e) => e.employeeName === selectedUser);

      setTableData((prev) => mergeUniqueEmployees(prev, data));

      // ✅ ADD THIS LINE
      loadSalaryForEmployees(data);
    }

    if (selectionType === "department") {
      const deptEmp = employees.filter(
        (e) => e.department === selectedDepartment,
      );

      setDeptUsers(deptEmp); // modal users
      setSelectedDeptUsers([]); // reset selection
      setIsDeptModalOpen(true); // open modal
    }
  };

  const handleDeleteRow = (employeeId: string) => {
    setTableData((prev) => prev.filter((emp) => emp.employeeId !== employeeId));

    // optional cleanup
    setSalaryMap((prev) => {
      const updated = { ...prev };
      delete updated[employeeId];
      return updated;
    });
  };

  const columns = [
    {
      title: "User Name",
      dataIndex: "employeeName",
      key: "employeeName",
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Date Range",
      key: "dateRange",
      render: () => (
        <span>
          {fromDate} - {toDate}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Employee) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="link"
            onClick={async () => {
              setSelectedEmployee(record);

              const attendanceData = await fetchAttendance();
              setAttendance(attendanceData);

              const reimbursementData = await fetchReimbursements();
              setReimbursements(reimbursementData);

              const salary = await fetchEmployeeSalary(record.employeeId);
              setSalaryMap((prev) => ({
                ...prev,
                [record.employeeId]: {
                  grossSalary: salary.grossSalary,
                  earnings: salary.earnings,
                  deductions: salary.deductions,
                  deductionsEnabled: salary.deductionsEnabled,
                },
              }));

              setIsPayslipModalOpen(true);
            }}
          >
            View Payslip
          </Button>

          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => {
              console.log("Add clicked for", record.employeeId);
            }}
          />

          <Popconfirm
            title="Delete payslip?"
            description="This action cannot be undone"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteRow(record.employeeId)}
          >
            <Button
              danger
              shape="circle"
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedDeptUsers,
    onChange: (keys: React.Key[]) => {
      setSelectedDeptUsers(keys as string[]);
    },
  };

  const deptColumns = [
    {
      title: "Employee Name",
      dataIndex: "employeeName",
      key: "employeeName",
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
  ];

  return (
    <MainLayout>
      {/* 🔹 HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#e6f4ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8, // 👉 right-ku move
          }}
        >
          <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />
        </div>

        <div>
          <Title level={3} style={{ margin: 0 }}>
            Generate Payslip
          </Title>
          <Text type="secondary">
            Generate and view employee payslips for a selected period
          </Text>
        </div>
      </div>

      {/* 🔹 FILTER CARD (THIS WAS MISSING) */}
      <Card
        style={{
          marginTop: 24,
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          marginLeft: 5,
        }}
      >
        {/* CARD HEADER */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: "#e6f7f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            📄
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Filter Options</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Select criteria to generate payslips
            </div>
          </div>
        </div>

        {/* FILTER ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          {/* FROM DATE */}
          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            />
          </div>

          {/* TO DATE */}
          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            />
          </div>

          {/* SELECT TYPE */}
          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>
              Select Type
            </label>
            <select
              value={selectionType}
              onChange={(e) => {
                setSelectionType(e.target.value as SelectionType);
                setSelectedUser("");
                setSelectedDepartment("");
              }}
              style={{
                width: "100%",
                marginTop: 4,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
            >
              <option value="">Choose</option>
              <option value="user">User</option>
              <option value="department">Department</option>
            </select>
          </div>

          {/* USER / DEPARTMENT */}
          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>
              {selectionType === "user"
                ? "Select User"
                : selectionType === "department"
                  ? "Select Department"
                  : "User / Department"}
            </label>

            {selectionType === "user" && (
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            )}

            {selectionType === "department" && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                }}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* BUTTON – SAME ROW */}
          <div>
            <Button
              type="primary"
              disabled={!isValid}
              onClick={handleGeneratePayslip}
              style={{
                width: "100%",
                height: 34,
              }}
            >
              Generate Payslip
            </Button>
          </div>
        </div>
      </Card>

      {tableData.length > 0 && (
        <Card style={{ marginTop: 24, marginLeft: 5 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Generated Payslips
            </div>

            <Button
              type="primary"
              size="small"
              onClick={async () => {
                const { exportPayslipExcel } = await import("./exportPayslipExcel");
                exportPayslipExcel(tableData, fromDate, toDate, salaryMap);
              }}
            >
              Export
            </Button>
          </div>

          <Table
            rowKey="employeeId"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
            style={{ borderRadius: 8, overflow: "hidden" }}
          />
        </Card>
      )}

      <Modal
        title={`Select Users - ${selectedDepartment}`}
        open={isDeptModalOpen}
        onCancel={() => setIsDeptModalOpen(false)}
        okText="Generate Payslips"
        width={750}
        // onOk={() => {
        //   const finalUsers =
        //     selectedDeptUsers.length === 0
        //       ? deptUsers
        //       : deptUsers.filter((u) =>
        //           selectedDeptUsers.includes(u.employeeId),
        //         );

        //   setTableData((prev) => mergeUniqueEmployees(prev, finalUsers));
        //   setIsDeptModalOpen(false);
        // }}
        onOk={async () => {
          const finalUsers =
            selectedDeptUsers.length === 0
              ? deptUsers
              : deptUsers.filter((u) =>
                  selectedDeptUsers.includes(u.employeeId),
                );

          setTableData((prev) => mergeUniqueEmployees(prev, finalUsers));

          // ✅ ADD THIS LINE
          await loadSalaryForEmployees(finalUsers);

          setIsDeptModalOpen(false);
        }}
      >
        <Table
          rowKey="employeeId" // 🔴 MUST
          columns={deptColumns}
          dataSource={deptUsers}
          rowSelection={{
            type: "checkbox", // 🔴 each row checkbox
            ...rowSelection,
          }}
          pagination={false}
          bordered
          style={{
            background: "#e19898ff",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          scroll={{ x: "100%" }}
        />
      </Modal>

      {/* <Modal
        title="Payslip Detials"
        open={isPayslipModalOpen}
        onCancel={() => setIsPayslipModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedEmployee && (
          <div>
            <p>
              <strong>Employee Name:</strong> {selectedEmployee.employeeName}
            </p>
            <p>
              <strong>Employee ID:</strong> {selectedEmployee.employeeId}
            </p>
            <p>
              <strong>Department:</strong> {selectedEmployee.department}
            </p>
            <p>
              <strong>Period:</strong> {fromDate} to {toDate}
            </p>

            <hr />

            <p style={{ color: "#6b7280" }}>
              Payslip details will appear here (salary, deductions, net pay,
              etc.)
            </p>
          </div>
        )}
      </Modal>*/}

      <PayslipModal
        open={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        employee={selectedEmployee}
        fromDate={fromDate}
        toDate={toDate}
        attendance={attendance}
        reimbursements={reimbursements} // ✅ IMPORTANT
      />

    </MainLayout>
  );
};

export default Page;
