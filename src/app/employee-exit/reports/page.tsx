'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col } from 'antd';
import {
  BarChart3,
  TrendingDown,
  Users,
  Download,
  Clock,
  RotateCw
} from 'lucide-react';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { StatCards } from '@/components/common/StatCards';
import NoData from '@/components/common/NoData';

export default function ReportsPage() {
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

  const totalExits = requests.length;
  const voluntaryExits = requests.filter(r => r.exitTypeId === 'VOLUNTARY').length;
  const pendingApprovals = requests.filter(r => r.status === 'PENDING').length;

  const departmentData = requests.reduce((acc: any, curr) => {
    const dep = curr.departmentId || 'Unassigned';
    acc[dep] = (acc[dep] || 0) + 1;
    return acc;
  }, {});

  const depChartData = Object.keys(departmentData).map(key => ({
    department: key,
    count: departmentData[key]
  }));

  const columns = [
    {
      title: 'DEPARTMENT',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <span style={{ color: 'var(--text-slate-800, #1e293b)', fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'TOTAL EXITS',
      dataIndex: 'count',
      key: 'count',
      render: (text: string) => <span style={{ color: 'var(--text-slate-500, #64748b)' }}>{text}</span>
    }
  ];

  return (
    <>
      <div className="exit-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="exit-topbar-meta">
            <span className="exit-pulse" style={{ background: '#3b82f6' }} />
            <strong style={{ fontSize: 16 }}>Attrition & Exit Reports</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            icon={<Download size={13} />}
            style={{
              background: 'var(--bg-pure-white, #ffffff)',
              borderColor: 'var(--border-slate-200, #e2e8f0)',
              color: 'var(--text-slate-600, #475569)',
              fontSize: 12.5,
              fontWeight: 500,
              borderRadius: 6,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="exit-body">
        <StatCards
          title="Attrition Overview"
          statusText="LIVE"
          progressPct={totalExits > 0 ? Math.round(((totalExits - pendingApprovals) / totalExits) * 100) : 0}
          cells={[
            {
              title: 'Total Exits (YTD)',
              value: totalExits,
              icon: <TrendingDown size={14} />,
              color: '#ef4444',
              tint: 'rgba(239,68,68,0.1)',
              hint: 'All-time exits'
            },
            {
              title: 'Voluntary Attrition',
              value: voluntaryExits,
              icon: <Users size={14} />,
              color: '#f59e0b',
              tint: 'rgba(245,158,11,0.1)',
              hint: 'Resignations'
            },
            {
              title: 'Pending Approvals',
              value: pendingApprovals,
              icon: <Clock size={14} />,
              color: '#3b82f6',
              tint: 'rgba(59,130,246,0.1)',
              hint: 'Awaiting action'
            },
          ]}
        />

        <div style={{ padding: '0 24px 24px' }}>
          <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div style={{
                border: '1px solid var(--border-slate-200, #e2e8f0)',
                borderRadius: 8,
                background: 'var(--bg-pure-white, #ffffff)',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
              }}>
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-slate-200, #e2e8f0)',
                  color: 'var(--text-slate-900, #0f172a)',
                  fontWeight: 600,
                  fontSize: 13.5
                }}>
                  Exits by Department
                </div>
                <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                    columns={columns}
                    dataSource={depChartData}
                    rowKey="department"
                    pagination={false}
                    className="exit-table"
                    locale={{
                      emptyText: (
                        <NoData
                          title="No Department Data"
                          description="No department exit statistics available."
                        />
                      )
                    }}
                  />
                </ZukvoLoadingOverlay>
              </div>
            </Col>
            <Col span={12}>
              <div style={{
                border: '1px solid var(--border-slate-200, #e2e8f0)',
                borderRadius: 8,
                background: 'var(--bg-pure-white, #ffffff)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
              }}>
                <BarChart3 size={44} color="var(--border-slate-300, #cbd5e1)" style={{ marginBottom: 14 }} />
                <div style={{ color: 'var(--text-slate-700, #334155)', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                  More insights coming soon
                </div>
                <div style={{ color: 'var(--text-slate-400, #94a3b8)', fontSize: 12.5, textAlign: 'center', maxWidth: 300 }}>
                  We are gathering enough data to generate predictive attrition insights.
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}
