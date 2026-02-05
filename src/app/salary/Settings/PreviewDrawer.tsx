// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Drawer,
//   Descriptions,
//   Divider,
//   Row,
//   Col,
//   Card,
//   Typography,
// } from "antd";
// import dayjs from "dayjs";
// import { PreviewType } from "@/types/salary";
// import {
//   calculateEarnings,
//   calculateDeductionAmounts,
//   calculateTotalDeductions,
//   calculateTotalEarnings,
//   calculateNetPay,
// } from "@/utils/salaryCalculator";
// import { FileTextOutlined, LockOutlined } from "@ant-design/icons";
// import {
//   fetchAttendance,
//   fetchReimbursements,
// } from "@/services/salarySettings.service";

// import {
//   AttendanceResponse,
//   ATTENDANCE_LABELS,
//   LEAVE_LABELS,
//   ReimbursementResponse,
//   REIMBURSEMENT_LABELS,
// } from "@/types/salary";

// const { Title, Text } = Typography;

// // interface Props {
// //   open: boolean;
// //   onClose: () => void;
// //   type: PreviewType;
// //   data: any;
// // }

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   data: {
//     company?: any;
//     payslip?: any;
//     employee?: any;
//     salary?: any;
//   };
// }

// // type PreviewType = "company" | "payslip" | null;

// export default function PreviewDrawer({ open, onClose, data }: Props) {
//   /** -------------------------
//    *  SALARY CALCULATIONS
//    *  ------------------------- */

//   const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);
//   const [reimbursements, setReimbursements] =
//     useState<ReimbursementResponse | null>(null);

//   // if (!attendance) return null;

//   useEffect(() => {
//     fetchAttendance().then(setAttendance).catch(console.error);

//     fetchReimbursements().then(setReimbursements).catch(console.error);
//   }, []);

//   let earningAmounts: any[] = [];
//   let deductionAmounts: any[] = [];
//   let netPay = 0;

//   if (data.salary) {
//     const structure = {
//       grossSalary: data.salary.grossSalary,
//       earnings: data.salary.earnings,
//       deductions: data.salary.deductions,
//       deductionsEnabled: data.salary.deductionsEnabled,
//     };

//     earningAmounts = calculateEarnings(structure);
//     deductionAmounts = calculateDeductionAmounts(structure);
//     netPay = calculateNetPay(structure);
//   }

//   return (

//     <Drawer
//       title={null}
//       placement="right"
//       width="70vw"
//       open={open}
//       onClose={onClose}
//       bodyStyle={{
//         background: "#f5f7fb",
//         padding: 16,
//       }}
//       style={{
//         maxWidth: "100vw",
//       }}
//     >
//       {/* ================= COMPANY HEADER ================= */}
//       {data.company && (
//   <div>
//     {/* TOP ROW */}
//     <Row justify="space-between" align="middle">
//       {/* LEFT : LOGO + COMPANY INFO */}
//       <Row
//         align="middle"
//         wrap={false}
//         style={{ maxWidth: "70%", minWidth: 0 }}
//       >
//         {/* LOGO */}
//         <div style={{ marginRight: 12 }}>
//           {data.company.logo && (
//             <img
//               src={data.company.logo}
//               alt="logo"
//               style={{
//                 maxWidth: 80,
//                 maxHeight: 80,
//                 objectFit: "contain",
//               }}
//             />
//           )}
//         </div>

//         {/* NAME + ADDRESS */}
//         <div style={{ minWidth: 0 }}>
//           <div style={{ fontWeight: 700 }}>
//             {data.company.name}
//           </div>

//           {/* ADDRESS – max 3 lines */}
//           <div
//             style={{
//               fontSize: 12,
//               lineHeight: "1.4",
//               display: "-webkit-box",
//               WebkitLineClamp: 3,
//               WebkitBoxOrient: "vertical",
//               overflow: "hidden",
//               maxWidth: 460,
//             }}
//           >
//             {data.company.address}
//           </div>
//         </div>
//       </Row>

//       {/* RIGHT : CIN + GST */}
//       <div style={{ textAlign: "right" }}>
//         <div>🏢 CIN: {data.company.cin}</div>
//         <div>🧾 GST: {data.company.gst}</div>
//         <div>✉️ {data.company.email}</div>
//         <div> 📞 {data.company.phone}</div>
//       </div>
//     </Row>

//     <Divider />

//     {/* BOTTOM ROW */}
//     {/* <Row justify="space-between">

//       <div
//         style={{
//           maxWidth: "45%",
//           whiteSpace: "nowrap",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//         }}
//         title={data.company.email}
//       >
//         ✉️ {data.company.email}
//       </div>

//       <div
//         style={{
//           maxWidth: "45%",
//           whiteSpace: "nowrap",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//           textAlign: "right",
//         }}
//         title={data.company.phone}
//       >
//         📞 {data.company.phone}
//       </div>
//     </Row> */}
//   </div>
// )}

//       {/* ================= PAYSLIP DETAILS ================= */}
//       {data.payslip && data.payslip.fields?.length > 0 && (
//         <div style={{ marginBottom: 16 }}>
//           <Divider orientation="left">Payslip Details</Divider>

//           <Descriptions
//             column={2}
//             bordered
//             size="small"
//             labelStyle={{ fontWeight: 500, background: "transparent" }}
//             contentStyle={{ background: "transparent" }}
//             style={{ background: "transparent" }}
//           >
//             {data.payslip.fields.map((f: any) => (
//               <Descriptions.Item key={f.id} label={f.label}>
//                 {f.type === "date"
//                   ? dayjs(f.value).format("DD MMM YYYY")
//                   : f.value}
//               </Descriptions.Item>
//             ))}
//           </Descriptions>
//         </div>
//       )}

//       {/* ================= EMPLOYEE DETAILS ================= */}
//       {data.employee && (
//         <div style={{ marginBottom: 16 }}>
//           <Divider orientation="left">Employee Details</Divider>

// <Descriptions
//   column={1}
//   bordered
//   size="small"
//   style={{ background: "transparent" }}
//   labelStyle={{
//     background: "transparent",
//     fontWeight: 500,
//   }}
//   contentStyle={{
//     background: "transparent",
//   }}
// >
//   {data.employee.map((f: any) => (
//     <Descriptions.Item
//       key={f.key}
//       label={f.key} // 👉 system name (name, id, department)
//     >
//       <div>
//         <Typography.Text strong>Display: {f.label}</Typography.Text>

//         {f.value && (
//           <div style={{ marginTop: 4 }}>
//             <Typography.Text type="secondary">
//               Value: {f.value}
//             </Typography.Text>
//           </div>
//         )}
//       </div>
//     </Descriptions.Item>
//   ))}
// </Descriptions>
//   </div>
// )}

//       {/* ================= SALARY STRUCTURE ================= */}
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
//           const totalEarnings = calculateTotalEarnings(structure);

//           const netPay = calculateNetPay(structure);

//           return (
//             <>
//               <div style={{ marginBottom: 16 }}>
//                 <Divider orientation="left">Salary Structure</Divider>

//                 {/* HEADER */}
//                 <div
//                   style={{
//                     textAlign: "center",
//                     marginBottom: 16,
//                     padding: 12,
//                     background: "#fafafa",
//                     // borderRadius: 8,
//                     // border: "1px solid #f0f0f0",
//                   }}
//                 >
//                   {/* <Title level={5} style={{ marginBottom: 0 }}>
//                     {data.salary.name}
//                   </Title> */}
//                   <Text type="secondary">{data.salary.name}</Text>
//                 </div>

//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                   }}
//                 >
//                   <Text strong>Gross Salary</Text>
//                   <Title level={5} style={{ margin: 0, color: "#047857" }}>
//                     ₹ {data.salary.grossSalary}
//                   </Title>
//                 </div>

//                 {/* MAIN TABLE */}
//                 <Row
//                   gutter={16}
//                   style={{
//                     border: "1px solid #ccc",
//                     borderRadius: 8,
//                     padding: 12,
//                   }}
//                 >
//                   {/* EARNINGS */}
//                   <Col
//                     span={12}
//                     style={{
//                       borderRight: "1px solid #e5e7eb",
//                       paddingRight: 12,
//                       display: "flex",
//                       flexDirection: "column",
//                     }}
//                   >
//                     <Text strong>Earnings</Text>
//                     <Divider style={{ margin: "6px 0" }} />

//                     {earningAmounts.map((e: any) => (
//                       <div
//                         key={e.id}
//                         style={{
//                           display: "flex",
//                           justifyContent: "space-between",
//                           padding: "6px 0",
//                           borderBottom: "1px dashed #e5e7eb",
//                         }}
//                       >
//                         <Text>{e.name}</Text>
//                         <Text strong>₹ {e.amount}</Text>
//                       </div>
//                     ))}

//                     {/* TOTAL EARNINGS */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         paddingTop: 8,
//                         marginTop: "auto",
//                         borderTop: "2px solid #e5e7eb",
//                       }}
//                     >
//                       <Text strong>Total Earnings</Text>
//                       <Text strong>₹ {totalEarnings}</Text>
//                     </div>
//                   </Col>

//                   {/* DEDUCTIONS */}
//                   <Col
//                     span={12}
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                     }}
//                   >
//                     <Text strong>Deductions</Text>
//                     <Divider style={{ margin: "6px 0" }} />

//                     {data.salary.deductionsEnabled &&
//                       deductionAmounts.map((d: any) => (
//                         <div
//                           key={d.id}
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             padding: "6px 0",
//                             borderBottom: "1px dashed #e5e7eb",
//                           }}
//                         >
//                           <Text type="danger">{d.name}</Text>
//                           <Text type="danger" strong>
//                             ₹ {d.amount}
//                           </Text>
//                         </div>
//                       ))}

//                     {/* TOTAL DEDUCTIONS */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         paddingTop: 8,
//                         marginTop: "auto",
//                         borderTop: "2px solid #e5e7eb",
//                       }}
//                     >
//                       <Text strong>Total Deductions</Text>
//                       <Text strong type="danger">
//                         ₹ {totalDeductions}
//                       </Text>
//                     </div>
//                   </Col>
//                 </Row>
//               </div>

//               {/* SUMMARY */}
//               <Card
//                 bordered={false}
//                 bodyStyle={{
//                   padding: "6px 8px", // 🔥 reduce inner space
//                 }}
//                 style={{
//                   marginTop: 4, // 🔥 reduce outer gap
//                   textAlign: "right",
//                 }}
//               >
//                 {/* <Text type="secondary">Total Deductions</Text>
//                 <Title level={5} style={{ margin: "4px 0" }}>
//                   ₹ {totalDeductions}
//                 </Title> */}

//                 <Title
//                   level={4}
//                   style={{
//                     marginTop: 6,
//                     color: "#047857",
//                     fontWeight: 600,
//                   }}
//                 >
//                   Net Take-Home Pay: ₹ {netPay}
//                 </Title>
//               </Card>
//             </>
//           );
//         })()}

//       {/* {reimbursements && (
//         <div style={{ marginBottom: 16 }}>
//           <Divider orientation="left">Reimbursements</Divider>

//           <Row gutter={[6, 6]}>
//             {Object.entries(reimbursements.reimbursements).map(
//               ([key, value]) => (
//                 <Col key={key} span={6}>
//                   <Card
//                     size="small"
//                     bordered
//                     bodyStyle={{ padding: "4px 6px" }}
//                     style={{
//                       textAlign: "center",
//                       background: "transparent", // ❌ no fill
//                       borderRadius: 6,
//                       minHeight: 56,
//                       borderColor: "#e5e7eb", // ✅ light border
//                       boxShadow: "none",
//                     }}
//                   >
//                     <Title
//                       level={5}
//                       style={{
//                         margin: 0,
//                         fontSize: 14,
//                         lineHeight: 1,
//                         color: "#111827",
//                       }}
//                     >
//                       ₹ {value.amount}
//                     </Title>

//                     <Text
//                       style={{
//                         fontSize: 11,
//                         color: "#065f46",
//                       }}
//                     >
//                       {REIMBURSEMENT_LABELS[key]}
//                     </Text>

//                   </Card>
//                 </Col>
//               ),
//             )}
//           </Row>
//           <Divider style={{ margin: "12px 0" }} />

//           <Row justify="space-between">
//             <Text strong>Total Reimbursements</Text>
//             <Text strong style={{ color: "#047857" }}>
//               ₹ {reimbursements.total}
//             </Text>
//           </Row>
//         </div>
//       )} */}

//       {/* ================= STATIC FOOTER NOTE ================= */}
//       <Card
//         bordered={false}
//         style={{
//           marginTop: 20,
//           borderRadius: 12,
//           background: "#f9fafb",
//           border: "1px solid #e5e7eb",
//         }}
//       >
//         {/* FILE ICON NOTE */}
//         <Row align="top" gutter={12} style={{ marginBottom: 10 }}>
//           <Col>
//             <FileTextOutlined style={{ fontSize: 18, color: "#2563eb" }} />
//           </Col>
//           <Col flex="auto">
//             <Text style={{ color: "#374151", fontSize: 13 }}>
//               This is a <strong>system-generated payslip</strong> and does not
//               require a signature. In case of any discrepancies, please contact
//               the HR/Payroll department within <strong>7 days</strong> of
//               receiving this payslip.
//             </Text>
//           </Col>
//         </Row>

//         {/* LOCK ICON NOTE */}
//         <Row align="top" gutter={12}>
//           <Col>
//             <LockOutlined style={{ fontSize: 18, color: "#6b7280" }} />
//           </Col>
//           <Col flex="auto">
//             <Text style={{ color: "#6b7280", fontSize: 13 }}>
//               <strong>Confidential</strong> – For employee use only.
//             </Text>
//           </Col>
//         </Row>
//       </Card>
//     </Drawer>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import {
  Drawer,
  Divider,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Descriptions,
} from "antd";
import dayjs from "dayjs";
import {
  FileTextOutlined,
  LockOutlined,
  UserOutlined,
  BankOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import {
  fetchAttendance,
  fetchReimbursements,
} from "@/services/salarySettings.service";
import {
  calculateEarnings,
  calculateDeductionAmounts,
  calculateTotalDeductions,
  calculateTotalEarnings,
  calculateNetPay,
} from "@/utils/salaryCalculator";

const { Title, Text } = Typography;

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

export default function PreviewDrawer({ open, onClose, data }: Props) {
  const [attendance, setAttendance] = useState<any>(null);
  const [reimbursements, setReimbursements] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchAttendance().then(setAttendance).catch(console.error);
      fetchReimbursements().then(setReimbursements).catch(console.error);
    }
  }, [open]);

  const getSalaryData = () => {
    if (!data.salary) return null;

    const structure = {
      grossSalary: data.salary.grossSalary,
      earnings: data.salary.earnings,
      deductions: data.salary.deductions,
      deductionsEnabled: data.salary.deductionsEnabled,
    };

    return {
      earnings: calculateEarnings(structure),
      deductions: calculateDeductionAmounts(structure),
      totalEarnings: calculateTotalEarnings(structure),
      totalDeductions: calculateTotalDeductions(structure),
      netPay: calculateNetPay(structure),
    };
  };

  const salaryData = getSalaryData();

  return (
    <Drawer
      title={
        <Space align="center" size="small">
          <div className="preview-icon">
            <FileTextOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>
              Payslip Settings Preview
            </Text>
            <div style={{ fontSize: 11, marginTop: -2 }}>
              <Text type="secondary">
                Generated: {dayjs().format("DD MMM YYYY, hh:mm A")}
              </Text>
            </div>
          </div>
        </Space>
      }
      placement="right"
      width={640}
      open={open}
      onClose={onClose}
      closable={true}
      className="preview-drawer"
      styles={{
        body: {
          background: "#fafafa",
          padding: 0,
        },
        header: {
          borderBottom: "1px solid #e8e8e8",
          padding: "12px 20px",
        },
      }}
    >
      <div className="preview-container">
        {/* COMPANY HEADER - Compact */}
        {data.company && (
          <Card
            className="preview-card company-card"
            bodyStyle={{ padding: "12px 16px" }}
          >
            <div className="company-header">
              {data.company.logo && (
                <div className="company-logo">
                  <img src={data.company.logo} alt="Company Logo" />
                </div>
              )}
              <div className="company-info">
                <Title level={5} className="company-name" style={{ margin: 0 }}>
                  {data.company.name}
                </Title>
                {data.company.address && (
                  <Text type="secondary" className="company-address">
                    {data.company.address}
                  </Text>
                )}
                <div className="company-meta">
                  {data.company.cin && (
                    <span className="company-meta-item">
                      <Text type="secondary">CIN:</Text>
                      <Text strong> {data.company.cin}</Text>
                    </span>
                  )}
                  {data.company.gst && (
                    <span className="company-meta-item">
                      <Text type="secondary">GST:</Text>
                      <Text strong> {data.company.gst}</Text>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* PAYSLIP META INFO - Compact */}
        {data.payslip && data.payslip.fields?.length > 0 && (
          <Card className="preview-card" bodyStyle={{ padding: "12px 16px" }}>
            <div className="section-header">
              <BankOutlined style={{ fontSize: 14 }} />
              <Text strong style={{ fontSize: 14 }}>
                Payslip Details
              </Text>
            </div>
            <Row gutter={[12, 8]}>
              {data.payslip.fields.map((f: any) => (
                <Col span={12} key={f.id}>
                  <div className="detail-item">
                    <Text type="secondary" className="detail-label">
                      {f.label}
                    </Text>
                    <Text strong className="detail-value">
                      {f.type === "date"
                        ? dayjs(f.value).format("DD/MM/YYYY")
                        : f.value}
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* EMPLOYEE DETAILS - Compact */}
        {data.employee && (
          // <Card
          //   className="preview-card"
          //   bodyStyle={{ padding: '12px 16px' }}
          // >
          //   <div className="section-header">
          //     <UserOutlined style={{ fontSize: 14 }} />
          //     <Text strong style={{ fontSize: 14 }}>Employee Details</Text>
          //   </div>
          //   <Row gutter={[12, 8]}>
          //     {/* {data.employee.map((f: any) => (
          //       <Col span={12} key={f.key}>
          //         <div className="detail-item bordered">
          //           <Text type="secondary" className="detail-label">
          //             {f.label}
          //           </Text>
          //           <Text strong className="detail-value">
          //             {f.value}
          //           </Text>
          //         </div>

          //       </Col>
          //     ))} */}

          //     {data.employee.map((f: any) => (
          //     <Descriptions.Item
          //       key={f.key}
          //       label={f.key} // 👉 system name (name, id, department)
          //     >
          //       <div>
          //         <Typography.Text strong>Display: {f.label}</Typography.Text>

          //         {f.value && (
          //           <div style={{ marginTop: 4 }}>
          //             <Typography.Text type="secondary">
          //               Value: {f.value}
          //             </Typography.Text>
          //           </div>
          //         )}
          //       </div>
          //     </Descriptions.Item>
          //   ))}
          //   </Row>
          // </Card>

          <Card className="preview-card" bodyStyle={{ padding: "12px 16px" }}>
            <div className="section-header">
              <UserOutlined style={{ fontSize: 14 }} />
              <Text strong style={{ fontSize: 14 }}>
                Employee Details
              </Text>
            </div>

            <Row gutter={[12, 8]}>
              <Col span={24}>
                <Descriptions
                  column={1}
                  bordered
                  size="small"
                  style={{ background: "transparent" }}
                  labelStyle={{ background: "transparent", fontWeight: 500 }}
                  contentStyle={{ background: "transparent" }}
                >
                  {data.employee.map((f: any) => (
                    <Descriptions.Item key={f.key} label={f.key}>
                      <div>
                        <Typography.Text strong>
                          Display: {f.label}
                        </Typography.Text>

                        {/* {f.value && (
                <div style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary">
                    Value: {f.value}
                  </Typography.Text>
                </div>
              )} */}
                      </div>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Col>
            </Row>
          </Card>
        )}

        {/* SALARY BREAKDOWN - Compact */}
        {data.salary && salaryData && (
          <Card className="preview-card" bodyStyle={{ padding: "12px 16px" }}>
            <div className="section-header">
              <CalculatorOutlined style={{ fontSize: 14 }} />
              <Text strong style={{ fontSize: 14 }}>
                {data.salary.name}
              </Text>
            </div>

            {/* GROSS SALARY - Compact */}
            <div className="gross-salary-display">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Gross Salary
              </Text>
              <Title
                level={4}
                className="gross-amount"
                style={{ margin: "4px 0 0 0" }}
              >
                ₹ {data.salary.grossSalary.toLocaleString()}
              </Title>
            </div>

            {/* EARNINGS & DEDUCTIONS - Compact */}
            <Row gutter={16} style={{ marginTop: 12 }}>
              {/* EARNINGS */}
              <Col span={12}>
                <div className="earnings-card">
                  <div className="card-header earnings">
                    <Text strong style={{ fontSize: 13 }}>
                      Earnings
                    </Text>
                  </div>
                  <div className="card-body">
                    {salaryData.earnings.map((e: any) => (
                      <div key={e.id} className="amount-row">
                        <Text style={{ fontSize: 12 }}>{e.name}</Text>
                        <Text
                          strong
                          className="earnings-amount"
                          style={{ fontSize: 12 }}
                        >
                          ₹ {e.amount.toLocaleString()}
                        </Text>
                      </div>
                    ))}
                    <Divider
                      className="card-divider"
                      style={{ margin: "8px 0" }}
                    />
                    <div className="total-row">
                      <Text strong style={{ fontSize: 13 }}>
                        Total Earnings
                      </Text>
                      <Text
                        strong
                        className="total-earnings"
                        style={{ fontSize: 13 }}
                      >
                        ₹ {salaryData.totalEarnings.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </Col>

              {/* DEDUCTIONS */}
              <Col span={12}>
                <div className="deductions-card">
                  <div className="card-header deductions">
                    <Text strong style={{ fontSize: 13 }}>
                      Deductions
                    </Text>
                  </div>
                  <div className="card-body">
                    {data.salary.deductionsEnabled ? (
                      <>
                        {salaryData.deductions.map((d: any) => (
                          <div key={d.id} className="amount-row">
                            <Text style={{ fontSize: 12 }}>{d.name}</Text>
                            <Text
                              strong
                              className="deductions-amount"
                              style={{ fontSize: 12 }}
                            >
                              ₹ {d.amount.toLocaleString()}
                            </Text>
                          </div>
                        ))}
                        <Divider
                          className="card-divider"
                          style={{ margin: "8px 0" }}
                        />
                        <div className="total-row">
                          <Text strong style={{ fontSize: 13 }}>
                            Total Deductions
                          </Text>
                          <Text
                            strong
                            className="total-deductions"
                            style={{ fontSize: 13 }}
                          >
                            ₹ {salaryData.totalDeductions.toLocaleString()}
                          </Text>
                        </div>
                      </>
                    ) : (
                      <div className="no-deductions">
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          No deductions enabled
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            {/* NET PAY - Compact */}
            <div className="net-pay-display" style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Net Take-Home Pay
              </Text>
              <Title
                level={3}
                className="net-amount"
                style={{ margin: "4px 0 0 0" }}
              >
                ₹ {salaryData.netPay.toLocaleString()}
              </Title>
            </div>
          </Card>
        )}

        {/* FOOTER NOTES - Compact */}
        <Card
          className="preview-card footer-card"
          bodyStyle={{ padding: "12px 16px" }}
        >
          <Space direction="vertical" size={12} className="w-full">
            <div className="footer-note">
              <div className="note-icon">
                <FileTextOutlined style={{ fontSize: 14 }} />
              </div>
              <div>
                <Text strong className="note-title" style={{ fontSize: 12 }}>
                  System-Generated Payslip
                </Text>
                <Text
                  type="secondary"
                  className="note-description"
                  style={{ fontSize: 11 }}
                >
                  This is a <strong>system-generated payslip</strong> and does
                  not require a signature. In case of any discrepancies, please
                  contact the HR/Payroll department within{" "}
                  <strong>7 days</strong>.
                </Text>
              </div>
            </div>

            <div className="footer-note">
              <div className="note-icon">
                <LockOutlined style={{ fontSize: 14 }} />
              </div>
              <div>
                <Text strong className="note-title" style={{ fontSize: 12 }}>
                  Confidential Document
                </Text>
                <Text
                  type="secondary"
                  className="note-description"
                  style={{ fontSize: 11 }}
                >
                  For employee use only. Please keep this document secure.
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      </div>

      <style jsx global>{`
        .preview-drawer .ant-drawer-body {
          background: #fafafa !important;
          padding: 0 !important;
        }

        .preview-container {
          padding: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .preview-card {
          margin-bottom: 12px !important;
          border-radius: 8px !important;
          border: 1px solid #e0e0e0 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }

        .company-card {
          background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 100%
          ) !important;
          color: white;
        }

        .company-card .ant-typography,
        .company-card .ant-typography-secondary {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .company-card .company-name {
          color: white !important;
          margin-bottom: 4px !important;
        }

        .company-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .company-logo {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          background: white;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .company-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .company-info {
          flex: 1;
          min-width: 0;
        }

        .company-address {
          display: block;
          margin-bottom: 4px !important;
          font-size: 11px !important;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .company-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .company-meta-item {
          font-size: 10px !important;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px !important;
          padding-bottom: 8px;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-item {
          padding: 6px 0;
        }

        .detail-item.bordered {
          padding: 8px !important;
          border: 1px solid #f0f0f0;
          border-radius: 6px;
          background: #fafafa;
        }

        .detail-label {
          display: block;
          font-size: 10px !important;
          margin-bottom: 2px;
          line-height: 1.2;
        }

        .detail-value {
          font-size: 12px !important;
          display: block;
          line-height: 1.3;
        }

        .gross-salary-display {
          text-align: center;
          padding: 12px !important;
          background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #e8d5c4;
        }

        .earnings-card,
        .deductions-card {
          height: 100%;
          border-radius: 8px !important;
          overflow: hidden;
          border: 1px solid;
        }

        .earnings-card {
          border-color: #d4edda;
        }

        .deductions-card {
          border-color: #f8d7da;
        }

        .card-header {
          padding: 8px 12px !important;
          border-bottom: 1px solid;
        }

        .card-header.earnings {
          background: #d4edda;
          color: #155724;
        }

        .card-header.deductions {
          background: #f8d7da;
          color: #721c24;
        }

        .card-body {
          padding: 12px !important;
          background: white;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0 !important;
          min-height: 28px;
          border-bottom: 1px dashed #f0f0f0;
        }

        .amount-row:last-child {
          border-bottom: none;
        }

        .earnings-amount {
          color: #28a745;
        }

        .deductions-amount {
          color: #dc3545;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px !important;
          min-height: 32px;
          border-top: 2px solid;
        }

        .earnings-card .total-row {
          border-color: #d4edda;
        }

        .deductions-card .total-row {
          border-color: #f8d7da;
        }

        .no-deductions {
          text-align: center;
          padding: 24px 0 !important;
          color: #6c757d;
        }

        .net-pay-display {
          text-align: center;
          padding: 16px !important;
          background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
          border-radius: 8px;
          border: 1px solid #c3e6cb;
        }

        .footer-card {
          background: #f8f9fa !important;
        }

        .footer-note {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .note-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #e9ecef;
        }

        .note-title {
          display: block;
          margin-bottom: 2px;
        }

        .note-description {
          line-height: 1.4;
        }

        .preview-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #1890ff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* Compact table layout for smaller screens */
        @media (max-width: 768px) {
          .preview-container {
            padding: 12px;
          }

          .preview-drawer {
            width: 100% !important;
            max-width: 100%;
          }

          .company-header {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .company-logo {
            width: 40px;
            height: 40px;
          }

          .company-meta {
            justify-content: center;
          }

          .section-header {
            flex-direction: column;
            text-align: center;
            gap: 4px;
          }

          .earnings-card,
          .deductions-card {
            margin-bottom: 8px;
          }
        }

        /* Even more compact for very small screens */
        @media (max-width: 480px) {
          .preview-container {
            padding: 8px;
          }

          .preview-card {
            margin-bottom: 8px !important;
          }

          .company-header {
            gap: 6px;
          }

          .company-logo {
            width: 36px;
            height: 36px;
          }

          .section-header {
            margin-bottom: 8px !important;
          }

          .detail-item.bordered {
            padding: 6px !important;
          }

          .gross-salary-display,
          .net-pay-display {
            padding: 8px !important;
          }
        }
      `}</style>
    </Drawer>
  );
}
