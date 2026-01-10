"use client";

import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  message,
  Modal,
  Drawer,
  Input,
} from "antd";

import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

import { useReimbursements } from "@/hooks/useReimbursements";
import { ReimbursementService } from "@/services/reimbursementService";
import { Reimbursement } from "@/types/reimbursement";

const { Title } = Typography;

/* ================== COMPONENT ================== */
export default function ManagerTab() {
  /* ===== DATA FROM SERVICE ===== */
  const { data, loading, reload } = useReimbursements();

  /* ===== STATE ===== */
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [actionType, setActionType] = useState<
    "approve" | "reject" | "clarify" | null
  >(null);
  const [actionText, setActionText] = useState("");
  const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);
  const [showFilters, setShowFilters] = useState(false);



  //filter logic
  const pendingRequests= data.filter(r => r.status === "PENDING_APPROVAL");


  /* ===== TABLE COLUMNS (UNCHANGED UI) ===== */
  const columns: ColumnsType<Reimbursement> = [
    {
      title: "Request ID",
      dataIndex: "requestId",
    },
    {
      title: "Employee",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.employee.name}</div>
          <div className="text-xs text-gray-400">
            {record.employee.department}
          </div>
        </div>
      ),
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
      title: "Submitted",
      dataIndex: "submitted",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "Approved"
            ? "green"
            : status === "Rejected"
              ? "red"
              : "orange";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space size="middle">
          {/* VIEW */}
          <Tooltip title="View">
            <Button
              type="text"
              className="text-blue-600"
              icon={<EyeOutlined className="text-[18px]" />}
              onClick={() => {
                setSelectedRow(record);
                setOpen(true);
              }}
            />
          </Tooltip>

          {/* APPROVE */}
          <Tooltip title="Approve">
            <Button
              type="text"
              className="text-blue-600"
              icon={<CheckCircleOutlined className="text-[18px]" />}
              onClick={() => {
                setCurrentRecord(record);
                setActionType("approve");
              }}
            />
          </Tooltip>

          {/* REJECT */}
          <Tooltip title="Reject">
            <Button
              type="text"
              className="text-blue-600"
              icon={<CloseCircleOutlined className="text-[18px]" />}
              onClick={() => {
                setCurrentRecord(record);
                setActionType("reject");
              }}
            />
          </Tooltip>

          {/* CLARIFY */}
          <Tooltip title="Clarification">
            <Button
              type="text"
              className="text-blue-600"
              icon={<QuestionCircleOutlined className="text-[18px]" />}
              onClick={() => {
                setCurrentRecord(record);
                setActionType("clarify");
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const summaryCardClass = `
  h-24
  rounded-2xl
  border border-gray-200
  bg-white
  p-4
  shadow-[0_6px_20px_rgba(0,0,0,0.08)]
`;


  return (
    <div>
      {/* ===== SUMMARY CARDS (SAME UI) ===== */}
      <Row gutter={[16, 16]} style={{ marginTop: 7, marginBottom: 24 }}>

  {/* Pending Approval */}
  <Col xs={24} md={8}>
    <Card className={summaryCardClass}>
      <Statistic
        title={
          <span className="text-xs text-gray-500">
            Pending Approval
          </span>
        }
        value={data.filter(d => d.status === "PENDING_APPROVAL").length}
        valueStyle={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#111827",
          lineHeight: "1.2",
        }}
      />
    </Card>
  </Col>

  {/* Under Review */}
  <Col xs={24} md={8}>
    <Card className={summaryCardClass}>
      <Statistic
        title={
          <span className="text-xs text-gray-500">
            Under Review
          </span>
        }
        value={data.filter(d => d.status === "PENDING_APPROVAL").length}
        valueStyle={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#111827",
          lineHeight: "1.2",
        }}
      />
    </Card>
  </Col>

  {/* Approved Today */}
  <Col xs={24} md={8}>
    <Card className={summaryCardClass}>
      <Statistic
        title={
          <span className="text-xs text-gray-500">
            Approved Today
          </span>
        }
        value={data.filter(d => d.status === "APPROVED").length}
        valueStyle={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#111827",
          lineHeight: "1.2",
        }}
      />
    </Card>
  </Col>

</Row>

      {/* ===== TABLE ===== */}
      <Card>
        <Table
          columns={columns}
          dataSource={pendingRequests}   // ✅ SERVICE DATA
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* ===== DRAWER (UI UNCHANGED) ===== */}

      <Drawer
        title={<span className="text-sm font-semibold">Details</span>}
        placement="right"
        width={480}
        open={open}
        onClose={() => setOpen(false)}
        bodyStyle={{ padding: 20, background: "#f8fafc" }}
      >
        {/* ================= EMPTY / BEFORE DATA ================= */}
        {!selectedRow && (
          <div className="space-y-6 text-[13px] text-gray-500">

            {/* Header Placeholder */}
            <div className="rounded-2xl bg-white p-5 border shadow-sm animate-pulse">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-200 rounded-full mt-3" />
            </div>

            {/* Summary Placeholder */}
            <div className="rounded-2xl bg-white p-5 border shadow-sm space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              ))}
            </div>

            {/* Message */}
            <div className="text-center text-sm text-gray-400 pt-6">
              Select a reimbursement to view details
            </div>
          </div>
        )}

        {/* ================= AFTER DATA ================= */}
        {selectedRow && (
          <div className="space-y-7 text-[13px] text-gray-700">

            {/* HEADER */}
            <div className="relative rounded-2xl bg-gradient-to-br from-white to-gray-50 p-5 border shadow">
              <div className="absolute left-0 top-0 h-full w-[4px] bg-blue-600 rounded-l-2xl" />

              <div className="font-semibold text-gray-900">
                {selectedRow.requestId}
              </div>

              <Tag
                color={
                  selectedRow.status === "APPROVED"
                    ? "green"
                    : selectedRow.status === "REJECTED"
                      ? "red"
                      : "orange"
                }
                className="mt-3 rounded-full px-3 text-[11px]"
              >
                {selectedRow.status}
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
                  <div
                    key={i}
                    className="relative rounded-2xl bg-white p-5 border shadow"
                  >
                    <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 rounded-l-2xl" />

                    <div className="font-semibold text-gray-900">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[12px] text-gray-500">
                      {item.date} • ₹{item.amount}
                    </div>

                    <Tag
                      color="green"
                      className="mt-3 rounded-full px-3 text-[11px]"
                    >
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
                  <div
                    key={i}
                    className="relative pl-5 border-l-2 border-blue-200"
                  >
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







      {/* ===== MODAL ACTIONS ===== */}
      <Modal
        open={!!actionType}
        footer={null}
        centered
        closable={false}
        className="rounded-2xl overflow-hidden"
        onCancel={() => {
          setActionType(null);
          setActionText("");
        }}
      >
        {/* ================= HEADER ================= */}
        <div
          className={`
      px-6 py-4 text-white
      ${actionType === "approve"
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : actionType === "reject"
                ? "bg-gradient-to-r from-red-500 to-rose-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }
    `}
        >
          <h3 className="text-base font-semibold">
            {actionType === "approve" && "Approve Request"}
            {actionType === "reject" && "Reject Request"}
            {actionType === "clarify" && "Request Clarification"}
          </h3>

          <p className="mt-1 text-xs opacity-90">
            Request ID: {currentRecord?.requestId}
          </p>
        </div>

        {/* ================= BODY ================= */}
        <div className="px-6 py-5 bg-slate-50 space-y-4">

          {/* APPROVE CONTENT */}
          {actionType === "approve" && (
            <div className="rounded-xl bg-white border p-4 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to approve{" "}
                <b>{currentRecord?.requestId}</b>?
                This will mark all expense items as <b>approved</b>.
              </p>
            </div>
          )}

          {/* REJECT CONTENT */}
          {actionType === "reject" && (
            <div className="rounded-xl bg-white border p-4 shadow-sm space-y-2">
              <label className="text-xs font-medium text-gray-600">
                Rejection Reason
              </label>
              <Input.TextArea
                rows={4}
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="Enter the reason for rejection..."
                className="rounded-lg"
              />
            </div>
          )}

          {/* CLARIFICATION CONTENT */}
          {actionType === "clarify" && (
            <div className="rounded-xl bg-white border p-4 shadow-sm space-y-2">
              <label className="text-xs font-medium text-gray-600">
                Your Question
              </label>
              <Input.TextArea
                rows={4}
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="What additional information do you need?"
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t">
          <Button
            onClick={() => {
              setActionType(null);
              setActionText("");
            }}
          >
            Cancel
          </Button>

          <Button
            type="primary"
            className={
              actionType === "approve"
                ? "bg-green-500 hover:bg-green-600"
                : actionType === "reject"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
            }
  onClick={async () => {
    if (!currentRecord) return;
    
    if ((actionType === "reject" || actionType === "clarify") && !actionText.trim()) {
      message.error("Message is required");
      return;
    }

    if (actionType === "approve") {
      await ReimbursementService.updateStatus(currentRecord.id, "APPROVED");
      message.success(`${currentRecord.requestId} Approved Successfully! `);
    }

    if (actionType === "reject") {
      await ReimbursementService.updateStatus(currentRecord.id, "REJECTED");
      message.success(`${currentRecord.requestId} Rejected! `);
    }

    if (actionType === "clarify") {
      message.success("Clarification request sent");
    }

    reload();  // Table refresh
    setActionType(null);
    setActionText("");
  }}
          >
            {actionType === "approve"
              ? "Approve"
              : actionType === "reject"
                ? "Reject"
                : "Send Request"}
          </Button>

          
        </div>
      </Modal>


    </div>
  );
}
