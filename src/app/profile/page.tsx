"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Input,
  Button,
  Form,
  Avatar,
  Spin,
  Tooltip,
  Modal,
  Slider,
  message,
} from "antd";
import Cropper from "react-easy-crop";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  IdcardOutlined,
  CameraOutlined,
  KeyOutlined,
  LogoutOutlined,
  CheckCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  ApartmentOutlined,
  GlobalOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  AuthService,
  UpdateProfileData,
  UserProfile,
} from "@/services/authService";
import { ApiError } from "@/lib/axios";

const { Text } = Typography;

// Neutral, product-standard palette (matches the payroll/settings look).
const BLUE = "#3B82F6";
const BLUE_TINT = "rgba(59,130,246,0.10)";
const GREEN = "#10B981";
const GREEN_TINT = "rgba(16,185,129,0.10)";

// Role badge — neutral slate chip (no per-role brand colors).
const ROLE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  super_admin: { label: "Super Admin", icon: <CrownOutlined /> },
  admin: { label: "Admin", icon: <SafetyCertificateOutlined /> },
  user: { label: "User", icon: <IdcardOutlined /> },
};

interface ProfileFormData {
  name: string;
  phone: string;
  personalEmail: string;
  workEmail: string;
  dateOfBirth: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type TabKey = "profile" | "security";

const passwordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: "Empty", color: "#cbd5e1" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "Too short", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#f59e0b" },
    { label: "Good", color: "#10b981" },
    { label: "Strong", color: "#059669" },
    { label: "Excellent", color: "#3b82f6" },
  ];
  const idx = Math.min(score, map.length - 1);
  return { score, label: map[idx].label, color: map[idx].color };
};

// ─── Section card (mirrors the payroll General Settings look) ───────────────
function SectionCard({
  icon,
  tint,
  color,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pp-card">
      <div className="pp-card-head">
        <div className="pp-card-chip" style={{ background: tint, color }}>
          {icon}
        </div>
        <div>
          <div className="pp-card-title">{title}</div>
          <div className="pp-card-sub">{subtitle}</div>
        </div>
      </div>
      <div className="pp-card-body">{children}</div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Image editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Password visibility hint via Form.useWatch
  const newPwd = Form.useWatch("newPassword", passwordForm) || "";
  const strength = useMemo(() => passwordStrength(newPwd), [newPwd]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = await AuthService.getProfile();
        setUserProfile(data);
        profileForm.setFieldsValue({
          name: data.name || "",
          phone: data.phone || "",
          personalEmail: data.personalEmail || "",
          workEmail: data.workEmail || "",
          dateOfBirth: data.dateOfBirth
            ? dayjs(data.dateOfBirth).format("YYYY-MM-DD")
            : "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        message.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, profileForm]);

  const handleProfileSubmit = async (values: ProfileFormData) => {
    try {
      setProfileLoading(true);
      const updateData: UpdateProfileData = {
        name: values.name,
        phone: values.phone,
        personalEmail: values.personalEmail,
        workEmail: values.workEmail,
        dateOfBirth: values.dateOfBirth || null,
      };
      const updatedProfile = await AuthService.updateProfile(updateData);
      message.success("Profile updated successfully");
      setUserProfile(updatedProfile);
      if (updateUser) {
        updateUser({
          name: updatedProfile.name,
          personalEmail: updatedProfile.personalEmail,
          workEmail: updatedProfile.workEmail,
          phone: updatedProfile.phone,
        });
      }
    } catch (err) {
      console.error(err);
      message.error(
        err instanceof ApiError ? err.message : "Failed to update profile",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormData) => {
    try {
      setPasswordLoading(true);
      await AuthService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success("Password updated successfully");
      passwordForm.resetFields();
    } catch (err) {
      console.error(err);
      message.error(
        err instanceof ApiError ? err.message : "Failed to update password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Image crop logic
  const onCropComplete = (_: any, pixels: any) => setCroppedAreaPixels(pixels);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (e) => reject(e));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const handleImageUpload = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    try {
      setUploadingImage(true);
      const image = await createImage(selectedImage);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      const updated = await AuthService.updateProfile({
        name: userProfile?.name || "",
        phone: userProfile?.phone || "",
        personalEmail: userProfile?.personalEmail || "",
        workEmail: userProfile?.workEmail || "",
        avatarUrl: base64,
      });
      setUserProfile(updated);
      message.success("Avatar updated");
      setIsEditorOpen(false);
      if (updateUser) {
        updateUser({ ...user, avatarUrl: updated.avatarUrl } as any);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to update avatar");
    } finally {
      setUploadingImage(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
        setIsEditorOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  // Profile completion
  const completion = useMemo(() => {
    if (!userProfile) return 0;
    const fields = [
      userProfile.name,
      userProfile.phone,
      userProfile.personalEmail,
      userProfile.workEmail,
      userProfile.dateOfBirth,
      userProfile.avatarUrl,
      userProfile.position?.title,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [userProfile]);

  if (loading) {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" tip="Loading your profile..." />
        </div>
      </MainLayout>
    );
  }

  const role = userProfile?.role || "user";
  const roleMeta = ROLE_META[role] || ROLE_META.user;

  return (
    <MainLayout>
      <div className="pp-page">
        {/* ============================ HEADER ============================ */}
        <div className="pp-header">
          <div className="pp-head-chip" style={{ background: BLUE_TINT, color: BLUE }}>
            <UserOutlined style={{ fontSize: 20 }} />
          </div>
          <div className="pp-head-text">
            <div className="pp-head-title">My Profile</div>
            <div className="pp-head-sub">Manage your information and security</div>
          </div>
          <div className="pp-head-actions">
            <Button danger icon={<LogoutOutlined />} onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="pp-body">
          {/* ---------------------- IDENTITY CARD ---------------------- */}
          <section className="pp-card pp-identity">
            <div className="pp-identity-main">
              <div className="pp-avatar-wrap">
                <Avatar
                  size={60}
                  src={userProfile?.avatarUrl}
                  style={{
                    background: BLUE_TINT,
                    color: BLUE,
                    fontSize: 22,
                    fontWeight: 700,
                    border: "1px solid var(--border-slate-200)",
                  }}
                >
                  {!userProfile?.avatarUrl &&
                    userProfile?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <input
                  type="file"
                  id="avatar-upload"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={onFileChange}
                />
                <Tooltip title="Update profile photo">
                  <label htmlFor="avatar-upload" className="pp-camera-btn">
                    <CameraOutlined />
                  </label>
                </Tooltip>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pp-identity-name-row">
                  <div className="pp-identity-name">
                    {userProfile?.name || user?.name}
                  </div>
                  <span className="pp-role-chip">
                    {roleMeta.icon}
                    {roleMeta.label.toUpperCase()}
                  </span>
                </div>

                <div className="pp-identity-meta">
                  <span>
                    <ApartmentOutlined />
                    {userProfile?.position?.title || "—"}
                  </span>
                  <span>
                    <MailOutlined />
                    {userProfile?.workEmail || "—"}
                  </span>
                  <span>
                    <CalendarOutlined />
                    Joined{" "}
                    {userProfile?.createdAt
                      ? dayjs(userProfile.createdAt).format("MMM D, YYYY")
                      : "—"}
                  </span>
                  <span className={userProfile?.isActive ? "pp-active" : ""}>
                    <span
                      className="pp-status-dot"
                      style={{
                        background: userProfile?.isActive ? GREEN : "#94a3b8",
                      }}
                    />
                    {userProfile?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Completion */}
            <div className="pp-completion">
              <div className="pp-completion-top">
                <span className="pp-completion-label">Profile Completion</span>
                <span className="pp-completion-pct">{completion}%</span>
              </div>
              <div className="pp-progress">
                <div className="pp-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <span className="pp-completion-note">
                {completion >= 85
                  ? "Your profile looks great!"
                  : "Add more details to complete your profile."}
              </span>
            </div>
          </section>

          {/* ---------------------- TABS ---------------------- */}
          <div className="pp-tabs">
            <button
              className={`pp-tab${activeTab === "profile" ? " active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <UserOutlined />
              <span>Personal Info</span>
            </button>
            <button
              className={`pp-tab${activeTab === "security" ? " active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <KeyOutlined />
              <span>Security</span>
            </button>
          </div>

          {/* ---------------------- CONTENT ---------------------- */}
          {activeTab === "profile" ? (
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSubmit}
              requiredMark={false}
            >
              <div className="pp-sections">
                <SectionCard
                  icon={<UserOutlined />}
                  tint={BLUE_TINT}
                  color={BLUE}
                  title="Personal Information"
                  subtitle="Editable by you"
                >
                  <div className="pp-info-grid">
                    <Form.Item
                      name="name"
                      label="Full name"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input
                        placeholder="Your full name"
                        prefix={<UserOutlined style={{ color: "var(--text-slate-400)" }} />}
                      />
                    </Form.Item>

                    <Form.Item name="phone" label="Phone number">
                      <Input
                        placeholder="+1 555 123 4567"
                        prefix={<PhoneOutlined style={{ color: "var(--text-slate-400)" }} />}
                      />
                    </Form.Item>

                    <Form.Item
                      name="personalEmail"
                      label="Personal email"
                      rules={[{ type: "email", message: "Enter valid email" }]}
                    >
                      <Input
                        placeholder="you@personal.com"
                        prefix={<MailOutlined style={{ color: "var(--text-slate-400)" }} />}
                      />
                    </Form.Item>

                    <Form.Item name="dateOfBirth" label="Date of birth">
                      <Input type="date" />
                    </Form.Item>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<ApartmentOutlined />}
                  tint="var(--bg-slate-100)"
                  color="var(--text-slate-500)"
                  title="Work Information"
                  subtitle="Managed by your admin"
                >
                  <div className="pp-info-grid">
                    <div className="pp-readonly-field">
                      <span className="pp-readonly-label">Work email</span>
                      <span className="pp-readonly-value">
                        <MailOutlined />
                        {userProfile?.workEmail || "—"}
                      </span>
                    </div>
                    <div className="pp-readonly-field">
                      <span className="pp-readonly-label">Position</span>
                      <span className="pp-readonly-value">
                        <ApartmentOutlined />
                        {userProfile?.position?.title || "—"}
                      </span>
                    </div>
                    <div className="pp-readonly-field">
                      <span className="pp-readonly-label">Reports to</span>
                      <span className="pp-readonly-value">
                        <UserSwitchOutlined />
                        {userProfile?.reportsTo?.name || "—"}
                      </span>
                    </div>
                    <div className="pp-readonly-field">
                      <span className="pp-readonly-label">Workspace</span>
                      <span className="pp-readonly-value">
                        <GlobalOutlined />
                        {userProfile?.tenant?.name || "—"}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>

              <div className="pp-form-footer">
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                  Some fields require admin approval to change.
                </Text>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    onClick={() => profileForm.resetFields()}
                    icon={<ReloadOutlined />}
                  >
                    Reset
                  </Button>
                  <Button type="primary" htmlType="submit" loading={profileLoading}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </Form>
          ) : (
            <div className="pp-security-grid">
              <SectionCard
                icon={<KeyOutlined />}
                tint={BLUE_TINT}
                color={BLUE}
                title="Change Password"
                subtitle="Choose a strong, unique password"
              >

                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                  requiredMark={false}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current password"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input.Password
                      placeholder="••••••••"
                      iconRender={(visible) =>
                        visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="New password"
                    rules={[
                      { required: true, message: "Required" },
                      { min: 8, message: "Must be at least 8 characters" },
                    ]}
                  >
                    <Input.Password
                      placeholder="At least 8 characters"
                      iconRender={(visible) =>
                        visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                    />
                  </Form.Item>

                  {newPwd && (
                    <div style={{ marginTop: -8, marginBottom: 16 }}>
                      <div className="pp-strength-bar">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            style={{
                              background:
                                i < strength.score
                                  ? strength.color
                                  : "var(--border-slate-100)",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                        }}
                      >
                        <span style={{ color: "var(--text-slate-500)" }}>
                          Password strength
                        </span>
                        <span style={{ color: strength.color, fontWeight: 700 }}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}

                  <Form.Item
                    name="confirmPassword"
                    label="Confirm new password"
                    dependencies={["newPassword"]}
                    rules={[
                      { required: true, message: "Required" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("newPassword") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      placeholder="Re-enter new password"
                      iconRender={(visible) =>
                        visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                    />
                  </Form.Item>

                  <div style={{ marginTop: 4 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={passwordLoading}
                      icon={<KeyOutlined />}
                    >
                      Update Password
                    </Button>
                  </div>
                </Form>
              </SectionCard>

              <SectionCard
                icon={<SafetyCertificateOutlined />}
                tint={GREEN_TINT}
                color={GREEN}
                title="Password best practices"
                subtitle="Keep your account secure"
              >
                <ul className="pp-tips-list">
                  <li>
                    <CheckCircleFilled style={{ color: GREEN, fontSize: 12 }} />
                    Use at least 12 characters
                  </li>
                  <li>
                    <CheckCircleFilled style={{ color: GREEN, fontSize: 12 }} />
                    Mix uppercase, lowercase, numbers
                  </li>
                  <li>
                    <CheckCircleFilled style={{ color: GREEN, fontSize: 12 }} />
                    Add a symbol (e.g. !, @, #)
                  </li>
                  <li>
                    <CheckCircleFilled style={{ color: GREEN, fontSize: 12 }} />
                    Avoid reusing passwords
                  </li>
                  <li>
                    <CheckCircleFilled style={{ color: GREEN, fontSize: 12 }} />
                    Never share with anyone
                  </li>
                </ul>
                <div className="pp-tips-divider" />
                <Text style={{ fontSize: 11.5, color: "var(--text-slate-500)" }}>
                  Last updated:{" "}
                  {userProfile?.updatedAt
                    ? dayjs(userProfile.updatedAt).format("MMM D, YYYY")
                    : "—"}
                </Text>
              </SectionCard>
            </div>
          )}
        </div>

        {/* ============================ IMAGE EDITOR MODAL ============================ */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: BLUE_TINT,
                  color: BLUE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <CameraOutlined />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-slate-900)",
                  }}
                >
                  Edit Profile Photo
                </div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                  Crop and zoom to perfection
                </div>
              </div>
            </div>
          }
          open={isEditorOpen}
          onCancel={() => setIsEditorOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleImageUpload}
              loading={uploadingImage}
            >
              Save Photo
            </Button>,
          ]}
          width={560}
          centered
          className="pp-modal"
        >
          <div
            style={{
              position: "relative",
              height: 320,
              width: "100%",
              background: "#0f172a",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {selectedImage && (
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <div style={{ padding: "20px 4px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "var(--text-slate-500)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                }}
              >
                Zoom
              </Text>
              <Text style={{ fontSize: 12, color: BLUE, fontWeight: 700 }}>
                {zoom.toFixed(1)}×
              </Text>
            </div>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(v) => setZoom(v as number)}
              tooltip={{ open: false }}
            />
          </div>
        </Modal>

        <style jsx global>{`
          .pp-page {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 4px 24px 32px;
          }
          /* ---------------- Header ---------------- */
          .pp-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 4px 2px 16px;
            border-bottom: 1px solid var(--border-slate-100);
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
          }
          .pp-head-chip {
            width: 42px;
            height: 42px;
            border-radius: 11px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pp-head-text {
            flex: 1;
            min-width: 0;
          }
          .pp-head-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--text-slate-900);
            letter-spacing: -0.025em;
          }
          .pp-head-sub {
            font-size: 12.5px;
            color: var(--text-slate-500);
            margin-top: 2px;
          }
          .pp-head-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
          }

          .pp-body {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
          }

          /* ---------------- Card ---------------- */
          .pp-card {
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            background: var(--bg-pure-white);
            overflow: hidden;
          }
          .pp-card-head {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pp-card-chip {
            width: 32px;
            height: 32px;
            border-radius: 9px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
          }
          .pp-card-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-slate-900);
          }
          .pp-card-sub {
            font-size: 11.5px;
            color: var(--text-slate-500);
            margin-top: 1px;
          }
          .pp-card-body {
            padding: 16px;
          }

          /* ---------------- Identity ---------------- */
          .pp-identity {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 16px 20px;
            flex-wrap: wrap;
          }
          .pp-identity-main {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
            min-width: 0;
          }
          .pp-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }
          .pp-camera-btn {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${BLUE};
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            border: 2px solid var(--bg-pure-white);
            transition: transform 0.15s ease;
          }
          .pp-camera-btn:hover {
            transform: scale(1.08);
          }
          .pp-identity-name-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .pp-identity-name {
            font-size: 17px;
            font-weight: 800;
            color: var(--text-slate-900);
            letter-spacing: -0.02em;
            line-height: 1.1;
          }
          .pp-role-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 9px;
            border-radius: 6px;
            background: var(--bg-slate-100);
            color: var(--text-slate-600);
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.04em;
          }
          .pp-identity-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 18px;
            margin-top: 7px;
            font-size: 12px;
            color: var(--text-slate-600);
            font-weight: 500;
          }
          .pp-identity-meta > span {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .pp-identity-meta .anticon {
            color: var(--text-slate-400);
          }
          .pp-identity-meta .pp-active {
            color: ${GREEN};
          }
          .pp-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
          }
          .pp-completion {
            min-width: 200px;
            padding: 10px 14px;
            border-radius: 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
          }
          .pp-completion-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .pp-completion-label {
            font-size: 11px;
            color: var(--text-slate-500);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 700;
          }
          .pp-completion-pct {
            font-size: 13px;
            font-weight: 800;
            color: var(--text-slate-900);
          }
          .pp-progress {
            height: 6px;
            background: var(--border-slate-200);
            border-radius: 999px;
            overflow: hidden;
          }
          .pp-progress-fill {
            height: 100%;
            border-radius: 999px;
            background: ${BLUE};
            transition: width 0.6s ease;
          }
          .pp-completion-note {
            font-size: 10.5px;
            color: var(--text-slate-500);
            margin-top: 5px;
            display: block;
          }

          /* ---------------- Tabs ---------------- */
          .pp-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            border-radius: 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            width: fit-content;
          }
          .pp-tab {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 7px;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .pp-tab:hover {
            color: var(--text-slate-900);
          }
          .pp-tab.active {
            background: var(--bg-pure-white);
            color: var(--text-slate-900);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
          }

          /* ---------------- Sections / forms ---------------- */
          .pp-sections {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .pp-security-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 14px;
            align-items: start;
          }
          .pp-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 16px;
          }
          .pp-page .ant-form-item {
            margin-bottom: 14px !important;
          }
          .pp-page .ant-form-item-label > label {
            font-weight: 600 !important;
            color: var(--text-slate-700) !important;
            font-size: 12px !important;
          }
          .pp-page .ant-input,
          .pp-page .ant-input-affix-wrapper,
          .pp-page .ant-input-password {
            border-radius: 6px !important;
            border-color: var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
          }
          .pp-page .ant-input:focus,
          .pp-page .ant-input-focused,
          .pp-page .ant-input-affix-wrapper-focused,
          .pp-page .ant-input-affix-wrapper:focus-within {
            border-color: ${BLUE} !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12) !important;
          }

          .pp-readonly-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 9px 12px;
            border-radius: 8px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-200);
            margin-bottom: 8px;
          }
          .pp-readonly-label {
            font-size: 10px;
            color: var(--text-slate-500);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .pp-readonly-value {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12.5px;
            color: var(--text-slate-900);
            font-weight: 500;
          }
          .pp-readonly-value .anticon {
            color: var(--text-slate-400);
            font-size: 13px;
          }

          .pp-form-footer {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid var(--border-slate-100);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            max-width: 900px;
          }

          .pp-strength-bar {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
          }
          .pp-strength-bar > span {
            height: 4px;
            border-radius: 999px;
            transition: background 0.2s ease;
          }

          .pp-tips-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 9px;
          }
          .pp-tips-list li {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12.5px;
            color: var(--text-slate-600);
          }
          .pp-tips-divider {
            height: 1px;
            background: var(--border-slate-100);
            margin: 14px 0 12px;
          }

          /* ---------------- Modal ---------------- */
          .pp-modal .ant-modal-content {
            border-radius: 14px !important;
            background: var(--bg-pure-white) !important;
          }
          .pp-modal .ant-modal-header {
            background: var(--bg-pure-white) !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding-bottom: 14px !important;
            margin-bottom: 16px !important;
          }
          .react-easy-crop_Container {
            background: #0f172a !important;
          }

          @media (max-width: 900px) {
            .pp-identity {
              align-items: stretch;
            }
            .pp-completion {
              width: 100%;
            }
            .pp-security-grid {
              grid-template-columns: 1fr;
            }
            .pp-info-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
