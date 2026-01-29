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



const { Title, Text } = Typography;

/* ------------------ Data ------------------ */
const dataSource = [
  {
    key: "1",
    weekStart: "2026-01-19",
    status: "Rejected",
    approvedBy: "-",
    createdAt: "2026-01-12",
    totalHours: "40h",
    leave: "0",
  },
  {
    key: "2",
    weekStart: "2026-01-12",
    status: "Approved",
    approvedBy: "Manager",
    createdAt: "2026-01-06",
    totalHours: "40h",
    leave: "0",
  },
];

export default function TimesheetsPage() {
  const searchParams = useSearchParams();

  const router = useRouter();
  const [dataSource, setDataSource] = useState<any[]>([]);
  // For showing the rejection reason modal
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [currentRejectReason, setCurrentRejectReason] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTimesheet, setPreviewTimesheet] = useState<any | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const deleteMutation = useDeleteTimesheet();
  const { data: previewTimesheets, refetch: refetchPreview } = useTimesheetById(
    previewId || undefined,
  );
  const { data: allTimesheets, isLoading } = useTimesheets();

  // useEffect(() => {
  //   loadTimesheets();
  // }, []);

  // const loadTimesheets = async () => {
  //   const list = await TimesheetService.getAll();
  //   console.log("list", list[0]);

  //   setDataSource(
  //     list.map((t) => ({
  //       key: t.id,
  //       weekStart: t.weekStart,
  //       status: t.status,
  //       approvedBy: t.status === "Approved" ? "Manager" : "-", // default value

  //       createdAt: dayjs(t.createdAt).format("YYYY-MM-DD"),
  //       totalHours: `${t.totalHours}h`,
  //       leave: "0",
  //       rejectReason: t.rejectReason || "", // important!
  //     })),
  //   );
  // };
  useEffect(() => {
    if (allTimesheets?.data) {
      setDataSource(
        allTimesheets.data.map((t) => ({
          key: t.id,
          weekStart: t.weekStart,
          status: t.status,
          approvedBy: t.status === "APPROVED" ? "Manager" : "-",
          createdAt: dayjs(t.createdAt).format("YYYY-MM-DD"),
          totalHours: `${t.totalHours}h`,
          leave: "0",
          rejectReason: t.rejectReason || "",
        })),
      );
    }
  }, [allTimesheets]);

  /* ------------------ Delete ------------------ */
  // const handleDelete = async (id: string) => {
  //   await TimesheetService.delete(id);
  //   loadTimesheets(); // refresh table
  // };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        console.log("Deleted successfully");
        // no need to manually reload — `invalidateQueries` handles it
      },
    });
  };

  const previewColumns = [
    {
      title: "Day",
      dataIndex: "day",
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
              {status === "Approved" && (
                <>
                  <Tag color="green">Approved</Tag>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                </>
              )}

              {status === "Rejected" && (
                <>
                  <Tag color="red">Rejected</Tag>
                  <WarningOutlined
                    style={{ color: "#fa8c16", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentRejectReason(record.rejectReason);
                      setShowRejectReasonModal(true);
                    }}
                  />
                </>
              )}

              {status === "Submitted" && <Tag color="orange">Submitted</Tag>}
              {status === "Draft" && <Tag color="blue">Draft</Tag>}
            </Space>
          );
        },
      },

      {
        title: "Approved By",
        dataIndex: "approvedBy",
      },
      {
        title: "Created Date",
        dataIndex: "createdAt",
      },
      {
        title: "Total Hours",
        dataIndex: "totalHours",
      },
      {
        title: "Leave",
        dataIndex: "leave",
      },
      {
        title: "Actions",
        align: "center" as const,
        render: (_: any, record: any) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                // {
                //   key: "preview",
                //   icon: <EyeOutlined />,
                //   label: "Preview",
                //   onClick: async () => {
                //     const sheet = await TimesheetService.getById(record.key);
                //     setPreviewTimesheet(sheet);
                //     setPreviewOpen(true);
                //   },
                // },
                {
                  key: "preview",
                  icon: <EyeOutlined />,
                  label: "Preview",
                  onClick: () => {
                    setPreviewId(record.key); // set the ID to fetch
                    setPreviewOpen(true); // open the modal
                    refetchPreview(); // fetch the timesheet
                  },
                },

                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  //   disabled:
                  //     record.status === "Submitted" ||
                  //     record.status === "Approved",
                  disabled: record.status === "Approved",
                  onClick: () =>
                    router.push(
                      `/timesheets/timesheet/create?id=${record.key}&mode=edit`,
                    ),
                },

                {
                  key: "resubmit",
                  icon: <RedoOutlined />,
                  label: "Resubmit",
                  //   disabled: record.status !== "Rejected",
                  onClick: () =>
                    // router.push(
                    //   `/timesheets/timesheet/create?id=${record.key}&mode=edit`,
                    // ),
                    router.push(
                      `/timesheets/timesheet/create?id=${record.key}&mode=resubmit`,
                    ),
                },

                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                  onClick: () => handleDelete(record.key),
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
    return dataSource.filter((item) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        item.employeeName?.toLowerCase().includes(search) ||
        item.status?.toLowerCase().includes(search) ||
        dayjs(item.weekStart).format("MMM DD").toLowerCase().includes(search);

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [dataSource, searchText, statusFilter]);

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        {/* ================= Header ================= */}
        <Space
          style={{ width: "100%", justifyContent: "space-between" }}
          align="center"
        >
          <Title level={3} style={{ margin: 0 }}>
            Timesheets
          </Title>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/timesheets/timesheet/create")}
          >
            Create Timesheet
          </Button>
        </Space>

        {/* ================= Filters ================= */}
        <Card style={{ marginTop: 16 }}>
          <Space wrap align="center">
            {/* <Input
              prefix={<SearchOutlined />}
              placeholder="Search timesheets"
              style={{ width: 240 }}
            /> */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search timesheets"
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            {/* <Button icon={<FilterOutlined />}>Filter</Button> */}
            <Dropdown
              menu={{
                items: [
                  { key: "all", label: "All" },
                  { key: "Approved", label: "Approved" },
                  { key: "Rejected", label: "Rejected" },
                  { key: "Submitted", label: "Submitted" },
                ],
                onClick: ({ key }) =>
                  setStatusFilter(key === "all" ? null : key),
              }}
            >
              <Button type="primary" icon={<FilterOutlined />}>
                {statusFilter ?? "Filter"}
              </Button>
            </Dropdown>
          </Space>
        </Card>

        {/* ================= Table ================= */}
        <Card style={{ marginTop: 16 }}>
          <Table
            columns={columns}
            // dataSource={dataSource}
            dataSource={filteredData}
            pagination={{ pageSize: 5 }}
            rowKey="key"
          />
          {/* <Table
            columns={columns}
            dataSource={dataSource}
            pagination={{ pageSize: 5 }}
          /> */}
        </Card>

        <Modal
          open={showRejectReasonModal}
          onCancel={() => setShowRejectReasonModal(false)}
          footer={
            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                danger
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
            {/* Accent Bar */}
            <div
              style={{
                width: 6,
                background: "linear-gradient(180deg, #ff4d4f, #fa541c)",
              }}
            />

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
                  borderLeft: "4px solid #ff4d4f",
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
          bodyStyle={{
            padding: 24,
            background: "#fcfcfc",
          }}
          footer={[
            <Button key="close" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>,
          ]}
          title={
            previewTimesheet && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Avatar
                  size={48}
                  style={{
                    backgroundColor: "#1677ff",
                    fontWeight: 600,
                  }}
                >
                  {previewTimesheet.employeeName?.[0]}
                </Avatar>

                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {previewTimesheet.employeeName}
                  </Title>
                  <Tag color="blue" style={{ marginTop: 4 }}>
                    {dayjs(previewTimesheet.weekStart).format("MMM DD")} –{" "}
                    {dayjs(previewTimesheet.weekEnd).format("MMM DD, YYYY")}
                  </Tag>
                </div>
              </div>
            )
          }
        >
          {/* Summary Section */}
          {previewTimesheet && (
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
              <Text>Total Hours: {previewTimesheet.totalHours}h</Text>

              <Tag
                color={
                  previewTimesheet.status === "Approved"
                    ? "green"
                    : previewTimesheet.status === "Rejected"
                      ? "red"
                      : "orange"
                }
              >
                {previewTimesheet.status}
              </Tag>
            </div>
          )}

          {/* Timesheet Table */}
          <Table
            columns={previewColumns}
            dataSource={previewTimesheet?.rows || []}
            pagination={false}
            bordered
            rowKey="key"
            size="middle"
            rowClassName={(_, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </Modal>
      </div>
    </MainLayout>
  );
}
