"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Alert, Typography } from "antd";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

const { Title, Text } = Typography;

function LoginInner() {
  const { login, user, loading } = useClientPortalAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/portal";
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirect);
    }
  }, [loading, user, router, redirect]);

  // Prefill identifier (username/email) and password if passed in the URL parameters
  useEffect(() => {
    const identifierParam = params.get("username") || params.get("email") || params.get("identifier");
    const passwordParam = params.get("password");
    if (identifierParam || passwordParam) {
      form.setFieldsValue({
        identifier: identifierParam || "",
        password: passwordParam || "",
      });
    }
  }, [params, form]);

  const onSubmit = async (values: { identifier: string; password: string }) => {
    setSubmitting(true);
    setError("");
    try {
      await login(values.identifier.trim(), values.password);
    } catch (err: any) {
      setError(err?.message || "Sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 36,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "#0f172a",
              color: "#f8fafc",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "-0.03em",
              marginBottom: 16,
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Z
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Zukvo · Client Portal
          </div>
          <Title level={3} style={{ margin: 0, color: "#0f172a" }}>
            Welcome back
          </Title>
          <Text type="secondary" style={{ fontSize: 13.5 }}>
            Sign in to view invoices, sprints, and project updates.
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 18, borderRadius: 8 }}
            closable
            onClose={() => setError("")}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmit}
          size="large"
        >
          <Form.Item
            label="Username or email"
            name="identifier"
            rules={[{ required: true, message: "Enter your username or email" }]}
          >
            <Input placeholder="you@company.com" autoComplete="username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Enter your password" }]}
          >
            <Input.Password
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            style={{ height: 42, fontSize: 14, fontWeight: 500 }}
          >
            Sign in
          </Button>
        </Form>

        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: 12,
            color: "#64748b",
          }}
        >
          Need access? Contact your account manager.
        </div>
      </div>
    </div>
  );
}

export default function ClientPortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
