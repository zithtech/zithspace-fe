import React, { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  InputNumber,
  Switch,
  Button,
  Typography,
  Row,
  Col,
  message,
  Select,
  Input,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { EmployeeSalaryRecord } from "../../types/salary";
import { salaryService } from "../../services/salaryService";

const { Text } = Typography;
const { Option } = Select;

interface EditSalaryDrawerProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  record: EmployeeSalaryRecord | null;
}

export default function EditSalaryDrawer({
  visible,
  onClose,
  record,
}: EditSalaryDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        salary_structure_id: record.salary_structure_id,
        current_annual_ctc: typeof record.current_annual_ctc === 'string' ? parseFloat(record.current_annual_ctc) : record.current_annual_ctc,
        current_monthly_ctc: typeof record.current_monthly_ctc === 'string' ? parseFloat(record.current_monthly_ctc) : record.current_monthly_ctc,
        additional_pf_pct: typeof record.additional_pf_pct === 'string' ? parseFloat(record.additional_pf_pct) : record.additional_pf_pct,
        is_additional_pf_active: record.is_additional_pf_active,
        nps_contribution_pct: typeof record.nps_contribution_pct === 'string' ? parseFloat(record.nps_contribution_pct) : record.nps_contribution_pct,
        is_nps_active: record.is_nps_active,
        insurance_topup: typeof record.insurance_topup === 'string' ? parseFloat(record.insurance_topup) : record.insurance_topup,
        is_active: record.is_active,
        fbp_meal: typeof record.fbp_choices?.meal === 'string' ? parseFloat(record.fbp_choices?.meal as any) : (record.fbp_choices?.meal || 0),
        fbp_fuel: typeof record.fbp_choices?.fuel === 'string' ? parseFloat(record.fbp_choices?.fuel as any) : (record.fbp_choices?.fuel || 0),
      });
      fetchStructures();
    } else {
      form.resetFields();
    }
  }, [visible, record, form]);

  const fetchStructures = async () => {
    try {
      const data = await salaryService.fetchSalaryStructures();
      setStructures(data);
    } catch (error) {
      console.error("Failed to fetch structures:", error);
    }
  };

  const onFinish = async (values: any) => {
    if (!record) return;
    setLoading(true);
    try {
      const payload: Partial<EmployeeSalaryRecord> = {
        salary_structure_id: values.salary_structure_id,
        current_annual_ctc: values.current_annual_ctc,
        current_monthly_ctc: values.current_monthly_ctc,
        additional_pf_pct: values.additional_pf_pct,
        is_additional_pf_active: values.is_additional_pf_active,
        nps_contribution_pct: values.nps_contribution_pct,
        is_nps_active: values.is_nps_active,
        insurance_topup: values.insurance_topup,
        is_active: values.is_active,
        fbp_choices: {
          meal: values.fbp_meal || 0,
          fuel: values.fbp_fuel || 0,
        },
        note: values.reason,
      };

      await salaryService.updateEmployeeSalary(record.id, payload);
      message.success("Salary details updated successfully");
      onClose(true);
    } catch (error) {
      console.error("Failed to update salary details", error);
      message.error("Failed to update salary details");
    } finally {
      setLoading(false);
    }
  };

  const CustomDivider = ({ title }: { title: string }) => (
    <div style={{ margin: '32px 0 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 4, height: 18, background: '#1677ff', borderRadius: 2 }} />
      <Text strong style={{ fontSize: 13, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Text>
      <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
    </div>
  );

  const isVPFActive = Form.useWatch('is_additional_pf_active', form);
  const isNPSActive = Form.useWatch('is_nps_active', form);

  return (
    <Drawer
      placement="right"
      width={480}
      onClose={() => onClose()}
      open={visible}
      destroyOnClose
      closeIcon={null}
      styles={{
        header: { display: 'none' },
        body: { padding: '24px 32px' }
      }}
    >
      {/* Custom Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CloseOutlined 
            style={{ color: '#6b7280', fontSize: 16, cursor: 'pointer' }} 
            onClick={() => onClose()} 
          />
          <Text strong style={{ fontSize: 18, color: '#111827' }}>Edit Salary Details</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => onClose()} style={{ borderRadius: 6, fontWeight: 500 }}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={loading} style={{ borderRadius: 6, fontWeight: 500 }}>
            Save
          </Button>
        </div>
      </div>

      {record && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 48 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 13, color: '#6b7280' }}>Employee Name</Text>
            <div style={{ fontSize: 20, fontWeight: 600, margin: '4px 0 0 0', color: '#111827' }}>
              {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : (record.employee_name || 'Employee Name')}
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 13, color: '#6b7280' }}>Employee ID</Text>
            <div style={{ fontSize: 20, fontWeight: 600, margin: '4px 0 0 0', color: '#111827' }}>
              {record.employee?.employee_code?.toUpperCase() || record.employee_code?.toUpperCase() || '-'}
            </div>
          </div>
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={true}>
        <div style={{ marginBottom: 16 }}>
          <Form.Item
            name="salary_structure_id"
            label={<span style={{ fontWeight: 500, color: '#374151' }}>Salary Structure</span>}
            rules={[{ required: true, message: "Required" }]}
          >
            <Select 
              placeholder="Select a salary structure"
              style={{ height: 40 }}
            >
              {structures.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <CustomDivider title="CTC Details" />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="current_annual_ctc"
              label={<span style={{ fontWeight: 500, color: '#374151' }}>Annual CTC</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\₹\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="current_monthly_ctc"
              label={<span style={{ fontWeight: 500, color: '#374151' }}>Monthly CTC</span>}
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value!.replace(/\₹\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
        </Row>

        <CustomDivider title="Retirement & Deductions" />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="additional_pf_pct" 
              label={<span style={{ fontWeight: 500, color: '#374151' }}>Voluntary PF (%)</span>}
              dependencies={['is_additional_pf_active']}
              rules={[
                {
                  required: isVPFActive,
                  message: "Required"
                },
                ...(isVPFActive ? [{
                  min: 0.01,
                  type: 'number' as const,
                  message: "Percentage must be greater than 0"
                }] : [])
              ]}
            >
              <InputNumber 
                disabled={!isVPFActive}
                style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }} 
                min={0} 
                max={100} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="is_additional_pf_active"
              label={<span style={{ fontWeight: 500, color: '#374151' }}>VPF Active</span>}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="nps_contribution_pct" 
              label={<span style={{ fontWeight: 500, color: '#374151' }}>NPS Contribution (%)</span>}
              dependencies={['is_nps_active']}
              rules={[
                {
                  required: isNPSActive,
                  message: "Required"
                },
                ...(isNPSActive ? [{
                  type: 'number' as const,
                  min: 0.01,
                  message: "Percentage must be greater than 0"
                }] : [])
              ]}
            >
              <InputNumber 
                disabled={!isNPSActive}
                style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }} 
                min={0} 
                max={100} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="is_nps_active"
              label={<span style={{ fontWeight: 500, color: '#374151' }}>NPS Active</span>}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="insurance_topup" label={<span style={{ fontWeight: 500, color: '#374151' }}>Insurance Top-up (₹)</span>}>
              <InputNumber style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <CustomDivider title="Flexible Benefit Plan (FBP)" />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fbp_meal" label={<span style={{ fontWeight: 500, color: '#374151' }}>Meal Allowance (₹)</span>}>
              <InputNumber style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="fbp_fuel" label={<span style={{ fontWeight: 500, color: '#374151' }}>Fuel Allowance (₹)</span>}>
              <InputNumber style={{ width: "100%", borderRadius: 6, height: 40, paddingTop: 4 }} min={0} />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24 }}>
          <Form.Item
            name="reason"
            label={<span style={{ fontWeight: 500, color: '#374151' }}>Reason for Change</span>}
            rules={[{ required: false }]}
          >
            <Input.TextArea 
              placeholder="e.g. Annual Hike, Promotion, Correction" 
              rows={3} 
              style={{ borderRadius: 6 }}
            />
          </Form.Item>
        </div>

        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
          <div>
            <Text strong style={{ display: 'block', fontSize: 14, color: '#374151' }}>Active Profile</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>Enable or disable this salary profile</Text>
          </div>
          <Form.Item name="is_active" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}
