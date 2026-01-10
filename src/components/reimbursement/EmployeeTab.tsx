"use client";

import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Drawer,
} from "antd";
import {
  FileDoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";

import { useReimbursements } from "@/hooks/useReimbursements";
import { Reimbursement } from "@/types/reimbursement";

export default function EmployeeTab() {
  /* ===== DATA FROM SERVICE VIA HOOK ===== */
  const { data, loading } = useReimbursements();

  /* ===== DRAWER STATE ===== */
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);


const employeeData = data.filter(
  r => r.employee.name === "Current User"
);


  /* ===== TABLE COLUMNS (UNCHANGED) ===== */
const columns = [
  {
    title: "Request ID",
    render: (_: any, r: Reimbursement, index: number) => {
      const year = new Date().getFullYear();
      const seq = String(index + 1).padStart(4, "0");
      return `REQ-${year}-${seq}`;
    },
  },

  { title: "Category", dataIndex: "category" },

  {
    title: "Amount",
    render: (_: any, r: Reimbursement) =>
      `₹${r.amount.toLocaleString("en-IN")}`,
  },

  // ✅ SUBMITTED COLUMN (THIS WAS MISSING)
  {
    title: "Submitted",
    render: (_: any, r: Reimbursement) =>
      r.status === "DRAFT" ? "—" : r.submitted,
  },

  {
    title: "Status",
    dataIndex: "status",
    render: (status: Reimbursement["status"]) => (
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
            : "red"
        }
      >
        {status}
      </Tag>
    ),
  },

  {
    title: "Actions",
    render: (_: any, record: Reimbursement) => (
      <Button
        type="link"
        icon={<EyeOutlined />}
        onClick={() => {
          setSelectedRow(record);
          setOpen(true);
        }}
      >
        View
      </Button>
    ),
  },
];


  {/* ================= style ================= */ }
  const summaryCardClass = `
  h-24
  rounded-2xl
  border border-gray-200
  bg-white
  p-4
  shadow-[0_6px_20px_rgba(0,0,0,0.08)]
  flex items-center
`;


  return (
    <div className="space-y-6">

      {/* ================= SUMMARY CARDS (UNCHANGED) ================= */}


      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Total Submitted</span>}
              value={employeeData.length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Pending Approval</span>}
              value={employeeData.filter(d => d.status === "PENDING_APPROVAL").length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Approved</span>}
              value={employeeData.filter(d => d.status === "APPROVED").length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Total Paid</span>}
              value={employeeData
                .filter(d => d.status === "PAID")
                .reduce((s, i) => s + i.amount, 0)}
              prefix="₹"
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* ================= TABLE ================= */}
      <Card className="rounded-2xl shadow-lg">
        <Table
          columns={columns}
          dataSource={employeeData}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* ================= DRAWER ================= */}
      <Drawer
        title={<span className="text-sm font-semibold">Details</span>}
        placement="right"
        width={480}
        open={open}
        onClose={() => setOpen(false)}
        styles={{
          body: { padding: 20 },
        }}
      >
        {selectedRow && (
          <div className="space-y-7 text-[13px] text-gray-700">

            {/* HEADER */}
            <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 p-5 border shadow">
              <div className="font-semibold text-gray-900">
                {selectedRow?.requestId || "-"}
              </div>


              <Tag color="green" className="mt-3 rounded-full px-3 text-[11px]">
                {selectedRow?.status || "-"}
              </Tag>
            </div>

            {/* SUMMARY */}
            <div>
              <div className="mb-3 font-semibold text-gray-900">
                Request Summary
              </div>

              <div className="rounded-2xl bg-white p-5 border space-y-3 shadow-md">
                {[
                  ["Category", selectedRow.category],
                  ["Total Amount", `₹${selectedRow.amount}`],
                  ["Employee", selectedRow.employee.name],
                  ["Department", selectedRow.employee.department],
                  ["Submitted", selectedRow.submitted],
                  ["Created", selectedRow.created],
                ].map(([label, value], i) => (
                  <div key={i} className="flex justify-between text-[12px]">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* EXPENSE ITEMS */}
            <div>
              <div className="mb-3 font-semibold text-gray-900">
                Expense Items ({selectedRow.expenseItems.length})
              </div>

              <div className="space-y-4">
                {selectedRow.expenseItems.map((item, i) => (
                  <div key={i} className="rounded-2xl bg-white p-5 border shadow">
                    <div className="font-semibold text-gray-900">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[12px] text-gray-500">
                      {item.date} • ₹{item.amount}
                    </div>
                    <Tag color="green" className="mt-3 rounded-full px-3 text-[11px]">
                      {item.status}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTIVITY LOG */}
            <div>
              <div className="mb-3 font-semibold text-gray-900">
                Activity Log
              </div>

              <div className="space-y-4">
                {selectedRow.activityLog.map((log, i) => (
                  <div key={i} className="relative pl-5 border-l-2 border-blue-200">
                    <span className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full bg-blue-500" />
                    <div className="text-sm text-gray-800">
                      {log.action}
                    </div>
                    {log.note && (
                      <div className="text-[12px] text-gray-500">
                        {log.note}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-400">
                      {log.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Drawer>
    </div>
  );
}
