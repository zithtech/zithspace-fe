"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Badge,
  Segmented,
  Table,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  AppstoreOutlined,
  TableOutlined,
  MoreOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

import NewCompanyDetails from "./newCompanyDetials";
import { Company } from "@/types/salary";
import { CompanyService } from "@/services/salarySettings.service";

const { Title, Text } = Typography;

interface CompanyPageProps {
  onPreview: (type: "company", data: any) => void;
}

export default function CompanyPage({ onPreview }: CompanyPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await CompanyService.getAll();
    setCompanies(data);
  };

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<number | null>(null);

  // NEW STATES (same as SalaryStructureSettings)
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Company | null>(null);

  const refresh = async () => {
    const data = await CompanyService.getAll();
    setCompanies(data);
  };

  const handleCreate = () => {
    setMode("create");
    setEditingId(null);
  };

  const handleEdit = (id: number) => {
    setMode("edit");
    setEditingId(id);
  };

  const handleBack = () => {
    setMode("list");
    setEditingId(null);
    refresh();
  };

  const setActive = async (id: number) => {
    await CompanyService.setActive(id);
    refresh();
  };

  const handlePreview = (type: "company", data: Company) => {
    setPreviewData(data);
    setPreviewOpen(true);
  };

  if (mode === "create" || mode === "edit") {
    return (
      <NewCompanyDetails
        mode={mode}
        editingId={editingId}
        onBack={handleBack}
        onSaveSuccess={refresh} // ✅ HERE ONLY
        onPreview={onPreview}
      />
    );
  }

  // TABLE COLUMNS
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },

    { title: "Email", dataIndex: "email", key: "email" },

    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "-",
    },

    {
      title: "Address",
      key: "address",
      render: (_: any, record: Company) => (
        <div>
          {formatCompanyAddress(record).map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      ),
    },

    {
      title: "CIN Number",
      dataIndex: "cin",
      key: "cin",
      render: (cin: string) => cin || "-",
    },

    {
      title: "GST Number",
      dataIndex: "gst",
      key: "gst",
      render: (gst: string) => gst || "-",
    },

    {
      title: "Active",
      key: "isActive",
      render: (_: any, record: Company) =>
        record.isActive ? (
          <CheckCircleFilled style={{ color: "#52c41a" }} />
        ) : null,
    },

    {
      title: "Action",
      key: "action",
      render: (_: any, record: Company) => (
        <>
          <Button size="small" onClick={() => handleEdit(record.id)}>
            Edit
          </Button>
          {!record.isActive && (
            <Button
              size="small"
              onClick={() => setActive(record.id)}
              style={{ marginLeft: 8 }}
            >
              Set Active
            </Button>
          )}
        </>
      ),
    },
  ];

  const formatCompanyAddress = (c: Company) => {
    const line1 = [c.plotNo, c.floorNo, c.buildingName]
      .filter(Boolean)
      .join(", ");

    const line2 = [c.street, c.area].filter(Boolean).join(", ");

    const line3 = [c.city, c.pincode && `- ${c.pincode}`, c.country]
      .filter(Boolean)
      .join(" ");

    return [line1, line2, line3].filter(Boolean);
  };

  return (
    <div>
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", padding: 5 }}
      >
        <Card>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                Company Configuration
              </Title>
              <Text type="secondary">
                Manage company details for payslips and official documents
              </Text>
            </div>

            <Space>
              <Segmented
                options={[
                  { label: "Card", value: "card", icon: <AppstoreOutlined /> },
                  { label: "Table", value: "table", icon: <TableOutlined /> },
                ]}
                value={viewMode}
                onChange={(val) => setViewMode(val as "card" | "table")}
              />

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Company
              </Button>
            </Space>
          </div>

          {/* CONTENT */}
          {viewMode === "card" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {companies.map((c) => {
                const content = (
                  <>
                    {/* Company Logo */}
                    {c.logo && (
                      <div style={{ textAlign: "center", marginBottom: 12 }}>
                        <img
                          src={c.logo}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "contain",
                            borderRadius: 8,
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {c.name}
                        </Title>
                        <Text type="secondary">{c.email}</Text>
                      </div>

                      {/* Dropdown for Edit */}
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "edit",
                              label: "Edit",
                              onClick: () => handleEdit(c.id), // opens the edit form
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <MoreOutlined
                          style={{ fontSize: 18, cursor: "pointer" }}
                        />
                      </Dropdown>
                    </div>

                    {c.phone && <Text type="secondary">Phone: {c.phone}</Text>}
                    <br />
                    {formatCompanyAddress(c).length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary">Address:</Text>
                        <br />
                        {formatCompanyAddress(c).map((line, idx) => (
                          <Text
                            key={idx}
                            type="secondary"
                            style={{ display: "block" }}
                          >
                            {line}
                          </Text>
                        ))}
                      </div>
                    )}

                    <br />
                    {c.cin && <Text type="secondary">CIN Number: {c.cin}</Text>}
                    <br />
                    {c.gst && <Text type="secondary">GST Number: {c.gst}</Text>}

                    {!c.isActive && (
                      <Button
                        block
                        style={{ marginTop: 16 }}
                        onClick={() => setActive(c.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                  </>
                );

                const card = (
                  <Card
                    hoverable
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      borderRadius: 10,
                      boxShadow: `
                      0 12px 30px rgba(0,0,0,0.2),
                      0 6px 12px rgba(0,0,0,0.15)
                    `,
                    }}
                  >
                    {content}
                  </Card>
                );

                return c.isActive ? (
                  <Badge.Ribbon key={c.id} text="Active" color="blue">
                    {card}
                  </Badge.Ribbon>
                ) : (
                  <React.Fragment key={c.id}>{card}</React.Fragment>
                );
              })}

              {/* Add New Company Card */}
              <Card
                hoverable
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 200,
                }}
                onClick={handleCreate}
              >
                <Space direction="vertical" align="center">
                  <PlusOutlined style={{ fontSize: 24 }} />
                  <Text>Add New Company</Text>
                </Space>
              </Card>
            </div>
          ) : (
            <Table
              dataSource={companies}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          )}
        </Card>
      </Space>
    </div>
  );
}
