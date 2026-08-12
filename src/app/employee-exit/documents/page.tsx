'use client';
import React, { useState, useEffect } from 'react';


import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Space,
  Upload,
  message
} from 'antd';
import { 
  FolderOpen,
  FileText,
  Download,
  Upload as UploadIcon
} from 'lucide-react';
import dayjs from 'dayjs';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function DocumentsPage() {
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDownload = async (rawUrl?: string, filename: string = 'document.pdf') => {
    if (!rawUrl) return;
    try {
      setLoading(true);
      await EmployeeExitService.downloadDocument(rawUrl, filename);
    } catch (error: any) {
      console.warn("Falling back to window.open", error);
      window.open(rawUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (options: any, documentType: 'relieving' | 'experience', record: EmployeeExitRequest) => {
    const { file, onSuccess, onError } = options;
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      await EmployeeExitService.uploadDocument(record.id, {
        documentType,
        fileBase64,
        fileName: file.name,
        employeeId: record.employeeId
      });

      if (onSuccess) onSuccess("ok");
      message.success(`${documentType === 'relieving' ? 'Relieving' : 'Experience'} letter uploaded successfully`);
      fetchRequests();
    } catch (error: any) {
      console.error("Upload error", error);
      if (onError) onError(error);
      message.error(error.message || "Failed to upload document");
    }
  };

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
      render: (_: any, record: EmployeeExitRequest) => {
        const url = record.resignationLetterUrl || (record as any).resignationLetter;
        return (
          <button 
            type="button" 
            onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_resignation.pdf`)}
            disabled={!url}
            style={{ 
              background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)', 
              borderRadius: 6, padding: '6px 12px', fontSize: 13, color: url ? 'var(--text-slate-700)' : 'var(--text-slate-400)',
              display: 'flex', alignItems: 'center', gap: 6, cursor: url ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              opacity: url ? 1 : 0.6
            }}
            onMouseOver={e => { if (url) { e.currentTarget.style.borderColor = 'var(--premium-blue)'; e.currentTarget.style.color = 'var(--premium-blue)'; } }}
            onMouseOut={e => { if (url) { e.currentTarget.style.borderColor = 'var(--border-slate-200)'; e.currentTarget.style.color = 'var(--text-slate-700)'; } }}>
            <Download size={14} /> resignation.pdf
          </button>
        );
      }
    },
    {
      title: 'Relieving Letter',
      key: 'relieving',
      render: (_: any, record: EmployeeExitRequest) => {
        const url = (record as any).relievingLetterUrl;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {url ? (
              <button 
                type="button" 
                onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_relieving.pdf`)}
                style={{ 
                  background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)', 
                  borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--text-slate-700)',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--premium-blue)'; e.currentTarget.style.color = 'var(--premium-blue)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-slate-200)'; e.currentTarget.style.color = 'var(--text-slate-700)'; }}>
                <Download size={14} /> relieving.pdf
              </button>
            ) : record.status === 'COMPLETED' ? (
              <span style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>Not uploaded</span>
            ) : null}

            {record.status !== 'COMPLETED' && (
              <Upload
                customRequest={(options) => handleUpload(options, 'relieving', record)}
                showUploadList={false}
              >
                <button type="button" style={{ 
                  background: '#fff', border: '1px dashed var(--border-slate-300)', 
                  borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--text-slate-600)',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--premium-blue)'; e.currentTarget.style.color = 'var(--premium-blue)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-slate-300)'; e.currentTarget.style.color = 'var(--text-slate-600)'; }}>
                  <UploadIcon size={14} /> {url ? 'Replace' : 'Upload'}
                </button>
              </Upload>
            )}
          </div>
        );
      }
    },
    {
      title: 'Experience Letter',
      key: 'experience',
      render: (_: any, record: EmployeeExitRequest) => {
        const url = (record as any).experienceLetterUrl;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {url ? (
              <button 
                type="button" 
                onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_experience.pdf`)}
                style={{ 
                  background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)', 
                  borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--text-slate-700)',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--premium-blue)'; e.currentTarget.style.color = 'var(--premium-blue)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-slate-200)'; e.currentTarget.style.color = 'var(--text-slate-700)'; }}>
                <Download size={14} /> experience.pdf
              </button>
            ) : record.status === 'COMPLETED' ? (
              <span style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>Not uploaded</span>
            ) : null}

            {record.status !== 'COMPLETED' && (
              <Upload
                customRequest={(options) => handleUpload(options, 'experience', record)}
                showUploadList={false}
              >
                <button type="button" style={{ 
                  background: '#fff', border: '1px dashed var(--border-slate-300)', 
                  borderRadius: 6, padding: '6px 12px', fontSize: 13, color: 'var(--text-slate-600)',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--premium-blue)'; e.currentTarget.style.color = 'var(--premium-blue)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-slate-300)'; e.currentTarget.style.color = 'var(--text-slate-600)'; }}>
                  <UploadIcon size={14} /> {url ? 'Replace' : 'Upload'}
                </button>
              </Upload>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
      <div className="exit-page-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="exit-topbar-meta">
            <span className="exit-pulse" style={{ background: '#3b82f6' }} />
            <strong style={{ fontSize: 16 }}>Exit Documents</strong>
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-slate-500)' }}>Manage resignation, relieving, and experience letters</span>
        </div>
      </div>

      <div className="exit-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--bg-primary)' }}>
          <div className="pp-table-wrap" style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <div style={{ border: '1px solid var(--border-slate-200)', borderRadius: 0 }}>
              <ZukvoLoadingOverlay loading={loading} message="">
                          <Table 
                                          className="pp-table"
                                          columns={columns} 
                                          dataSource={requests} 
                                          rowKey="id"
                                          pagination={{ pageSize: 20, position: ['bottomRight'] }}
                                          locale={{
                                            emptyText: (
                                              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-slate-400)' }}>
                                                <FolderOpen size={48} color="var(--border-slate-200)" style={{ marginBottom: 16 }} />
                                                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-slate-600)' }}>No Documents Found</div>
                                                <div style={{ fontSize: 13, marginTop: 6 }}>Documents will appear here once an exit process starts.</div>
                                              </div>
                                            )
                                          }}
                                        />
                          </ZukvoLoadingOverlay>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
