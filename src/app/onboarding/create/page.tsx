"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Spin, message, Modal } from "antd";
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
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { MembersService } from "@/services/membersService";

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

  const stepKeys = ["personal", "employment", "bank", "history", "assets", "documents"];

  const [current, setCurrent] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const idx = stepKeys.indexOf(tabParam);
      if (idx !== -1) return idx;
    }
    return 0;
  });
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
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncMemberInfo, setSyncMemberInfo] = useState<any>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);
  const [pendingSaveAction, setPendingSaveAction] = useState<"saveAndSkip" | "submitAll" | null>(null);

  // Expose refs for each component so we can call validate() and getData()
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

  const executeSave = async (payload: any, actionType: "saveAndSkip" | "submitAll", syncMemberId?: string) => {
    try {
      let savedEmployee: any = null;
      if (isEdit && id) {
        await updateOnboarding(id, payload);
        message.success(actionType === "submitAll" ? "Employee onboarding updated successfully" : "Progress saved successfully");
      } else {
        savedEmployee = await createOnboarding(payload);
        message.success(actionType === "submitAll" ? "Employee onboarding process completed" : "Profile created and saved as draft");
      }

      if (syncMemberId && savedEmployee?.id) {
        await MembersService.syncEmployee(syncMemberId, savedEmployee.id);
        message.success("Successfully synced onboarding profile with existing member");
      }

      if (actionType === "saveAndSkip") {
        if (current < 5) setCurrent(prev => prev + 1);
        else router.push("/onboarding/onboarded");
      } else {
        router.push("/onboarding/onboarded");
      }
    } catch (error) {
      console.log("Submit Failed", error);
      message.error("Failed to save onboarding data");
    } finally {
      setSyncModalVisible(false);
      setPendingSavePayload(null);
      setPendingSaveAction(null);
      setSyncMemberInfo(null);
    }
  };

  const checkMemberSync = async (payload: any, actionType: "saveAndSkip" | "submitAll") => {
    if (isEdit) {
      return executeSave(payload, actionType);
    }

    try {
      const personalData = payload.personal || allData.personal;
      if (personalData?.workEmail || personalData?.mobile) {
        const res = await MembersService.checkSync({ 
          workEmail: personalData.workEmail, 
          phone: personalData.mobile 
        });
        
        if (res.exists && res.member) {
          setSyncMemberInfo(res.member);
          setPendingSavePayload(payload);
          setPendingSaveAction(actionType);
          setSyncModalVisible(true);
          return;
        }
      }
    } catch (e) {
      console.error("Check sync error", e);
    }
    
    return executeSave(payload, actionType);
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

      await checkMemberSync(partialPayload, "saveAndSkip");
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

      await checkMemberSync(finalPayload, "submitAll");
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
          padding: 6px 28px;
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
          height: 40px !important;
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

        /* Enforce 8px border-radius and exact uniform height on all form inputs */
        .onb .ant-input,
        .onb .ant-select-single .ant-select-selector,
        .onb .ant-picker,
        .onb .ant-input-number,
        .onb .ant-input-password {
          border-radius: 8px !important;
          height: 40px !important;
          display: flex;
          align-items: center;
        }
        .onb .ant-select-multiple .ant-select-selector {
          border-radius: 8px !important;
          min-height: 40px !important;
          height: auto !important;
          padding-top: 2px !important;
          padding-bottom: 2px !important;
        }
        .onb .ant-select-single .ant-select-selection-search-input {
          height: 38px !important;
        }
        .onb .ant-select-single .ant-select-selection-item,
        .onb .ant-select-single .ant-select-selection-placeholder {
          line-height: 38px !important;
        }
        .onb .ant-picker-input > input {
          height: 100% !important;
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

      {syncModalVisible && syncMemberInfo && pendingSaveAction && pendingSavePayload && (
        <Modal
          open={syncModalVisible}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserOutlined style={{ color: "var(--premium-blue)", fontSize: "18px" }} />
              <span>Sync Existing Member</span>
            </div>
          }
          onOk={() => executeSave(pendingSavePayload, pendingSaveAction, syncMemberInfo.id)}
          onCancel={() => executeSave(pendingSavePayload, pendingSaveAction)}
          okText="Sync Existing Member"
          cancelText="Create New Employee"
          closable={false}
          maskClosable={false}
          centered
          width={500}
        >
          <div style={{ padding: "12px 0" }}>
            <p style={{ marginBottom: "16px", color: "var(--text-slate-600)", fontSize: "14px" }}>
              An existing Member was found matching this email or phone number. Would you like to link this onboarding profile to the existing member to prevent duplicates?
            </p>
            <div style={{ background: "var(--bg-slate-50)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-slate-200)" }}>
              <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: "15px" }}>{syncMemberInfo.name}</div>
              <div style={{ fontSize: "13px", color: "var(--text-slate-500)", marginTop: "6px" }}>Email: {syncMemberInfo.workEmail || "N/A"}</div>
              <div style={{ fontSize: "13px", color: "var(--text-slate-500)", marginTop: "2px" }}>Phone: {syncMemberInfo.phone || "N/A"}</div>
              {syncMemberInfo.role && (
                <div style={{ fontSize: "12px", background: "var(--premium-blue-50)", color: "var(--premium-blue)", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginTop: "12px", fontWeight: 500 }}>
                  Role: {syncMemberInfo.role}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
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
