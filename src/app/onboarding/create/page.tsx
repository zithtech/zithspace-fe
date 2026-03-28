"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Steps, Button, Form, Spin } from "antd";
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
  const { isLoading: authLoading } = useAuth();
  const { canCreateOnboarding } = usePermission();
  const router = useRouter();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canCreateOnboarding) {
      router.push('/dashboard');
    }
  }, [authLoading, canCreateOnboarding, router]);

  const [current, setCurrent] = useState(0);

  const [allData, setAllData] = useState<any>({
    personal: {},
    employment: {},
    bank: {},
    history: [],
    assets: [],
  });
  const [resetKey, setResetKey] = useState(0);

  const stepKeys = ["personal", "employment", "bank", "history", "assets"];

  const personalRef = useRef<any>(null);
  const employmentRef = useRef<any>(null);
  const bankRef = useRef<any>(null);
  const historyRef = useRef<any>(null);
  const assetsRef = useRef<any>(null);

  const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef];

  const { createOnboarding, loading: submitting }: any =
    useEmployeeOnboarding();

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  if (!canCreateOnboarding) {
    return null;
  }

  /* =====================================================
      CONTINUE → Save current step data into allData, then go Next
  ====================================================== */
  const next = async () => {
    try {
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
      PREVIOUS → Save current step data first, then go back
      This ensures edits on current step are not lost when going back
  ====================================================== */
  const prev = () => {
    // Save the current step's data before going back
    const currentRef = refs[current];
    if (currentRef?.current?.getData) {
      const stepData = currentRef.current.getData();
      setAllData((prev: any) => ({
        ...prev,
        [stepKeys[current]]: stepData,
      }));
    }
    setCurrent((prev) => prev - 1);
  };

  /* =====================================================
      SKIP → Just move to Next without saving
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

      // Build Partial Payload (only filled steps)
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

      setAllData({
        personal: {},
        employment: {},
        bank: {},
        history: [],
        assets: [],
      });
      setResetKey((prev) => prev + 1);
      setCurrent(0);
    } catch (error) {
      console.log("❌ Save & Skip Failed:", error);
    }
  };

  /* =====================================================
      SUBMIT → Collect last step data + submit everything
  ====================================================== */
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
      setAllData({
        personal: {},
        employment: {},
        bank: {},
        history: [],
        assets: [],
      });
      setResetKey((prev) => prev + 1);
      setCurrent(0);
    } catch (error) {
      console.log("❌ Submit Failed", error);
    }
  };

  return (
    <MainLayout>
      <div style={{ width: "100%", minHeight: "100vh", background: "white", paddingBottom: "80px" }}>
        <div style={{ 
          padding: "16px 24px", 
          borderBottom: "1px solid #f0f0f0",
          background: "white",
        }}>
          <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
            Employee Onboarding
          </h1>
        </div>

        <div style={{ 
          padding: "20px 24px",
          background: "white",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid #f1f5f9",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
        }}>
          <Steps current={current} size="small" style={{ marginBottom: 0 }}>
            <Step title="Personal Details" />
            <Step title="Employment" />
            <Step title="Bank & Payroll" />
            <Step title="Employee History" />
            <Step title="Assets" />
          </Steps>
        </div>

        {/*
          KEY STRATEGY: All steps are always mounted (display:block/none).
          This keeps the Ant Design form instances alive in memory,
          so values are not lost when switching steps.
          The `data` prop carries the saved allData back into each step
          so the forms are repopulated when going back/forward.
        */}

        {/* <div style={{ display: current === 0 ? "block" : "none" }}>
          <PersonalDetails ref={personalRef} data={allData.personal} />
        </div>

        <div style={{ display: current === 1 ? "block" : "none" }}>
          <EmploymentDetails ref={employmentRef} data={allData.employment} />
        </div>

        <div style={{ display: current === 2 ? "block" : "none" }}>
          <BankPayroll ref={bankRef} data={allData.bank} />
        </div>

        <div style={{ display: current === 3 ? "block" : "none" }}>
          <EmployeHistory ref={historyRef} data={allData.history} />
        </div>

        <div style={{ display: current === 4 ? "block" : "none" }}>
          <Assets ref={assetsRef} data={allData.assets} />
        </div> */}

        <div style={{ padding: "0 24px" }}>
          <div style={{ display: current === 0 ? "block" : "none" }}>
            <PersonalDetails
              key={`personal-${resetKey}`}
              ref={personalRef}
              data={allData.personal}
            />
          </div>

          <div style={{ display: current === 1 ? "block" : "none" }}>
            <EmploymentDetails
              key={`employment-${resetKey}`}
              ref={employmentRef}
              data={allData.employment}
            />
          </div>

          <div style={{ display: current === 2 ? "block" : "none" }}>
            <BankPayroll
              key={`bank-${resetKey}`}
              ref={bankRef}
              data={allData.bank}
            />
          </div>

          <div style={{ display: current === 3 ? "block" : "none" }}>
            <EmployeHistory
              key={`history-${resetKey}`}
              ref={historyRef}
              data={allData.history}
            />
          </div>

          <div style={{ display: current === 4 ? "block" : "none" }}>
            <Assets
              key={`assets-${resetKey}`}
              ref={assetsRef}
              data={allData.assets}
            />
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 24px",
            background: "#fff",
            borderTop: "1px solid #f0f0f0",
            zIndex: 1000,
          }}
        >
          <div>{current > 0 && <Button onClick={prev}>Previous</Button>}</div>

          <div style={{ display: "flex", gap: 8 }}>
            {current < 4 && (
              <>
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
