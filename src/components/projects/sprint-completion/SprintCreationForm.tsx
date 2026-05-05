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
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Text } = Typography;

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
  const startDate = Form.useWatch("startDate", form) as Dayjs | undefined;
  const endDate = Form.useWatch("endDate", form) as Dayjs | undefined;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      await onSubmit({
        name: values.name,
        goal: values.goal || "",
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
    <div className="sprint-creation-form">
      {/* Hero header */}
      <div className="scf-hero">
        <div className="scf-hero__icon">
          <RocketOutlined />
        </div>
        <div className="scf-hero__copy">
          <div className="scf-hero__title">Plan a new sprint</div>
          <div className="scf-hero__subtitle">
            Set a clear goal and timeline. You can always adjust scope later from the backlog.
          </div>
        </div>
        <div className={`scf-hero__badge ${isDraft ? "is-draft" : "is-active"}`}>
          <span className="scf-hero__dot" />
          {isDraft ? "Draft" : "Will go live"}
        </div>
      </div>

      <Form form={form} layout="vertical" requiredMark={false} className="scf-form">
        {/* Section: Details */}
        <div className="scf-section">
          <div className="scf-section__head">
            <FlagOutlined className="scf-section__icon" />
            <span className="scf-section__title">Sprint details</span>
          </div>

          <Form.Item
            label={
              <div className="scf-label">
                <span>Sprint name</span>
                <span className="scf-counter">
                  {nameValue.length}/{NAME_MAX}
                </span>
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
              size="large"
              autoFocus
              maxLength={NAME_MAX}
              className="scf-input"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="scf-label">
                <span>
                  Sprint goal
                  <Tooltip title="A short statement that explains what success looks like for this sprint.">
                    <InfoCircleOutlined className="scf-label__hint" />
                  </Tooltip>
                </span>
                <span className="scf-counter">
                  {goalValue.length}/{GOAL_MAX}
                </span>
              </div>
            }
            name="goal"
            rules={[{ max: GOAL_MAX, message: `Goal must be ${GOAL_MAX} characters or fewer` }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="What outcome would make this sprint a clear win?"
              maxLength={GOAL_MAX}
              className="scf-textarea"
              style={{ resize: "none" }}
            />
          </Form.Item>
        </div>

        {/* Section: Timeline */}
        <div className="scf-section">
          <div className="scf-section__head">
            <CalendarOutlined className="scf-section__icon" />
            <span className="scf-section__title">Timeline</span>
            {durationDays !== null && (
              <span className="scf-section__meta">
                <ThunderboltOutlined /> {durationDays} day{durationDays === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Duration chips */}
          <div className="scf-presets">
            {DURATION_PRESETS.map((preset) => {
              const isActive = effectivePreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  className={`scf-preset ${isActive ? "is-active" : ""}`}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="scf-dates">
            <Form.Item
              label="Start"
              name="startDate"
              rules={[{ required: true, message: "Start date is required" }]}
              className="scf-date-item"
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                className="scf-date"
                placeholder="Pick a start"
              />
            </Form.Item>

            <div className="scf-dates__arrow" aria-hidden>
              <ArrowRightOutlined />
            </div>

            <Form.Item
              label="End"
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
              className="scf-date-item"
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                className="scf-date"
                placeholder="Pick an end"
              />
            </Form.Item>
          </div>

          {startDate && endDate && durationDays !== null && (
            <div className="scf-timeline-preview">
              <span className="scf-timeline-preview__chip">
                {startDate.format("ddd, MMM D")}
              </span>
              <span className="scf-timeline-preview__bar" />
              <span className="scf-timeline-preview__duration">
                {durationDays} day{durationDays === 1 ? "" : "s"}
              </span>
              <span className="scf-timeline-preview__bar" />
              <span className="scf-timeline-preview__chip">
                {endDate.format("ddd, MMM D")}
              </span>
            </div>
          )}
        </div>
      </Form>

      <div className="scf-footer">
        <Text type="secondary" className="scf-footer__hint">
          {isDraft
            ? "This sprint will be saved as a draft alongside your active sprint."
            : "This sprint will become your active sprint immediately."}
        </Text>
        <div className="scf-footer__actions">
          <Button onClick={onCancel} disabled={submitting || loading} className="scf-btn-ghost">
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting || loading}
            icon={<RocketOutlined />}
            className="scf-btn-primary"
          >
            {isDraft ? "Save Draft Sprint" : "Launch Sprint"}
          </Button>
        </div>
      </div>
    </div>
  );
}
