import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Button, Space, Upload, App } from "antd";
import {
  Send,
  Paperclip,
  X,
  User,
  AtSign,
  Type,
  Sparkles,
  Loader2,
  Plus,
  CornerDownLeft,
  Wand2,
  SpellCheck2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { Lead, LeadService } from "@/services/leadService";
import { MailService } from "@/services/mailService";
import { ProposalService } from "@/services/proposalService";
import TiptapEditor from "@/components/common/TiptapEditor";
import { useAuth } from "@/context/AuthContext";

interface LeadMailDrawerProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
  fromEmail?: string;
  onSuccess?: () => void;
}

export const LeadMailDrawer: React.FC<LeadMailDrawerProps> = ({
  visible,
  onClose,
  lead,
  fromEmail,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingProposal, setFetchingProposal] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [bodyContent, setBodyContent] = useState("");
  const [enhancing, setEnhancing] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const { user } = useAuth();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    if (visible && lead) {
      const initialBody = `<p>Hi ${lead.client_name},</p><p>I'm reaching out regarding the ${lead.title} project. Please find the proposal attached.</p><p>Best regards,<br/>${user?.name || "Team"}</p>`;
      form.setFieldsValue({
        from: fromEmail || "",
        to: lead.client_mail || "",
        subject: `Proposal for ${lead.title}`,
        body: initialBody,
        attachments: [],
      });
      setBodyContent(initialBody);
      setAttachmentCount(0);

      if (lead.proposal_id) {
        handleAttachProposal(lead.proposal_id);
      }
    }
  }, [visible, lead, fromEmail, form, user]);

  const handleEnhanceContent = async () => {
    const currentBody = form.getFieldValue("body") || bodyContent;
    if (!currentBody || currentBody.replace(/<[^>]+>/g, "").trim().length < 10) {
      messageApi.warning("Add a bit more content before enhancing.");
      return;
    }
    try {
      setEnhancing(true);
      const res: any = await MailService.enhanceMailContent({
        subject: form.getFieldValue("subject"),
        body: currentBody,
        context: lead ? `Lead: ${lead.title}, Client: ${lead.client_name}` : undefined,
      });
      const next = res?.data?.body || res?.data?.data?.body || res?.body;
      if (next) {
        form.setFieldsValue({ body: next });
        setBodyContent(next);
        messageApi.success("Content enhanced");
      } else {
        messageApi.info("No changes returned by AI.");
      }
    } catch (err: any) {
      console.error("Enhance failed:", err);
      messageApi.error(err?.message || "Failed to enhance content");
    } finally {
      setEnhancing(false);
    }
  };

  const handleCorrectGrammar = async () => {
    const currentBody = form.getFieldValue("body") || bodyContent;
    if (!currentBody || currentBody.replace(/<[^>]+>/g, "").trim().length === 0) {
      messageApi.warning("Nothing to correct yet.");
      return;
    }
    try {
      setCorrecting(true);
      const res: any = await MailService.correctMailGrammar({ body: currentBody });
      const next = res?.data?.body || res?.data?.data?.body || res?.body;
      if (next) {
        form.setFieldsValue({ body: next });
        setBodyContent(next);
        messageApi.success("Grammar corrected");
      } else {
        messageApi.info("No corrections needed.");
      }
    } catch (err: any) {
      console.error("Grammar correction failed:", err);
      messageApi.error(err?.message || "Failed to correct grammar");
    } finally {
      setCorrecting(false);
    }
  };

  const handleAttachProposal = async (proposalId: string) => {
    try {
      setFetchingProposal(true);
      const response = await ProposalService.requestProposalExport(proposalId);
      const resData = response?.data?.data || response?.data || response;
      const pdfUrl = resData?.pdfUrl;

      if (pdfUrl) {
        const currentAttachments = form.getFieldValue("attachments") || [];
        const next = [
          ...currentAttachments,
          {
            uid: "-1",
            name: `Proposal - ${lead?.title || "Lead"}.pdf`,
            status: "done",
            url: pdfUrl,
            response: { url: pdfUrl },
          },
        ];
        form.setFieldsValue({ attachments: next });
        setAttachmentCount(next.length);
      }
    } catch (error) {
      console.error("Failed to fetch proposal export:", error);
      messageApi.warning("Could not automatically attach the proposal PDF.");
    } finally {
      setFetchingProposal(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const cleanedAttachments = (values.attachments || [])
        .map((file: any) => ({
          filename: file.name || file.fileName,
          url: file.url || file.response?.fileUrl || file.response?.url,
          size: file.size,
          contentType: file.type || file.contentType || "application/pdf",
        }))
        .filter((a: any) => a.url);

      const mailData = {
        leadId: lead?.id,
        proposalId: lead?.proposal_id,
        to: values.to,
        subject: values.subject,
        body: values.body,
        attachments: cleanedAttachments,
      };

      await LeadService.sendLeadMail(mailData);
      messageApi.success("Email sent successfully");
      if (onSuccess) onSuccess();
      onClose();
      form.resetFields();
    } catch (error: any) {
      console.error("Failed to send email:", error);
      messageApi.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const recipientInitial = (lead?.client_name || "C").trim().charAt(0).toUpperCase();

  return (
    <Drawer
      title={
        <div className="lmd-header">
          <div className="lmd-header-main">
            <div className="lmd-eyebrow">
              <span className="lmd-dot" />
              <span>New Message</span>
            </div>
            <div className="lmd-title">Compose Email</div>
            <div className="lmd-subtitle">
              Send a personalized proposal to{" "}
              <span className="lmd-subtitle-strong">{lead?.client_name || "Client"}</span>
            </div>
          </div>
          <div className="lmd-header-meta">
            <div className="lmd-recipient-chip">
              <div className="lmd-recipient-avatar">{recipientInitial}</div>
              <div className="lmd-recipient-info">
                <div className="lmd-recipient-name">{lead?.client_name || "Client"}</div>
                <div className="lmd-recipient-email">{lead?.client_mail || "—"}</div>
              </div>
            </div>
          </div>
        </div>
      }
      width={620}
      onClose={onClose}
      open={visible}
      closeIcon={<X size={18} />}
      footer={
        <div className="lmd-footer">
          <div className="lmd-footer-left">
            {fetchingProposal ? (
              <div className="lmd-status lmd-status--working">
                <Loader2 size={13} className="lmd-spin" />
                <span>Attaching proposal PDF…</span>
              </div>
            ) : attachmentCount > 0 ? (
              <div className="lmd-status lmd-status--ok">
                <Paperclip size={13} />
                <span>
                  {attachmentCount} attachment{attachmentCount !== 1 ? "s" : ""} ready
                </span>
              </div>
            ) : (
              <div className="lmd-status lmd-status--idle">
                <Sparkles size={13} />
                <span>Draft auto-prepared from lead context</span>
              </div>
            )}
          </div>
          <Space size={10}>
            <Button onClick={onClose} className="lmd-btn lmd-btn--ghost">
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<Send size={15} />}
              onClick={() => form.submit()}
              loading={loading}
              className="lmd-btn lmd-btn--primary"
            >
              <span>Send Message</span>
              <span className="lmd-kbd">
                <CornerDownLeft size={11} />
              </span>
            </Button>
          </Space>
        </div>
      }
      className="lmd-drawer"
    >
      <div className="lmd-body">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="lmd-form"
          onValuesChange={(_, all) => {
            setAttachmentCount((all.attachments || []).length);
          }}
        >
          {/* Recipients section */}
          <section className="lmd-section">
            <div className="lmd-section-head">
              <div className="lmd-section-title">
                <span className="lmd-section-num">01</span>
                <span>Recipients</span>
              </div>
              <span className="lmd-section-meta">Required</span>
            </div>

            <div className="lmd-field-list">
              <Form.Item name="from" noStyle>
                <Input
                  className="lmd-input lmd-input--row"
                  placeholder="Sender email"
                  disabled
                  prefix={
                    <span className="lmd-row-label">
                      <User size={13} />
                      <span>From</span>
                    </span>
                  }
                />
              </Form.Item>

              <div className="lmd-row-divider" />

              <Form.Item
                name="to"
                noStyle
                rules={[
                  { required: true, message: "Recipient email is required", type: "email" },
                ]}
              >
                <Input
                  className="lmd-input lmd-input--row"
                  placeholder="client@example.com"
                  prefix={
                    <span className="lmd-row-label">
                      <AtSign size={13} />
                      <span>To</span>
                    </span>
                  }
                />
              </Form.Item>

              <div className="lmd-row-divider" />

              <Form.Item
                name="subject"
                noStyle
                rules={[{ required: true, message: "Subject is required" }]}
              >
                <Input
                  className="lmd-input lmd-input--row"
                  placeholder="Enter a clear, compelling subject"
                  prefix={
                    <span className="lmd-row-label">
                      <Type size={13} />
                      <span>Subject</span>
                    </span>
                  }
                />
              </Form.Item>
            </div>
          </section>

          {/* Message body section */}
          <section className="lmd-section lmd-section--message">
            <div className="lmd-section-head">
              <div className="lmd-section-title">
                <span className="lmd-section-num">02</span>
                <span>Message</span>
              </div>
              <div className="lmd-ai-badge">
                <Sparkles size={11} />
                <span>AI Template</span>
              </div>
            </div>

            <div className="lmd-ai-toolbar">
              <div className="lmd-ai-toolbar-left">
                <div className="lmd-ai-toolbar-glyph">
                  <Sparkles size={13} />
                </div>
                <div className="lmd-ai-toolbar-copy">
                  <div className="lmd-ai-toolbar-title">AI Writing Assistant</div>
                  <div className="lmd-ai-toolbar-sub">
                    Polish tone, expand detail, or fix grammar in one click.
                  </div>
                </div>
              </div>
              <div className="lmd-ai-toolbar-actions">
                <button
                  type="button"
                  onClick={handleEnhanceContent}
                  disabled={enhancing || correcting}
                  className="lmd-ai-action lmd-ai-action--primary"
                >
                  {enhancing ? (
                    <Loader2 size={13} className="lmd-spin" />
                  ) : (
                    <Wand2 size={13} />
                  )}
                  <span>{enhancing ? "Enhancing…" : "Enhance content"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCorrectGrammar}
                  disabled={enhancing || correcting}
                  className="lmd-ai-action"
                >
                  {correcting ? (
                    <Loader2 size={13} className="lmd-spin" />
                  ) : (
                    <SpellCheck2 size={13} />
                  )}
                  <span>{correcting ? "Correcting…" : "Correct grammar"}</span>
                </button>
              </div>
            </div>

            <Form.Item
              name="body"
              noStyle
              rules={[{ required: true, message: "Body is required" }]}
            >
              <div className={`lmd-editor ${enhancing || correcting ? "lmd-editor--busy" : ""}`}>
                {(enhancing || correcting) && (
                  <div className="lmd-editor-overlay">
                    <div className="lmd-editor-overlay-inner">
                      <Loader2 size={14} className="lmd-spin" />
                      <span>{enhancing ? "Rewriting with more detail…" : "Polishing grammar…"}</span>
                    </div>
                  </div>
                )}
                <TiptapEditor
                  content={bodyContent}
                  onChange={(content) => {
                    form.setFieldsValue({ body: content });
                    setBodyContent(content);
                  }}
                  minHeight={340}
                />
              </div>
            </Form.Item>
          </section>

          {/* Attachments section */}
          <section className="lmd-section lmd-section--attach">
            <div className="lmd-section-head">
              <div className="lmd-section-title">
                <span className="lmd-section-num">03</span>
                <span>Attachments</span>
              </div>
              <span className="lmd-section-meta">
                {attachmentCount} file{attachmentCount !== 1 ? "s" : ""}
              </span>
            </div>

            <Form.Item
              name="attachments"
              valuePropName="fileList"
              noStyle
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) return e;
                return e?.fileList;
              }}
            >
              <Upload
                className="lmd-upload-wrap"
                fileList={form.getFieldValue("attachments")}
                customRequest={async ({ file, onSuccess, onError }: any) => {
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const response = await MailService.uploadAttachment(
                          reader.result,
                          file.name
                        );
                        onSuccess(response);
                      } catch (err) {
                        onError(err);
                      }
                    };
                    reader.onerror = (err) => onError(err);
                    reader.readAsDataURL(file);
                  } catch (err) {
                    onError(err);
                  }
                }}
                itemRender={(_node, file, _fileList, actions) => {
                  const name = file.name || (file as any).fileName || "Attachment";
                  const ext = (name.split(".").pop() || "").toLowerCase();
                  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
                  const isPdf = ext === "pdf";
                  const sizeKb = file.size ? Math.round(file.size / 1024) : null;
                  const status = file.status;
                  return (
                    <div className="lmd-attach-row" key={file.uid}>
                      <div
                        className={`lmd-attach-icon ${
                          isPdf ? "is-pdf" : isImage ? "is-img" : "is-doc"
                        }`}
                      >
                        {isPdf ? (
                          <FileText size={16} />
                        ) : isImage ? (
                          <ImageIcon size={16} />
                        ) : (
                          <FileIcon size={16} />
                        )}
                      </div>
                      <div className="lmd-attach-info">
                        <div className="lmd-attach-name" title={name}>
                          {name}
                        </div>
                        <div className="lmd-attach-meta">
                          <span className="lmd-attach-ext">{ext.toUpperCase() || "FILE"}</span>
                          {sizeKb !== null && (
                            <>
                              <span className="lmd-attach-dot">·</span>
                              <span>
                                {sizeKb < 1024 ? `${sizeKb} KB` : `${(sizeKb / 1024).toFixed(1)} MB`}
                              </span>
                            </>
                          )}
                          {status === "uploading" && (
                            <>
                              <span className="lmd-attach-dot">·</span>
                              <span className="lmd-attach-status lmd-attach-status--up">
                                <Loader2 size={11} className="lmd-spin" /> Uploading
                              </span>
                            </>
                          )}
                          {status === "error" && (
                            <>
                              <span className="lmd-attach-dot">·</span>
                              <span className="lmd-attach-status lmd-attach-status--err">
                                Failed
                              </span>
                            </>
                          )}
                          {status === "done" && (
                            <>
                              <span className="lmd-attach-dot">·</span>
                              <span className="lmd-attach-status lmd-attach-status--ok">
                                Ready
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="lmd-attach-remove"
                        onClick={() => actions.remove?.()}
                        aria-label="Remove attachment"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                }}
              >
                <div className="lmd-dropzone">
                  <div className="lmd-dropzone-icon">
                    <Plus size={18} />
                  </div>
                  <div className="lmd-dropzone-copy">
                    <div className="lmd-dropzone-title">Add files</div>
                    <div className="lmd-dropzone-sub">
                      Drop a PDF, image, or document — up to 25 MB each
                    </div>
                  </div>
                  <div className="lmd-dropzone-cta">Browse</div>
                </div>
              </Upload>
            </Form.Item>
          </section>
        </Form>
      </div>

      <style jsx global>{`
        /* ============ DRAWER SHELL ============ */
        .lmd-drawer .ant-drawer-content {
          background: #fbfbfd !important;
        }
        .lmd-drawer .ant-drawer-header {
          padding: 18px 24px !important;
          border-bottom: 1px solid #ececf1 !important;
          background: #ffffff !important;
        }
        .lmd-drawer .ant-drawer-body {
          padding: 24px !important;
        }
        .lmd-drawer .ant-drawer-footer {
          padding: 14px 24px !important;
          border-top: 1px solid #ececf1 !important;
          background: #ffffff !important;
        }
        .lmd-drawer .ant-drawer-close {
          color: #6b7280 !important;
        }

        /* ============ HEADER ============ */
        .lmd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          width: 100%;
        }
        .lmd-header-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .lmd-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #3b82f6;
        }
        .lmd-dot {
          width: 6px;
          height: 6px;
          border-radius: 0px;
          background: #3b82f6;
          display: inline-block;
        }
        .lmd-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .lmd-subtitle {
          font-size: 12.5px;
          color: #6b7280;
          font-weight: 500;
        }
        .lmd-subtitle-strong {
          color: #0f172a;
          font-weight: 600;
        }
        .lmd-header-meta {
          flex-shrink: 0;
        }
        .lmd-recipient-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px 8px 8px;
          border: 1px solid #ececf1;
          border-radius: 0px;
          background: #fbfbfd;
        }
        .lmd-recipient-avatar {
          width: 28px;
          height: 28px;
          border-radius: 0px;
          background: #3b82f6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .lmd-recipient-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .lmd-recipient-name {
          font-size: 12.5px;
          font-weight: 600;
          color: #0f172a;
        }
        .lmd-recipient-email {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        /* ============ BODY / SECTIONS ============ */
        .lmd-body {
          display: flex;
          flex-direction: column;
        }
        .lmd-section {
          background: #ffffff;
          border: 1px solid #ececf1;
          border-radius: 0px;
          padding: 18px 20px;
          margin-bottom: 14px;
        }
        .lmd-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .lmd-section-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.005em;
        }
        .lmd-section-num {
          font-size: 10.5px;
          font-weight: 700;
          color: #94a3b8;
          background: #f4f4f7;
          padding: 2px 7px;
          border-radius: 0px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
        }
        .lmd-section-meta {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lmd-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: #3b82f6;
          background: #eff6ff;
          padding: 4px 9px;
          border-radius: 0px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ============ INLINE FIELD ROWS ============ */
        .lmd-field-list {
          border: 1px solid #ececf1;
          border-radius: 0px;
          background: #ffffff;
          overflow: hidden;
        }
        .lmd-input.lmd-input--row {
          border: none !important;
          border-radius: 0px !important;
          background: transparent !important;
          height: 46px !important;
          padding: 0 14px !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
          font-weight: 500 !important;
          box-shadow: none !important;
        }
        .lmd-input.lmd-input--row:hover,
        .lmd-input.lmd-input--row:focus,
        .lmd-input.lmd-input--row.ant-input-focused {
          background: #fafafe !important;
          box-shadow: none !important;
        }
        .lmd-input.lmd-input--row.ant-input-affix-wrapper-disabled {
          background: #fafafa !important;
          color: #6b7280 !important;
        }
        .lmd-input.lmd-input--row .ant-input {
          background: transparent !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          color: #0f172a !important;
        }
        .lmd-input.lmd-input--row .ant-input::placeholder {
          color: #9ca3af !important;
          font-weight: 500 !important;
        }
        .lmd-row-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          width: 78px;
          flex-shrink: 0;
        }
        .lmd-row-label svg {
          color: #9ca3af;
        }
        .lmd-row-divider {
          height: 1px;
          background: #ececf1;
        }

        /* ============ AI TOOLBAR ============ */
        .lmd-ai-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 14px;
          margin-bottom: 12px;
          border: 1px solid #e5e7f0;
          border-radius: 0px;
          background:
            linear-gradient(180deg, #fafaff 0%, #f5f5ff 100%);
        }
        .lmd-ai-toolbar-left {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }
        .lmd-ai-toolbar-glyph {
          width: 30px;
          height: 30px;
          border-radius: 0px;
          background: #ffffff;
          border: 1px solid #e5e7f0;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lmd-ai-toolbar-copy {
          display: flex;
          flex-direction: column;
          line-height: 1.25;
          min-width: 0;
        }
        .lmd-ai-toolbar-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.005em;
        }
        .lmd-ai-toolbar-sub {
          font-size: 11.5px;
          color: #6b7280;
          font-weight: 500;
        }
        .lmd-ai-toolbar-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .lmd-ai-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
          white-space: nowrap;
        }
        .lmd-ai-action:hover:not(:disabled) {
          color: #2563eb;
          border-color: #bfdbfe;
          background: #fafafe;
        }
        .lmd-ai-action:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .lmd-ai-action--primary {
          color: #ffffff;
          background: #2563eb;
          border-color: #1d4ed8;
        }
        .lmd-ai-action--primary:hover:not(:disabled) {
          color: #ffffff;
          background: #1d4ed8;
          border-color: #1e40af;
        }

        /* ============ EDITOR ============ */
        .lmd-editor {
          position: relative;
          border: 1px solid #ececf1;
          border-radius: 0px;
          overflow: hidden;
          background: #ffffff;
          transition: border-color 0.15s ease;
        }
        .lmd-editor:focus-within {
          border-color: #bfdbfe;
        }
        .lmd-editor--busy {
          border-color: #bfdbfe;
        }
        .lmd-editor-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.72);
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .lmd-editor-overlay-inner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #2563eb;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          border-radius: 0px;
        }

        /* ============ ATTACHMENTS ============ */
        .lmd-upload-wrap .ant-upload-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .lmd-upload-wrap .ant-upload-list-item-container {
          width: 100%;
          margin: 0 !important;
          height: auto !important;
        }
        .lmd-upload-wrap .ant-upload.ant-upload-select {
          display: block !important;
          width: 100% !important;
          height: auto !important;
          background: transparent !important;
          border: none !important;
          margin: 0 !important;
        }
        .lmd-dropzone {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 1.5px dashed #d4d4dc;
          border-radius: 0px;
          background: #fbfbfd;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          text-align: left;
        }
        .lmd-dropzone:hover {
          border-color: #3b82f6;
          background: #f5f5ff;
        }
        .lmd-dropzone-icon {
          width: 38px;
          height: 38px;
          border-radius: 0px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lmd-dropzone-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          line-height: 1.3;
          min-width: 0;
        }
        .lmd-dropzone-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.005em;
        }
        .lmd-dropzone-sub {
          font-size: 11.5px;
          color: #6b7280;
          font-weight: 500;
        }
        .lmd-dropzone-cta {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          padding: 6px 12px;
          border: 1px solid #bfdbfe;
          border-radius: 0px;
          background: #ffffff;
          flex-shrink: 0;
        }

        .lmd-attach-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid #ececf1;
          border-radius: 0px;
          background: #ffffff;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .lmd-attach-row:hover {
          border-color: #d4d4dc;
          background: #fafafd;
        }
        .lmd-attach-icon {
          width: 36px;
          height: 36px;
          border-radius: 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .lmd-attach-icon.is-pdf {
          background: #fef2f2;
          color: #dc2626;
        }
        .lmd-attach-icon.is-img {
          background: #ecfeff;
          color: #0891b2;
        }
        .lmd-attach-icon.is-doc {
          background: #f1f5f9;
          color: #475569;
        }
        .lmd-attach-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lmd-attach-name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lmd-attach-meta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }
        .lmd-attach-ext {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 2px 6px;
          border-radius: 0px;
          background: #f1f5f9;
          color: #475569;
        }
        .lmd-attach-dot {
          color: #cbd5e1;
        }
        .lmd-attach-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }
        .lmd-attach-status--ok { color: #059669; }
        .lmd-attach-status--up { color: #b45309; }
        .lmd-attach-status--err { color: #dc2626; }
        .lmd-attach-remove {
          width: 28px;
          height: 28px;
          border-radius: 0px;
          border: 1px solid transparent;
          background: transparent;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .lmd-attach-remove:hover {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        /* ============ FOOTER ============ */
        .lmd-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        .lmd-footer-left {
          flex: 1;
        }
        .lmd-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 11px;
          border-radius: 0px;
          border: 1px solid transparent;
        }
        .lmd-status--idle {
          color: #3b82f6;
          background: #eff6ff;
        }
        .lmd-status--working {
          color: #b45309;
          background: #fef3c7;
        }
        .lmd-status--ok {
          color: #047857;
          background: #d1fae5;
        }
        .lmd-spin {
          animation: lmd-spin 1s linear infinite;
        }
        @keyframes lmd-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ============ BUTTONS ============ */
        .lmd-btn {
          height: 38px !important;
          border-radius: 0px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 0 16px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow: none !important;
        }
        .lmd-btn--ghost {
          color: #475569 !important;
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
        }
        .lmd-btn--ghost:hover {
          color: #0f172a !important;
          background: #f9fafb !important;
          border-color: #d4d4d8 !important;
        }
        .lmd-btn--primary {
          color: #ffffff !important;
          background: #2563eb !important;
          border: 1px solid #1d4ed8 !important;
          padding: 0 14px !important;
        }
        .lmd-btn--primary:hover {
          background: #1d4ed8 !important;
          border-color: #1e40af !important;
        }
        .lmd-btn--primary:disabled,
        .lmd-btn--primary.ant-btn-loading {
          background: #60a5fa !important;
          border-color: #60a5fa !important;
          color: #ffffff !important;
        }
        .lmd-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.18);
          border-radius: 0px;
          margin-left: 4px;
        }

        /* ============ DARK MODE ============ */
        [data-theme='dark'] .lmd-drawer .ant-drawer-content {
          background: #0b0e14 !important;
        }
        [data-theme='dark'] .lmd-drawer .ant-drawer-header {
          background: #11151d !important;
          border-bottom-color: #21262d !important;
        }
        [data-theme='dark'] .lmd-drawer .ant-drawer-footer {
          background: #11151d !important;
          border-top-color: #21262d !important;
        }
        [data-theme='dark'] .lmd-title {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .lmd-subtitle {
          color: #8b949e !important;
        }
        [data-theme='dark'] .lmd-subtitle-strong {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .lmd-recipient-chip {
          background: #161b22;
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-recipient-name {
          color: #e6edf3;
        }
        [data-theme='dark'] .lmd-recipient-email {
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-section {
          background: #11151d;
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-section-title {
          color: #e6edf3;
        }
        [data-theme='dark'] .lmd-section-num {
          background: #1c222b;
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-ai-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-field-list {
          background: #0d1117;
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-input.lmd-input--row {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .lmd-input.lmd-input--row .ant-input {
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .lmd-input.lmd-input--row:hover,
        [data-theme='dark'] .lmd-input.lmd-input--row:focus,
        [data-theme='dark'] .lmd-input.lmd-input--row.ant-input-focused {
          background: #161b22 !important;
        }
        [data-theme='dark'] .lmd-input.lmd-input--row.ant-input-affix-wrapper-disabled {
          background: #0a0d12 !important;
          color: #6e7681 !important;
        }
        [data-theme='dark'] .lmd-row-label {
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-row-divider {
          background: #21262d;
        }
        [data-theme='dark'] .lmd-editor {
          background: #0d1117;
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-ai-toolbar {
          background: linear-gradient(180deg, #131826 0%, #11151d 100%);
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-ai-toolbar-glyph {
          background: #0d1117;
          border-color: #21262d;
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-ai-toolbar-title {
          color: #e6edf3;
        }
        [data-theme='dark'] .lmd-ai-toolbar-sub {
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-ai-action {
          background: #161b22;
          border-color: #30363d;
          color: #c9d1d9;
        }
        [data-theme='dark'] .lmd-ai-action:hover:not(:disabled) {
          background: #1c222b;
          border-color: #2563eb;
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-ai-action--primary {
          background: #2563eb;
          border-color: #1d4ed8;
          color: #ffffff;
        }
        [data-theme='dark'] .lmd-ai-action--primary:hover:not(:disabled) {
          background: #1d4ed8;
          border-color: #1e40af;
        }
        [data-theme='dark'] .lmd-editor-overlay {
          background: rgba(13, 17, 23, 0.72);
        }
        [data-theme='dark'] .lmd-dropzone {
          background: #0d1117;
          border-color: #30363d;
        }
        [data-theme='dark'] .lmd-dropzone:hover {
          background: #131826;
          border-color: #2563eb;
        }
        [data-theme='dark'] .lmd-dropzone-icon {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-dropzone-title {
          color: #e6edf3;
        }
        [data-theme='dark'] .lmd-dropzone-sub {
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-dropzone-cta {
          background: #11151d;
          border-color: #2563eb;
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-attach-row {
          background: #11151d;
          border-color: #21262d;
        }
        [data-theme='dark'] .lmd-attach-row:hover {
          background: #161b22;
          border-color: #30363d;
        }
        [data-theme='dark'] .lmd-attach-icon.is-pdf {
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
        }
        [data-theme='dark'] .lmd-attach-icon.is-img {
          background: rgba(8, 145, 178, 0.15);
          color: #67e8f9;
        }
        [data-theme='dark'] .lmd-attach-icon.is-doc {
          background: #1c222b;
          color: #c9d1d9;
        }
        [data-theme='dark'] .lmd-attach-name {
          color: #e6edf3;
        }
        [data-theme='dark'] .lmd-attach-meta {
          color: #8b949e;
        }
        [data-theme='dark'] .lmd-attach-ext {
          background: #1c222b;
          color: #c9d1d9;
        }
        [data-theme='dark'] .lmd-attach-dot {
          color: #30363d;
        }
        [data-theme='dark'] .lmd-attach-remove {
          color: #6e7681;
        }
        [data-theme='dark'] .lmd-attach-remove:hover {
          background: rgba(220, 38, 38, 0.15);
          border-color: rgba(220, 38, 38, 0.3);
          color: #f87171;
        }
        [data-theme='dark'] .lmd-btn--ghost {
          background: #161b22 !important;
          border-color: #30363d !important;
          color: #c9d1d9 !important;
        }
        [data-theme='dark'] .lmd-btn--ghost:hover {
          background: #21262d !important;
          color: #e6edf3 !important;
        }
        [data-theme='dark'] .lmd-status--idle {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }
        [data-theme='dark'] .lmd-status--working {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }
        [data-theme='dark'] .lmd-status--ok {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
      `}</style>
    </Drawer>
  );
};
