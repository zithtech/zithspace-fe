'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Row, Col, Card } from 'antd';
import {
  BarChart3,
  TrendingDown,
  Users,
  Download,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { EmployeeExitService, EmployeeExitRequest } from '@/services/employeeExitService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function ReportsPage() {
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
      render: (text: string) => <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'TOTAL EXITS',
      dataIndex: 'count',
      key: 'count',
      render: (text: string) => <span style={{ color: 'var(--text-slate-400)' }}>{text}</span>
    }
  ];

  return (
    <>
      <div className="exit-page-header">

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18 }}>Attrition & Exit Reports</span>
        </div>
        <Button icon={<Download size={14} />} style={{ background: 'transparent', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-400)' }}>
          Export Report
        </Button>
      </div>
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="exit-stat-card">
            <div className="exit-stat-card-header">
              <TrendingDown size={14} color="#ef4444" />
              Total Exits (YTD)
            </div>
            <div className="exit-stat-card-body">
              <div className="exit-stat-card-value">{totalExits}</div>
              <div className="exit-stat-card-label">All-time</div>
            </div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-card-header">
              <Users size={14} color="#f59e0b" />
              Voluntary Attrition
            </div>
            <div className="exit-stat-card-body">
              <div className="exit-stat-card-value">{voluntaryExits}</div>
              <div className="exit-stat-card-label">Resignations</div>
            </div>
          </div>
          <div className="exit-stat-card">
            <div className="exit-stat-card-header">
              <Clock size={14} color="#3b82f6" />
              Pending Approvals
            </div>
            <div className="exit-stat-card-body">
              <div className="exit-stat-card-value">{pendingApprovals}</div>
              <div className="exit-stat-card-label">Awaiting action</div>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col span={12}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}>Exits by Department</div>
              <ZukvoLoadingOverlay loading={loading} message="">
                <Table
                  columns={columns}
                  dataSource={depChartData}
                  rowKey="department"
                  pagination={false}
                />
              </ZukvoLoadingOverlay>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <BarChart3 size={48} color="var(--border-slate-200)" style={{ marginBottom: 16 }} />
              <div style={{ color: 'var(--text-slate-400)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>More insights coming soon</div>
              <div style={{ color: 'var(--text-slate-600)', fontSize: 13, textAlign: 'center', maxWidth: 300 }}>We are gathering enough data to generate predictive attrition insights.</div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}
