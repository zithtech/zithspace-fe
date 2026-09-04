'use client';
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import { AuthService } from '@/services/authService';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Checkbox,
  ConfigProvider,
  theme as antdTheme,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
// import Logo from '@/assets/logo/CMPLOGO.jpeg';
import { useProduct } from '@/context/ProductContext';
import { oauthConfigFor, ssoAvailability, GOOGLE_SCOPE, MS_SCOPE } from '@/lib/oauthConfig';


const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

// Helper to safely determine subdomain and root host for OAuth flows.
//
// `appUrl` is the CURRENT BRAND's app origin, not a global constant. Zukvo and
// Testiez share this deploy, so reading NEXT_PUBLIC_APP_URL here would send a
// Testiez tenant to the Zukvo domain to authenticate and land them back on the
// wrong brand's subdomain. Callers pass oauthConfigFor(product).appUrl.
function resolveHostInfo(appUrl: string) {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  let subdomain = "";
  let rootHost = window.location.host;

  // Prefer the configured brand origin, but ONLY if we are NOT on localhost.
  // Otherwise local dev will get redirected to prod.
  let hasValidEnvRoot = false;
  if (appUrl && !isLocalhost) {
    try {
      rootHost = new URL(appUrl).host;
      hasValidEnvRoot = true;
    } catch (e) {}
  }

  if (isLocalhost) {
    rootHost = `localhost:${window.location.port || "3005"}`;
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== "localhost" && parts[0] !== "127") {
      if (parts[0] !== "app") subdomain = parts[0];
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
  // Which brand this login screen is. Stamped on the request headers by the edge
  // middleware and handed down by ProductProvider, so it is correct on the first
  // paint — no effect, no flash of the other brand's OAuth target.
  const { product } = useProduct();
  const oauth = useMemo(() => oauthConfigFor(product), [product]);
  // Testiez has no fallback to Zukvo's OAuth apps, so a surface without its own
  // credentials offers no SSO at all rather than a button naming the other brand.
  const sso = useMemo(() => ssoAvailability(product), [product]);
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
          
          const { subdomain: hostnameSubdomain, rootHost } = resolveHostInfo(oauth.appUrl);
          // Strip 'app.' prefix when building tenant subdomain URLs:
          // app.zukvo.com → zukvo.com, so redirect becomes company1.zukvo.com not company1.app.zukvo.com
          const tenantBaseHost = rootHost.startsWith('app.')
            ? rootHost.slice(4)
            : rootHost;

          // Determine target subdomain: state param > query param > current hostname subdomain
          const targetSubdomain = stateSubdomain || searchParams.get('subdomain') || hostnameSubdomain || '';

          if (targetSubdomain) {
            // Exchange the Google token for a backend JWT, passing the tenant subdomain
            // so the backend's resolveTenant middleware can identify the correct tenant.
            setLoading(true);
            AuthService.googleLogin(token, targetSubdomain).then((response) => {
              const protocol = window.location.protocol;
              const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
              const targetHost = isLocalhost ? rootHost : `${targetSubdomain}.${tenantBaseHost}`;

              // If we're already on the tenant domain, finalize login in-place
              if (window.location.host === targetHost) {
                // Clear any stale cached tenant to prevent wrong X-Tenant-ID header
                localStorage.removeItem('currentTenant');
                AuthService.setAccessToken(response.accessToken);
                document.cookie = 'zithmi_auth=1; path=/; SameSite=Lax';
                checkAuth().catch(() => {
                  setError("Failed to finalize login");
                  setLoading(false);
                });
              } else {
                // Redirect to the tenant with the proper app JWT (not the raw Google token)
                const finalUrl = isLocalhost 
                  ? `${protocol}//${targetHost}/login?subdomain=${targetSubdomain}&token=${response.accessToken}`
                  : `${protocol}//${targetHost}/login?token=${response.accessToken}`;
                window.location.href = finalUrl;
              }
            }).catch((err: any) => {
              setError(err.message || "Google sign-in failed");
              setLoading(false);
            });
            return;
          }
          
          // No subdomain — proceed with login on root host (app.zukvo.com)
          setLoading(true);
          AuthService.googleLogin(token).then(async (response) => {
            // Use the app JWT from the response, not the raw Google token
            await googleLogin(response.accessToken);
          }).catch((err: any) => {
            setError(err.message || "Google sign-in failed");
            setLoading(false);
          });
        }
      }
    }
  }, [searchParams, googleLogin, checkAuth]);

  const handleGoogleLogin = () => {
    if (typeof window === "undefined" || !(window as any).google) {
      setError("Google sign-in is not ready yet. Please try again in a few seconds.");
      return;
    }

    const { subdomain, rootHost } = resolveHostInfo(oauth.appUrl);

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
        client_id: oauth.googleClientId,
        scope: GOOGLE_SCOPE,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError("Google login was cancelled or failed.");
            setLoading(false);
            return;
          }
          if (tokenResponse.access_token) {
            try {
              const subdomainParam = searchParams.get('subdomain');
              // Use hostname subdomain as fallback (covers case where popup runs on lakshmi.zukvo.com)
              const { subdomain: hostnameSubdomain, rootHost: currentRootHost } = resolveHostInfo(oauth.appUrl);
              const effectiveSubdomain = subdomainParam || hostnameSubdomain || '';
              const tenantBaseHost = currentRootHost.startsWith('app.') ? currentRootHost.slice(4) : currentRootHost;

              const response = await AuthService.googleLogin(tokenResponse.access_token, effectiveSubdomain || undefined);
              
              if (effectiveSubdomain) {
                const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                const targetHost = isLocalhost ? currentRootHost : `${effectiveSubdomain}.${tenantBaseHost}`;
                
                if (window.location.host === targetHost) {
                  // Already on the tenant domain — finalize in-place
                  localStorage.removeItem('currentTenant');
                  AuthService.setAccessToken(response.accessToken);
                  document.cookie = 'zithmi_auth=1; path=/; SameSite=Lax';
                  await checkAuth();
                } else {
                  const protocol = window.location.protocol;
                  const finalUrl = isLocalhost 
                    ? `${protocol}//${targetHost}/login?subdomain=${effectiveSubdomain}&token=${response.accessToken}`
                    : `${protocol}//${targetHost}/login?token=${response.accessToken}`;
                  window.location.href = finalUrl;
                }
                return;
              }
              // Root domain login — use the app JWT from response
              await googleLogin(response.accessToken);
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
    const { subdomain, rootHost } = resolveHostInfo(oauth.appUrl);

    if (subdomain) {
      // Redirect to root domain to perform login securely under stable OAuth origins
      const protocol = window.location.protocol;
      window.location.href = `${protocol}//${rootHost}/login?subdomain=${subdomain}&microsoft_login_auto=true`;
      return;
    }

    setLoading(true);
    setError("");

    const clientId = oauth.msClientId;
    // Always use the registered Azure redirect URI for THIS brand — the tenant's
    // own host (sl.zukvo.com, acme.testiez.com) is not registered and would be
    // rejected. oauth.appUrl is the brand's app origin, so a Testiez login stays
    // on the Testiez domain instead of bouncing through Zukvo's.
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const registeredRedirectBase = (isLocalhost ? window.location.origin : oauth.appUrl) || window.location.origin;
    const redirectUri = `${registeredRedirectBase.replace(/\/$/, '')}/login`;
    const scope = encodeURIComponent(MS_SCOPE);
    
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
          const { subdomain, rootHost } = resolveHostInfo(oauth.appUrl);

          if (subdomain) {
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${rootHost}/login?subdomain=${subdomain}&microsoft_login_auto=true&ms_token=${token}`;
            return;
          }

          const response = await AuthService.microsoftLogin(token);
          const subdomainParam = searchParams.get('subdomain');
          if (subdomainParam) {
            const protocol = window.location.protocol;
            const targetHost = isLocalhost 
              ? `${rootHost}/login?subdomain=${subdomainParam}&token=${response.accessToken}`
              : `${subdomainParam}.${rootHost}/login?token=${response.accessToken}`;
            window.location.href = `${protocol}//${targetHost}`;
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
      const { rootHost } = resolveHostInfo(oauth.appUrl);
      const protocol = window.location.protocol;
      const redirectUri = `${protocol}//${rootHost}/login`;
      
      const clientId = oauth.googleClientId;
      const scope = encodeURIComponent(GOOGLE_SCOPE);
      const state = encodeURIComponent(JSON.stringify({ subdomain: subdomain || '' }));
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
      
      window.location.replace(authUrl);
    }
  }, [searchParams]);

  // Auto-login with Microsoft if redirected from a subdomain
  useEffect(() => {
    const auto = searchParams.get('microsoft_login_auto');
    const msToken = searchParams.get('ms_token');
    const subdomainParam = searchParams.get('subdomain');

    if (auto !== 'true') return;

    // Case A: We already have the MS token (passed back from popup via query param)
    if (msToken) {
      const params = new URLSearchParams(window.location.search);
      params.delete('microsoft_login_auto');
      params.delete('ms_token');
      const newSearch = params.toString();
      const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
      router.replace(newPath);

      setLoading(true);
      setError("");

      const { rootHost } = resolveHostInfo(oauth.appUrl);
      const tenantBaseHost = rootHost.startsWith('app.') ? rootHost.slice(4) : rootHost;

      const targetSubdomain = subdomainParam || '';
      AuthService.microsoftLogin(msToken, targetSubdomain || undefined).then(async (response) => {
        if (targetSubdomain) {
          const protocol = window.location.protocol;
          window.location.href = `${protocol}//${targetSubdomain}.${tenantBaseHost}/login?token=${response.accessToken}`;
          return;
        }
        await microsoftLogin(msToken);
      }).catch((err) => {
        setError(err.message || "Microsoft login failed");
        setLoading(false);
      });
      return;
    }

    // Case B: No token yet — auto-trigger the Microsoft popup now that we're on app.zukvo.com.
    // Clean the auto param from URL first.
    const params = new URLSearchParams(window.location.search);
    params.delete('microsoft_login_auto');
    const newSearch = params.toString();
    router.replace(window.location.pathname + (newSearch ? `?${newSearch}` : ''));

    setLoading(true);
    setError("");

    const clientId = oauth.msClientId;
    const registeredRedirectBase = oauth.appUrl || window.location.origin;
    const redirectUri = `${registeredRedirectBase.replace(/\/$/, '')}/login`;
    const scope = encodeURIComponent(MS_SCOPE);
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_mode=fragment`;

    const width = 600, height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(authUrl, "microsoft-login-popup", `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`);

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
        const { rootHost } = resolveHostInfo(oauth.appUrl);
        const tenantBaseHost = rootHost.startsWith('app.') ? rootHost.slice(4) : rootHost;
        const targetSubdomain = subdomainParam || '';
        try {
          const response = await AuthService.microsoftLogin(token, targetSubdomain || undefined);
          if (targetSubdomain) {
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${targetSubdomain}.${tenantBaseHost}/login?token=${response.accessToken}`;
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
      if (popup.closed) { cleanup(); setLoading(false); }
    }, 1000);
    const cleanup = () => {
      window.removeEventListener("message", messageListener);
      clearInterval(checkClosedInterval);
    };
  }, [searchParams, router]);

  // Standard redirect parameter resolution
  const determineRedirectPath = (
    urlStr: string,
    user: any,
    fallback: string,
  ) => {
    try {
      const url = new URL(urlStr, window.location.origin);
      return url.searchParams.get("redirect") || fallback;
    } catch {
      return fallback;
    }
  };

  // Redirect after login
  const redirectUrl = (() => {
    return searchParams.get('redirect') || '/dashboard';
  })();

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

    let defaultEmail = emailParam || '';
    let rememberMe = false;

    if (!emailParam) {
      const savedEmail = localStorage.getItem('remembered_email');
      if (savedEmail) {
        defaultEmail = savedEmail;
        rememberMe = true;
      }
    }

    if (defaultEmail || passwordParam || rememberMe) {
      form.setFieldsValue({
        email: defaultEmail,
        password: passwordParam || '',
        remember: rememberMe,
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
      
      if (values.remember) {
        localStorage.setItem('remembered_email', values.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      await login(values.email, values.password);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <ZukvoLoader size="lg" />
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
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#5A6982', marginRight: 8 }} />}
            placeholder="Email address"
            autoComplete="email"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please enter your password' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#5A6982', marginRight: 8 }} />}
            placeholder="Password"
            autoComplete="current-password"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 2 }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ fontSize: 13, color: '#94A3B8' }}>Remember me</Checkbox>
          </Form.Item>
          <Link href="/forgot-password" className="zk-link" style={{ color: '#60A5FA', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            icon={<LoginOutlined />}
            className="zk-submit"
            style={{
              fontSize: 15,
              background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
              border: 'none',
              boxShadow: '0 8px 22px rgba(37, 99, 235, 0.32)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form.Item>
      </Form>

      {sso.any && (
      <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          margin: '24px 0 20px',
        }}
      >
        <span style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.14)' }} />
        <Text style={{ fontSize: 12, color: '#5A6982', whiteSpace: 'nowrap' }}>
          or continue with
        </Text>
        <span style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.14)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {sso.google && (
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
          className="zk-social"
          style={{
            width: 88,
            height: 44,
            borderRadius: 999,
            background: 'rgba(148, 163, 184, 0.06)',
            borderColor: 'rgba(148, 163, 184, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
          }}
        />
        )}
        {sso.microsoft && (
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
          className="zk-social"
          style={{
            width: 88,
            height: 44,
            borderRadius: 999,
            background: 'rgba(148, 163, 184, 0.06)',
            borderColor: 'rgba(148, 163, 184, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
          }}
        />
        )}
      </div>
      </>
      )}
    </>
  );
}

// Loading fallback component
function LoginFormSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <ZukvoLoader size="lg" />
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">Loading login form...</Text>
      </div>
    </div>
  );
}

// Minimal backdrop: charcoal canvas, a whisper of grid, and a few motion lines
// carrying the forward lean of the Zukvo mark. Nothing else.
const backgroundStyles = `
@keyframes zk-streak {
  0%   { transform: translateX(-260px); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateX(300px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .zk-anim { animation: none !important; }
}
`;

const SPRINT_STREAKS = [
  { x: 80, y: 190, w: 260, dur: '14s', delay: '0s' },
  { x: 250, y: 430, w: 150, dur: '18s', delay: '5s' },
  { x: 110, y: 660, w: 210, dur: '16s', delay: '2.5s' },
];

function TechBackground() {
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {/* Barely-there grid, dissolved toward the edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, #000 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, #000 20%, transparent 78%)',
        }}
      />

      {/* Motion lines on the mark's forward lean */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="zk-streak-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <g transform="rotate(-7 720 450)">
          {SPRINT_STREAKS.map((streak) => (
            <rect
              key={`${streak.x}-${streak.y}`}
              className="zk-anim"
              x={streak.x}
              y={streak.y}
              width={streak.w}
              height={1.5}
              rx={0.75}
              fill="url(#zk-streak-grad)"
              style={{
                animation: `zk-streak ${streak.dur} linear infinite`,
                animationDelay: streak.delay,
              }}
            />
          ))}
        </g>
      </svg>

      {/* Single soft glow behind the card + edge vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 45% 50% at 50% 48%, rgba(37, 99, 235, 0.14) 0%, transparent 72%),' +
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(3, 6, 12, 0.55) 100%)',
        }}
      />
    </div>
  );
}

// globals.css forces .ant-card / .ant-input backgrounds with !important, so the
// dark surface has to be reasserted at higher specificity under .zk-login.
const formStyles = `
.zk-login .ant-input,
.zk-login .ant-input-affix-wrapper {
  background-color: rgba(148, 163, 184, 0.07) !important;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 999px;
  font-size: 14px;
  padding-left: 20px;
  padding-right: 20px;
  color: #E8EDF5;
}
/* The inner input of an affix wrapper must stay bare, or it renders as a box-in-a-box */
.zk-login .ant-input-affix-wrapper .ant-input {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: #E8EDF5;
}
.zk-login .ant-input-affix-wrapper .ant-input:focus,
.zk-login .ant-input-affix-wrapper .ant-input:hover {
  border: none !important;
  box-shadow: none !important;
}
.zk-login .ant-input::placeholder,
.zk-login .ant-input-affix-wrapper input::placeholder { color: #5A6982 !important; }
.zk-login .ant-input-affix-wrapper:hover,
.zk-login .ant-input:hover { border-color: rgba(148, 163, 184, 0.34); }
.zk-login .ant-input-affix-wrapper:focus-within,
.zk-login .ant-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}
.zk-login .ant-form-item-label > label { color: #94A3B8 !important; font-size: 13px; }
.zk-login .ant-checkbox-wrapper { color: #94A3B8; }
.zk-login .ant-btn-primary { box-shadow: 0 8px 22px rgba(37, 99, 235, .32) !important; }
.zk-login input:-webkit-autofill,
.zk-login input:-webkit-autofill:hover,
.zk-login input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #171d27 inset !important;
  -webkit-text-fill-color: #E8EDF5 !important;
  caret-color: #E8EDF5;
}
.zk-submit { transition: transform .2s ease, box-shadow .2s ease; }
.zk-login .zk-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(37, 99, 235, .42) !important;
}
.zk-social { transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.zk-social:hover:not(:disabled) {
  background: rgba(148, 163, 184, .12) !important;
  border-color: rgba(148, 163, 184, .3) !important;
  transform: translateY(-1px);
}
.zk-link:hover { color: #93C5FD !important; }
.zk-login .ant-input-password-icon { color: #5A6982 !important; }
.zk-login .ant-input-password-icon:hover { color: #94A3B8 !important; }
@media (prefers-reduced-motion: reduce) {
  .zk-submit, .zk-social { transition: none; }
  .zk-submit:hover, .zk-social:hover { transform: none; }
}
`;

// The login page owns a fixed dark surface, independent of the user's app theme.
const loginTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    colorPrimary: '#3B82F6',
    colorText: '#E8EDF5',
    colorTextSecondary: '#94A3B8',
    colorTextPlaceholder: '#5A6982',
    colorBorder: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 10,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Input: {
      colorBgContainer: 'rgba(148, 163, 184, 0.07)',
      colorBorder: 'rgba(148, 163, 184, 0.14)',
      hoverBorderColor: 'rgba(148, 163, 184, 0.32)',
      activeBorderColor: '#3B82F6',
      activeShadow: '0 0 0 3px rgba(59, 130, 246, 0.16)',
      controlHeight: 48,
      borderRadius: 999,
    },
    Form: {
      itemMarginBottom: 12,
    },
    Checkbox: {
      colorBgContainer: 'rgba(148, 163, 184, 0.08)',
      colorBorder: 'rgba(148, 163, 184, 0.28)',
    },
    Button: {
      controlHeight: 48,
      borderRadius: 999,
      fontWeight: 600,
    },
  },
};

export default function LoginPage() {
  // Which brand this door belongs to. Resolved server-side from the Host, so
  // the first painted frame is already correct — a Testiez customer must
  // never glimpse the Zukvo mark.
  const { brand, manifest, product } = useProduct();

  return (
    <ConfigProvider theme={loginTheme}>
      <div
        className="zk-login"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background:
            'linear-gradient(145deg, #090b10 0%, #11151d 45%, #0a0d13 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          overflow: 'hidden',
        }}
      >
        <style>{backgroundStyles + formStyles}</style>
        <TechBackground />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 380,
          }}
        >
          {/* Logo + wordmark lockup */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 32,
            }}
          >
            {/* The canvas is charcoal, so the mark needs inverting — but only
                the Zukvo one, which is drawn dark-on-light. Testiez ships
                artwork cut for dark surfaces already. */}
            <Image
              src={brand.mark}
              alt=""
              width={44}
              height={44}
              style={{
                objectFit: 'contain',
                filter: product === 'zukvo' ? 'invert(1)' : undefined,
              }}
            />
            {brand.wordmarkLight ? (
              <Image
                src={brand.wordmarkLight}
                alt={manifest.name}
                height={32}
                style={{ objectFit: 'contain', width: 'auto' }}
              />
            ) : (
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: '#F8FAFC',
                  fontWeight: 600,
                  fontSize: 32,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {manifest.name}
              </Title>
            )}
          </div>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginFormWithParams />
          </Suspense>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 12, color: '#4A566B' }}>
              © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}