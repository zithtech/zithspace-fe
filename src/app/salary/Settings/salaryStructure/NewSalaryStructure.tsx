"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  Typography,
  Input,
  Form,
  InputNumber,
  Button,
  Space,
  Select,
  Row,
  Col,
  Progress,
  message,
  ConfigProvider,
  Switch,
  Modal,
  Divider,
  Radio,
  Drawer,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ExpandOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";

import { Earning, Deduction } from "@/types/salary";
import { SalaryStructureService } from "@/services/salarySettings.service";
import SalaryPreview from "@/app/salary/SalaryPreview";

import {
  calculateEarnings,
  calculateDeductionAmounts,
  calculateTotalDeductions,
  calculateNetPay,
} from "@/utils/salaryCalculator";

const { Title, Text } = Typography;

interface Props {
  mode: "create" | "edit";
  editingId: number | null;
  onBack: () => void;
}

const NewSalaryStructure = ({ mode, editingId, onBack }: Props) => {
  const isEditMode = mode === "edit";

  const [form] = Form.useForm();

  const [grossSalary, setGrossSalary] = useState<number>(16500);
  const [deductionsEnabled, setDeductionsEnabled] = useState(false);

  const [earnings, setEarnings] = useState<Earning[]>([
    { id: 1, name: "Basic Pay", percentage: 50 },
    { id: 2, name: "House Rent Allowance", percentage: 20 },
    { id: 3, name: "Medical Allowance", percentage: 10 },
    { id: 4, name: "Special Allowance", percentage: 20 },
  ]);

  const [deductions, setDeductions] = useState<Deduction[]>([
    { id: 1, name: "Provident Fund", type: "BASIC_PERCENT", value: 12 },
    { id: 2, name: "Professional Tax", type: "FIXED", value: 200 },
  ]);

  const [descModalOpen, setDescModalOpen] = useState(false);
  const [activeEarning, setActiveEarning] = useState<Earning | null>(null);
  const [tempDescription, setTempDescription] = useState("");

  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [visibilityType, setVisibilityType] = useState<"PUBLIC" | "PRIVATE">(
    "PUBLIC",
  );

  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  useEffect(() => {
    if (editingId) {
      const existing = SalaryStructureService.getById(editingId);
      if (existing) {
        form.setFieldsValue({
          structureName: existing.name,
          structureDescription: existing.description,
        });

        setGrossSalary(existing.grossSalary);
        setEarnings(existing.earnings);
        setDeductions(existing.deductions);
        setDeductionsEnabled(existing.deductionsEnabled);
      }
    } else {
      form.resetFields();
    }
  }, [editingId, form]);

  const companies = [
    { id: 1, name: "ABC Pvt Ltd" },
    { id: 2, name: "XYZ Technologies" },
  ];

  const roles = [
    { id: 1, name: "Manager" },
    { id: 2, name: "Developer" },
    { id: 3, name: "HR" },
  ];

  /* ---------------- Calculations ---------------- */
  // const totalEarningPercent = useMemo(
  //   () => earnings.reduce((sum, e) => sum + e.percentage, 0),
  //   [earnings]
  // );

  // const earningAmounts = earnings.map((e) => ({
  //   ...e,
  //   amount: Math.round((grossSalary * e.percentage) / 100),
  // }));

  // const basicPay =
  //   earningAmounts.find((e) => e.name === "Basic Pay")?.amount || 0;

  // const deductionAmounts = deductions.map((d) => {
  //   let amount = 0;
  //   if (d.type === "BASIC_PERCENT") {
  //     amount = Math.round((basicPay * d.value) / 100);
  //   } else if (d.type === "GROSS_PERCENT") {
  //     amount = Math.round((grossSalary * d.value) / 100);
  //   } else {
  //     amount = d.value;
  //   }
  //   return { ...d, amount };
  // });

  // const totalDeductions = deductionsEnabled
  //   ? deductionAmounts.reduce((s, d) => s + d.amount, 0)
  //   : 0;

  // const netPay = grossSalary - totalDeductions;
  // const isEarningValid = totalEarningPercent === 100;

  // /* ---------------- Handlers ---------------- */
  // const addEarning = () =>
  //   setEarnings((p) => [...p, { id: Date.now(), name: "", percentage: 0 }]);

  // const addDeduction = () =>
  //   setDeductions((p) => [
  //     ...p,
  //     { id: Date.now(), name: "", type: "FIXED", value: 0 },
  //   ]);

  /* ---------- Calculations (UTILS ONLY) ---------- */
  const structure = useMemo(
    () => ({
      grossSalary,
      earnings,
      deductions,
      deductionsEnabled,
    }),
    [grossSalary, earnings, deductions, deductionsEnabled],
  );

  const earningAmounts = useMemo(
    () => calculateEarnings(structure),
    [structure],
  );

  const deductionAmounts = useMemo(
    () => calculateDeductionAmounts(structure),
    [structure],
  );

  const totalDeductions = useMemo(
    () => calculateTotalDeductions(structure),
    [structure],
  );

  const netPay = useMemo(() => calculateNetPay(structure), [structure]);

  const totalEarningPercent = useMemo(
    () => earnings.reduce((s, e) => s + e.percentage, 0),
    [earnings],
  );

  const isEarningValid = totalEarningPercent === 100;

  /* ---------- Handlers ---------- */
  const addEarning = () =>
    setEarnings((p) => [...p, { id: Date.now(), name: "", percentage: 0 }]);

  const addDeduction = () =>
    setDeductions((p) => [
      ...p,
      { id: Date.now(), name: "", type: "FIXED", value: 0 },
    ]);

  // const confirmSaveStructure = async () => {
  //   try {
  //     if (visibilityType === "PRIVATE") {
  //       if (!selectedCompany || !selectedRole) {
  //         message.error("Please select company and role");
  //         return;
  //       }
  //     }

  //     const values = await form.validateFields();

  //     const payload = {
  //       id: isEditMode && editingId ? editingId : Date.now(),
  //       name: values.structureName,
  //       description: values.structureDescription,
  //       grossSalary,
  //       earnings,
  //       deductions,
  //       deductionsEnabled,

  //       visibility: visibilityType, // PUBLIC | PRIVATE
  //       companyId: visibilityType === "PRIVATE" ? selectedCompany : null,
  //       roleId: visibilityType === "PRIVATE" ? selectedRole : null,

  //       createdAt: new Date().toLocaleDateString(),
  //       isActive: false,
  //     };

  //     if (isEditMode && editingId) {
  //       SalaryStructureService.update(editingId, payload);
  //     } else {
  //       SalaryStructureService.create(payload);
  //     }

  //     setVisibilityModalOpen(false);
  //     onBack();
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const handleSaveClick = async () => {
    try {
      // 1. Form validation (structure name, description)
      await form.validateFields();

      // 2. Earnings validation
      if (!isEarningValid) {
        message.error("Earnings total must be exactly 100% to save structure");
        return;
      }

      // 3. എല്ലാം ശരിയാണെങ്കിൽ visibility modal തുറക്കുക
      setVisibilityModalOpen(true);
    } catch (err) {
      console.log("Validation Error:", err);
      // Form validation failed - AntD automatically shows errors
    }
  };

  const confirmSaveStructure = async () => {
    try {
      // Visibility specific validations
      if (visibilityType === "PRIVATE") {
        if (!selectedCompany || !selectedRole) {
          message.error("Please select company and role");
          return;
        }
      }

      const values = form.getFieldsValue(); // Already validated in handleSaveClick

      const payload = {
        id: isEditMode && editingId ? editingId : Date.now(),
        name: values.structureName,
        description: values.structureDescription,
        grossSalary,
        earnings,
        deductions,
        deductionsEnabled,
        visibility: visibilityType,
        companyId: visibilityType === "PRIVATE" ? selectedCompany : null,
        roleId: visibilityType === "PRIVATE" ? selectedRole : null,
        createdAt: new Date().toLocaleDateString(),
        isActive: false,
      };

      if (isEditMode && editingId) {
        SalaryStructureService.update(editingId, payload);
      } else {
        SalaryStructureService.create(payload);
      }

      setVisibilityModalOpen(false);
      onBack();
      message.success(
        isEditMode
          ? "Salary structure updated successfully!"
          : "Salary structure created successfully!",
      );
    } catch (err) {
      console.log(err);
      message.error("Failed to save structure");
    }
  };
  const MAX_INLINE_LENGTH = 40;

  const isLongText = (text?: string) =>
    !!text && text.length > MAX_INLINE_LENGTH;

  return (
    <ConfigProvider componentSize="small">
      {/* <MainLayout> */}
      <Card>
        <div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {/* Left section */}
            <Space align="center" size={12}>
              <ArrowLeftOutlined
                style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
                onClick={onBack}
              />

              <div style={{ display: "flex", flexDirection: "column" }}>
                <Title level={4} style={{ marginBottom: 0 }}>
                  {isEditMode
                    ? "Edit Salary Structure"
                    : "Create Salary Structure"}
                </Title>

                <Text type="secondary" style={{ fontSize: 12, marginTop: 0 }}>
                  Configure earnings and deductions percentages applicable to
                  all employees
                </Text>
              </div>
            </Space>

            {/* Right section */}
            {/* <Space> */}
            {/* Refresh */}
            {/* {!isEditMode && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              )} */}

            {/* Save / Update */}
            {/* <Button
              type="primary"
              onClick={handleSaveStructure}
              disabled={!isEarningValid}
              style={{
                opacity: isEarningValid ? 1 : 0.5,
                cursor: isEarningValid ? "pointer" : "not-allowed",
              }}
            >
              {isEditMode ? "Update Structure" : "Save Structure"}
            </Button>
          </Space> */}
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setPreviewDrawerOpen(true)}
              >
                Preview
              </Button>

              <Button
                type="primary"
                onClick={handleSaveClick}
                disabled={!isEarningValid}
                style={{
                  opacity: isEarningValid ? 1 : 0.5,
                  cursor: isEarningValid ? "pointer" : "not-allowed",
                }}
              >
                {isEditMode ? "Update Structure" : "Save Structure"}
              </Button>
            </Space>
          </div>
          {!isEarningValid && (
            <Text type="danger" style={{ fontSize: 12 }}>
              Earnings total must be exactly 100% to save structure
            </Text>
          )}

          {/* Form */}
          <Form layout="vertical" form={form}>
            <Row gutter={8}>
              <Col span={9}>
                <Form.Item
                  label="Structure Name"
                  name="structureName"
                  rules={[
                    { required: true, message: "Please enter structure name" },
                  ]}
                >
                  <Input size="middle" style={{ height: 36 }} />
                </Form.Item>
              </Col>

              <Col span={14}>
                <Form.Item
                  label="Description"
                  name="structureDescription"
                  rules={[
                    {
                      required: true,
                      message: "Please enter structure Description",
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={1}
                    autoSize={false}
                    style={{ height: 36, resize: "none" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Row gutter={12}>
            {/* LEFT */}
            <Col span={14}>
              {/* Earnings */}
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  // boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "solid 1px #ccc",
                }}
              >
                <Row justify="space-between">
                  <Title level={5}>Earnings</Title>

                  <Text
                    type={totalEarningPercent === 100 ? "success" : "danger"}
                  >
                    {totalEarningPercent}%
                  </Text>
                </Row>

                <Text type="secondary" style={{ fontSize: 12 }}>
                  Define earning components that make up the gross salary
                </Text>

                <Progress
                  percent={totalEarningPercent}
                  size="small"
                  strokeWidth={6}
                  status={totalEarningPercent === 100 ? "success" : "exception"}
                />

                {/* Earnings Header */}
                <Row
                  gutter={6}
                  style={{
                    marginBottom: 6,
                    paddingBottom: 4,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Col span={9}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Component Name
                    </Text>
                  </Col>

                  <Col span={5}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Percentage (%)
                    </Text>
                  </Col>

                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Descriptions
                    </Text>
                  </Col>

                  <Col span={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Actions
                    </Text>
                  </Col>
                </Row>

                {earningAmounts.map((e) => (
                  <Row gutter={6} key={e.id} style={{ marginBottom: 6 }}>
                    <Col span={9}>
                      <Input
                        value={e.name}
                        onChange={(ev) =>
                          setEarnings((p) =>
                            p.map((x) =>
                              x.id === e.id
                                ? { ...x, name: ev.target.value }
                                : x,
                            ),
                          )
                        }
                      />
                    </Col>
                    <Col span={5}>
                      <InputNumber
                        min={0}
                        max={100}
                        value={e.percentage}
                        style={{ width: "100%" }}
                        onChange={(v) =>
                          setEarnings((p) =>
                            p.map((x) =>
                              x.id === e.id
                                ? { ...x, percentage: Number(v) }
                                : x,
                            ),
                          )
                        }
                      />
                    </Col>
                    {/* <Col span={8}>
                      <Text>₹{e.amount.toLocaleString()}</Text>
                    </Col> */}

                    {/* THIS IS THE DESCRIPTION COLUMN */}
                    <Col span={8}>
                      <div
                        style={{
                          border: "1px dashed #d9d9d9",
                          borderRadius: 6,
                          padding: "4px 6px",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {/* SHORT TEXT → INLINE EDIT */}
                        {!isLongText(e.description) ? (
                          <Input
                            size="small"
                            placeholder="Add description"
                            value={e.description}
                            onChange={(ev) =>
                              setEarnings((prev) =>
                                prev.map((x) =>
                                  x.id === e.id
                                    ? { ...x, description: ev.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        ) : (
                          /* LONG TEXT → READ ONLY */
                          <span
                            style={{
                              flex: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "#000",
                            }}
                          >
                            {e.description}
                          </span>
                        )}

                        {/* EXPAND ICON – ONLY FOR LONG TEXT */}
                        {isLongText(e.description) && (
                          <ExpandOutlined
                            style={{ cursor: "pointer", color: "#1677ff" }}
                            onClick={() => {
                              setActiveEarning(e);
                              setTempDescription(e.description || "");
                              setDescModalOpen(true);
                            }}
                          />
                        )}
                      </div>
                    </Col>

                    <Col span={2}>
                      <Button
                        icon={<DeleteOutlined />}
                        type="text"
                        danger
                        disabled={e.name === "Basic Pay"}
                        onClick={() =>
                          setEarnings((p) => p.filter((x) => x.id !== e.id))
                        }
                      />
                    </Col>
                  </Row>
                ))}

                <Button
                  icon={<PlusOutlined />}
                  block
                  size="small"
                  onClick={addEarning}
                >
                  Add Earning
                </Button>
              </Card>

              {/* Deductions */}
              <Card
                size="small"
                style={{
                  marginTop: 12,
                  borderRadius: 10,
                  // boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  border: "solid 1px #ccc",
                }}
              >
                <Row justify="space-between" align="middle">
                  <Title level={5} style={{ margin: 0 }}>
                    Deductions
                  </Title>

                  <Switch
                    size="small"
                    checked={deductionsEnabled}
                    onChange={setDeductionsEnabled}
                  />
                </Row>

                {/* Deductions Header */}
                <Row
                  gutter={6}
                  style={{
                    marginBottom: 6,
                    paddingBottom: 4,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Deduction Name
                    </Text>
                  </Col>

                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Calculation Type
                    </Text>
                  </Col>

                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Percentage (%)
                    </Text>
                  </Col>

                  <Col span={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Actions
                    </Text>
                  </Col>
                </Row>

                {deductionsEnabled && (
                  <>
                    {deductionAmounts.map((d) => (
                      <Row gutter={6} key={d.id} style={{ marginBottom: 6 }}>
                        <Col span={6}>
                          <Input
                            value={d.name}
                            onChange={(e) =>
                              setDeductions((p) =>
                                p.map((x) =>
                                  x.id === d.id
                                    ? { ...x, name: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </Col>

                        <Col span={6}>
                          <Select
                            value={d.type}
                            style={{ width: "100%" }}
                            onChange={(v) =>
                              setDeductions((p) =>
                                p.map((x) =>
                                  x.id === d.id ? { ...x, type: v } : x,
                                ),
                              )
                            }
                            options={[
                              { value: "BASIC_PERCENT", label: "% Basic" },
                              { value: "GROSS_PERCENT", label: "% Gross" },
                              { value: "FIXED", label: "Fixed" },
                            ]}
                          />
                        </Col>

                        <Col span={6}>
                          <InputNumber
                            min={0}
                            value={d.value}
                            style={{ width: "100%" }}
                            onChange={(v) =>
                              setDeductions((p) =>
                                p.map((x) =>
                                  x.id === d.id
                                    ? { ...x, value: Number(v) }
                                    : x,
                                ),
                              )
                            }
                          />
                        </Col>

                        {/* <Col span={4}>
                          <Text>₹{d.amount}</Text>
                        </Col> */}

                        <Col span={2}>
                          <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            onClick={() =>
                              setDeductions((p) =>
                                p.filter((x) => x.id !== d.id),
                              )
                            }
                          />
                        </Col>
                      </Row>
                    ))}

                    <Button
                      icon={<PlusOutlined />}
                      block
                      size="small"
                      onClick={addDeduction}
                    >
                      Add Deduction
                    </Button>
                  </>
                )}
              </Card>
            </Col>

            {/* RIGHT */}
            <Col span={10}>
              <SalaryPreview
                grossSalary={grossSalary}
                setGrossSalary={setGrossSalary}
                earnings={earnings}
                deductions={deductions}
                deductionsEnabled={deductionsEnabled}
              />
            </Col>
          </Row>
          <Modal
            open={descModalOpen}
            title={
              activeEarning
                ? `Description for "${activeEarning.name}"`
                : "Earning Description"
            }
            onCancel={() => setDescModalOpen(false)}
            onOk={() => {
              if (!activeEarning) return;

              setEarnings((prev) =>
                prev.map((e) =>
                  e.id === activeEarning.id
                    ? { ...e, description: tempDescription }
                    : e,
                ),
              );

              message.success("Description updated successfully!");

              setDescModalOpen(false);
              setActiveEarning(null);
              setTempDescription("");
            }}
            okText="Done"
          >
            {activeEarning && (
              <>
                {/* Component Name */}
                <Row gutter={12} align="middle" style={{ marginBottom: 12 }}>
                  <Col span={16}>
                    <Text type="secondary">Component Name</Text>
                    <div>
                      <Text strong>{activeEarning.name}</Text>
                    </div>
                  </Col>

                  <Col span={8}>
                    <Text type="secondary">Percentage</Text>
                    <div>
                      <Text strong>{activeEarning.percentage}%</Text>
                    </div>
                  </Col>
                </Row>

                <Divider />

                {/* Description */}
                <Text type="secondary">Description</Text>
                <Input.TextArea
                  rows={4}
                  placeholder="Enter description"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  style={{ marginTop: 6 }}
                />
              </>
            )}
          </Modal>

          <Modal
            open={visibilityModalOpen}
            title="Structure Visibility"
            onCancel={() => setVisibilityModalOpen(false)}
            onOk={confirmSaveStructure}
            okText="Confirm & Save"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {/* Radio */}
              <Radio.Group
                value={visibilityType}
                onChange={(e) => setVisibilityType(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="PUBLIC">
                    Public (Visible to all companies)
                  </Radio>
                  <Radio value="PRIVATE">Private (Restricted access)</Radio>
                </Space>
              </Radio.Group>

              {/* Private Options */}
              {visibilityType === "PRIVATE" && (
                <>
                  <Divider />

                  <Form layout="vertical">
                    <Form.Item label="Company">
                      <Select
                        placeholder="Select Company"
                        value={selectedCompany}
                        onChange={setSelectedCompany}
                        options={companies.map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item label="Role">
                      <Select
                        placeholder="Select Role"
                        value={selectedRole}
                        onChange={setSelectedRole}
                        options={roles.map((r) => ({
                          value: r.id,
                          label: r.name,
                        }))}
                      />
                    </Form.Item>
                  </Form>
                </>
              )}
            </Space>
          </Modal>
        </div>
        {/* </ConfigProvider> */}
        {/* </MainLayout> */}
      </Card>

      {/* Preview Drawer */}
      <Drawer
        title={form.getFieldValue("structureName") || "Salary Preview"}
        width={500}
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
      >
        <SalaryPreview
          grossSalary={grossSalary}
          setGrossSalary={() => {}}
          earnings={earnings}
          deductions={deductions}
          deductionsEnabled={deductionsEnabled}
          readOnly
        />
      </Drawer>
    </ConfigProvider>
  );
};
export default NewSalaryStructure;
