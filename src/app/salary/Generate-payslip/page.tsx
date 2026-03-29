"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography } from "antd";

const { Title } = Typography;

const GeneratePayslipPage = () => {
  return (
    <MainLayout>
      <Title level={3}>Generate Payslip</Title>
    </MainLayout>
  );
};

export default GeneratePayslipPage;
