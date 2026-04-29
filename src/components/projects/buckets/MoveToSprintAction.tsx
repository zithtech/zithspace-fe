import React, { useState } from "react";
import { Popover, Button, Select, Space, Typography, Tooltip, Empty, Badge } from "antd";
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
    <div style={{ width: 300, padding: "8px 4px" }} onClick={(e) => e.stopPropagation()}>
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        {/* Header Section */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.1)',
            display: 'flex', alignItems: 'center', justifyItems: 'center',
            justifyContent: 'center', flexShrink: 0,
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <RocketOutlined style={{ fontSize: 18, color: '#8b5cf6' }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)', display: 'block', lineHeight: 1.2 }}>
              Reassign Hub Tickets
            </Text>
            <Text style={{ fontSize: 11, color: 'var(--text-slate-500)', marginTop: 2, display: 'block' }}>
              Relocate all hub tickets to a target sprint.
            </Text>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-slate-50)',
          padding: '12px',
          borderRadius: 8,
          border: '1px solid var(--border-slate-100)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {!bucket.projectId && (
            <div style={{ width: "100%" }}>
              <Text style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: "block" }}>
                Target Project
              </Text>
              <Select
                placeholder="Select project..."
                style={{ width: "100%" }}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSprintId(undefined);
                }}
                size="middle"
                dropdownMatchSelectWidth={false}
                className="premium-select"
              >
                {projects?.map((p: any) => (
                  <Option key={p.value} value={p.value}>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</Text>
                  </Option>
                ))}
              </Select>
            </div>
          )}

          <div style={{ width: "100%" }}>
            <Text style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: "block" }}>
              Target Sprint
            </Text>
            <Select
              placeholder={isLoadingSprints ? "Synchronizing..." : "Select sprint..."}
              style={{ width: "100%" }}
              value={selectedSprintId}
              onChange={setSelectedSprintId}
              size="middle"
              disabled={!selectedProjectId || isLoadingSprints}
              dropdownMatchSelectWidth={false}
              className="premium-select"
              notFoundContent={selectedProjectId && !isLoadingSprints ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ fontSize: 11 }}>No active sprints</Text>} /> : null}
            >
              {sprints?.map((s) => (
                <Option key={s.id} value={s.id}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={8}>
                      <RocketOutlined style={{ fontSize: 12, color: s.status === 'active' ? '#10b981' : '#94a3b8' }} />
                      <Text style={{ fontSize: 12, fontWeight: 600 }}>{s.version}</Text>
                    </Space>
                    {s.status === 'active' && (
                      <Badge
                        count="ACTIVE"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          fontSize: 8,
                          fontWeight: 800,
                          borderRadius: 4,
                          boxShadow: 'none',
                          border: '1px solid #10b98130'
                        }}
                      />
                    )}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>
        </div>

        <Button
          type="primary"
          block
          onClick={handleMove}
          disabled={!selectedSprintId}
          loading={loading}
          style={{
            borderRadius: 6,
            height: 38,
            fontWeight: 800,
            fontSize: 13,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          icon={<RocketOutlined />}
        >
          Move to Sprint
        </Button>
      </Space>

      <style jsx global>{`
        .premium-select .ant-select-selector {
          border-radius: 6px !important;
          border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .premium-select .ant-select-selector {
          background: #1f2937 !important;
          border-color: #374151 !important;
        }
        .premium-select:hover .ant-select-selector {
          border-color: #8b5cf6 !important;
        }
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
      overlayClassName="saas-popover"
    >
      <Tooltip title="Move to Sprint">
        <Button
          type="text"
          icon={<RocketOutlined style={{ fontSize: 14, color: "#8b5cf6" }} />}
          className="saas-action-btn"
          loading={loading}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </Tooltip>
    </Popover>
  );
};
