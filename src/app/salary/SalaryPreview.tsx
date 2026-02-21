"use client";

import React, { useMemo } from "react";
import { Card, Divider, Row, Typography, Tag, InputNumber } from "antd";
import { RiseOutlined, FallOutlined, WalletOutlined } from "@ant-design/icons";
import { Earning, Deduction } from "@/types/salary";

const { Title, Text } = Typography;

interface Props {
  grossSalary: number;
  setGrossSalary?: (val: number) => void;
  earnings: Earning[];
  deductions: Deduction[];
  deductionsEnabled: boolean;
  readOnly?: boolean; // 👈 key
}

const SalaryPreview = ({
  grossSalary,
  setGrossSalary,
  earnings,
  deductions,
  deductionsEnabled,
  readOnly = false,
}: Props) => {
  const earningAmounts = useMemo(
    () =>
      earnings.map((e) => ({
        ...e,
        amount: Math.round((grossSalary * e.percentage) / 100),
      })),
    [earnings, grossSalary]
  );

  const basicPay =
    earningAmounts.find((e) => e.name === "Basic Pay")?.amount || 0;

  const deductionAmounts = useMemo(
    () =>
      deductions.map((d) => {
        let amount = 0;
        if (d.type === "BASIC_PERCENT")
          amount = Math.round((basicPay * d.value) / 100);
        else if (d.type === "GROSS_PERCENT")
          amount = Math.round((grossSalary * d.value) / 100);
        else amount = d.value;
        return { ...d, amount };
      }),
    [deductions, grossSalary, basicPay]
  );

  const totalDeductions = useMemo(
    () =>
      deductionsEnabled
        ? deductionAmounts.reduce((sum, d) => sum + d.amount, 0)
        : 0,
    [deductionsEnabled, deductionAmounts]
  );

  const netPay = grossSalary - totalDeductions;

  return (
    <Card
      size="small"
      style={{ borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <Title level={5}>Salary Preview</Title>

      {/* <InputNumber
        value={grossSalary}
        style={{ width: "100%", marginBottom: 8 }}
        disabled={readOnly} // 👈 drawer la disable
        controls={!readOnly} // 👈 arrows remove
        onChange={(v) => {
          if (!readOnly && setGrossSalary) {
            setGrossSalary(Number(v));
          }
        }}
      /> */}
       

      <InputNumber
        value={grossSalary}
        style={{
          width: "100%",
          marginBottom: 8,
          pointerEvents: readOnly ? "none" : "auto", // 👈 block interaction
          backgroundColor: readOnly ? "#fafafa" : undefined, // 👈 light bg
          color: "#000", // 👈 force black text
        }}
        controls={!readOnly} // arrows remove
        readOnly={readOnly} // 👈 key change
        onChange={(v) => {
          if (!readOnly && setGrossSalary) {
            setGrossSalary(Number(v));
          }
        }}
      />

      <Divider />

      <div style={{ display: "flex", gap: 8 }}>
        <Tag color="green" style={{ width: "30%", fontSize: 15 }}>
          <RiseOutlined /> Total Earnings
          <div>₹{grossSalary.toLocaleString()}</div>
        </Tag>
        <Tag color="orange" style={{ width: "40%", fontSize: 15 }}>
          <FallOutlined /> Total Deductions
          <div>₹{totalDeductions.toLocaleString()}</div>
        </Tag>
        <Tag color="purple" style={{ width: "30%", fontSize: 15 }}>
          <WalletOutlined /> Net Pay
          <div>₹{netPay.toLocaleString()}</div>
        </Tag>
      </div>

      <Divider />

      <Title level={5}>Earnings Breakdown</Title>
      {earningAmounts.map((e) => (
        <Row key={e.id} justify="space-between">
          <Text>{e.name}</Text>
          <Text strong>
            ₹{e.amount.toLocaleString()} ({e.percentage}%)
          </Text>
        </Row>
      ))}

      {deductionsEnabled && (
        <>
          <Divider />
          <Title level={5}>Deductions Breakdown</Title>
          {deductionAmounts.map((d) => (
            <Row key={d.id} justify="space-between">
              <Text>{d.name}</Text>
              <Text strong>
                ₹{d.amount.toLocaleString()}{" "}
                {d.type === "FIXED"
                  ? "(Fixed)"
                  : d.type === "BASIC_PERCENT"
                  ? `(${d.value}% of Basic)`
                  : `(${d.value}% of Gross)`}
              </Text>
            </Row>
          ))}
        </>
      )}

      <Divider />

      <Row justify="space-between" align="middle">
        <Title level={5} style={{ margin: 0 }}>
          Net Take-Home Pay
        </Title>
        <Text type="secondary">
          {((netPay / grossSalary) * 100).toFixed(1)}% of Gross
        </Text>
      </Row>
      <Row justify="space-between" align="middle">
        <Title level={4} style={{ margin: 0, color: "blue" }}>
          ₹{netPay.toLocaleString()}
        </Title>
        <Text type="secondary">
          Deductions: {((totalDeductions / grossSalary) * 100).toFixed(1)}%
        </Text>
      </Row>
    </Card>
  );
};

export default SalaryPreview;
