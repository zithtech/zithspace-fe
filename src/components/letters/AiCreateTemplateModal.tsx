"use client";

import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Typography, message, Select, Checkbox, Spin, Divider } from "antd";
import { ThunderboltOutlined, SendOutlined } from "@ant-design/icons";
import { LettersService, DocumentCategory, DocumentTemplate } from "@/services/lettersService";

const { Text, Title } = Typography;
const { TextArea } = Input;

const PURPLE = "#722ed1";

interface AiCreateTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (templateId: string) => void;
  categories: DocumentCategory[];
}

const STANDARD_PLACEHOLDERS = [
  { key: "employee_name", label: "Employee Name" },
  { key: "work_email", label: "Work Email" },
  { key: "designation", label: "Designation / Title" },
  { key: "department", label: "Department" },
  { key: "date_of_joining", label: "Date of Joining" },
  { key: "salary_ctc", label: "Annual Salary (CTC)" },
  { key: "reporting_manager", label: "Reporting Manager" },
  { key: "current_date", label: "Current Date" },
  { key: "company_name", label: "Company Name" }
];

export default function AiCreateTemplateModal({ open, onClose, onCreated, categories }: AiCreateTemplateModalProps) {
  const [step, setStep] = useState<"input" | "generating">("input");

  const [templateName, setTemplateName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlaceholders, setSelectedPlaceholders] = useState<string[]>(
    STANDARD_PLACEHOLDERS.map(p => p.key)
  );

  const [elapsed, setElapsed] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const LOADING_MESSAGES = [
    "Analyzing your requirements...",
    "Drafting the document structure...",
    "Injecting dynamic placeholders...",
    "Applying professional formatting...",
  ];

  useEffect(() => {
    if (step === "generating") {
      setElapsed(0);
      setMsgIdx(0);
      const start = Date.now();
      const intv = setInterval(() => {
        setElapsed((Date.now() - start) / 1000);
      }, 100);
      const msgIntv = setInterval(() => {
        setMsgIdx((idx) => (idx + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => {
        clearInterval(intv);
        clearInterval(msgIntv);
      };
    }
  }, [step]);

  useEffect(() => {
    if (open) {
      setStep("input");
      setTemplateName("");
      setCategoryId("");
      setDescription("");
      setSelectedPlaceholders(STANDARD_PLACEHOLDERS.map(p => p.key));
      setErrorMsg(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    setErrorMsg(null);
    if (!templateName.trim()) {
      message.error("Please provide a template name.");
      return;
    }
    if (!description.trim()) {
      message.error("Please provide a description of the template.");
      return;
    }

    setStep("generating");

    try {
      const template = await LettersService.generateTemplateWithZai({
        templateName: templateName.trim(),
        categoryId: categoryId || undefined,
        description: description.trim(),
        placeholders: selectedPlaceholders
      });

      message.success("Zai generated the template successfully!");
      onCreated(template.id);
    } catch (err: any) {
      const actualError = err.message || "Failed to generate template with Zai";
      if (actualError.includes("Failed to generate template") || actualError.includes("limit reached") || actualError.includes("quota")) {
        setErrorMsg("AI service limit reached. Please try again after some time.");
      } else {
        setErrorMsg(actualError);
      }
      setStep("input");
    }
  };

  const handleTogglePlaceholder = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedPlaceholders(prev => [...prev, key]);
    } else {
      setSelectedPlaceholders(prev => prev.filter(p => p !== key));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      destroyOnClose
      closeIcon={step === "generating" ? false : undefined}
      maskClosable={step !== "generating"}
      bodyStyle={{ padding: "32px 24px" }}
    >
      {step === "generating" ? (
        <>
          <style>{`
            @keyframes zai-orb-pulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(114, 46, 209, 0.4); }
              50% { transform: scale(1.05); box-shadow: 0 0 20px 8px rgba(114, 46, 209, 0.2); }
            }
            @keyframes zai-orb-spin { to { transform: rotate(360deg); } }
            @keyframes zai-bar {
              0%   { transform: translateX(-100%); }
              50%  { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
            @keyframes zai-fade-up {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes zai-dot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40%           { transform: scale(1);   opacity: 1; }
            }
          `}</style>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "56px 24px 48px",
              gap: 24,
              position: "relative",
            }}
          >
            {/* Orb with rotating conic gradient ring + pulsing core */}
            <div style={{ position: "relative", width: 96, height: 96 }}>
              <div
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background: `conic-gradient(from 0deg, ${PURPLE}, #c084fc, #3b0764, ${PURPLE})`,
                  animation: "zai-orb-spin 2.4s linear infinite",
                  filter: "blur(2px)",
                  opacity: 0.85,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${PURPLE} 0%, #3b0764 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  animation: "zai-orb-pulse 1.8s ease-in-out infinite",
                }}
              >
                <ThunderboltOutlined style={{ fontSize: 36 }} />
              </div>
            </div>

            {/* Rotating status text */}
            <div style={{ textAlign: "center", minHeight: 56 }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Zai is crafting your template...
              </Title>
              <div
                key={msgIdx}
                style={{
                  marginTop: 6,
                  fontSize: 13.5,
                  color: "var(--text-secondary, #64748b)",
                  animation: "zai-fade-up 0.45s ease-out both",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>{LOADING_MESSAGES[msgIdx]}</span>
                <span style={{ display: "inline-flex", gap: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: PURPLE,
                        display: "inline-block",
                        animation: `zai-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* Indeterminate progress bar */}
            <div
              style={{
                width: "min(420px, 80%)",
                height: 4,
                borderRadius: 999,
                background: "rgba(114,46,209,0.12)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "40%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, transparent 0%, ${PURPLE} 50%, transparent 100%)`,
                  animation: "zai-bar 1.6s ease-in-out infinite",
                }}
              />
            </div>

            <Text type="secondary" style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase" }}>
              {elapsed.toFixed(1)}s elapsed · powered by Gemini
            </Text>

            {elapsed > 10 && (
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  maxWidth: 360,
                  textAlign: "center",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(114,46,209,0.06)",
                  border: "1px dashed rgba(114,46,209,0.25)",
                }}
              >
                Taking a moment longer than usual — sometimes Gemini retries when busy. Hang tight, your template is on the way.
              </Text>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${PURPLE}15, ${PURPLE}40)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 24, color: PURPLE }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Create with Zai
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Generate professional HR & Business templates in seconds.
              </Text>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: "12px 16px", background: "var(--bg-red-50, #fef2f2)", border: "1px solid var(--border-red-200, #fecaca)", borderRadius: "8px", color: "var(--text-red-600, #dc2626)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⚠️</span> {errorMsg}
            </div>
          )}

          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Template Name <span style={{ color: "red" }}>*</span></div>
            <Input
              placeholder="e.g. Senior Software Engineer Offer Letter"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              size="large"
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Category</div>
            <Select
              style={{ width: "100%" }}
              size="large"
              placeholder="Select Category (Optional)"
              value={categoryId || undefined}
              onChange={val => setCategoryId(val)}
              allowClear
              options={categories.map(c => ({ label: c.categoryName, value: c.id, disabled: c.status === 'INACTIVE' }))}
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Available Placeholders</div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
              Select the data fields Zai should automatically include in the template.
            </Text>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {STANDARD_PLACEHOLDERS.map(p => (
                <Checkbox
                  key={p.key}
                  checked={selectedPlaceholders.includes(p.key)}
                  onChange={e => handleTogglePlaceholder(p.key, e.target.checked)}
                >
                  {p.label} <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{`{{${p.key}}}`}</Text>
                </Checkbox>
              ))}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Describe the template <span style={{ color: "red" }}>*</span></div>
            <TextArea
              placeholder="e.g. Write a formal promotion letter for an employee moving to a manager role. Mention their new CTC, department, and congratulate them."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: 14, resize: "none" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <Button onClick={onClose} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              style={{ background: PURPLE, display: "flex", alignItems: "center", gap: 8 }}
              onClick={handleGenerate}
              disabled={!templateName.trim() || !description.trim()}
              icon={<SendOutlined />}
            >
              Generate Template
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
