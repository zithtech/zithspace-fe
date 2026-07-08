"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spin, message } from "antd";
import { Menu } from "lucide-react";
import {
  UserOutlined,
  IdcardOutlined,
  BankOutlined,
  HistoryOutlined,
  LaptopOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  SaveOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import OnboardingGuard from "@/components/onboarding/OnboardingGuard";
import PersonalDetails from "@/components/onboarding/PersonalDetails";
import EmploymentDetails from "@/components/onboarding/EmploymentDetails";
import BankPayroll from "@/components/onboarding/BankPayroll";
import EmployeHistory from "@/components/onboarding/EmployeeHistory";
import Assets from "@/components/onboarding/Assets";
import Documents from "@/components/onboarding/Documents";
import { useEmployeeOnboarding } from "@/hooks/use-onboarding";
import { EmployeeOnboardingService } from "@/services/onboardingService";

// ── Module palette (Leaves 2.0 aesthetic) ───────────────────────────────────
const PALETTE = {
  blue: "#3B82F6",
  green: "#10B981",
  violet: "#8B5CF6",
  amber: "#F59E0B",
  grey: "#94A3B8",
} as const;
const TINT = {
  blue: "rgba(59,130,246,0.10)",
  green: "rgba(16,185,129,0.10)",
  violet: "rgba(139,92,246,0.10)",
  amber: "rgba(245,158,11,0.10)",
  grey: "rgba(148,163,184,0.12)",
} as const;

const STEPS = [
  { key: "personal", label: "Personal", icon: <UserOutlined />, color: PALETTE.blue, tint: TINT.blue },
  { key: "employment", label: "Employment", icon: <IdcardOutlined />, color: PALETTE.green, tint: TINT.green },
  { key: "bank", label: "Bank & Payroll", icon: <BankOutlined />, color: PALETTE.violet, tint: TINT.violet },
  { key: "history", label: "History", icon: <HistoryOutlined />, color: PALETTE.amber, tint: TINT.amber },
  { key: "assets", label: "Assets", icon: <LaptopOutlined />, color: PALETTE.grey, tint: TINT.grey },
  { key: "documents", label: "Documents", icon: <FileTextOutlined />, color: PALETTE.blue, tint: TINT.blue },
] as const;

const OnboardingContent = () => {
  const { isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;
  const { canCreateOnboarding, canUpdateOnboarding } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading) {
      const allowed = isEdit ? canUpdateOnboarding : canCreateOnboarding;
      if (!allowed) {
        router.push('/onboarding/onboarded');
      }
    }
  }, [authLoading, canCreateOnboarding, canUpdateOnboarding, isEdit, router]);

  const [current, setCurrent] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

  const [allData, setAllData] = useState<any>({
    personal: {},
    employment: {},
    bank: {},
    history: [],
    assets: [],
    documents: [],
  });
  const [resetKey, setResetKey] = useState(0);

  const stepKeys = ["personal", "employment", "bank", "history", "assets", "documents"];

  const personalRef = useRef<any>(null);
  const employmentRef = useRef<any>(null);
  const bankRef = useRef<any>(null);
  const historyRef = useRef<any>(null);
  const assetsRef = useRef<any>(null);
  const documentsRef = useRef<any>(null);

  const refs = [personalRef, employmentRef, bankRef, historyRef, assetsRef, documentsRef];

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
              documents: employeeData.documents || [],
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
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" tip="Loading">
          <div style={{ padding: 20 }} />
        </Spin>
      </div>
    );
  }

  const allowed = isEdit ? canUpdateOnboarding : canCreateOnboarding;
  if (!allowed) {
    return null;
  }

  const next = async () => {
    try {
      const currentRef = refs[current];
      // In edit mode the record already exists — let HR move between steps
      // freely without re-satisfying every required field. Validation still
      // applies when creating a new employee.
      if (!isEdit && currentRef?.current?.validate) {
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

      if (current < 5) setCurrent(prev => prev + 1);
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
        documents: "documents",
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

  const activeStep = STEPS[current];

  return (
    <div className="onb">
      <div className="onb-header">
        <div className="onb-header-top">
          <div className="onb-header-about">
            <button 
              className="ob-mobile-menu-btn" 
              onClick={() => window.dispatchEvent(new Event('open-ob-sidebar'))}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div
              className="onb-header-icon"
              style={{ background: activeStep.tint, color: activeStep.color }}
            >
              {activeStep.icon}
            </div>
            <div className="onb-header-text">
              <div className="onb-header-title">
                {isEdit ? "Edit Employee" : "Employee Onboarding"}
              </div>
              <div className="onb-header-sub">
                Step {current + 1} of {STEPS.length} · {activeStep.label}
              </div>
            </div>
          </div>
        </div>

        {/* Compact horizontal step indicator — small numbered pills + labels */}
        <div className="onb-steps">
          {STEPS.map((s, i) => {
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <React.Fragment key={s.key}>
                <button
                  type="button"
                  className={`onb-step onb-step--${state}`}
                  onClick={() => {
                    // allow jumping back to a previously completed step
                    if (i < current) setCurrent(i);
                  }}
                  style={
                    state === "active"
                      ? ({ ["--step-c" as any]: s.color, ["--step-t" as any]: s.tint })
                      : undefined
                  }
                >
                  <span className="onb-step-pill">
                    {state === "done" ? <CheckCircleFilled /> : i + 1}
                  </span>
                  <span className="onb-step-label">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className={`onb-step-sep ${i < current ? "is-done" : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step bodies (always mounted; display:block/none keeps form state) ── */}
      <div className="onb-body">
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

        <div style={{ display: current === 5 ? "block" : "none" }}>
          <Documents
            key={`documents-${resetKey}`}
            ref={documentsRef}
            data={allData.documents}
          />
        </div>
      </div>

      {/* ── Slim sticky footer: Back / Save & Next / Continue / Submit ── */}
      <div className="onb-footer">
        <div>
          {current > 0 && (
            <Button
              onClick={prev}
              icon={<ArrowLeftOutlined />}
              className="onb-btn onb-btn--ghost"
            >
              Back
            </Button>
          )}
        </div>

        <div className="onb-footer-actions">
          {current < 5 && (
            <>
              <Button
                onClick={saveAndSkip}
                icon={<SaveOutlined />}
                className="onb-btn onb-btn--ghost"
              >
                Save &amp; Next
              </Button>
              <Button
                type="primary"
                onClick={next}
                loading={submitting}
                className="onb-btn onb-btn--primary"
              >
                Continue <ArrowRightOutlined />
              </Button>
            </>
          )}

          {current === 5 && (
            <Button
              type="primary"
              onClick={submitAll}
              loading={submitting}
              icon={<CheckOutlined />}
              className="onb-btn onb-btn--primary"
            >
              {isEdit ? "Update Profile" : "Submit"}
            </Button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .onb {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        /* Slim sticky header */
        .onb-header {
          position: sticky;
          top: 0;
          z-index: 30;
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          backdrop-filter: blur(12px);
          padding: 12px 24px 0 28px;
          margin: -12px -22px 16px;
        }
        .onb-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 0 12px;
        }
        .onb-header-about {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .onb-header-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .onb-header-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .onb-header-sub {
          font-size: 12px;
          color: var(--text-slate-500);
          margin-top: 1px;
          font-weight: 500;
        }

        /* Compact horizontal step indicator */
        .onb-steps {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 4px 12px;
          overflow-x: auto;
        }
        .onb-step {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 10px 5px 5px;
          border: 1px solid var(--border-slate-200);
          border-radius: 999px;
          background: var(--bg-pure-white);
          cursor: default;
          flex-shrink: 0;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .onb-step-pill {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          background: var(--bg-slate-50, #f1f5f9);
          color: var(--text-slate-500);
          flex-shrink: 0;
        }
        .onb-step-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-500);
          white-space: nowrap;
        }
        .onb-step--active {
          border-color: var(--step-c);
          background: var(--step-t);
          cursor: default;
        }
        .onb-step--active .onb-step-pill {
          background: var(--step-c);
          color: #fff;
        }
        .onb-step--active .onb-step-label {
          color: var(--text-slate-900);
        }
        .onb-step--done {
          cursor: pointer;
          border-color: rgba(16, 185, 129, 0.35);
        }
        .onb-step--done .onb-step-pill {
          background: transparent;
          color: ${PALETTE.green};
          font-size: 14px;
        }
        .onb-step--done .onb-step-label {
          color: var(--text-slate-700);
        }
        .onb-step--done:hover {
          background: ${TINT.green};
        }
        .onb-step-sep {
          width: 14px;
          height: 2px;
          border-radius: 2px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        .onb-step-sep.is-done {
          background: ${PALETTE.green};
        }

        /* Body */
        .onb-body {
          flex: 1;
          padding: 0 0 96px;
        }

        /* Slim sticky footer */
        .onb-footer {
          position: sticky;
          bottom: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 28px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-200);
          box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.05);
          margin: 0 -22px;
        }
        .onb-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .onb-btn {
          height: 38px !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .onb-btn--ghost {
          border: 1px solid var(--border-slate-200) !important;
          color: var(--text-slate-700) !important;
        }
        .onb-btn--ghost:hover {
          border-color: #93c5fd !important;
          color: ${PALETTE.blue} !important;
        }
        .onb-btn--primary {
          background: ${PALETTE.blue} !important;
          border-color: ${PALETTE.blue} !important;
        }

        @media (max-width: 900px) {
          .onb-header {
            padding: 12px 16px 0 16px;
          }
          .onb-header-top {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

const Onboarding = () => (
  <OnboardingGuard itemKey="create">
    <Suspense
      fallback={
        <div style={{ padding: 100, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  </OnboardingGuard>
);

export default Onboarding;
