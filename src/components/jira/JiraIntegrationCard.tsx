import React, { useState } from "react";
import { Card, Typography, Button, Tag, Space, message } from "antd";
import { Plug, ServerCrash, Blocks } from "lucide-react";
import JiraMigrationWizard from "./JiraMigrationWizard";
import { api } from "@/lib/axios";

const { Title, Text } = Typography;

export default function JiraIntegrationCard() {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get("/api/integrations/jira/status");
        if (res && res.connected) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Failed to check Jira status", err);
      }
    };
    checkStatus();
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/integrations/jira/connect");
      
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      message.error(err.message || "Failed to connect to Jira");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post("/api/integrations/jira/disconnect", {});
      setIsConnected(false);
      message.success("Jira disconnected.");
    } catch (err) {
      message.error("Failed to disconnect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        hoverable
        style={{
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-pure-white)',
          height: '100%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
        styles={{ body: { padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginRight: 16,
            color: '#0052CC' // Jira Blue
          }}>
            <Blocks size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Jira Migration
            </Title>
            <Text style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Import your existing Jira projects, tickets, and bugs into Zukvo.
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px 8px', marginTop: 'auto' }}>
          {isConnected ? (
             <Tag color="success" style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: 12, margin: 0, border: 'none' }}>
              Connected ✓
             </Tag>
          ) : (
            <Tag color="warning" style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 600, fontSize: 12, margin: 0, border: 'none' }}>
              Not Connected
            </Tag>
          )}
          <Space>
            {isConnected ? (
              <>
                <Button type="primary" onClick={() => setShowWizard(true)} size="small" style={{ borderRadius: 6, fontWeight: 500, height: 28 }}>
                  Start Migration
                </Button>
                <Button
                  onClick={handleDisconnect}
                  loading={loading}
                  size="small"
                  style={{
                    borderRadius: 6,
                    fontWeight: 500,
                    height: 28,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderColor: 'transparent'
                  }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<Plug size={14} />}
                onClick={handleConnect}
                loading={loading}
                size="small"
                style={{
                  borderRadius: 6,
                  fontWeight: 500,
                  background: '#0052CC',
                  borderColor: 'transparent',
                  height: 28,
                }}
              >
                Connect Jira
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <JiraMigrationWizard 
        visible={showWizard} 
        onClose={() => setShowWizard(false)} 
      />
    </>
  );
}
