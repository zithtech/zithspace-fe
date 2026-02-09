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

export default function SalaryStructureSettings() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStructure, setSelectedStructure] =
    useState<SalaryStructure | null>(null);

  // Handle create and edit operations internally
  const onCreate = () => {
    console.log("Create new salary structure");
    // TODO: Navigate to create page or open modal
  };

  const onEdit = (id: number) => {
    console.log("Edit salary structure:", id);
    // TODO: Navigate to edit page or open modal
  };

  /* =========================
     LOAD DATA
  ========================== */
  useEffect(() => {
    setStructures([...SalaryStructureService.getAll()]);
  }, []);

  /* =========================
     TOGGLE ACTIVE (CORE LOGIC)
     - Active → Inactive
     - Inactive → Active
     - Only ONE active at a time
  ========================== */
  /* =========================
   TOGGLE ACTIVE (MULTI-ACTIVE)
   - Click active → becomes inactive
   - Click inactive → becomes active
   - Other items remain unchanged
========================== */
// const toggleActive = (id: number) => {
//   setStructures((prev) =>
//     prev.map((s) =>
//       s.id === id ? { ...s, isActive: !s.isActive } : s
//     )
//   );
// };

// SalaryStructureSettings.tsx - toggleActive function
const toggleActive = (id: number) => {
  console.log("Before toggle:", structures.map(s => ({ id: s.id, isActive: s.isActive })));
  
  // Update local state
  setStructures((prev) =>
    prev.map((s) => {
      if (s.id === id) {
        return { ...s, isActive: !s.isActive }; // Just toggle the clicked one
      }
      return s;
    })
  );
  
  // Also update in service
  SalaryStructureService.setActive(id);
  
  // Verify after toggle
  setTimeout(() => {
    console.log("After toggle:", SalaryStructureService.getAll().map(s => ({ 
      id: s.id, 
      isActive: s.isActive 
    })));
  }, 100);
};

  /* =========================
     TABLE COLUMNS
  ========================== */
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Earnings",
      render: (_: any, record: SalaryStructure) =>
        `${record.earnings.length} (${record.earnings.reduce(
          (sum, e) => sum + e.percentage,
          0,
        )}%)`,
    },
    {
      title: "Deductions",
      render: (_: any, record: SalaryStructure) =>
        record.deductionsEnabled ? record.deductions.length : 0,
    },
    {
      title: "Status",
      render: (_: any, record: SalaryStructure) =>
        record.isActive ? (
          <CheckCircleFilled style={{ color: "#52c41a" }} />
        ) : null,
    },
    {
      title: "Action",
      render: (_: any, record: SalaryStructure) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedStructure(record);
              setDrawerVisible(true);
            }}
          >
            Preview
          </Button>

          {record.isActive ? (
            <Button
              danger
              size="small"
              onClick={() => toggleActive(record.id)}
            >
              Inactive
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => toggleActive(record.id)}
            >
              Set Active
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card style={{ marginTop: -16, marginLeft: 5 }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Salary Structure Configuration
            </Title>
            {/* <Text type="secondary">
              Active:{" "}
              {structures.find((s) => s.isActive)?.name || "None"}
            </Text> */}

            <Text type="secondary">
  Active Structures: {structures.filter((s) => s.isActive).length}
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

            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              New Structure
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
            {structures.map((s) => {
              const isHovered = hoveredId === s.id;

              const cardContent = (
                <>
                  <Title level={5} style={{ margin: 0 }}>
                    {s.name}
                  </Title>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary">{s.description}</Text>

                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedStructure(s);
                          setDrawerVisible(true);
                        }}
                        style={{
                          opacity: isHovered ? 1 : 0,
                          pointerEvents: isHovered ? "auto" : "none",
                        }}
                      >
                        Preview
                      </Button>

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
                      >
                        <MoreOutlined style={{ fontSize: 18 }} />
                      </Dropdown>
                    </Space>
                  </div>

                  <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                    <Card size="small" style={{ flex: 1 }}>
                      <Text>Earnings</Text>
                      <Title level={4}>{s.earnings.length}</Title>
                    </Card>

                    <Card size="small" style={{ flex: 1 }}>
                      <Text>Deductions</Text>
                      <Title level={4}>
                        {s.deductionsEnabled ? s.deductions.length : 0}
                      </Title>
                    </Card>
                  </div>

                  {s.isActive ? (
                    <Button
                      danger
                      block
                      style={{ marginTop: 16 }}
                      onClick={() => toggleActive(s.id)}
                    >
                      Inactive
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      block
                      style={{ marginTop: 16 }}
                      onClick={() => toggleActive(s.id)}
                    >
                      Set Active
                    </Button>
                  )}
                </>
              );

              const card = (
                <Card
                  hoverable
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {cardContent}
                </Card>
              );

              return s.isActive ? (
               <Badge.Ribbon key={s.id} text="Active" color="#1677ff">
                  {card}
                </Badge.Ribbon>
              ) : (
                <React.Fragment key={s.id}>{card}</React.Fragment>
              );
            })}

            {/* ADD NEW */}
            <Card hoverable onClick={onCreate}>
              <Space
                direction="vertical"
                align="center"
                style={{ width: "100%" }}
              >
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
      </Card>

      {/* PREVIEW DRAWER */}
      <Drawer
        title={selectedStructure?.name}
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedStructure && (
          <SalaryPreview
            grossSalary={selectedStructure.grossSalary}
            setGrossSalary={() => {}}
            earnings={selectedStructure.earnings}
            deductions={selectedStructure.deductions}
            deductionsEnabled={selectedStructure.deductionsEnabled}
            readOnly
          />
        )}
      </Drawer>
    </>
  );
}
