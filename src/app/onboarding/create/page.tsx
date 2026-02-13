"use client";
import React, { useEffect, useState, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Steps, Button, Form } from "antd";
import PersonalDetails from "@/components/onboarding/PersonalDetails";
import EmploymentDetails from "@/components/onboarding/EmploymentDetails";
import BankPayroll from "@/components/onboarding/BankPayroll";
import EmployeHistory from "@/components/onboarding/EmployeeHistory";
import Assets from "@/components/onboarding/Assets";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";

// icons
import { BsFillPersonLinesFill } from "react-icons/bs";
import { BiSolidBank } from "react-icons/bi";
import { MdOutlineDocumentScanner } from "react-icons/md";
import { BsPersonHeart } from "react-icons/bs";

const { Step } = Steps;

const Onboarding = () => {
  const [current, setCurrent] = useState(0);

  const [allData, setAllData] = useState<any>({
    personal: {},
    employment: {},
    bank: {},
    history: [],
    assets: [],
  });

  const stepKeys = ["personal", "employment", "bank", "history", "assets"];

  const personalRef = useRef<any>(null);
  const employmentRef = useRef<any>(null);
  const bankRef = useRef<any>(null);
  const historyRef = useRef<any>(null);
  const assetsRef = useRef<any>(null);

  const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef];

  const { createOnboarding, loading: submitting } = useEmployeeOnboarding();

  /* =====================================================
      CONTINUE → Merge + Full API + Next
  ====================================================== */
  const next = async () => {
    try {
      const stepKeys = ["personal", "employment", "bank", "history", "assets"];
      const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef];

      const currentRef = refs[current];

      if (currentRef?.current?.getData) {
        const stepData = currentRef.current.getData();

        setAllData((prev: any) => ({
          ...prev,
          [stepKeys[current]]: stepData,
        }));

        console.log(
          `${stepKeys[current].toUpperCase()} STEP DATA 👉`,
          stepData,
        );
      }
      setCurrent((prev) => prev + 1);
    } catch (error) {
      console.log("Validation Failed:", error);
    }
  };

  /* =====================================================
      SKIP → Just Next
  ====================================================== */
  const skipStep = () => {
    if (current < 4) {
      setCurrent((prev) => prev + 1);
    }
  };

  /* =====================================================
      SAVE & SKIP → Partial Save + Next
  ====================================================== */
  const saveAndSkip = async () => {
    try {
      const currentRef = refs[current];

      let updatedData = { ...allData };

      if (currentRef?.current?.getData) {
        const stepData = currentRef.current.getData();

        updatedData = {
          ...updatedData,
          [stepKeys[current]]: stepData,
        };

        setAllData(updatedData);
      }

      // 🔥 Build Partial Payload (only filled steps)
      const partialPayload: any = {};

      stepKeys.forEach((key) => {
        const value = updatedData[key];

        if (
          (Array.isArray(value) && value.length > 0) ||
          (!Array.isArray(value) && value && Object.keys(value).length > 0)
        ) {
          partialPayload[key] = value;
        }
      });

      console.log("💾 SAVE & SKIP PARTIAL PAYLOAD 👉", partialPayload);

      await createOnboarding(partialPayload);

      if (current < 4) {
        setCurrent((prev) => prev + 1);
      }
    } catch (error) {
      console.log("❌ Save & Skip Failed:", error);
    }
  };

  const prev = () => setCurrent((prev) => prev - 1);

  const submitAll = async () => {
    try {
      const currentRef = refs[current];
      let finalData = { ...allData };

      if (currentRef?.current?.getData) {
        const finalStepData = currentRef.current.getData();

        finalData = {
          ...finalData,
          [stepKeys[current]]: finalStepData,
        };
      }

      console.log("🔥 FINAL SUBMIT PAYLOAD 👉", finalData);

      await createOnboarding(finalData);
      window.alert("Onboarding Process Completed");

      setCurrent(0);
    } catch (error) {
      console.log("❌ Submit Failed", error);
    }
  };

  return (
    <MainLayout>
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <p style={{ fontSize: "20px", fontWeight: "bold", padding: "8px" }}>
          Onboarding
        </p>

        <div style={{ padding: "10px" }}>
          <Steps current={current} size="small">
            <Step icon={<BsPersonHeart size={20} />} title="Personal Details" />
            <Step
              icon={<BsFillPersonLinesFill size={20} />}
              title="Employment"
            />
            <Step icon={<BiSolidBank size={20} />} title="Bank & Payroll" />
            <Step
              icon={<MdOutlineDocumentScanner size={20} />}
              title="Employee History"
            />
            <Step icon={<BiSolidBank size={20} />} title="Assets" />
          </Steps>
        </div>

        <div style={{ padding: "20px" }}>
          {current === 0 && (
            <PersonalDetails ref={personalRef} data={allData.personal} />
          )}
          {current === 1 && (
            <EmploymentDetails ref={employmentRef} data={allData.employment} />
          )}
          {current === 2 && <BankPayroll ref={bankRef} data={allData.bank} />}
          {current === 3 && (
            <EmployeHistory ref={historyRef} data={allData.history} />
          )}
          {current === 4 && <Assets ref={assetsRef} data={allData.assets} />}
        </div>

        {/* Buttons */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            width: "95%",
            display: "flex",
            justifyContent: "space-between",
            padding: 10,
            background: "#fff",
            boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div>{current > 0 && <Button onClick={prev}>Previous</Button>}</div>

          <div style={{ display: "flex", gap: 8 }}>
            {current < 4 && (
              <>
                {/* <Button onClick={skipStep}>Skip</Button> */}

                <Button onClick={saveAndSkip}>Save & Skip</Button>

                <Button type="primary" onClick={next} loading={submitting}>
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

export default Onboarding;
