"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Segmented,
  Button,
  Divider,
  Table,
  Space,
  Input,
  Tag,
  Avatar,
  Tooltip,
  Form,
  Row,
  Col,
  Select,
  Modal,
  notification,
  InputNumber,
  DatePicker,
  Tabs,
  Popconfirm,
  Switch,
  message,
  Dropdown,
  Menu,
} from "antd";
import {
  ClockCircleOutlined,
  ScheduleOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  SettingOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  PlusOutlined,
  MoreOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import candidateService, { CandidateResponse } from "@/services/candidateService";

const { Text } = Typography;
const { Title } = Typography;

export default function CandidateManagement() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();

  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await candidateService.getAll();
      // Since api wrapper returns response.data.data directly
      if (res) {
        setCandidates(res);
      }
    } catch (error) {
      console.error("Fetch Candidates Error:", error);
      messageApi.error("Failed to fetch candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await candidateService.deleteCandidate(id);
      messageApi.success({
        content: "Candidate deleted successfully.",
        style: { marginTop: '80px' }
      });
      await fetchCandidates();
    } catch (error: any) {
      console.error("Delete Error details:", error);
      messageApi.error({
        content: error.message || "An error occurred while deleting.",
        style: { marginTop: '80px' }
      });
    }   
  };


  const columns = [
    {
      title: "Candidate Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string) => {
        <span style={{ textTransform: "capitalize" }}>{text}</span>
        const initial = text ? text.charAt(0).toUpperCase() : "?";
        return (
          <Space style={{gap:10}}>
            <Avatar style={{ backgroundColor: "#54a5f1ff" }}>{initial}</Avatar>
            <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{text}</span>
          </Space>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Skill Rate",
      dataIndex: "skillRate",
      key: "skillRate",
    },
    {
      title: "Experience",
      dataIndex: "yearsOfExperience",
      key: "yearsOfExperience",
      render: (exp: number) => (exp ? `${exp} Years` : "N/A"),
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: CandidateResponse) => {
        const loc = [record.city, record.state, record.country].filter(Boolean).join(", ");
        return loc || "N/A";
      },
    },
    {
      title: "Updated Date",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Status ",
      dataIndex: "statusConfig",
      key: "statusConfig",
    },
    {
      title: "Actions ",
      dataIndex: "actionConfig",
      key: "actionConfig",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: CandidateResponse) => {
        const handleMenuClick = ({ key, domEvent }: any) => {
          // Robustly stop propagation to prevent row click
          if (domEvent) {
            domEvent.stopPropagation();
          }

          if (key === "edit") {
            router.push(`/recruitment/candidates-edit/${record.id}`);
          } else if (key === "view") {
            router.push(`/recruitment/candidates/${record.id}`);
          }
        };

        const menuItems = [
          { key: "edit", icon: <EditOutlined />, label: "Edit" },
          { key: "view", icon: <EyeOutlined />, label: "View Profile" },
          { 
            key: "delete", 
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="Are you sure you want to delete?"
                  onConfirm={() => record.id && handleDelete(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <div style={{ color: '#ff4d4f', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <DeleteOutlined style={{ marginRight: 8 }} />
                    Delete
                  </div>
                </Popconfirm>
              </div>
            )
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={["click"]}>
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              // Removed e.stopPropagation() here to ensure Dropdown opens correctly.
              // Propagation to the Row is handled in Table's onRow.
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {modalContextHolder}
        {messageContextHolder}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: "24px", flexShrink: 0 }}>
            {/* Left Side Title */}
            <Col>
              <Space direction="vertical" size={0}>
                <Title level={3} style={{ margin: 0 }}>
                  Candidate Management
                </Title>
                <Text type="secondary">Manage and track candidate profiles</Text>
              </Space>
            </Col>

            {/* Right Side Button */}
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/recruitment/candidates-create")}
              >
                Add Candidate
              </Button>
            </Col>
          </Row>

            <Table
              columns={columns}
              dataSource={candidates}
              rowKey="id"
              loading={loading}
              scroll={{ x: "max-content", y: "calc(100vh - 290px)" }}
              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10 }}
              onRow={(record) => ({
                onClick: (e) => {
                  // If the click happened on an action button or dropdown, don't navigate
                  const target = e.target as HTMLElement;
                  if (target.closest('.ant-dropdown-trigger') || target.closest('.ant-dropdown')) {
                    return;
                  }
                  router.push(`/recruitment/candidates/${record.id}`);
                },
                style: { cursor: "pointer" },
              })}
            />
        
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}