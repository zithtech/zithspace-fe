'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { AuthService } from '@/services/authService';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
// import Logo from '@/assets/logo/CMPLOGO.jpeg';
import Logo from '@/assets/logo/Zukvologo.png';


const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

// Helper to safely determine subdomain and root host for OAuth flows
function resolveHostInfo() {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  let subdomain = "";
  let rootHost = window.location.host;

  // Prefer environment variable if configured
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  let hasValidEnvRoot = false;
  if (envAppUrl) {
    try {
      rootHost = new URL(envAppUrl).host;
      hasValidEnvRoot = true;
    } catch (e) {}
  }

  if (isLocalhost) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "127") {
      if (parts[0] !== "app") subdomain = parts[0];
      if (!hasValidEnvRoot) rootHost = `localhost:${window.location.port || "3005"}`;
    }
  } else {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== "www" && parts[0] !== "app") {
      subdomain = parts[0];
      if (!hasValidEnvRoot) {
        const port = window.location.port;
        rootHost = parts.slice(1).join('.') + (port ? `:${port}` : '');
      }
    }
  }

  // If we are currently ON the rootHost, then we don't need to redirect
  // This prevents infinite loops if rootHost is misconfigured to point to itself
  if (window.location.host === rootHost) {
    subdomain = ""; 
  }

  return { subdomain, rootHost };
}

// Separate component that uses useSearchParams
function LoginFormWithParams() {
  const { login, googleLogin, microsoftLogin, user, checkAuth } = useAuth();
  const { resolveTenant } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle OAuth callback in the popup window itself
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash !== "") {
      const hash = window.location.hash;
      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1)); // strip '#'
        const token = params.get("access_token");
        if (token && window.opener) {
          window.opener.postMessage(
            { type: "microsoft-token", token },
            window.location.origin
          );
          window.close();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-gsi-client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Handle Google OAuth callback from full-page redirect
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash !== "") {
      const hash = window.location.hash;
      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1)); // strip '#'
        const token = params.get("access_token");
        const stateStr = params.get("state");
        
        if (token && !window.opener) {
          // Top-level window received Google token
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          
          let stateSubdomain = "";
          if (stateStr) {
            try {
              const stateObj = JSON.parse(decodeURIComponent(stateStr));
              stateSubdomain = stateObj.subdomain;
            } catch(e) {}
          }
          
          const { rootHost } = resolveHostInfo();
          if (stateSubdomain) {
             const protocol = window.location.protocol;
             window.location.href = `${protocol}//${stateSubdomain}.${rootHost}/login?token=${token}`;
             return;
          }
          
          // Proceed with login on root host
          setLoading(true);
          AuthService.googleLogin(token).then(async (response) => {
            const subdomainParam = searchParams.get('subdomain');
            if (subdomainParam) {
              const protocol = window.location.protocol;
              window.location.href = `${protocol}//${subdomainParam}.${rootHost}/login?token=${response.accessToken}`;
              return;
            }
            await googleLogin(token);
          }).catch((err: any) => {
            setError(err.message || "Google sign-in failed");
            setLoading(false);
          });
        }
      }
    }
  }, [searchParams, googleLogin]);

  const handleGoogleLogin = () => {
    if (typeof window === "undefined" || !(window as any).google) {
      setError("Google sign-in is not ready yet. Please try again in a few seconds.");
      return;
    }

    const { subdomain, rootHost } = resolveHostInfo();

    if (subdomain) {
      // Redirect to root domain to perform login securely under stable OAuth origins
      const protocol = window.location.protocol;
      window.location.href = `${protocol}//${rootHost}/login?subdomain=${subdomain}&google_login_auto=true`;
      return;
    }

    setLoading(true);
    setError("");

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: "945644412981-eu93b14d7jr5d0gd5s04758lu6mupad8.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError("Google login was cancelled or failed.");
            setLoading(false);
            return;
          }
          if (tokenResponse.access_token) {
            try {
              const response = await AuthService.googleLogin(tokenResponse.access_token);
              const subdomainParam = searchParams.get('subdomain');
              if (subdomainParam) {
                // Redirect back to subdomain with token
                const protocol = window.location.protocol;
                window.location.href = `${protocol}//${subdomainParam}.${rootHost}/login?token=${response.accessToken}`;
                return;
              }
              // Normal login finalize
              await googleLogin(tokenResponse.access_token);
            } catch (err: any) {
              setError(err.message || "Google sign-in failed");
              setLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error("Google authentication error:", err);
      setError("Failed to open Google login popup.");
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    const { subdomain, rootHost } = resolveHostInfo();

    if (subdomain) {
      // Redirect to root domain to perform login securely under stable OAuth origins
      const protocol = window.location.protocol;
      window.location.href = `${protocol}//${rootHost}/login?subdomain=${subdomain}&microsoft_login_auto=true`;
      return;
    }

    setLoading(true);
    setError("");

    const clientId = "2de414d6-6eff-4c4a-9480-f124cc8d4796";
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scope = encodeURIComponent("openid profile email User.Read");
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_mode=fragment`;

    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authUrl,
      "microsoft-login-popup",
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      setError("Popup blocked. Please allow popups for this site.");
      setLoading(false);
      return;
    }

    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "microsoft-token" && event.data?.token) {
        const token = event.data.token;
        cleanup();
        
        try {
          const { subdomain, rootHost } = resolveHostInfo();

          if (subdomain) {
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${rootHost}/login?subdomain=${subdomain}&microsoft_login_auto=true&ms_token=${token}`;
            return;
          }

          const response = await AuthService.microsoftLogin(token);
          const subdomainParam = searchParams.get('subdomain');
          if (subdomainParam) {
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${subdomainParam}.${rootHost}/login?token=${response.accessToken}`;
            return;
          }
          await microsoftLogin(token);
        } catch (err: any) {
          setError(err.message || "Microsoft sign-in failed");
          setLoading(false);
        }
      }
    };

    window.addEventListener("message", messageListener);

    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        setLoading(false);
      }
    }, 1000);

    const cleanup = () => {
      window.removeEventListener("message", messageListener);
      clearInterval(checkClosedInterval);
    };
  };

  // Finalize SSO authentication when redirected back to subdomain with token
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setLoading(true);
      setError("");
      AuthService.setAccessToken(tokenParam);
      if (typeof document !== 'undefined') {
        document.cookie = 'zithmi_auth=1; path=/; SameSite=Lax';
      }

      // Clean token parameter from URL to prevent infinite loop
      const params = new URLSearchParams(window.location.search);
      params.delete('token');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      router.replace(newPath);

      checkAuth().then(() => {
        // Will redirect automatically due to `user` watch effect
      }).catch((err: any) => {
        setError(err.message || "Failed to finalize login");
        setLoading(false);
      });
    }
  }, [searchParams, checkAuth, router]);

  // Auto-login with Google if redirected from a subdomain
  useEffect(() => {
    const auto = searchParams.get('google_login_auto');
    if (auto === 'true') {
      const subdomain = searchParams.get('subdomain');
      const { rootHost } = resolveHostInfo();
      const protocol = window.location.protocol;
      const redirectUri = `${protocol}//${rootHost}/login`;
      
      const clientId = "945644412981-eu93b14d7jr5d0gd5s04758lu6mupad8.apps.googleusercontent.com";
      const scope = encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
      const state = encodeURIComponent(JSON.stringify({ subdomain: subdomain || '' }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      
      window.location.replace(authUrl);
    }
  }, [searchParams]);

  // Auto-login with Microsoft if redirected from a subdomain
  useEffect(() => {
    const auto = searchParams.get('microsoft_login_auto');
    const token = searchParams.get('ms_token');
    if (auto === 'true' && token) {
      const params = new URLSearchParams(window.location.search);
      params.delete('microsoft_login_auto');
      params.delete('ms_token');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      router.replace(newPath);

      setLoading(true);
      setError("");

      const { rootHost } = resolveHostInfo();

      AuthService.microsoftLogin(token).then(async (response) => {
        const subdomainParam = searchParams.get('subdomain');
        if (subdomainParam) {
          const protocol = window.location.protocol;
          window.location.href = `${protocol}//${subdomainParam}.${rootHost}/login?token=${response.accessToken}`;
          return;
        }
        await microsoftLogin(token);
      }).catch((err) => {
        setError(err.message || "Microsoft login failed");
        setLoading(false);
      });
    }
  }, [searchParams, router]);

  // Get the redirect URL from query parameters
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  // Prefill email/password and resolve tenant subdomain from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    const subdomainParam = searchParams.get('subdomain');

    if (emailParam || passwordParam) {
      form.setFieldsValue({
        email: emailParam || '',
        password: passwordParam || '',
      });
    }

    if (subdomainParam) {
      resolveTenant(subdomainParam);
    }
  }, [searchParams, form]);

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      
      await login(values.email, values.password);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Redirecting...</Text>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24, fontSize: 13 }}
          closable
          onClose={() => setError('')}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter your email"
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Enter your password"
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            icon={<LoginOutlined />}
            style={{
              height: 44,
              fontSize: 15,
              fontWeight: 500,
              background: 'linear-gradient(135deg, #1677ff, #69c0ff)',
              border: 'none',
              borderRadius: 8,
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>or sign in with</Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <Button
          size="large"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.927h6.6c-.29 1.514-1.145 2.8-2.42 3.66v3.04h3.92c2.29-2.11 3.645-5.214 3.645-8.557Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.92-3.04c-1.08.72-2.48 1.16-4.01 1.16-3.09 0-5.72-2.087-6.65-4.89H1.31v3.14C3.29 20.36 7.38 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.35 14.32a7.136 7.136 0 0 1 0-4.64V6.54H1.31a11.96 11.96 0 0 0 0 10.92l4.04-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.38 0 3.29 3.64 1.31 7.82l4.04 3.14c.93-2.8 3.56-4.89 12-4.89Z"
              />
            </svg>
          }
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            borderColor: '#d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        />
        <Button
          size="large"
          icon={
            <svg width="20" height="20" viewBox="0 0 23 23" aria-hidden>
              <rect x="0" y="0" width="11" height="11" fill="#F25022" />
              <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
              <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
              <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
            </svg>
          }
          onClick={handleMicrosoftLogin}
          disabled={loading}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            borderColor: '#d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          }}
        />
      </div>
    </>
  );
}

// Loading fallback component
function LoginFormSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Loading login form...</Text>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
          border: 'none',
        }}
        styles={{
          body: {
            padding: 32,
          },
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>

          <div
  style={{
    width: 100,
    height: 100,
    // background: '#ffffff',
    // borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    // boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  }}
>
  <Image
    src={Logo}
    alt="Logo"
    width={70}
    height={70}
    style={{ objectFit: 'contain' }}
  />
</div>

          
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Welcome Back !!!
          </Title>
          
          {/* <Text type="secondary" style={{ fontSize: 14 }}>
            Sign in to your Z account
          </Text> */}
        </div>

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginFormWithParams />
        </Suspense>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
  © {new Date().getFullYear()} Zukvo. All rights reserved.
</Text>

        </div>
      </Card>
    </div>
  );
}