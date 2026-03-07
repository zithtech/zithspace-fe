"use client";

import React from "react";
import { Drawer, Form, Input, Button, InputNumber, Select, message } from "antd";
import { EmployeeSalaryRecord } from "../../types/salary";
import { salaryService } from "../../services/salaryService";

export default function EditSalaryDrawer({ 
  visible, 
  onClose, 
  record 
}: { 
  visible: boolean; 
  onClose: (refresh?: boolean) => void; 
  record: EmployeeSalaryRecord | null;
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        current_annual_ctc: record.current_annual_ctc,
        is_active: record.is_active,
      });
    }
  }, [visible, record, form]);

  const onFinish = async (values: any) => {
    if (!record) return;
    try {
      await salaryService.updateEmployeeSalary(record.id, values);
      message.success("Salary updated successfully");
      onClose(true);
    } catch (error) {
      message.error("Failed to update salary");
    }
  };

  return (
    <Drawer
      title="Edit Salary Record"
      width={400}
      open={visible}
      onClose={() => onClose()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="current_annual_ctc" label="Annual CTC" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="is_active" label="Status">
          <Select options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>Update</Button>
      </Form>
    </Drawer>
  );
}
