
"use client";

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Space,
  Tooltip,
  Typography,
  Divider,
  InputNumber,
  Badge,
  Checkbox,
  Popover,
  Modal,
  Switch,
  Radio,
  DatePicker,
  Dropdown
} from 'antd';
import { Receipt, Sparkles } from 'lucide-react';
import {
  DeleteOutlined,
  PlusOutlined,
  MenuOutlined,
  SettingOutlined,
  CopyOutlined,
  BlockOutlined,
  TableOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useInvoiceTemplates } from '@/hooks/useInvoiceTemplates';
import { ProjectService } from '@/services/projectService';

const { Text } = Typography;

export interface Column {
  key: string;
  label: string;
  isSystem: boolean;
  width?: string;
  type?: 'text' | 'textarea' | 'number' | 'currency' | 'percentage' | 'dropdown' | 'date';
  options?: string[];
  required?: boolean;
  showInPdf?: boolean;
}

export interface DynamicLineItemsProps {
  form: any;
  currencySymbol: string;
  isTaxInclusive: boolean;
  calculateLineTotal: (item: any) => number;
  templateId?: string | null;
  templates?: any[];
  loadingTemplates?: boolean;
  activeColumns: Column[];
  setActiveColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  customerProjects?: Array<{ value: string; label: string; code: string }>;
}

const FIELD_TYPE_OPTIONS: { value: string; label: string; description: string; icon: string }[] = [
  { value: 'text',       label: 'Text',       description: 'Single-line input',      icon: 'Aa' },
  { value: 'textarea',   label: 'Textarea',   description: 'Multi-line input',       icon: '¶'  },
  { value: 'number',     label: 'Number',     description: 'Integer or decimal',     icon: '#'  },
  { value: 'currency',   label: 'Currency',   description: 'Money amount',           icon: '$'  },
  { value: 'percentage', label: 'Percentage', description: 'Value with %',           icon: '%'  },
  { value: 'dropdown',   label: 'Dropdown',   description: 'Pick from options',      icon: '▾'  },
  { value: 'date',       label: 'Date',       description: 'Date picker',            icon: '📅' },
];

const AddFieldModal = ({ visible, onCancel, onAdd }: any) => {
  const [form] = Form.useForm();
  const fieldType = Form.useWatch('fieldType', form);

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      closable={false}
      width={520}
      styles={{
        mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.45)' },
        content: { padding: 0, borderRadius: 20, overflow: 'hidden' },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 flex items-start justify-between border-b"
        style={{
          background: 'var(--bg-slate-50)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
            style={{
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
              border: '1px solid var(--border-blue-200)',
            }}
          >
            +
          </div>
          <div>
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Add custom field
            </div>
            <div
              className="text-[12px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Define a new column for your line items
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <CloseOutlined />
        </button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ fieldType: 'text', showInPdf: true, required: false }}
        onFinish={(values) => {
          onAdd(values);
          form.resetFields();
        }}
      >
        <div className="px-6 pt-5 pb-2">
          {/* Field name */}
          <div className="mb-4">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Field name
            </div>
            <Form.Item
              name="label"
              rules={[{ required: true, message: 'Please input field name' }]}
              className="mb-0"
            >
              <Input
                placeholder="e.g. Discount code"
                className="h-10 rounded-lg"
                style={{
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </Form.Item>
          </div>

          {/* Field type */}
          <div className="mb-4">
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Field type
            </div>
            <Form.Item name="fieldType" className="mb-0">
              <Radio.Group className="w-full" buttonStyle="solid">
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPE_OPTIONS.map((opt) => {
                    const selected = fieldType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className="cursor-pointer rounded-lg p-2.5 transition-all flex items-center gap-2.5"
                        style={{
                          background: selected ? 'var(--bg-blue-50)' : 'var(--bg-secondary)',
                          border: `1px solid ${selected ? '#60a5fa' : 'var(--border-color)'}`,
                          boxShadow: selected ? '0 0 0 3px rgba(96, 165, 250, 0.15)' : 'none',
                        }}
                      >
                        <Radio value={opt.value} className="!hidden" />
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{
                            background: selected ? '#fff' : 'var(--bg-slate-50)',
                            color: selected ? 'var(--text-blue-700)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {opt.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-[13px] font-semibold leading-tight"
                            style={{
                              color: selected ? 'var(--text-blue-700)' : 'var(--text-primary)',
                            }}
                          >
                            {opt.label}
                          </div>
                          <div
                            className="text-[11px] truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {opt.description}
                          </div>
                        </div>
                        {selected && (
                          <CheckOutlined style={{ color: 'var(--text-blue-700)', fontSize: 12 }} />
                        )}
                      </label>
                    );
                  })}
                </div>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* Dropdown options */}
          {fieldType === 'dropdown' && (
            <div
              className="mb-4 rounded-lg p-3"
              style={{
                background: 'var(--bg-slate-50)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Options
              </div>
              <Form.List name="options" initialValue={['Option 1']}>
                {(fields, { add, remove }) => (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.key} className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {index + 1}
                        </span>
                        <Form.Item {...field} noStyle>
                          <Input
                            placeholder={`Option ${index + 1}`}
                            className="rounded-md h-9"
                            style={{
                              borderColor: 'var(--border-color)',
                              background: 'var(--bg-secondary)',
                            }}
                          />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            size="small"
                            onClick={() => remove(field.name)}
                            icon={<CloseOutlined />}
                            style={{ color: 'var(--text-secondary)' }}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      size="small"
                      className="mt-1"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-blue-700)' }}
                    >
                      Add option
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          )}

          {/* Settings */}
          <div
            className="rounded-lg overflow-hidden"
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
                  Required
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  User must fill this field for every line
                </div>
              </div>
              <Form.Item name="required" valuePropName="checked" className="mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Show in invoice PDF
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Include this column on the printed invoice
                </div>
              </div>
              <Form.Item name="showInPdf" valuePropName="checked" className="mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-2 border-t mt-4"
          style={{
            background: 'var(--bg-slate-50)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Button
            onClick={onCancel}
            style={{ borderRadius: 8, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            style={{ borderRadius: 8, height: 36, background: '#2563eb', fontWeight: 600 }}
          >
            Add field
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

  const blockNonNumeric = (e: React.KeyboardEvent) => {
    // List of allowed non-numeric keys: 
    // Backspace, Tab, Enter, Escape, ArrowLeft, ArrowRight, Delete, End, Home, Decimal point (.)
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Delete', 'End', 'Home', '.'];
    
    // Allow numeric keys (0-9) and numeric keypad keys
    const isNumeric = (e.key >= '0' && e.key <= '9') || 
                      (e.code && e.code.startsWith('Numpad') && e.code.length === 7 && e.code[6] >= '0' && e.code[6] <= '9');
    
    // Allow command/ctrl combinations (like Ctrl+A, Ctrl+C, etc)
    const isControlAction = e.ctrlKey || e.metaKey;
    
    if (!allowedKeys.includes(e.key) && !isNumeric && !isControlAction) {
      e.preventDefault();
    }
  };

const SortableItem = ({ 
  id, 
  name, 
  remove, 
  field, 
  currentItem, 
  lineTotal, 
  currencySymbol, 
  index, 
  isSelected, 
  onSelect,
  activeColumns,
  projects 
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  const renderField = (column: any) => {
    const { key, type, label, isSystem } = column;
    
    if (key === 'itemName') {
      return (
        <Form.Item
          key={key}
          name={[name, "itemName"]}
          rules={[{ required: true, message: "" }]}
          style={{ marginBottom: 0 }}
        >
          <Input placeholder="Service or item name" size="small" className="font-semibold rounded-lg h-9 text-sm border-[var(--border-color)] hover:border-blue-300 focus:border-blue-400 bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm shadow-black/[0.02]" />
        </Form.Item>
      );
    }

    if (key === 'description') {
      return (
        <Form.Item name={[name, "description"]} style={{ marginBottom: 0 }}>
          <Input placeholder="Add a description" size="small" className="rounded-lg h-9 text-sm border-[var(--border-color)] hover:border-blue-300 focus:border-blue-400 bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm shadow-black/[0.02]" />
        </Form.Item>
      );
    }

    const inputClass = "w-full rounded-lg h-9 border-[var(--border-color)] hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm shadow-black/[0.02]";

    if (key === 'quantity') {
      return (
        <Form.Item
          key={key}
          name={[name, "quantity"]}
          rules={[{ required: true, message: "" }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber size="small" min={0.01} precision={2} className={inputClass} placeholder="1.00" onKeyDown={blockNonNumeric} />
        </Form.Item>
      );
    }

    if (key === 'rate') {
      return (
        <Form.Item
          key={key}
          name={[name, "rate"]}
          rules={[{ required: true, message: "" }]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber 
            size="small"
            min={0} 
            precision={2} 
            className={inputClass} 
            placeholder="0.00"
            onKeyDown={blockNonNumeric}
            prefix={<span className="text-[10px] text-gray-400 mr-1">{currencySymbol}</span>}
          />
        </Form.Item>
      );
    }

    if (key === 'taxRate') {
      return (
        <Form.Item key={key} name={[name, "taxRate"]} style={{ marginBottom: 0 }}>
          <InputNumber size="small" min={0} max={100} precision={2} className={inputClass} placeholder="0.00" onKeyDown={blockNonNumeric} suffix={<span className="text-[10px] text-gray-400 ml-1">%</span>} />
        </Form.Item>
      );
    }

    if (key === 'projectId') {
      return (
        <Form.Item key={key} name={[name, "projectId"]} style={{ marginBottom: 0 }}>
          <Select
            placeholder="Select project"
            className="line-item-select w-full rounded-lg text-sm"
            dropdownStyle={{ borderRadius: '8px' }}
            showSearch
            optionFilterProp="children"
            labelInValue
          >
            {projects?.map((project: any) => (
              <Select.Option key={project.value} value={project.value}>
                {project.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    }

    // Dynamic field from extraFields
    return (
      <Form.Item 
        key={key} 
        name={[name, "extraFields", key]} 
        style={{ marginBottom: 0 }}
      >
        {type === 'dropdown' ? (
          <Select placeholder={label} className="line-item-select w-full rounded-lg text-sm" dropdownStyle={{ borderRadius: '8px' }}>
            {column.options?.map((opt: string) => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            )) || <Select.Option value="default">Default</Select.Option>}
          </Select>
        ) : type === 'number' ? (
          <InputNumber size="small" className={inputClass} placeholder={label} onKeyDown={blockNonNumeric} />
        ) : type === 'percentage' ? (
          <InputNumber size="small" className={inputClass} placeholder={label} onKeyDown={blockNonNumeric} suffix="%" />
        ) : type === 'date' ? (
          <DatePicker size="small" className={inputClass} placeholder={label} style={{ width: '100%' }} format="YYYY-MM-DD" />
        ) : type === 'textarea' ? (
          <Input.TextArea size="small" autoSize={{ minRows: 1, maxRows: 3 }} className="rounded-md border-gray-200 text-xs" placeholder={label} />
        ) : (
          <Input size="small" placeholder={label} className={inputClass} />
        )}
      </Form.Item>
    );
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[var(--border-color)] transition-all duration-200 ${isDragging ? 'bg-blue-50/30 opacity-60 shadow-lg' : 'hover:bg-[var(--bg-slate-50)] group/row'}`}
    >
      <td className="p-2 w-12 align-middle text-center sticky left-0 z-10 bg-[var(--bg-secondary)] group-hover/row:bg-[var(--bg-slate-50)] transition-colors">
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelect(id, e.target.checked)}
          className="scale-90"
        />
      </td>
      <td className="p-2 w-10 align-middle text-center text-[var(--text-secondary)] font-medium text-[11px] tabular-nums sticky left-12 z-10 bg-[var(--bg-secondary)] group-hover/row:bg-[var(--bg-slate-50)] transition-colors border-r border-[var(--border-color)]">
        {index + 1}
      </td>
      <td className="p-2 w-8 align-middle text-center sticky left-[88px] z-10 bg-[var(--bg-secondary)] group-hover/row:bg-[var(--bg-slate-50)] transition-colors border-r border-[var(--border-color)]">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[var(--text-secondary)] hover:text-blue-500 transition-colors opacity-0 group-hover/row:opacity-100">
          <MenuOutlined style={{ fontSize: 13 }} />
        </div>
      </td>

      {activeColumns.map((col: any) => (
        <td key={col.key} className={`p-2 align-middle ${col.width || ''}`}>
          {renderField(col)}
        </td>
      ))}

      <td className="px-5 py-2 align-middle text-right w-[120px] sticky right-10 z-10 bg-[var(--bg-secondary)] group-hover/row:bg-[var(--bg-slate-50)] transition-colors border-l border-[var(--border-color)] font-semibold text-[var(--text-primary)] text-[13px] tabular-nums whitespace-nowrap">
        {currencySymbol}{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-2 py-2 align-middle text-center w-10 sticky right-0 z-10 bg-[var(--bg-secondary)] group-hover/row:bg-[var(--bg-slate-50)] transition-colors">
        <Tooltip title="Remove row">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined style={{ fontSize: 14 }} />}
            onClick={() => remove(name)}
            className="opacity-0 group-hover/row:opacity-60 hover:!opacity-100 hover:bg-red-50 flex items-center justify-center m-auto rounded-md transition-all"
          />
        </Tooltip>
      </td>
    </tr>
  );
};

const SortableHeader = ({ column, onDelete, onSelectAll, isAllSelected, isIndeterminate }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const menuItems = [
    {
      key: 'drag',
      label: (
        <span className="flex items-center gap-2 text-[12px]">
          <MenuOutlined style={{ fontSize: 12 }} />
          <span>Drag to reorder</span>
        </span>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'remove',
      danger: true,
      label: (
        <span className="flex items-center gap-2 text-[12px]">
          <DeleteOutlined style={{ fontSize: 12 }} />
          <span>Remove column</span>
        </span>
      ),
      onClick: () => onDelete(column.key),
    },
  ];

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3.5 text-left font-semibold text-[var(--text-secondary)] text-[10.5px] uppercase group whitespace-nowrap tracking-[0.08em] ${column.width || ''}`}
    >
      <div className="flex items-center gap-1.5">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-[var(--text-secondary)]"
        >
          <MenuOutlined style={{ fontSize: 11 }} />
        </div>
        <span>{column.label}</span>
        {column.required && (
          <span
            className="text-[9px] font-semibold normal-case opacity-70"
            style={{ color: 'var(--text-secondary)' }}
            title="Required"
          >
            *
          </span>
        )}
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button
            type="button"
            aria-label="Column options"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreOutlined style={{ fontSize: 13 }} />
          </button>
        </Dropdown>
      </div>
    </th>
  );
};

export default function DynamicLineItems({ 
  form, 
  currencySymbol, 
  isTaxInclusive, 
  calculateLineTotal,
  templateId,
  templates = [],
  loadingTemplates = false,
  activeColumns,
  setActiveColumns,
  customerProjects = []
}: DynamicLineItemsProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [activeDragType, setActiveDragType] = useState<'row' | 'column' | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [prevAppliedTemplateId, setPrevAppliedTemplateId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const parentProjectId = Form.useWatch("projectId", form);
  const projectsToUse = customerProjects && customerProjects.length > 0 ? customerProjects : projects;

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await ProjectService.getProjectsForSelect();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Unified Hydration & Template Change logic
  useEffect(() => {
    if (loadingTemplates) return;

    const currentTemplateId = templateId || form.getFieldValue('templateId');
    const lineItems = form.getFieldValue("lineItems") || [];

    // Avoid redundant updates
    if (hasHydrated && currentTemplateId === prevAppliedTemplateId) return;

    console.log('🔄 APPLYING TEMPLATE OR HYDRATING:', { 
      currentTemplateId, 
      hasHydrated, 
      prevAppliedTemplateId 
    });

    const template = templates.find(t => t.id === currentTemplateId);
    
    // BUILD COLUMNS
    let newColumns: Column[] = [];
    const templateKeys = new Set<string>();

    if (template) {
      newColumns.push({ key: 'itemName', label: 'ITEM NAME', isSystem: true, width: 'min-w-[200px]', type: 'text' });
      newColumns.push({ key: 'description', label: 'DESCRIPTION', isSystem: true, width: 'min-w-[150px]', type: 'text' });
      
      template.fields?.forEach((field: any) => {
        if (field.isSystem) {
          if (field.fieldKey === 'qty' || field.fieldKey === 'quantity') {
            newColumns.push({ key: 'quantity', label: field.fieldLabel, isSystem: true, width: 'w-24', type: 'number' });
          } else if (field.fieldKey === 'price' || field.fieldKey === 'rate') {
            newColumns.push({ key: 'rate', label: field.fieldLabel, isSystem: true, width: 'w-32', type: 'currency' });
          } else if (field.fieldKey === 'tax' || field.fieldKey === 'taxRate') {
            newColumns.push({ key: 'taxRate', label: field.fieldLabel, isSystem: true, width: 'w-24', type: 'number' });
          }
        } else {
          templateKeys.add(field.fieldKey);
          newColumns.push({ 
            key: field.fieldKey, 
            label: field.fieldLabel, 
            isSystem: false, 
            type: field.fieldType as any,
            options: field.options,
            width: 'min-w-[120px]'
          });
        }
      });
    } else {
      // DEFAULT COLUMNS
      newColumns = [
        { key: 'itemName', label: 'ITEM NAME', isSystem: true, width: 'min-w-[200px]', type: 'text' },
        { key: 'description', label: 'DESCRIPTION', isSystem: true, width: 'min-w-[150px]', type: 'text' },
        { key: 'projectId', label: 'PROJECT', isSystem: true, width: 'min-w-[150px]', type: 'dropdown' },
        { key: 'quantity', label: 'QTY', isSystem: true, width: 'w-24', type: 'number' },
        { key: 'rate', label: 'RATE', isSystem: true, width: 'w-32', type: 'currency' },
        { key: 'taxRate', label: 'TAX %', isSystem: true, width: 'w-24', type: 'number' },
      ];
    }

    // Add discovered extra fields
    const discoveredKeys = new Set<string>();
    lineItems.forEach((item: any) => {
      if (item.extraFields) {
        Object.keys(item.extraFields).forEach(key => discoveredKeys.add(key));
      }
    });

    discoveredKeys.forEach(key => {
      const sysKeys = ['quantity', 'rate', 'taxRate', 'itemName', 'description', 'projectId', 'projectName'];
      if (!templateKeys.has(key) && !sysKeys.includes(key) && !newColumns.some(c => c.key === key)) {
        newColumns.push({ 
          key, 
          label: key.replace(/_/g, ' '), 
          isSystem: false, 
          type: 'text', 
          width: 'min-w-[120px]' 
        });
      }
    });

    // APPLY SAVED METADATA REORDERING
    const savedColumnOrder = form.getFieldValue('columnOrder');
    const savedColumnLabels = form.getFieldValue('columnLabels') || {};
    const savedColumnTypes = form.getFieldValue('columnTypes') || {};
    const savedColumnOptions = form.getFieldValue('columnOptions') || {};

    if (!hasHydrated && savedColumnOrder && Array.isArray(savedColumnOrder)) {
      const reordered: Column[] = [];
      savedColumnOrder.forEach(key => {
        const col = newColumns.find(c => c.key === key);
        if (col) reordered.push(col);
      });
      newColumns.forEach(col => {
        if (!reordered.some(r => r.key === col.key)) reordered.push(col);
      });
      newColumns = reordered;
    }

    if (!hasHydrated && savedColumnLabels && typeof savedColumnLabels === 'object' && Object.keys(savedColumnLabels).length > 0) {
      newColumns = newColumns.map(col => ({
        ...col,
        label: savedColumnLabels[col.key] || col.label,
        type: savedColumnTypes[col.key] || col.type,
        options: savedColumnOptions[col.key] || col.options
      }));
    }

    setActiveColumns(newColumns);

    // ROW MANAGEMENT (Only on manual template change after initial hydration)
    if (hasHydrated && template && currentTemplateId !== prevAppliedTemplateId) {
      console.log('🔄 UPDATING ROWS FOR TEMPLATE CHANGE');
      const initialExtraFields: any = {};
      template.fields?.forEach((f: any) => {
        if (!f.isSystem && f.fieldKey !== 'project' && f.fieldKey !== 'projectId') {
          initialExtraFields[f.fieldKey] = "";
        }
      });

      const newRow = { 
        itemName: "", 
        description: "", 
        projectId: undefined,
        quantity: 1, 
        rate: 0, 
        taxRate: 0,
        extraFields: initialExtraFields
      };

      const currentLineItems = [...(form.getFieldValue('lineItems') || [])];
      if (currentLineItems.length <= 1) {
        const firstItem = currentLineItems[0];
        if (!firstItem || (!firstItem.itemName && !firstItem.description && (!firstItem.rate || firstItem.rate === 0))) {
          currentLineItems[0] = { ...firstItem, ...newRow };
          form.setFieldsValue({ lineItems: currentLineItems });
        } else {
          form.setFieldsValue({ lineItems: [...currentLineItems, newRow] });
        }
      } else {
        form.setFieldsValue({ lineItems: [...currentLineItems, newRow] });
      }
    }

    setHasHydrated(true);
    setPrevAppliedTemplateId(currentTemplateId);
  }, [templateId, templates, loadingTemplates, hasHydrated, prevAppliedTemplateId, form]);

  // Synchronize column order, labels, and options with form state
  useEffect(() => {
    if (activeColumns.length > 0) {
      form.setFieldValue('columnOrder', activeColumns.map(c => c.key));
      const labels: Record<string, string> = {};
      const types: Record<string, string> = {};
      const options: Record<string, string[]> = {};
      
      activeColumns.forEach(c => {
        labels[c.key] = c.label;
        if (c.type) types[c.key] = c.type;
        if (c.options) options[c.key] = c.options;
      });
      
      form.setFieldValue('columnLabels', labels);
      form.setFieldValue('columnTypes', types);
      form.setFieldValue('columnOptions', options);
    }
  }, [activeColumns, form]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const isColumn = activeColumns.some(c => c.key === active.id);
    setActiveDragType(isColumn ? 'column' : 'row');
  };

  const handleDragEnd = (event: DragEndEvent, fields: any[], move: (from: number, to: number) => void) => {
    const { active, over } = event;
    if (!over) return;

    if (activeDragType === 'column') {
      if (active.id !== over.id) {
        const oldIndex = activeColumns.findIndex(c => c.key === active.id);
        const newIndex = activeColumns.findIndex(c => c.key === over.id);
        setActiveColumns(arrayMove(activeColumns, oldIndex, newIndex));
      }
    } else {
      const oldIndex = fields.findIndex(f => f.key === active.id);
      const newIndex = fields.findIndex(f => f.key === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
    setActiveDragType(null);
  };

  const onAddCustomField = (values: any) => {
    const key = values.label.toLowerCase().replace(/\s+/g, '_');
    const newCol: Column = {
      key,
      label: values.label,
      isSystem: false,
      type: values.fieldType,
      options: values.options,
      required: values.required,
      showInPdf: values.showInPdf,
      width: 'min-w-[120px]'
    };
    setActiveColumns(prev => [...prev, newCol]);
    setShowAddFieldModal(false);
  };

  const handleDeleteColumn = (key: string) => {
    setActiveColumns(prev => prev.filter(c => c.key !== key));
  };

  const handleAddRow = (add: any) => {
    const initialExtraFields: any = {};
    activeColumns.forEach(col => {
      if (!col.isSystem) initialExtraFields[col.key] = "";
    });

    let initialProjectId = undefined;
    if (parentProjectId) {
      const matched = projectsToUse.find((p: any) => p.value === parentProjectId);
      if (matched) {
        initialProjectId = { value: matched.value, label: matched.label };
      }
    }

    add({ 
      itemName: "", 
      description: "", 
      projectId: initialProjectId,
      quantity: 1, 
      rate: 0, 
      taxRate: 0,
      extraFields: initialExtraFields
    });
  };

  const onSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(prev => [...prev, id]);
    } else {
      setSelectedRowKeys(prev => prev.filter(key => key !== id));
    }
  };

  const onSelectAll = (checked: boolean, fields: any[]) => {
    if (checked) {
      setSelectedRowKeys(fields.map(f => f.key));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleDuplicateRows = (fields: any[], add: any) => {
    const formItems = form.getFieldValue('lineItems') || [];
    selectedRowKeys.forEach(id => {
      const index = fields.findIndex(f => f.key === id);
      if (index !== -1) {
        const { id: _dbId, ...rest } = formItems[index];
        add({ ...rest, extraFields: rest.extraFields ? { ...rest.extraFields } : {} });
      }
    });
    setSelectedRowKeys([]);
  };

  const handleDeleteRows = (remove: any, fields: any[]) => {
    const indicesToDelete = selectedRowKeys
      .map(id => fields.findIndex(f => f.key === id))
      .filter(idx => idx !== -1)
      .sort((a, b) => b - a); // Sort descending to remove without index shifting issues

    indicesToDelete.forEach(idx => remove(idx));
    setSelectedRowKeys([]);
  };

  const [newFieldName, setNewFieldName] = useState("");
  const handleAddField = () => {
    if (!newFieldName) return;
    const key = newFieldName.toLowerCase().replace(/\s+/g, '_');
    setActiveColumns(prev => [...prev, { 
      key, 
      label: newFieldName, 
      isSystem: false, 
      width: 'min-w-[120px]' 
    }]);
    setNewFieldName("");
  };

  return (
    <div className="dynamic-line-items">
      <AddFieldModal 
        visible={showAddFieldModal} 
        onCancel={() => setShowAddFieldModal(false)} 
        onAdd={onAddCustomField} 
      />
      
      <Form.List name="lineItems">
        {(fields, { add, remove, move }) => {
          const formItems = form.getFieldValue('lineItems') || [];
          
          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={(e) => handleDragEnd(e, fields, move)}
            >
              {/* Toolbar */}
              <div className="mb-0 flex justify-between items-center bg-[var(--bg-secondary)] px-6 py-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <TableOutlined style={{ fontSize: 12 }} />
                  </span>
                  <Text strong className="text-[15px] text-[var(--text-primary)] tracking-tight">Line items</Text>
                  <span
                    className="inline-flex items-center px-2 h-5 rounded-md text-[11px] font-semibold tabular-nums"
                    style={{
                      background: 'var(--bg-slate-50)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {fields.length}
                  </span>
                  {selectedRowKeys.length > 0 && (
                    <span
                      className="inline-flex items-center px-2 h-5 rounded-md text-[11px] font-semibold"
                      style={{
                        background: 'var(--bg-blue-50)',
                        color: 'var(--text-blue-700)',
                        border: '1px solid var(--border-blue-200)',
                      }}
                    >
                      {selectedRowKeys.length} selected
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 items-center">
                  <Button
                    icon={<CopyOutlined style={{ fontSize: 13 }} />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => handleDuplicateRows(fields, add)}
                    className="flex items-center gap-1 font-medium text-[var(--text-primary)] rounded-lg border-[var(--border-color)] bg-[var(--bg-secondary)] h-9 text-[12.5px] hover:border-slate-300 transition-all"
                  >
                    Duplicate
                  </Button>
                  <Button
                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => handleDeleteRows(remove, fields)}
                    className="flex items-center gap-1 font-medium rounded-lg h-9 text-[12.5px] transition-all"
                    style={{
                      color: selectedRowKeys.length === 0 ? undefined : '#dc2626',
                      borderColor: 'var(--border-color)',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    Delete
                  </Button>
                  <Divider type="vertical" className="h-6 mx-1.5 border-[var(--border-color)]" />
                  <Button
                    icon={<SettingOutlined style={{ fontSize: 13 }} />}
                    onClick={() => setShowAddFieldModal(true)}
                    className="flex items-center gap-1 font-medium text-[var(--text-primary)] rounded-lg border-[var(--border-color)] bg-[var(--bg-secondary)] h-9 text-[12.5px] hover:border-slate-300 transition-all"
                  >
                    Customize
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined style={{ fontSize: 13 }} />}
                    onClick={() => handleAddRow(add)}
                    className="flex items-center gap-1 font-semibold rounded-lg h-9 text-[12.5px] transition-all"
                    style={{ background: '#2563eb' }}
                  >
                    Add row
                  </Button>
                </div>
              </div>

              {/* Template Selector Removed - Now in Header */}

              <div className="overflow-x-auto custom-scrollbar rounded-b-xl border border-[var(--border-color)] border-t-0 shadow-sm relative">
                <table className="w-full border-collapse bg-[var(--bg-secondary)] min-w-max border-hidden">
                  <thead>
                    <SortableContext items={activeColumns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
                    <tr className="bg-[var(--bg-slate-50)] border-b border-[var(--border-color)]">
                        <th className="px-5 py-3.5 w-12 text-center sticky left-0 z-20 bg-[var(--bg-slate-50)]">
                          <Checkbox
                            checked={fields.length > 0 && selectedRowKeys.length === fields.length}
                            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < fields.length}
                            onChange={(e) => onSelectAll(e.target.checked, fields)}
                            className="scale-110"
                          />
                        </th>
                        <th className="px-3 py-3.5 w-10 text-center font-semibold text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.08em] whitespace-nowrap sticky left-12 z-20 bg-[var(--bg-slate-50)] border-r border-[var(--border-color)]">#</th>
                        <th className="p-3 w-8 sticky left-[88px] z-20 bg-[var(--bg-slate-50)] border-r border-[var(--border-color)]"></th>
                        {activeColumns.map(col => (
                          <SortableHeader
                            key={col.key}
                            column={col}
                            onDelete={handleDeleteColumn}
                          />
                        ))}
                        <th className="px-5 py-3.5 text-right font-semibold text-[var(--text-secondary)] text-[10.5px] uppercase tracking-[0.08em] sticky right-10 z-20 bg-[var(--bg-slate-50)] border-l border-[var(--border-color)] w-[120px] whitespace-nowrap">Amount</th>
                        <th className="px-2 py-3.5 w-10 sticky right-0 z-20 bg-[var(--bg-slate-50)]"></th>
                      </tr>
                    </SortableContext>
                  </thead>
                  
                  <SortableContext items={fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {fields.map(({ key, name, ...restField }, index) => {
                        const currentItem = formItems[name] || {};
                        const adaptedItem = {
                          quantity: currentItem.quantity,
                          rate: currentItem.rate,
                          taxRate: currentItem.taxRate,
                          extraFields: currentItem.extraFields
                        };
                        const lineTotal = calculateLineTotal(adaptedItem);

                        return (
                          <SortableItem
                            key={key}
                            id={key}
                            name={name}
                            index={index}
                            remove={remove}
                            field={restField}
                            currentItem={currentItem}
                            lineTotal={lineTotal}
                            currencySymbol={currencySymbol}
                            isSelected={selectedRowKeys.includes(key as any)}
                            onSelect={onSelectRow}
                            activeColumns={activeColumns}
                            projects={projectsToUse}
                          />
                        );
                      })}
                      {fields.length === 0 && (
                        <tr>
                          <td colSpan={activeColumns.length + 5} className="p-0">
                            <div className="relative flex flex-col items-center justify-center py-16 px-6 overflow-hidden">
                              {/* subtle grid backdrop */}
                              <div
                                aria-hidden
                                className="absolute inset-0 pointer-events-none opacity-[0.4]"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
                                  backgroundSize: '28px 28px',
                                  maskImage:
                                    'radial-gradient(circle at center, black 0%, transparent 70%)',
                                  WebkitMaskImage:
                                    'radial-gradient(circle at center, black 0%, transparent 70%)',
                                }}
                              />

                              {/* icon stack */}
                              <div className="relative mb-5">
                                <div
                                  className="absolute inset-0 rounded-2xl blur-2xl"
                                  style={{
                                    background:
                                      'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
                                  }}
                                />
                                <div
                                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                                  style={{
                                    background:
                                      'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                                    border: '1px solid rgba(99, 102, 241, 0.25)',
                                    boxShadow:
                                      '0 8px 24px -8px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
                                  }}
                                >
                                  <Receipt size={28} strokeWidth={1.75} style={{ color: '#6366f1' }} />
                                </div>
                                <div
                                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{
                                    background: '#fff',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)',
                                  }}
                                >
                                  <PlusOutlined style={{ color: '#6366f1', fontSize: 10 }} />
                                </div>
                              </div>

                              {/* copy */}
                              <div
                                className="relative text-[15px] font-semibold tracking-tight"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                Start building this invoice
                              </div>
                              <div
                                className="relative text-[12.5px] mt-1.5 max-w-[360px] text-center leading-relaxed"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                Add line items one by one, or apply a saved template to fill them in
                                instantly.
                              </div>

                              {/* actions */}
                              <div className="relative flex items-center gap-2 mt-5">
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined style={{ fontSize: 13 }} />}
                                  onClick={() => handleAddRow(add)}
                                  className="rounded-lg h-10 px-5 font-semibold text-[13px]"
                                  style={{ background: '#2563eb' }}
                                >
                                  Add first row
                                </Button>
                                <Button
                                  icon={
                                    <Sparkles size={13} style={{ color: 'var(--text-secondary)' }} />
                                  }
                                  className="rounded-lg h-10 px-4 font-medium text-[13px] flex items-center gap-1.5"
                                  style={{
                                    background: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => setShowAddFieldModal(true)}
                                >
                                  Customize columns
                                </Button>
                              </div>

                              {/* tiny hint */}
                              <div
                                className="relative mt-4 inline-flex items-center gap-1.5 text-[11px]"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <kbd
                                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-mono font-semibold"
                                  style={{
                                    background: 'var(--bg-slate-50)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  ⏎
                                </kbd>
                                <span>or pick a template from the top bar</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </SortableContext>
                </table>
              </div>
            </DndContext>
          );
        }}
      </Form.List>

      <style jsx global>{`
        .dynamic-line-items .ant-input,
        .dynamic-line-items .ant-input-number,
        .dynamic-line-items .ant-select-selector {
          border-color: var(--border-color) !important;
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
        }
        .dynamic-line-items .ant-input:focus,
        .dynamic-line-items .ant-input-number:focus,
        .dynamic-line-items .ant-select-selector:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        /* Match Select height to inputs (h-9 = 36px) */
        .dynamic-line-items .line-item-select .ant-select-selector {
          height: 36px !important;
          border-radius: 8px !important;
          padding: 0 11px !important;
          display: flex !important;
          align-items: center !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
        }
        .dynamic-line-items .line-item-select .ant-select-selection-item,
        .dynamic-line-items .line-item-select .ant-select-selection-placeholder,
        .dynamic-line-items .line-item-select .ant-select-selection-search-input {
          line-height: 34px !important;
          height: 34px !important;
          font-size: 13px !important;
        }
        .dynamic-line-items .line-item-select.ant-select-focused .ant-select-selector {
          border-color: #60a5fa !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15) !important;
        }
        .cursor-grab { cursor: grab; }
        .cursor-grabbing { cursor: grabbing; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-primary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
          border: 2px solid var(--bg-primary);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
        .table-fixed {
          table-layout: fixed;
        }
      `}</style>
    </div>
  );
}
