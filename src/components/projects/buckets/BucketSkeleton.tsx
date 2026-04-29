import React from 'react';
import { Skeleton, Card, Space, Table, Divider } from 'antd';

const BucketSkeleton: React.FC = () => {
  return (
    <div style={{ padding: "16px 12px 32px", flex: 1, overflowY: "auto" }}>
      {/* Control Bar Skeleton */}
      <div style={{
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-slate-200)',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
          <Space size={16}>
            <Skeleton.Button active style={{ width: 80, height: 32, borderRadius: 6 }} />
            <Skeleton.Button active style={{ width: 80, height: 32, borderRadius: 6 }} />
          </Space>
          <Divider type="vertical" />
          <Space size={12}>
            <Skeleton.Input active style={{ width: 160, height: 38, borderRadius: 6 }} />
            <Skeleton.Input active style={{ width: 140, height: 38, borderRadius: 6 }} />
          </Space>
        </div>
        <Space size={12}>
          <Skeleton.Input active style={{ width: 240, height: 38, borderRadius: 6 }} />
          <Skeleton.Button active style={{ width: 60, height: 32, borderRadius: 6 }} />
        </Space>
      </div>

      {/* Table Skeleton */}
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          borderRadius: 0,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          backgroundColor: "transparent",
          boxShadow: "none"
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            <Skeleton.Input active style={{ width: '30%', height: 20 }} />
            <Skeleton.Input active style={{ width: '15%', height: 20, marginLeft: '5%' }} />
            <Skeleton.Input active style={{ width: '25%', height: 20, marginLeft: '5%' }} />
            <Skeleton.Input active style={{ width: '20%', height: 20, marginLeft: 'auto' }} />
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ display: 'flex', padding: '16px 0', borderBottom: i === 8 ? 'none' : '1px solid #f1f5f9', alignItems: 'center' }}>
              <div style={{ width: '30%', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Skeleton.Avatar active shape="square" size="small" />
                <Skeleton.Input active style={{ width: '60%', height: 16 }} />
              </div>
              <div style={{ width: '15%', marginLeft: '5%' }}>
                <Skeleton.Button active size="small" style={{ width: 80, height: 18, borderRadius: 10 }} />
              </div>
              <div style={{ width: '25%', marginLeft: '5%' }}>
                <Skeleton.Input active style={{ width: '70%', height: 16 }} />
              </div>
              <div style={{ width: '20%', marginLeft: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Skeleton.Avatar active size="small" shape="circle" />
                <Skeleton.Avatar active size="small" shape="circle" />
                <Skeleton.Avatar active size="small" shape="circle" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BucketSkeleton;
