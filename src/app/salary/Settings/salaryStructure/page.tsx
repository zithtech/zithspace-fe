"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Badge,
  Segmented,
  Drawer,
  Table,
  Dropdown,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  CheckCircleFilled,
  AppstoreOutlined,
  TableOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import { SalaryStructure } from "@/types/salary";
import { SalaryStructureService } from "@/services/salarySettings.service";
import SalaryPreview from "@/app/salary/SalaryPreview";

const { Title, Text } = Typography;

type Props = {
  onCreate: () => void;
  onEdit: (id: number) => void;
};

export default function SalaryStructureSettings({ onCreate, onEdit }: Props) {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStructure, setSelectedStructure] =
    useState<SalaryStructure | null>(null);

  useEffect(() => {
    setStructures([...SalaryStructureService.getAll()]);
  }, []);

  const setActive = (id: number) => {
    SalaryStructureService.setActive(id);
    setStructures([...SalaryStructureService.getAll()]);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Earnings Components",
      key: "earnings",
      render: (text: any, record: SalaryStructure) =>
        `${record.earnings.length} (${record.earnings.reduce(
          (sum, e) => sum + e.percentage,
          0,
        )}%)`,
    },
    {
      title: "Deductions Components",
      key: "deductions",
      render: (_: any, record: SalaryStructure) =>
        record.deductionsEnabled ? record.deductions.length : 0,
    },
    {
      title: "Active",
      key: "isActive",
      render: (text: any, record: SalaryStructure) =>
        record.isActive ? (
          <CheckCircleFilled style={{ color: "#52c41a" }} />
        ) : null,
    },
    {
      title: "Action",
      key: "action",
      render: (text: any, record: SalaryStructure) => (
        <>
          <Button
            size="small"
            onClick={() => {
              setSelectedStructure(record);
              setDrawerVisible(true);
            }}
            style={{ marginRight: 8 }}
          >
            Preview
          </Button>
          {!record.isActive && (
            <Button size="small" onClick={() => setActive(record.id)}>
              Set Active
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <div style={{ padding: 5 }}>
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
            <Space align="center" size={24}>
              {/* <SettingOutlined
              style={{ fontSize: 22, color: "#1677ff", cursor: "pointer" }}
            /> */}
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Salary Structure Configuration
                </Title>
                <Text type="secondary">
                  Manage salary structures · Active:{" "}
                  {structures.find((s) => s.isActive)?.name || "None"}
                </Text>
              </div>
            </Space>

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
                onClick={onCreate} // call the callback instead of navigating
              >
                New Structure
              </Button>
            </Space>
          </div>

          {/* Structures */}
          <div>
            {viewMode === "card" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: 16,
                }}
              >
                {structures.map((s) => {
                  const isHovered = hoveredId === s.id;
                  const content = (
                    <>
                      <Title level={5} style={{ margin: 0 }}>
                        {s.name}
                      </Title>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text type="secondary">{s.description}</Text>

                        <Space size={8}>
                          {/* Preview (hover based or always visible – your choice) */}
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setSelectedStructure(s);
                              setDrawerVisible(true);
                            }}
                            style={{
                              padding: 0,
                              opacity: isHovered ? 1 : 0, // remove this line if always visible
                              pointerEvents: isHovered ? "auto" : "none",
                            }}
                          >
                            Preview
                          </Button>

                          {/* Three dot menu – ALWAYS visible */}
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "edit",
                                  label: "Edit",
                                  onClick: () => onEdit(s.id),
                                },
                              ],
                            }}
                            trigger={["click"]}
                          >
                            <MoreOutlined
                              style={{
                                fontSize: 18,
                                cursor: "pointer",
                                color: "#595959",
                              }}
                            />
                          </Dropdown>
                        </Space>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                        <Card size="small" style={{ flex: 1 }}>
                          <Text>Earnings</Text>
                          <Title level={4}>{s.earnings.length}</Title>
                          <Text type="secondary">
                            components (
                            {s.earnings.reduce(
                              (sum, e) => sum + e.percentage,
                              0,
                            )}
                            %)
                          </Text>
                        </Card>
                        <Card size="small" style={{ flex: 1 }}>
                          <Text>Deductions</Text>
                          <Title level={4}>
                            {s.deductionsEnabled ? s.deductions.length : 0}
                          </Title>
                          <Text type="secondary">
                            {s.deductionsEnabled
                              ? "components"
                              : "components(0)"}
                          </Text>
                        </Card>
                      </div>
                      <Space style={{ marginTop: 16 }}>
                        {s.isActive && (
                          <CheckCircleFilled style={{ color: "#52c41a" }} />
                        )}
                        <Text type="secondary">Updated {s.createdAt}</Text>
                      </Space>
                      {!s.isActive && (
                        <Button
                          block
                          style={{ marginTop: 16 }}
                          onClick={() => setActive(s.id)}
                        >
                          Set as Active
                        </Button>
                      )}
                    </>
                  );

                  const card = (
                    <Card
                      hoverable
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        borderRadius: 10,
                        boxShadow: `
        0 12px 30px rgba(0,0,0,0.2),
        0 6px 12px rgba(0,0,0,0.15)
      `,
                        transition: "all 0.25s ease",
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      {content}
                    </Card>
                  );

                  return s.isActive ? (
                    <Badge.Ribbon key={s.id} text="Active" color="blue">
                      {card}
                    </Badge.Ribbon>
                  ) : (
                    <React.Fragment key={s.id}>{card}</React.Fragment>
                  );
                })}

                {/* Add New Card */}
                <Card
                  hoverable
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 220,
                  }}
                  onClick={onCreate} // replace router.push
                >
                  <Space direction="vertical" align="center">
                    <PlusOutlined style={{ fontSize: 24 }} />
                    <Text>Add New Structure</Text>
                  </Space>
                </Card>
              </div>
            ) : (
              <Table
                dataSource={structures}
                columns={columns}
                rowKey="id"
                pagination={false}
              />
            )}
          </div>
        </Card>
      </div>
      <Drawer
        title={selectedStructure?.name || "Salary Preview"}
        placement="right"
        width={500}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {selectedStructure && (
          <SalaryPreview
            grossSalary={selectedStructure.grossSalary}
            setGrossSalary={() => {}} // optional: no editing inside drawer
            earnings={selectedStructure.earnings}
            deductions={selectedStructure.deductions}
            deductionsEnabled={selectedStructure.deductionsEnabled}
            readOnly={true}
          />
        )}
      </Drawer>
    </>
  );
}
