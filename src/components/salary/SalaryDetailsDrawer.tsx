import React, { useEffect, useState } from "react";
import { Drawer, Form, Button, Space, Typography, Tag, Row, Col, message } from "antd";
import { EmployeeSalaryRecord } from "../../types/salary";
import { salaryService } from "../../services/salaryService";

const { Title, Text } = Typography;

interface SalaryDetailsDrawerProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  record: EmployeeSalaryRecord | null;
}

export default function SalaryDetailsDrawer({
  visible,
  onClose,
  record,
}: SalaryDetailsDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        current_annual_ctc: record.current_annual_ctc,
        current_monthly_ctc: record.current_monthly_ctc,
        additional_pf_pct: record.additional_pf_pct,
        is_additional_pf_active: record.is_additional_pf_active,
        nps_contribution_pct: record.nps_contribution_pct,
        insurance_topup: record.insurance_topup,
        is_active: record.is_active,
        fbp_meal: record.fbp_choices?.meal || 0,
        fbp_fuel: record.fbp_choices?.fuel || 0,
      });
    } else {
      form.resetFields();
    }
  }, [visible, record, form]);

  const onFinish = async (values: any) => {
    if (!record) return;
    setLoading(true);
    try {
      const payload: Partial<EmployeeSalaryRecord> = {
        current_annual_ctc: values.current_annual_ctc,
        current_monthly_ctc: values.current_monthly_ctc,
        additional_pf_pct: values.additional_pf_pct,
        is_additional_pf_active: values.is_additional_pf_active,
        nps_contribution_pct: values.nps_contribution_pct,
        insurance_topup: values.insurance_topup,
        is_active: values.is_active,
        fbp_choices: {
          meal: values.fbp_meal || 0,
          fuel: values.fbp_fuel || 0,
        },
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{ marginBottom: 24 }}>
      <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>{title}</Title>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
        {children}
      </div>
    </div>
  );

  const InfoRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <Row style={{ marginBottom: 12, alignItems: 'center' }}>
      <Col span={12}>
        <Text type="secondary" style={{ fontSize: 14, color: '#6b7280' }}>{label}</Text>
      </Col>
      <Col span={12} style={{ textAlign: 'right' }}>
        <Text strong style={{ fontSize: 14, color: '#111827' }}>{value}</Text>
      </Col>
    </Row>
  );

  return (
    <Drawer
      placement="right"
      width={480}
      onClose={() => onClose()}
      open={visible}
      closeIcon={null}
      destroyOnClose
      styles={{
        header: { display: 'none' }, // We'll build our own header layout
        body: { padding: '24px' }
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        
        {/* Header Section */}
        {record && (
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #f3f4f6', position: 'relative' }}>
            {/* Close Button Top Right */}
            <Button 
              type="text" 
              onClick={() => onClose()} 
              style={{ position: 'absolute', right: 0, top: 0, color: '#6b7280', fontSize: 18, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </Button>
            
            <Title level={3} style={{ margin: 0, fontSize: 22, color: '#111827' }}>
              {record.employee_name || "Employee Name"}
            </Title>
            <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
              {record.employee_code || record.employee_id}
            </Text>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Tag style={{ background: record.is_active ? '#e6f4ea' : '#f1f5f9', color: record.is_active ? '#1e8e3e' : '#64748b', border: 'none', borderRadius: 20, padding: '2px 12px', fontWeight: 500 }}>
                {record.is_active ? 'Active' : 'Inactive'}
              </Tag>
              <Tag style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 20, padding: '2px 12px', fontWeight: 500 }}>
                Engineering
              </Tag>
            </div>
          </div>
        )}

        {/* Sections */}
        {record && (
            <>
              <SectionCard title="Compensation">
                <InfoRow label="Annual CTC" value={formatCurrency(record.current_annual_ctc)} />
                <div style={{ marginBottom: 0 }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 14, color: '#6b7280' }}>Monthly CTC</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 14, color: '#111827' }}>{formatCurrency(record.current_monthly_ctc)}</Text>
                    </Col>
                  </Row>
                </div>
              </SectionCard>

              <SectionCard title="Deductions & Benefits">
                <InfoRow 
                  label="Voluntary PF" 
                  value={record.is_additional_pf_active ? `${record.additional_pf_pct}%` : 'Not active'} 
                />
                <InfoRow 
                  label="NPS Contribution" 
                  value={record.nps_contribution_pct ? `${record.nps_contribution_pct}%` : 'None'} 
                />
                <div style={{ marginBottom: 0 }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 14, color: '#6b7280' }}>Insurance Top-up</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 14, color: '#111827' }}>
                        {record.insurance_topup ? formatCurrency(record.insurance_topup) : 'None'}
                      </Text>
                    </Col>
                  </Row>
                </div>
              </SectionCard>

              <SectionCard title="Flexible Benefits">
                <InfoRow 
                  label="Meal" 
                  value={record.fbp_choices?.meal ? `${formatCurrency(record.fbp_choices?.meal)}/mo` : 'None'} 
                />
                <div style={{ marginBottom: 0 }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 14, color: '#6b7280' }}>Fuel</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 14, color: '#111827' }}>
                        {record.fbp_choices?.fuel ? `${formatCurrency(record.fbp_choices?.fuel)}/mo` : 'None'}
                      </Text>
                    </Col>
                  </Row>
                </div>
              </SectionCard>
              
              <div style={{ marginBottom: 24 }}>
                <Title level={5} style={{ marginBottom: 16, fontSize: 14 }}>Salary Timeline</Title>
                <div style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid #e5e7eb', marginLeft: 8 }}>
                  {/* Timeline Item 2 */}
                  <div style={{ position: 'relative', marginBottom: 24 }}>
                    <div style={{ position: 'absolute', width: 8, height: 8, background: '#1a2b4c', borderRadius: '50%', left: -21, top: 6 }} />
                    <Space style={{ marginBottom: 4 }}>
                      <Tag style={{ borderRadius: 12, border: '1px solid #e5e7eb', background: 'transparent', color: '#374151' }}>Joining</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>Apr 2023</Text>
                    </Space>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '4px 0' }}>₹15,00,000</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Initial offer</Text>
                  </div>
                  
                  {/* Timeline Item 1 */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', width: 8, height: 8, background: '#1a2b4c', borderRadius: '50%', left: -21, top: 6 }} />
                    <Space style={{ marginBottom: 4 }}>
                      <Tag style={{ borderRadius: 12, border: '1px solid #e5e7eb', background: 'transparent', color: '#374151' }}>Hike</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>Apr 2024</Text>
                    </Space>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '4px 0' }}>
                      <Text delete type="secondary" style={{ marginRight: 8 }}>₹15,00,000</Text>
                      ₹18,00,000
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Annual review</Text>
                  </div>
                </div>
              </div>
              
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 32 }}>
                Last updated: 15 Nov 2024, 04:00 PM
              </Text>
            </>
        )}
        
      </Form>
    </Drawer>
  );
}
