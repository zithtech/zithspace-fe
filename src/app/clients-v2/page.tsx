"use client";

import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Select,
    Tag,
    Space,
    Card,
    Typography,
    Tooltip,
    Dropdown,
} from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { apiUtils } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

const { Title } = Typography;

export default function ClientsV2ListPage() {
    const router = useRouter();
    const { tenantId } = useTenant();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState("");

    const fetchClients = async (page = 1, pageSize = 10, search = "") => {
        setLoading(true);
        try {
            const result = await apiUtils.getPaginated("/api/clients-v2", {
                page,
                limit: pageSize,
                search
            });

            setData(result.data);
            setPagination({
                current: result.pagination.current,
                pageSize: result.pagination.pageSize,
                total: result.pagination.total,
            });
        } catch (err) {
            console.error("Failed to fetch clients v2", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) fetchClients();
    }, [tenantId]);

    const handleTableChange = (paginationInfo: any) => {
        fetchClients(paginationInfo.current, paginationInfo.pageSize, searchText);
    };

    const handleSearch = (value: string) => {
        setSearchText(value);
        fetchClients(1, pagination.pageSize, value);
    };

    const columns = [
        {
            title: "Client Code",
            dataIndex: "clientCode",
            key: "clientCode",
        },
        {
            title: "Company Name",
            dataIndex: "companyName",
            key: "companyName",
        },
        {
            title: "Client Type",
            dataIndex: "clientType",
            key: "clientType",
        },
        {
            title: "Risk Level",
            dataIndex: "riskLevel",
            key: "riskLevel",
            render: (risk: string) => (
                <Tag color={risk === "High" ? "red" : risk === "Medium" ? "orange" : "green"}>
                    {risk || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
                <Tag color={status === "Active" ? "green" : "default"}>{status}</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => router.push(`/clients-v2/${record.id}`)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <MainLayout>
            <div style={{ padding: "24px", height: "calc(100vh - 100px)", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Client Management (V2)
                    </Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => router.push("/clients-v2/create")}
                    >
                        Add Client
                    </Button>
                </div>

                <Card bordered={false}>
                    <div style={{ marginBottom: "16px", display: "flex", gap: "16px" }}>
                        <Input.Search
                            placeholder="Search clients by name or code..."
                            allowClear
                            onSearch={handleSearch}
                            style={{ width: 300 }}
                        />
                    </div>

                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange}
                    />
                </Card>
            </div>
        </MainLayout>
    );
}
