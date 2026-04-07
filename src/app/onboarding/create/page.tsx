"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { Steps, Button, Form, Spin, message } from "antd";
import PersonalDetails from "@/components/onboarding/PersonalDetails";
import EmploymentDetails from "@/components/onboarding/EmploymentDetails";
import BankPayroll from "@/components/onboarding/BankPayroll";
import EmployeHistory from "@/components/onboarding/EmployeeHistory";
import Assets from "@/components/onboarding/Assets";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";
import { EmployeeOnboardingService } from "@/services/onboardingService";

const { Step } = Steps;

const OnboardingContent = () => {
  const { isLoading: authLoading } = useAuth();
  const { canCreateOnboarding } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;

  // Route guard
  useEffect(() => {
    if (!authLoading && !canCreateOnboarding) {
      router.push('/dashboard');
    }
  }, [authLoading, canCreateOnboarding, router]);

  const [current, setCurrent] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

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

  const { createOnboarding, updateOnboarding, loading: submitting }: any =
    useEmployeeOnboarding();

  // Load existing data for edit mode
  useEffect(() => {
    if (id) {
      const fetchExisting = async () => {
        setDataLoading(true);
        try {
          const res = await EmployeeOnboardingService.getEmployeeById(id);
          let employeeData = null;

          if (res?.data?.success) employeeData = res.data.data;
          else if (res?.success) employeeData = res.data;
          else if (res?.data) employeeData = res.data;
          else employeeData = res;

          if (employeeData) {
            setAllData({
              personal: employeeData.personalDetails || employeeData.personal || {},
              employment: employeeData.employment || {},
              bank: employeeData.bankAndPayroll || employeeData.bank || {},
              history: employeeData.previousCompanyDetails || employeeData.history || [],
              assets: employeeData.assets || [],
            });
            // Update resetKey to force re-render of components with new data
            setResetKey(prev => prev + 1);
          }
        } catch (err) {
          console.error("Failed to fetch existing data:", err);
          message.error("Failed to load employee data for editing");
        } finally {
          setDataLoading(false);
        }
      };
      fetchExisting();
    }
  }, [id]);

  if (authLoading || dataLoading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" tip={dataLoading ? "Loading employee data..." : "Loading..."} />
      </div>
    );
  }

  if (!canCreateOnboarding) {
    return null;
  }

  const next = async () => {
    try {
      const currentRef = refs[current];
      if (currentRef?.current?.validate) {
        const isValid = await currentRef.current.validate();
        if (!isValid) return;
      }

      if (currentRef?.current?.getData) {
        const stepData = currentRef.current.getData();
        setAllData((prev: any) => ({
          ...prev,
          [stepKeys[current]]: stepData,
        }));
      }
      setCurrent((prev) => prev + 1);
    } catch (error) {
      console.log("Next Step Error:", error);
    }
  };

  const prev = () => {
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

      if (isEdit && id) {
        await updateOnboarding(id, partialPayload);
        message.success("Progress saved successfully");
      } else {
        await createOnboarding(partialPayload);
        message.success("Profile created and saved as draft");
      }
      
      if (current < 4) setCurrent(prev => prev + 1);
      else router.push("/onboarding/onboarded");
    } catch (error) {
      console.log("Save & Skip Failed:", error);
    }
  };

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

      const backendMap: any = {
        personal: "personal",
        employment: "employment",
        bank: "bank",
        history: "history",
        assets: "assets",
      };

      const finalPayload: any = {};
      Object.keys(finalData).forEach(key => {
        finalPayload[backendMap[key] || key] = finalData[key];
      });

      if (isEdit && id) {
        await updateOnboarding(id, finalPayload);
        message.success("Employee onboarding updated successfully");
      } else {
        await createOnboarding(finalPayload);
        message.success("Employee onboarding process completed");
      }
      
      router.push("/onboarding/onboarded");
    } catch (error) {
      console.log("Submit Failed", error);
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "white", paddingBottom: "80px" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", background: "white" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
          {isEdit ? "Edit Employee Profile" : "Employee Onboarding"}
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
        <Steps current={current} size="small">
          <Step title="Personal Details" />
          <Step title="Employment" />
          <Step title="Bank & Payroll" />
          <Step title="History" />
          <Step title="Assets" />
        </Steps>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div style={{ display: current === 0 ? "block" : "none" }}>
          <PersonalDetails key={`p-${resetKey}`} ref={personalRef} data={allData.personal} />
        </div>
        <div style={{ display: current === 1 ? "block" : "none" }}>
          <EmploymentDetails key={`e-${resetKey}`} ref={employmentRef} data={allData.employment} />
        </div>
        <div style={{ display: current === 2 ? "block" : "none" }}>
          <BankPayroll key={`b-${resetKey}`} ref={bankRef} data={allData.bank} />
        </div>
        <div style={{ display: current === 3 ? "block" : "none" }}>
          <EmployeHistory key={`h-${resetKey}`} ref={historyRef} data={allData.history} />
        </div>
        <div style={{ display: current === 4 ? "block" : "none" }}>
          <Assets key={`a-${resetKey}`} ref={assetsRef} data={allData.assets} />
        </div>
      </div>

      <div style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        left: 280, // Offset for sidebar
        display: "flex",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "#fff",
        borderTop: "1px solid #f0f0f0",
        zIndex: 1000,
      }}>
        <div>{current > 0 && <Button onClick={prev}>Previous</Button>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {current < 4 && (
            <>
              <Button onClick={saveAndSkip} loading={submitting}>Save & Next</Button>
              <Button type="primary" onClick={next} loading={submitting}>Continue</Button>
            </>
          )}
          {current === 4 && <Button type="primary" onClick={submitAll} loading={submitting}>{isEdit ? "Update Profile" : "Submit Process"}</Button>}
        </div>
      </div>
    </div>
  );
};

const Onboarding = () => (
  <MainLayout>
    <Suspense fallback={<div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>}>
      <OnboardingContent />
    </Suspense>
  </MainLayout>
);

export default Onboarding;
