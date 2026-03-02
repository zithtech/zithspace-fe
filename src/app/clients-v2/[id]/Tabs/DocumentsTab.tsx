"use client";

import React, { useState } from "react";
import { Table, Button, Upload, Tag, message, Modal, Form, Select, Space, Popconfirm } from "antd";
import { UploadOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { api } from "@/lib/axios";

const { Option } = Select;

interface Props {
    clientId: string;
    documents: any[];
    onRefresh: () => void;
}

const DOCUMENT_CATEGORIES: Record<string, string[]> = {
    "Sales": ["Proposal", "RFP", "RFQ", "Quotation", "Cost Estimate"],
    "Legal": ["MSA", "SOW", "NDA", "Amendment", "Change Request", "Service Agreement"],
    "Finance": ["PO", "Invoice Copy", "Credit Note", "Debit Note", "Rate Card"],
    "Compliance": ["GST Certificate", "VAT Certificate", "PAN Copy", "DPA", "Insurance Certificate"],
};

export default function DocumentsTab({ clientId, documents, onRefresh }: Props) {
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const columns = [
        {
            title: "Document Name",
            dataIndex: "fileName",
            key: "fileName",
            render: (text: string) => (
                <span>
                    {text.endsWith(".pdf") ? <FilePdfOutlined style={{ color: "red", marginRight: 8 }} /> : <FileWordOutlined style={{ color: "blue", marginRight: 8 }} />}
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
                        icon={<EyeOutlined />}
                        onClick={() => {
                            if (record.fileUrl) {
                                window.open(record.fileUrl, "_blank");
                            } else {
                                message.info("Preview not available for this document");
                            }
                        }}
                    />
                    <Button type="text" icon={<DownloadOutlined />} />
                    <Popconfirm
                        title="Delete Document"
                        description="Are you sure to delete this document?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
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
                message.error("Please select a file to upload");
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
                    documentType: values.documentType
                };

                console.log("Submitting payload to /api/clients-v2/.../documents");
                await api.post(`/api/clients-v2/${clientId}/documents`, payload);

                message.success("Document uploaded successfully");
                setUploading(false);
                setIsUploadModalVisible(false);
                form.resetFields();
                setFileList([]);
                onRefresh();
            } catch (err: any) {
                console.error("API Upload Error:", err);
                const errorMessage = err.response?.data?.error || "Failed to upload document";
                message.error(errorMessage);
                setUploading(false);
            }
        } catch (err: any) {
            console.error("Form validation failed:", err);
            // Form validation failed - Ant Design forms will automatically show inline red text errors
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            await api.delete(`/api/clients-v2/${clientId}/documents/${documentId}`);
            message.success("Document deleted successfully");
            onRefresh();
        } catch (error) {
            message.error("Failed to delete document");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                    <p>Manage MSA, SOW, NDAs, and other client documents here.</p>
                </div>
                <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsUploadModalVisible(true)}>
                    Upload Document
                </Button>
            </div>
            <Table dataSource={documents} columns={columns} rowKey="id" pagination={false} />

            <Modal
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
                    <Button key="upload" type="primary" loading={uploading} onClick={handleUpload}>
                        Upload
                    </Button>,
                ]}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="category" label="Category" rules={[{ required: true, message: "Please select a category" }]}>
                        <Select placeholder="Select Category" onChange={handleCategoryChange}>
                            {Object.keys(DOCUMENT_CATEGORIES).map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="documentType" label="Document Subtype" rules={[{ required: true, message: "Please select a document type" }]}>
                        <Select placeholder="Select Document Type" disabled={!selectedCategory}>
                            {selectedCategory && DOCUMENT_CATEGORIES[selectedCategory].map(type => (
                                <Option key={type} value={type}>{type}</Option>
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
        </div>
    );
}
