"use client";

import React from "react";
import { Drawer, Descriptions, Tag, Divider, Typography } from "antd";
import { EmployeeSalaryRecord } from "../../types/salary";

const { Title, Text } = Typography;

export default function SalaryDetailsDrawer({ 
  visible, 
  onClose, 
  record 
}: { 
  visible: boolean; 
  onClose: () => void; 
  record: EmployeeSalaryRecord | null;
}) {
  if (!record) return null;

  return (
    <Drawer
      title="Salary Record Details"
      width={600}
      open={visible}
      onClose={onClose}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Employee">{record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : record.employee_name}</Descriptions.Item>
        <Descriptions.Item label="ID">{record.employee_code}</Descriptions.Item>
        <Descriptions.Item label="Annual CTC">₹{Number(record.current_annual_ctc || 0).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Status">
           <Tag color={record.is_active ? "green" : "default"}>{record.is_active ? "Active" : "Inactive"}</Tag>
        </Descriptions.Item>
      </Descriptions>
      
      <Divider />
      <Title level={5}>Salary Timeline</Title>
      <Text type="secondary">Timeline restoration in progress...</Text>
    </Drawer>
  );
}
