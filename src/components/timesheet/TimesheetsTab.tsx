"use client";

import {
  Card,
  Typography,
  Space,
  Input,
  Button,
  Table,
  Tag,
  Dropdown,
  Modal,
  Avatar,
  Divider,
  App,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  RedoOutlined,
  DeleteOutlined,
  MoreOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
//import { TimesheetService } from "@/services/timesheetService";
import { useSearchParams } from "next/navigation";
import {
  useTimesheets,
  useDeleteTimesheet,
  useTimesheetById,
} from "@/hooks/useTimesheet";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { Title, Text } = Typography;

/* ------------------ Data ------------------ */
type Props = {
  goToSubmitTimesheet: (id?: string, mode?: "edit" | "resubmit") => void;
};

export default function TimesheetsTab({ goToSubmitTimesheet }: Props) {
  const searchParams = useSearchParams();

  const router = useRouter();
  const [dataSource, setDataSource] = useState<any[]>([]);
  // For showing the rejection reason modal
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentRejectReason, setCurrentRejectReason] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const deleteMutation = useDeleteTimesheet();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { message, notification } = App.useApp();
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [selectedDesc, setSelectedDesc] = useState("");
  const closeDesc = () => {
    setIsDescModalOpen(false);
    setSelectedDesc("");
  };
  const { data: previewTimesheetData, refetch } = useTimesheetById(
    previewId || undefined,
  );

  const { data: allTimesheets, isLoading } = useTimesheets();
  const [tableHeight, setTableHeight] = useState(0);

  useEffect(() => {
    const calculateHeight = () => {
      const vh = window.innerHeight; // full viewport height
      const headerHeight = 160; // approx header + filters + tags + margins
      const paginationHeight = 54; // antd table pagination default height
      const padding = 24 * 2; // outer div padding top + bottom
      setTableHeight(vh - headerHeight - paginationHeight - padding);
    };

    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);
  useEffect(() => {
    if (previewId) {
      refetch();
    }
  }, [previewId, refetch]);
  // const tableData = useMemo(() => {
  //   if (!allTimesheets?.data) return [];
  //   console.log("TIMESHEETS FROM API 👉", allTimesheets.data);

  //   return allTimesheets.data.map((t) => ({
  //     key: t.id,
  //     weekStart: t.weekStart,
  //     employeeName: t.user?.name || "-",
  //     status: t.status,
  //     //approvedBy: t.status === "APPROVED" ? "Manager" : "-",
  //     //approvedBy: t.approvedBy?.name || "-",
  //     approvedBy: t.approvedBy,
  //     createdAt: dayjs(t.createdAt).format("YYYY-MM-DD"),
  //     totalHours: `${t.totalHours}h`,
  //     //leave: "0",
  //     leave: t.leaveCount || 0,
  //     rejectReason: t.rejectReason || "",
  //   }));
  // }, [allTimesheets]);
  const tableData = useMemo(() => {
  if (!allTimesheets?.data) return [];
  
  return allTimesheets.data.map((t) => ({
    key: t.id,
    weekStart: t.weekStart,
    employeeName: t.user?.name || "-",
    status: t.status,
    approvedBy: t.approvedBy,
    createdAt: dayjs(t.createdAt).format("YYYY-MM-DD"),
    totalHours: `${t.totalHours}h`,
    // ✅ This will now show the correct value from the database
    leave: t.leaveCount || 0,
    rejectReason: t.rejectReason || "",
  }));
}, [allTimesheets]);
  
  const dayIndexMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const previewColumns = [
    {
      title: "Date",
      render: (_: any, r: any, index: number) => {
        if (!previewTimesheetData?.weekStart) return "-";

        // Start of the week
        const weekStart = dayjs(previewTimesheetData.weekStart).startOf("week");

        // Display date = weekStart + row index
        const displayDate = weekStart.add(index, "day").format("MMM DD");

        return displayDate;
      },
    },

    {
      title: "Project",
      dataIndex: "projectName",
    },
    {
      title: "Task",
      dataIndex: "taskName",
    },
    {
      title: "Description",
      render: (_: any, row: any) => {
        const preview = row.description ? row.description.slice(0, 30) : ""; // first 30 chars
        const hasMore = row.description && row.description.length > 30;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>
              {preview}
              {hasMore ? "..." : ""}
            </span>
            {row.description && row.description.length > 0 && (
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedDesc(row.description || ""); // set modal content
                  setIsDescModalOpen(true); // open modal
                }}
              />
            )}
          </div>
        );
      },
      dataIndex: "description",
    },
    {
      title: "Hours",
      dataIndex: "hours",
      render: (h: number) => `${h}h`,
    },
    {
      title: "Billable",
      dataIndex: "billable",
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
  ];
// In TimesheetsTab.tsx - Update previewColumns


  /* ------------------ Columns ------------------ */
  const columns = useMemo(
    () => [
      {
        title: "Date",
        render: (_: any, record: any) => {
          if (!record.weekStart) return "-";

          const start = dayjs(record.weekStart).day(0);
          const end = dayjs(record.weekStart).day(6);

          return (
            <span>
              {start.format("MMM DD")} – {end.format("MMM DD")}
            </span>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (status: string, record: any) => {
          return (
            <Space>
              {status === "APPROVED" && (
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
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                </span>
              )}

              {status === "REJECTED" && (
                <>
                  <Tag color="red">Rejected</Tag>
                  <EyeOutlined
                    style={{ color: "#fa8c16", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentRejectReason(record.rejectReason);
                      console.log("rejected", record.rejectReason);
                      setShowRejectReasonModal(true);
                    }}
                  />
                </>
              )}

              {status === "SUBMITTED" && <Tag color="orange">Submitted</Tag>}
              {status === "DRAFT" && <Tag color="blue">Draft</Tag>}
            </Space>
          );
        },
      },
      {
        title: "Approved By",
        dataIndex: "approvedBy",
        render: (approvedBy: any) => approvedBy?.name || "-",
      },
      {
        title: "Created Date",
        dataIndex: "createdAt",
      },
      {
        title: "Total Hours",
        dataIndex: "totalHours",
      },
      // {
      //   title: "Leave",
      //   dataIndex: "leave",
      // },
      // ✅ NEW COLUMN: Leave (added without changing anything else)
      {
        title: "Leave",
        dataIndex: "leave",
        render: (leave: number) => {
          if (leave > 0) {
            return (
              <Tag color="red" icon={<ClockCircleOutlined />}>
                {leave} {leave === 1 ? "Day" : "Days"}
              </Tag>
            );
          }
          return <Tag color="default">0 Days</Tag>;
        },
      },
      {
        title: "Actions",
        align: "center" as const,
        render: (_: any, record: any) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "preview",
                  icon: <EyeOutlined />,
                  label: "Preview",
                  onClick: () => {
                    setPreviewId(record.key); // set the ID to fetch
                    setPreviewOpen(true); // open the modal
                    //refetchPreview(); // fetch the timesheet
                  },
                },

                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  disabled: ["APPROVED", "REJECTED"].includes(record.status),
                  // inside Edit action
                  onClick: () => {
                    goToSubmitTimesheet(record.key, "edit");
                  },
                },

                {
                  key: "resubmit",
                  icon: <RedoOutlined />,
                  label: "Resubmit",
                  onClick: () => {
                    goToSubmitTimesheet?.();
                    setPreviewId(record.key); // for resubmission
                  },
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                  onClick: () => {
                    setDeleteId(record.key);
                    setShowDeleteModal(true); // open confirmation modal
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [router],
  );

  const filteredData = useMemo(() => {
    //return dataSource.filter((item) => {
    return tableData.filter((item) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        item.employeeName?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search) ||
        dayjs(item.weekStart).format("MMM DD").toLowerCase().includes(search);

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tableData, searchText, statusFilter]);
  const approvedCount = filteredData.filter(
    (t) => t.status === "APPROVED",
  ).length;

  const pendingCount = filteredData.filter(
    (t) => t.status === "SUBMITTED",
  ).length;
  const rejectedCount = filteredData.filter(
    (t) => t.status === "REJECTED",
  ).length;

  const getPreviewRows = () => {
    if (previewTimesheetData?.rows?.length) return previewTimesheetData.rows;

    // If no data, create 7 empty rows for the week
    return Array.from({ length: 7 }).map((_, index) => ({
      id: index,
      projectName: "-",
      taskName: "-",
      description: "-", // <-- important
      hours: 0,
      billable: false,
    }));
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: "6px 10px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <Title
              level={4}
              style={{
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FileTextOutlined style={{ color: "#1677ff" }} />
              Timesheets
            </Title>

            <Text type="secondary" style={{ marginLeft: 28, fontSize: 14 }}>
              Manage and track employee timesheets
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag style={{ marginLeft: "27px" }} color="green">
                Approved: {approvedCount}
              </Tag>
              <Tag color="orange">Pending: {pendingCount}</Tag>
              <Tag color="red">Rejected: {rejectedCount}</Tag>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search timesheets"
              style={{ width: 220 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Dropdown
              menu={{
                items: [
                  { key: "all", label: "All" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "REJECTED", label: "Rejected" },
                  { key: "SUBMITTED", label: "Submitted" },
                ],
                onClick: ({ key }) =>
                  setStatusFilter(key === "all" ? null : key),
              }}
            >
              <Button
                style={{ width: 100, padding: "8px 8px" }}
                icon={<FilterOutlined />}
              >
                {statusFilter ?? "Filter"}
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={loading}
              onClick={() => goToSubmitTimesheet()} // no id, opens create mode
            >
              Create Timesheet
            </Button>
          </div>
        </div>

        <Divider style={{ margin: "8px 0" }} />

        <Table
          className="compact-table"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          rowKey="key"
          size="small"
          bordered
        />
      </Card>

      <Modal
        open={showRejectReasonModal}
        onCancel={() => setShowRejectReasonModal(false)}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              type="primary"
              danger={false}
              onClick={() => setShowRejectReasonModal(false)}
              style={{ minWidth: 120 }}
            >
              Close
            </Button>
          </div>
        }
        centered
        width={450}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ display: "flex" }}>
          {/* Content */}
          <div style={{ padding: 24, flex: 1 }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <WarningOutlined style={{ fontSize: 22, color: "#ff4d4f" }} />
              <div>
                <Text strong style={{ fontSize: 18, display: "block" }}>
                  Rejection Reason
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Manager feedback for this timesheet
                </Text>
              </div>
            </div>

            {/* Reason Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 18,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#262626",
                whiteSpace: "pre-line",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                minHeight: 90,
              }}
            >
              {currentRejectReason ||
                "No rejection reason provided by manager."}
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={1000}
        centered
        bodyStyle={{ padding: 24, background: "#fcfcfc" }}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            Close
          </Button>,
        ]}
        title={
          previewTimesheetData && (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={48}
                style={{ backgroundColor: "#1677ff", fontWeight: 600 }}
              >
                {previewTimesheetData.user?.name?.charAt(0).toUpperCase()}
              </Avatar>

              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {/* //{previewTimesheetData.employeeName} */}
                  {previewTimesheetData.user?.name || "-"}
                </Title>
                <Tag color="blue" style={{ marginTop: 4 }}>
                  {dayjs(previewTimesheetData.weekStart).format("MMM DD")} –{" "}
                  {dayjs(previewTimesheetData.weekEnd).format("MMM DD, YYYY")}
                </Tag>
              </div>
            </div>
          )
        }
      >
        {/* Summary Section */}
        {previewTimesheetData && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: "#f5f7fa",
              borderRadius: 6,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            <Text>Total Hours: {previewTimesheetData.totalHours}h</Text>
            <Tag
              color={
                previewTimesheetData.status === "APPROVED"
                  ? "green"
                  : previewTimesheetData.status === "REJECTED"
                    ? "red"
                    : "orange"
              }
            >
              {previewTimesheetData.status}
            </Tag>
          </div>
        )}

        {/* Timesheet Table */}
        <Table
          columns={previewColumns}
          //   dataSource={previewTimesheetData?.rows || []}
          dataSource={getPreviewRows()}
          pagination={false}
          bordered
          rowKey="id"
          size="middle"
          rowClassName={(_, index) =>
            index % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
          loading={!previewTimesheetData} // optional, shows spinner while loading
        />
      </Modal>
      <Modal
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        centered
        title="Confirm Deletion"
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            loading={loading}
            danger
            onClick={() => {
              if (deleteId) {
                deleteMutation.mutate(deleteId, {
                  onSuccess: () => {
                    setShowDeleteModal(false);
                    message.success("Timesheet deleted successfully!");
                  },
                });
              }
            }}
          >
            Delete
          </Button>,
        ]}
      >
        <Text>Are you sure you want to delete this timesheet?</Text>
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
  );
}
