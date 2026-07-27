'use client';
import React, { useState, useEffect } from 'react';


import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Space,
  Upload
} from 'antd';
import { 
  FolderOpen,
  FileText,
  Download,
  Upload as UploadIcon
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';

export default function DocumentsPage() {
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const data = await EmployeeExitService.getExitRequests();
        setRequests(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: EmployeeExitRequest) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.employee?.first_name} {record.employee?.last_name}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.employee?.employee_code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Resignation Letter',
      key: 'resignation',
      render: () => (
        <Button size="small" type="link" icon={<Download size={14} />}>
          resignation.pdf
        </Button>
      )
    },
    {
      title: 'Relieving Letter',
      key: 'relieving',
      render: (_: any, record: EmployeeExitRequest) => (
        record.status === 'COMPLETED' ? (
          <Button size="small" type="link" icon={<Download size={14} />}>
            relieving_letter.pdf
          </Button>
        ) : (
          <Upload>
            <Button size="small" icon={<UploadIcon size={14} />}>Upload</Button>
          </Upload>
        )
      )
    },
    {
      title: 'Experience Letter',
      key: 'experience',
      render: (_: any, record: EmployeeExitRequest) => (
        record.status === 'COMPLETED' ? (
          <Button size="small" type="link" icon={<Download size={14} />}>
            experience_letter.pdf
          </Button>
        ) : (
          <Upload>
            <Button size="small" icon={<UploadIcon size={14} />}>Upload</Button>
          </Upload>
        )
      )
    }
  ];

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 8, borderRadius: 8, display: 'flex' }}>
              <FolderOpen size={24} />
            </div>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>Exit Documents</Typography.Title>
              <Typography.Text type="secondary">Manage resignation, relieving, and experience letters</Typography.Text>
            </div>
          </div>

          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Table 
              columns={columns} 
              dataSource={requests} 
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: (
                  <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <FolderOpen size={48} color="#d9d9d9" style={{ marginBottom: 16 }} />
                    <Typography.Title level={5} style={{ color: '#8c8c8c' }}>No Documents Found</Typography.Title>
                  </div>
                )
              }}
            />
          </Card>
        </div>
    </>
  );
}
