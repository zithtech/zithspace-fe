import { Typography, Table, Form, Input, InputNumber, Button, Space, Divider, Select, Row, Col, Tag, Switch, Tooltip } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  PercentageOutlined,
  WalletOutlined,
  ShoppingOutlined,
  TagOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { nanoid } from 'nanoid';
import React from 'react';

const { Title, Text } = Typography;

interface PricingBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const PricingBlock: React.FC<PricingBlockProps> = ({ data }) => {
  const items = data.items || [];

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const discountAmount = data.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * ((data.taxRate || 0) / 100);
  const total = discountedSubtotal + tax;

  const columns = [
    {
      title: 'Description',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{text}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.description}</div>
        </div>
      )
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center' as const
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (val: number) => `${data.currency === 'USD' ? '$' : data.currency + ' '}${val.toLocaleString()}`
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div style={{ fontWeight: 600 }}>
          {data.currency === 'USD' ? '$' : data.currency + ' '}{(record.price * record.quantity).toLocaleString()}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      {data.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
            {data.title}
          </Title>
          {data.feeStructure && (
            <Tag color="blue" style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>
              {data.feeStructure}
            </Tag>
          )}
        </div>
      )}

      <Table
        dataSource={items}
        columns={columns}
        pagination={false}
        rowKey="id"
        bordered={false}
        size="middle"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <Text style={{ color: 'var(--text-secondary)' }}>Subtotal</Text>
            <Text style={{ color: 'var(--text-primary)' }}>{data.currency === 'USD' ? '$' : data.currency + ' '}{subtotal.toLocaleString()}</Text>
          </div>
          {(data.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#10b981' }}>
              <Text style={{ color: 'inherit' }}>Discount</Text>
              <Text style={{ color: 'inherit' }}>-{data.currency === 'USD' ? '$' : data.currency + ' '}{discountAmount.toLocaleString()}</Text>
            </div>
          )}
          {(data.taxRate || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <Text style={{ color: 'var(--text-secondary)' }}>Tax ({data.taxRate}%)</Text>
              <Text style={{ color: 'var(--text-primary)' }}>{data.currency === 'USD' ? '$' : data.currency + ' '}{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <Text strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Total</Text>
            <Text strong style={{ fontSize: '1.25rem', color: 'var(--premium-blue)' }}>
              {data.currency === 'USD' ? '$' : data.currency + ' '}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </div>
        </div>
      </div>

      {/* Payment Terms & Schedule */}
      {(data.paymentSchedule || data.paymentMethods) && (
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
          <Row gutter={48}>
            <Col span={14}>
              {data.paymentSchedule && (
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <CalendarOutlined style={{ marginRight: '8px', color: 'var(--premium-blue)' }} /> Payment Schedule
                  </Text>
                  <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {data.paymentSchedule.split('\n').filter((t: string) => t.trim().length > 0).map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Col>
            <Col span={10}>
              {data.paymentMethods && (
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                    <CreditCardOutlined style={{ marginRight: '8px', color: '#10b981' }} /> Accepted Methods
                  </Text>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {data.paymentMethods}
                  </div>
                </div>
              )}
            </Col>
          </Row>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: data.taxesIncluded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${data.taxesIncluded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <InfoCircleOutlined style={{ fontSize: '18px', color: data.taxesIncluded ? '#10b981' : '#f59e0b' }} />
            <Text style={{ color: data.taxesIncluded ? '#10b981' : '#f59e0b', fontSize: '0.95rem' }}>
              Please observe the payment terms. <span style={{ fontWeight: 700, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--premium-blue)', padding: '4px 8px', borderRadius: '4px', margin: '0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxes are {data.taxesIncluded ? 'Included' : 'Excluded'}</span> from the final prices listed above.
            </Text>
          </div>

        </div>
      )}
    </div>
  );
};

export const PricingBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue(data);
  }, [data, form]);

  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  return (
    <Form form={form} layout="vertical" onValuesChange={(_, allValues) => onUpdate({ ...data, ...allValues })} initialValues={data}>

      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <WalletOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Global Pricing Configuration</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.Item label={<span style={labelStyle}>Section Title</span>} name="title">
            <Input prefix={<FileTextOutlined style={{ color: 'var(--border-color)' }} />} placeholder="e.g. Pricing & Investment" variant="filled" style={inputStyle} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label={<span style={labelStyle}>Fee Structure</span>} name="feeStructure">
                <Select variant="filled" style={{ ...inputStyle, width: '100%', height: '32px' }}>
                  <Select.Option value="Fixed Price">Fixed Price</Select.Option>
                  <Select.Option value="Hourly Rate">Hourly Rate</Select.Option>
                  <Select.Option value="Monthly Retainer">Monthly Retainer</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={labelStyle}>Currency</span>} name="currency">
                <Input prefix={<DollarOutlined style={{ color: '#cbd5e1' }} />} placeholder="USD" variant="filled" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Tax Rate (%)</span>} name="taxRate" style={{ marginBottom: 0 }}>
                <InputNumber prefix={<PercentageOutlined style={{ color: '#cbd5e1' }} />} min={0} max={100} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Flat Discount</span>} name="discount" style={{ marginBottom: 0 }}>
                <InputNumber prefix={<TagOutlined style={{ color: '#cbd5e1' }} />} min={0} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </div>

      {/* Line Items Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ShoppingOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Service Line Items</Text>
        </div>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}>
                  <Tooltip title="Remove Item">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                    />
                  </Tooltip>

                  <Form.Item {...restField} name={[name, 'name']} label={<span style={labelStyle}>Item Name</span>} style={{ marginBottom: 12 }}>
                    <Input prefix={<TagOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Web Design & Strategy" variant="filled" style={inputStyle} />
                  </Form.Item>

                  <Form.Item {...restField} name={[name, 'description']} label={<span style={labelStyle}>Description</span>} style={{ marginBottom: 12 }}>
                    <Input.TextArea rows={2} placeholder="What does this include?" variant="filled" style={inputStyle} />
                  </Form.Item>

                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item {...restField} name={[name, 'quantity']} label={<span style={labelStyle}>Qty</span>} style={{ marginBottom: 0 }}>
                        <InputNumber min={1} style={{ ...inputStyle, width: '100%' }} variant="filled" />
                      </Form.Item>
                    </Col>
                    <Col span={16}>
                      <Form.Item {...restField} name={[name, 'price']} label={<span style={labelStyle}>Unit Price</span>} style={{ marginBottom: 0 }}>
                        <InputNumber prefix={<DollarOutlined style={{ color: '#cbd5e1' }} />} min={0} style={{ ...inputStyle, width: '100%' }} variant="filled" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              <Button type="dashed" onClick={() => add({ id: nanoid(), name: '', description: '', price: 0, quantity: 1 })} block icon={<PlusOutlined />} style={{ borderRadius: '12px', height: '40px' }}>
                Add New Service Item
              </Button>
            </>
          )}
        </Form.List>
      </div>

      {/* Terms & Logistics */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CalendarOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Payment & Terms</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.Item label={<span style={labelStyle}>Payment Schedule (One per line)</span>} name="paymentSchedule">
            <Input.TextArea rows={3} placeholder="40% Deposit upon signing&#10;60% On completion" variant="filled" style={inputStyle} />
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>Payment Methods</span>} name="paymentMethods">
            <Input prefix={<CreditCardOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Bank Transfer, Stripe" variant="filled" style={inputStyle} />
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: data.taxesIncluded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${data.taxesIncluded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InfoCircleOutlined style={{ color: data.taxesIncluded ? '#10b981' : '#f59e0b' }} />
              <Text style={{ fontSize: '0.8rem', color: data.taxesIncluded ? '#10b981' : '#f59e0b' }}>Tax Inclusion Status</Text>
            </div>
            <Form.Item name="taxesIncluded" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" checkedChildren="INC" unCheckedChildren="EX" />
            </Form.Item>
          </div>
        </div>
      </div>
    </Form>
  );
};
