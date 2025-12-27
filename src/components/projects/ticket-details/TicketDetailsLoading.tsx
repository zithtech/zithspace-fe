"use client";

import React from "react";
import { Row, Col, Card, Skeleton, Divider } from "antd";

export default function TicketDetailsLoading() {
  return (
    <div className="">
      {/* Header Skeleton */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Skeleton.Button active size="default" style={{ width: 80 }} />
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Main Content Skeleton */}
        <Col xs={24} lg={16}>
          {/* Ticket Header Card Skeleton */}
          <Card>
            <div
              style={{
                background: "#fafafa",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "24px",
                border: "1px solid #e8e8e8",
              }}
            >
              {/* Ticket Number */}
              <Skeleton.Button active size="small" style={{ width: 100, marginBottom: 12 }} />
              
              {/* Title */}
              <Skeleton active title={{ width: '70%' }} paragraph={false} style={{ marginBottom: 16 }} />
              
              {/* Description */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "6px",
                  padding: "16px",
                  border: "1px solid #e8e8e8",
                }}
              >
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            </div>

            {/* Ticket Information Skeleton */}
            <Divider orientation="left">Ticket Information</Divider>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>

          {/* Related Links Card Skeleton */}
          <Card title="Related Links" style={{ marginTop: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
            <Divider />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>

          {/* Attachments Card Skeleton */}
          <Card title="Attachments" style={{ marginTop: 16 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>

          {/* Comments Card Skeleton */}
          <Card title="Comments" style={{ marginTop: 16 }}>
            <Skeleton.Input active size="large" block style={{ marginBottom: 16 }} />
            <Divider />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
            <Divider />
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        </Col>

        {/* Sidebar Skeleton */}
        <Col xs={24} lg={8}>
          <Card title="Workflow Progress">
            {/* Progress Bar Skeleton */}
            <div style={{ marginBottom: 16 }}>
              <Skeleton.Input active size="small" block />
            </div>
            
            {/* Timeline Skeleton */}
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
