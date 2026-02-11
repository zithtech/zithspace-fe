"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
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
const onboarding = () => {
  const [current, setCurrent] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});

  // main state

  const [allData, setAllData] = useState<any>({
    personal: {},
    employment: {},
    bank: {},
    history: {},
    assets: {},
  });

  useEffect(() => {
    console.log("final check::::::::::::", allData);
  }, [allData]);

  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [form4] = Form.useForm();
  const [form5] = Form.useForm();
  const [form6] = Form.useForm();

  const forms = [form1, form2, form3, form4, form5, form6];

  const personalRef = useRef<any>(null);
  const employmentRef = useRef<any>(null);
  const bankRef = useRef<any>(null);
  const historyRef = useRef<any>(null);
  const assetsRef = useRef<any>(null);

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

  const {
    createOnboarding,
    loading: submitting,
    error: submitError,
    success,
  } = useEmployeeOnboarding();

  const prev = () => setCurrent(current - 1);

  const skipStep = () => {
    const currentFormValues = forms[current].getFieldsValue();

    setOnboardingData((prev: any) => ({
      ...prev,
      ...currentFormValues,
    }));

    setCurrent((prev) => prev + 1);
  };
  // const submitAll = async () => {
  //   try {
  //     const stepKeys = ["personal", "employment", "bank", "history", "assets"];
  //     const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef];

  //     const currentRef = refs[current];

  //     // 🔥 STEP 1: get final step data
  //     if (currentRef?.current?.getData) {
  //       const finalStepData = currentRef.current.getData();

  //       setAllData((prev: any) => {
  //         const finalData = {
  //           ...prev,
  //           [stepKeys[current]]: finalStepData,
  //         };

  //         // 🔥 STEP 2: console full collected data
  //         console.log("🔥 FINAL SUBMIT DATA 👉", finalData);

  //         // 👉 future la API call inga pannalaam
  //         // await api.post("/employee", finalData);

  //         return finalData;
  //       });
  //     }
  //     setCurrent((prev) => (prev = 0));
  //   } catch (error) {
  //     console.log("Submit Failed ❌", error);
  //   }
  // };

  const submitAll = async () => {
    try {
      const stepKeys = ["personal", "employment", "bank", "history", "assets"];
      const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef];

      const currentRef = refs[current];

      if (currentRef?.current?.getData) {
        const finalStepData = currentRef.current.getData();

        const finalPayload = {
          ...allData,
          [stepKeys[current]]: finalStepData,
        };

        console.log("🔥 FINAL PAYLOAD (UI) 👉", finalPayload);

        // 🔥 SEND TO HOOK
        await createOnboarding(finalPayload);

        // success handling
        console.log("✅ Onboarding completed");
        setCurrent(0);
      }
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
            {/* <Step
              icon={<MdOutlineDocumentScanner size={18} />}
              title={<span style={{ fontSize: "12px" }}>Documents</span>}
            /> */}
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
            {current === 0 && (
              <PersonalDetails ref={personalRef} data={allData.personal} />
            )}
            {current === 1 && (
              <EmploymentDetails
                ref={employmentRef}
                data={allData.employment}
              />
            )}
            {current === 2 && <BankPayroll ref={bankRef} data={allData.bank} />}
            {current === 3 && (
              <EmployeHistory ref={historyRef} data={allData.history} />
            )}
            {current === 4 && <Assets ref={assetsRef} data={allData.assets} />}
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
