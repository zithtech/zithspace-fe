"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Select,
  Tag,
  Button,
  Dropdown,
  Divider,
  Modal,
  Drawer,
  Input,
  Avatar,
  message,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CloseOutlined,
  CheckOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import { useQueryClient } from "@tanstack/react-query";

//import { TimesheetService } from "@/services/timesheetService";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useTimesheets, useTimesheetById } from "@/hooks/useTimesheet";
import { reviewTimesheet } from "@/services/timesheetService";

interface TimesheetRowUI {
  id?: string;
  key: string;
  day: string;
  date: string;
  // date: Dayjs;
  projectId?: string;
  taskId?: string;
  description?: string;
  hours?: number;
  billable?: boolean;
  // status?: "Draft" | "Submitted";
  status?: "Draft" | "Submitted" | "Approved" | "Rejected";
  isSummary?: boolean;
  employeeName: string; // ✅ Add this
  projectName?: string;
  taskName?: string;
}

const { Title, Text } = Typography;

// type Props = {
//   goToSubmitTimesheet: (
//     id?: string,
//     mode?: "edit" | "resubmit" | "view",
//   ) => void;
// };
type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
  onActionCompleted?: () => void;
};

export default function TeamsTab({
  goToSubmitTimesheet,
  onActionCompleted,
}: Props) {
  const router = useRouter();

  /* ---------------- STATE ---------------- */
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(
  //   null,
  // );
  // const { data: timesheetData, isLoading: isTimesheetLoading } =
  //   useTimesheetById(selectedTimesheetId || undefined);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
  const [status, setStatus] = useState<TimesheetStatus>("Draft");
  const [rejectedReason, setRejectedReason] = useState("");
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const searchParams = useSearchParams();
  const timesheetId = searchParams.get("id");

  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };
  const openDesc = (desc: string) => {
    setSelectedDesc(desc);
    setIsDescModalOpen(true);
  };

  const timesheetRows: TimesheetRowUI[] = selectedTimesheet
    ? selectedTimesheet.rows.map((row: any, index: number) => ({
        key: row.id,
        id: row.id,
        day: row.day,
        date: dayjs(selectedTimesheet.weekStart)
          .add(index, "day")
          .format("MMM DD"),
        employeeName:
          selectedTimesheet.employeeName ||
          selectedTimesheet.user?.name ||
          "Unknown",
        projectName: row.projectName,
        taskName: row.taskName,
        description: row.description || "",
        hours: row.hours,
        status: selectedTimesheet.status,
        billable: row.billable,
      }))
    : [];

  const { data: timesheetsData, isLoading } = useTimesheets();
  const timesheets = timesheetsData?.data || [];

  const filteredData = useMemo(() => {
    return timesheets.filter((t) => {
      const userId = t.user?.id;

      const memberOk =
        selectedMembers.length === 0 ||
        (userId ? selectedMembers.includes(userId) : false);

      const weekOk = selectedWeek
        ? dayjs(t.weekStart).startOf("week").isSame(dayjs(selectedWeek), "day")
        : true;

      return memberOk && weekOk;
    });
  }, [timesheets, selectedMembers, selectedWeek]);
  useEffect(() => {
    console.log("Teams Table Data:", filteredData);
  }, [filteredData]);
  const members = useMemo(() => {
    const map = new Map();
    timesheets.forEach((t) => {
      if (t.user) {
        map.set(t.user.id, {
          id: t.user.id,
          name: t.user.name,
        });
      }
    });
    return Array.from(map.values());
  }, [timesheets]);

  const weekOptions = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < 6; i++) {
      const start = dayjs().startOf("week").subtract(i, "week"); // Sunday
      const end = start.add(6, "day"); // Saturday

      weeks.push({
        label: `${start.format("MMM DD")} – ${end.format("MMM DD")}`,
        value: start.format("YYYY-MM-DD"), // IMPORTANT
      });
    }
    return weeks;
  }, []);

  /* ---------------- COUNTS ---------------- */
  const approvedCount = filteredData.filter(
    (t) => t.status === "APPROVED",
  ).length;

  const pendingCount = filteredData.filter(
    (t) => t.status === "SUBMITTED",
  ).length;
    const rejectedCount = filteredData.filter(
    (t) => t.status === "REJECTED",
  ).length;

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "Employee",
      render: (_: any, r: any) => (
        <>
          <strong>{r.user?.name}</strong>
          <br />
          <span style={{ color: "#888" }}>{r.user?.email}</span>
        </>
      ),
    },

    {
      title: "Date",
      render: (_: any, r: any) => {
        const start = dayjs(r.weekStart);
        const end = start.add(6, "day");
        return `${start.format("MMM DD")} – ${end.format("MMM DD")}`;
      },
    },

    {
      title: "Status",
      render: (_: any, r: any) => {
        if (r.status === "APPROVED") {
          return (
            <Space>
              {/* <Tag color="green">Approved</Tag>
              <CheckCircleOutlined style={{ color: "#52c41a" }} /> */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4, // 👈 control distance here
                }}
              >
                <Tag color="green" style={{ marginRight: 0 }}>
                  Approved
                </Tag>
                {/* <CheckCircleOutlined style={{ color: "#52c41a" }} /> */}
              </span>
            </Space>
          );
        }

        if (r.status === "REJECTED") {
          return (
            <Space>
              <Tag color="red">Rejected</Tag>
              {/* <WarningOutlined style={{ color: "#fa8c16" }} /> */}
            </Space>
          );
        }

        if (r.status === "SUBMITTED") {
          return <Tag color="orange">Submitted</Tag>;
        }

        return <Tag color="blue">Draft</Tag>;
      },
    },

    {
      title: "Total Hours",
      dataIndex: "totalHours",
      render: (h: number) => `${h}h`,
    },
    {
      title: "Leave",
      dataIndex: "leave",
    },
    {
      title: "Actions",
      render: (_: any, r: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View",
                // onClick: () => {
                //   setSelectedTimesheetId(r.id); // save the timesheet ID
                //   setIsModalOpen(true); // open modal
                // },
                onClick: () => {
                  setSelectedTimesheet(r); // 👈 store full timesheet
                  setIsModalOpen(true);
                },
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTimesheet(null);
  };

  const handleExport = (rows: TimesheetRowUI[]) => {
    if (!rows.length) return;

    const headers = [
      "Date",
      "Day",
      "Employee",
      "Project",
      "Task",
      "Description",
      "Hours",
      "Billable",
      "Status",
    ];

    const csvRows = rows.map((r) => [
      r.date,
      r.day,
      r.employeeName,
      r.projectName ?? "",
      r.taskName ?? "",
      r.description ?? "",
      r.hours ?? 0,
      r.billable ? "Yes" : "No",
      r.status ?? "Draft",
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map(String).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timesheet.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          borderRadius: 12,
        }}
        bodyStyle={{
          padding: "8px 12px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title
              level={4}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 0,
              }}
            >
              <TeamOutlined style={{ color: "#1677ff" }} />
              Team
            </Title>
            <Text style={{ marginLeft: "27px" }} type="secondary">
              Manage team timesheets and approvals
            </Text>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <Tag style={{ marginLeft: "27px" }} color="green">
                Approved: {approvedCount}
              </Tag>
              <Tag color="orange">Pending: {pendingCount}</Tag>
               <Tag color="red">Rejected: {rejectedCount}</Tag>
            </div>
          </div>

          {/* FILTERS (right corner) */}
          <div style={{ display: "flex", gap: 12 }}>
            <Select
              mode="multiple"
              placeholder="Select Members"
              style={{ width: 180 }}
              value={selectedMembers}
              onChange={setSelectedMembers}
              options={members.map((m) => ({
                label: m.name,
                value: m.id,
              }))}
            />
            <Select
              placeholder="Select Week (Sun – Sat)"
              style={{ width: 180 }}
              value={selectedWeek}
              onChange={setSelectedWeek}
              options={weekOptions}
              allowClear
            />
          </div>
        </div>

        <Divider />
        <div style={{ marginTop: 20 }}>
          <Table
            //className="compact-table"
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            size="small"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </Card>

      <Modal
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Left side: Avatar + Name + Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                size={48}
                style={{ backgroundColor: "#1677ff", fontWeight: 600 }}
              >
                {(
                  selectedTimesheet?.employeeName ||
                  selectedTimesheet?.user?.name ||
                  "Unknown"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {selectedTimesheet?.employeeName ||
                    selectedTimesheet?.user?.name ||
                    "Unknown"}
                </div>

                <Tag
                  style={{
                    fontSize: 11, // smaller text
                    fontWeight: 500,
                    padding: "0 6px", // reduce height
                    lineHeight: "18px", // compact height
                  }}
                  color={
                    selectedTimesheet?.status === "APPROVED"
                      ? "green"
                      : selectedTimesheet?.status === "REJECTED"
                        ? "red"
                        : selectedTimesheet?.status === "SUBMITTED"
                          ? "orange"
                          : "blue"
                  }
                >
                  {selectedTimesheet?.status || "Draft"}
                </Tag>
              </div>
            </div>

            {/* Right side: Approve / Reject Buttons */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-start",
                marginTop: 16,
              }}
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setRejectOpen(true);
                  setIsModalOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ backgroundColor: "#52c41a", border: "none" }}
                onClick={() => {
                  setApproveOpen(true);
                  setIsModalOpen(false);
                }}
              >
                Approve
              </Button>
              <Button
                size="small"
                style={{
                  backgroundColor: "#1677ff",
                  color: "#fff",
                  border: "none",
                }}
                icon={<ExportOutlined />}
                onClick={() => {
                  // Prepare rows for export
                  const exportRows: TimesheetRowUI[] = timesheetRows.map(
                    (r) => ({
                      ...r,
                      key: r.key || r.id || "row-" + Math.random(),
                      employeeName: r.employeeName || "Unknown",
                      status: r.status as
                        | "Draft"
                        | "Submitted"
                        | "Approved"
                        | "Rejected",
                    }),
                  );

                  handleExport(exportRows);
                  setIsModalOpen(false);
                }}
              >
                Export
              </Button>
            </div>
          </div>
        }
        open={isModalOpen}
        //onOk={closeModal}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
        ]}
        width={700}
      >
        {timesheetRows.length > 0 ? (
          <Table<TimesheetRowUI>
            columns={[
              { title: "Date", dataIndex: "date", key: "date" },
              {
                title: "Project",
                dataIndex: "projectName",
                key: "projectName",
              },
              { title: "Task", dataIndex: "taskName", key: "taskName" },
              {
                title: "Description",
                render: (_: any, r) => {
                  const preview = r.description
                    ? r.description.slice(0, 30)
                    : ""; // show first 30 chars
                  const hasMore = r.description && r.description.length > 30;

                  return (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span>
                        {preview}
                        {hasMore ? "..." : ""}
                      </span>
                      {r.description && r.description.length > 0 && (
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setSelectedDesc(r.description || ""); // set description
                            setIsDescModalOpen(true); // open modal
                          }}
                        />
                      )}
                    </div>
                  );
                },
                dataIndex: "description",
                key: "description",
              },
              { title: "Hours", dataIndex: "hours", key: "hours" },
            ]}
            dataSource={timesheetRows}
            rowKey="key"
            pagination={false}
            size="small"
          />
        ) : (
          <p>No data found</p>
        )}
      </Modal>

      {/* rejected drawer */}

      <Drawer
        title={
          <Space>
            <WarningOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
            <Text strong style={{ fontSize: 16 }}>
              Reject Timesheet Entries
            </Text>
          </Space>
        }
        placement="right"
        width={360}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        bodyStyle={{ paddingBottom: 80 }}
        closable={false}
        extra={
          <Button
            type="text"
            onClick={() => setRejectOpen(false)}
            icon={<CloseOutlined />}
          />
        }
      >
        {/* Description */}
        <Text type="secondary">
          Provide a reason for rejecting this timesheet. The employee will be
          notified and can make corrections.
        </Text>

        {/* Warning Card */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#fff7e6",
            border: "1px solid #ffe7ba",
            borderRadius: 10,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <WarningOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
          <Text>
            Rejected entries will be unlocked for editing. The employee must
            resubmit after making corrections.
          </Text>
        </div>

        {/* Quick Reasons */}
        <div style={{ marginTop: 28 }}>
          <Text strong style={{ fontSize: 15 }}>
            Quick Reasons
          </Text>

          <Space wrap size={10} style={{ marginTop: 14 }}>
            {[
              "Incorrect project selected",
              "Hours do not match task complexity",
              "Missing description",
              "Needs more detail",
            ].map((reason) => (
              <Button
                key={reason}
                onClick={() =>
                  setRejectReason((prev) =>
                    prev ? `${prev}\n• ${reason}` : `• ${reason}`,
                  )
                }
              >
                {reason}
              </Button>
            ))}
          </Space>
        </div>

        {/* Reason Input */}
        <div style={{ marginTop: 28 }}>
          <Text strong style={{ fontSize: 15 }}>
            Rejection Reason <Text type="danger">*</Text>
          </Text>

          <Input.TextArea
            rows={6}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why these entries are being rejected..."
            style={{ marginTop: 10, borderRadius: 8, resize: "none" }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          {/* <Button
            danger
            type="primary"
            loading={loading}
            disabled={!rejectReason}
            onClick={async () => {
              if (!timesheetId) return;

              try {
                setLoading(true);
                // await reviewTimesheet(timesheetId, "reject", rejectReason);
                await reviewTimesheet(timesheetId, "REJECTED", rejectReason);

                setStatus("Rejected"); // UI update
                setRejectOpen(false); // close drawer
                setRejectedReason(rejectReason);
                setRejectReason("");
                setShowRejectedModal(true); // success modal
              } catch (err) {
                console.error("Rejection failed:", err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Confirm Rejection
          </Button> */}
          <Button
            danger
            type="primary"
            loading={loading}
            disabled={!rejectReason}
            onClick={async () => {
              //if (!selectedTimesheetId) return;
              if (!selectedTimesheet?.id) return;

              try {
                setLoading(true);
                // await reviewTimesheet(
                //   selectedTimesheetId,
                //   "REJECTED",
                //   rejectReason,
                // );
                await reviewTimesheet(
                  selectedTimesheet.id,
                  "REJECTED",
                  rejectReason,
                );

                setStatus("Rejected");
                setRejectOpen(false);
                setRejectedReason(rejectReason);
                setRejectReason("");
                setShowRejectedModal(true);

                await queryClient.invalidateQueries({
                  queryKey: ["timesheets"],
                });
              } catch (err) {
                console.error("Rejection failed:", err);
              } finally {
                setLoading(false);
              }
            }}
          >
            Confirm Rejection
          </Button>

          <Modal
            open={showRejectedModal}
            onCancel={() => setShowRejectedModal(false)}
            footer={[
              <Button
                key="ok"
                type="primary"
                onClick={() => {
                  setShowRejectedModal(false);
                  setIsModalOpen(false);
                  onActionCompleted?.();
                }}
              >
                OK
              </Button>,
            ]}
            centered
            title={
              <Space>
                <WarningOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
                <Text strong>Timesheet Rejected</Text>
              </Space>
            }
          >
            <Text>
              Your timesheet has been rejected. Please review the reason below:
            </Text>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "#fff7e6",
                borderRadius: 8,
                border: "1px solid #ffe7ba",
              }}
            >
              <Text>{rejectedReason}</Text>
            </div>
          </Modal>

          <Modal
            open={approveOpen}
            onCancel={() => setApproveOpen(false)}
            centered
            footer={[
              <Button key="cancel" onClick={() => setApproveOpen(false)}>
                Cancel
              </Button>,
              // <Button
              //   key="confirm"
              //   type="primary"
              //   loading={loading}
              //   onClick={async () => {
              //     if (!timesheetId) return;

              //     try {
              //       setLoading(true);
              //       await reviewTimesheet(timesheetId, "APPROVED");

              //       setStatus("Approved"); // UI update
              //       setApproveOpen(false); // close modal
              //       setShowApprovedModal(true); // success modal
              //     } catch (err) {
              //       console.error("Approval failed:", err);
              //     } finally {
              //       setLoading(false);
              //     }
              //   }}
              // >
              //   Confirm Approval
              // </Button>
              <Button
                key="confirm"
                type="primary"
                loading={loading}
                onClick={async () => {
                  //if (!selectedTimesheetId) return;
                  if (!selectedTimesheet?.id) return;

                  try {
                    setLoading(true);
                    //await reviewTimesheet(selectedTimesheetId, "APPROVED");
                    await reviewTimesheet(selectedTimesheet.id, "APPROVED");

                    setStatus("Approved");
                    setApproveOpen(false);
                    setShowApprovedModal(true);
                    await queryClient.invalidateQueries({
                      queryKey: ["timesheets"],
                    });
                  } catch (err) {
                    console.error("Approval failed:", err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Confirm Approval
              </Button>,
            ]}
            title={
              <Space>
                <CheckCircleOutlined
                  style={{ color: "#52c41a", fontSize: 18 }}
                />
                <Text strong>Approve Timesheet</Text>
              </Space>
            }
          >
            <Text>
              Are you sure you want to approve this timesheet? Once approved, it
              cannot be edited.
            </Text>
          </Modal>
          {/* //approve success modal */}
          <Modal
            open={showApprovedModal}
            onCancel={() => setShowApprovedModal(false)}
            centered
            footer={[
              <Button
                key="ok"
                type="primary"
                onClick={() => {
                  setShowApprovedModal(false);
                  setIsModalOpen(false);
                  onActionCompleted?.();
                }}
              >
                OK
              </Button>,
            ]}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Timesheet Approved
                </Text>
                <br />
                <Text type="secondary">
                  The timesheet has been successfully approved.
                </Text>
              </div>
            </div>
          </Modal>

          <Modal
            title="Description"
            open={isDescModalOpen}
            onCancel={closeDesc}
            footer={null}
            width={600}
          >
            <p style={{ whiteSpace: "pre-wrap" }}>{selectedDesc}</p>
          </Modal>
        </div>
      </Drawer>
    </div>
  );
}
