'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Row, Col, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: 24 }}>

          {/* ===== PAGE HEADER ===== */}
          <Title level={3} style={{ marginBottom: 24 }}>
            Grooming Documents
          </Title>

          {/* ===== 50 / 50 SPLIT ===== */}
          <Row gutter={16}>

            {/* LEFT SIDE – FORM CREATION (YOUR TASK) */}
            <Col span={12}>
              <Card
                title="Grooming Form"
                style={{ minHeight: '70vh' }}
              >
                <Text type="secondary">
                  Left side grooming form will be implemented here.
                </Text>

                {/* 
                  TODO:
                  - Static Header Card
                  - Wizard steps
                  - Mandatory grooming fields
                */}
              </Card>
            </Col>

            {/* RIGHT SIDE – LIVE PREVIEW (OTHER DEV TASK) */}
            <Col span={12}>
              <Card
                title="Live Preview"
                style={{ minHeight: '70vh' }}
              >
                <Text type="secondary">
                  
                </Text>

                <div
                  style={{
                    marginTop: 16,
                    padding: 16,
                    border: '1px dashed #d9d9d9',
                    borderRadius: 6,
                    background: '#fafafa',
                  }}
                >
                  <Text type="secondary">
                    
                  </Text>
                </div>
              </Card>
            </Col>

          </Row>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
