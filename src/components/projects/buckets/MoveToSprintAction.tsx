import React, { useState } from "react";
import { Popover, Button, Select, Space, Typography, Tooltip, Empty } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useAvailableSprints } from "@/hooks/useAvailableSprints";
import { useUserProjects } from "@/hooks/useGlobalData";
import { Bucket } from "@/services/bucketService";

const { Text } = Typography;
const { Option } = Select;

interface MoveToSprintActionProps {
  bucket: Bucket;
  onMove: (sprintId: string) => void;
  loading?: boolean;
}

export const MoveToSprintAction: React.FC<MoveToSprintActionProps> = ({
  bucket,
  onMove,
  loading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    bucket.projectId || undefined
  );
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();

  const { data: projects } = useUserProjects();
  const { data: sprints, isLoading: isLoadingSprints } = useAvailableSprints(selectedProjectId);

  const handleMove = () => {
    if (selectedSprintId) {
      onMove(selectedSprintId);
      setOpen(false);
      setSelectedSprintId(undefined);
    }
  };

  const content = (
    <div style={{ width: 280, padding: "4px 0" }}>
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <div>
          <Text strong style={{ fontSize: 13, color: "#0f172a" }}>Reassign Hub Tickets</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>Move all tickets in this hub to a specific sprint.</Text>
        </div>

        {!bucket.projectId && (
          <div style={{ width: "100%" }}>
            <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Select Project</Text>
            <Select
              placeholder="Target Project"
              style={{ width: "100%" }}
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                setSelectedSprintId(undefined);
              }}
              size="small"
              dropdownMatchSelectWidth={false}
            >
              {projects?.map((p: any) => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </div>
        )}

        <div style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Select Sprint</Text>
          <Select
            placeholder={isLoadingSprints ? "Loading..." : "Target Sprint"}
            style={{ width: "100%" }}
            value={selectedSprintId}
            onChange={setSelectedSprintId}
            size="small"
            disabled={!selectedProjectId || isLoadingSprints}
            dropdownMatchSelectWidth={false}
            notFoundContent={selectedProjectId && !isLoadingSprints ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active sprints" /> : null}
          >
            {sprints?.map((s) => (
              <Option key={s.id} value={s.id}>
                <Space>
                  <RocketOutlined style={{ fontSize: 11, color: s.status === 'active' ? '#10b981' : '#64748b' }} />
                  <span style={{ fontSize: 12 }}>{s.version}</span>
                  {s.status === 'active' && <Text style={{ fontSize: 8, background: '#ecfdf5', color: '#059669', padding: '1px 4px', borderRadius: 2, fontWeight: 800 }}>ACTIVE</Text>}
                </Space>
              </Option>
            ))}
          </Select>
        </div>

        <Button
          type="primary"
          block
          size="small"
          onClick={handleMove}
          disabled={!selectedSprintId}
          loading={loading}
          style={{ 
            borderRadius: 4, 
            height: 32, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            marginTop: 4
          }}
        >
          Confirm Movement
        </Button>
      </Space>
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
      overlayClassName="saas-popover"
    >
      <Tooltip title="Move to Sprint">
        <Button
          type="text"
          icon={<RocketOutlined style={{ fontSize: 14, color: "#8b5cf6" }} />}
          className="saas-action-btn"
          loading={loading}
          onClick={(e) => e.stopPropagation()}
        />
      </Tooltip>
    </Popover>
  );
};
