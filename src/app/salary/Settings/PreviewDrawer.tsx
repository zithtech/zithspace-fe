"use client";

import React, { useEffect, useState } from "react";
import {
  Drawer,
  Descriptions,
  Divider,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { PreviewType } from "@/types/salary";
import {
  calculateEarnings,
  calculateDeductionAmounts,
  calculateTotalDeductions,
  calculateTotalEarnings,
  calculateNetPay,
} from "@/utils/salaryCalculator";
import { FileTextOutlined, LockOutlined } from "@ant-design/icons";
import {
  fetchAttendance,
  fetchReimbursements,
} from "@/services/salarySettings.service";

import {
  AttendanceResponse,
  ATTENDANCE_LABELS,
  LEAVE_LABELS,
  ReimbursementResponse,
  REIMBURSEMENT_LABELS,
} from "@/types/salary";

const { Title, Text } = Typography;

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   type: PreviewType;
//   data: any;
// }

interface Props {
  open: boolean;
  onClose: () => void;
  data: {
    company?: any;
    payslip?: any;
    employee?: any;
    salary?: any;
  };
}

// type PreviewType = "company" | "payslip" | null;

export default function PreviewDrawer({ open, onClose, data }: Props) {
  /** -------------------------
   *  SALARY CALCULATIONS
   *  ------------------------- */

  const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);
  const [reimbursements, setReimbursements] =
    useState<ReimbursementResponse | null>(null);

  // if (!attendance) return null;

  useEffect(() => {
    fetchAttendance().then(setAttendance).catch(console.error);

    fetchReimbursements().then(setReimbursements).catch(console.error);
  }, []);

  let earningAmounts: any[] = [];
  let deductionAmounts: any[] = [];
  let netPay = 0;

  if (data.salary) {
    const structure = {
      grossSalary: data.salary.grossSalary,
      earnings: data.salary.earnings,
      deductions: data.salary.deductions,
      deductionsEnabled: data.salary.deductionsEnabled,
    };

    earningAmounts = calculateEarnings(structure);
    deductionAmounts = calculateDeductionAmounts(structure);
    netPay = calculateNetPay(structure);
  }

  return (
    //     <Drawer
    //       title="Preview"
    //       placement="right"
    //       width={520}
    //       open={open}
    //       onClose={onClose}
    //     >
    //       {/* COMPANY PREVIEW */}
    //       {data.company && (
    //         <>
    //           <Divider orientation="left">Company Details</Divider>

    //           <Descriptions column={1} bordered size="small">
    //             <Descriptions.Item label="Company Name">
    //               {data.company.name}
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Email">
    //               {data.company.email}
    //             </Descriptions.Item>
    //             <Descriptions.Item label="Phone">
    //               {data.company.phone}
    //             </Descriptions.Item>
    //           </Descriptions>
    //         </>
    //       )}

    //       {/* PAYSLIP PREVIEW */}
    //       {/* {data.payslip && (
    //   <>
    //     <Divider orientation="left">Payslip Details</Divider>

    //     <Descriptions column={2} bordered size="small">
    //       {data.payslip.fields.map((f: any) => (
    //         <Descriptions.Item key={f.id} label={f.label}>
    //           {f.type === "date"
    //             ? dayjs(f.value).format("DD MMM YYYY")
    //             : f.value}
    //         </Descriptions.Item>
    //       ))}
    //     </Descriptions>

    //     <div style={{ textAlign: "right", marginTop: 8 }}>
    //       <Text strong>
    //         Net Pay: ₹ {data.payslip.netPay}
    //       </Text>
    //     </div>
    //   </>
    // )} */}

    //       {data.payslip && data.payslip.fields?.length > 0 && (
    //         <>
    //           <Divider orientation="left">Payslip Details</Divider>

    //           <Descriptions column={2} bordered size="small">
    //             {data.payslip.fields.map((f: any) => (
    //               <Descriptions.Item key={f.id} label={f.label}>
    //                 {f.type === "date"
    //                   ? dayjs(f.value).format("DD MMM YYYY")
    //                   : f.value}
    //               </Descriptions.Item>
    //             ))}
    //           </Descriptions>
    //         </>
    //       )}

    //       {/* EMPLOYEE PREVIEW */}
    //       {data.employee && (
    //         <>
    //           <Divider orientation="left">Employee Details</Divider>

    //           <Descriptions column={1} bordered size="small">
    //             {data.employee.map((f: any) => (
    //               <Descriptions.Item key={f.key} label={f.label}>
    //                 {f.value}
    //               </Descriptions.Item>
    //             ))}
    //           </Descriptions>
    //         </>
    //       )}

    //       {/* SALARY STRUCTURE PREVIEW */}
    //       {/* {type === "salary" && data && (
    //         <>
    //           <div style={{ textAlign: "center", marginBottom: 16 }}>
    //             <Title level={5}>{data.name}</Title>
    //             <Text type="secondary">Salary Structure Preview</Text>
    //           </div>

    //           <Descriptions column={1} bordered size="small">
    //             <Descriptions.Item label="Gross Salary">
    //               ₹ {data.grossSalary}
    //             </Descriptions.Item>

    //             <Descriptions.Item label="Earnings">
    //               {data.earnings.map((e: any) => (
    //                 <div key={e.id}>
    //                   {e.name} – {e.percentage}%
    //                 </div>
    //               ))}
    //             </Descriptions.Item>

    //             {data.deductionsEnabled && (
    //               <Descriptions.Item label="Deductions">
    //                 {data.deductions.map((d: any) => (
    //                   <div key={d.id}>
    //                     {d.name} – {d.value}
    //                   </div>
    //                 ))}
    //               </Descriptions.Item>
    //             )}
    //           </Descriptions>

    //         </>
    //       )} */}

    //       {data.salary &&
    //         (() => {
    //           const structure = {
    //             grossSalary: data.salary.grossSalary,
    //             earnings: data.salary.earnings,
    //             deductions: data.salary.deductions,
    //             deductionsEnabled: data.salary.deductionsEnabled,
    //           };

    //           const earningAmounts = calculateEarnings(structure);
    //           const deductionAmounts = calculateDeductionAmounts(structure);
    //           const totalDeductions = calculateTotalDeductions(structure);
    //           const netPay = calculateNetPay(structure);

    //           return (
    //             <>
    //               <Divider orientation="left">Salary Structure</Divider>
    //               {/* HEADER */}
    //               <div
    //                 style={{
    //                   textAlign: "center",
    //                   marginBottom: 20,
    //                   padding: 12,
    //                   background: "#fafafa",
    //                   borderRadius: 8,
    //                   border: "1px solid #f0f0f0",
    //                 }}
    //               >
    //                 <Title level={5} style={{ marginBottom: 0 }}>
    //                   {data.salary.name}
    //                 </Title>
    //                 <Text type="secondary">Salary Structure Preview</Text>
    //               </div>

    //               {/* MAIN TABLE */}
    //               <Descriptions
    //                 column={1}
    //                 bordered
    //                 size="small"
    //                 labelStyle={{ width: 140, fontWeight: 500 }}
    //                 contentStyle={{ background: "#fff" }}
    //               >
    //                 <Descriptions.Item label="Gross Salary">
    //                   <Text strong style={{ fontSize: 15 }}>
    //                     ₹ {data.salary.grossSalary}
    //                   </Text>
    //                 </Descriptions.Item>

    //                 <Descriptions.Item label="Earnings">
    //                   {earningAmounts.map((e: any) => (
    //                     <div
    //                       key={e.id}
    //                       style={{
    //                         display: "flex",
    //                         justifyContent: "space-between",
    //                         padding: "4px 0",
    //                         borderBottom: "1px dashed #f0f0f0",
    //                       }}
    //                     >
    //                       <Text>{e.name}</Text>
    //                       <Text strong>₹ {e.amount}</Text>
    //                     </div>
    //                   ))}
    //                 </Descriptions.Item>

    //                 {data.salary.deductionsEnabled && (
    //                   <Descriptions.Item label="Deductions">
    //                     {deductionAmounts.map((d: any) => (
    //                       <div
    //                         key={d.id}
    //                         style={{
    //                           display: "flex",
    //                           justifyContent: "space-between",
    //                           padding: "4px 0",
    //                           borderBottom: "1px dashed #f0f0f0",
    //                         }}
    //                       >
    //                         <Text type="danger">{d.name}</Text>
    //                         <Text type="danger" strong>
    //                           ₹ {d.amount}
    //                         </Text>
    //                       </div>
    //                     ))}
    //                   </Descriptions.Item>
    //                 )}
    //               </Descriptions>

    //               <Divider style={{ margin: "16px 0" }} />

    //               {/* SUMMARY */}
    //               <div
    //                 style={{
    //                   textAlign: "right",
    //                   padding: 12,
    //                   background: "#f6ffed",
    //                   borderRadius: 8,
    //                   border: "1px solid #b7eb8f",
    //                 }}
    //               >
    //                 <Text type="secondary">Total Deductions</Text>
    //                 <Title level={5} style={{ margin: "4px 0" }}>
    //                   ₹ {totalDeductions}
    //                 </Title>

    //                 <Title
    //                   level={4}
    //                   style={{
    //                     marginTop: 8,
    //                     color: "#237804",
    //                     fontWeight: 600,
    //                   }}
    //                 >
    //                   Net Take-Home Pay: ₹ {netPay}
    //                 </Title>
    //               </div>
    //             </>
    //           );
    //         })()}
    //     </Drawer>

    <Drawer
      title={null}
      placement="right"
      width="70vw"
      open={open}
      onClose={onClose}
      bodyStyle={{
        background: "#f5f7fb",
        padding: 16,
      }}
      style={{
        maxWidth: "100vw",
      }}
    >
      {/* ================= COMPANY HEADER ================= */}
      {data.company && (
  <div>
    {/* TOP ROW */}
    <Row justify="space-between" align="middle">
      {/* LEFT : LOGO + COMPANY INFO */}
      <Row
        align="middle"
        wrap={false}
        style={{ maxWidth: "70%", minWidth: 0 }}
      >
        {/* LOGO */}
        <div style={{ marginRight: 12 }}>
          {data.company.logo && (
            <img
              src={data.company.logo}
              alt="logo"
              style={{
                maxWidth: 80,
                maxHeight: 80,
                objectFit: "contain",
              }}
            />
          )}
        </div>

        {/* NAME + ADDRESS */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>
            {data.company.name}
          </div>

          {/* ADDRESS – max 3 lines */}
          <div
            style={{
              fontSize: 12,
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxWidth: 460,
            }}
          >
            {data.company.address}
          </div>
        </div>
      </Row>

      {/* RIGHT : CIN + GST */}
      <div style={{ textAlign: "right" }}>
        <div>🏢 CIN: {data.company.cin}</div>
        <div>🧾 GST: {data.company.gst}</div>
        <div>✉️ {data.company.email}</div>
        <div> 📞 {data.company.phone}</div>
      </div>
    </Row>

    <Divider />
    

    {/* BOTTOM ROW */}
    {/* <Row justify="space-between">
     
      <div
        style={{
          maxWidth: "45%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={data.company.email}
      >
        ✉️ {data.company.email}
      </div>

      
      <div
        style={{
          maxWidth: "45%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "right",
        }}
        title={data.company.phone}
      >
        📞 {data.company.phone}
      </div>
    </Row> */}
  </div>
)}


      {/* ================= PAYSLIP DETAILS ================= */}
      {data.payslip && data.payslip.fields?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Divider orientation="left">Payslip Details</Divider>

          <Descriptions
            column={2}
            bordered
            size="small"
            labelStyle={{ fontWeight: 500, background: "transparent" }}
            contentStyle={{ background: "transparent" }}
            style={{ background: "transparent" }}
          >
            {data.payslip.fields.map((f: any) => (
              <Descriptions.Item key={f.id} label={f.label}>
                {f.type === "date"
                  ? dayjs(f.value).format("DD MMM YYYY")
                  : f.value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      )}

      {/* ================= EMPLOYEE DETAILS ================= */}
      {data.employee && (
        <div style={{ marginBottom: 16 }}>
          <Divider orientation="left">Employee Details</Divider>

          <Descriptions
            column={1}
            bordered
            size="small"
            style={{ background: "transparent" }}
            labelStyle={{
              background: "transparent",
              fontWeight: 500,
            }}
            contentStyle={{
              background: "transparent",
            }}
          >
            {data.employee.map((f: any) => (
              <Descriptions.Item
                key={f.key}
                label={f.key} // 👉 system name (name, id, department)
              >
                <div>
                  <Typography.Text strong>Display: {f.label}</Typography.Text>

                  {f.value && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary">
                        Value: {f.value}
                      </Typography.Text>
                    </div>
                  )}
                </div>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      )}

      {attendance && (
        <div style={{ marginBottom: 12 }}>
          <Divider orientation="left">Attendance Summary</Divider>

          <Row gutter={[6, 6]}>
            {/* BASIC ATTENDANCE */}
            {Object.entries(ATTENDANCE_LABELS).map(([key, label]) => (
              <Col key={key} flex="20%">
                <Card
                  size="small"
                  bordered
                  bodyStyle={{ padding: "4px 6px" }}
                  style={{
                    textAlign: "center",
                    background: "transparent",
                    borderRadius: 6,
                    borderColor: "#e5e7eb",
                    minHeight: 48,
                  }}
                >
                  <Title
                    level={5}
                    style={{ margin: 0, fontSize: 14, lineHeight: 1 }}
                  >
                    {(attendance as any)[key] ?? 0}
                  </Title>
                  <Text style={{ fontSize: 11, color: "#6b7280" }}>
                    {label}
                  </Text>
                </Card>
              </Col>
            ))}

            {/* LEAVES */}
            {attendance.leaves &&
              Object.entries(attendance.leaves).map(([key, value]) => (
                <Col key={key} flex="20%">
                  <Card
                    size="small"
                    bordered
                    bodyStyle={{ padding: "4px 6px" }}
                    style={{
                      textAlign: "center",
                      background: "transparent",
                      borderRadius: 6,
                      borderColor: "#e5e7eb",
                      minHeight: 48,
                    }}
                  >
                    <Title
                      level={5}
                      style={{ margin: 0, fontSize: 14, lineHeight: 1 }}
                    >
                      {value}
                    </Title>
                    <Text style={{ fontSize: 11, color: "#6b7280" }}>
                      {LEAVE_LABELS[key] ?? key.toUpperCase()}
                    </Text>
                  </Card>
                </Col>
              ))}

            {/* OVERTIME */}
            {attendance.overtime && (
              <Col flex="20%">
                <Card
                  size="small"
                  bordered
                  bodyStyle={{ padding: "4px 6px" }}
                  style={{
                    textAlign: "center",
                    background: "transparent",
                    borderRadius: 6,
                    borderColor: "#e5e7eb",
                    minHeight: 48,
                  }}
                >
                  <Title
                    level={5}
                    style={{ margin: 0, fontSize: 14, lineHeight: 1 }}
                  >
                    {attendance.overtime.hours} {attendance.overtime.unit}
                  </Title>
                  <Text style={{ fontSize: 11, color: "#6b7280" }}>
                    Overtime
                  </Text>
                </Card>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* ================= SALARY STRUCTURE ================= */}
      {data.salary &&
        (() => {
          const structure = {
            grossSalary: data.salary.grossSalary,
            earnings: data.salary.earnings,
            deductions: data.salary.deductions,
            deductionsEnabled: data.salary.deductionsEnabled,
          };

          const earningAmounts = calculateEarnings(structure);
          const deductionAmounts = calculateDeductionAmounts(structure);
          const totalDeductions = calculateTotalDeductions(structure);
          const totalEarnings = calculateTotalEarnings(structure);

          const netPay = calculateNetPay(structure);

          return (
            <>
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left">Salary Structure</Divider>

                {/* HEADER */}
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: 16,
                    padding: 12,
                    background: "#fafafa",
                    // borderRadius: 8,
                    // border: "1px solid #f0f0f0",
                  }}
                >
                  {/* <Title level={5} style={{ marginBottom: 0 }}>
                    {data.salary.name}
                  </Title> */}
                  <Text type="secondary">{data.salary.name}</Text>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text strong>Gross Salary</Text>
                  <Title level={5} style={{ margin: 0, color: "#047857" }}>
                    ₹ {data.salary.grossSalary}
                  </Title>
                </div>

                {/* MAIN TABLE */}
                <Row
                  gutter={16}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {/* EARNINGS */}
                  <Col
                    span={12}
                    style={{
                      borderRight: "1px solid #e5e7eb",
                      paddingRight: 12,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Text strong>Earnings</Text>
                    <Divider style={{ margin: "6px 0" }} />

                    {earningAmounts.map((e: any) => (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          borderBottom: "1px dashed #e5e7eb",
                        }}
                      >
                        <Text>{e.name}</Text>
                        <Text strong>₹ {e.amount}</Text>
                      </div>
                    ))}

                    {/* TOTAL EARNINGS */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        marginTop: "auto",
                        borderTop: "2px solid #e5e7eb",
                      }}
                    >
                      <Text strong>Total Earnings</Text>
                      <Text strong>₹ {totalEarnings}</Text>
                    </div>
                  </Col>

                  {/* DEDUCTIONS */}
                  <Col
                    span={12}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Text strong>Deductions</Text>
                    <Divider style={{ margin: "6px 0" }} />

                    {data.salary.deductionsEnabled &&
                      deductionAmounts.map((d: any) => (
                        <div
                          key={d.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px dashed #e5e7eb",
                          }}
                        >
                          <Text type="danger">{d.name}</Text>
                          <Text type="danger" strong>
                            ₹ {d.amount}
                          </Text>
                        </div>
                      ))}

                    {/* TOTAL DEDUCTIONS */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: 8,
                        marginTop: "auto",
                        borderTop: "2px solid #e5e7eb",
                      }}
                    >
                      <Text strong>Total Deductions</Text>
                      <Text strong type="danger">
                        ₹ {totalDeductions}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* SUMMARY */}
              <Card
                bordered={false}
                bodyStyle={{
                  padding: "6px 8px", // 🔥 reduce inner space
                }}
                style={{
                  marginTop: 4, // 🔥 reduce outer gap
                  textAlign: "right",
                }}
              >
                {/* <Text type="secondary">Total Deductions</Text>
                <Title level={5} style={{ margin: "4px 0" }}>
                  ₹ {totalDeductions}
                </Title> */}

                <Title
                  level={4}
                  style={{
                    marginTop: 6,
                    color: "#047857",
                    fontWeight: 600,
                  }}
                >
                  Net Take-Home Pay: ₹ {netPay}
                </Title>
              </Card>
            </>
          );
        })()}

      {reimbursements && (
        <div style={{ marginBottom: 16 }}>
          <Divider orientation="left">Reimbursements</Divider>

          <Row gutter={[6, 6]}>
            {Object.entries(reimbursements.reimbursements).map(
              ([key, value]) => (
                <Col key={key} span={6}>
                  <Card
                    size="small"
                    bordered
                    bodyStyle={{ padding: "4px 6px" }}
                    style={{
                      textAlign: "center",
                      background: "transparent", // ❌ no fill
                      borderRadius: 6,
                      minHeight: 56,
                      borderColor: "#e5e7eb", // ✅ light border
                      boxShadow: "none",
                    }}
                  >
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1,
                        color: "#111827",
                      }}
                    >
                      ₹ {value.amount}
                    </Title>

                    <Text
                      style={{
                        fontSize: 11,
                        color: "#065f46",
                      }}
                    >
                      {REIMBURSEMENT_LABELS[key]}
                    </Text>

                    {/* <div style={{ marginTop: 2 }}>
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#065f46",
                        }}
                      >
                        YTD: ₹ {value.ytd}
                      </Text>
                    </div> */}
                  </Card>
                </Col>
              ),
            )}
          </Row>
          <Divider style={{ margin: "12px 0" }} />

          <Row justify="space-between">
            <Text strong>Total Reimbursements</Text>
            <Text strong style={{ color: "#047857" }}>
              ₹ {reimbursements.total}
            </Text>
          </Row>
        </div>
      )}

      {/* ================= STATIC FOOTER NOTE ================= */}
      <Card
        bordered={false}
        style={{
          marginTop: 20,
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* FILE ICON NOTE */}
        <Row align="top" gutter={12} style={{ marginBottom: 10 }}>
          <Col>
            <FileTextOutlined style={{ fontSize: 18, color: "#2563eb" }} />
          </Col>
          <Col flex="auto">
            <Text style={{ color: "#374151", fontSize: 13 }}>
              This is a <strong>system-generated payslip</strong> and does not
              require a signature. In case of any discrepancies, please contact
              the HR/Payroll department within <strong>7 days</strong> of
              receiving this payslip.
            </Text>
          </Col>
        </Row>

        {/* LOCK ICON NOTE */}
        <Row align="top" gutter={12}>
          <Col>
            <LockOutlined style={{ fontSize: 18, color: "#6b7280" }} />
          </Col>
          <Col flex="auto">
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              <strong>Confidential</strong> – For employee use only.
            </Text>
          </Col>
        </Row>
      </Card>
    </Drawer>
  );
}
