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
        current_annual_ctc: typeof record.current_annual_ctc === 'string' ? parseFloat(record.current_annual_ctc) : record.current_annual_ctc,
        current_monthly_ctc: typeof record.current_monthly_ctc === 'string' ? parseFloat(record.current_monthly_ctc) : record.current_monthly_ctc,
        additional_pf_pct: typeof record.additional_pf_pct === 'string' ? parseFloat(record.additional_pf_pct) : record.additional_pf_pct,
        is_additional_pf_active: record.is_additional_pf_active,
        nps_contribution_pct: typeof record.nps_contribution_pct === 'string' ? parseFloat(record.nps_contribution_pct) : record.nps_contribution_pct,
        insurance_topup: typeof record.insurance_topup === 'string' ? parseFloat(record.insurance_topup) : record.insurance_topup,
        is_active: record.is_active,
        fbp_meal: typeof record.fbp_choices?.meal === 'string' ? parseFloat(record.fbp_choices?.meal as any) : (record.fbp_choices?.meal || 0),
        fbp_fuel: typeof record.fbp_choices?.fuel === 'string' ? parseFloat(record.fbp_choices?.fuel as any) : (record.fbp_choices?.fuel || 0),
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

  const formatCurrency = (amount?: number | string) => {
    if (amount === undefined || amount === null || amount === "") return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "-";
    return numAmount.toLocaleString("en-IN", {
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
              {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : (record.employee_name || "Employee Name")}
            </Title>
            <Text type="secondary" style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
              {record.employee?.employee_code || record.employee_code || record.employee_id}
            </Text>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Tag style={{ background: record.is_active ? '#e6f4ea' : '#f1f5f9', color: record.is_active ? '#1e8e3e' : '#64748b', border: 'none', borderRadius: 20, padding: '2px 12px', fontWeight: 500 }}>
                {record.is_active ? 'Active' : 'Inactive'}
              </Tag>
              <Tag style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 20, padding: '2px 12px', fontWeight: 500 }}>
                {record.salary_structure?.name || "Standard Structure"}
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
                  value={record.is_additional_pf_active ? `${record.additional_pf_pct}%` : 'Inactive'} 
                />
                <InfoRow 
                  label="NPS Contribution" 
                  value={record.is_nps_active ? `${record.nps_contribution_pct}%` : 'Inactive'} 
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
                  {(record.salary_timeline || []).slice().reverse().map((item: any, index: number) => (
                    <div key={index} style={{ position: 'relative', marginBottom: index === 0 ? 0 : 24 }}>
                      <div style={{ 
                        position: 'absolute', 
                        width: 8, 
                        height: 8, 
                        background: item.action === 'CREATED' ? '#52c41a' : '#1677ff', 
                        borderRadius: '50%', 
                        left: -21, 
                        top: 6 
                      }} />
                      <Space style={{ marginBottom: 4, width: '100%', justifyContent: 'space-between' }}>
                        <Tag style={{ 
                          borderRadius: 12, 
                          border: 'none', 
                          background: item.action === 'CREATED' ? '#f6ffed' : '#e6f4ff', 
                          color: item.action === 'CREATED' ? '#52c41a' : '#1677ff',
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {item.action}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </Space>
                      
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {formatCurrency(item.current_annual_ctc)}
                        {item.annual_ctc_change_pct > 0 && (
                          <Tag style={{ 
                            border: 'none', 
                            background: '#f6ffed', 
                            color: '#52c41a', 
                            fontSize: 12, 
                            margin: 0,
                            padding: '0 6px',
                            fontWeight: 600
                          }}>
                            ↑ {item.annual_ctc_change_pct}% hike
                          </Tag>
                        )}
                      </div>

                      {item.note && (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          {item.note}
                        </Text>
                      )}

                      {item.changes && Object.keys(item.changes).length > 0 && (
                        <div style={{ marginTop: 8, padding: '8px', background: '#f9fafb', borderRadius: 4 }}>
                          {Object.entries(item.changes).map(([key, val]: [string, any], kIndex) => (
                            <div key={kIndex} style={{ fontSize: 11, color: '#4b5563', marginBottom: 2 }}>
                              <Text strong style={{ fontSize: 11 }}>{key.replace(/_/g, ' ')}:</Text> {String(val.old)} → <Text strong style={{ fontSize: 11, color: '#059669' }}>{String(val.new)}</Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 32 }}>
                Last updated: {record.updated_at ? new Date(record.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </Text>
            </>
        )}
        
      </Form>
    </Drawer>
  );
}
