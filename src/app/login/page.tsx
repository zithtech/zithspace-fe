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
} from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { useProduct } from '@/context/ProductContext';
import { oauthConfigFor, ssoAvailability, GOOGLE_SCOPE, MS_SCOPE } from '@/lib/oauthConfig';


const { Text } = Typography;

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
      <div
        data-theme="dark"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          minHeight: 240,
          padding: '20px 0',
        }}
      >
        <ZukvoLoader size="lg" />
        <div style={{ marginTop: 16, width: '100%' }}>
          <Text style={{ color: 'var(--zk-ash, #94a3b8)', textAlign: 'center' }}>Redirecting...</Text>
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
          style={{ marginBottom: 26, fontSize: 13 }}
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
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            placeholder="you@company.com"
            autoComplete="email"
            variant="borderless"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          style={{ marginBottom: 14 }}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            placeholder="••••••••"
            autoComplete="current-password"
            variant="borderless"
          />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <Link href="/forgot-password" className="zk-link" style={{ fontSize: 13, fontWeight: 500 }}>
            Forgot password?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="zk-submit"
            icon={!loading ? <ArrowRightOutlined /> : undefined}
            iconPosition="end"
          >
            {loading ? 'Signing in…' : 'Sign in'}
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
              margin: '30px 0 20px',
            }}
          >
            <span style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.14)' }} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#4A566B',
                whiteSpace: 'nowrap',
              }}
            >
              or continue with
            </span>
            <span style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.14)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {sso.google && (
              <Button
                size="large"
                aria-label="Continue with Google"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
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
              />
            )}
            {sso.microsoft && (
              <Button
                size="large"
                aria-label="Continue with Microsoft"
                icon={
                  <svg width="17" height="17" viewBox="0 0 23 23" aria-hidden>
                    <rect x="0" y="0" width="11" height="11" fill="#F25022" />
                    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
                    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
                    <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
                  </svg>
                }
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="zk-social"
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

export default function LoginPage() {
  return (
    <AuthShell
      heading="Welcome back."
      subtitle="Sign in to pick up where you left off."
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginFormWithParams />
      </Suspense>
    </AuthShell>
  );
}
