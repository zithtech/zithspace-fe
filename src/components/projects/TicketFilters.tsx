import React from "react";
import { Select, Space, Button, Typography } from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/utils/ticketUtils";

const { Text } = Typography;

interface FilterState {
  status: string[];
  priority: string[];
  assignee: string[];
}

interface TicketFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  members: Array<{ value: string; label: string; position?: string }>;
  onReset?: () => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFilterChange,
  members,
  onReset,
}) => {
  return (
    <div style={{ width: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong><FilterOutlined /> Filters</Text>
        {onReset && (
          <Button type="link" size="small" icon={<ClearOutlined />} onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Status Filter */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>STATUS</Text>
          <Select
            mode="multiple"
            placeholder="Filter by status"
            style={{ width: "100%", marginTop: 4 }}
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
            options={STATUS_OPTIONS}
            allowClear
          />
        </div>

        {/* Priority Filter */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>PRIORITY</Text>
          <Select
            mode="multiple"
            placeholder="Filter by priority"
            style={{ width: "100%", marginTop: 4 }}
            value={filters.priority}
            onChange={(value) => onFilterChange("priority", value)}
            options={PRIORITY_OPTIONS}
            allowClear
          />
        </div>

        {/* Assignee Filter */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>ASSIGNEE</Text>
          <Select
            mode="multiple"
            placeholder="Filter by assignee"
            style={{ width: "100%", marginTop: 4 }}
            value={filters.assignee}
            onChange={(value) => onFilterChange("assignee", value)}
            showSearch
            allowClear
            filterOption={(input, option) => {
              const member = members.find((m) => m.value === option?.value);
              return member
                ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                (member.position || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
                : false;
            }}
            options={members.map((member) => ({
              label: `${member.label}${member.position ? ` - ${member.position}` : ''}`,
              value: member.value,
            }))}
          />
        </div>
      </Space>
    </div>
  );
};
