"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Row, Col, message } from "antd";
import { ArrowLeftOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

interface TestCaseForm {
  name: string;
  description: string;
  preconditions: string;
  stepsList: string[];
  newStepInput?: string;
  expected_result: string;
  priority: string;
  severity: string;
  test_type?: string;
  automation: string;
  status: string;
}

const defaultTestCase: TestCaseForm = {
  name: "",
  description: "",
  preconditions: "",
  stepsList: [],
  newStepInput: "",
  expected_result: "",
  priority: "Medium",
  severity: "Minor",
  test_type: undefined,
  automation: "Manual",
  status: "Draft",
};

export default function CreateTestCasePage() {
  useActivitySource({ section: "WORK", module: "QA", page: "CreateTestCase" });

  const router = useRouter();
  const { canCreateCase } = usePermission();

  const [submitting, setSubmitting] = useState(false);
  const [modules, setModules] = useState<any[]>([]);

  // Root level shared fields
  const [moduleId, setModuleId] = useState<string | undefined>(undefined);
  const [feature, setFeature] = useState<string>("");

  // Array of test cases
  const [testCases, setTestCases] = useState<TestCaseForm[]>([{ ...defaultTestCase }]);

  useEffect(() => {
    if (canCreateCase) {
      fetchDependencies();
    }
  }, [canCreateCase]);

  const fetchDependencies = async () => {
    try {
      const [modRes] = await Promise.all([
        axios.get("/api/v2/qa/modules")
      ]);
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (e) {
      console.error(e);
    }
  };

  const updateTestCase = (index: number, field: keyof TestCaseForm, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleStepChange = (tcIndex: number, stepIndex: number, val: string) => {
    const updated = [...testCases];
    updated[tcIndex].stepsList[stepIndex] = val;
    setTestCases(updated);
  };

  const addStep = (tcIndex: number) => {
    const updated = [...testCases];
    updated[tcIndex].stepsList.push("");
    setTestCases(updated);
  };

  const removeStep = (tcIndex: number, stepIndex: number) => {
    const updated = [...testCases];
    updated[tcIndex].stepsList = updated[tcIndex].stepsList.filter((_, i) => i !== stepIndex);
    setTestCases(updated);
  };

  const addAnotherTestCase = () => {
    setTestCases([...testCases, { ...defaultTestCase, stepsList: [""] }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length === 1) return;
    const updated = testCases.filter((_, i) => i !== index);
    setTestCases(updated);
  };

  const handleSaveAll = async () => {
    if (!moduleId) return message.error("Module is required");
    
    // Validate all test cases have a name
    for (let i = 0; i < testCases.length; i++) {
      if (!testCases[i].name.trim()) {
        return message.error(`Test Case ${i + 1} is missing a name.`);
      }
    }

    try {
      setSubmitting(true);
      
      const promises = testCases.map(tc => {
        const payload = {
          name: tc.name,
          module_id: moduleId,
          feature: feature,
          description: tc.description,
          preconditions: tc.preconditions,
          steps_to_reproduce: JSON.stringify(tc.stepsList.filter(s => s.trim() !== "")),
          expected_result: tc.expected_result,
          priority: tc.priority,
          severity: tc.severity,
          test_type: tc.test_type,
          automation: tc.automation,
          status: tc.status
        };
        return axios.post("/api/v2/qa", payload);
      });

      await Promise.all(promises);
      message.success(`${testCases.length} Test Case(s) created successfully`);
      router.push("/qa-workspace/test-cases");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to create test cases");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreateCase) return null;

  const moduleOptions = modules.map(m => ({
    value: m.id,
    label: m.module_name || m.name
  }));

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
          margin-bottom: 24px;
        }
        .pp-card-header {
          background: var(--bg-slate-50);
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-slate-800);
          border-bottom: 1px solid var(--border-slate-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .pp-card-body {
          padding: 24px;
        }
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-slate-600);
        }
        .create-scope-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .create-scope-container input.ant-input:not(.ant-input-sm),
        .create-scope-container .ant-picker,
        .create-scope-container .sd-trigger {
          min-height: 40px !important;
          height: 40px !important;
          display: flex;
          align-items: center;
        }
        .create-scope-container textarea.ant-input {
          min-height: 80px;
        }
      `}} />

      <div className="create-scope-container">
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-slate-900)' }}>Create Test Cases</h2>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={() => router.back()} disabled={submitting}>Cancel</Button>
            <Button type="primary" onClick={handleSaveAll} loading={submitting}>Save All Test Cases</Button>
          </div>
        </div>

        {/* Global Module / Feature Selection */}
        <div className="pp-detail-card" style={{ border: '1px solid var(--border-slate-200)', background: 'var(--bg-slate-50)', marginBottom: 32 }}>
          <div className="pp-card-header" style={{ borderBottom: '1px solid var(--border-slate-200)' }}>
            <span style={{ fontSize: 16, color: 'var(--text-slate-900)' }}>Configuration</span>
          </div>
          <div className="pp-card-body">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <span className="form-label">Module <span style={{ color: 'red' }}>*</span></span>
                <SearchableDropdown
                  options={moduleOptions}
                  value={moduleId}
                  onChange={v => setModuleId(v)}
                  placeholder="Select Module"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <span className="form-label">Feature</span>
                <Input placeholder="E.g. Login, File Upload" value={feature} onChange={(e) => setFeature(e.target.value)} />
              </Col>
            </Row>
          </div>
        </div>

        {/* Array of Test Cases */}
        {testCases.map((tc, tcIndex) => (
          <div key={tcIndex} className="pp-detail-card" style={{ position: 'relative' }}>
            <div className="pp-card-header">
              <span>Test Case {tcIndex + 1}</span>
              {testCases.length > 1 && (
                <Button type="text" danger icon={<CloseOutlined />} size="small" onClick={() => removeTestCase(tcIndex)}>Remove</Button>
              )}
            </div>
            <div className="pp-card-body">
              <Row gutter={[24, 24]}>
                
                <Col span={24}>
                  <span className="form-label">Test Case Name <span style={{ color: 'red' }}>*</span></span>
                  <Input placeholder="Example: Create Todo with valid data" value={tc.name} onChange={(e) => updateTestCase(tcIndex, 'name', e.target.value)} />
                </Col>

                <Col span={24}>
                  <span className="form-label">Description (Optional)</span>
                  <Input.TextArea 
                    value={tc.description} 
                    onChange={(e) => updateTestCase(tcIndex, 'description', e.target.value)}
                    placeholder="Brief explanation of what is being tested."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Preconditions (Optional)</span>
                  <Input.TextArea 
                    value={tc.preconditions} 
                    onChange={(e) => updateTestCase(tcIndex, 'preconditions', e.target.value)}
                    placeholder="What should already exist before testing."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Steps To Reproduce</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tc.stepsList.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-50)', color: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600 }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{step}</span>
                        <Button
                          type="text"
                          size="small"
                          danger
                          style={{ padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.5 }}
                          onClick={() => removeStep(tcIndex, idx)}
                        >×</Button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: tc.stepsList.length > 0 ? 8 : 0, borderTop: tc.stepsList.length > 0 ? '1px dashed var(--border-slate-200)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-slate-100)', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600 }}>
                        {tc.stepsList.length + 1}
                      </div>
                      <Input
                        placeholder="Type a step and press Enter..."
                        value={tc.newStepInput || ''}
                        onChange={(e) => updateTestCase(tcIndex, 'newStepInput', e.target.value)}
                        onPressEnter={() => {
                          if (tc.newStepInput?.trim()) {
                            const updated = [...testCases];
                            updated[tcIndex].stepsList.push(tc.newStepInput.trim());
                            updated[tcIndex].newStepInput = '';
                            setTestCases(updated);
                          }
                        }}
                        style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                        variant="borderless"
                      />
                    </div>
                  </div>
                </Col>

                <Col span={24}>
                  <span className="form-label">Expected Result</span>
                  <Input.TextArea 
                    value={tc.expected_result} 
                    onChange={(e) => updateTestCase(tcIndex, 'expected_result', e.target.value)}
                    placeholder="Expected outcome..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Priority</span>
                  <SearchableDropdown
                    options={[{ value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]}
                    value={tc.priority}
                    onChange={v => updateTestCase(tcIndex, 'priority', v)}
                    placeholder="Select Priority"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Severity</span>
                  <SearchableDropdown
                    options={[{ value: 'Critical', label: 'Critical' }, { value: 'Major', label: 'Major' }, { value: 'Minor', label: 'Minor' }, { value: 'Cosmetic', label: 'Cosmetic' }]}
                    value={tc.severity}
                    onChange={v => updateTestCase(tcIndex, 'severity', v)}
                    placeholder="Select Severity"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Test Type</span>
                  <SearchableDropdown
                    options={[{ value: 'Functional', label: 'Functional' }, { value: 'Smoke', label: 'Smoke' }, { value: 'Regression', label: 'Regression' }, { value: 'Sanity', label: 'Sanity' }, { value: 'API', label: 'API' }, { value: 'UI', label: 'UI' }]}
                    value={tc.test_type || undefined}
                    onChange={v => updateTestCase(tcIndex, 'test_type', v)}
                    placeholder="Select Type"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Automation</span>
                  <SearchableDropdown
                    options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automated', label: 'Automated' }, { value: 'Planned', label: 'Planned' }]}
                    value={tc.automation}
                    onChange={v => updateTestCase(tcIndex, 'automation', v)}
                    placeholder="Automation Status"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Status</span>
                  <SearchableDropdown
                    options={[{ value: 'Draft', label: 'Draft' }, { value: 'Ready', label: 'Ready' }, { value: 'Deprecated', label: 'Deprecated' }]}
                    value={tc.status}
                    onChange={v => updateTestCase(tcIndex, 'status', v)}
                    placeholder="Select Status"
                    style={{ width: '100%' }}
                  />
                </Col>

              </Row>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <Button type="dashed" onClick={addAnotherTestCase} icon={<PlusOutlined />} style={{ width: '100%', height: 50, fontSize: 16, fontWeight: 600, color: 'var(--brand-500)', borderColor: 'var(--brand-500)' }}>
            + Add Another Test Case
          </Button>
        </div>

      </div>
    </MainLayout>
  );
}
