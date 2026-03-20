'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Tabs,
  Tag,
  Divider,
  Spin,
  message,
  notification,
  Table,
  Input as AntInput,
  Select as AntSelect,
  InputNumber,
  Modal,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SolutionOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CommentOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest, EmployeeAsset } from '@/services/employeeExitService';
import { ExitTypeService, ExitType } from '@/services/exitTypeService';
import { ReasonForExitService, ReasonForExit } from '@/services/reasonForExitService';
import { PositionService, Position } from '@/services/positionService';
import { DepartmentService } from '@/services/departmentService';
import { Upload } from 'antd';

const { Title, Text } = Typography;

export default function ExitRequestViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<EmployeeExitRequest | null>(null);

  // Master data for resolving IDs
  const [exitTypes, setExitTypes] = useState<ExitType[]>([]);
  const [reasons, setReasons] = useState<ReasonForExit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetForm] = Form.useForm();
  const [editingAsset, setEditingAsset] = useState<EmployeeAsset | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error("File size must be less than 5MB");
      return Upload.LIST_IGNORE;
    }
    return false; // prevent auto upload
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const fetchRequestData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestData, typesData, reasonsData, positionsData, departmentsData] = await Promise.all([
        EmployeeExitService.getExitRequestById(id as string),
        ExitTypeService.getAll(),
        ReasonForExitService.getAll(),
        PositionService.getAll(),
        DepartmentService.getAll(),
      ]);

      setRequest(requestData);
      setExitTypes(typesData);
      setReasons(reasonsData);
      setPositions(positionsData);
      setDepartments(departmentsData);

      if (requestData?.employeeId) {
        fetchAssets(requestData.employeeId);
      }
    } catch (error) {
      console.error('Error fetching view data:', error);
      notificationApi.error({
        message: 'Error',
        description: 'Failed to load exit request details'
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAssets = async (employeeId: string) => {
    setAssetsLoading(true);
    try {
      const data = await EmployeeExitService.getEmployeeAssets(employeeId);
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      notificationApi.error({
        message: 'Error',
        description: 'Failed to load assets'
      });
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequestData();
  }, [id, fetchRequestData]);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <Spin size="large" tip="Loading Exit Details..." />
        </div>
      </MainLayout>
    );
  }

  if (!request) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Title level={4}>Exit Request Not Found</Title>
          <Button type="primary" onClick={() => router.push('/employee-exit/management')}>
            Back to Management
          </Button>
        </div>
      </MainLayout>
    );
  }

  const getExitTypeName = (id: string) => exitTypes.find(t => t.id === id)?.name || 'N/A';
  const getReasonName = (id: string) => reasons.find(r => r.id === id)?.name || 'N/A';
  const getPositionName = (id: string) => positions.find(p => p.id === id)?.title || 'N/A';
  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  const employeeName = `${request.employee?.first_name} ${request.employee?.last_name}`;

  // Notice Remaining Calculation
  const lwd = dayjs(request.proposedLastWorkingDay);
  const today = dayjs().startOf('day');
  const remaining = lwd.diff(today, 'day');
  const noticeRemainingStr = remaining > 0 ? `${remaining} days` : 'Completed';

  const DetailItem = ({ label, value, icon }: { label: string, value: string | React.ReactNode, icon?: React.ReactNode }) => (
    <Card size="small" style={{ marginBottom: 16, height: '100%', borderRadius: 8 }}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space size={8}>
          {icon && <span style={{ color: '#1890ff' }}>{icon}</span>}
          <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
        </Space>
        <Text strong style={{ fontSize: 15, display: 'block' }}>{value}</Text>
      </Space>
    </Card>
  );
  const overviewTab = (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Employee Name" value={employeeName} icon={<UserOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Employee ID" value={request.employee?.employee_code || 'N/A'} icon={<SolutionOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Position" value={getPositionName(request.positionId)} icon={<SolutionOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Reporting Manager" value={request.reportingManagerName || request.reportingManagerId || 'N/A'} icon={<UserOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Notice Remaining" value={noticeRemainingStr} icon={<CalendarOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Exit Type" value={<Tag color="blue">{getExitTypeName(request.exitTypeId)}</Tag>} icon={<FileTextOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Resignation Date" value={dayjs(request.resignationDate).format('DD MMM YYYY')} icon={<CalendarOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Department" value={getDepartmentName(request.departmentId)} icon={<SolutionOutlined />} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <DetailItem label="Last Working Day" value={dayjs(request.proposedLastWorkingDay).format('DD MMM YYYY')} icon={<CalendarOutlined />} />
        </Col>
        <Col xs={24} md={16}>
          <DetailItem label="Reason" value={getReasonName(request.exitReasonId)} icon={<InfoCircleOutlined />} />
        </Col>
        <Col xs={24} md={24}>
          <Card size="small" title="Details" style={{ borderRadius: 8 }}>
            <Paragraph>{request.explanation || 'No detailed explanation provided.'}</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const handleAssetSubmit = async () => {
    try {
      const values = await assetForm.validateFields();
      
      const fileObj = values.image?.[0];
      let imageBase64 = "";
      let fileName = "";

      // If new image selected
      if (fileObj?.originFileObj) {
        imageBase64 = await fileToBase64(fileObj.originFileObj);
        fileName = fileObj.originFileObj.name;
      }
      // If editing existing asset (already saved URL)
      else if (fileObj?.url) {
        imageBase64 = fileObj.url;
      }

      const payload = {
        ...values,
        image: imageBase64,
        imageName: fileName,
        returnStatus: values.returnStatus || "Pending",
        condition: values.condition || "Good",
        deduction: values.deduction || 0,
        remarks: values.remarks || ""
      };

      if (editingAsset && editingAsset.id) {
        await EmployeeExitService.updateEmployeeAsset(request.employeeId, editingAsset.id, payload);
        notificationApi.success({
          message: 'Success',
          description: "Asset updated successfully"
        });
      } else {
        await EmployeeExitService.addEmployeeAsset(request.employeeId, payload);
        notificationApi.success({
          message: 'Success',
          description: "Asset added successfully"
        });
      }
      setIsAssetModalOpen(false);
      assetForm.resetFields();
      setEditingAsset(null);
      fetchAssets(request.employeeId);
    } catch (error) {
      console.error("Error saving asset:", error);
      notificationApi.error({
        message: 'Error',
        description: "Failed to save asset"
      });
    }
  };

  const handleInlineUpdate = async (assetId: string, field: string, value: any) => {
    try {
      await EmployeeExitService.updateEmployeeAsset(request.employeeId, assetId, { [field]: value });
      fetchAssets(request.employeeId);
    } catch (error) {
      console.error("Error updating asset inline:", error);
      notificationApi.error({
        message: 'Error',
        description: "Failed to update asset"
      });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await EmployeeExitService.deleteEmployeeAsset(request.employeeId, assetId);
      notificationApi.success({
        message: 'Success',
        description: "Asset deleted successfully"
      });
      fetchAssets(request.employeeId);
    } catch (error) {
      console.error("Error deleting asset:", error);
      notificationApi.error({
        message: 'Error',
        description: "Failed to delete asset"
      });
    }
  };

  const assetColumns = [
    {
      title: 'Asset Name',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: 'Asset ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable>{id?.substring(0, 8)}...</Text>
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => (
        image ? (
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => {
              setPreviewImage(image);
              setPreviewOpen(true);
            }} 
          />
        ) : '-'
      )
    },
    {
      title: 'Issued Day',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YY')
    },
    {
      title: 'Return Status',
      dataIndex: 'returnStatus',
      key: 'returnStatus',
      render: (status: string, record: EmployeeAsset) => (
        <AntSelect
          value={status}
          onChange={(val) => handleInlineUpdate(record.id!, 'returnStatus', val)}
          style={{ width: 120 }}
          bordered={false}
          className="inline-edit-select"
        >
          <AntSelect.Option value="Pending">Pending</AntSelect.Option>
          <AntSelect.Option value="Returned">Returned</AntSelect.Option>
          <AntSelect.Option value="Damaged">Damaged</AntSelect.Option>
          <AntSelect.Option value="Lost">Lost</AntSelect.Option>
        </AntSelect>
      )
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string, record: EmployeeAsset) => (
        <AntSelect
          value={condition}
          onChange={(val) => handleInlineUpdate(record.id!, 'condition', val)}
          style={{ width: 100 }}
          bordered={false}
          className="inline-edit-select"
        >
          <AntSelect.Option value="Good">Good</AntSelect.Option>
          <AntSelect.Option value="Bad">Bad</AntSelect.Option>
        </AntSelect>
      )
    },
    {
      title: 'Deduction',
      dataIndex: 'deduction',
      key: 'deduction',
      render: (val: number, record: EmployeeAsset) => (
        <InputNumber
          value={val}
          onBlur={(e) => handleInlineUpdate(record.id!, 'deduction', Number(e.target.value))}
          onPressEnter={(e: any) => handleInlineUpdate(record.id!, 'deduction', Number(e.target.value))}
          bordered={false}
        />
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (val: string, record: EmployeeAsset) => (
        <AntInput
          defaultValue={val}
          onBlur={(e) => handleInlineUpdate(record.id!, 'remarks', e.target.value)}
          onPressEnter={(e: any) => handleInlineUpdate(record.id!, 'remarks', e.target.value)}
          bordered={false}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EmployeeAsset) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAsset(record);
              assetForm.setFieldsValue({
                ...record,
                image: record.image
                  ? [
                      {
                        uid: "-1",
                        name: "asset.png",
                        status: "done",
                        url: record.image,
                      },
                    ]
                  : [],
              });
              setIsAssetModalOpen(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAsset(record.id!)}
          />
        </Space>
      )
    }
  ];

  const assetsTab = (
    <div style={{ padding: '24px 0' }}>
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAsset(null);
            assetForm.resetFields();
            setIsAssetModalOpen(true);
          }}
        >
          Add Manual Asset
        </Button>
      </Row>
      <Table
        columns={assetColumns}
        dataSource={assets}
        rowKey="id"
        loading={assetsLoading}
        pagination={false}
        bordered
      />

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            <Text strong>{editingAsset ? 'Edit Manual Asset' : 'Add Manual Asset'}</Text>
          </Space>
        }
        open={isAssetModalOpen}
        onCancel={() => setIsAssetModalOpen(false)}
        onOk={handleAssetSubmit}
        okText={editingAsset ? 'Update' : 'Add Asset'}
        width={600}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          <Text type="secondary">This form is used to manually assign assets to the employee during the exit process.</Text>
        </Space>

        <Form form={assetForm} layout="vertical" initialValues={{ returnStatus: 'Pending', condition: 'Good' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Asset Name" name="item" rules={[{ required: true }]}>
                <AntSelect placeholder="Select item">
                  <AntSelect.Option value="Mobile">Mobile</AntSelect.Option>
                  <AntSelect.Option value="Laptop">Laptop</AntSelect.Option>
                  <AntSelect.Option value="Tab">Tab</AntSelect.Option>
                  <AntSelect.Option value="Monitor">Monitor</AntSelect.Option>
                  <AntSelect.Option value="Keyboard">Keyboard</AntSelect.Option>
                  <AntSelect.Option value="Mouse">Mouse</AntSelect.Option>
                  <AntSelect.Option value="Bag">Bag</AntSelect.Option>
                  <AntSelect.Option value="Headphone">Headphone</AntSelect.Option>
                </AntSelect>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Brand Name" name="brand" rules={[{ required: true }]}>
                <AntInput />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Model Name" name="model" rules={[{ required: true }]}>
                <AntInput />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Model Number" name="modelNumber" rules={[{ required: true }]}>
                <AntInput />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Upload Image"
                name="image"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={handleBeforeUpload}
                  maxCount={1}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Return Status" name="returnStatus">
                <AntSelect>
                  <AntSelect.Option value="Pending">Pending</AntSelect.Option>
                  <AntSelect.Option value="Returned">Returned</AntSelect.Option>
                  <AntSelect.Option value="Damaged">Damaged</AntSelect.Option>
                  <AntSelect.Option value="Lost">Lost</AntSelect.Option>
                </AntSelect>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Condition" name="condition">
                <AntSelect>
                  <AntSelect.Option value="Good">Good</AntSelect.Option>
                  <AntSelect.Option value="Bad">Bad</AntSelect.Option>
                </AntSelect>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Deduction" name="deduction">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Remark" name="remarks">
                <AntInput />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        title="Asset Image Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        centered
        width={800}
      >
        <img alt="asset" style={{ width: '100%', borderRadius: 8 }} src={previewImage} />
      </Modal>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
        {notificationContextHolder}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space direction="vertical" size={2}>
              <Title level={2} style={{ margin: 0 }}>Exit Management</Title>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/employee-exit/management')}
              size="large"
            >
              Back
            </Button>
          </Col>
        </Row>

        <Card bordered={false} style={{ marginBottom: 24, background: '#f9f9f9', borderRadius: 12 }}>
          <Row align="middle" gutter={24}>
            <Col>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#e6f7ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: '#1890ff'
              }}>
                <UserOutlined />
              </div>
            </Col>
            <Col>
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ margin: 0 }}>{employeeName}</Title>
                <Space split={<Divider type="vertical" />}>
                  <Text type="secondary">ID: {request.employee?.employee_code || 'N/A'}</Text>
                  <Text type="secondary">Department: {getDepartmentName(request.departmentId)}</Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs
          defaultActiveKey="1"
          style={{ fontWeight: 600 }}
          items={[
            {
              key: '1',
              label: 'Overview',
              children: overviewTab,
            },
            {
              key: '2',
              label: 'Approved',
              children: <div style={{ padding: 24, textAlign: 'center' }}><Text type="secondary">Approval details placeholder</Text></div>,
            },
            {
              key: '3',
              label: 'Assets',
              children: assetsTab,
            },
          ]}
        />
      </div>
    </MainLayout>
  );
}

const Paragraph = Typography.Paragraph;
