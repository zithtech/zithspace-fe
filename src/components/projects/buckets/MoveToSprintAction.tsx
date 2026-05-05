import React, { useState } from "react";
import { Popover, Button, Select, Space, Typography, Tooltip, Empty, Divider, Badge } from "antd";
import {
  RocketOutlined,
  ProjectOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import { useAvailableSprints } from "@/hooks/useAvailableSprints";
import { useUserProjects } from "@/hooks/useGlobalData";
import { Bucket } from "@/services/bucketService";

const { Text, Title } = Typography;
const { Option } = Select;

interface MoveToSprintActionProps {
  bucket: Bucket;
  onMove: (sprintId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const MoveToSprintAction: React.FC<MoveToSprintActionProps> = ({
  bucket,
  onMove,
  loading = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    bucket.projectId || undefined
  );
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();

  const { data: projects } = useUserProjects();
  const { data: sprints, isLoading: isLoadingSprints } = useAvailableSprints(selectedProjectId);

  const ticketCount = (bucket as any)._count?.tickets || 0;

  const handleMove = () => {
    if (selectedSprintId) {
      onMove(selectedSprintId);
      setOpen(false);
      setSelectedSprintId(undefined);
    }
  };

  const content = (
    <div className="move-sprint-popover-content">
      <div className="move-sprint-header">
        <div className="move-sprint-icon-wrapper">
          <RocketOutlined />
        </div>
        <div className="move-sprint-title-area">
          <Title level={5} className="move-sprint-title">Operational Migration</Title>
          <Text className="move-sprint-subtitle">Relocate hub tickets to an active execution sprint.</Text>
        </div>
      </div>

      <Divider style={{ margin: "10px 0" }} />

      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        {/* Project Selection (Conditional) */}
        {!bucket.projectId && (
          <div className="move-sprint-field">
            <Text className="move-sprint-label">
              <ProjectOutlined /> TARGET PROJECT
            </Text>
            <Select
              placeholder="Select destination project"
              className="saas-select-premium"
              style={{ width: "90%", margin: "0 auto", display: "block" }}
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                setSelectedSprintId(undefined);
              }}
              dropdownMatchSelectWidth={false}
            >
              {projects?.map((p: any) => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </div>
        )}

        {/* Sprint Selection */}
        <div className="move-sprint-field">
          <Text className="move-sprint-label">
            <ThunderboltOutlined /> TARGET EXECUTION SPRINT
          </Text>
          <Select
            placeholder={isLoadingSprints ? "Synchronizing sprints..." : "Select operational sprint"}
            className="saas-select-premium"
            style={{ width: "90%", margin: "0 auto", display: "block" }}
            value={selectedSprintId}
            onChange={setSelectedSprintId}
            disabled={!selectedProjectId || isLoadingSprints}
            dropdownMatchSelectWidth={false}
            notFoundContent={selectedProjectId && !isLoadingSprints ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active sprints found" /> : null}
          >
            {sprints?.map((s) => (
              <Option key={s.id} value={s.id}>
                <div className="sprint-option-render">
                  <Badge status={s.status === 'active' ? 'processing' : 'default'} />
                  <span className="sprint-version">{s.version}</span>
                  {s.status === 'active' && <span className="active-badge">ACTIVE</span>}
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* Movement Summary / Preview */}
        <div className="move-sprint-preview">
          <div className="preview-stat">
            <FileTextOutlined />
            <Text strong>{ticketCount}</Text>
            <Text type="secondary">tickets will be migrated</Text>
          </div>
          <Tooltip title="This action will unassign all tickets from this hub and relocate them to the selected sprint.">
            <InfoCircleOutlined className="info-trigger" />
          </Tooltip>
        </div>

        {/* Action Button */}
        <Button
          type="primary"
          style={{ width: '90%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={handleMove}
          disabled={!selectedSprintId}
          loading={loading}
          className="move-sprint-confirm-btn"
        >
          Move to Sprint
        </Button>
      </Space>

      <style jsx global>{`
        .move-sprint-popover-content {
          width: 280px;
          padding: 4px 2px;
        }
        .move-sprint-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 4px 4px 8px;
        }
        .move-sprint-icon-wrapper {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
        }
        .move-sprint-title-area {
          flex: 1;
        }
        .move-sprint-title {
          margin: 0 !important;
          font-weight: 800 !important;
          font-size: 13px !important;
          color: #0f172a !important;
          letter-spacing: -0.02em;
        }
        .move-sprint-subtitle {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
          display: block;
          margin-top: 2px;
        }
        .move-sprint-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .sprint-option-render {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sprint-version {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }
        .active-badge {
          font-size: 8px;
          font-weight: 900;
          background: #ecfdf5;
          color: #059669;
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid #d1fae5;
          line-height: 1;
        }
        .move-sprint-preview {
          background: #f8fafc;
          border-radius: 6px;
          padding: 7px 10px;
          display: flex;
          width: 90%;
          margin: 0 auto;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #f1f5f9;
        }
        .preview-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
        }
        .preview-stat span:first-child {
          color: #6366f1;
        }
        .info-trigger {
          color: #94a3b8;
          cursor: help;
          font-size: 14px;
        }
        .move-sprint-confirm-btn {
          height: 31px !important;
          border-radius: 6px !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3) !important;
          transition: all 0.3s ease !important;
        }
        .move-sprint-confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45) !important;
        }
        .move-sprint-confirm-btn:disabled {
          background: #f1f5f9 !important;
          color: #94a3b8 !important;
        }

        .saas-select-premium .ant-select-selector {
          height: 31px !important;
          border-radius: 6px !important;
        }
        .saas-select-premium .ant-select-selection-item,
        .saas-select-premium .ant-select-selection-placeholder {
          font-size: 12px !important;
          line-height: 29px !important;
        }

        /* Dark Theme Adjustments */
        [data-theme='dark'] .move-sprint-title { color: #f1f5f9 !important; }
        [data-theme='dark'] .move-sprint-subtitle { color: #94a3b8; }
        [data-theme='dark'] .move-sprint-preview { background: #1e293b; border-color: #334155; }
        [data-theme='dark'] .sprint-version { color: #f1f5f9; }
        [data-theme='dark'] .active-badge { background: rgba(5, 150, 105, 0.15); border-color: rgba(5, 150, 105, 0.25); }
      `}</style>
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="saas-popover saas-popover-premium"
      overlayInnerStyle={{ borderRadius: 16, padding: 10 }}
    >
      <Tooltip title="Move to sprint">
        <Button
          type="text"
          icon={<RocketOutlined style={{ fontSize: 13, color: disabled ? '#94a3b8' : "#8b5cf6" }} />}
          className="saas-action-btn"
          loading={loading}
          disabled={disabled}
          onClick={(e) => {
            if (disabled) return;
            e.stopPropagation();
          }}
        />
      </Tooltip>
    </Popover>
  );
};

