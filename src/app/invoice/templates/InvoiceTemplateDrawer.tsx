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
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { 
  useCreateInvoiceTemplate, 
  useUpdateInvoiceTemplate,
  useInvoiceTemplate,
  useInvoiceTemplates
} from '@/hooks/useInvoiceTemplates';
import { InvoiceTemplate } from '@/services/invoiceTemplateService';

const { Option } = Select;

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
      title={isEditing ? 'Edit Invoice Template' : 'Create Invoice Template'}
      width={720}
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="primary" 
            onClick={() => form.submit()} 
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={isFetching}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </Space>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                name="name"
                label="Template Name"
                dependencies={['description']}
                rules={[
                  { required: true, message: 'Please enter template name' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      const desc = (getFieldValue('description') || '').trim().toLowerCase();
                      const val = value.trim().toLowerCase();
                      
                      const duplicate = allTemplates.find((t: any) => {
                        if (isEditing && t.id === templateId) return false;
                        const tDesc = (t.description || '').trim().toLowerCase();
                        return t.name.trim().toLowerCase() === val && tDesc === desc;
                      });

                      if (duplicate) {
                        return Promise.reject(new Error('A template with this exact name and description already exists'));
                      }
                      return Promise.resolve();
                    },
                  })
                ]}
              >
                <Input placeholder="e.g. Standard Service Template" />
              </Form.Item>

              <Form.Item
                name="billingType"
                label="Billing Type"
                rules={[{ required: true, message: 'Please select billing type' }]}
              >
                <Select placeholder="Select billing type">
                  <Option value="fixed">Fixed Price</Option>
                  <Option value="hourly">Hourly Rate</Option>
                  <Option value="unit">Unit Based</Option>
                  <Option value="subscription">Subscription</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={2} placeholder="Briefly describe what this template is for" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '24px' }}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isDefault" label="Set as Default" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>

            <Divider orientation="left">Template Fields</Divider>

            <Form.List name="fields">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fields.map(({ key, name, ...restField }) => (
                    <div 
                      key={key} 
                      style={{ 
                        padding: '16px', 
                        background: '#fafafa', 
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px 80px 40px', gap: '8px', alignItems: 'end' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'fieldLabel']}
                          label="Label"
                          rules={[{ required: true, message: 'Label required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Column Title" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'fieldKey']}
                          label="Key"
                          rules={[{ required: true, message: 'Key required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="internal_key" disabled={form.getFieldValue(['fields', name, 'isSystem'])} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'fieldType']}
                          label="Type"
                          rules={[{ required: true, message: 'Required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="Type" disabled={form.getFieldValue(['fields', name, 'isSystem'])}>
                            {FIELD_TYPES.map(t => (
                              <Option key={t.value} value={t.value}>{t.label}</Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'isRequired']}
                          label="Required"
                          valuePropName="checked"
                          style={{ marginBottom: 0, textAlign: 'center' }}
                        >
                          <Switch size="small" />
                        </Form.Item>

                        <Popconfirm
                          title="Delete the field"
                          description="Are you sure to delete this field?"
                          onConfirm={() => remove(name)}
                          okText="Yes"
                          cancelText="No"
                          disabled={form.getFieldValue(['fields', name, 'isSystem'])}
                        >
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            disabled={form.getFieldValue(['fields', name, 'isSystem'])}
                          />
                        </Popconfirm>
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
                              <Typography.Text strong style={{ fontSize: '11px', display: 'block', marginBottom: '8px', color: '#8c8c8c', textTransform: 'uppercase' }}>
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
                                          <Input placeholder={`Option ${index + 1}`} size="small" style={{ borderRadius: '4px' }} />
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
                    icon={<PlusOutlined />}
                  >
                    Add Custom Field
                  </Button>
                </div>
              )}
            </Form.List>
          </Space>
        </Form>
      )}
    </Drawer>
  );
}
