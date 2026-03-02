'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Space, Typography, Tag, Spin, Empty, App } from 'antd';
import { SendOutlined, DeleteOutlined, RobotOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { agentService, ChatMessage } from '@/services/agentService';
import { useAuth } from '@/context/AuthContext';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

export default function AgentChat() {
  const { user } = useAuth();
  const { message: messageApi } = App.useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [activeTool, setActiveTool] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadId = `user-${user?.id}`;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Load conversation history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await agentService.getHistory(threadId);
      
      // Convert history messages to chat messages
      const formattedMessages: ChatMessage[] = (history.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load history:', error);
      // Don't show error to user, just start fresh
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingMessage('');
    setActiveTool([]);

    try {
      await agentService.chatStream(
        userMessage.content,
        // onChunk
        (chunk) => {
          setStreamingMessage(prev => prev + chunk);
        },
        // onToolCall
        (tools) => {
          setActiveTool(tools);
        },
        // onComplete
        () => {
          if (streamingMessage) {
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: streamingMessage,
              timestamp: new Date(),
              toolCalls: activeTool.length > 0 ? activeTool : undefined,
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
          setStreamingMessage('');
          setActiveTool([]);
          setLoading(false);
        },
        // onError
        (error) => {
          console.error('Chat error:', error);
          messageApi.error(`Failed to get response: ${error}`);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `I encountered an error: ${error}. Please try again.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setStreamingMessage('');
          setActiveTool([]);
          setLoading(false);
        },
        threadId
      );
    } catch (error) {
      setLoading(false);
      setStreamingMessage('');
      setActiveTool([]);
      messageApi.error('Failed to send message');
    }
  };

  const handleClearHistory = async () => {
    try {
      await agentService.clearHistory(threadId);
      setMessages([]);
      messageApi.success('Conversation history cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      messageApi.error('Failed to clear history');
    }
  };

  const handleReload = () => {
    loadHistory();
    messageApi.info('Reloading conversation...');
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>Project Assistant</Text>
          <Tag color="green">AI</Tag>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReload}
            size="small"
            disabled={loading || historyLoading}
          >
            Reload
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleClearHistory}
            disabled={messages.length === 0 || loading}
            size="small"
            danger
          >
            Clear
          </Button>
        </Space>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', padding: '16px' }}
    >
      {/* Messages Area */}
      <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="Loading conversation..." />
          </div>
        ) : messages.length === 0 && !streamingMessage ? (
          <Empty
            image={<RobotOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description={
              <Space direction="vertical" align="center">
                <Text type="secondary" strong>Start a conversation with the Project Assistant</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Try asking: "Show me all active projects" or "What tickets are assigned to me?"
                </Text>
              </Space>
            }
            style={{ padding: '40px 20px' }}
          />
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 8,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: msg.role === 'user' ? '#1890ff' : '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? (
                    <UserOutlined style={{ color: 'white' }} />
                  ) : (
                    <RobotOutlined style={{ color: '#1890ff' }} />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    backgroundColor: msg.role === 'user' ? '#1890ff' : '#f5f5f5',
                    color: msg.role === 'user' ? 'white' : 'black',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Paragraph
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        color: msg.role === 'user' ? 'white' : 'inherit',
                      }}
                    >
                      {msg.content}
                    </Paragraph>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <Space wrap size={4}>
                        {msg.toolCalls.map((tool, i) => (
                          <Tag key={i} color="blue" style={{ fontSize: 11, margin: 0 }}>
                            🔧 {tool}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Space>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RobotOutlined style={{ color: '#1890ff' }} />
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space size="small">
                      <Spin size="small" />
                      <Text type="secondary" style={{ fontSize: 12 }}>Typing...</Text>
                    </Space>
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {streamingMessage}
                    </Paragraph>
                    {activeTool.length > 0 && (
                      <Space wrap size={4}>
                        {activeTool.map((tool, i) => (
                          <Tag key={i} color="processing" style={{ fontSize: 11, margin: 0 }}>
                            🔧 {tool}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Space>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about projects, tickets, or anything else... (Shift+Enter for new line)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
          style={{ height: 'auto' }}
        >
          Send
        </Button>
      </Space.Compact>

      {/* Helper text */}
      {messages.length === 0 && !streamingMessage && !historyLoading && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Tip: Try "Show my active projects", "What tickets need attention?", or "Create a new ticket"
          </Text>
        </div>
      )}
    </Card>
  );
}
