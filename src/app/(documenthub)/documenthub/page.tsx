"use client";
import Header from "@/components/common/Header";
import MainLayout from "@/components/layout/MainLayout";
import {
  useUserProjects,
  useUserTicketsByProjects,
  useMembers,
} from "@/hooks/useGlobalData";
import DocumentHubService, { DocumentHub } from "@/services/documentHub";
import { TicketDetails } from "@/types/ticket";
import { FileZipOutlined, PlusOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Modal, Row, Select, Table, Tag, Tooltip, DatePicker, Space } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnsType } from "antd/es/table";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

type Props = {};

const DocumentHubPage = (props: Props) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const router = useRouter();
  const [form] = Form.useForm();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>("");
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: tickets = [], isLoading: ticketsLoading } = useUserTicketsByProjects(selectedProjectId);
  const { data: members = [], isLoading: membersLoading } = useMembers();

  const queryClient = useQueryClient();

  const { data: documentHubs = [], isLoading: hubsLoading, refetch } = useQuery({
    queryKey: ["documentHubs"],
    queryFn: DocumentHubService.getAllDocumentHubs,
  });

  const handleAddDocument = async (values: any) => {
    try {
      setIsCreating(true);
      const documentDetails = {
        ...values,
      };

      const data = await DocumentHubService.createDocumentHub(documentDetails);
      await queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      setModalVisible(false);
      form.resetFields();
      router.push(`/documenthub/${data?.id}`);
    } catch (error) {
      console.error("Failed to create document hub", error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredHubs = documentHubs.filter((hub) => {
    const matchesSearch = hub.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesUser = selectedUser ? hub.createdById === selectedUser : true;
    const matchesProject = filterProjectId ? hub.projectId === filterProjectId : true;

    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = startOfDay(dateRange[0].toDate());
      const endDate = endOfDay(dateRange[1].toDate());
      const hubDate = new Date(hub.createdAt);
      matchesDate = isWithinInterval(hubDate, { start: startDate, end: endDate });
    }

    return matchesSearch && matchesUser && matchesProject && matchesDate;
  });

  const columns: ColumnsType<DocumentHub> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium text-blue-600">{text}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      render: (text, record) => (
        record.project ? (
          <Tooltip title={record.project.code}>
            <Tag color="blue">{text}</Tag>
          </Tooltip>
        ) : <span className="text-gray-400">-</span>
      ),
    },
    {
      title: "Ticket",
      dataIndex: ["ticket", "title"],
      key: "ticket",
      render: (text, record) => (
        record.ticket ? (
          <Tooltip title={record.ticket.status}>
            <Tag color="orange">{record.ticket.ticketNumber || record.ticket.id}</Tag>
          </Tooltip>
        ) : <span className="text-gray-400">-</span>
      ),
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "name"],
      key: "createdBy",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => <span className="text-gray-500">{format(new Date(date), "MMM d, yyyy")}</span>,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => <span className="text-gray-500">{format(new Date(date), "MMM d, yyyy")}</span>,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
  ];

  return (
    <MainLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col p-6">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FileZipOutlined className="text-blue-500" />
              Document Hub
            </h1>
            <p className="text-gray-500 mt-1">Manage all your documentation in one place</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Create Document
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex-shrink-0 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 w-full">
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined className="text-gray-400" />}
                style={{ width: "40%" }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />

            </div>
            <div className="flex items-center gap-2">
              <Select
                placeholder="Project"
                style={{ width: 150 }}
                allowClear
                showSearch
                optionFilterProp="label"
                value={filterProjectId}
                onChange={setFilterProjectId}
                loading={projectsLoading}
                options={projects}
              />
              <Select
                placeholder="Created By"
                showSearch
                style={{ width: 150 }}
                allowClear
                optionFilterProp="label"
                value={selectedUser}
                onChange={setSelectedUser}
                loading={membersLoading}
                options={members.map((m: any) => ({
                  label: m.label,
                  value: m.value,
                }))}
              />

              <RangePicker
                style={{ width: 240 }}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
              />

            </div>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <Table
              columns={columns}
              dataSource={filteredHubs}
              rowKey="id"
              loading={hubsLoading}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              size="small"
              onRow={(record) => ({
                onClick: () => router.push(`/documenthub/${record.id}`),
                className: "cursor-pointer hover:bg-gray-50",
              })}
            />
          </div>
        </div>
      </div>

      <Modal
        title="Create New Document"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDocument}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Document Name"
                rules={[
                  { required: true, message: "Please enter document name" },
                  { min: 2, message: "Name must be at least 2 characters" },
                ]}
              >
                <Input placeholder="Enter document name" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="projectId" label="Project (optional)">
                <Select
                  placeholder="Select project"
                  loading={projectsLoading}
                  onChange={(value) => {
                    setSelectedProjectId(value);
                    form.setFieldsValue({ projectId: value });
                  }}
                  allowClear
                >
                  {projects.map((project) => (
                    <Option key={project.value} value={project.value}>
                      {project.label} ({project.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="ticketId" label="Ticket (optional)">
                <Select
                  placeholder="Select ticket"
                  loading={ticketsLoading}
                  allowClear
                  disabled={!selectedProjectId}
                >
                  {tickets.map((ticket: any) => (
                    <Option key={ticket.id} value={ticket.id}>
                      {ticket.ticketNumber} ({ticket.title})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setModalVisible(false);
                setSelectedProjectId(undefined);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isCreating}>
              Create Document
            </Button>
          </div>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default DocumentHubPage;
