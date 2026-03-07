"use client";

import React from "react";
import { Drawer, Form, Button } from "antd";

export default function AddSalaryDrawer({ 
  visible, 
  onClose 
}: { 
  visible: boolean; 
  onClose: (refresh?: boolean) => void;
}) {
  return (
    <Drawer
      title="Add Employee Salary"
      width={400}
      open={visible}
      onClose={() => onClose()}
    >
      <Form layout="vertical">
        <p>Form content to be restored...</p>
        <Button onClick={() => onClose(true)} type="primary">
          Dummy Submit
        </Button>
      </Form>
    </Drawer>
  );
}
