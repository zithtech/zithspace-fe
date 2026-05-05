// "use client";

// import React, { useEffect, useState } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import { Space, Typography, Card, Button, Badge, Row, Col, message, Spin ,Modal} from "antd";
// const { Title, Text, Paragraph } = Typography;
// import {
//   SettingOutlined,
//   GoogleOutlined,
//   WindowsOutlined,
//   CalendarOutlined,
//   CheckCircleFilled,
//   DisconnectOutlined,
//   LinkOutlined
// } from "@ant-design/icons";
// import { CalendarService, CalendarProvider, CalendarStatus } from "@/services/calendarService";

// interface ProviderConfig {
//   key: CalendarProvider;
//   name: string;
//   icon: React.ReactNode;
//   color: string;
//   description: string;
// }

// const PROVIDERS: ProviderConfig[] = [
//   {
//     key: "GOOGLE",
//     name: "Google Calendar",
//     icon: <GoogleOutlined />,
//     color: "#4285F4",
//     description: "Connect your Google Calendar to sync meetings and events."
//   },
//   {
//     key: "ZOHO",
//     name: "Zoho Calendar",
//     icon: <CalendarOutlined />,
//     color: "#F44336",
//     description: "Sync your Zoho Calendar events and manage them within Zithspace."
//   },
//   {
//     key: "MICROSOFT",
//     name: "Microsoft Outlook",
//     icon: <WindowsOutlined />,
//     color: "#00A4EF",
//     description: "Connect your Outlook calendar for a unified schedule view."
//   }
// ];

// export default function IntegrationPage() {
//   const [statuses, setStatuses] = useState<Record<string, CalendarStatus | null>>({});
//   const [loading, setLoading] = useState<Record<string, boolean>>({});

//   const fetchStatuses = async () => {
//     const newStatuses: Record<string, CalendarStatus | null> = {};
//     for (const provider of PROVIDERS) {
//       try {
//         const status = await CalendarService.getStatus(provider.key);
//         newStatuses[provider.key] = status;
//       } catch (error) {
//         console.error(`Failed to get status for ${provider.key}:`, error);
//         newStatuses[provider.key] = { connected: false, provider: provider.key, lastSync: null };
//       }
//     }
//     setStatuses(newStatuses);
//   };

//   useEffect(() => {
//     fetchStatuses();
//   }, []);

//   // const handleConnect = async (provider: CalendarProvider) => {
//   //   setLoading(prev => ({ ...prev, [provider]: true }));
//   //   try {
//   //     const url = await CalendarService.getConnectUrl(provider);
//   //     window.location.href = url;
//   //   } catch (error: any) {
//   //     message.error(error.message || `Failed to connect to ${provider}`);
//   //     setLoading(prev => ({ ...prev, [provider]: false }));
//   //   }
//   // };



//   const handleConnect = async (provider: CalendarProvider) => {
//   // Check if user is authenticated
//   const token = localStorage.getItem('accessToken');
//   if (!token) {
//     message.warning('Please log in to connect your calendar');
//     window.location.href = '/login?redirect=/integrations';
//     return;
//   }

//   // Check if another provider is already connected
//   const anyConnected = Object.values(statuses).some(s => s?.connected);
//   const currentProviderConnected = statuses[provider]?.connected;

//   // If this provider is already connected, do nothing
//   if (currentProviderConnected) {
//     message.info(`${provider} is already connected`);
//     return;
//   }

//   // If another provider is connected, show confirmation
//   if (anyConnected) {
//     Modal.confirm({
//       title: 'Switch Calendar Provider?',
//       content: 'You already have a calendar connected. Connecting a new one will disconnect the current provider. Continue?',
//       okText: 'Yes, Switch',
//       cancelText: 'No',
//       onOk: async () => {
//         setLoading(prev => ({ ...prev, [provider]: true }));
//         try {
//           const url = await CalendarService.getConnectUrl(provider);
//           window.location.href = url;
//         } catch (error: any) {
//           message.error(error.message || `Failed to connect to ${provider}`);
//           setLoading(prev => ({ ...prev, [provider]: false }));
//         }
//       }
//     });
//   } else {
//     // No provider connected, connect directly
//     setLoading(prev => ({ ...prev, [provider]: true }));
//     try {
//       const url = await CalendarService.getConnectUrl(provider);
//       window.location.href = url;
//     } catch (error: any) {
//       message.error(error.message || `Failed to connect to ${provider}`);
//       setLoading(prev => ({ ...prev, [provider]: false }));
//     }
//   }
// };


//   const handleDisconnect = async (provider: CalendarProvider) => {
//     setLoading(prev => ({ ...prev, [provider]: true }));
//     try {
//       await CalendarService.disconnect(provider);
//       message.success(`${provider} disconnected successfully`);
//       await fetchStatuses();
//     } catch (error: any) {
//       message.error(error.message || `Failed to disconnect ${provider}`);
//     } finally {
//       setLoading(prev => ({ ...prev, [provider]: false }));
//     }
//   };

//   return (
//     <MainLayout>
//       <div style={{ padding: '24px' }}>
//         <div style={{ marginBottom: 32 }}>
//           <Space align="center" size="middle">
//             <SettingOutlined style={{ fontSize: 28, color: "#1677ff" }} />
//             <Title level={2} style={{ margin: 0 }}>
//               Integrations
//             </Title>
//           </Space>
//           <Paragraph style={{ marginTop: 8, color: '#666' }}>
//             Connect your favorite tools to Zithspace to streamline your workflow and sync your schedule.
//           </Paragraph>
//         </div>

//         <Title level={4} style={{ marginBottom: 24 }}>Calendar Integrations</Title>

//         <Row gutter={[24, 24]}>
//           {/* {PROVIDERS.map((provider) => {
//             const status = statuses[provider.key];
//             const isConnected = status?.connected;
//             const isLoading = loading[provider.key];

//             return (
//               <Col xs={24} sm={12} lg={8} key={provider.key}>
//                 <Card
//                   hoverable
//                   style={{ height: '100%', borderRadius: 12, overflow: 'hidden' }}
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
//                     <div style={{
//                       fontSize: 32,
//                       color: provider.color,
//                       background: `${provider.color}15`,
//                       padding: 12,
//                       borderRadius: 12,
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center'
//                     }}>
//                       {provider.icon}
//                     </div>
//                     {isConnected && (
//                       <Badge status="success" text={<Text type="success">Connected</Text>} />
//                     )}
//                   </div>

//                   <Title level={4} style={{ marginBottom: 12 }}>{provider.name}</Title>
//                   <Paragraph type="secondary" style={{ height: 44, marginBottom: 24, overflow: 'hidden' }}>
//                     {provider.description}
//                   </Paragraph>

//                   <div style={{ marginTop: 'auto' }}>
//                     {isConnected ? (
//                       <Space direction="vertical" style={{ width: '100%' }}>
//                         <Button
//                           danger
//                           block
//                           icon={<DisconnectOutlined />}
//                           onClick={() => handleDisconnect(provider.key)}
//                           loading={isLoading}
//                         >
//                           Disconnect
//                         </Button>
//                         {status?.lastSync && (
//                           <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
//                             Last synced: {new Date(status.lastSync).toLocaleString()}
//                           </Text>
//                         )}
//                       </Space>
//                     ) : (
//                       <Button
//                         type="primary"
//                         block
//                         icon={<LinkOutlined />}
//                         onClick={() => handleConnect(provider.key)}
//                         loading={isLoading}
//                         style={{ background: provider.color, borderColor: provider.color }}
//                       >
//                         Connect {provider.name.split(' ')[0]}
//                       </Button>
//                     )}
//                   </div>
//                 </Card>
//               </Col>
//             );
//           })} */}
//           {PROVIDERS.map((provider) => {
//     const status = statuses[provider.key];
//     const isConnected = status?.connected;
//     const isLoading = loading[provider.key];

//     // Check if ANY provider is connected (and it's not this one)
//     const anyOtherConnected = Object.entries(statuses).some(
//         ([key, s]) => s?.connected && key !== provider.key
//     );

//     return (
//         <Col xs={24} sm={12} lg={8} key={provider.key}>
//             <Card
//                 hoverable
//                 style={{ 
//                     height: '100%', 
//                     borderRadius: 12, 
//                     overflow: 'hidden',
//                     opacity: anyOtherConnected ? 0.7 : 1
//                 }}
//                 bodyStyle={{ padding: 24 }}
//             >
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
//                     <div style={{
//                         fontSize: 32,
//                         color: provider.color,
//                         background: `${provider.color}15`,
//                         padding: 12,
//                         borderRadius: 12,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                     }}>
//                         {provider.icon}
//                     </div>
//                     {isConnected && (
//                         <Badge status="success" text={<Text type="success">Connected</Text>} />
//                     )}
//                     {anyOtherConnected && !isConnected && (
//                         <Badge status="default" text={<Text type="secondary">Disabled</Text>} />
//                     )}
//                 </div>

//                 <Title level={4} style={{ marginBottom: 12 }}>{provider.name}</Title>
//                 <Paragraph type="secondary" style={{ height: 44, marginBottom: 24, overflow: 'hidden' }}>
//                     {provider.description}
//                 </Paragraph>

//                 <div style={{ marginTop: 'auto' }}>
//                     {isConnected ? (
//                         <Space direction="vertical" style={{ width: '100%' }}>
//                             <Button
//                                 danger
//                                 block
//                                 icon={<DisconnectOutlined />}
//                                 onClick={() => handleDisconnect(provider.key)}
//                                 loading={isLoading}
//                             >
//                                 Disconnect
//                             </Button>
//                             {status?.lastSync && (
//                                 <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
//                                     Last synced: {new Date(status.lastSync).toLocaleString()}
//                                 </Text>
//                             )}
//                         </Space>
//                     ) : (
//                         <Button
//                             type="primary"
//                             block
//                             icon={<LinkOutlined />}
//                             onClick={() => handleConnect(provider.key)}
//                             loading={isLoading}
//                             disabled={anyOtherConnected} // Disable if another is connected
//                             style={{ 
//                                 background: provider.color, 
//                                 borderColor: provider.color,
//                                 opacity: anyOtherConnected ? 0.5 : 1 
//                             }}
//                         >
//                             {anyOtherConnected ? 'Switch to ' + provider.name.split(' ')[0] : 'Connect ' + provider.name.split(' ')[0]}
//                         </Button>
//                     )}
//                 </div>
//             </Card>
//         </Col>
//     );
// })}
//         </Row>
//       </div>
//     </MainLayout>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Card, Button, Badge, Row, Col, message, Modal } from "antd";
const { Title, Text, Paragraph } = Typography;
import {
  SettingOutlined,
  GoogleOutlined,
  WindowsOutlined,
  CalendarOutlined,
  DisconnectOutlined,
  LinkOutlined
} from "@ant-design/icons";
import { CalendarService, CalendarProvider, CalendarStatus } from "@/services/calendarService";
import { useRouter } from "next/navigation";

interface ProviderConfig {
  key: CalendarProvider;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: "GOOGLE",
    name: "Google Calendar",
    icon: <GoogleOutlined />,
    color: "#4285F4",
    description: "Sync your Google Calendar meetings."
  },
  {
    key: "ZOHO",
    name: "Zoho Calendar",
    icon: <CalendarOutlined />,
    color: "#F44336",
    description: "Manage Zoho events within Zithspace."
  },
  {
    key: "MICROSOFT",
    name: "Microsoft Outlook",
    icon: <WindowsOutlined />,
    color: "#00A4EF",
    description: "Unified schedule with Outlook."
  }
];

import { usePermission } from "@/hooks/usePermission";
import { AlertCircle } from "lucide-react";

export default function IntegrationPage() {
  const { canReadMail, canReadCalendar } = usePermission();
  const [statuses, setStatuses] = useState<Record<string, CalendarStatus | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchStatuses = async () => {
    const newStatuses: Record<string, CalendarStatus | null> = {};
    for (const provider of PROVIDERS) {
      try {
        const status = await CalendarService.getStatus(provider.key);
        newStatuses[provider.key] = status;
      } catch (error) {
        newStatuses[provider.key] = { connected: false, provider: provider.key, lastSync: null };
      }
    }
    setStatuses(newStatuses);
  };

  useEffect(() => {
    if (canReadMail || canReadCalendar) {
      fetchStatuses();
    }
  }, [canReadMail, canReadCalendar]);

  const router = useRouter();

  useEffect(() => {
    if (!canReadMail && !canReadCalendar) {
      Modal.error({
        title: 'Access Denied',
        content: "You don't have the required permissions (Mail or Calendar) to manage integrations. Please contact your administrator.",
        onOk: () => router.push('/dashboard'),
        okText: 'Back to Dashboard',
        centered: true,
        maskClosable: false,
      });
    }
  }, [canReadMail, canReadCalendar, router]);

  const handleConnect = async (provider: CalendarProvider) => {
    if (!canReadCalendar) {
      message.error("You don't have permission to connect calendars.");
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      message.warning('Please log in to connect your calendar');
      window.location.href = '/login?redirect=/integrations';
      return;
    }

    const anyConnected = Object.values(statuses).some(s => s?.connected);
    const currentProviderConnected = statuses[provider]?.connected;

    if (currentProviderConnected) {
      message.info(`${provider} is already connected`);
      return;
    }

    if (anyConnected) {
      Modal.confirm({
        title: 'Switch Calendar Provider?',
        content: 'Connecting a new provider will disconnect the current one. Continue?',
        okText: 'Yes, Switch',
        cancelText: 'No',
        onOk: async () => {
          performConnection(provider);
        }
      });
    } else {
      performConnection(provider);
    }
  };

  const performConnection = async (provider: CalendarProvider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      const url = await CalendarService.getConnectUrl(provider);
      window.location.href = url;
    } catch (error: any) {
      message.error(error.message || `Failed to connect to ${provider}`);
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    setLoading(prev => ({ ...prev, [provider]: true }));
    try {
      await CalendarService.disconnect(provider);
      message.success(`${provider} disconnected successfully`);
      await fetchStatuses();
    } catch (error: any) {
      message.error(error.message || `Failed to disconnect ${provider}`);
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: 'var(--bg-pure-white)', minHeight: '100vh' }}>
        {/* Main content container */}
        <div style={{
          background: 'var(--bg-pure-white)',
          padding: '16px 0',
          width: '100%'
        }}>

          <div style={{ marginBottom: 32 }}>
            <Space align="center" size="middle">
              <SettingOutlined style={{ fontSize: 24, color: "var(--premium-blue)" }} />
              <Title level={3} style={{ margin: 0, color: "var(--text-primary)" }}>
                Integrations
              </Title>
            </Space>
            <Paragraph style={{ marginTop: 8, color: 'var(--text-secondary)', maxWidth: '800px' }}>
              Connect your favorite tools to Zithspace to streamline your workflow and sync your schedule.
            </Paragraph>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <Title level={5} style={{ marginBottom: 20, color: "var(--text-primary)" }}>Calendar Integrations</Title>

            <Row gutter={[16, 16]} justify="start">
              {PROVIDERS.map((provider) => {
                const status = statuses[provider.key];
                const isConnected = status?.connected;
                const isLoading = loading[provider.key];

                // Check if ANY provider is connected
                const anyProviderConnected = Object.values(statuses).some(s => s?.connected);

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={provider.key}>
                    <Card
                      hoverable
                      size="small"
                      style={{
                        borderRadius: 8,
                        border: isConnected ? `1px solid ${provider.color}` : '1px solid var(--border-color)',
                        background: 'var(--bg-pure-white)',
                        transition: 'all 0.2s',
                        height: '100%'
                      }}
                      styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{
                          fontSize: 18,
                          color: provider.color,
                          background: `${provider.color}12`,
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex'
                        }}>
                          {provider.icon}
                        </div>
                        {isConnected && (
                          <Badge
                            color={provider.color}
                            text={<Text strong style={{ fontSize: 11, color: provider.color }}>Active</Text>}
                          />
                        )}
                      </div>

                      <Title level={5} style={{ marginBottom: 4, fontSize: 14 }}>{provider.name}</Title>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16, flexGrow: 1, lineHeight: '1.4' }}>
                        {provider.description}
                      </Paragraph>

                      <div style={{ marginTop: 'auto' }}>
                        {isConnected ? (
                          <Space direction="vertical" style={{ width: '100%' }} size={4}>
                            <Button
                              danger
                              block
                              size="small"
                              icon={<DisconnectOutlined />}
                              onClick={() => handleDisconnect(provider.key)}
                              loading={isLoading}
                              style={{ borderRadius: '6px' }}
                            >
                              Disconnect
                            </Button>
                            {status?.lastSync && (
                              <Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: 'center' }}>
                                Last Sync: {new Date(status.lastSync).toLocaleString(undefined, {
                                  dateStyle: 'short',
                                  timeStyle: 'short'
                                })}
                              </Text>
                            )}
                          </Space>
                        ) : (
                          <Button
                            type="primary"
                            block
                            size="small"
                            icon={<LinkOutlined />}
                            onClick={() => handleConnect(provider.key)}
                            loading={isLoading}
                            // Button is disabled if another provider is connected
                            disabled={anyProviderConnected}
                            style={{
                              background: anyProviderConnected ? '#f5f5f5' : provider.color,
                              borderColor: anyProviderConnected ? '#d9d9d9' : provider.color,
                              color: anyProviderConnected ? 'rgba(0,0,0,0.25)' : '#fff',
                              borderRadius: '6px'
                            }}
                          >
                            {anyProviderConnected ? 'Switch' : 'Connect'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}