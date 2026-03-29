import React from 'react';
import { Skeleton, Card, Space, Row, Col, Divider, Layout } from 'antd';

const { Header, Sider, Content } = Layout;

interface TicketSkeletonProps {
  viewMode?: 'list' | 'board';
  fullPage?: boolean;
}

/**
 * TicketSkeleton Component
 * 
 * Provides a premium shimmering UI for the Tickets page during loading states.
 * Mimics the layout of the TicketList component.
 * If fullPage is true, it also simulates the application shell (TopNav & SideNav).
 */
const TicketSkeleton: React.FC<TicketSkeletonProps> = ({ viewMode = 'list', fullPage = false }) => {
  const renderTopNavSkeleton = () => (
    <Header
      style={{
        padding: "0 24px",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
      }}
    >
      <Space size={24}>
        <Skeleton.Button active size="large" style={{ width: 150, height: 32, borderRadius: 4 }} />
        <Space size={16}>
          <Skeleton.Button active size="small" style={{ width: 80, height: 32, borderRadius: 8 }} />
          <Skeleton.Button active size="small" style={{ width: 80, height: 32, borderRadius: 8 }} />
          <Skeleton.Button active size="small" style={{ width: 80, height: 32, borderRadius: 8 }} />
        </Space>
      </Space>
      <Space size={16}>
        <Skeleton.Avatar active size="small" shape="circle" />
        <Skeleton.Avatar active size="small" shape="circle" />
        <Skeleton.Avatar active size="small" shape="circle" />
        <Divider type="vertical" />
        <Space size={8}>
          <Skeleton.Avatar active size="small" shape="circle" />
          <Skeleton.Input active size="small" style={{ width: 80, height: 20 }} />
        </Space>
      </Space>
    </Header>
  );

  const renderSideNavSkeleton = () => (
    <Sider
      width={200}
      theme="light"
      style={{
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        position: "fixed",
        left: 0,
        top: 64,
        bottom: 0,
        height: "calc(100vh - 64px)",
        zIndex: 99,
        padding: '16px 0'
      }}
    >
      <Space direction="vertical" style={{ width: '100%', padding: '0 16px' }} size={24}>
        <Skeleton.Button active size="small" style={{ width: '100%', height: 32, borderRadius: 6 }} />
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton.Avatar active size="small" shape="square" style={{ width: 16, height: 16 }} />
              <Skeleton.Input active size="small" style={{ width: '70%', height: 16 }} />
            </div>
          ))}
        </Space>
      </Space>
    </Sider>
  );

  const renderPageHeader = () => (
    <div style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space size={16} align="center">
            {/* Breadcrumb/Back area */}
            <Skeleton.Button active size="small" style={{ width: 100, borderRadius: 6 }} />
            
            <Divider type="vertical" style={{ height: 20, margin: 0 }} />
            
            {/* Project Name & Code */}
            <Space size={12} align="center">
              <Skeleton.Input active size="small" style={{ width: 150, height: 28, borderRadius: 4 }} />
              <Skeleton.Button active size="small" style={{ width: 60, height: 20, borderRadius: 4 }} />
            </Space>
            
            <Divider type="vertical" style={{ height: 20, margin: 0 }} />
            
            {/* Search Field */}
            <Skeleton.Input active size="small" style={{ width: 240, height: 36, borderRadius: 8 }} />
          </Space>
        </Col>
        
        <Col>
          <Space size={8} align="center">
            {/* Action Group */}
            <div style={{ backgroundColor: '#f5f5f5', padding: '4px', borderRadius: 8, display: 'flex', gap: 4 }}>
              <Skeleton.Button active size="small" style={{ width: 36, height: 32, borderRadius: 6 }} />
              <Skeleton.Button active size="small" style={{ width: 80, height: 32, borderRadius: 6 }} />
            </div>
            
            {/* Create Button */}
            <Skeleton.Button active size="small" style={{ width: 90, height: 36, borderRadius: 8 }} />
            
            <Divider type="vertical" style={{ height: 24, margin: '0 4px' }} />
            
            {/* View Switchers */}
            <div style={{ backgroundColor: '#f5f5f5', padding: '2px', borderRadius: 10, display: 'flex', gap: 2 }}>
              <Skeleton.Button active size="small" style={{ width: 70, height: 32, borderRadius: 8 }} />
              <Skeleton.Button active size="small" style={{ width: 70, height: 32, borderRadius: 8 }} />
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );

  const renderListSkeleton = () => (
    <div style={{ padding: '0 24px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space size={12}>
              <Skeleton.Input active size="small" style={{ width: 150, height: 24 }} />
              <Skeleton.Button active size="small" style={{ width: 40, height: 20, borderRadius: 10 }} />
              <Skeleton.Button active size="small" style={{ width: 70, height: 20, borderRadius: 4 }} />
            </Space>
            <Skeleton.Input active size="small" style={{ width: 120, height: 20 }} />
          </div>
        }
        style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', padding: '12px 0', borderBottom: i === 5 ? 'none' : '1px solid #f9f9f9', gap: 16 }}>
              <Skeleton.Button active size="small" style={{ width: 80 }} />
              <Skeleton.Input active size="small" style={{ flex: 1 }} />
              <Skeleton.Button active size="small" style={{ width: 100 }} />
              <Skeleton.Button active size="small" style={{ width: 80 }} />
              <Skeleton.Avatar active size="small" />
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Space size={12}>
              <Skeleton.Input active size="small" style={{ width: 100, height: 24 }} />
              <Skeleton.Button active size="small" style={{ width: 40, height: 20, borderRadius: 10 }} />
            </Space>
            <Skeleton.Button active size="small" style={{ width: 100, height: 24 }} />
          </div>
        }
        style={{ borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ display: 'flex', padding: '12px 0', borderBottom: i === 8 ? 'none' : '1px solid #f9f9f9', gap: 16 }}>
              <Skeleton.Button active size="small" style={{ width: 80 }} />
              <Skeleton.Input active size="small" style={{ flex: 1 }} />
              <Skeleton.Button active size="small" style={{ width: 100 }} />
              <Skeleton.Button active size="small" style={{ width: 80 }} />
              <Skeleton.Avatar active size="small" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderBoardSkeleton = () => (
    <div style={{ padding: '0 24px', display: 'flex', gap: 16, height: 'calc(100vh - 250px)', overflow: 'hidden' }}>
      {[1, 2, 3, 4].map((col) => (
        <div key={col} style={{ flex: 1, minWidth: 280, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton.Input active size="small" style={{ width: 100, height: 24 }} />
            <Skeleton.Avatar active size="small" shape="circle" />
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {[1, 2, 3].map((card) => (
              <Card key={card} style={{ borderRadius: 8, border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} styles={{ body: { padding: 12 } }}>
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton.Button active size="small" style={{ width: 60, height: 20 }} />
                  <Skeleton.Avatar active size="small" />
                </div>
              </Card>
            ))}
          </Space>
        </div>
      ))}
    </div>
  );

  const pageContent = (
    <div style={{ 
      backgroundColor: '#fdfdfd', 
      minHeight: '100vh', 
      width: '100%',
      marginTop: fullPage ? 64 : 0,
      marginLeft: fullPage ? 200 : 0,
      transition: 'all 0.2s'
    }}>
      {renderPageHeader()}
      {viewMode === 'list' ? renderListSkeleton() : renderBoardSkeleton()}
    </div>
  );

  if (fullPage) {
    return (
      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        {renderTopNavSkeleton()}
        <Layout>
          {renderSideNavSkeleton()}
          <Content style={{ overflow: 'auto' }}>
            {pageContent}
          </Content>
        </Layout>
      </Layout>
    );
  }

  return pageContent;
};

export default TicketSkeleton;
