
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
  Empty,
  Modal,
  Switch,
  Radio
} from 'antd';
import { 
  DeleteOutlined, 
  PlusOutlined, 
  MenuOutlined, 
  SettingOutlined,
  CopyOutlined,
  BlockOutlined,
  TableOutlined,
  CheckOutlined,
  DragOutlined,
  CloseOutlined
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
}

const AddFieldModal = ({ visible, onCancel, onAdd }: any) => {
  const [form] = Form.useForm();
  const fieldType = Form.useWatch('fieldType', form);

  return (
    <Modal
      open={visible}
      title={<Text strong className="text-lg">Add Custom Field</Text>}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} className="px-8 rounded-md h-10">Cancel</Button>,
        <Button key="add" type="primary" onClick={() => form.submit()} className="px-8 rounded-md h-10 bg-blue-400 border-none">Add Field</Button>
      ]}
      width={400}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ fieldType: 'text', showInPdf: true, required: false }}
        onFinish={(values) => {
          onAdd(values);
          form.resetFields();
        }}
        className="mt-4"
      >
        <Form.Item label="FIELD NAME" name="label" rules={[{ required: true, message: 'Please input field name' }]}>
          <Input placeholder="e.g. Discount Code" className="h-10 rounded-md" />
        </Form.Item>
        
        <Form.Item label="FIELD TYPE" name="fieldType">
          <Select className="h-10 rounded-md">
            <Select.Option value="text">Text</Select.Option>
            <Select.Option value="textarea">Textarea</Select.Option>
            <Select.Option value="number">Number</Select.Option>
            <Select.Option value="currency">Currency</Select.Option>
            <Select.Option value="percentage">Percentage</Select.Option>
            <Select.Option value="dropdown">Dropdown</Select.Option>
            <Select.Option value="date">Date</Select.Option>
          </Select>
        </Form.Item>

        {fieldType === 'dropdown' && (
          <Form.List name="options" initialValue={['Option 1']}>
            {(fields, { add, remove }) => (
              <div className="mb-4">
                <Text type="secondary" className="text-xs font-bold mb-2 block uppercase">Options</Text>
                {fields.map((field, index) => (
                  <Form.Item key={field.key} required={false} className="mb-2">
                    <div className="flex gap-2">
                      <Form.Item {...field} noStyle>
                        <Input placeholder="Option" className="rounded-md" />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button type="text" onClick={() => remove(field.name)} icon={<CloseOutlined />} />
                      )}
                    </div>
                  </Form.Item>
                ))}
                <Button type="text" onClick={() => add()} icon={<PlusOutlined />} className="text-blue-500 flex items-center gap-1 p-0">
                  Add Option
                </Button>
              </div>
            )}
          </Form.List>
        )}

        <div className="flex justify-between items-center mb-4">
          <Text className="text-sm font-medium">Required</Text>
          <Form.Item name="required" valuePropName="checked" className="mb-0">
            <Switch size="small" />
          </Form.Item>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Text className="text-sm font-medium">Show in Invoice PDF</Text>
          <Form.Item name="showInPdf" valuePropName="checked" className="mb-0">
            <Switch size="small" />
          </Form.Item>
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
          <Input placeholder="Item name" size="small" className="font-semibold rounded-lg h-9 text-sm border-slate-200 hover:border-blue-300 focus:border-blue-400 bg-white shadow-sm shadow-black/[0.02]" />
        </Form.Item>
      );
    }

    if (key === 'description') {
      return (
        <Form.Item name={[name, "description"]} style={{ marginBottom: 0 }}>
          <Input placeholder="DESCRIPTION" size="small" className="rounded-lg h-9 uppercase text-[10px] font-medium tracking-tight border-slate-200 hover:border-blue-300 focus:border-blue-400 bg-white shadow-sm shadow-black/[0.02]" />
        </Form.Item>
      );
    }

    const inputClass = "w-full rounded-lg h-9 border-slate-200 hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm bg-white shadow-sm shadow-black/[0.02]";

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
            placeholder="Select Project" 
            size="small"
            className="w-full h-8 rounded-md text-xs" 
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
          <Select size="small" placeholder={label} className="w-full h-8 rounded-md text-xs" dropdownStyle={{ borderRadius: '8px' }}>
            {column.options?.map((opt: string) => (
              <Select.Option key={opt} value={opt}>{opt}</Select.Option>
            )) || <Select.Option value="default">Default</Select.Option>}
          </Select>
        ) : type === 'number' ? (
          <InputNumber size="small" className={inputClass} placeholder={label} onKeyDown={blockNonNumeric} />
        ) : type === 'percentage' ? (
          <InputNumber size="small" className={inputClass} placeholder={label} onKeyDown={blockNonNumeric} suffix="%" />
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
      className={`border-b border-gray-100/50 transition-all duration-200 ${isDragging ? 'bg-blue-50/30 opacity-60 shadow-lg' : 'hover:bg-slate-50/80 group/row'}`}
    >
      <td className="p-2 w-12 align-middle text-center sticky left-0 z-10 bg-white group-hover/row:bg-slate-50/80 transition-colors">
        <Checkbox 
          checked={isSelected} 
          onChange={(e) => onSelect(id, e.target.checked)} 
          className="scale-90"
        />
      </td>
      <td className="p-2 w-12 align-middle text-center text-slate-400 font-bold text-[10px] sticky left-12 z-10 bg-white group-hover/row:bg-slate-50/80 transition-colors border-r border-slate-50">
        {index + 1}
      </td>
      <td className="p-2 w-10 align-middle text-center sticky left-24 z-10 bg-white group-hover/row:bg-slate-50/80 transition-colors border-r border-slate-100/50">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500 transition-colors">
          <DragOutlined style={{ fontSize: 16 }} />
        </div>
      </td>
      
      {activeColumns.map((col: any) => (
        <td key={col.key} className={`p-2 align-middle ${col.width || ''}`}>
          {renderField(col)}
        </td>
      ))}

      <td className="p-3 align-middle text-right w-36 sticky right-12 z-10 bg-white group-hover/row:bg-slate-50/80 transition-colors border-l border-slate-50 font-bold text-slate-700 text-sm">
        {currencySymbol}{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="p-2 align-middle text-center w-12 sticky right-0 z-10 bg-white group-hover/row:bg-slate-50/80 transition-colors">
        <Tooltip title="Remove row">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => remove(name)}
            className="opacity-40 hover:opacity-100 hover:bg-red-50 flex items-center justify-center m-auto rounded-lg transition-all"
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

  return (
    <th 
      ref={setNodeRef} 
      style={style}
      className={`px-4 py-4 text-left font-bold text-slate-500 text-[10px] uppercase group whitespace-nowrap tracking-widest ${column.width || ''}`}
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
          <DragOutlined />
        </div>
        <span>{column.label}</span>
        {!column.isSystem && (
          <Tooltip title="Remove column">
            <CloseOutlined 
              className="text-[8px] text-red-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(column.key)}
            />
          </Tooltip>
        )}
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
  setActiveColumns
}: DynamicLineItemsProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [activeDragType, setActiveDragType] = useState<'row' | 'column' | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [prevAppliedTemplateId, setPrevAppliedTemplateId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

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
    add({ 
      itemName: "", 
      description: "", 
      projectId: undefined,
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
              {/* Toolbar Matching Image */}
              <div className="mb-0 flex justify-between items-center bg-white px-5 py-4 border-b border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <Text strong className="text-base text-slate-800 tracking-tight">Invoice Line Items</Text>
                  <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manage your billing components</Text>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => handleAddRow(add)}
                    className="flex items-center gap-1 font-bold text-blue-600 rounded-lg border-blue-100 bg-blue-50 h-9 text-xs hover:border-blue-300 hover:bg-blue-100 transition-all duration-200 shadow-sm shadow-blue-200/20"
                  >
                    Add Row
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => handleDuplicateRows(fields, add)}
                    className="flex items-center gap-1 font-semibold text-slate-600 rounded-lg border-slate-200 bg-white h-9 text-xs hover:border-slate-300 hover:text-slate-800 transition-all duration-200"
                  >
                    Duplicate
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={() => handleDeleteRows(remove, fields)}
                    className="flex items-center gap-1 font-semibold bg-white rounded-lg border-red-50 h-9 text-xs hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                  >
                    Delete Row
                  </Button>
                  <Divider type="vertical" className="h-6 mx-1 border-slate-200" />
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setShowAddFieldModal(true)}
                    className="flex items-center gap-1 font-semibold text-slate-600 rounded-lg border-slate-200 bg-white h-9 text-xs hover:border-slate-300 hover:text-slate-800 transition-all duration-200"
                  >
                    Custom Fields
                  </Button>
                </div>
              </div>

              {/* Template Selector Removed - Now in Header */}

              <div className="overflow-x-auto custom-scrollbar rounded-b-xl border border-slate-200 border-t-0 shadow-sm relative">
                <table className="w-full border-collapse bg-white min-w-max border-hidden">
                  <thead>
                    <SortableContext items={activeColumns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
                      <tr className="bg-[#f8fafc]/80 border-b border-slate-200">
                        <th className="px-5 py-4 w-12 text-center sticky left-0 z-20 bg-[#f8fafc]">
                          <Checkbox 
                            checked={fields.length > 0 && selectedRowKeys.length === fields.length}
                            indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < fields.length}
                            onChange={(e) => onSelectAll(e.target.checked, fields)}
                            className="scale-110"
                          />
                        </th>
                        <th className="px-3 py-4 w-12 text-center font-bold text-slate-400 text-[9px] uppercase tracking-widest whitespace-nowrap sticky left-12 z-20 bg-[#f8fafc] border-r border-slate-200/50">S.No</th>
                        <th className="p-3 w-10 sticky left-24 z-20 bg-[#f8fafc] border-r border-slate-200/50"></th>
                        {activeColumns.map(col => (
                          <SortableHeader 
                            key={col.key} 
                            column={col} 
                            onDelete={handleDeleteColumn}
                          />
                        ))}
                        <th className="px-5 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-widest sticky right-12 z-20 bg-[#f8fafc] border-l border-slate-200/50 w-36">Total</th>
                        <th className="px-3 py-4 w-12 sticky right-0 z-20 bg-[#f8fafc] text-center font-bold text-slate-500 text-[10px] uppercase tracking-widest">Actions</th>
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
                            projects={projects}
                          />
                        );
                      })}
                      {fields.length === 0 && (
                        <tr>
                          <td colSpan={activeColumns.length + 6} className="p-12 text-center">
                            <Empty 
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description={<Text type="secondary">No line items added yet. Click 'Add Row' or apply a template.</Text>} 
                            />
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />} 
                              onClick={() => handleAddRow(add)}
                              className="mt-4 rounded-md h-10 px-6 bg-blue-500 border-none"
                            >
                              Add First Row
                            </Button>
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
          border-color: #f1f3f6 !important;
          background: #ffffff !important;
        }
        .dynamic-line-items .ant-input:focus, 
        .dynamic-line-items .ant-input-number:focus,
        .dynamic-line-items .ant-select-selector:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
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
          background: #f8fafc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
          border: 2px solid #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .table-fixed {
          table-layout: fixed;
        }
      `}</style>
    </div>
  );
}
