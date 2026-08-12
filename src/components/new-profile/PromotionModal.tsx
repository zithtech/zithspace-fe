import React, { useState, useEffect } from "react";
import { Modal, Form, Select, DatePicker, message, ConfigProvider, theme as antdTheme } from "antd";
import { api } from "@/lib/axios";
import { useTheme } from "@/context/ThemeContext";
import { TrendingUp, Briefcase, CalendarDays } from "lucide-react";

interface PromotionModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  employeeId: string;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  employeeId,
}) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [subDepartments, setSubDepartments] = useState<any[]>([]);

  // Derived colors
  const surface   = dark ? "#0d1117" : "#ffffff";
  const border    = dark ? "#1e2d40" : "#e2e8f0";
  const textPrimary   = dark ? "#e6e8ee" : "#1e293b";
  const textSecondary = dark ? "#7a8ba0" : "#64748b";
  const infoBg    = dark ? "rgba(99,102,241,0.12)" : "#eff6ff";
  const infoBorder= dark ? "rgba(99,102,241,0.35)" : "#c7d2fe";
  const infoText  = dark ? "#a5b4fc" : "#4338ca";
  const cardBg    = dark ? "#111827" : "#ffffff";
  const cancelBg  = dark ? "#1e2d40" : "#ffffff";
  const cancelText= dark ? "#94a3b8" : "#64748b";
  const cancelBorder = dark ? "#2d3f55" : "#e2e8f0";

  useEffect(() => {
    if (visible) {
      api
        .get("/api/positions")
        .then((res: any) => {
          const data = res?.data?.data || res?.data || res || [];
          setPositions(Array.isArray(data) ? data : []);
        })
        .catch(() => message.error("Failed to load positions."));
      api
        .get("/api/sub-departments")
        .then((res: any) => {
          const data = res?.data?.data || res?.data || res || [];
          setSubDepartments(Array.isArray(data) ? data : []);
        })
        .catch(() => message.error("Failed to load sub-departments."));
    } else {
      form.resetFields();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await api.post(`/api/onboarding/${employeeId}/promote`, {
        positionId: values.positionId,
        subDepartmentId: values.subDepartmentId,
        promotionDate: values.promotionDate.format("YYYY-MM-DD"),
      });
      message.success("Employee promoted successfully!");
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Promotion failed:", error);
      message.error("Failed to promote employee. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      width={460}
      destroyOnClose
      footer={null}
      styles={{
        mask: { backdropFilter: "blur(6px)", background: dark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.35)" },
        content: { borderRadius: 20, overflow: "hidden", padding: 0, background: surface, border: `1px solid ${border}`, boxShadow: dark ? "0 30px 80px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.15)" },
        body: { padding: 0 },
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgContainer: dark ? "#111827" : "#ffffff",
            colorText: textPrimary,
            colorBorder: border,
          },
        }}
      >
        {/* Header Banner */}
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          padding: "26px 28px 22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, right: 60, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13,
              background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1.5px solid rgba(255,255,255,0.3)",
            }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Promote Employee</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 }}>Select a new position and set the effective date</div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px 28px 20px", background: surface }}>
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              label={
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, color: textPrimary }}>
                  <Briefcase size={13} color="#6366f1" /> New Position
                </span>
              }
              name="positionId"
              rules={[{ required: true, message: "Please select a new position" }]}
              style={{ marginBottom: 18 }}
            >
              <Select
                placeholder="Search and select a position…"
                showSearch
                optionFilterProp="label"
                size="large"
                style={{ borderRadius: 10 }}
                options={positions.map((p) => ({ label: p.title, value: p.id }))}
                popupClassName={dark ? "dark-select-popup" : ""}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, color: textPrimary }}>
                  <Briefcase size={13} color="#6366f1" /> Sub-Department
                </span>
              }
              name="subDepartmentId"
              rules={[{ required: true, message: "Please select a sub-department" }]}
              style={{ marginBottom: 18 }}
            >
              <Select
                placeholder="Search and select a sub-department…"
                showSearch
                optionFilterProp="label"
                size="large"
                style={{ borderRadius: 10 }}
                options={subDepartments.map((sd) => ({ label: sd.name || sd.title, value: sd.id }))}
                popupClassName={dark ? "dark-select-popup" : ""}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, color: textPrimary }}>
                  <CalendarDays size={13} color="#6366f1" /> Promotion Date
                </span>
              }
              name="promotionDate"
              rules={[{ required: true, message: "Please select the promotion date" }]}
              style={{ marginBottom: 20 }}
            >
              <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD MMM YYYY" placeholder="Select effective date" />
            </Form.Item>
          </Form>

          {/* Info callout */}
          <div style={{
            background: infoBg, border: `1px solid ${infoBorder}`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 22,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <TrendingUp size={13} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: infoText, lineHeight: 1.6 }}>
              The previous role will be preserved in the Org History timeline up to the selected promotion date.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "9px 20px", borderRadius: 10,
                border: `1.5px solid ${cancelBorder}`,
                background: cancelBg, cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: cancelText,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "9px 24px", borderRadius: 10, border: "none",
                background: loading ? "#a5b4fc" : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <TrendingUp size={14} />
              {loading ? "Saving…" : "Confirm Promotion"}
            </button>
          </div>
        </div>
      </ConfigProvider>
    </Modal>
  );
};
