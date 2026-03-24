"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Upload,
  Tag,
  Modal,
  Form,
  Select,
  Space,
  Popconfirm,
  notification,
  Card,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/axios";

const { Option } = Select;

interface Props {
  clientId: string;
  documents: any[];
  onRefresh: () => void;
}

const DOCUMENT_CATEGORIES: Record<string, string[]> = {
  Sales: ["Proposal", "RFP", "RFQ", "Quotation", "Cost Estimate"],
  Legal: [
    "MSA",
    "SOW",
    "NDA",
    "Amendment",
    "Change Request",
    "Service Agreement",
  ],
  Finance: ["PO", "Invoice Copy", "Credit Note", "Debit Note", "Rate Card"],
  Compliance: [
    "GST Certificate",
    "VAT Certificate",
    "PAN Copy",
    "DPA",
    "Insurance Certificate",
  ],
};

export default function DocumentsTab({
  clientId,
  documents,
  onRefresh,
}: Props) {
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const columns = [
    {
      title: "Document Name",
      dataIndex: "fileName",
      key: "fileName",
      render: (text: string) => (
        <span>
          {text.endsWith(".pdf") ? (
            <FilePdfOutlined style={{ color: "red", marginRight: 8 }} />
          ) : (
            <FileWordOutlined style={{ color: "blue", marginRight: 8 }} />
          )}
          {text}
        </span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Document Type",
      dataIndex: "documentType",
      key: "documentType",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (v: number) => <Tag color="blue">v{v}</Tag>,
    },
    {
      title: "Uploaded Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: 14 }} />}
            onClick={() => {
              if (record.fileUrl) {
                setViewingDocument(record);
                setViewModalOpen(true);
              } else {
                notify.info({
                  message: "Info",
                  description: "Preview not available for this document",
                  placement: "top",
                });
              }
            }}
          />
          <Button
            type="text"
            icon={<DownloadOutlined style={{ fontSize: 14 }} />}
            onClick={() => handleDownload(record)}
          />

          <Popconfirm
            title="Delete Document"
            description="Are you sure to delete this document?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    form.setFieldsValue({ documentType: undefined });
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        notify.error({
          message: "Error",
          description: "Please select a file to upload",
          placement: "top",
        });
        return;
      }

      setUploading(true);
      try {
        const fileObj = fileList[0].originFileObj as File;
        const base64Str = await getBase64(fileObj);

        const payload = {
          base64: base64Str,
          fileName: fileObj.name,
          category: values.category,
          documentType: values.documentType,
        };

        console.log("Submitting payload to /api/clients-v2/.../documents");
        await api.post(`/api/clients-v2/${clientId}/documents`, payload);

        notify.success({
          message: "Success",
          description: "Document uploaded successfully",
          placement: "top",
        });
        setUploading(false);
        setIsUploadModalVisible(false);
        form.resetFields();
        setFileList([]);
        onRefresh();
      } catch (err: any) {
        console.error("API Upload Error:", err);
        const errorMessage =
          err.response?.data?.error || "Failed to upload document";
        notify.error({
          message: "Error",
          description: errorMessage,
          placement: "top",
        });
        setUploading(false);
      }
    } catch (err: any) {
      console.error("Form validation failed:", err);
      // Form validation failed - Ant Design forms will automatically show inline red text errors
    }
  };

  const handleDownload = (record: any) => {
    if (record?.fileUrl) {
      const link = document.createElement("a");
      link.href = record.fileUrl;
      link.download = record.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await api.delete(`/api/clients-v2/${clientId}/documents/${documentId}`);
      notify.success({
        message: "Success",
        description: "Document deleted successfully",
        placement: "top",
      });
      onRefresh();
    } catch (error) {
      notify.error({
        message: "Error",
        description: "Failed to delete document",
        placement: "top",
      });
    }
  };

  return (
    <Card className="premium-card" style={{ height: "60vh" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "grey" }}
          >
            Manage MSA, SOW, NDAs, and other client documents here...
          </p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setIsUploadModalVisible(true)}
        >
          Upload Document
        </Button>
      </div>
      <Table
        dataSource={documents}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        className="premium-modal"
        title="Upload Client Document"
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsUploadModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            onClick={handleUpload}
          >
            Upload
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder="Select Category"
              onChange={handleCategoryChange}
            >
              {Object.keys(DOCUMENT_CATEGORIES).map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="documentType"
            label="Document Subtype"
            rules={[
              { required: true, message: "Please select a document type" },
            ]}
          >
            <Select
              placeholder="Select Document Type"
              disabled={!selectedCategory}
            >
              {selectedCategory &&
                DOCUMENT_CATEGORIES[selectedCategory].map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item label="File" required>
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([{ ...file, originFileObj: file }]);
                return false; // Prevent auto upload
              }}
              onChange={(info) => {
                setFileList(info.fileList);
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="premium-modal"
        title={viewingDocument?.fileName || "Document Preview"}
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setViewingDocument(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(viewingDocument)}
          >
            Download
          </Button>,
        ]}
        width={800}
        centered
        bodyStyle={{ height: "70vh" }}
      >
        {viewingDocument && (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              viewingDocument.fileUrl,
            )}&embedded=true`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Document Preview"
          />
        )}
      </Modal>
    </Card>
  );
}
