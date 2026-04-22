import React, { useEffect } from 'react';
import { 
  Drawer, 
  Form, 
  Input, 
  Button, 
  Space, 
  Select, 
  Divider, 
  Switch, 
  Typography,
  Popconfirm,
  Spin,
  Badge
} from 'antd';
import { 
  useCreateInvoiceTemplate, 
  useUpdateInvoiceTemplate,
  useInvoiceTemplate,
  useInvoiceTemplates
} from '@/hooks/useInvoiceTemplates';
import { InvoiceTemplate } from '@/services/invoiceTemplateService';
import { 
  Tag as TagIcon, 
  Settings as SettingsIcon, 
  FileText, 
  Plus, 
  Trash2, 
  Layers,
  ChevronDown,
  Layout
} from 'lucide-react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  templateId?: string;
}

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Number', value: 'number' },
  { label: 'Currency', value: 'currency' },
  { label: 'Percentage', value: 'percentage' },
  { label: 'Date', value: 'date' },
  { label: 'Dropdown', value: 'dropdown' },
];

export default function InvoiceTemplateDrawer({ visible, onClose, templateId }: Props) {
  const [form] = Form.useForm();
  
  // Fetch full details if we have an ID
  const { data: fullTemplate, isLoading: isFetching } = useInvoiceTemplate(templateId as string, visible && !!templateId);
  const { data: allTemplates = [] } = useInvoiceTemplates();
  
  const createMutation = useCreateInvoiceTemplate();
  const updateMutation = useUpdateInvoiceTemplate();
  
  const isEditing = !!templateId;

  useEffect(() => {
    if (visible && isEditing && fullTemplate) {
      form.setFieldsValue({
        ...fullTemplate,
        fields: fullTemplate.fields || [],
      });
    } else if (visible && !isEditing) {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        isDefault: false,
        fields: [
          { fieldKey: 'item_name', fieldLabel: 'Item Name', fieldType: 'text', fieldOrder: 1, isRequired: true, isSystem: true },
          { fieldKey: 'description', fieldLabel: 'Description', fieldType: 'text', fieldOrder: 2, isRequired: false, isSystem: true },
          { fieldKey: 'qty', fieldLabel: 'Quantity', fieldType: 'number', fieldOrder: 3, isRequired: true, isSystem: true },
          { fieldKey: 'price', fieldLabel: 'Price', fieldType: 'currency', fieldOrder: 4, isRequired: true, isSystem: true },
        ]
      });
    }
  }, [visible, isEditing, fullTemplate, form]);

  const onFinish = (values: any) => {
    const payload = {
      ...values,
      fields: values.fields.map((f: any, index: number) => ({
        ...f,
        fieldOrder: index + 1,
      })),
    };

    if (isEditing && templateId) {
      updateMutation.mutate(
        { id: templateId, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Drawer
      title={
        <Space size={12}>
          <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 10, color: 'var(--text-sky-500)', display: 'flex' }}>
            <Layout size={18} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isEditing ? 'Edit Template' : 'Create New Template'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
              {isEditing ? 'Update your professional billing structure' : 'Design a new structure for your client invoices'}
            </div>
          </div>
        </Space>
      }
      width={720}
      onClose={onClose}
      open={visible}
      styles={{
        header: { borderBottom: '1px solid var(--border-slate-200)', padding: '20px 24px' },
        body: { padding: '24px', paddingBottom: 100 },
        footer: { borderTop: '1px solid var(--border-slate-200)', padding: '16px 24px' }
      }}
      footer={
        <div className="flex justify-end gap-3">
          <Button 
            onClick={onClose}
            style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
          >
            Discard
          </Button>
          <Button 
            type="primary" 
            onClick={() => form.submit()} 
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={isFetching}
            style={{ borderRadius: 8, height: 40, padding: "0 24px", fontWeight: 600, background: "var(--customers-header-icon-color)", border: "none" }}
          >
            {isEditing ? 'Update Template' : 'Save Template'}
          </Button>
        </div>
      }
    >
      {isFetching ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spin tip="Loading template details..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isActive: true, isDefault: false }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ background: 'var(--bg-slate-50)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-slate-100)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <Form.Item
                name="name"
                label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Template Name</Text>}
                rules={[{ required: true, message: 'Template name is required' }]}
              >
                <Input placeholder="e.g. Creative Services - Hourly" style={{ borderRadius: 8, height: 40 }} />
              </Form.Item>

              <Form.Item
                name="billingType"
                label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Billing Type</Text>}
                rules={[{ required: true, message: 'Please select billing type' }]}
              >
                <Select placeholder="Select billing type" style={{ height: 40 }} className="custom-select">
                  <Option value="fixed">Fixed Price</Option>
                  <Option value="hourly">Hourly Rate</Option>
                  <Option value="unit">Unit Based</Option>
                  <Option value="subscription">Subscription</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Internal Description</Text>}
            >
              <Input.TextArea rows={2} placeholder="Optional notes about when to use this template..." style={{ borderRadius: 8 }} />
            </Form.Item>

            <div style={{ display: 'flex', gap: '32px', marginTop: 8 }}>
              <div className="flex items-center gap-3">
                <Form.Item name="isActive" valuePropName="checked" noStyle>
                  <Switch 
                    size="small"
                  />
                </Form.Item>
                <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Active</Text>
              </div>

              <div className="flex items-center gap-3">
                <Form.Item name="isDefault" valuePropName="checked" noStyle>
                  <Switch 
                    size="small"
                  />
                </Form.Item>
                <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Set as Primary</Text>
              </div>
            </div>
          </div>

          <Divider orientation="left">
            <Space size={8}>
              <Layers size={14} style={{ color: 'var(--text-sky-500)' }} />
              <Text style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Invoice Structure Fields</Text>
            </Space>
          </Divider>

            <Form.List name="fields">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div 
                      key={key} 
                      style={{ 
                        padding: '20px', 
                        background: 'var(--customers-card-bg)', 
                        borderRadius: '16px',
                        border: '1px solid var(--border-slate-100)',
                        position: 'relative',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                      className="field-item-card"
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 80px 40px', gap: '12px', alignItems: 'end' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'fieldLabel']}
                          label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase' }}>Label</Text>}
                          rules={[{ required: true, message: 'Required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="e.g. Tax Rate" style={{ borderRadius: 6 }} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'fieldKey']}
                          label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase' }}>ID Key</Text>}
                          rules={[{ required: true, message: 'Required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="tax_rate" disabled={form.getFieldValue(['fields', name, 'isSystem'])} style={{ borderRadius: 6 }} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'fieldType']}
                          label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase' }}>Type</Text>}
                          rules={[{ required: true, message: 'Required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="Type" disabled={form.getFieldValue(['fields', name, 'isSystem'])} style={{ borderRadius: 6 }}>
                            {FIELD_TYPES.map(t => (
                              <Option key={t.value} value={t.value}>{t.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'isRequired']}
                          label={<Text style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', textTransform: 'uppercase' }}>Req.</Text>}
                          valuePropName="checked"
                          style={{ marginBottom: 0, textAlign: 'center' }}
                        >
                          <Switch size="small" />
                        </Form.Item>

                        <div style={{ paddingBottom: 4 }}>
                          <Popconfirm
                            title="Remove Field"
                            description="Are you sure you want to remove this column?"
                            onConfirm={() => remove(name)}
                            okText="Delete"
                            cancelText="Keep"
                            okButtonProps={{ danger: true }}
                            disabled={form.getFieldValue(['fields', name, 'isSystem'])}
                          >
                            <Button 
                              type="text" 
                              danger 
                              icon={<Trash2 size={16} />} 
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-red-50"
                              disabled={form.getFieldValue(['fields', name, 'isSystem'])}
                            />
                          </Popconfirm>
                        </div>
                      </div>

                      {/* Dropdown Options section */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) => 
                          prevValues.fields?.[name]?.fieldType !== curValues.fields?.[name]?.fieldType
                        }
                      >
                        {({ getFieldValue }) => {
                          const fieldType = getFieldValue(['fields', name, 'fieldType']);
                          if (fieldType !== 'dropdown') return null;

                          return (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e8e8e8' }}>
                              <Typography.Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                Dropdown Options
                              </Typography.Text>
                              <Form.List name={[name, 'options']}>
                                {(options, { add: addOption, remove: removeOption }) => (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {options.map((option, index) => (
                                      <div key={option.key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Form.Item
                                          {...option}
                                          noStyle
                                          rules={[{ required: true, message: 'Required' }]}
                                        >
                                          <Input placeholder={`Option ${index + 1}`} size="small" style={{ borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                                        </Form.Item>
                                        <Button 
                                          type="text" 
                                          danger 
                                          icon={<DeleteOutlined />} 
                                          size="small" 
                                          onClick={() => removeOption(index)} 
                                          disabled={options.length <= 1}
                                        />
                                      </div>
                                    ))}
                                    <Button 
                                      type="dashed" 
                                      onClick={() => addOption('New Option')} 
                                      icon={<PlusOutlined />} 
                                      size="small" 
                                      style={{ width: 'fit-content' }}
                                    >
                                      Add Option
                                    </Button>
                                  </div>
                                )}
                              </Form.List>
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>
                  ))}
                  
                  <Button 
                    type="dashed" 
                    onClick={() => add({ fieldKey: '', fieldLabel: '', fieldType: 'text', isRequired: false, isSystem: false })} 
                    block 
                    icon={<Plus size={16} />}
                    style={{ height: 48, borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, background: 'var(--bg-blue-50/20)', color: 'var(--text-sky-600)', fontWeight: 600 }}
                  >
                    Add Custom Billing Field
                  </Button>
                </div>
              )}
            </Form.List>
          </Space>
        </Form>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .field-item-card {
          transition: all 0.3s ease;
        }
        .field-item-card:hover {
          border-color: var(--text-sky-200) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08) !important;
        }
        .custom-select .ant-select-selector {
          border-radius: 8px !important;
        }
        .ant-switch-checked {
          background-color: var(--customers-header-icon-color) !important;
        }
      `}} />
    </Drawer>
  );
}
