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
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ExpandOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import { Earning, Deduction } from "@/types/salaryStructure";
import SalaryPreview from "@/app/salary/SalaryPreview";
import { useSalaryComponents } from "@/hooks/useSalaryComponents";
import {
  useSalaryStructure,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
} from "@/hooks/useSalaryStructures";
import {
  calculateEarnings,
  calculateDeductionAmounts,
  calculateTotalDeductions,
  calculateNetPay,
} from "@/utils/salaryCalculator";
import { Toaster, toast } from "react-hot-toast";
import { useAllCompanies } from "@/hooks/useCompanies";
const { Title, Text } = Typography;

interface Props {
  mode: "create" | "edit";
  editingId: number | null;
  onBack: () => void;
  onPreview: (type: "salary", data: any) => void;
}

const NewSalaryStructure = ({ mode, editingId, onBack, onPreview }: Props) => {
  const isEditMode = mode === "edit";

  const { data: fetchedStructure } = useSalaryStructure(editingId, isEditMode);

  const [form] = Form.useForm();
  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();

  const [grossSalary, setGrossSalary] = useState<number>(16500);
  const [deductionsEnabled, setDeductionsEnabled] = useState(false);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);

  const [descModalOpen, setDescModalOpen] = useState(false);
  const [activeEarning, setActiveEarning] = useState<Earning | null>(null);
  const [tempDescription, setTempDescription] = useState("");

  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [visibilityType, setVisibilityType] = useState<"PUBLIC" | "PRIVATE">(
    "PUBLIC",
  );
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  const { data: salaryComponentData } = useSalaryComponents({
    status: "Active",
  });

  const { data: companiesData } = useAllCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!fetchedStructure) return;

    form.setFieldsValue({
      structureName: fetchedStructure.name,
      structureDescription: fetchedStructure.description,
    });

    setGrossSalary(fetchedStructure.grossSalary);
    setEarnings(fetchedStructure.earnings || []);
    setDeductions(fetchedStructure.deductions || []);
    setDeductionsEnabled(fetchedStructure.deductionsEnabled);
  }, [fetchedStructure, form]);

  // const companies = [
  //   { id: 1, name: "ABC Pvt Ltd" },
  //   { id: 2, name: "XYZ Technologies" },
  // ];

  const roles = [
    { id: 1, name: "Manager" },
    { id: 2, name: "Developer" },
    { id: 3, name: "HR" },
  ];

  const salaryCalcInput = useMemo(
    () => ({
      grossSalary,
      earnings,
      deductions,
      deductionsEnabled,
    }),
    [grossSalary, earnings, deductions, deductionsEnabled],
  );

  const earningAmounts = useMemo(
    () => calculateEarnings(salaryCalcInput),
    [salaryCalcInput],
  );

  const deductionAmounts = useMemo(
    () => calculateDeductionAmounts(salaryCalcInput),
    [salaryCalcInput],
  );

  useMemo(() => calculateTotalDeductions(salaryCalcInput), [salaryCalcInput]);

  useMemo(() => calculateNetPay(salaryCalcInput), [salaryCalcInput]);

  const totalEarningPercent = useMemo(
    () => earnings.reduce((s, e) => s + e.percentage, 0),
    [earnings],
  );

  const isEarningValid = totalEarningPercent === 100;

  const addEarning = () =>
    setEarnings((p) => [...p, { id: Date.now(), name: "", percentage: 0 }]);

  const addDeduction = () =>
    setDeductions((p) => [
      ...p,
      { id: Date.now(), name: "", type: "FIXED", value: 0 },
    ]);

  const handleSaveClick = async () => {
    try {
      await form.validateFields();

      if (!isEarningValid) {
        toast.error("Earnings total must be exactly 100%");
        return;
      }

      const isEarningsComplete = () => {
        return earnings.every((e) => e.name && e.percentage > 0);
      };
      if (!isEarningsComplete()) {
        toast.error("Please select earning component for all percentages", {
          position: "top-center",
        });
        return;
      }

      const isDeductionsComplete = () => {
        if (!deductionsEnabled) return true;

        return deductions.every(
          (d) => d.name && d.value !== null && d.value > 0,
        );
      };

      if (!isDeductionsComplete()) {
        toast.error(
          "Please select deduction component for all entered values",
          {
            position: "top-center",
          },
        );
        return;
      }

      setVisibilityModalOpen(true);
    } catch (err) {
      // 🔥 FORM REQUIRED FIELD ERROR
      toast.error("Please enter Structure Name and Description", {
        position: "top-center",
      });
    }
  };

  const confirmSaveStructure = async () => {
    if (visibilityType === "PRIVATE" && (!selectedCompany || !selectedRole)) {
      toast.error("Please select company and role");
      return;
    }

    const values = form.getFieldsValue();

    const payload = {
      name: values.structureName,
      description: values.structureDescription,
      grossSalary,
      earnings,
      deductions,
      deductionsEnabled,
      visibility: visibilityType,
      companyId: visibilityType === "PRIVATE" ? selectedCompany : null,
      roleId: visibilityType === "PRIVATE" ? selectedRole : null,
    };

    if (isEditMode && editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }

    setVisibilityModalOpen(false);
    onBack();
    message.success(
      isEditMode ? "Salary structure updated!" : "Salary structure created!",
    );
  };

  const MAX_INLINE_LENGTH = 40;
  const isLongText = (text?: string) =>
    !!text && text.length > MAX_INLINE_LENGTH;

  const earningComponentOptions = useMemo(() => {
    const selected = earnings.map((e) => e.name).filter(Boolean);
    return (
      salaryComponentData?.data
        ?.filter((c) => c.type?.toUpperCase() === "EARNING")
        .map((c) => ({
          label: c.componentName,
          value: c.componentName,
          disabled: selected.includes(c.componentName),
        })) || []
    );
  }, [salaryComponentData, earnings]);

  const deductionComponentOptions = useMemo(() => {
    const selected = deductions.map((d) => d.name).filter(Boolean);
    return (
      salaryComponentData?.data
        ?.filter((c) => c.type?.toUpperCase() === "DEDUCTION")
        .map((c) => ({
          label: c.componentName,
          value: c.componentName,
          disabled: selected.includes(c.componentName),
        })) || []
    );
  }, [salaryComponentData, deductions]);

  return (
    <ConfigProvider componentSize="small">
      <Card style={{marginLeft: 5, marginTop:-16, marginRight:5}}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
          }}
        />

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
                onClick={() =>
                  onPreview("salary", {
                    name: form.getFieldValue("structureName") || "Untitled",
                    grossSalary,
                    earnings,
                    deductions,
                    deductionsEnabled,
                  })
                }
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
                      <Select
                        placeholder="Select earning component"
                        value={e.name}
                        options={earningComponentOptions}
                        style={{ width: "100%" }} // 🔥 IMPORTANT
                        onChange={(value) =>
                          setEarnings((p) =>
                            p.map((x) =>
                              x.id === e.id ? { ...x, name: value } : x,
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
                          <Select
                            placeholder="Select deduction component"
                            value={d.name}
                            options={deductionComponentOptions}
                            style={{ width: "100%" }} // 🔥 IMPORTANT
                            onChange={(value) =>
                              setDeductions((p) =>
                                p.map((x) =>
                                  x.id === d.id ? { ...x, name: value } : x,
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
            <Col span={10} className="left-divider">
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
                    <div style={{ color: "#52c41a" }}>
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
                <div
                  style={{
                    fontSize: "12px",
                    color: "#bfbfbf",
                    marginTop: "8px",
                  }}
                >
                  Tip: Describe how this component is calculated or any special
                  conditions.
                </div>
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
                        options={
                          companiesData?.map((c) => ({
                            value: c.id,
                            label: c.name,
                          })) || []
                        }
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
    </ConfigProvider>
  );
};

export default NewSalaryStructure;
