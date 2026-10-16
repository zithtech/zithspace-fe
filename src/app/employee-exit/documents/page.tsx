'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Upload, 
  Tooltip,
  App
} from 'antd';
import { 
  FolderOpen, 
  FileText, 
  Download, 
  Upload as UploadIcon,
  Search,
  RotateCw,
  X,
  ArrowUpRight,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards } from '@/components/common/StatCards';
import NoData from '@/components/common/NoData';

export default function DocumentsPage() {
  const [requests, setRequests] = useState<EmployeeExitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { message: messageApi } = App.useApp();

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
      messageApi.success(`${documentType === 'relieving' ? 'Relieving' : 'Experience'} letter uploaded successfully`);
      fetchRequests();
    } catch (error: any) {
      console.error("Upload error", error);
      if (onError) onError(error);
      messageApi.error(error.message || "Failed to upload document");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      const n1 = (r.employee?.first_name || '').toLowerCase();
      const n2 = (r.employee?.last_name || '').toLowerCase();
      const code = (r.employee?.employee_code || '').toLowerCase();
      return n1.includes(q) || n2.includes(q) || code.includes(q);
    });
  }, [requests, searchText]);

  const stats = useMemo(() => {
    const total = requests.length;
    const resignation = requests.filter(r => r.resignationLetterUrl).length;
    const relieving = requests.filter(r => (r as any).relievingLetterUrl).length;
    const experience = requests.filter(r => (r as any).experienceLetterUrl).length;
    return { total, resignation, relieving, experience };
  }, [requests]);

  const columns = [
    {
      title: 'EMPLOYEE',
      key: 'employee',
      render: (_: any, record: EmployeeExitRequest) => {
        const name = `${record.employee?.first_name || ''} ${record.employee?.last_name || ''}`.trim() || 'N/A';
        const code = record.employee?.employee_code || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-slate-900, #0f172a)', fontSize: 13 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-slate-400, #94a3b8)' }}>{code}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'RESIGNATION LETTER',
      key: 'resignation',
      render: (_: any, record: EmployeeExitRequest) => {
        const url = record.resignationLetterUrl;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {url ? (
              <button 
                type="button" 
                onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_resignation.pdf`)}
                className="exit-ghost-btn"
                style={{ width: 'auto', padding: '0 12px', height: 30, fontSize: 12, gap: 6, fontWeight: 500 }}
              >
                <Download size={13} /> View Letter
              </button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>None attached</span>
            )}
          </div>
        );
      }
    },
    {
      title: 'RELIEVING LETTER',
      key: 'relieving',
      render: (_: any, record: EmployeeExitRequest) => {
        const url = (record as any).relievingLetterUrl;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {url ? (
              <button 
                type="button" 
                onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_relieving.pdf`)}
                className="exit-ghost-btn"
                style={{ width: 'auto', padding: '0 12px', height: 30, fontSize: 12, gap: 6, fontWeight: 500 }}
              >
                <Download size={13} /> relieving.pdf
              </button>
            ) : record.status === 'COMPLETED' ? (
              <span style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>Not uploaded</span>
            ) : null}

            {record.status !== 'COMPLETED' && (
              <Upload
                customRequest={(options) => handleUpload(options, 'relieving', record)}
                showUploadList={false}
              >
                <button
                  type="button"
                  className="exit-ghost-btn"
                  style={{ width: 'auto', padding: '0 10px', height: 28, fontSize: 11.5, gap: 5, borderStyle: 'dashed' }}
                >
                  <UploadIcon size={12} /> {url ? 'Replace' : 'Upload'}
                </button>
              </Upload>
            )}
          </div>
        );
      }
    },
    {
      title: 'EXPERIENCE LETTER',
      key: 'experience',
      render: (_: any, record: EmployeeExitRequest) => {
        const url = (record as any).experienceLetterUrl;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {url ? (
              <button 
                type="button" 
                onClick={() => handleDownload(url, `${record.employee?.first_name || 'employee'}_experience.pdf`)}
                className="exit-ghost-btn"
                style={{ width: 'auto', padding: '0 12px', height: 30, fontSize: 12, gap: 6, fontWeight: 500 }}
              >
                <Download size={13} /> experience.pdf
              </button>
            ) : record.status === 'COMPLETED' ? (
              <span style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>Not uploaded</span>
            ) : null}

            {record.status !== 'COMPLETED' && (
              <Upload
                customRequest={(options) => handleUpload(options, 'experience', record)}
                showUploadList={false}
              >
                <button
                  type="button"
                  className="exit-ghost-btn"
                  style={{ width: 'auto', padding: '0 10px', height: 28, fontSize: 11.5, gap: 5, borderStyle: 'dashed' }}
                >
                  <UploadIcon size={12} /> {url ? 'Replace' : 'Upload'}
                </button>
              </Upload>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="exit-search-bar" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', width: 280, height: 32 }}>
            <Search size={14} color="var(--text-slate-400)" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              placeholder="Search by employee..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          <span className="exit-topbar-meta">
            <span className="exit-pulse" />
            <strong>{filteredRequests.length}</strong> records
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="Refresh">
            <button
              type="button"
              className="exit-ghost-btn"
              onClick={fetchRequests}
              aria-label="Refresh"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="exit-body">
        <StatCards
          title="Document Management"
          statusText="ACTIVE"
          progressPct={stats.total > 0 ? Math.round(((stats.relieving + stats.experience) / (stats.total * 2)) * 100) : 0}
          cells={[
            {
              title: 'Total Files',
              value: stats.total,
              icon: <ArrowUpRight size={14} />,
              color: '#3b82f6',
              tint: 'rgba(59,130,246,0.1)',
              hint: 'Exit cases'
            },
            {
              title: 'Resignation Letters',
              value: stats.resignation,
              icon: <FileText size={14} />,
              color: '#8b5cf6',
              tint: 'rgba(139,92,246,0.1)',
              hint: 'Attached by employee'
            },
            {
              title: 'Relieving Letters',
              value: stats.relieving,
              icon: <CheckCircle size={14} />,
              color: '#10b981',
              tint: 'rgba(16,185,129,0.1)',
              hint: 'Issued letters'
            },
            {
              title: 'Experience Letters',
              value: stats.experience,
              icon: <FileCheck size={14} />,
              color: '#0ea5e9',
              tint: 'rgba(14,165,233,0.1)',
              hint: 'Issued certificates'
            },
          ]}
        />

        <div className="exit-table-wrap">
          <ZukvoLoadingOverlay loading={loading} message="">
            <Table
              size="small"
              className="exit-table"
              columns={columns}
              dataSource={filteredRequests}
              rowKey="id"
              pagination={{ pageSize: 20, position: ['bottomRight'] }}
              scroll={{ x: 800 }}
              locale={{
                emptyText: (
                  <NoData
                    title="No Documents Found"
                    description="Documents will appear here once an exit process starts."
                  />
                )
              }}
            />
          </ZukvoLoadingOverlay>
        </div>
      </div>
    </>
  );
}
