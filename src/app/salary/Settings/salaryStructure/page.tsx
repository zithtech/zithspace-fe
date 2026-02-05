"use client";

import React, { useState } from "react";
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
  Spin,
  Empty,
  Modal,
} from "antd";
import {
  PlusOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  AppstoreOutlined,
  TableOutlined,
  EyeOutlined,
  MoreOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

import { SalaryStructure } from "@/types/salaryStructure";
import SalaryPreview from "@/app/salary/SalaryPreview";
import {
  useSalaryStructures,
  useToggleActiveSalaryStructure,
  useDeleteSalaryStructure,
} from "@/hooks/useSalaryStructures";

const { Title, Text } = Typography;

type Props = {
  onCreate: () => void;
  onEdit: (id: number) => void;
};

export default function SalaryStructureSettings({ onCreate, onEdit }: Props) {
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStructure, setSelectedStructure] =
    useState<SalaryStructure | null>(null);

  /* =========================
     DATA (React Query)
  ========================== */
  const { data, isLoading } = useSalaryStructures();
  const toggleActiveMutation = useToggleActiveSalaryStructure();
  const deleteMutation = useDeleteSalaryStructure();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [structureToDelete, setStructureToDelete] =
    useState<SalaryStructure | null>(null);

  const structures = data?.data ?? [];

  /* =========================
     TOGGLE ACTIVE
  ========================== */
  const toggleActive = async (id: number) => {
    const structure = structures.find((s) => s.id === id);
    if (!structure) return;

    const toastId = toast.loading(
      `${structure.isActive ? "Inactivating" : "Activating"} salary structure...`,
    );

    try {
      await toggleActiveMutation.mutateAsync(id);
      toast.success(
        `Salary structure ${structure.isActive ? "inactivated" : "activated"} successfully`,
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        `Failed to ${structure.isActive ? "inactivate" : "activate"} salary structure`,
        { id: toastId },
      );
    }
  };

  /* =========================
     PREVIEW HANDLER
  ========================== */
  const handlePreview = (structure: SalaryStructure) => {
    setSelectedStructure(structure);
    setDrawerVisible(true);
    toast.success(`Previewing "${structure.name}"`, {
      icon: "👁️",
    });
  };

  /* =========================
     EDIT HANDLER
  ========================== */
  const handleEdit = (id: number) => {
    const structure = structures.find((s) => s.id === id);
    if (structure) {
      toast.success(`  Salary component successfully updated `);
    }
    onEdit(id);
  };

  /* =========================
     CREATE HANDLER
  ========================== */
  const handleCreate = () => {
    toast.success("Creating new salary structure");
    onCreate();
  };

  const openDeleteModal = (structure: SalaryStructure) => {
    setStructureToDelete(structure);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (!structureToDelete) return;

    console.log("Deleting structure:", structureToDelete);

    setDeleteModalVisible(false);
    setStructureToDelete(null);

    deleteMutation.mutate(structureToDelete.id, {
      onSuccess: () => {
        setDeleteModalVisible(false);
        toast.success(
          `Salary structure "${structureToDelete.name}" deleted successfully`,
        );

        // setStructureToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete salary structure");
      },
    });
  };

  /* =========================
     TABLE COLUMNS
  ========================== */
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (name: string, record: SalaryStructure) => (
        <Space>
          {record.isActive ? (
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 16 }} />
          ) : (
            <PauseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />
          )}
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (desc: string) => (
        <Text type="secondary" style={{ maxWidth: 200 }} ellipsis>
          {desc || "No description"}
        </Text>
      ),
    },
    {
      title: "Earnings",
      render: (_: any, record: SalaryStructure) => {
        const totalPercent = record.earnings.reduce(
          (sum, e) => sum + e.percentage,
          0,
        );
        return (
          <Space>
            <Badge
              count={record.earnings.length}
              style={{ backgroundColor: "#1890ff" }}
            />
            <Text type="secondary">({totalPercent}%)</Text>
          </Space>
        );
      },
    },
    {
      title: "Deductions",
      render: (_: any, record: SalaryStructure) => {
        const deductionsCount = record.deductionsEnabled
          ? record.deductions.length
          : 0;

        const totalPercent = record.deductionsEnabled
          ? record.deductions.reduce((sum, d) => {
              if (d.type === "BASIC_PERCENT" || d.type === "GROSS_PERCENT") {
                return sum + d.value;
              }
              return sum; // FIXED amount – ignore
            }, 0)
          : 0;

        return (
          <Space>
            <Badge
              count={deductionsCount}
              style={{
                backgroundColor: record.deductionsEnabled
                  ? "#ff4d4f"
                  : "#d9d9d9",
              }}
            />
            <Text type="secondary">({totalPercent}%)</Text>
          </Space>
        );
      },
    },

    {
      title: "Gross Salary",
      render: (_: any, record: SalaryStructure) => (
        <Text strong>₹{record.grossSalary.toLocaleString()}</Text>
      ),
    },
    {
      title: "Action",
      render: (_: any, record: SalaryStructure) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            Preview
          </Button>

          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          >
            Edit
          </Button>

          {record.isActive ? (
            <Button
              danger
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => toggleActive(record.id)}
            >
              Inactivate
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => toggleActive(record.id)}
            >
              Set Active
            </Button>
          )}
        </Space>
      ),
    },
  ];

  /* =========================
     LOADING STATE
  ========================== */
  if (isLoading) {
    return (
      <Card style={{ marginTop: -16, marginLeft: 5 }}>
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />}
            size="large"
          />
          <Title level={4} style={{ marginTop: 24, marginBottom: 8 }}>
            Loading Salary Structures
          </Title>
          <Text type="secondary">
            Please wait while we fetch your salary configurations...
          </Text>
        </div>
      </Card>
    );
  }

  /* =========================
     EMPTY STATE
  ========================== */
  if (structures.length === 0) {
    return (
      <Card style={{ marginTop: -16, marginLeft: 5 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Title level={4} style={{ marginBottom: 8 }}>
                No Salary Structures Found
              </Title>
              <Text type="secondary">
                Get started by creating your first salary structure
              </Text>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create New Structure
          </Button>
        </Empty>
      </Card>
    );
  }

  /* =========================
     RENDER
  ========================== */
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
          },
        }}
      />
      <Card
        style={{ marginTop: -16, marginLeft: 5 }}
        bodyStyle={{ padding: isLoading ? 0 : 24 }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                Salary Structure Configuration
              </Title>
              <Badge
                count={structures.filter((s) => s.isActive).length}
                style={{
                  backgroundColor: "#1677ff",
                  color: "#fff",
                }}
              />
            </Space>
            <div>
              <Text type="secondary">
                Total Structures: {structures.length} •{" "}
                <CheckCircleFilled style={{ color: "#52c41a", fontSize: 12 }} />{" "}
                Active: {structures.filter((s) => s.isActive).length} •{" "}
                <PauseCircleOutlined
                  style={{ color: "#d9d9d9", fontSize: 12 }}
                />{" "}
                Inactive: {structures.filter((s) => !s.isActive).length}
              </Text>
            </div>
          </div>

          <Space>
            <Segmented
              options={[
                { label: "Card", value: "card", icon: <AppstoreOutlined /> },
                { label: "Table", value: "table", icon: <TableOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as "card" | "table")}
              style={{ marginRight: 8 }}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              New Structure
            </Button>
          </Space>
        </div>

        {/* CONTENT */}
        {viewMode === "card" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
            }}
          >
            {structures.map((s) => {
              const isHovered = hoveredId === s.id;
              const earningsTotal = s.earnings.reduce(
                (sum, e) => sum + e.percentage,
                0,
              );

              const deductionsTotalPercent = s.deductionsEnabled
                ? s.deductions.reduce((sum, d) => {
                    if (
                      d.type === "BASIC_PERCENT" ||
                      d.type === "GROSS_PERCENT"
                    ) {
                      return sum + d.value;
                    }
                    return sum; // FIXED has no %
                  }, 0)
                : 0;

              const card = (
                <Card
                  key={s.id}
                  hoverable
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  bodyStyle={{
                    padding: 16,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  style={{
                    border: s.isActive
                      ? "2px solid #0852d2ff"
                      : "1px solid #c0bebeff",
                    position: "relative",
                    transition: "all 0.3s",
                    borderRadius: 8,
                    minHeight: 280,
                    height: "100%",
                  }}
                >
                  {/* ACTIVE STATUS BADGE */}
                  {/* <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  >
                    {s.isActive ? (
                      <Badge
                        color="#52c41a"
                        text="Active"
                        style={{
                          padding: "3px 6px",
                          borderRadius: 4,
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                      />
                    ) : (
                      <Badge
                        color="#d9d9d9"
                        text="Inactive"
                        style={{
                          padding: "3px 6px",
                          borderRadius: 4,
                          fontWeight: 500,
                          color: "#8c8c8c",
                          fontSize: 12,
                        }}
                      />
                    )}
                  </div> */}

                  {/* STRUCTURE NAME & DESCRIPTION */}
                  {/* STRUCTURE HEADER ROW */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      paddingRight: 4,
                    }}
                  >
                    {/* LEFT : NAME + DESCRIPTION */}
                    <div style={{ flex: 1 }}>
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: 16,
                          lineHeight: 1.2,
                          color: "#262626",
                        }}
                      >
                        {s.name}
                      </Title>

                      <Text
                        style={{
                          display: "block",
                          fontSize: 12,
                          lineHeight: 1.2,
                          marginTop: 4,
                          color: "#595959",
                        }}
                      >
                        {s.description || "No description"}
                      </Text>
                    </div>

                    {/* RIGHT : THREE DOT (ACTIVE BADGE KEELA) */}
                    <div style={{ marginTop: -16 }}>
                      <Dropdown
                        trigger={["click"]}
                        menu={{
                          items: [
                            {
                              key: "edit",
                              label: "Edit",
                              icon: <EditOutlined />,
                              onClick: () => handleEdit(s.id),
                            },
                            {
                              key: "delete",
                              danger: true,
                              label: (
                                <span onClick={() => openDeleteModal(s)}>
                                  <Space>
                                    <DeleteOutlined />
                                    Delete
                                  </Space>
                                </span>
                              ),
                            },
                          ],
                        }}
                      >
                        <Button
                          icon={<MoreOutlined />}
                          size="small"
                          style={{
                            height: 32,
                            width: 32,
                            marginTop: s.isActive ? 18 : 0, // ⭐ ribbon keela
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                            borderRadius: 6,
                            backgroundColor: "#fff",
                          }}
                        />
                      </Dropdown>
                    </div>
                  </div>

                  {/* STATS - COMPACT VERSION */}
                  {/* <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        borderRadius: 6,
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          display: "block",
                          color: "#595959", // Dark gray for label
                          fontWeight: 500,
                        }}
                      >
                        Earnings
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 2,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            fontSize: 14,
                            color: "#262626", // Dark gray for count
                          }}
                        >
                          {s.earnings.length}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: "#8c8c8c", // Lighter gray for percentage
                          }}
                        >
                          ({earningsTotal}%)
                        </Text>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: s.deductionsEnabled
                          ? "#fff2f0"
                          : "#fafafa",
                        border: s.deductionsEnabled
                          ? "1px solid #ffccc7"
                          : "1px solid #d9d9d9",
                        borderRadius: 6,
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          display: "block",
                          color: "#595959", // Dark gray for label
                          fontWeight: 500,
                        }}
                      >
                        Deductions
                      </Text>
                      <Text
                        strong
                        style={{
                          fontSize: 14,
                          color: "#262626", // Dark gray for count
                        }}
                      >
                        {s.deductionsEnabled ? s.deductions.length : 0}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
                        ({deductionsTotalPercent}%)
                      </Text>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#f0f8ff",
                        border: "1px solid #91d5ff",
                        borderRadius: 6,
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          display: "block",
                          color: "#595959", // Dark gray for label
                          fontWeight: 500,
                        }}
                      >
                        Gross
                      </Text>
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          lineHeight: 1.2,
                          color: "#262626", // Dark gray for amount
                        }}
                      >
                        ₹{(s.grossSalary / 1000).toFixed(0)}k
                      </Text>
                    </div>
                  </div> */}

                  <div
                    style={{
                      display: "flex", // Gridக்கு பதிலாக flex
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        borderRadius: 8,
                        padding: 12,
                        textAlign: "center",
                        height: 70,
                        flex: 1, // சமமான அகலம்
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          display: "block",
                          color: "#595959",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Earnings
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            fontSize: 18,
                            color: "#262626",
                          }}
                        >
                          {s.earnings.length}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#8c8c8c",
                          }}
                        >
                          ({earningsTotal}%)
                        </Text>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: s.deductionsEnabled
                          ? "#fff2f0"
                          : "#fafafa",
                        border: s.deductionsEnabled
                          ? "1px solid #ffccc7"
                          : "1px solid #d9d9d9",
                        borderRadius: 8,
                        padding: 12,
                        textAlign: "center",
                        height: 70,
                        flex: 1, // சமமான அகலம்
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          display: "block",
                          color: "#595959",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Deductions
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            fontSize: 18,
                            color: "#262626",
                          }}
                        >
                          {s.deductionsEnabled ? s.deductions.length : 0}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                          ({deductionsTotalPercent}%)
                        </Text>
                      </div>
                    </div>
                  </div>
                  {/* ACTION BUTTONS - COMPACT */}
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      opacity: isHovered ? 1 : 0.8,
                      transition: "opacity 0.3s",
                    }}
                  >
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(s)}
                      style={{ flex: 1, fontSize: 12, height: 32 }}
                    >
                      Quick Preview
                    </Button>

                    {/* <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(s.id)}
                      style={{ flex: 1, fontSize: 12, height: 32 }}
                    >
                      Edit
                    </Button> */}

                    <Button
                      size="small"
                      type={s.isActive ? "primary" : "default"} // ⭐ MAIN LOGIC
                      danger={!s.isActive}
                      icon={
                        s.isActive ? (
                          <CheckCircleOutlined />
                        ) : (
                          <PauseCircleOutlined />
                        )
                      }
                      onClick={() => toggleActive(s.id)}
                      style={{ flex: 1, fontSize: 12, height: 32 }}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </Button>

                    {/* <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          // {
                          //   key: "toggle",
                          //   label: s.isActive ? "Inactivate" : "Set Active",
                          //   icon: s.isActive ? (
                          //     <PauseCircleOutlined />
                          //   ) : (
                          //     <CheckCircleOutlined />
                          //   ),
                          //   danger: s.isActive,
                          //   onClick: () => toggleActive(s.id),
                          // },
                          // {
                          //   key: "preview",
                          //   label: "Quick Preview",
                          //   icon: <EyeOutlined />,
                          //   onClick: () => handlePreview(s),
                          // },
                          {
                            key: "edit",
                            label: "Edit",
                            icon: <EditOutlined />,
                            onClick: () => handleEdit(s.id),
                          },

                          {
                            key: "delete",
                            danger: true,
                            label: (
                              <span onClick={() => openDeleteModal(s)}>
                                <Space>
                                  <DeleteOutlined />
                                  Delete
                                </Space>
                              </span>
                            ),
                          },
                        ],
                      }}
                    >
                      <Button
                        icon={<MoreOutlined />}
                        size="small"
                        style={{
    height: 32,
    width: 32,
    position: "relative",
    top: -10, // icon slightly kila varum
    right: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)", // optional shadow
    borderRadius: 6,
    backgroundColor: "#fff", // slightly raised feel
  }}
                      />
                    </Dropdown> */}
                  </div>
                </Card>
              );

              return s.isActive ? (
                <Badge.Ribbon
                  key={s.id}
                  text="Active"
                  color="#1677ff"
                  placement="end"
                >
                  {card}
                </Badge.Ribbon>
              ) : (
                <React.Fragment key={s.id}>{card}</React.Fragment>
              );
            })}

            {/* ADD NEW CARD - COMPACT */}
            <Card
              hoverable
              onClick={handleCreate}
              style={{
                border: "2px dashed #d9d9d9",
                backgroundColor: "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
                height: "100%",
                borderRadius: 8,
                transition: "all 0.3s",
              }}
              bodyStyle={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "#e6f7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <PlusOutlined style={{ fontSize: 20, color: "#1890ff" }} />
              </div>
              <Title
                level={5}
                style={{
                  marginBottom: 6,
                  fontSize: 16,
                  color: "#262626", // Dark gray for title
                }}
              >
                Add New Structure
              </Title>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: "#595959", // Dark gray for description
                }}
              >
                Create salary structure with earnings & deductions
              </Text>
            </Card>
          </div>
        ) : (
          <Table
            dataSource={structures}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ overflowX: "auto" }}
            rowClassName={(record) =>
              record.isActive ? "active-row" : "inactive-row"
            }
          />
        )}
      </Card>

      {/* PREVIEW DRAWER */}
      <Drawer
        title={
          <Space>
            {selectedStructure?.name}
            {selectedStructure?.isActive && (
              <Badge
                color="#52c41a"
                text="Active"
                style={{ fontSize: 12, fontWeight: "normal" }}
              />
            )}
          </Space>
        }
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        styles={{
          header: { borderBottom: "1px solid #f0f0f0", padding: "16px 24px" },
          body: { padding: 24 },
        }}
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              if (selectedStructure) {
                handleEdit(selectedStructure.id);
                setDrawerVisible(false);
              }
            }}
          >
            Edit Structure
          </Button>
        }
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

      <Modal
        title=" Delete Salary Structure"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={confirmDelete}
        okButtonProps={{ danger: true }}
        okText="Delete"
        cancelText="Cancel"
      >
        <Text>
          Are you sure you want to delete{" "}
          <strong>{structureToDelete?.name}</strong>? Permenantly
        </Text>
      </Modal>
    </>
  );
}
