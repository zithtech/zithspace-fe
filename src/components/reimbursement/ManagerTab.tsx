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
  CloseOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
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

  const [loadingFile, setLoadingFile] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");



  const normalizeFiles = (item: any): string[] => {
    if (Array.isArray(item.attachments)) return item.attachments;
    if (Array.isArray(item.files)) return item.files;
    if (typeof item.attachments === "string") return [item.attachments];
    if (typeof item.files === "string") return [item.files];
    return [];
  };



  const getFileName = (filePath: string): string => {
    return filePath.split('/').pop()?.split('\\').pop() || filePath;
  };

  const handlePreview = async (file: string) => {
    try {
      setLoadingFile(true);

      const fileName = getFileName(file);
      const url = `/files/${fileName}`;

      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) {
        message.error("File not found for preview");
        return;
      }

      setPreviewFileName(fileName);
      setPreviewUrl(url);
      setPreviewModal(true); // ✅ OPEN MODAL
    } catch (error) {
      console.error("Preview error:", error);
      message.error("Preview failed");
    } finally {
      setLoadingFile(false);
    }
  };


  const handleDownload = async (file: string) => {
    try {
      const fileName = getFileName(file);
      const url = `/files/${fileName}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('File not found');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      message.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Download failed');
    }
  };

  //filter logic
  const pendingRequests = data.filter(r => r.status === "PENDING_APPROVAL");


 const getManagerStatusTag = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <span className="text-green-600">Manager Approved</span>;
    case "REJECTED":
      return <span className="text-red-600">Manager Rejected</span>;
    default:
      return <span className="text-red-500">Pending  Approval</span>;
  }
};

const getFinanceStatusTag = (status?: string) => {
  if (status === "PAID") {
    return <span className="text-green-600">Finance Paid</span>;
  }
  if (status === "ON_HOLD") {
    return <span className="text-red-600">Finance On Hold</span>;
  }
  return <span className="text-red-500">Pending  Approval</span>;
};

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
              icon={
                <EyeOutlined
                  style={{
                    color: '#1890ff',
                    fontSize: 14
                  }}
                />
              }
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
    <Card className={`${summaryCardClass} h-full`}>
      <div className="flex items-center justify-between h-full">
        <span className="text-xs text-gray-500">
          Pending Approval
        </span>

        <span className="text-[20px] font-bold text-gray-900">
          {data.filter(d => d.status === "PENDING_APPROVAL").length}
        </span>
      </div>
    </Card>
  </Col>

  {/* Under Review */}
  <Col xs={24} md={8}>
    <Card className={`${summaryCardClass} h-full`}>
      <div className="flex items-center justify-between h-full">
        <span className="text-xs text-gray-500">
          Under Review
        </span>

        <span className="text-[20px] font-bold text-gray-900">
          {data.filter(d => d.status === "PENDING_APPROVAL").length}
        </span>
      </div>
    </Card>
  </Col>

  {/* Approved Today */}
  <Col xs={24} md={8}>
    <Card className={`${summaryCardClass} h-full`}>
      <div className="flex items-center justify-between h-full">
        <span className="text-xs text-gray-500">
          Approved Today
        </span>

        <span className="text-[20px] font-bold text-gray-900">
          {data.filter(d => d.status === "APPROVED").length}
        </span>
      </div>
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


      <Modal
        open={previewModal}
        onCancel={() => setPreviewModal(false)}
        footer={null}
        width={900}
        bodyStyle={{ padding: 0, height: "80vh" }}
      >
        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="font-semibold text-lg truncate">
            Preview: {previewFileName}
          </div>

          <div className="flex gap-2">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(previewFileName)}
            >
              Download
            </Button>

            <Button onClick={() => setPreviewModal(false)}>Close</Button>
          </div>
        </div>

        {/* PREVIEW */}
        <iframe
          src={`${previewUrl}#toolbar=0`}
          className="w-full h-[calc(100%-70px)] border-0"
          onError={() => message.error("Preview failed")}
        />
      </Modal>


      {/* ===== DRAWER (UI UNCHANGED) ===== */}
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
        footer={
          <div className="flex justify-end">
            <div className="flex gap-2">
              <Button
                type="primary"
                onClick={async () => {
                  if (!selectedRow) return;

                  await ReimbursementService.updateStatus(
                    selectedRow.id,
                    "APPROVED"
                  );

                  message.success("Request approved successfully");
                  reload();
                  setOpen(false);
                }}
              >
                Approve
              </Button>

              <Button
                danger
                onClick={async () => {
                  if (!selectedRow) return;

                  await ReimbursementService.updateStatus(
                    selectedRow.id,
                    "REJECTED"
                  );

                  message.success("Request rejected");
                  reload();
                  setOpen(false);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        }



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

                {/* 🔹 MANAGER STATUS (NORMAL SUMMARY ROW) */}
                <div className="flex justify-between text-xs py-1 px-2">
                  <span className="text-gray-500 font-medium">
                    Manager Status
                  </span>

                  <span className="font-bold text-gray-900 ml-4">
                    {getManagerStatusTag(selectedRow.status)}
                  </span>
                </div>


                {/* 🔹 FINANCE STATUS (ADDED BELOW MANAGER) */}
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

            {/* ================= ONLY SCROLLABLE AREA ================= */}
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
