"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
    Card,
    Typography,
    Button,
    Table,
    Space,
    Input,
    Tag,
    Avatar,
    Select,
    Row,
    Col,
    Dropdown,
    Menu,
    Popconfirm,
    Badge,
} from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    MoreOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    FilterOutlined,
} from "@ant-design/icons";
import { useGeneralCandidates } from "@/hooks/useGeneralCandidate";
import { GeneralCandidateResponse } from "@/services/generalCandidateService";


const { Title, Text } = Typography;
const { Option } = Select;

export default function CandidateManagement2() {
    const router = useRouter();
    const { candidates, isLoading, deleteCandidate } = useGeneralCandidates();
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const filteredCandidates = candidates?.filter((c: GeneralCandidateResponse) => {
        const matchesSearch =
            c.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            c.email.toLowerCase().includes(searchText.toLowerCase()) ||
            c.skills?.some((s) => s.toLowerCase().includes(searchText.toLowerCase()));

        const matchesStatus = statusFilter ? c.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "APPLIED": return "default";
            case "SHORTLISTED": return "purple";
            case "INTERVIEW": return "processing";
            case "OFFERED": return "warning";
            case "JOINED": return "success";
            case "REJECTED": return "error";
            default: return "default";
        }
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "fullName",
            key: "fullName",
            render: (text: string, record: GeneralCandidateResponse) => (
                <Space size="middle">
                    <Avatar
                        style={{ backgroundColor: '#f56a00', verticalAlign: 'middle' }}
                        size="large"
                    >
                        {text.charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: '15px' }}>{text}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Exp",
            dataIndex: "totalExperience",
            key: "totalExperience",
            render: (exp: number) => (exp ? `${exp} yrs` : "N/A"),
        },
        {
            title: "Skills",
            dataIndex: "skills",
            key: "skills",
            render: (skills: string[]) => (
                <Space size={[0, 4]} wrap>
                    {skills?.slice(0, 3).map((skill) => (
                        <Tag key={skill} color="blue" bordered={false} style={{ borderRadius: '12px', fontWeight: 500 }}>
                            {skill}
                        </Tag>
                    ))}
                    {skills?.length > 3 && (
                        <Tag bordered={false} style={{ borderRadius: '12px' }}>
                            +{skills.length - 3}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Company",
            dataIndex: "currentCompany",
            key: "currentCompany",
            render: (text: string) => text || "N/A",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={getStatusColor(status)} style={{ borderRadius: '6px', padding: '2px 10px', textTransform: 'capitalize' }}>
                    {status.toLowerCase()}
                </Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            fixed: 'right' as const,
            render: (_: any, record: GeneralCandidateResponse) => (
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => router.push(`/Candidate-management2/${record.id}`)}>
                                View Profile
                            </Menu.Item>
                            <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => router.push(`/Candidate-management2/edit/${record.id}`)}>
                                Edit
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item key="delete" danger icon={<DeleteOutlined />}>
                                <Popconfirm
                                    title="Are you sure you want to delete this candidate?"
                                    onConfirm={() => deleteCandidate(record.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    Delete
                                </Popconfirm>
                            </Menu.Item>
                        </Menu>
                    }
                    trigger={["click"]}
                >
                    <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <ProtectedRoute>
            <MainLayout>
                <div style={{ padding: "30px", background: "#ffffff", minHeight: "100vh" }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: "32px" }}>
                        <Col>
                            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Candidates</Title>
                            <Text type="secondary">{filteredCandidates?.length || 0} total candidates</Text>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => router.push("/Candidate-management2/add")}
                                style={{
                                    borderRadius: '10px',
                                    height: '46px',
                                    padding: '0 24px',
                                    backgroundColor: '#2563eb',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                Add Candidate
                            </Button>
                        </Col>
                    </Row>

                    <Card
                        bordered={false}
                        style={{
                            borderRadius: '16px',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                        }}
                        bodyStyle={{ padding: '0px' }}
                    >
                        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                            <Row gutter={16}>
                                <Col flex="auto">
                                    <Input
                                        placeholder="Search by name, skill, email..."
                                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                        size="large"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{ borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Select
                                        placeholder="All Statuses"
                                        size="large"
                                        allowClear
                                        style={{ width: '100%' }}
                                        onChange={setStatusFilter}
                                    >
                                        <Option value="APPLIED">Applied</Option>
                                        <Option value="SHORTLISTED">Shortlisted</Option>
                                        <Option value="INTERVIEW">Interview</Option>
                                        <Option value="OFFERED">Offered</Option>
                                        <Option value="JOINED">Joined</Option>
                                        <Option value="REJECTED">Rejected</Option>
                                    </Select>
                                </Col>
                            </Row>
                        </div>

                        <Table
                            columns={columns}
                            dataSource={filteredCandidates}
                            rowKey="id"
                            loading={isLoading}
                            pagination={{
                                pageSize: 10,
                                position: ['bottomRight'],
                                showSizeChanger: true,
                                style: { padding: '16px 24px' }
                            }}
                            onRow={(record) => ({
                                onClick: (e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('.ant-dropdown-trigger') || target.closest('.ant-dropdown') || target.closest('.ant-popover')) {
                                        return;
                                    }
                                    router.push(`/Candidate-management2/${record.id}`);
                                },
                                style: { cursor: "pointer" },
                            })}
                            scroll={{ x: 1000 }}
                        />
                    </Card>
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}
