"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Upload,
  Typography,
  Divider,
  Tag,
  Row,
  message,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

export type ExpenseItem = {
  date?: any;
  amount?: number;
  billNo?: string;
  description?: string;
  files?: any[];
};

export type Mode = "empty" | "form" | "list" | "review";

type ExpenseBuilderProps = {
  items: ExpenseItem[];
  setItems: React.Dispatch<React.SetStateAction<ExpenseItem[]>>;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  onSubmit: () => void;
  onCancelAll: () => void;
  onResetMainForm: () => void;
};

export default function ExpenseBuilder({
  items,
  setItems,
  mode,
  setMode,
  onSubmit,
  onCancelAll,
  onResetMainForm,
}: ExpenseBuilderProps) {

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showError, setShowError] = useState(false);

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );

  const startAdd = () => {
      if (items.length > 0) {
    onResetMainForm();  // Skip for first expense
  }
    setItems((prev) => [...prev, {}]);
    setActiveIndex(items.length);
    setMode("form");
  };

  const updateItem = (key: keyof ExpenseItem, value: any) => {
    if (activeIndex === -1 || !items[activeIndex]) return;
    const copy = [...items];
    copy[activeIndex] = { ...copy[activeIndex], [key]: value };
    setItems(copy);
  };

  const deleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setMode(updated.length === 0 ? "empty" : "list");
    setActiveIndex(-1);
  };

  const isItemValid = (item: ExpenseItem) => {
    return (
      !!item.date &&
      !!item.amount &&
      Number(item.amount) > 0
    );
  };

  const handleSaveExpense = () => {
    const item = items[activeIndex];
    if (!isItemValid(item)) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setMode("list");
  };

  /* ================= EMPTY STATE ================= */
  if (mode === "empty") {
    return (
      <div className="text-center py-3">
        <div className="
          w-12 h-12
          flex items-center justify-center
          rounded-full
          bg-blue-50
          border-2 border-dashed border-blue-200
          mx-auto mb-2
        ">
          <PlusOutlined className="text-lg text-blue-500" onClick={startAdd}/>
        </div>
        <Text className="text-xs text-gray-700 mb-2 block">
          No expense items added yet
        </Text>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={startAdd}
          className="
            px-3
            h-7
            text-xs
            bg-blue-600
            border-none
          "
        >
          Add First Expense
        </Button>
      </div>
    );
  }

  /* ================= FORM MODE ================= */
  if (mode === "form" && activeIndex !== -1 && items[activeIndex]) {
    const item = items[activeIndex];

    return (
      <div className="space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="
              w-4 h-4
              flex items-center justify-center
              rounded
              bg-blue-100
            ">
              <span className="text-xs font-bold text-blue-700">{activeIndex + 1}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">
              Expense Item {activeIndex + 1}
            </span>
          </div>
        </div>

        {showError && (
          <div className="p-1 rounded bg-red-50 border border-red-200">
            <Text className="text-red-600 text-xs">
              Fill required fields
            </Text>
          </div>
        )}

        {/* Form Fields */}
        <Row gutter={[6, 6]} className="mt-1">
          {/* Date */}
          <Col span={8}>
            <label className="text-[11px] text-gray-600 block mb-0.5">
              Date *
            </label>
            <DatePicker
              size="small"
              className="w-full text-xs h-6"
              value={item.date}
              onChange={(v) => {
                updateItem("date", v);
                setShowError(false);
              }}
            />
          </Col>

          {/* Amount */}
          <Col span={8}>
            <label className="text-[11px] text-gray-600 block mb-0.5">
              Amount *
            </label>
            <InputNumber
              size="small"
              className="w-full text-xs h-6"
              style={{ width: "100%" }}
              prefix="₹"
              placeholder="0"
              value={item.amount}
              onChange={(v) => {
                updateItem("amount", v);
                setShowError(false);
              }}
            />
          </Col>

          {/* Bill No */}
          <Col span={8}>
            <label className="text-[11px] text-gray-600 block mb-0.5">
              Bill No
            </label>
            <Input
              size="small"
              className="w-full text-xs h-6"
              value={item.billNo}
              onChange={(e) => updateItem("billNo", e.target.value)}
            />
          </Col>
        </Row>


        {/* Description */}
        <div>
          <label className="text-xs text-gray-600 block mb-0.5">Description</label>
          <TextArea
            rows={3}
            className="w-full text-xs h-8"
            placeholder="Brief description..."
            value={item.description}
            onChange={(e) => updateItem("description", e.target.value)}
          />
        </div>

        {/* Upload */}
        <div className="p-1 rounded border border-dashed border-gray-300 bg-gray-50">
          <Upload
       beforeUpload={(file) => {
    const allowedTypes = ['image/*', '.pdf', '.doc', '.docx'];
    const isValidType = allowedTypes.some(type => 
      file.type === '' ? file.name.match(/\.(pdf|doc|docx)$/i) : file.type.includes(type)
    );
    if (!isValidType) {
      message.error('Only PDF, DOC, images allowed!');
    }
    return isValidType;
  }}     
          >
            <Button
              icon={<UploadOutlined />}
              size="small"
              className="w-full h-6 text-xs border-dashed"
            >
              Attach Files
            </Button>
          </Upload>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
          <Button
            size="small"
            onClick={onCancelAll}
            className="text-xs h-5 px-2"
          >
            Cancel All
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={handleSaveExpense}
            disabled={!isItemValid(item)}
            className="text-xs h-5 px-3 bg-blue-600 border-none"
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  /* ================= REVIEW MODE ================= */
  if (mode === "review") {
    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-100">
              <CheckCircleOutlined className="text-xs text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-gray-900">
              Review & Submit
            </span>
            <Tag color="green" className="text-2xs ml-1">READY</Tag>
          </div>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => setMode("list")}
            className="text-xs h-6 px-2"
          >
            Back
          </Button>
        </div>

        {/* Summary */}
        <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-gray-900">Summary</span>
              <p className="text-2xs text-gray-600">{items.length} item(s)</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-900">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-1.5 rounded border border-gray-200 bg-white"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span className="text-2xs font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <span className="text-xs text-gray-700">
                    {item.date?.format("DD MMM")}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-900">
                  ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <Button
            size="small"
            onClick={() => setMode("list")}
            className="text-xs h-6 px-2"
          >
            Back
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={onSubmit}
            className="text-xs h-6 px-3 bg-emerald-600 border-none font-bold"
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }

  /* ================= LIST MODE ================= */
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-900">
            Expense Items
          </span>
          <p className="text-2xs text-gray-500">
            {items.length} item(s) added
          </p>
        </div>
        <Tag color="blue" className="text-2xs">
          {items.length} ITEMS
        </Tag>
      </div>

      {/* Items List */}
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-2 rounded border border-gray-200 bg-white"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-1">
                <span className="text-2xs font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
                  #{idx + 1}
                </span>
                <span className="text-xs text-gray-700">
                  {item.date?.format("DD MMM")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined className="text-xs" />}
                  onClick={() => deleteItem(idx)}
                  className="h-4 w-4 p-0 min-w-0"
                />
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined className="text-xs" />}
                  onClick={() => {
                    setActiveIndex(idx);
                    setMode("form");
                  }}
                  className="h-4 w-4 p-0 min-w-0 text-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Amount</span>
              <span className="text-xs font-bold text-gray-900">
                ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Another */}
      <Button
        type="dashed"
        block
        size="small"
        icon={<PlusOutlined />}
        onClick={startAdd}
        className="text-xs h-7 border-dashed"
      >
        Add Another Expense
      </Button>

      {/* Total */}
      {items.length > 0 && (
        <div className="p-2 rounded bg-gray-900 text-white">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">TOTAL</span>
            <span className="text-sm font-bold">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {items.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <Button
            size="small"
            onClick={() => setMode("form")}
            className="text-xs h-6 px-2"
          >
            Back to Form
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => setMode("review")}
            className="text-xs h-6 px-3 bg-blue-600 border-none"
          >
            Review & Submit
          </Button>
        </div>
      )}
    </div>
  );
}