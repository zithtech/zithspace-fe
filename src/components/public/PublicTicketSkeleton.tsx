import React from 'react';
import { Layout, Card, Skeleton, Space, Divider, Row, Col } from 'antd';

const { Content, Footer } = Layout;

/**
 * PublicTicketSkeleton Component
 * 
 * Provides a skeleton loading state for the public ticket view.
 */
const PublicTicketSkeleton: React.FC = () => {
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header Skeleton */}
      <div style={{
        background: '#fff',
        padding: '0 20px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <Skeleton.Button active size="small" style={{ width: 100, height: 24 }} />
        </div>
      </div>

      <Content style={{ marginTop: 64 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {/* Ticket Header Skeleton */}
            <div style={{ marginBottom: 24 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Space>
                  <Skeleton.Button active size="small" style={{ width: 80 }} />
                  <Skeleton.Button active size="small" style={{ width: 100, borderRadius: 4 }} />
                </Space>
                <Skeleton.Input active size="large" style={{ width: '60%', height: 40 }} />
              </Space>
            </div>

            <Divider />

            <Row gutter={[32, 24]}>
              {/* Main Content Skeleton */}
              <Col xs={24} md={16}>
                <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 16 }} />
                <div style={{ minHeight: 150 }}>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </div>
                
                <Divider />
                
                <Space size={24} style={{ marginBottom: 24 }}>
                   <Skeleton.Button active size="small" style={{ width: 100 }} />
                   <Skeleton.Button active size="small" style={{ width: 100 }} />
                   <Skeleton.Button active size="small" style={{ width: 100 }} />
                </Space>
                
                <div style={{ padding: '20px', background: '#fafafa', borderRadius: 8 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginBottom: 20 }}>
                       <Skeleton active avatar paragraph={{ rows: 2 }} />
                       {i < 3 && <Divider style={{ margin: '12px 0' }} />}
                    </div>
                  ))}
                </div>
              </Col>

              {/* Sidebar Skeleton */}
              <Col xs={24} md={8}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {[1, 2, 3].map(i => (
                    <Card key={i} size="small" title={<Skeleton.Button active size="small" style={{ width: 60 }} />}>
                      <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Skeleton.Button active size="small" style={{ width: 60 }} />
                          <Skeleton.Button active size="small" style={{ width: 100 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Skeleton.Button active size="small" style={{ width: 40 }} />
                          <Skeleton.Button active size="small" style={{ width: 60 }} />
                        </div>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      </Content>
      <Footer style={{ textAlign: "center", background: 'transparent' }}>
        <Skeleton.Button active size="small" style={{ width: 250 }} />
      </Footer>
    </Layout>
  );
};

export default PublicTicketSkeleton;
