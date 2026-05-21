import React from "react";
import { Select, Space, Button, Typography, Switch, Avatar, Badge, Tag } from "antd";
import {
  FilterOutlined,
  RotateLeftOutlined,
  CheckCircleOutlined,
  FireFilled,
  UserOutlined,
  InboxOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";

const { Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  assignee: string[];
  type?: string[];
  showArchived?: boolean;
}

interface TicketFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  members: Array<{ value: string; label: string; position?: string; avatarUrl?: string | null }>;
  onReset?: () => void;
  showArchivedToggle?: boolean;
  statusOptions?: { label: string; value: string }[];
  priorityOptions?: { label: string; value: string }[];
  typeOptions?: { label: string; value: string }[];
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFilterChange,
  members,
  onReset,
  showArchivedToggle = false,
  statusOptions = STATUS_OPTIONS,
  priorityOptions = PRIORITY_OPTIONS,
  typeOptions = TYPE_OPTIONS,
}) => {
  const activeCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.assignee?.length || 0) +
    (filters.type?.length || 0) +
    (filters.showArchived ? 1 : 0);

  const SectionLabel = ({ icon: Icon, children, count }: any) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      padding: '0 4px'
    }}>
      <Space size={6}>
        <Icon style={{ fontSize: 11, color: 'var(--text-slate-400)' }} />
        <Text style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-slate-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          {children}
        </Text>
      </Space>
      {count > 0 && (
        <Badge
          count={count}
          style={{
            backgroundColor: 'var(--bg-blue-50)',
            color: 'var(--premium-blue)',
            fontSize: 9,
            minWidth: 16,
            height: 16,
            lineHeight: '16px',
            boxShadow: 'none',
            fontWeight: 700
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{
      width: 300,
      padding: '12px',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      boxShadow: 'var(--premium-shadow-lg)',
      border: '1px solid var(--border-color)'
    }}>
      {/* Mini Title & Reset */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: '0 4px'
      }}>
        <Space size={8}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeCount > 0 ? 'var(--premium-blue)' : '#cbd5e1' }} />
          <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>View Filters</Text>
        </Space>
        {activeCount > 0 && onReset && (
          <Button
            type="text"
            size="small"
            onClick={onReset}
            icon={<RotateLeftOutlined style={{ fontSize: 11 }} />}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--premium-blue)',
              height: 22,
              padding: '0 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center'
            }}
            className="hover:bg-blue-50 transition-all"
          >
            RESET
          </Button>
        )}
      </div>

      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        {/* Status Section */}
        <div>
          <SectionLabel icon={CheckCircleOutlined} count={filters.status?.length}>Status</SectionLabel>
          <Select
            mode="multiple"
            placeholder="No status filter"
            style={{ width: "100%" }}
            value={filters.status}
            onChange={(val) => onFilterChange("status", val)}
            options={statusOptions}
            allowClear
            className="saas-select-minimal"
            maxTagCount={1}
            maxTagPlaceholder={(omitted) => (
              <span style={{ fontSize: 11, color: 'var(--text-slate-400)', fontWeight: 600 }}>+{omitted.length} more</span>
            )}
            styles={{ popup: { root: { borderRadius: '10px', padding: '6px' } } }}
          />
        </div>

        {/* Priority Section */}
        <div>
          <SectionLabel icon={FireFilled} count={filters.priority?.length}>Priority</SectionLabel>
          <Select
            mode="multiple"
            placeholder="Any priority"
            style={{ width: "100%" }}
            value={filters.priority}
            onChange={(val) => onFilterChange("priority", val)}
            options={priorityOptions}
            allowClear
            className="saas-select-minimal"
            maxTagCount={2}
            styles={{ popup: { root: { borderRadius: '10px', padding: '6px' } } }}
          />
        </div>

        {/* Type Section */}
        <div>
          <SectionLabel icon={AppstoreOutlined} count={filters.type?.length}>Type</SectionLabel>
          <Select
            mode="multiple"
            placeholder="Any type"
            style={{ width: "100%" }}
            value={filters.type}
            onChange={(val) => onFilterChange("type", val)}
            options={typeOptions}
            allowClear
            className="saas-select-minimal"
            maxTagCount={2}
            styles={{ popup: { root: { borderRadius: '10px', padding: '6px' } } }}
          />
        </div>

        {/* Assignee Section */}
        <div>
          <SectionLabel icon={UserOutlined} count={filters.assignee?.length}>Assignee</SectionLabel>
          <Select
            mode="multiple"
            placeholder="All members"
            style={{ width: "100%" }}
            value={filters.assignee}
            onChange={(val) => onFilterChange("assignee", val)}
            showSearch
            allowClear
            className="saas-select-minimal"
            maxTagCount={1}
            styles={{ popup: { root: { borderRadius: '10px', padding: '6px' } } }}
            filterOption={(input, option) => {
              const member = members.find((m) => m.value === option?.value);
              return member
                ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                (member.position || "").toLowerCase().includes(input.toLowerCase())
                : false;
            }}
            options={members.map((m) => ({
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size={18} src={m.avatarUrl} style={{ fontSize: 9, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', fontWeight: 800 }}>{m.label?.charAt(0)}</Avatar>
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>{m.label}</Text>
                </div>
              ),
              value: m.value,
            }))}
          />
        </div>

        {/* Visibility Controls */}
        <div style={{ marginTop: 4 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 10px',
            background: filters.showArchived ? 'var(--bg-blue-50)' : 'var(--bg-slate-50)',
            borderRadius: 8,
            border: `1px solid ${filters.showArchived ? 'var(--border-blue-200)' : 'var(--border-slate-200)'}`,
            transition: 'all 0.2s'
          }}>
            <Space size={8}>
              <InboxOutlined style={{ fontSize: 13, color: filters.showArchived ? 'var(--premium-blue)' : '#94a3b8' }} />
              <Text style={{ fontSize: 12, fontWeight: 600, color: filters.showArchived ? 'var(--text-blue-700)' : '#64748b' }}>Show Archived</Text>
            </Space>
            <Switch
              size="small"
              checked={filters.showArchived}
              onChange={(checked) => onFilterChange("showArchived", checked)}
            />
          </div>
        </div>
      </Space>
    </div>
  );
};
