'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Upload, 
  message, 
  Spin, 
  Space, 
  Typography, 
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag
} from 'antd';
import { 
  InboxOutlined, 
  FileOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { dealService, DealFile } from '@/services/dealService';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { Option } = Select;

interface FilesTabProps {
  dealId: string;
}

const FilesTab: React.FC<FilesTabProps> = ({ dealId }) => {
  const [files, setFiles] = useState<DealFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await dealService.getFiles(dealId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      message.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [dealId]);

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleUpload = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      const file = fileList[0];
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64File = reader.result as string;
        try {
          await dealService.uploadFile(dealId, {
            fileName: values.fileName,
            fileType: values.fileType,
            base64File,
          });
          message.success('File uploaded successfully to R2');
          setIsModalVisible(false);
          fetchFiles();
        } catch (error) {
          console.error('Upload error:', error);
          message.error('Failed to upload file');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        message.error('Failed to read file');
        setLoading(false);
      };
    } catch (error) {
      console.error('General error:', error);
      message.error('An error occurred');
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text: string) => (
        <Space>
          <FileOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'fileType',
      key: 'fileType',
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Created',
      key: 'createdAt',
      render: (record: DealFile) => (
        <div>
          <div>{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.uploadedBy ? `${record.uploadedBy.first_name} ${record.uploadedBy.last_name}` : 'System'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Updated',
      key: 'updatedAt',
      render: (record: DealFile) => (
        <div>
          <div>{dayjs(record.updatedAt || record.createdAt).format('YYYY-MM-DD HH:mm')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.uploadedBy ? `${record.uploadedBy.first_name} ${record.uploadedBy.last_name}` : 'System'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: DealFile) => (
        <Space>
          <Button type="text" icon={<DownloadOutlined />} onClick={() => window.open(record.fileUrl, '_blank')} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(5px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: 0 }}>Documents</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          Upload Document
        </Button>
      </div>

      <Card variant="borderless" style={glassStyle}>
        <Table 
          columns={columns as any} 
          dataSource={files} 
          loading={loading}
          rowKey="id"
          pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Upload Document"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        style={{ borderRadius: '16px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ fileType: 'Other' }}
        >
          <Form.Item
            name="fileName"
            label="File Name"
            rules={[{ required: true, message: 'Please enter file name' }]}
          >
            <Input placeholder="Enter document name" />
          </Form.Item>

          <Form.Item
            name="fileType"
            label="File Type"
            rules={[{ required: true, message: 'Please select file type' }]}
          >
            <Select placeholder="Select type">
              <Option value="Proposal">Proposal</Option>
              <Option value="Contract">Contract</Option>
              <Option value="Estimate">Estimate</Option>
              <Option value="Other">Other Attachment</Option>
            </Select>
          </Form.Item>

          <Form.Item label="File Upload">
            <Upload
              beforeUpload={(file) => {
                setFileList([file]);
                const name = file.name.split('.').slice(0, -1).join('.');
                form.setFieldsValue({ fileName: name });
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Upload
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FilesTab;
