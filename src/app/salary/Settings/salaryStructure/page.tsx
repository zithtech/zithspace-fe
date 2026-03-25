"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Divider,
  Popconfirm,
  Drawer,
  Tag,
  Spin,
  Tooltip,
  Modal,
  Badge,
  Dropdown,
  Table,
  Alert,
} from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useSalaryComponents } from "@/hooks/useSalaryComponents";
import {
  useSalaryStructures,
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
  useUpdateSalaryStructureStatus,
  useDeleteSalaryStructure,
} from "@/hooks/useSalaryStructure";
import { calculateSalaryPreview, SalaryComponentInput } from "@/utils/salaryCalculation";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SalaryStructurePage() {
  const [form] = Form.useForm();
  
  // Custom Hooks
  const { data: structuresData, isLoading: structuresLoading } = useSalaryStructures();
  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();
  const statusMutation = useUpdateSalaryStructureStatus();
  const deleteMutation = useDeleteSalaryStructure();

  const [modal, contextHolder] = Modal.useModal();

  const structures = Array.isArray(structuresData) ? structuresData : [];

  // Drawer & Edit State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [monthlyGross, setMonthlyGross] = useState(0);

  // Fetch all active salary components
  const { data: componentsData, isLoading: isComponentsLoading } = useSalaryComponents({
    status: "Active",
    limit: 100,
  });

  const allComponents = componentsData?.data || [];
  const activeEarningComponents = allComponents.filter(c => c.type === "Earning" && c.status);
  const activeDeductionComponents = allComponents.filter(c => c.type === "Deduction" && c.status);

  // Form values watch for dynamic calculations
  const yearlyCTC = Form.useWatch("grossSalary", form) || 0;
  const earningsList = Form.useWatch("earnings", form) || [];
  const deductionsList = Form.useWatch("deductions", form) || [];

  useEffect(() => {
    setMonthlyGross(yearlyCTC / 12);
  }, [yearlyCTC]);

  // Calculation results from local utility (Frontend-Only Preview)
  const calculationResult = useMemo(() => {
    const gross = yearlyCTC / 12;
    if (gross <= 0 || (earningsList.length === 0 && deductionsList.length === 0)) {
      return [];
    }

    const allInputs: SalaryComponentInput[] = [];

    // Map Earnings
    earningsList.filter((e: any) => e?.componentId).forEach((e: any) => {
      const dbComp = allComponents.find(c => c.key === e.componentId);
      if (dbComp) {
        allInputs.push({
          componentId: dbComp.key,
          componentCode: dbComp.componentCode,
          componentName: dbComp.componentName,
          type: "Earning",
          calculationType: e.calculationType || "FIXED",
          percentageBasis: e.calculationType === "PERCENTAGE" ? "GROSS" : null,
          value: Number(e.value) || 0,
        });
      }
    });

    // Map Deductions
    deductionsList.filter((d: any) => d?.componentId).forEach((d: any) => {
      const dbComp = allComponents.find(c => c.key === d.componentId);
      if (dbComp) {
        allInputs.push({
          componentId: dbComp.key,
          componentCode: dbComp.componentCode,
          componentName: dbComp.componentName,
          type: "Deduction",
          calculationType: d.calculationType || "FIXED",
          percentageBasis: d.calculationType === "PERCENTAGE" ? "GROSS" : null,
          value: Number(d.value) || 0,
        });
      }
    });

    return calculateSalaryPreview(gross, allInputs);
  }, [yearlyCTC, earningsList, deductionsList, allComponents]);

  // Derived totals from backend-authoritative result
  const totalEarnings = useMemo(() => {
    return (calculationResult || [])
      .filter(c => c.type === "Earning")
      .reduce((sum, c) => sum + (Number(c.calculatedAmount) || 0), 0);
  }, [calculationResult]);

  const totalDeductions = useMemo(() => {
    return (calculationResult || [])
      .filter(c => c.type === "Deduction")
      .reduce((sum, c) => sum + (Number(c.calculatedAmount) || 0), 0);
  }, [calculationResult]);

  const netSalary = totalEarnings - totalDeductions;

  const totalEarningPercentage = useMemo(() => {
    return (earningsList || [])
      .filter((e: any) => e?.calculationType === "PERCENTAGE" && e?.componentId !== activeEarningComponents.find(ac => ac.componentCode === "SPECIAL_ALLOWANCE")?.key)
      .reduce((sum: number, e: any) => sum + (Number(e?.value) || 0), 0);
  }, [earningsList, activeEarningComponents]);

  // Auto-balance Special Allowance
  useEffect(() => {
    if (!drawerOpen) return;

    const saComponent = activeEarningComponents.find(c => c.componentCode === "SPECIAL_ALLOWANCE");
    if (!saComponent) return;

    // Find index of SA in earningsList
    const saIndex = (earningsList || []).findIndex((e: any) => e?.componentId === saComponent.key);
    if (saIndex === -1) return;

    const remainder = Math.max(0, 100 - totalEarningPercentage);
    
    // Only update if current value is different to avoid infinite loop
    const currentSA = earningsList[saIndex];
    if (currentSA?.value !== remainder || currentSA?.calculationType !== "PERCENTAGE") {
      const newEarnings = [...(earningsList || [])];
      newEarnings[saIndex] = {
        ...currentSA,
        calculationType: "PERCENTAGE",
        value: remainder
      };
      form.setFieldsValue({ earnings: newEarnings });
    }
  }, [totalEarningPercentage, drawerOpen, activeEarningComponents, earningsList, form]);

  // Handlers
  const handleOpenDrawer = () => {
    form.resetFields();
    // Pre-add BASIC if possible? Or just wait for user.
    setEditingId(null);
    setDrawerOpen(true);
  };

  const handleEdit = (structure: any) => {
    const earnings = structure.components
      .filter((c: any) => c.component?.type === "Earning")
      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((c: any) => ({
        componentId: c.componentId,
        calculationType: c.calculationType,
        value: c.value
      }));

    const deductions = structure.components
      .filter((c: any) => c.component?.type === "Deduction")
      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((c: any) => ({
        componentId: c.componentId,
        calculationType: c.calculationType,
        value: c.value
      }));

    form.setFieldsValue({
      name: structure.name,
      effectiveFrom: structure.effectiveFrom ? dayjs(structure.effectiveFrom) : null,
      description: structure.description,
      earnings,
      deductions
    });

    setEditingId(structure.id);
    setDrawerOpen(true);
  };

  const showDeleteConfirm = (id: string) => {
    modal.confirm({
      title: 'Are you sure you want to delete this structure?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        handleDelete(id);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const onFinish = async (values: any) => {
    console.log("Form Values:", values);
    
    const mappedEarnings = (values.earnings || []).map((e: any, index: number) => ({
      componentId: e.componentId,
      calculationType: e.calculationType || "FIXED",
      percentageBasis: e.calculationType === "PERCENTAGE" ? "GROSS" : null,
      value: Number(e.value) || 0,
      displayOrder: index,
    }));

    // Validation: Total earning percentage <= 100%
    const totalEarningPercentage = mappedEarnings
      .filter((e: any) => e.calculationType === "PERCENTAGE")
      .reduce((sum: number, e: any) => sum + e.value, 0);
    
    if (totalEarningPercentage > 100) {
      message.error(`Total earning percentage (${totalEarningPercentage}%) cannot exceed 100%`);
      return;
    }

    const mappedDeductions = (values.deductions || []).map((d: any, index: number) => ({
      componentId: d.componentId,
      calculationType: d.calculationType || "FIXED",
      percentageBasis: d.calculationType === "PERCENTAGE" ? "GROSS" : null,
      value: Number(d.value) || 0,
      displayOrder: mappedEarnings.length + index,
    }));

    const payload = {
      name: values.name,
      effectiveFrom: values.effectiveFrom?.toISOString() || null,
      description: values.description,
      components: [...mappedEarnings, ...mappedDeductions],
    };

    console.log("Proceeding with payload:", payload);
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload as any },
        { onSuccess: () => setDrawerOpen(false) }
      );
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => setDrawerOpen(false)
      });
    }
  };

  const columns = useMemo(() => [
    {
      title: "Structure Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Composition (%)",
      key: "composition",
      render: (_: any, record: any) => {
        const percs = record.components
          .filter((c: any) => c.calculationType === "PERCENTAGE")
          .map((c: any) => `${c.component?.componentName}: ${c.value}%`)
          .join(", ");
        return <Text type="secondary" style={{ fontSize: 13 }}>{percs || "No % rules"}</Text>;
      }
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => <Text>{new Date(date).toLocaleDateString()}</Text>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: any) => (
        <Switch
          checked={isActive}
          size="small"
          loading={statusMutation.isPending && (statusMutation.variables as any)?.id === record.id}
          onChange={(checked) => statusMutation.mutate({ id: record.id, isActive: checked })}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: any) => (
        <Dropdown 
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: 'Edit Structure', onClick: () => handleEdit(record) },
              { key: 'delete', icon: <DeleteOutlined />, danger: true, label: 'Delete Structure', onClick: () => showDeleteConfirm(record.id) }
            ]
          }} 
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined style={{ fontSize: 18 }} />} />
        </Dropdown>
      ),
    },
  ], [statusMutation]);


  const commonComponentColumns = (namePath: string, isEarning: boolean) => (
    <Form.List name={namePath}>
      {(fields, { add, remove }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map(({ key, name, ...restField }) => {
            const currentItem = isEarning ? earningsList[name] : deductionsList[name];
            const isSpecialAllowance = isEarning && activeEarningComponents.find(ac => ac.key === currentItem?.componentId)?.componentCode === 'SPECIAL_ALLOWANCE';

            return (
              <div key={key} style={{ display: "flex", padding: "12px", backgroundColor: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, alignItems: "center", gap: 12, transition: "all 0.3s" }} className="form-row-hover">
                <Form.Item
                  {...restField}
                  name={[name, "componentId"]}
                  rules={[{ required: true, message: "Req" }]}
                  style={{ marginBottom: 0, flex: 2 }}
                >
                  <Select placeholder="Component" loading={isComponentsLoading} showSearch optionFilterProp="children" variant="filled">
                    {(isEarning ? activeEarningComponents : activeDeductionComponents).map(c => {
                      const isUsed = (isEarning ? earningsList : deductionsList).some((e: any, idx: number) => e?.componentId === c.key && idx !== name);
                      const isUnique = ['BASIC', 'SPECIAL_ALLOWANCE'].includes(c.componentCode);
                      return (
                        <Option key={c.key} value={c.key} disabled={isUnique && isUsed}>
                          {c.componentName} ({c.componentCode})
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, "calculationType"]}
                  rules={[{ required: !isSpecialAllowance, message: "Type" }]}
                  style={{ marginBottom: 0, flex: 1.5 }}
                >
                  <Select 
                    placeholder="Type" 
                    variant="filled" 
                    disabled={isSpecialAllowance}
                  >
                    <Option value="FIXED">Fixed</Option>
                    <Option value="PERCENTAGE">Percentage</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, "value"]}
                  rules={[
                    { required: !isSpecialAllowance, message: "Req" },
                    {
                      validator: (_, value) => {
                        if (value < 0) return Promise.reject(">= 0");
                        if (currentItem?.calculationType === "PERCENTAGE" && value > 100) return Promise.reject("Max 100%");
                        return Promise.resolve();
                      }
                    }
                  ]}
                  style={{ marginBottom: 0, flex: 1.5 }}
                >
                  <InputNumber placeholder="Value" style={{ width: "100%" }} variant="filled" disabled={isSpecialAllowance} />
                </Form.Item>


                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => remove(name)} 
                    style={{ flex: 0 }} 
                    disabled={isSpecialAllowance || (isEarning && activeEarningComponents.find(ac => ac.key === currentItem?.componentId)?.componentCode === 'BASIC')}
                    title={isSpecialAllowance || (isEarning && activeEarningComponents.find(ac => ac.key === currentItem?.componentId)?.componentCode === 'BASIC') ? "Core component cannot be deleted" : ""}
                  />
              </div>
            );
          })}
          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ height: 44, borderRadius: 12, marginTop: 4, borderColor: "#d9d9d9", color: "#5c6b7d", backgroundColor: "#fafbfc" }}>
            Add {isEarning ? "Earning" : "Deduction"} Component
          </Button>
        </div>
      )}
    </Form.List>
  );

  return (
    <>
      {contextHolder}
      <style dangerouslySetInnerHTML={{ __html: `
        .salary-card {
          border-radius: 16px;
          border: 1px solid #f0f0f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #ffffff;
          overflow: hidden;
        }
        .salary-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: #d9e8ff;
        }
        .salary-header-bg {
          background: linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%);
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .premium-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 6px;
          overflow: hidden;
          font-size: 12px;
        }
        .premium-table th {
          background-color: #fafbfc;
          color: #5c6b7d;
          font-weight: 600;
          padding: 6px 10px;
          text-align: left;
          border-bottom: 1px solid #eef0f2;
        }
        .premium-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #f5f6f8;
          color: #24292e;
        }
        .premium-table tr:last-child td {
          border-bottom: none;
        }
        .premium-table-total-row td {
          background-color: #fdfdfe;
          font-weight: 700;
          padding: 8px 10px !important;
          border-top: 1px solid #eef0f2;
        }
        .form-row-hover:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #d9d9d9 !important;
        }
        .drawer-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          border: 1px solid #f0f0f0;
          margin-bottom: 24px;
        }
      `}} />

      {/* Header & Table View */}
      <div style={{ marginBottom: 24, padding: "24px 32px", background: "linear-gradient(135deg, #ffffff 0%, #f7f9fc 100%)", borderRadius: 16, border: "1px solid #edf1f7", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1a2b3c" }}>
              Salary Structures
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Design and manage professional compensation plans.
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleOpenDrawer}
            style={{ borderRadius: 8, padding: "0 24px", fontWeight: 600, boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)" }}
          >
            New Structure
          </Button>
        </div>

        <Table
          className="salary-structure-table"
          loading={structuresLoading}
          columns={columns}
          dataSource={structures}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .salary-structure-table .ant-table {
          background: transparent !important;
        }
        .salary-structure-table .ant-table-thead > tr > th {
          background: rgba(240, 242, 245, 0.5) !important;
        }
      `}} />

      {/* Premium Drawer for Create & Edit */}
      {/* Drawer for Create & Edit */}
      <Drawer
        title={editingId ? "Edit Structure" : "New Structure"}
        width={900}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        forceRender // Important for useForm and useWatch connection
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()} 
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={false}
            >
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </Space>
        }
      >
        {totalEarningPercentage > 100 && (
          <Alert
            message="Limit Exceeded"
            description={`Total earning percentage (${totalEarningPercentage}%) cannot exceed 100%.`}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 12 }}
          />
        )}
        {(totalEarningPercentage < 100 && (earningsList || []).some((e: any) => e?.componentId)) && (
          <Alert
            message={(earningsList || []).some((e: any) => activeEarningComponents.find(ac => ac.key === e?.componentId)?.componentCode === "SPECIAL_ALLOWANCE") ? "Balanced Structure" : "Partial Structure"}
            description={
              (earningsList || []).some((e: any) => activeEarningComponents.find(ac => ac.key === e?.componentId)?.componentCode === "SPECIAL_ALLOWANCE") 
                ? `Total combined earnings are balanced at 100% (using ${100 - totalEarningPercentage}% Special Allowance).`
                : `Total earning percentage is ${totalEarningPercentage}%. Remaining ${100 - totalEarningPercentage}% is currently unallocated.`
            }
            type={(earningsList || []).some((e: any) => activeEarningComponents.find(ac => ac.key === e?.componentId)?.componentCode === "SPECIAL_ALLOWANCE") ? "info" : "warning"}
            showIcon
            style={{ marginBottom: 20, borderRadius: 12 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={(errorInfo) => {
            console.log('Validation Failed:', errorInfo);
            message.error("Please fill all required fields correctly.");
          }}
          initialValues={{ earnings: [{}], deductions: [{}] }}
        >
          {drawerOpen && !activeEarningComponents.find(c => c.componentCode === "SPECIAL_ALLOWANCE") && (
            <Alert
              message="Special Allowance Missing"
              description="An earning component with code 'SPECIAL_ALLOWANCE' is required for automatic balancing. Please create one in Salary Component Management."
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 12 }}
            />
          )}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="name" label="Structure Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Standard Package" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="effectiveFrom" label="Effective From">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <TextArea rows={2} placeholder="Optional notes for this structure..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Title level={5} style={{ marginBottom: 16 }}>Earnings Breakdown</Title>
          {commonComponentColumns("earnings", true)}

          <Divider />

          <Title level={5} style={{ marginBottom: 16 }}>Deductions Breakdown</Title>
          {commonComponentColumns("deductions", false)}
        </Form>
      </Drawer>
    </>
  );
}