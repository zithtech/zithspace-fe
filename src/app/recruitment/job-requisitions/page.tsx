"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Dropdown,
  message,
  Card,
  Modal,
  Avatar,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  ExclamationCircleFilled,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  RecruitmentService,
  JobRequisitionData,
  RequisitionFilters,
  SelectOption,
} from "@/services/recruitment.service";
import dayjs from "dayjs";

const { Option } = Select;

const statusColors: Record<string, string> = {
  Open: "green",
  "On Hold": "orange",
  Closed: "default",
  Filled: "blue",
};

const priorityColors: Record<string, string> = {
  High: "red",
  Medium: "orange",
  Low: "blue",
};

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<JobRequisitionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [clients, setClients] = useState<SelectOption[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const router = useRouter();
  const [modal, contextHolder] = Modal.useModal();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [clientFilter, setClientFilter] = useState<string | undefined>();
  const [visaFilter, setVisaFilter] = useState<string | undefined>();
  const [startDateFrom, setStartDateFrom] = useState<string | undefined>();
  const [startDateTo, setStartDateTo] = useState<string | undefined>();

  const fetchRequisitions = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        setLoading(true);
        const filters: RequisitionFilters = {
          page,
          limit: pageSize,
        };
        if (search) filters.search = search;
        if (statusFilter) filters.status = statusFilter;
        if (priorityFilter) filters.priority = priorityFilter;
        if (clientFilter) filters.clientId = clientFilter;
        if (visaFilter) filters.visa = visaFilter;
        if (startDateFrom) filters.startDateFrom = startDateFrom;
        if (startDateTo) filters.startDateTo = startDateTo;

        const result = await RecruitmentService.getAllRequisitions(filters);
        setRequisitions(result.data || []);
        setPagination({
          current: result.pagination.page,
          pageSize: result.pagination.limit,
          total: result.pagination.total,
        });
      } catch (error) {
        console.error("Failed to fetch requisitions", error);
        message.error("Failed to load Job Requisitions.");
        setRequisitions([]);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, priorityFilter, clientFilter, visaFilter, startDateFrom, startDateTo]
  );

  useEffect(() => {
    fetchRequisitions(1, pagination.pageSize);
  }, [fetchRequisitions, pagination.pageSize]);

  // Load clients for filter dropdown
  useEffect(() => {
    RecruitmentService.getClientsForSelect()
      .then(setClients)
      .catch(() => {});
  }, []);

  const handleDelete = (id: string, ticketId: string) => {
    modal.confirm({
      title: "Delete Job Requisition",
      icon: <ExclamationCircleFilled />,
      content: `Are you sure you want to delete ${ticketId}? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await RecruitmentService.deleteRequisition(id);
          message.success("Job Requisition deleted successfully.");
          fetchRequisitions(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error(error);
          message.error("Failed to delete Job Requisition.");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    modal.confirm({
      title: "Delete Multiple Requisitions",
      icon: <ExclamationCircleFilled />,
      content: `Are you sure you want to delete ${selectedRowKeys.length} selected requisitions? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await RecruitmentService.deleteBatchRequisitions(selectedRowKeys as string[]);
          message.success("Selected requisitions deleted successfully.");
          setSelectedRowKeys([]);
          fetchRequisitions(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error(error);
          message.error("Failed to delete selected requisitions.");
        }
      },
    });
  };

  const menuItems = (record: any) => [
    {
      key: "view",
      label: "View Details",
      onClick: () => router.push(`/recruitment/job-requisitions/${record.id}`),
    },
    {
      key: "edit",
      label: "Edit",
      onClick: () => router.push(`/recruitment/job-requisitions/${record.id}/edit`),
    },
    { key: "assign", label: "Assign Recruiters" },
    { key: "close", label: "Close Ticket" },
    {
      key: "delete",
      label: "Delete",
      danger: true,
      onClick: () => handleDelete(record.id, record.ticketId),
    },
  ];

  const columns = [
    {
      title: "Ticket ID",
      dataIndex: "ticketId",
      key: "ticketId",
      width: 130,
      render: (text: string, record: any) => (
        <a
          style={{ fontWeight: 600, color: "#1677ff" }}
          onClick={() => router.push(`/recruitment/job-requisitions/${record.id}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 200,
    },
    {
      title: "Client",
      key: "client",
      width: 140,
      render: (_: any, record: any) =>
        record.client?.name || record.client?.company || "N/A",
    },
    {
      title: "Openings",
      dataIndex: "openingsCount",
      key: "openingsCount",
      width: 90,
      align: "center" as const,
    },
    {
      title: "Experience",
      dataIndex: "experience",
      key: "experience",
      width: 110,
    },
    {
      title: "Location",
      dataIndex: "jobLocation",
      key: "jobLocation",
      width: 180,
    },
    {
      title: "Visa",
      dataIndex: "allowedVisaTypes",
      key: "allowedVisaTypes",
      width: 180,
      render: (visas: string[]) => (
        <Space size={[0, 4]} wrap>
          {visas?.map((visa) => (
            <Tag key={visa} color="green" style={{ fontSize: "11px" }}>
              {visa}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Bill Rate",
      dataIndex: "maxBillRate",
      key: "maxBillRate",
      width: 100,
      render: (rate: number) => (rate ? `$${rate}/hr` : "-"),
    },
    {
      title: "Recruiter Rate",
      dataIndex: "recruiterRate",
      key: "recruiterRate",
      width: 120,
      render: (rate: number) => (rate ? `$${rate}/hr` : "-"),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 110,
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD") : "-",
    },
    {
      title: "Deadline",
      dataIndex: "submissionDeadline",
      key: "submissionDeadline",
      width: 110,
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD") : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || "default"}>{priority}</Tag>
      ),
    },
    {
      title: "Recruiters",
      key: "assignedRecruiters",
      width: 120,
      render: (_: any, record: any) => {
        const recruiters = record.assignedRecruiters || [];
        if (recruiters.length === 0) return "-";
        return (
          <Avatar.Group
            max={{
              count: 3,
              style: { backgroundColor: "#1677ff", fontSize: "12px" },
            }}
            size="small"
          >
            {recruiters.map((r: any) => (
              <Tooltip key={r.id} title={r.name}>
                <Avatar
                  style={{ backgroundColor: "#1677ff" }}
                  icon={<UserOutlined />}
                  size="small"
                >
                  {r.name?.[0]}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{ items: menuItems(record) }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0 }}>
          Job Requisitions
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/recruitment/job-requisitions/new")}
        >
          Create Job Requisition
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#cf1322", fontWeight: 500 }}>
            {selectedRowKeys.length} items selected
          </span>
          <Space>
            <Button onClick={() => setSelectedRowKeys([])}>Cancel</Button>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </Space>
        </div>
      )}

      <Card bordered={false} styles={{ body: { padding: "16px" } }}>
        {/* Filters Row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            placeholder="Search tickets..."
            style={{ width: "220px" }}
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            placeholder="Status"
            style={{ width: "120px" }}
            allowClear
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          >
            <Option value="Open">Open</Option>
            <Option value="Closed">Closed</Option>
            <Option value="On Hold">On Hold</Option>
            <Option value="Filled">Filled</Option>
          </Select>
          <Select
            placeholder="Priority"
            style={{ width: "120px" }}
            allowClear
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
          >
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
          </Select>
          <Select
            placeholder="Client"
            style={{ width: "160px" }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            options={clients.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Select
            placeholder="Visa"
            style={{ width: "120px" }}
            allowClear
            value={visaFilter}
            onChange={(val) => setVisaFilter(val)}
          >
            <Option value="H1B">H1B</Option>
            <Option value="USC">USC</Option>
            <Option value="Green Card">Green Card</Option>
            <Option value="OPT">OPT</Option>
            <Option value="CPT">CPT</Option>
          </Select>
          <DatePicker
            placeholder="Start date"
            style={{ width: "140px" }}
            onChange={(date) =>
              setStartDateFrom(
                date ? date.format("YYYY-MM-DD") : undefined
              )
            }
          />
          <DatePicker
            placeholder="End date"
            style={{ width: "140px" }}
            onChange={(date) =>
              setStartDateTo(
                date ? date.format("YYYY-MM-DD") : undefined
              )
            }
          />
        </div>

        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `${total} requisitions`,
            onChange: (page, pageSize) =>
              fetchRequisitions(page, pageSize),
          }}
          scroll={{ x: "max-content" }}
          size="middle"
        />
      </Card>
    </div>
  );
}
