import React, { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Popconfirm,
  App
} from 'antd';
import {
  useCreateInvoiceTemplate,
  useUpdateInvoiceTemplate,
  useInvoiceTemplate
} from '@/hooks/useInvoiceTemplates';
import {
  FileText,
  Plus,
  Trash2,
  Layers,
  Layout,
  Settings as SettingsIcon,
  GripVertical,
  X
} from 'lucide-react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import ZukvoLoader from "@/components/common/ZukvoLoader";




const { Option } = Select;

const formStyles = `
  .customer-drawer-form .ant-form-item-label > label {
    font-size: 11.5px !important;
    font-weight: 600 !important;
    color: var(--text-slate-400, #94a3b8) !important;
    letter-spacing: .02em;
    height: 18px !important;
  }
  [data-theme='dark'] .customer-drawer-card {
    background: transparent !important;
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .customer-drawer-header {
    background: #0b0f19 !important;
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .customer-drawer-card > div:first-child,
  [data-theme='dark'] .customer-drawer-card .divide-y > * {
    border-color: #1f2937 !important;
  }
  [data-theme='dark'] .invoice-template-drawer-root .ant-drawer-content,
  [data-theme='dark'] .invoice-template-drawer-root .ant-drawer-body {
    background: #020617 !important;
  }
  [data-theme='dark'] .customer-drawer-form .ant-input,
  [data-theme='dark'] .customer-drawer-form .ant-select-selector {
    background: transparent !important;
    border-color: #1f2937 !important;
    color: #f3f4f6 !important;
  }
  [data-theme='dark'] .field-row,
  [data-theme='dark'] .field-row .rounded-lg {
    background: transparent !important;
  }
  .invoice-structure-section .ant-form-item-row {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .invoice-structure-section .ant-form-item-label,
  .invoice-structure-section .ant-form-item-control {
    max-width: none !important;
    flex: 0 0 auto !important;
    width: 100% !important;
  }
  .invoice-structure-section .ant-form-item-label {
    text-align: left !important;
    padding-bottom: 2px !important;
  }
`;

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

const BILLING_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'fixed', label: 'Fixed price', description: 'One-off project amount' },
  { value: 'hourly', label: 'Hourly rate', description: 'Time-based billing' },
  { value: 'unit', label: 'Unit based', description: 'Per-unit pricing' },
  { value: 'subscription', label: 'Subscription', description: 'Recurring charges' },
];

export default function InvoiceTemplateDrawer({ visible, onClose, templateId }: Props) {
  const [form] = Form.useForm();

  const { data: fullTemplate, isLoading: isFetching } = useInvoiceTemplate(
    templateId as string,
    visible && !!templateId
  );

  const { message: messageApi } = App.useApp();

  const createMutation = useCreateInvoiceTemplate();
  const updateMutation = useUpdateInvoiceTemplate();

  const isEditing = !!templateId;

  useEffect(() => {
    if (visible && isEditing && fullTemplate) {
      form.setFieldsValue({
        ...fullTemplate,
        fields: fullTemplate.fields || []
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
        fieldOrder: index + 1
      }))
    };

    if (isEditing && templateId) {
      updateMutation.mutate({ id: templateId, data: payload }, {
        onSuccess: onClose,
        onError: (err: any) => {
          messageApi.error(err.message || 'Failed to update template');
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: onClose,
        onError: (err: any) => {
          messageApi.error(err.message || 'Failed to create template');
        }
      });
    }
  };

  const SectionHeader = ({
    num,
    title,
    subtitle,
    icon: Icon
  }: {
    num?: string;
    title: string;
    subtitle?: string;
    icon?: any;
  }) => (
    <div
      className="mx-5 pt-4 pb-3 flex items-start gap-3 mb-2"
      style={{ borderBottom: "1px dashed var(--border-color)" }}
    >
      <div
        className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold"
        style={{
          background: "rgba(59,130,246,0.10)",
          color: "#3b82f6",
          border: "1px solid rgba(59,130,246,0.22)"
        }}
      >
        {num ? num : <Icon size={13} strokeWidth={2.25} />}
      </div>
      <div>
        <div
          className="text-[13px] font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="text-[11px] font-medium mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{formStyles}</style>
      <Drawer
        rootClassName="invoice-template-drawer-root"
        title={null}
        width={720}
        onClose={onClose}
        open={visible}
        closable={false}
        styles={{
          header: { display: 'none' },
          body: { padding: 0, background: 'var(--customers-page-bg)' },
          footer: { padding: 0, border: 'none' },
          wrapper: { boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.08)' },
          mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' }
        }}
        footer={
          <div
            className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <Button
              onClick={onClose}
              style={{ borderRadius: 8, height: 36 }}
            >
              Discard
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={isFetching}
              style={{
                borderRadius: 8,
                height: 36,
                padding: '0 18px',
                fontWeight: 600,
                background: '#2563eb'
              }}
            >
              {isEditing ? 'Update template' : 'Save template'}
            </Button>
          </div>
        }
      >
        {/* HEADER */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background:
              'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--bg-blue-50)',
                color: 'var(--text-blue-700)',
                border: '1px solid var(--border-blue-200)'
              }}
            >
              <Layout size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {isEditing ? 'Edit template' : 'Create new template'}
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isEditing
                  ? 'Update your professional billing structure'
                  : 'Design a new structure for your client invoices'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center py-20">
            <ZukvoLoader message="Loading template details..." />
          </div>
        ) : (
          <Form
            form={form}
            layout="horizontal"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            labelAlign="left"
            colon={false}
            onFinish={onFinish}
            initialValues={{ isActive: true, isDefault: false }}
            className="customer-drawer-form"
          >
            <div className="px-6 py-6 space-y-5 pb-24">
              {/* GENERAL CARD */}
              <div
                className="customer-drawer-card rounded-none overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <SectionHeader
                  num="01"
                  title="General"
                  subtitle="Identify this template"
                />
                <div className="px-5 py-5 space-y-4">
                  <Form.Item
                    name="name"
                    label="Template name"
                    rules={[{ required: true, message: 'Template name is required' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="e.g. Creative services — hourly"
                      style={{
                        borderRadius: 8,
                        height: 38,
                        borderColor: 'var(--border-color)'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="billingType"
                    label="Billing type"
                    rules={[{ required: true, message: 'Please select billing type' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <SearchableDropdown
                      placeholder="Select billing type"
                      searchPlaceholder="Search billing types..."
                      itemNoun="billing types"
                      options={BILLING_TYPES.map((b) => ({ value: b.value, label: b.label, description: b.description }))}
                      style={{ width: '100%', height: 38 }}
                      width="100%"
                    />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Internal description"
                    style={{ marginBottom: 0 }}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Optional notes about when to use this template..."
                      style={{
                        borderRadius: 8,
                        borderColor: 'var(--border-color)',
                        resize: 'none'
                      }}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* STATUS CARD */}
              <div
                className="customer-drawer-card rounded-none overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <SectionHeader
                  num="02"
                  title="Visibility"
                  subtitle="Where this template appears"
                />
                <div
                  className="mx-5 mb-5 rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div>
                      <div
                        className="text-[13px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Active
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Available when creating new invoices
                      </div>
                    </div>
                    <Form.Item name="isActive" valuePropName="checked" noStyle>
                      <Switch size="small" />
                    </Form.Item>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div
                        className="text-[13px] font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Set as default
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Auto-applied to every new invoice
                      </div>
                    </div>
                    <Form.Item name="isDefault" valuePropName="checked" noStyle>
                      <Switch size="small" />
                    </Form.Item>
                  </div>
                </div>
              </div>

              {/* FIELDS CARD */}
              <div
                className="customer-drawer-card rounded-none overflow-hidden invoice-structure-section"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={Layers}
                    title="Invoice structure"
                    subtitle="Columns of the line items table"
                  />
                </div>

                <Form.List name="fields">
                  {(fields, { add, remove }) => (
                    <div className="px-5 pb-5">
                      <div className="space-y-2.5">
                        {fields.map(({ key, name, ...restField }) => {
                          const isSystem = form.getFieldValue([
                            'fields',
                            name,
                            'isSystem',
                          ]);
                          return (
                            <div
                              key={key}
                              className="field-row rounded-xl"
                              style={{
                                background: isSystem
                                  ? 'var(--bg-slate-50)'
                                  : 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              <div className="px-3 pt-3 pb-3 grid items-end gap-2.5"
                                style={{
                                  gridTemplateColumns:
                                    '20px 1.2fr 1fr 1.1fr 78px 32px'
                                }}
                              >
                                <div
                                  className="flex items-center justify-center pb-2"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  <GripVertical size={14} />
                                </div>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'fieldLabel']}
                                  label={
                                    <span
                                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Label
                                    </span>
                                  }
                                  rules={[{ required: true, message: 'Required' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input
                                    placeholder="e.g. Tax rate"
                                    size="small"
                                    style={{
                                      borderRadius: 6,
                                      height: 32,
                                      borderColor: 'var(--border-color)'
                                    }}
                                  />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'fieldKey']}
                                  label={
                                    <span
                                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Key
                                    </span>
                                  }
                                  rules={[{ required: true, message: 'Required' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input
                                    placeholder="tax_rate"
                                    size="small"
                                    disabled={isSystem}
                                    style={{
                                      borderRadius: 6,
                                      height: 32,
                                      borderColor: 'var(--border-color)',
                                      fontFamily:
                                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                                      fontSize: 12
                                    }}
                                  />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'fieldType']}
                                  label={
                                    <span
                                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Type
                                    </span>
                                  }
                                  rules={[{ required: true, message: 'Required' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <SearchableDropdown
                                    placeholder="Type"
                                    searchPlaceholder="Search types..."
                                    itemNoun="types"
                                    options={FIELD_TYPES}
                                    disabled={isSystem}
                                    style={{ width: '100%', height: 32 }}
                                    width="100%"
                                  />
                                </Form.Item>

                                <Form.Item
                                  {...restField}
                                  name={[name, 'isRequired']}
                                  label={
                                    <span
                                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                                      style={{ color: 'var(--text-secondary)' }}
                                    >
                                      Required
                                    </span>
                                  }
                                  valuePropName="checked"
                                  style={{ marginBottom: 0 }}
                                >
                                  <div className="h-8 flex items-center">
                                    <Switch size="small" />
                                  </div>
                                </Form.Item>

                                <div className="pb-1 flex items-center justify-end">
                                  {isSystem ? (
                                    <span
                                      className="text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                      style={{
                                        color: 'var(--text-secondary)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)'
                                      }}
                                    >
                                      Sys
                                    </span>
                                  ) : (
                                    <Popconfirm
                                      title="Remove field"
                                      description="Are you sure you want to remove this column?"
                                      onConfirm={() => remove(name)}
                                      okText="Delete"
                                      cancelText="Keep"
                                      okButtonProps={{ danger: true }}
                                    >
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<Trash2 size={14} />}
                                      />
                                    </Popconfirm>
                                  )}
                                </div>
                              </div>

                              {/* Dropdown Options */}
                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, cur) =>
                                  prev.fields?.[name]?.fieldType !==
                                  cur.fields?.[name]?.fieldType
                                }
                              >
                                {({ getFieldValue }) => {
                                  const fieldType = getFieldValue([
                                    'fields',
                                    name,
                                    'fieldType',
                                  ]);
                                  if (fieldType !== 'dropdown') return null;
                                  return (
                                    <div
                                      className="px-3 pb-3"
                                      style={{ marginLeft: 28 }}
                                    >
                                      <div
                                        className="rounded-lg p-3"
                                        style={{
                                          background: 'var(--bg-slate-50)',
                                          border: '1px dashed var(--border-color)'
                                        }}
                                      >
                                        <div
                                          className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2"
                                          style={{ color: 'var(--text-secondary)' }}
                                        >
                                          Dropdown options
                                        </div>
                                        <Form.List name={[name, 'options']}>
                                          {(options, { add: addOpt, remove: rmOpt }) => (
                                            <div className="space-y-1.5">
                                              {options.map((option, index) => (
                                                <div
                                                  key={option.key}
                                                  className="flex items-center gap-2"
                                                >
                                                  <span
                                                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                                                    style={{
                                                      background: 'var(--bg-secondary)',
                                                      color: 'var(--text-secondary)',
                                                      border:
                                                        '1px solid var(--border-color)'
                                                    }}
                                                  >
                                                    {index + 1}
                                                  </span>
                                                  <Form.Item
                                                    {...option}
                                                    noStyle
                                                    rules={[
                                                      { required: true, message: 'Required' },
                                                    ]}
                                                  >
                                                    <Input
                                                      placeholder={`Option ${index + 1}`}
                                                      size="small"
                                                      style={{
                                                        borderRadius: 6,
                                                        borderColor:
                                                          'var(--border-color)'
                                                      }}
                                                    />
                                                  </Form.Item>
                                                  <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                    onClick={() => rmOpt(index)}
                                                    disabled={options.length <= 1}
                                                  />
                                                </div>
                                              ))}
                                              <Button
                                                type="dashed"
                                                onClick={() => addOpt('New Option')}
                                                icon={<PlusOutlined />}
                                                size="small"
                                                style={{
                                                  width: 'fit-content',
                                                  borderColor: 'var(--border-color)',
                                                  color: 'var(--text-blue-700)'
                                                }}
                                              >
                                                Add option
                                              </Button>
                                            </div>
                                          )}
                                        </Form.List>
                                      </div>
                                    </div>
                                  );
                                }}
                              </Form.Item>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="dashed"
                        onClick={() =>
                          add({
                            fieldKey: '',
                            fieldLabel: '',
                            fieldType: 'text',
                            isRequired: false,
                            isSystem: false
                          })
                        }
                        block
                        icon={<Plus size={14} />}
                        style={{
                          height: 40,
                          marginTop: 12,
                          borderRadius: 10,
                          borderStyle: 'dashed',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-blue-700)',
                          fontWeight: 600,
                          fontSize: 13
                        }}
                      >
                        Add custom field
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </Form>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
        .field-row { transition: border-color 0.15s, box-shadow 0.15s; }
        .field-row:hover {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.10);
        }
        .custom-select-template .ant-select-selector {
          border-radius: 8px !important;
          height: 38px !important;
          padding: 0 12px !important;
          display: flex; align-items: center;
          border-color: var(--border-color) !important;
        }
        .custom-select-template-sm .ant-select-selector {
          border-radius: 6px !important;
          height: 32px !important;
          padding: 0 10px !important;
          display: flex; align-items: center;
          border-color: var(--border-color) !important;
        }
        .custom-select-template-sm .ant-select-selection-item,
        .custom-select-template .ant-select-selection-item {
          color: var(--text-primary) !important;
        }
      ` }}
        />
      </Drawer>
    </>
  );
}
