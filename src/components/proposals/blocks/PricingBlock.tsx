import { Typography, Table, Form, Input, InputNumber, Button, Space, Divider, Select, Row, Col, Tag, Switch, Tooltip, DatePicker } from 'antd';
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
  FileTextOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import React from 'react';
import { AIEnhanceButton } from '../AIEnhanceButton';
import { BlockGhostHint } from './BlockGhost';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { CURRENCIES, currencySymbol } from '@/utils/currencies';

const { Title, Text } = Typography;

// Dynamic pricing-table column types the user can add.
const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percent (%)' },
  { value: 'date', label: 'Date' },
];

const isNumericFieldType = (t: string) => t === 'number' || t === 'currency' || t === 'percent';

interface PricingBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const PricingBlock: React.FC<PricingBlockProps> = ({ data }) => {
  const items = data.items || [];

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const discountAmount = data.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * ((data.taxRate || 0) / 100);
  const total = discountedSubtotal + tax;

  const currencyPrefix = currencySymbol(data.currency);
  const fmtField = (val: any, type: string) => {
    if (val === undefined || val === null || val === '') return <span style={{ color: 'var(--text-slate-400)' }}>—</span>;
    switch (type) {
      case 'currency': return `${currencyPrefix}${Number(val).toLocaleString()}`;
      case 'number': return Number(val).toLocaleString();
      case 'percent': return `${val}%`;
      case 'date': return dayjs(val).isValid() ? dayjs(val).format('MMM D, YYYY') : String(val);
      default: return String(val);
    }
  };

  // User-defined dynamic columns (label + type).
  const customCols = (data.fields || []).map((f: any) => ({
    title: f.label || 'Field',
    key: f.id,
    width: 120,
    align: (isNumericFieldType(f.type) ? 'right' : 'left') as 'right' | 'left',
    render: (_: any, record: any) => fmtField(record.custom?.[f.id], f.type),
  }));

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
    ...customCols,
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
      render: (val: number) => `${currencyPrefix}${Number(val || 0).toLocaleString()}`
    },
    {
      title: 'Total',
      key: 'total',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div style={{ fontWeight: 600 }}>
          {currencyPrefix}{(Number(record.price || 0) * Number(record.quantity || 0)).toLocaleString()}
        </div>
      )
    }
  ];

  const isEmpty = !data.title && items.length === 0;
  const ghostItems = [
    { id: 'g1', name: 'Service or product name', description: 'Brief description of the deliverable.', price: 0, quantity: 1, _ghost: true },
    { id: 'g2', name: 'Additional line item', description: 'Another deliverable or scope of work.', price: 0, quantity: 1, _ghost: true },
  ];
  const itemsToRender = items.length > 0 ? items : ghostItems;

  return (
    <div style={{ padding: '16px 24px' }}>
      {isEmpty && <BlockGhostHint />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <Title
          level={2}
          style={{
            margin: 0,
            color: data.title ? 'var(--text-primary)' : 'var(--text-slate-400)',
            fontStyle: data.title ? 'normal' : 'italic',
          }}
        >
          {data.title || 'Investment'}
        </Title>
        {data.feeStructure && (
          <Tag color="blue" style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', fontWeight: 600 }}>
            {data.feeStructure}
          </Tag>
        )}
      </div>

      <Table
        dataSource={itemsToRender}
        columns={columns}
        pagination={false}
        rowKey="id"
        bordered={false}
        size="middle"
        rowClassName={(record: any) => record._ghost ? 'pricing-ghost-row' : ''}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <Text style={{ color: 'var(--text-secondary)' }}>Subtotal</Text>
            <Text style={{ color: 'var(--text-primary)' }}>{currencyPrefix}{subtotal.toLocaleString()}</Text>
          </div>
          {(data.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#10b981' }}>
              <Text style={{ color: 'inherit' }}>Discount</Text>
              <Text style={{ color: 'inherit' }}>-{currencyPrefix}{discountAmount.toLocaleString()}</Text>
            </div>
          )}
          {(data.taxRate || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <Text style={{ color: 'var(--text-secondary)' }}>Tax ({data.taxRate}%)</Text>
              <Text style={{ color: 'var(--text-primary)' }}>{currencyPrefix}{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </div>
          )}
          <Divider style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <Text strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Total</Text>
            <Text strong style={{ fontSize: '1.25rem', color: 'var(--premium-blue)' }}>
              {currencyPrefix}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={labelStyle}>Section Details</span>
            <AIEnhanceButton 
              originalData={{ 
                title: data.title, 
                feeStructure: data.feeStructure, 
                currency: data.currency, 
                taxRate: data.taxRate, 
                discount: data.discount 
              }} 
              blockType="pricing (global settings)" 
              onApply={(newData) => onUpdate({ ...data, ...newData })} 
            />
          </div>
          <Form.Item name="title" style={{ marginBottom: 12 }}>
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
              <span style={labelStyle}>Currency</span>
              <SearchableDropdown
                value={data.currency || 'USD'}
                onChange={(v) => onUpdate({ ...data, currency: v || 'USD' })}
                allowClear={false}
                searchPlaceholder="Search currency"
                itemNoun="currencies"
                width={260}
                style={{ minWidth: 0, width: '100%' }}
                options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.code}`, description: c.name }))}
              />
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

      {/* Custom Columns */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AppstoreAddOutlined style={{ color: '#2563eb' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Custom Columns</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.List name="fields">
            {(flds, { add, remove }) => (
              <>
                {flds.length === 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    Add typed columns (e.g. Unit, Discount&nbsp;%, Hours, Date). Each appears in the table and as a field on every line item.
                  </div>
                )}
                {flds.map(({ key, name: fname, ...rf }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                    <Form.Item {...rf} name={[fname, 'label']} style={{ flex: 1, marginBottom: 0 }}>
                      <Input placeholder="Column label" variant="filled" style={inputStyle} />
                    </Form.Item>
                    <Form.Item {...rf} name={[fname, 'type']} style={{ width: 130, marginBottom: 0 }}>
                      <Select options={FIELD_TYPE_OPTIONS} variant="filled" style={{ ...inputStyle, width: '100%' }} />
                    </Form.Item>
                    <Tooltip title="Remove column">
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(fname)} style={{ marginTop: 2 }} />
                    </Tooltip>
                  </div>
                ))}
                <Button type="dashed" onClick={() => add({ id: nanoid(), label: '', type: 'text' })} block icon={<PlusOutlined />} style={{ borderRadius: '10px', height: '36px' }}>
                  Add Column
                </Button>
              </>
            )}
          </Form.List>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Service Item</Text>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AIEnhanceButton 
                        originalData={data.items[name]} 
                        blockType="pricing (item)" 
                        onApply={(newItem) => {
                          const newItems = [...data.items];
                          newItems[name] = { ...newItem, id: data.items[name].id };
                          onUpdate({ ...data, items: newItems });
                        }} 
                      />
                      <Tooltip title="Remove Item">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          style={{ height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                      </Tooltip>
                    </div>
                  </div>

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

                  {(data.fields || []).length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border-color)' }}>
                      {(data.fields || []).map((f: any) => {
                        // Controlled binding straight to data — guarantees the value
                        // saves and shows in the table, regardless of Form.List quirks.
                        const itemVal = data.items?.[name]?.custom?.[f.id];
                        const setVal = (v: any) => {
                          const items = [...(data.items || [])];
                          const cur = items[name] || {};
                          items[name] = { ...cur, custom: { ...(cur.custom || {}), [f.id]: v } };
                          onUpdate({ ...data, items });
                        };
                        return (
                          <div key={f.id} style={{ marginBottom: 10 }}>
                            <span style={labelStyle}>{f.label || 'Custom Field'}</span>
                            {isNumericFieldType(f.type) ? (
                              <InputNumber
                                style={{ ...inputStyle, width: '100%' }}
                                variant="filled"
                                value={itemVal ?? undefined}
                                onChange={(v) => setVal(v)}
                                prefix={f.type === 'currency' ? <DollarOutlined style={{ color: '#cbd5e1' }} /> : f.type === 'percent' ? <PercentageOutlined style={{ color: '#cbd5e1' }} /> : undefined}
                              />
                            ) : f.type === 'date' ? (
                              <DatePicker
                                style={{ ...inputStyle, width: '100%' }}
                                variant="filled"
                                format="MMM D, YYYY"
                                value={itemVal ? dayjs(itemVal) : null}
                                onChange={(d) => setVal(d ? d.format('YYYY-MM-DD') : '')}
                              />
                            ) : (
                              <Input
                                variant="filled"
                                style={inputStyle}
                                placeholder={f.label}
                                value={itemVal || ''}
                                onChange={(e) => setVal(e.target.value)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={labelStyle}>Terms & Schedules</span>
            <AIEnhanceButton 
              originalData={{ 
                paymentSchedule: data.paymentSchedule, 
                paymentMethods: data.paymentMethods,
                taxesIncluded: data.taxesIncluded
              }} 
              blockType="pricing (terms)" 
              onApply={(newTerms) => onUpdate({ ...data, ...newTerms })} 
            />
          </div>
          <Form.Item name="paymentSchedule" style={{ marginBottom: 12 }}>
            <Input.TextArea rows={3} placeholder="40% Deposit upon signing&#10;60% On completion" variant="filled" style={inputStyle} />
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>Payment Methods</span>} name="paymentMethods">
            <Input prefix={<CreditCardOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Bank Transfer, Stripe" variant="filled" style={inputStyle} />
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '40px',
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
