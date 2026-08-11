"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React from "react";
import {
  Card,
  Radio,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Bucket } from "@/services/bucketService";


const { Text } = Typography;

interface BucketSelectorProps {
  visible: boolean;
  buckets: Bucket[];
  loading: boolean;
  selectedBucketId: string | null;
  onSelectBucket: (bucketId: string) => void;
  onCreateNewBucket: () => void;
  onClose: () => void;
}

export function BucketSelector({
  visible,
  buckets,
  loading,
  selectedBucketId,
  onSelectBucket,
  onCreateNewBucket,
  onClose }: BucketSelectorProps) {
  if (!visible) return null;

  return (
    <Card
      style={{
        marginTop: 12,
        maxHeight: 400,
        overflowY: "auto" }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>Select Bucket or Create New:</Text>
      </div>

      {/* Existing Buckets List */}
      {buckets.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            AVAILABLE BUCKETS
          </Text>
          <Radio.Group
            value={selectedBucketId}
            onChange={(e) => onSelectBucket(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {loading ? (
              <LoadingSpinner size="small" fullScreen={false} />
            ) : (
              buckets.map((bucket) => (
                <Radio
                  key={bucket.id}
                  value={bucket.id}
                  style={{ padding: 8, borderRadius: 4 }}
                >
                  <Space>
                    {bucket.color && (
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: bucket.color }}
                      />
                    )}
                    <span style={{ fontWeight: 500 }}>{bucket.name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({bucket._count?.tickets || 0} tickets)
                    </Text>
                  </Space>
                </Radio>
              ))
            )}
          </Radio.Group>

          <Divider style={{ margin: "12px 0" }} />
        </div>
      )}

      {/* No Buckets Message */}
      {buckets.length === 0 && !loading && (
        <Empty
          description="No buckets available"
          style={{ marginBottom: 12 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Create New Bucket Button */}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={onCreateNewBucket}
        style={{ marginTop: 8 }}
      >
        Create New Bucket
      </Button>
    </Card>
  );
}
