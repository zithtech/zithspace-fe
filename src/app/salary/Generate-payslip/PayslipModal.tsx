"use client";

import React, { useRef, useState, useEffect } from "react";
import { Modal, Typography } from "antd";
import { Company, Employee, EmployeeSalary } from "@/types/salary";

import {
  CompanyService,
  fetchEmployeeSalary,
} from "@/services/salarySettings.service";
import {
  calculateEarnings,
  calculateDeductionAmounts,
  calculateTotalDeductions,
  calculateTotalEarnings,
  calculateNetPay,
  calculateEarningsWithYTD,
  calculateDeductionsWithYTD,
  calculateTotalEarningsYTD,
  calculateTotalDeductionsYTD,
  numberToWords,
} from "@/utils/salaryCalculator";



import { Row, Col, Divider, Card, Space, Button } from "antd";
import {
  AttendanceResponse,
  ATTENDANCE_LABELS,
  LEAVE_LABELS,
  ReimbursementResponse,
  REIMBURSEMENT_LABELS,
} from "@/types/salary";
const { Title, Text } = Typography;

interface PayslipModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  fromDate: string;
  toDate: string;
  attendance?: AttendanceResponse | null;
  reimbursements?: ReimbursementResponse | null;
}

const PayslipModal: React.FC<PayslipModalProps> = ({
  open,
  onClose,
  employee,
  fromDate,
  toDate,
  attendance,
  reimbursements, // ✅ RECEIVE
}) => {
  if (!employee) return null;

  const [company, setCompany] = React.useState<Company | null>(null);
  const payslipRef = useRef<HTMLDivElement>(null);

  const [salaryStructure, setSalaryStructure] = useState<EmployeeSalary | null>(
    null,
  );

  React.useEffect(() => {
    if (open) {
      loadCompany();
    }
  }, [open]);

  const loadCompany = async () => {
    const activeCompany = await CompanyService.getActive();
    if (activeCompany) {
      setCompany(activeCompany);
    }
  };

  useEffect(() => {
    if (open && employee) {
      loadEmployeeSalary();
    }
  }, [open, employee]);

  const loadEmployeeSalary = async () => {
    try {
      // setSalaryStructure(data);
      //     setSalaryStructure({
      //   employeeId: employee.employeeId,
      //   grossSalary: 50000,
      //   deductionsEnabled: true,

      //   earnings: [
      //     { id: 1, name: "Basic Salary", percentage: 60 },
      //     { id: 2, name: "HRA", percentage: 30 },
      //     { id: 3, name: "Special Allowance", percentage: 10 },
      //   ],

      //   deductions: [
      //     { id: 1, name: "Provident Fund", type: "BASIC_PERCENT", value: 12 },
      //     { id: 2, name: "Professional Tax", type: "FIXED", value: 200 },
      //   ],
      // });
      const data = await fetchEmployeeSalary(employee.employeeId);
      setSalaryStructure(data);
    } catch (error) {
      console.error("Salary load error:", error);
      // Fallback to staticSalary
      setSalaryStructure({
        employeeId: employee.employeeId,
        grossSalary: 50000,
        deductionsEnabled: true,
        earnings: [
          /* your static */
        ],
        deductions: [
          /* your static */
        ],
      });
    }
  };

  // const staticSalary = {
  //   name: "Zithtech Salary Structure",
  //   grossSalary: 50000,
  //   deductionsEnabled: true,

  //   earnings: [
  //     {
  //       id: 1,
  //       name: "Basic Salary",
  //       type: "PERCENTAGE",
  //       percentage: 60, // 🔥 60% of gross
  //       value: 0,
  //     },
  //     {
  //       id: 2,
  //       name: "HRA",
  //       type: "PERCENTAGE",
  //       percentage: 30, // 🔥 30%
  //       value: 0,
  //     },
  //     {
  //       id: 3,
  //       name: "Special Allowance",
  //       type: "PERCENTAGE",
  //       percentage: 10, // 🔥 10%
  //       value: 0,
  //     },
  //   ],

  //   deductions: [
  //     {
  //       id: 1,
  //       name: "Provident Fund",
  //       type: "PERCENTAGE",
  //       percentage: 3.6,
  //       value: 0,
  //     },
  //     {
  //       id: 2,
  //       name: "Employees State Insurance",
  //       type: "FIXED",
  //       value: 500,
  //       percentage: 0,
  //     },
  //   ],
  // };

  // const structure = {
  //   grossSalary: staticSalary.grossSalary,
  //   earnings: staticSalary.earnings,
  //   deductions: staticSalary.deductions,
  //   deductionsEnabled: staticSalary.deductionsEnabled,
  // };

  if (!salaryStructure) return null;

  const structure = {
    grossSalary: salaryStructure.grossSalary,
    earnings: salaryStructure.earnings,
    deductions: salaryStructure.deductions,
    deductionsEnabled: salaryStructure.deductionsEnabled,
  };

  // const earningAmounts = calculateEarnings(structure);
  // const deductionAmounts = calculateDeductionAmounts(structure);

  // const earningAmounts = calculateEarningsWithYTD(structure, fromDate);
  // const deductionAmounts = calculateDeductionsWithYTD(structure, fromDate);

  // const totalEarningsYTD = calculateTotalEarningsYTD(structure, fromDate);
  // const totalDeductionsYTD = calculateTotalDeductionsYTD(structure, fromDate);

  // const totalEarnings = calculateTotalEarnings(structure);
  // const totalDeductions = calculateTotalDeductions(structure);
  // const netPay = calculateNetPay(structure);

  const earningAmounts = calculateEarningsWithYTD(structure, fromDate);
  const deductionAmounts = calculateDeductionsWithYTD(structure, fromDate);

  const totalEarningsYTD = calculateTotalEarningsYTD(structure, fromDate);
  const totalDeductionsYTD = calculateTotalDeductionsYTD(structure, fromDate);

  const totalEarnings = calculateTotalEarnings(structure);
  const totalDeductions = calculateTotalDeductions(structure);
  const netPay = calculateNetPay(structure);

  const formatMonthYear = (dateStr: string) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    return date.toLocaleString("en-US", {
      month: "short", // Jan
      year: "numeric", // 2026
    });
  };

  const totalReimbursements = reimbursements
    ? Object.values(reimbursements.reimbursements).reduce(
      (sum: number, r: any) => sum + r.amount,
      0,
    )
    : 0;

  const TotalnetPay =
    salaryStructure.grossSalary - totalDeductions + totalReimbursements;

  const downloadPayslipPDF = async () => {
    if (!payslipRef.current) return;

    const html2pdf = (await import("html2pdf.js")).default;


    html2pdf()
      .from(payslipRef.current)
      .set({
        margin: [10, 10, 10, 10],
        filename: `Payslip_${employee.employeeName}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          letterRendering: true, // 🔥 ADD THIS
          windowWidth: 700,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      })
      .save();
  };

  const formatCompanyAddress = (c: Company) => {
    const line1 = [c.plotNo, c.floorNo, c.buildingName]
      .filter(Boolean)
      .join(", ");

    const line2 = [c.street, c.area].filter(Boolean).join(", ");

    const line3 = [c.city, c.pincode && `- ${c.pincode}`, c.country]
      .filter(Boolean)
      .join(" ");

    return [line1, line2, line3].filter(Boolean);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
      bodyStyle={{
        padding: 0, // 🔥 IMPORTANT
        overflow: "visible",
      }}
    >
      {/* <div
        style={{
          border: "1px solid #000",
          padding: 12,
          fontSize: 12,
          fontFamily: "Arial",
          color: "#000",
        }}
      > */}

      {/* <div style={{ position: "relative", paddingTop: 48 }}> */}
      {/* FLOATING ACTIONS – TOP RIGHT */}
      {/* <div style={{ position: "absolute", top: 8, right: 12 }}> */}
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid #ddd",
          textAlign: "right",
          gap: 8,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="primary" size="small" onClick={downloadPayslipPDF}>
          Download PDF
        </Button>
        <Button type="primary" size="small" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      {/* 🔹 PDF CONTENT ONLY */}
      <div
        ref={payslipRef}
        style={{
          lineHeight: "1.8", // 🔥 increase
          fontSize: 12,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid #000",
            padding: 12,
            fontSize: 12,
            fontFamily: "Arial",
            color: "#000",
          }}
        >
          {company && (
            <div
              style={{
                borderBottom: "1px solid #000",
                paddingBottom: 10,
                marginBottom: 14,
              }}
            >
              {/* HEADER ROW */}
              <Row justify="space-between" align="middle">
                {/* LEFT : LOGO + NAME */}
                <Row
                  align="middle"
                  gutter={16}
                  style={{
                    maxWidth: "70%",
                    flexWrap: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {/* LOGO BOX */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={company.logo}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  {/* COMPANY INFO */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 25,
                        lineHeight: "1.1",
                        marginTop: 20,
                      }}
                    >
                      {company.name}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#444",
                        marginTop: 4,
                        lineHeight: "1.5",
                      }}
                    >
                      {formatCompanyAddress(company).map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>
                </Row>

                {/* RIGHT : DETAILS */}
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 13,
                    lineHeight: "1.6",
                    marginTop: 20,
                  }}
                >
                  {company.cin && <div>🏢 CIN: {company.cin}</div>}

                  {company.gst && <div>🧾 GST: {company.gst}</div>}
                  {company.phone && <div>📞 {company.phone}</div>}

                  {company.email && <div>✉️ {company.email}</div>}
                </div>
              </Row>

              {/* PAYSLIP MONTH */}
              <div
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 0.5,
                }}
              >
                Payslip for the Month of {formatMonthYear(fromDate)}
              </div>
            </div>
          )}

          <div
            style={{
              padding: "6px 0",
              fontSize: 12,
            }}
          >
            <Row gutter={24} style={{ lineHeight: "1.8" }}>
              {/* LEFT COLUMN */}
              <Col span={12}>
                <div style={{ marginBottom: 4 }}>
                  <b>Employee Name</b> : {employee.employeeName}
                </div>
                <div>
                  <b>Employee ID</b> : {employee.employeeId}
                </div>
                <div>
                  <b>Department</b> : {employee.department}
                </div>
                <div>
                  <b>Designation</b> : {employee.designation}
                </div>
                <div>
                  <b>DOJ</b> : {employee.doj}
                </div>
                <div>
                  <b>Grade</b> : {employee.grade}
                </div>
                <div>
                  <b>Location</b> : {employee.location}
                </div>
              </Col>

              {/* RIGHT COLUMN */}
              <Col span={12}>
                <div>
                  <b>Period</b> : {fromDate} to {toDate}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <b>PAN</b> : {employee.pan}
                </div>
                <div>
                  <b>PF No</b> : {employee.pfNo}
                </div>
                <div>
                  <b>ESI No</b> : {employee.esiNo}
                </div>
                <div>
                  <b>Bank Name</b> : {employee.bankName}
                </div>
                <div>
                  <b>Account No</b> : {employee.accountNo}
                </div>
              </Col>
            </Row>
          </div>

          {attendance && (
            <div
              style={{
                border: "1px solid #000",
                marginTop: 10,
                fontSize: 12,
              }}
            >
              {/* TITLE */}
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: "1px solid #000",
                  padding: "4px 8px",
                  fontSize: 14,
                }}
              >
                Attendance Summary
              </div>

              {/* TWO COLUMN TABLE */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {(() => {
                    const attendanceEntries = Object.entries(
                      ATTENDANCE_LABELS,
                    ).map(([key, label]) => ({
                      leftLabel: label,
                      leftValue: (attendance as any)[key] ?? "",
                    }));

                    const leaveEntries = [
                      ...(attendance.leaves
                        ? Object.entries(attendance.leaves).map(
                          ([key, value]) => ({
                            rightLabel:
                              LEAVE_LABELS[key] ?? key.toUpperCase(),
                            rightValue: value,
                          }),
                        )
                        : []),

                      // 👉 ADD LOP DAYS HERE (RIGHT SIDE)
                      ...(attendance.lopDays !== undefined
                        ? [
                          {
                            rightLabel: "LOP Days",
                            rightValue: attendance.lopDays,
                          },
                        ]
                        : []),
                    ];

                    const maxRows = Math.max(
                      attendanceEntries.length,
                      leaveEntries.length,
                    );

                    return Array.from({ length: maxRows }).map((_, i) => (
                      <tr key={i}>
                        {/* LEFT : ATTENDANCE */}
                        <td style={{ padding: "6px 8px", lineHeight: "1.8" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{attendanceEntries[i]?.leftLabel ?? ""}</span>
                            <span>{attendanceEntries[i]?.leftValue ?? ""}</span>
                          </div>
                        </td>

                        {/* RIGHT : LEAVES */}
                        <td style={{ padding: "6px 8px", lineHeight: "1.8" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{leaveEntries[i]?.rightLabel ?? ""}</span>
                            <span>{leaveEntries[i]?.rightValue ?? ""}</span>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>

              {/* OVERTIME */}
              {/* {attendance.overtime && (
                <div
                  style={{
                    borderTop: "1px solid #000",
                    padding: "4px 8px",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Overtime</span>
                  <span>
                    {attendance.overtime.hours} {attendance.overtime.unit}
                  </span>
                </div>
              )} */}
            </div>
          )}

          {/* <div
          style={{
            textAlign: "center",
            borderBottom: "1px solid #000",
            padding: "6px 0",
            fontWeight: 700,
          }}
        >
          {staticSalary.name}
        </div> */}

          <Row
            style={{
              border: "1px solid #000",
              marginTop: 10,
              borderBottom: "1px solid #000",
            }}
          >
            {/* EARNINGS */}
            <Col
              span={12}
              style={{
                borderRight: "1px solid #000",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* HEADER (FULL WIDTH LINE) */}
              <Row
                style={{
                  fontWeight: 700,
                  borderBottom: "1px solid #000",
                  padding: "4px 8px",
                }}
              >
                <Col span={10}>Earnings</Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  Amount
                </Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  YTD
                </Col>
              </Row>

              {/* BODY */}
              <div style={{ minHeight: 90, padding: "2px 8px" }}>
                {earningAmounts.map((e: any) => (
                  <Row key={e.id} style={{ lineHeight: "1.8" }}>
                    <Col span={10}>{e.name}</Col>
                    <Col span={7} style={{ textAlign: "right" }}>
                      ₹ {e.amount}
                    </Col>
                    <Col span={7} style={{ textAlign: "right" }}>
                      ₹ {e.ytd ?? 0}
                    </Col>
                  </Row>
                ))}
              </div>

              {/* TOTAL (FULL WIDTH LINE) */}
              <Row
                style={{
                  borderTop: "1px solid #000",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "10px 12px",
                }}
              >
                <Col span={10}>Gross Earnings</Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  ₹ {totalEarnings}
                </Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  ₹ {totalEarningsYTD}
                </Col>
              </Row>
            </Col>
            {/* DEDUCTIONS */}
            <Col
              span={12}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* HEADER */}
              <Row
                style={{
                  fontWeight: 700,
                  borderBottom: "1px solid #000",
                  padding: "4px 8px",
                }}
              >
                <Col span={10}>Deductions</Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  Amount
                </Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  YTD
                </Col>
              </Row>

              {/* BODY */}
              <div style={{ minHeight: 90, padding: "2px 8px" }}>
                {deductionAmounts.map((d: any) => (
                  <Row key={d.id} style={{ lineHeight: "1.8" }}>
                    <Col span={10}>{d.name}</Col>
                    <Col span={7} style={{ textAlign: "right" }}>
                      ₹ {d.amount}
                    </Col>
                    <Col span={7} style={{ textAlign: "right" }}>
                      ₹ {d.ytd ?? 0}
                    </Col>
                  </Row>
                ))}
              </div>

              {/* TOTAL */}
              <Row
                style={{
                  borderTop: "1px solid #000",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "10px 12px",
                }}
              >
                <Col span={10}>Gross Deductions</Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  ₹ {totalDeductions}
                </Col>
                <Col span={7} style={{ textAlign: "right" }}>
                  ₹ {totalDeductionsYTD}
                </Col>
              </Row>
            </Col>
          </Row>

          <Row
            style={{
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 12px",
              border: "1px solid #000",
              borderTop: "none", // connect to above box
              marginTop: -1, // avoid double border gap
            }}
          >
            <Col span={8} style={{ textAlign: "center" }}>
              Net Home Pay : ₹ {netPay}
            </Col>
          </Row>

          {/* <Row
  style={{
    border: "1px solid #000",
    borderTop: "none", // connect to above box
    marginTop: -1,     // avoid double border gap
  }}
>
  <Col
    span={24}
    style={{
      textAlign: "center",
      fontWeight: 700,
      fontSize: 14,
      padding: "12px 0",
    }}
  >
    Net Pay : ₹ {netPay}
  </Col>
</Row> */}

          {/* {reimbursements?.reimbursements && (
            <div
              style={{
                // border: "1px solid #000",
                // marginTop: 10,
                // padding: "6px 8px",
                // fontSize: 12,
                border: "1px solid #000",
      marginTop: 10,
      fontSize: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: "1px solid #000",
                  paddingBottom: 4,
                  marginBottom: 6,
                }}
                
              >
                Reimbursements
              </div>

              {Object.entries(reimbursements.reimbursements).map(
                ([key, value]) => (
                  <Row key={key} justify="space-between">
                    <span>
                      {REIMBURSEMENT_LABELS[key] ??
                        key.replace(/_/g, " ").toLowerCase()}
                    </span>

                    <span>₹ {value.amount}</span>
                  </Row>
                ),
              )}

              <Row
                justify="space-between"
                style={{
                  borderTop: "1px solid #000",
                  marginTop: 6,
                  paddingTop: 4,
                  fontWeight: 700,
                }}
              >
                <span>Total Reimbursements</span>
                <span>₹ {reimbursements.total}</span>
              </Row>
            </div>
          )} */}

          {reimbursements?.reimbursements && (
            <Row
              style={{
                border: "1px solid #000",
                marginTop: 10,
              }}
            >
              <Col
                span={24}
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* HEADER */}
                <Row
                  style={{
                    fontWeight: 700,
                    borderBottom: "1px solid #000",
                    padding: "4px 8px",
                  }}
                >
                  <Col span={16}>Reimbursements</Col>
                  <Col span={8} style={{ textAlign: "right" }}>
                    Amount
                  </Col>
                </Row>

                {/* BODY */}
                <div style={{ minHeight: 60, padding: "2px 8px" }}>
                  {Object.entries(reimbursements.reimbursements).map(
                    ([key, value]) => (
                      <Row key={key} style={{ lineHeight: "1.8" }}>
                        <Col span={16}>
                          {REIMBURSEMENT_LABELS[key] ??
                            key.replace(/_/g, " ").toLowerCase()}
                        </Col>
                        <Col span={8} style={{ textAlign: "right" }}>
                          ₹ {value.amount}
                        </Col>
                      </Row>
                    ),
                  )}
                </div>

                {/* TOTAL */}
                {/* HORIZONTAL LINE – little gap */}
                <div
                  style={{
                    height: 1,
                    backgroundColor: "#000",
                    width: "100%",
                    marginTop: 10, // 👈 line konjam keezha varum
                  }}
                />

                <Row
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "10px 12px",
                  }}
                >
                  <Col span={16}>Total Reimbursements</Col>
                  <Col span={8} style={{ textAlign: "right" }}>
                    ₹ {reimbursements.total}
                  </Col>
                </Row>
              </Col>
            </Row>
          )}

          <b style={{ fontSize: 17, marginTop: 14, display: "block" }}>
            Net Transfer : ₹ {TotalnetPay}
          </b>
          {/* <div
  style={{
    marginTop: 4,
    fontSize: 12,
    fontStyle: "italic",
  }}
>
  In Words : {numberToWords(netPay)} Only
</div> */}

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              lineHeight: "1.8",
            }}
          >
            <span style={{ fontWeight: 600 }}>In Words :</span>{" "}
            {numberToWords(netPay)} Only
          </div>

          {/* <div
            style={{
              border: "1px solid #000",
              borderTop: "none",
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>Gross Salary : ₹ {staticSalary.grossSalary}</span>
            <span style={{ fontSize: 15 }}>Net Pay : ₹ {netPay}</span>
          </div> */}
        </div>
      </div>
    </Modal>
  );
};

export default PayslipModal;
