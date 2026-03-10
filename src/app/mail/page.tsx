"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Layout, Menu, Typography, Button, Space, Avatar, List, Divider, Empty, Spin, Input, Drawer, Badge, Modal, Form, message, Select, Popconfirm, Checkbox } from "antd";
import {
  MailOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  PaperClipOutlined,
  SearchOutlined,
  EditOutlined,
  InboxOutlined,
  SendOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FolderOutlined,
  CloseOutlined,
  RollbackOutlined
} from "@ant-design/icons";
import { useMail } from "@/hooks/useMail";
import { MailService, MailMessage } from "@/services/mailService";
import { userService, User } from "@/services/userService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Sider, Content, Header } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function MailPage() {
  const { threads, loading, syncing, isSending, isSavingDraft, error, connectedEmail, isFetchingStatus, fetchThreads, syncMail, sendMessage, saveDraft, sendDraft, deleteThread, deleteThreads, restoreThread, emptyTrash } = useMail();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [composeVisible, setComposeVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [users, setUsers] = useState<{ name: string; email: string }[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [quickReply, setQuickReply] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    setSelectedThreadIds([]);
    fetchThreads(selectedFolder);
    fetchUsers();
  }, [fetchThreads, selectedFolder]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const data = await MailService.getContacts();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch contacts for compose drawer:", err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (selectedThreadId) {
      if (selectedFolder === "DRAFTS") {
        openDraft(selectedThreadId);
      } else {
        loadMessages(selectedThreadId);
        setDrawerVisible(true);
      }
    }
  }, [selectedThreadId]);

  const openDraft = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const data = await MailService.getThreadMessages(threadId);
      const msgs = data?.data || data || [];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) {
        form.setFieldsValue({
          to: lastMsg.toEmails || [],
          cc: lastMsg.ccEmails || [],
          bcc: lastMsg.bccEmails || [],
          subject: lastMsg.subject || "",
          body: lastMsg.bodyText || lastMsg.bodyHtml || ""
        });
        setCurrentDraftId(lastMsg.id);
        setComposeVisible(true);
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
      message.error("Failed to load draft");
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const data = await MailService.getThreadMessages(threadId);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const folderItems = [
    { key: "INBOX", icon: <InboxOutlined />, label: "Inbox", count: selectedFolder === "INBOX" ? threads.length : 0 },
    { key: "SENT", icon: <SendOutlined />, label: "Sent", count: selectedFolder === "SENT" ? threads.length : 0 },
    { key: "DRAFTS", icon: <FileTextOutlined />, label: "Drafts", count: selectedFolder === "DRAFTS" ? threads.length : 0 },
    { key: "SPAM", icon: <ExclamationCircleOutlined />, label: "Spam", count: selectedFolder === "SPAM" ? threads.length : 0 },
    { key: "TRASH", icon: <DeleteOutlined />, label: "Trash", count: selectedFolder === "TRASH" ? threads.length : 0 },
    { key: "ARCHIVE", icon: <FolderOutlined />, label: "Archive", count: selectedFolder === "ARCHIVE" ? threads.length : 0 },
  ];

  return (
    <MainLayout>
      <Layout style={{ height: "calc(100vh - 64px)", background: "#fff" }}>
        {/* Header Section */}
        <Header style={{
          background: "#fff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #f0f0f0",
          height: "64px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MailOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>Mail</Title>
          </div>

          <Input
            placeholder="Search mail..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            style={{ width: "40%", borderRadius: "8px" }}
          />

          <Space size="middle">
            {selectedFolder === "TRASH" && threads.length > 0 && (
              <Popconfirm
                title="Empty Trash?"
                description="All conversations in Trash will be permanently deleted. This action cannot be undone."
                onConfirm={async () => {
                  const res = await emptyTrash();
                  if (res.success) {
                    message.success("Trash emptied");
                    syncMail(selectedFolder);
                  }
                }}
                okText="Empty Trash"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>Empty Trash</Button>
              </Popconfirm>
            )}
            <Button
              type="text"
              icon={<SyncOutlined spin={syncing} />}
              onClick={() => syncMail(selectedFolder)}
              disabled={syncing}
            />
            <Avatar icon={<UserOutlined />} style={{ cursor: "pointer" }} />
          </Space>
        </Header>

        <Layout>
          {/* Left Sider - Folders and Compose */}
          <Sider width={250} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
            <div style={{ padding: "16px" }}>
              <Button
                type="primary"
                icon={<EditOutlined rotate={270} />}
                block
                size="large"
                style={{ borderRadius: "8px", fontWeight: "bold", height: "48px" }}
                onClick={() => {
                  form.resetFields();
                  setCurrentDraftId(null);
                  setComposeVisible(true);
                }}
              >
                Compose
              </Button>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedFolder]}
              onClick={({ key }) => setSelectedFolder(key)}
              style={{ borderRight: 0 }}
              items={folderItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{item.label}</span>
                    {item.count > 0 && <Badge count={item.count} overflowCount={999} style={{ backgroundColor: "#f5f5f5", color: "#8c8c8c", boxShadow: "none" }} />}
                  </div>
                )
              }))}
            />
          </Sider>

          {/* Center Content - Thread List */}
          <Content style={{ overflow: "auto", background: "#f9f9f9" }}>
            {threads.length > 0 && (
              <div style={{ padding: "8px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Space>
                  <Checkbox
                    checked={threads.length > 0 && selectedThreadIds.length === threads.length}
                    indeterminate={selectedThreadIds.length > 0 && selectedThreadIds.length < threads.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedThreadIds(threads.map(t => t.id));
                      } else {
                        setSelectedThreadIds([]);
                      }
                    }}
                  />
                  {selectedThreadIds.length > 0 && (
                    <>
                      <Divider type="vertical" />
                      <Text type="secondary">{selectedThreadIds.length} selected</Text>
                      <Button
                        size="small"
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={async () => {
                          const res = await deleteThreads(selectedThreadIds);
                          if (res.success) {
                            message.success("Selected items deleted");
                            setSelectedThreadIds([]);
                            syncMail(selectedFolder);
                          }
                        }}
                      >
                        Delete
                      </Button>
                      {selectedFolder === "TRASH" && (
                        <Button
                          size="small"
                          type="text"
                          icon={<RollbackOutlined />}
                          onClick={async () => {
                            // We need to implement bulk restore or just loop
                            let allSuccess = true;
                            for (const id of selectedThreadIds) {
                              const res = await restoreThread(id);
                              if (!res.success) allSuccess = false;
                            }
                            if (allSuccess) message.success("Selected items restored");
                            else message.warning("Some items failed to restore");
                            setSelectedThreadIds([]);
                            syncMail(selectedFolder);
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </>
                  )}
                </Space>
              </div>
            )}
            {loading && !syncing ? (
              <div style={{ padding: 40, textAlign: "center" }}><Spin size="large" /></div>
            ) : (
              <List
                className="mail-thread-list"
                style={{ padding: "8px" }}
                dataSource={threads}
                renderItem={(item) => (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ paddingLeft: "16px" }}>
                      <Checkbox
                        checked={selectedThreadIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedThreadIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedThreadIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </div>
                    <List.Item
                      onClick={() => setSelectedThreadId(item.id)}
                      style={{
                        flex: 1,
                        cursor: "pointer",
                        padding: "16px 20px",
                        margin: "4px 8px",
                        borderRadius: "8px",
                        background: selectedThreadId === item.id ? "#e6f7ff" : "#fff",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s",
                        boxShadow: selectedThreadId === item.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                      }}
                    >
                      <List.Item.Meta
                        avatar={<Avatar size="large" icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text strong ellipsis style={{ fontSize: "15px" }}>
                              {selectedFolder === 'SENT' ? (item.toEmails?.[0] || 'Unknown Recipient') : (item.fromAddress || 'Unknown Sender')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                              {dayjs(item.lastMessageAt).format("MMM D")}
                            </Text>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: "2px" }}>
                            <Text strong={!item.isRead} style={{ display: "block", color: "var(--ant-text-color)", fontSize: "14px", marginBottom: "2px" }}>
                              {item.subject || "(No Subject)"}
                            </Text>
                            <Paragraph ellipsis={{ rows: 1 }} type="secondary" style={{ marginBottom: 0, fontSize: "13px" }}>
                              {item.snippet || "No preview available"}
                            </Paragraph>
                            {selectedFolder === 'SENT' && item.toEmails && item.toEmails.length > 1 && (
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                + {item.toEmails.length - 1} more
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  </div>
                )}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: "#8c8c8c" }}>
                          No conversations found in {folderItems.find((f) => f.key === selectedFolder)?.label}
                        </span>
                      }
                    />
                  )
                }}
              />
            )}
          </Content>
        </Layout>

        {/* Right Drawer - Message Details */}
        <Drawer
          title={selectedThread?.subject || "No Subject"}
          placement="right"
          width={650}
          onClose={() => {
            setDrawerVisible(false);
            setSelectedThreadId(null);
          }}
          open={drawerVisible}
          extra={
            <Space>
              {selectedFolder === "TRASH" && (
                <Button
                  icon={<RollbackOutlined />}
                  onClick={async () => {
                    if (selectedThreadId) {
                      const res = await restoreThread(selectedThreadId);
                      if (res.success) {
                        message.success("Thread restored to Inbox");
                        setDrawerVisible(false);
                        setSelectedThreadId(null);
                        syncMail(selectedFolder);
                      }
                    }
                  }}
                >
                  Restore
                </Button>
              )}
              <Popconfirm
                title={selectedFolder === "TRASH" ? "Permanently delete?" : "Move to trash?"}
                description={selectedFolder === "TRASH" ? "This action cannot be undone." : "You can restore it later from the Trash folder."}
                onConfirm={async () => {
                  if (selectedThreadId) {
                    const res = await deleteThread(selectedThreadId);
                    if (res.success) {
                      message.success(selectedFolder === "TRASH" ? "Thread permanently deleted" : "Thread moved to trash");
                      setDrawerVisible(false);
                      setSelectedThreadId(null);
                      syncMail(selectedFolder);
                    }
                  }
                }}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button icon={<DeleteOutlined />} type="text" danger />
              </Popconfirm>
              <Button icon={<ExclamationCircleOutlined />} type="text" />
            </Space>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflow: "auto", paddingBottom: "20px" }}>
              <List
                dataSource={messages}
                renderItem={(msg) => (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
                      <Avatar size="large" icon={<UserOutlined />} style={{ marginRight: 12, marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: "15px" }}>{msg.fromEmail}</Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              to {Array.isArray(msg.toEmails) ? msg.toEmails.join(", ") : msg.toEmails}
                            </Text>
                          </Space>
                          <Space>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {dayjs(msg.receivedAt).format("MMM D, YYYY [at] h:mm A")}
                            </Text>
                            <Button
                              type="text"
                              icon={<RollbackOutlined />}
                              size="small"
                              onClick={() => {
                                // Scroll to quick reply and focus
                                const textArea = document.getElementById('quick-reply-textarea');
                                if (textArea) textArea.focus();
                              }}
                            >
                              Reply
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </div>

                    <div className="mail-body" style={{
                      background: "#fff",
                      padding: "0 8px",
                      lineHeight: "1.6"
                    }}>
                      {msg.bodyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.bodyHtml }} />
                      ) : (
                        <Paragraph style={{ whiteSpace: "pre-wrap" }}>{msg.bodyText}</Paragraph>
                      )}
                    </div>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 20, padding: "12px", background: "#f5f5f5", borderRadius: "8px" }}>
                        <Text strong style={{ fontSize: "13px", display: "block", marginBottom: 8 }}>
                          Attachments ({msg.attachments.length})
                        </Text>
                        <Space wrap>
                          {msg.attachments.map(att => (
                            <Button
                              key={att.id}
                              size="small"
                              icon={<PaperClipOutlined />}
                              href={att.downloadUrl}
                              target="_blank"
                              style={{ borderRadius: "4px" }}
                            >
                              {att.fileName}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    )}
                    <Divider />
                  </div>
                )}
              />
            </div>

            {/* Quick Reply Area */}
            <div style={{
              padding: "20px 0 0 0",
              borderTop: "1px solid #f0f0f0",
              background: "#fff"
            }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ flex: 1 }}>
                  <TextArea
                    id="quick-reply-textarea"
                    placeholder="Write a reply..."
                    autoSize={{ minRows: 2, maxRows: 10 }}
                    value={quickReply}
                    onChange={(e) => setQuickReply(e.target.value)}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #d9d9d9",
                      padding: "8px 12px"
                    }}
                  />
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isSendingReply}
                      disabled={!quickReply.trim()}
                      onClick={async () => {
                        const lastMsg = messages[messages.length - 1];
                        if (!lastMsg) return;

                        setIsSendingReply(true);
                        const result = await sendMessage({
                          to: [lastMsg.fromEmail],
                          subject: lastMsg.subject.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject}`,
                          body: quickReply
                        });

                        if (result.success) {
                          message.success("Reply sent");
                          setQuickReply("");
                          // Refresh messages to show the new one
                          if (selectedThreadId) {
                            const data = await MailService.getThreadMessages(selectedThreadId);
                            setMessages(data?.data || data || []);
                          }
                        } else {
                          message.error("Failed to send reply");
                        }
                        setIsSendingReply(false);
                      }}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Drawer>

        {/* Compose Drawer */}
        <Drawer
          title={<div style={{ padding: "4px 0" }}><Title level={4} style={{ margin: 0 }}>New Message</Title></div>}
          placement="right"
          width={650}
          onClose={() => {
            setComposeVisible(false);
            setCurrentDraftId(null);
            setSelectedThreadId(null);
          }}
          open={composeVisible}
          extra={
            <Space>
              <Button
                onClick={async () => {
                  const values = form.getFieldsValue();
                  const draftData = {
                    ...values,
                    to: values.to || [],
                    id: currentDraftId || undefined
                  };
                  const result = await saveDraft(draftData);
                  if (result.success) {
                    message.success("Draft saved");
                    setComposeVisible(false);
                    setCurrentDraftId(null);
                    setSelectedThreadId(null);
                    syncMail(selectedFolder);
                  }
                }}
                loading={isSavingDraft}
              >
                Save as Draft
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={isSending}
                icon={<SendOutlined />}
                style={{ borderRadius: "8px", padding: "0 24px" }}
              >
                Send
              </Button>
            </Space>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              const mailData = {
                ...values,
                to: values.to || [],
                cc: values.cc || undefined,
                bcc: values.bcc || undefined,
              };

              // If we are editing a draft, we should update it first then send it
              // Or just send it if the provider supports sending a draft by ID
              let result;
              if (currentDraftId) {
                // Update draft first to ensure latest content is sent
                await saveDraft({ ...mailData, id: currentDraftId });
                result = await sendDraft(currentDraftId);
              } else {
                result = await sendMessage(mailData);
              }

              if (result.success) {
                message.success("Email sent successfully");
                setComposeVisible(false);
                setCurrentDraftId(null);
                setSelectedThreadId(null);
                form.resetFields();
                syncMail(selectedFolder);
              } else {
                message.error("Failed to send email");
              }
            }}
            initialValues={{ to: [], cc: [], bcc: [], subject: "", body: "" }}
          >
            <Form.Item
              label={<Text type="secondary">From</Text>}
              style={{ marginBottom: "12px" }}
            >
              {isFetchingStatus ? (
                <div style={{ padding: "4px 11px", borderBottom: "1px solid #f0f0f0" }}>
                  <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Loading...</Text>
                </div>
              ) : (
                <Input
                  value={connectedEmail || "No connected email found"}
                  disabled
                  variant="borderless"
                  style={{ borderBottom: "1px solid #f0f0f0", color: "#262626", fontWeight: 500 }}
                />
              )}
            </Form.Item>

            <Form.Item
              name="to"
              label={<Text type="secondary">To</Text>}
              rules={[{ required: true, message: "Recipient is required" }]}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type recipient emails"
                tokenSeparators={[',', ' ']}
                loading={fetchingUsers}
                options={users.map(u => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter(u => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="cc"
              label={<Text type="secondary">Cc</Text>}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type secondary recipient emails"
                tokenSeparators={[',', ' ']}
                loading={fetchingUsers}
                options={users.map(u => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter(u => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="bcc"
              label={<Text type="secondary">Bcc</Text>}
              style={{ marginBottom: "12px" }}
            >
              <Select
                mode="tags"
                placeholder="Select or type blind tertiary recipient emails"
                tokenSeparators={[',', ' ']}
                loading={fetchingUsers}
                options={users.map(u => ({ value: u.email || '', label: `${u.name} (${u.email || 'No Email'})` })).filter(u => u.value)}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                variant="borderless"
                style={{ width: '100%', borderBottom: '1px solid #d9d9d9', borderRadius: 0, padding: 0 }}
                popupMatchSelectWidth={false}
              />
            </Form.Item>

            <Form.Item
              name="subject"
              label={<Text type="secondary">Subject</Text>}
              rules={[{ required: true, message: "Subject is required" }]}
              style={{ marginBottom: "16px" }}
            >
              <Input placeholder="Enter subject" variant="borderless" style={{ borderBottom: "1px solid #f0f0f0", fontWeight: 500 }} />
            </Form.Item>

            <Form.Item
              name="body"
              rules={[{ required: true, message: "Message body is required" }]}
              style={{ marginTop: "24px" }}
            >
              <TextArea
                placeholder="Write your message here..."
                autoSize={{ minRows: 15, maxRows: 25 }}
                variant="borderless"
                style={{ padding: "0 11px" }}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </Layout>
    </MainLayout >
  );
}