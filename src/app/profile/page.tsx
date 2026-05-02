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
} from "@ant-design/icons";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import dayjs from "dayjs";
import {
  AuthService,
  UpdateProfileData,
  UserProfile,
} from "@/services/authService";
import { ApiError } from "@/lib/axios";

const { Text, Title } = Typography;

const ROLE_META: Record<
  string,
  { label: string; bg: string; color: string; dot: string; icon: React.ReactNode }
> = {
  super_admin: {
    label: "Super Admin",
    bg: "rgba(225,29,72,0.10)",
    color: "#e11d48",
    dot: "#e11d48",
    icon: <CrownOutlined />,
  },
  admin: {
    label: "Admin",
    bg: "rgba(245,158,11,0.12)",
    color: "#d97706",
    dot: "#f59e0b",
    icon: <SafetyCertificateOutlined />,
  },
  user: {
    label: "User",
    bg: "rgba(16,185,129,0.10)",
    color: "#059669",
    dot: "#10b981",
    icon: <IdcardOutlined />,
  },
};

const AVATAR_PALETTE = [
  ["#6366f1", "#8b5cf6"],
  ["#0ea5e9", "#06b6d4"],
  ["#10b981", "#14b8a6"],
  ["#f59e0b", "#f97316"],
  ["#ec4899", "#f43f5e"],
  ["#8b5cf6", "#d946ef"],
];

const gradientFor = (seed: string) => {
  const idx = Math.abs(
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  ) % AVATAR_PALETTE.length;
  const [a, b] = AVATAR_PALETTE[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

const SectionLabel = ({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      margin: "4px 0 14px",
    }}
  >
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-slate-500)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
    {hint && (
      <span style={{ fontSize: 11.5, color: "var(--text-slate-400)" }}>
        · {hint}
      </span>
    )}
    <div style={{ flex: 1, height: 1, background: "var(--border-slate-100)" }} />
  </div>
);

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
    { label: "Excellent", color: "#0ea5e9" },
  ];
  const idx = Math.min(score, map.length - 1);
  return { score, label: map[idx].label, color: map[idx].color };
};

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
  const seed = userProfile?.id || userProfile?.name || "you";

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <TimeTrackingHeader
          style={{ padding: "8.5px 32px" }}
          icon={<UserOutlined style={{ fontSize: 20, color: "#8b5cf6" }} />}
          title="My Profile"
          description="Manage your personal information, security, and preferences"
          extra={
            <Button
              icon={<LogoutOutlined />}
              onClick={() => logout()}
              style={{
                height: 38,
                borderRadius: 10,
                fontWeight: 500,
                color: "#e11d48",
                border: "1px solid rgba(225,29,72,0.25)",
                background: "rgba(225,29,72,0.06)",
              }}
            >
              Sign Out
            </Button>
          }
        />

        <div style={{ padding: "8px 32px 40px", maxWidth: 1200, margin: "0 auto" }}>
          {/* Identity Card */}
          <div className="pp-identity-card">
            <div className="pp-identity-bg" />
            <div className="pp-identity-inner">
              <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 0 }}>
                {/* Avatar with camera */}
                <div className="pp-avatar-wrap">
                  <Avatar
                    size={88}
                    src={userProfile?.avatarUrl}
                    style={{
                      background: gradientFor(seed),
                      color: "#fff",
                      fontSize: 32,
                      fontWeight: 700,
                      border: "4px solid var(--bg-pure-white)",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <Title
                      level={3}
                      style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--text-slate-900)",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.15,
                      }}
                    >
                      {userProfile?.name || user?.name}
                    </Title>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: roleMeta.bg,
                        color: roleMeta.color,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {roleMeta.icon}
                      {roleMeta.label.toUpperCase()}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px 18px",
                      marginTop: 10,
                      fontSize: 12.5,
                      color: "var(--text-slate-600)",
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ApartmentOutlined style={{ color: "var(--text-slate-400)" }} />
                      {userProfile?.position?.title || "—"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <MailOutlined style={{ color: "var(--text-slate-400)" }} />
                      {userProfile?.workEmail || "—"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CalendarOutlined style={{ color: "var(--text-slate-400)" }} />
                      Joined{" "}
                      {userProfile?.createdAt
                        ? dayjs(userProfile.createdAt).format("MMM D, YYYY")
                        : "—"}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: userProfile?.isActive ? "#059669" : "#94a3b8",
                      }}
                    >
                      <span
                        className="pp-status-dot"
                        style={{
                          background: userProfile?.isActive ? "#10b981" : "#94a3b8",
                        }}
                      />
                      {userProfile?.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion */}
              <div className="pp-completion">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "var(--text-slate-500)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 700,
                    }}
                  >
                    Profile Completion
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: completion >= 85 ? "#059669" : "#8b5cf6",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {completion}%
                  </Text>
                </div>
                <div className="pp-progress">
                  <div
                    className="pp-progress-fill"
                    style={{
                      width: `${completion}%`,
                      background:
                        completion >= 85
                          ? "linear-gradient(90deg,#10b981,#059669)"
                          : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                    }}
                  />
                </div>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-slate-500)",
                    marginTop: 8,
                    display: "block",
                  }}
                >
                  {completion >= 85
                    ? "Your profile looks great!"
                    : "Add more details to complete your profile."}
                </Text>
              </div>
            </div>
          </div>

          {/* Tab pills */}
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

          {/* Content */}
          <div className="pp-content-card">
            {activeTab === "profile" ? (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileSubmit}
                requiredMark={false}
              >
                <SectionLabel hint="Editable by you">Personal Information</SectionLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <Form.Item
                    name="name"
                    label="Full name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input
                      placeholder="Your full name"
                      prefix={
                        <UserOutlined style={{ color: "var(--text-slate-400)" }} />
                      }
                    />
                  </Form.Item>

                  <Form.Item name="phone" label="Phone number">
                    <Input
                      placeholder="+1 555 123 4567"
                      prefix={
                        <PhoneOutlined style={{ color: "var(--text-slate-400)" }} />
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="personalEmail"
                    label="Personal email"
                    rules={[{ type: "email", message: "Enter valid email" }]}
                  >
                    <Input
                      placeholder="you@personal.com"
                      prefix={
                        <MailOutlined style={{ color: "var(--text-slate-400)" }} />
                      }
                    />
                  </Form.Item>

                  <Form.Item name="dateOfBirth" label="Date of birth">
                    <Input type="date" />
                  </Form.Item>
                </div>

                <div style={{ height: 8 }} />
                <SectionLabel hint="Managed by your admin">
                  Work Information
                </SectionLabel>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
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
                      <UserOutlined />
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

                <div className="pp-form-footer">
                  <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                    Some fields require admin approval to change.
                  </Text>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      onClick={() => profileForm.resetFields()}
                      style={{ borderRadius: 8, height: 38 }}
                      icon={<ReloadOutlined />}
                    >
                      Reset
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={profileLoading}
                      style={{
                        borderRadius: 8,
                        height: 38,
                        padding: "0 20px",
                        fontWeight: 600,
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Form>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                  requiredMark={false}
                >
                  <SectionLabel hint="Choose a strong, unique password">
                    Change Password
                  </SectionLabel>

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

                  <div style={{ marginTop: 8 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={passwordLoading}
                      icon={<KeyOutlined />}
                      style={{
                        borderRadius: 8,
                        height: 40,
                        padding: "0 22px",
                        fontWeight: 600,
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
                      }}
                    >
                      Update Password
                    </Button>
                  </div>
                </Form>

                {/* Tips card */}
                <div className="pp-tips-card">
                  <div className="pp-tips-icon">
                    <SafetyCertificateOutlined />
                  </div>
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--text-slate-900)",
                      display: "block",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Password best practices
                  </Text>
                  <ul className="pp-tips-list">
                    <li>
                      <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
                      Use at least 12 characters
                    </li>
                    <li>
                      <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
                      Mix uppercase, lowercase, numbers
                    </li>
                    <li>
                      <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
                      Add a symbol (e.g. !, @, #)
                    </li>
                    <li>
                      <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
                      Avoid reusing passwords
                    </li>
                    <li>
                      <CheckCircleFilled style={{ color: "#10b981", fontSize: 12 }} />
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Editor Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(139,92,246,0.12)",
                  color: "#8b5cf6",
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
                    fontSize: 16,
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
            <Button
              key="cancel"
              onClick={() => setIsEditorOpen(false)}
              style={{ borderRadius: 8, height: 38 }}
            >
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleImageUpload}
              loading={uploadingImage}
              style={{
                borderRadius: 8,
                height: 38,
                fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
              }}
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
              <Text style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>
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
          .pp-identity-card {
            position: relative;
            border-radius: 16px;
            border: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            overflow: hidden;
            margin-bottom: 18px;
          }
          .pp-identity-bg {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 92px;
            background:
              radial-gradient(60% 100% at 0% 0%, rgba(99,102,241,0.10) 0%, transparent 60%),
              radial-gradient(60% 100% at 100% 0%, rgba(217,70,239,0.08) 0%, transparent 60%),
              linear-gradient(180deg, rgba(139,92,246,0.06) 0%, transparent 100%);
            pointer-events: none;
          }
          .pp-identity-inner {
            position: relative;
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 28px 28px 24px;
            flex-wrap: wrap;
          }
          .pp-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }
          .pp-camera-btn {
            position: absolute;
            bottom: -2px; right: -2px;
            width: 30px; height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            font-size: 13px;
            border: 3px solid var(--bg-pure-white);
            box-shadow: 0 4px 10px rgba(139,92,246,0.35);
            transition: transform 0.15s ease;
          }
          .pp-camera-btn:hover { transform: scale(1.08); }
          .pp-status-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 2px rgba(16,185,129,0.18);
          }
          .pp-completion {
            min-width: 220px;
            padding: 14px 16px;
            border-radius: 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
          }
          .pp-progress {
            height: 6px;
            background: var(--border-slate-100);
            border-radius: 999px;
            overflow: hidden;
          }
          .pp-progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.6s ease;
          }
          .pp-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            border-radius: 12px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            margin-bottom: 18px;
            width: fit-content;
          }
          .pp-tab {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 18px;
            border-radius: 9px;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .pp-tab:hover {
            color: var(--text-slate-900);
            background: var(--bg-pure-white);
          }
          .pp-tab.active {
            background: var(--bg-pure-white);
            color: #8b5cf6;
            box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 0 0 1px rgba(139,92,246,0.20);
          }
          .pp-content-card {
            border-radius: 16px;
            border: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
            padding: 24px 26px;
          }
          .pp-content-card .ant-form-item-label > label {
            font-weight: 600 !important;
            color: var(--text-slate-700, var(--text-slate-600)) !important;
            font-size: 12px !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .pp-content-card .ant-input,
          .pp-content-card .ant-input-affix-wrapper,
          .pp-content-card .ant-input-password {
            border-radius: 9px !important;
            border-color: var(--border-slate-200) !important;
            background: var(--bg-secondary) !important;
            min-height: 40px;
          }
          .pp-content-card .ant-input:focus,
          .pp-content-card .ant-input-focused,
          .pp-content-card .ant-input-affix-wrapper-focused,
          .pp-content-card .ant-input-affix-wrapper:focus-within {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139,92,246,0.12) !important;
          }
          .pp-readonly-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 12px 14px;
            border-radius: 9px;
            background: var(--bg-slate-50);
            border: 1px dashed var(--border-slate-200);
          }
          .pp-readonly-label {
            font-size: 11px;
            color: var(--text-slate-500);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .pp-readonly-value {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5px;
            color: var(--text-slate-900);
            font-weight: 500;
          }
          .pp-readonly-value .anticon {
            color: var(--text-slate-400);
            font-size: 13px;
          }
          .pp-form-footer {
            margin-top: 20px;
            padding-top: 18px;
            border-top: 1px solid var(--border-slate-100);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
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
          .pp-tips-card {
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--border-slate-100);
            background: var(--bg-slate-50);
            position: relative;
          }
          .pp-tips-icon {
            width: 36px; height: 36px;
            border-radius: 10px;
            background: rgba(139,92,246,0.12);
            color: #8b5cf6;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            margin-bottom: 12px;
          }
          .pp-tips-list {
            list-style: none;
            padding: 0; margin: 12px 0 0;
            display: flex; flex-direction: column; gap: 8px;
          }
          .pp-tips-list li {
            display: flex; align-items: center; gap: 8px;
            font-size: 12.5px;
            color: var(--text-slate-600);
          }
          .pp-tips-divider {
            height: 1px;
            background: var(--border-slate-100);
            margin: 16px 0 12px;
          }
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
          .react-easy-crop_Container { background: #0f172a !important; }
          .ant-slider-track { background: linear-gradient(90deg,#6366f1,#8b5cf6) !important; }
          .ant-slider-handle::after {
            box-shadow: 0 0 0 2px #8b5cf6 !important;
          }
          @media (max-width: 900px) {
            .pp-identity-inner { padding: 22px; }
            .pp-completion { width: 100%; }
            .pp-content-card > div[style*="grid-template-columns: 1.4fr 1fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
