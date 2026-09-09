"use client";
import { message } from "@/providers/AntdGlobalProvider";


import React, { useState, useEffect } from "react";

import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Row, Col } from "antd";
import { ArrowLeftOutlined, CloseOutlined, PlusOutlined, EditOutlined, CheckOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader from "@/components/common/ZukvoLoader";

export default function EditTestCasePage() {
  useActivitySource({ section: "WORK", module: "QA", page: "EditTestCase" });

  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { canUpdateCase } = usePermission();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [stepsList, setStepsList] = useState<string[]>([]);
  const [newStepInput, setNewStepInput] = useState<string>("");
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState<string>("");

  const handleSaveStepEdit = () => {
    if (editingStepIndex === null) return;
    if (editingStepText.trim()) {
      const newSteps = [...stepsList];
      newSteps[editingStepIndex] = editingStepText.trim();
      setStepsList(newSteps);
      setFormData({ ...formData, steps_to_reproduce: JSON.stringify(newSteps) });
    }
    setEditingStepIndex(null);
    setEditingStepText("");
  };

  const handleCancelStepEdit = () => {
    setEditingStepIndex(null);
    setEditingStepText("");
  };

  const handleStepChange = (idx: number, val: string) => {
    const newSteps = [...stepsList];
    newSteps[idx] = val;
    setStepsList(newSteps);
    setFormData({ ...formData, steps_to_reproduce: JSON.stringify(newSteps) });
  };

  const addStep = () => {
    const newSteps = [...stepsList, ""];
    setStepsList(newSteps);
    setFormData({ ...formData, steps_to_reproduce: JSON.stringify(newSteps) });
  };

  const removeStep = (idx: number) => {
    const newSteps = stepsList.filter((_, i) => i !== idx);
    setStepsList(newSteps);
    setFormData({ ...formData, steps_to_reproduce: JSON.stringify(newSteps) });
  };

  const [formData, setFormData] = useState<any>({
    test_case_id: "",
    name: "",
    module_id: undefined,
    feature: "",
    description: "",
    preconditions: "",
    steps_to_reproduce: "[]",
    expected_result: "",
    priority: "Medium",
    severity: "Minor",
    test_type: undefined,
    automation: "Manual",
    status: "Draft"
  });

  useEffect(() => {
    if (canUpdateCase && id) {
      fetchDependenciesAndData();
    }
  }, [canUpdateCase, id]);

  const fetchDependenciesAndData = async () => {
    try {
      setLoading(true);
      const [modRes, tcRes] = await Promise.all([
        axios.get("/api/v2/qa/modules?limit=1000"),
        axios.get(`/api/v2/qa/${id}`)
      ]);
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
      
      const tc = tcRes?.data?.data || tcRes?.data || tcRes;
      if (tc) {
        let parsedSteps = [""];
        if (tc.steps_to_reproduce) {
          try {
            const p = JSON.parse(tc.steps_to_reproduce);
            if (Array.isArray(p) && p.length > 0) parsedSteps = p;
            else if (typeof tc.steps_to_reproduce === 'string' && tc.steps_to_reproduce.trim()) parsedSteps = [tc.steps_to_reproduce];
          } catch(e) {
            parsedSteps = [tc.steps_to_reproduce];
          }
        }
        setStepsList(parsedSteps);

        setFormData({
          test_case_id: tc.test_case_id || "",
          name: tc.name || "",
          module_id: tc.module_id || undefined,
          feature: tc.feature || "",
          description: tc.description || "",
          preconditions: tc.preconditions || "",
          steps_to_reproduce: tc.steps_to_reproduce || "[]",
          expected_result: tc.expected_result || "",
          priority: tc.priority || "Medium",
          severity: tc.severity || "Minor",
          test_type: tc.test_type || undefined,
          automation: tc.automation || "Manual",
          status: tc.status || "Draft"
        });
      }
    } catch (e) {
      message.error("Failed to load test case");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return message.error("Name is required");
    if (!formData.module_id) return message.error("Module is required");

    try {
      setSubmitting(true);

      let currentSteps = [...stepsList];
      if (editingStepIndex !== null && editingStepText.trim()) {
        currentSteps[editingStepIndex] = editingStepText.trim();
      }
      if (newStepInput?.trim()) {
        currentSteps.push(newStepInput.trim());
      }
      currentSteps = currentSteps.filter(s => s.trim() !== "");

      let payloadToSave = {
        ...formData,
        steps_to_reproduce: JSON.stringify(currentSteps)
      };

      try {
        const correctRes: any = await axios.post("/api/v2/qa/correct-spelling", {
          testCase: {
            name: formData.name,
            description: formData.description,
            preconditions: formData.preconditions,
            steps: currentSteps,
            expected_result: formData.expected_result
          }
        });
        const correctedData = correctRes?.data?.data?.[0];
        if (correctedData) {
          const finalSteps = Array.isArray(correctedData.steps) && correctedData.steps.length ? correctedData.steps : currentSteps;
          payloadToSave = {
            ...payloadToSave,
            name: correctedData.name || payloadToSave.name,
            description: correctedData.description !== undefined ? correctedData.description : payloadToSave.description,
            preconditions: correctedData.preconditions !== undefined ? correctedData.preconditions : payloadToSave.preconditions,
            steps_to_reproduce: JSON.stringify(finalSteps),
            expected_result: correctedData.expected_result !== undefined ? correctedData.expected_result : payloadToSave.expected_result
          };
        }
      } catch (e) {
        // Continue gracefully if AI is offline
      }

      await axios.put(`/api/v2/qa/${id}`, payloadToSave);
      message.success("Test Case updated successfully");
      router.push("/qa-workspace/test-cases");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to update test case");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canUpdateCase) return null;

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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-slate-900)' }}>Edit Test Case</h2>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="primary" onClick={handleSave} loading={submitting}>Save Changes</Button>
          </div>
        </div>

        {loading ? (
          <ZukvoLoader size="md" message="Loading the test case…" />
        ) : (
          <div className="pp-detail-card">
            <div className="pp-card-header">Test Case Details</div>
            <div className="pp-card-body">
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <span className="form-label">Test Case Name <span style={{ color: 'red' }}>*</span></span>
                  <Input placeholder="Example: Create Todo with valid data" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </Col>

                <Col span={12}>
                  <span className="form-label">Module <span style={{ color: 'red' }}>*</span></span>
                  <SearchableDropdown
                    options={moduleOptions}
                    value={formData.module_id}
                    onChange={v => setFormData({ ...formData, module_id: v })}
                    placeholder="Select Module"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Feature</span>
                  <Input placeholder="E.g. Login, File Upload" value={formData.feature} onChange={(e) => setFormData({ ...formData, feature: e.target.value })} />
                </Col>

                <Col span={24}>
                  <span className="form-label">Description (Optional)</span>
                  <Input.TextArea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief explanation of what is being tested."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Preconditions (Optional)</span>
                  <Input.TextArea 
                    value={formData.preconditions} 
                    onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                    placeholder="What should already exist before testing."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Steps To Reproduce</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stepsList.map((step, idx) => {
                      const isEditing = editingStepIndex === idx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-50)', color: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600 }}>
                            {idx + 1}
                          </div>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                              <Input
                                autoFocus
                                size="small"
                                value={editingStepText}
                                onChange={(e) => setEditingStepText(e.target.value)}
                                onPressEnter={(e) => {
                                  e.preventDefault();
                                  handleSaveStepEdit();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelStepEdit();
                                  }
                                }}
                                style={{ flex: 1, borderRadius: 6, fontSize: 13 }}
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<CheckOutlined style={{ color: '#16a34a', fontSize: 13 }} />}
                                onClick={handleSaveStepEdit}
                                title="Save step"
                                style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                              <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined style={{ color: '#dc2626', fontSize: 12 }} />}
                                onClick={handleCancelStepEdit}
                                title="Cancel"
                                style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              />
                            </div>
                          ) : (
                            <>
                              <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{step}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined style={{ fontSize: 13, color: 'var(--text-slate-500)' }} />}
                                  style={{ padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => {
                                    setEditingStepIndex(idx);
                                    setEditingStepText(step);
                                  }}
                                  title="Edit step"
                                />
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<CloseOutlined style={{ fontSize: 12 }} />}
                                  style={{ padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}
                                  onClick={() => {
                                    if (editingStepIndex === idx) {
                                      setEditingStepIndex(null);
                                      setEditingStepText("");
                                    }
                                    removeStep(idx);
                                  }}
                                  title="Remove step"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: stepsList.length > 0 ? 8 : 0, borderTop: stepsList.length > 0 ? '1px dashed var(--border-slate-200)' : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-slate-100)', color: 'var(--text-slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600 }}>
                        {stepsList.length + 1}
                      </div>
                      <Input
                        placeholder="Type a step and press Enter..."
                        value={newStepInput}
                        onChange={(e) => setNewStepInput(e.target.value)}
                        onPressEnter={() => {
                          if (newStepInput.trim()) {
                            const newSteps = [...stepsList, newStepInput.trim()];
                            setStepsList(newSteps);
                            setFormData({ ...formData, steps_to_reproduce: JSON.stringify(newSteps) });
                            setNewStepInput('');
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
                    value={formData.expected_result} 
                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                    placeholder="Expected outcome..."
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: 6 }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Priority</span>
                  <SearchableDropdown
                    options={[{ value: 'Critical', label: 'Critical' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]}
                    value={formData.priority}
                    onChange={v => setFormData({ ...formData, priority: v })}
                    placeholder="Select Priority"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Severity</span>
                  <SearchableDropdown
                    options={[{ value: 'Critical', label: 'Critical' }, { value: 'Major', label: 'Major' }, { value: 'Minor', label: 'Minor' }, { value: 'Cosmetic', label: 'Cosmetic' }]}
                    value={formData.severity}
                    onChange={v => setFormData({ ...formData, severity: v })}
                    placeholder="Select Severity"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Test Type</span>
                  <SearchableDropdown
                    options={[{ value: 'Functional', label: 'Functional' }, { value: 'Smoke', label: 'Smoke' }, { value: 'Regression', label: 'Regression' }, { value: 'Sanity', label: 'Sanity' }, { value: 'API', label: 'API' }, { value: 'UI', label: 'UI' }]}
                    value={formData.test_type || undefined}
                    onChange={v => setFormData({ ...formData, test_type: v })}
                    placeholder="Select Type"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={12}>
                  <span className="form-label">Automation</span>
                  <SearchableDropdown
                    options={[{ value: 'Manual', label: 'Manual' }, { value: 'Automated', label: 'Automated' }, { value: 'Planned', label: 'Planned' }]}
                    value={formData.automation}
                    onChange={v => setFormData({ ...formData, automation: v })}
                    placeholder="Automation Status"
                    style={{ width: '100%' }}
                  />
                </Col>

                <Col span={24}>
                  <span className="form-label">Status</span>
                  <SearchableDropdown
                    options={[{ value: 'Draft', label: 'Draft' }, { value: 'Ready', label: 'Ready' }, { value: 'Deprecated', label: 'Deprecated' }]}
                    value={formData.status}
                    onChange={v => setFormData({ ...formData, status: v })}
                    placeholder="Select Status"
                    style={{ width: '100%' }}
                  />
                </Col>

              </Row>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
