"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Steps, Button, Form } from "antd";
import PersonalDetails from "@/components/onboarding/PersonalDetails";
import EmploymentDetails from "@/components/onboarding/EmploymentDetails";
import BankPayroll from "@/components/onboarding/BankPayroll";
import EmployeeHistory from "@/components/onboarding/EmployeeHistory";
import Documents from "@/components/onboarding/Documents";
import Assets from "@/components/onboarding/Assets";

// icons
import { BsFillPersonLinesFill } from "react-icons/bs";
import { BiSolidBank } from "react-icons/bi";
import { MdOutlineDocumentScanner } from "react-icons/md";
import { BsPersonHeart } from "react-icons/bs";

const { Step } = Steps;
const onboarding = () => {
  const [current, setCurrent] = useState(0);

  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [form4] = Form.useForm();
  const [form5] = Form.useForm();
  const [form6] = Form.useForm();

  const forms = [form1, form2, form3, form4, form5, form6];

  const next = async () => {
    try {
      await forms[current].validateFields(); // ✅ validation
      const currentFormValues = forms[current].getFieldsValue();
      console.log("Current Form Values ", currentFormValues);
      setCurrent(current + 1);
    } catch (error) {
      console.log("Validation Failed:", error);
    }
  };

  const prev = () => setCurrent(current - 1);

  const submitAll = async () => {
    const data = {
      ...form1.getFieldsValue(),
      ...form2.getFieldsValue(),
      ...form3.getFieldsValue(),
      ...form4.getFieldsValue(),
      ...form5.getFieldsValue(),
      ...form6.getFieldsValue(),
    };

    console.log("FINAL DATA 👉", data);
  };
  const skipStep = () => {
    setCurrent((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <p style={{ fontSize: "20px", fontWeight: "bold", padding: "8px" }}>
          Onboarding
        </p>
       <div
  style={{
    padding: "10px",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
  }}
>
          <Steps current={current} size="small">
            <Step
              icon={<BsPersonHeart size={18} />}
              title={<span style={{ fontSize: "12px" }}>Personal Details</span>}
            />
            <Step
              icon={<BsFillPersonLinesFill size={18} />}
              title={<span style={{ fontSize: "12px" }}>Employment</span>}
            />
            <Step
              icon={<BiSolidBank size={18} />}
              title={<span style={{ fontSize: "12px" }}>Bank & Payroll</span>}
            />
            <Step
              icon={<MdOutlineDocumentScanner size={18} />}
              title={<span style={{ fontSize: "12px" }}>Employee History</span>}
            />
            <Step
              icon={<BiSolidBank size={18} />}
              title={<span style={{ fontSize: "12px" }}>Assets</span>}
            />
            <Step
              icon={<MdOutlineDocumentScanner size={18} />}
              title={<span style={{ fontSize: "12px" }}>Documents</span>}
            />
          </Steps>
        </div>
       <div
  style={{
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  }}
>
  <div>
          {/* Step Content */}
          {current === 0 && <PersonalDetails />}
          {current === 1 && <EmploymentDetails />}
          {current === 2 && <BankPayroll />}
          {current === 3 && <EmployeeHistory />}
          {current === 4 && <Assets />}
          {current === 5 && <Documents form={form5} />}
        </div>
        </div>
      

        {/* Buttons */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            width: "95%",
            height: "7%",
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 7,
            paddingBottom: 25,
            paddingLeft: 7,
            paddingRight: 20, // 👈 right side move aagadhu

            background: "#fff",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
            zIndex: 1000,
          }}
        >
          {/* Left side */}
          <div>{current > 0 && <Button onClick={prev}>Previous</Button>}</div>

          {/* Right side */}
          <div style={{ display: "flex", gap: 8 }}>
            {current < 4 && (
              <>
                <Button onClick={skipStep}>Skip</Button>

                <Button type="primary" onClick={next}>
                  Continue
                </Button>
              </>
            )}

            {current === 4 && (
              <Button type="primary" onClick={submitAll}>
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default onboarding;
