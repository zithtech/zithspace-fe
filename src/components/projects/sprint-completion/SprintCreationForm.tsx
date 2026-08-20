"use client";

import React, { useMemo, useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Typography,
  Tooltip,
} from "antd";
import {
  RocketOutlined,
  CalendarOutlined,
  FlagOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import TiptapEditor from "@/components/common/TiptapEditor";
import { SectionCard } from "@/components/common/DrawerSection";

const { Text } = Typography;

/** Strip HTML tags so we count/validate the goal by its visible text length. */
const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();

export interface SprintFormData {
  name: string;
  goal?: string;
  startDate: Dayjs;
  endDate: Dayjs;
}

interface SprintCreationFormProps {
  projectId: string;
  loading?: boolean;
  /** When true, the new sprint will be saved as a draft because another sprint is already active. */
  isDraft?: boolean;
  onSubmit: (data: SprintFormData) => Promise<void>;
  onCancel: () => void;
}

const DURATION_PRESETS: Array<{ label: string; value: string; weeks: number }> = [
  { label: "1 week", value: "1w", weeks: 1 },
  { label: "2 weeks", value: "2w", weeks: 2 },
  { label: "3 weeks", value: "3w", weeks: 3 },
  { label: "4 weeks", value: "4w", weeks: 4 },
];

const NAME_MAX = 100;
const GOAL_MAX = 500;

export function SprintCreationForm({
  loading = false,
  isDraft = false,
  onSubmit,
  onCancel,
}: SprintCreationFormProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Track values for live preview / counters.
  const nameValue = Form.useWatch("name", form) || "";
  const goalValue = Form.useWatch("goal", form) || "";
  const goalText = stripHtml(goalValue);
  const startDate = Form.useWatch("startDate", form) as Dayjs | undefined;
  const endDate = Form.useWatch("endDate", form) as Dayjs | undefined;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const goalHtml = values.goal || "";
      await onSubmit({
        name: values.name,
        goal: stripHtml(goalHtml).length > 0 ? goalHtml : "",
        startDate: values.startDate,
        endDate: values.endDate,
      });
    } catch (error) {
      console.error("Form validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (preset: typeof DURATION_PRESETS[number]) => {
    const start = (form.getFieldValue("startDate") as Dayjs | undefined) || dayjs();
    const end = start.add(preset.weeks, "week");
    form.setFieldsValue({ startDate: start, endDate: end });
    setActivePreset(preset.value);
  };

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const diff = endDate.startOf("day").diff(startDate.startOf("day"), "day");
    return diff >= 0 ? diff : null;
  }, [startDate, endDate]);

  // Work days = excludes Sat/Sun. Counts inclusive of both endpoints.
  const workingDays = useMemo(() => {
    if (!startDate || !endDate || !endDate.isAfter(startDate, "day") && !endDate.isSame(startDate, "day")) {
      return null;
    }
    let count = 0;
    let cursor = startDate.startOf("day");
    const stop = endDate.startOf("day");
    while (cursor.isBefore(stop) || cursor.isSame(stop, "day")) {
      const dow = cursor.day();
      if (dow !== 0 && dow !== 6) count += 1;
      cursor = cursor.add(1, "day");
      // Guard against runaway loops for absurd date ranges
      if (count > 5000) break;
    }
    return count;
  }, [startDate, endDate]);

  const inferredPreset = useMemo(() => {
    if (durationDays === null) return null;
    if (durationDays === 7) return "1w";
    if (durationDays === 14) return "2w";
    if (durationDays === 21) return "3w";
    if (durationDays === 28) return "4w";
    return null;
  }, [durationDays]);

  const effectivePreset = activePreset && activePreset === inferredPreset ? activePreset : inferredPreset;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--customers-page-bg, #0B0F1A)" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .customer-drawer-form .ant-input-affix-wrapper {
          border-radius: 8px !important;
          background: var(--bg-pure-white, #ffffff) !important;
          border: 1px solid var(--border-slate-300, #cbd5e1) !important;
          padding: 8px 12px !important;
          box-shadow: none !important;
        }
        .customer-drawer-form .ant-input-affix-wrapper input.ant-input {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .customer-drawer-form .ant-input-affix-wrapper:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        [data-theme='dark'] .customer-drawer-form .ant-input-affix-wrapper {
          background: transparent !important;
          border-color: #334155 !important;
        }
      `}} />
      {/* Header */}
      <div
        className="customer-drawer-header"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-color, #e2e8f0)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-pure-white, #ffffff)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "rgba(59, 130, 246, 0.10)",
              color: "var(--premium-blue, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <RocketOutlined />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-slate-900, #0f172a)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              Plan a new sprint
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500, #64748b)", fontWeight: 500 }}>
              Set a clear goal and timeline. Adjust scope later from the backlog.
            </div>
          </div>
        </div>
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined />}
          onClick={onCancel}
          style={{ color: "var(--text-slate-500)" }}
        />
      </div>

      {/* Form Content */}
      <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          colon={false}
          className="customer-drawer-form"
        >
          {/* Section 1: Details */}
          <SectionCard
            step="STEP 1"
            icon={<FlagOutlined />}
            title="Sprint details"
            subtitle="Define the sprint name and core goal"
          >
            <Form.Item
              label={
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingRight: 8 }}>
                  <span>Sprint name</span>
                </div>
              }
              name="name"
              rules={[
                { required: true, message: "Sprint name is required" },
                { max: NAME_MAX, message: `Name must be ${NAME_MAX} characters or fewer` },
              ]}
            >
              <Input
                placeholder="e.g. Sprint 6 — Onboarding polish"
                maxLength={NAME_MAX}
                suffix={
                  <span style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                    {nameValue.length}/{NAME_MAX}
                  </span>
                }
              />
            </Form.Item>

            <Form.Item
              label={
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Sprint goal</span>
                  <Tooltip title="A short statement that explains what success looks like for this sprint.">
                    <InfoCircleOutlined style={{ color: "var(--text-slate-400)", cursor: "pointer" }} />
                  </Tooltip>
                </div>
              }
              name="goal"
              valuePropName="content"
              trigger="onChange"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              rules={[
                {
                  validator: (_rule, value: string | undefined) =>
                    stripHtml(value || "").length > GOAL_MAX
                      ? Promise.reject(new Error(`Goal must be ${GOAL_MAX} characters or fewer`))
                      : Promise.resolve(),
                },
              ]}
            >
              <div>
                <TiptapEditor
                  placeholder="What outcome would make this sprint a clear win?"
                  minHeight={92}
                  maxHeight={200}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: goalText.length > GOAL_MAX ? "#ff4d4f" : "var(--text-slate-400)", marginTop: 4 }}>
                  {goalText.length}/{GOAL_MAX}
                </div>
              </div>
            </Form.Item>
          </SectionCard>

          {/* Section 2: Timeline */}
          <SectionCard
            step="STEP 2"
            icon={<CalendarOutlined />}
            title="Timeline"
            subtitle="Set duration and target dates"
          >
            <Form.Item label="Duration">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DURATION_PRESETS.map((preset) => {
                  const isActive = effectivePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      className={`scf-preset ${isActive ? "is-active" : ""}`}
                      onClick={() => applyPreset(preset)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: isActive ? "1px solid var(--premium-blue, #3b82f6)" : "1px solid var(--border-slate-300, #cbd5e1)",
                        background: isActive ? "rgba(59, 130, 246, 0.08)" : "transparent",
                        color: isActive ? "var(--premium-blue, #3b82f6)" : "var(--text-slate-700, #475569)",
                        fontWeight: isActive ? 600 : 500,
                        cursor: "pointer",
                        fontSize: 13
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </Form.Item>

            <Form.Item
              label="Start Date"
              name="startDate"
              rules={[{ required: true, message: "Start date is required" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Pick a start"
              />
            </Form.Item>

            <Form.Item
              label="End Date"
              name="endDate"
              rules={[
                { required: true, message: "End date is required" },
                {
                  validator: (_rule, value: Dayjs | undefined) => {
                    const start = form.getFieldValue("startDate") as Dayjs | undefined;
                    if (start && value && value.isBefore(start, "day")) {
                      return Promise.reject(new Error("End must be after start"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Pick an end"
              />
            </Form.Item>

            {startDate && endDate && durationDays !== null && (
              <div style={{ paddingLeft: "33.333%", display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                <div className="scf-timeline-preview" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="scf-timeline-preview__chip" style={{ background: "rgba(59, 130, 246, 0.08)", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "var(--premium-blue)" }}>
                    {startDate.format("ddd, MMM D")}
                  </span>
                  <span className="scf-timeline-preview__bar" style={{ flex: 1, height: 2, background: "var(--border-slate-200, #e2e8f0)" }} />
                  <span className="scf-timeline-preview__duration" style={{ fontSize: 12, fontWeight: 600 }}>
                    {durationDays} day{durationDays === 1 ? "" : "s"}
                  </span>
                  <span className="scf-timeline-preview__bar" style={{ flex: 1, height: 2, background: "var(--border-slate-200, #e2e8f0)" }} />
                  <span className="scf-timeline-preview__chip" style={{ background: "rgba(59, 130, 246, 0.08)", padding: "4px 8px", borderRadius: 4, fontSize: 12, color: "var(--premium-blue)" }}>
                    {endDate.format("ddd, MMM D")}
                  </span>
                </div>
                {workingDays !== null && (
                  <div className="scf-timeline-meta" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-slate-500)" }}>
                    <CalendarOutlined style={{ fontSize: 11 }} />
                    <span>
                      <b>{workingDays}</b> working day{workingDays === 1 ? "" : "s"} · weekends excluded
                    </span>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </Form>
      </div>

      {/* Footer */}
      <div
        className="customer-drawer-footer"
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--border-color, #e2e8f0)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          bottom: 0,
          background: "var(--bg-pure-white, #ffffff)",
          gap: 16
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-slate-500)", flex: 1, minWidth: 0 }}>
          {isDraft
            ? "This sprint will be saved as a draft alongside your active sprint."
            : "This sprint will become your active sprint immediately."}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button onClick={onCancel} disabled={submitting || loading} style={{ borderRadius: 6, height: 38, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting || loading}
            icon={<RocketOutlined />}
            style={{ borderRadius: 6, height: 38, fontWeight: 600 }}
          >
            {isDraft ? "Save Draft Sprint" : "Launch Sprint"}
          </Button>
        </div>
      </div>
    </div>
  );
}
