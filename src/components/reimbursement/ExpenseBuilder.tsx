
"use client";


import { Collapse } from "antd";
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
import { AuthService } from "@/services/authService";
import { useUploadFile } from "@/hooks/useCategories";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import AttachmentList from "@/components/common/AttachmentList";

const { Title, Text } = Typography;
const { TextArea } = Input;

export type ExpenseItem = {
  date?: any;
  amount?: number;
  billNo?: string;
  description?: string;
  files?: any[];
  category?: string;
  department?: string;
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
  onSaveDraft: () => void;
  onCancel: () => void;
  submitting?: boolean;
  currentCategory?: string;
  currentDepartment?: string;
  onEdit?: (item: ExpenseItem) => void;
};

export default function ExpenseBuilder({
  items,
  setItems,
  mode,
  setMode,
  onSubmit,
  onCancelAll,
  onResetMainForm,
  onSaveDraft,
  onCancel,
  submitting = false,
  currentCategory,
  currentDepartment,
  onEdit,

}: ExpenseBuilderProps) {

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showError, setShowError] = useState(false);
  const { mutateAsync: uploadFile } = useUploadFile();

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );

  const startAdd = () => {
    if (items.length > 0) {
      onResetMainForm();
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

    // Save current category/department context to the item
    const updatedItem = {
      ...item,
      category: currentCategory,
      department: currentDepartment,
    };
    const copy = [...items];
    copy[activeIndex] = updatedItem;
    setItems(copy);

    setShowError(false);
    setMode("list");
  };

  const handleUpload = async (file: string, fileName: string) => {
    try {
      // Convert Data URL/Base64 to Blob for FormData upload
      const res = await fetch(file);

      const blob = await res.blob();
      const fileObj = new File([blob], fileName);

      console.log(res, blob, fileObj, "verify");

      const resData = await uploadFile(fileObj);
      const uploadedUrl = res.url;


      if (resData.success && uploadedUrl) {
        setItems((prev) => {
          const copy = [...prev];
          if (activeIndex >= 0 && activeIndex < copy.length) {
            const currentItem = copy[activeIndex];
            const existingFiles = currentItem.files || [];

            // Store file with metadata for better display
            const fileWithMetadata = {
              url: uploadedUrl,      // 🔥 MUST
              name: fileName,
              size: blob.size,
              type: blob.type || getFileTypeFromName(fileName),
              uploadedAt: new Date().toISOString(),
            };


            copy[activeIndex] = {
              ...currentItem,
              files: [...existingFiles, fileWithMetadata].slice(0, 4),
            };
          }
          return copy;
        });
        message.success("Attachment uploaded successfully");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      message.error("Failed to upload attachment");
    }
  };

  // Helper function to detect file type from filename
  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'unknown';

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['txt', 'text'].includes(ext)) return 'text';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac'].includes(ext)) return 'audio';

    return 'unknown';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    // We use the index as the ID for local files
    const index = parseInt(attachmentId);
    setItems((prev) => {
      const copy = [...prev];
      const currentItem = copy[activeIndex];
      const newFiles = (currentItem.files || []).filter((_, i) => i !== index);
      copy[activeIndex] = { ...currentItem, files: newFiles };
      return copy;
    });
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
          <PlusOutlined className="text-lg text-blue-500" onClick={startAdd} />
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

  const renderCompactExpense = (item: ExpenseItem, index: number) => {
    if (!item?.date || !item?.amount) return null;

    return (
      <div
        key={index}
        className="
        mb-2
        px-3 py-2
        rounded
        border border-gray-200
        bg-gray-50
        flex justify-between items-center
        text-xs
      "
      >
        {/* LEFT */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-700">
            #{index + 1}
          </span>
          <span className="text-gray-700">
            {item.date?.format("DD MMM")}
          </span>
          <span className="font-bold text-gray-900">
            ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined className="text-xs" />}
            onClick={() => {
              setActiveIndex(index);
              setMode("form");
              onEdit?.(item);
            }}
            className="h-4 w-4 p-0 min-w-0 text-blue-600"
          />

          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined className="text-xs" />}
            onClick={() => deleteItem(index)}
            className="h-4 w-4 p-0 min-w-0"
          />
        </div>
      </div>
    );
  };


  /* ================= FORM MODE ================= */
  if (mode === "form" && activeIndex !== -1 && items[activeIndex]) {
    const item = items[activeIndex];

    return (
      <div className="space-y-1">

        {/* 🔥 SHOW ALL OTHER EXPENSES COMPACT */}
        {items.map((item, idx) => {
          if (idx === activeIndex) return null;
          return renderCompactExpense(item, idx);
        })}


        {/* Header */}
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-1">
            <div
              className="
        w-4 h-4
        flex items-center justify-center
        rounded
        bg-blue-100
      "
            >
              <span className="text-xs font-bold text-blue-700">
                {activeIndex + 1}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-900">
              Expense Item {activeIndex + 1}
            </span>
          </div>

          {/* RIGHT – Cancel form */}
          <button
            type="button"
            onClick={() => {
              const item = items[activeIndex];

              // 🔥 if current expense is EMPTY, remove it
              if (
                item &&
                !item.date &&
                !item.amount &&
                !item.billNo &&
                !item.description &&
                (!item.files || item.files.length === 0)
              ) {
                setItems((prev) => {
                  const copy = [...prev];
                  copy.splice(activeIndex, 1); // 👈 remove empty expense
                  return copy;
                });
              }

              setActiveIndex(-1);

              // decide mode after removal
              setMode(items.length - 1 <= 0 ? "empty" : "list");
            }}

            className="
      px-2 py-0.5
      text-[11px] font-medium
      text-gray-600
      border border-gray-300
      rounded
      hover:bg-gray-50
      transition
    "
          >
            Cancel
          </button>
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
            rows={2}
            className="w-full text-xs"
            placeholder="Brief description..."
            value={item.description}
            onChange={(e) => updateItem("description", e.target.value)}
          />
        </div>

        {/* Upload & Attachments - Compact Single View */}
        <div>
          <div className="mb-2">
            <AttachmentUploader
              style={{ fontSize: "12px" }}
              onUpload={handleUpload}
              maxSize={5}
            />
          </div>
          <div className=" h-10 overflow-y-auto [&_.ant-empty-image]:!h-5 [&_.ant-empty-description]:!text-[10px] [&_.ant-empty]:!my-1 [&_.ant-list-item]:!py-1 [&_.ant-list-item]:!px-0">
            <AttachmentList
              attachments={(item.files || []).map((f: any, i: number) => {
                // Handle both string filenames and file objects with metadata
                const isString = typeof f === 'string';
                const fileIdentifier = isString ? f : (f.name || f.fileName || 'file');
                const isUrl = fileIdentifier.startsWith('http://') || fileIdentifier.startsWith('https://');

                const fileName = isUrl ? (fileIdentifier.split('/').pop()?.split('_').slice(1).join('_') || fileIdentifier.split('/').pop() || fileIdentifier) : fileIdentifier;
                const fileUrl = isUrl ? fileIdentifier : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/uploads/${fileIdentifier}`;

                const fileSize = isString ? 0 : (f.size || 0);
                const fileType = isString ? (fileName.toLowerCase().includes('.pdf') ? 'pdf' : 'unknown') : (f.type || 'unknown');

                return {
                  id: String(i),
                  fileName: fileName,
                  fileUrl: fileUrl,
                  fileSize: fileSize,
                  fileType: fileType,
                  uploadedAt: isString ? new Date().toISOString() : (f.uploadedAt || new Date().toISOString()),
                  uploadedBy: {
                    id: "current",
                    name: "You",
                    workEmail: "",
                    position: "",
                  },
                };
              })}
              onDelete={handleDeleteAttachment}
              loading={false}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center pt-1 border-t border-gray-200">
          {/* LEFT SIDE */}
          <Button
            size="small"
            onClick={onCancelAll}
            className="text-xs h-5 px-2"
          >
            Cancel All
          </Button>

          {/* RIGHT SIDE */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="primary"
              size="small"
              onClick={handleSaveExpense}
              disabled={!isItemValid(item)}
              className="text-xs h-5 px-3 bg-blue-600 border-none"
            >
              Save
            </Button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={submitting}
              className="
        px-3 py-1.5 text-xs font-medium
        text-gray-700
        border border-gray-300
        rounded-md
        hover:bg-gray-50
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
      "
            >
              {submitting ? "Saving..." : "Save Draft"}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={onCancel}
              className="
        px-3 py-1.5 text-xs font-medium
        text-gray-700
        border border-gray-300
        rounded-md
        hover:bg-gray-50
        transition
      "
            >
              Cancel
            </button>
          </div>
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
            loading={submitting}
            disabled={submitting}
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
                    onEdit?.(item);
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
        <div className="flex justify-between items-center px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div>
            <div className="text-[11px] text-gray-500 uppercase tracking-wide">
              Total Amount
            </div>
            <div className="text-xs text-gray-400">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              ₹{totalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}


      {/* Actions */}
      {items.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <Button
            size="small"
            onClick={() => {
              if (activeIndex === -1 && items.length > 0) {
                setActiveIndex(items.length - 1);
              }
              setMode("form");
            }}
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