import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Button, Space, Typography, Upload, message, Divider, App, Row, Col } from "antd";
import { 
  Mail, 
  Send, 
  Paperclip, 
  X, 
  User, 
  ChevronRight, 
  Info,
  Sparkles,
  FileText,
  Clock
} from "lucide-react";
import { Lead, LeadService } from "@/services/leadService";
import { MailService } from "@/services/mailService";
import { ProposalService } from "@/services/proposalService";
import TiptapEditor from "@/components/common/TiptapEditor";
import { useAuth } from "@/context/AuthContext";

const { Text, Title } = Typography;

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
  const { user } = useAuth();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    if (visible && lead) {
      form.setFieldsValue({
        from: fromEmail || "",
        to: lead.client_mail || "",
        subject: `Proposal for ${lead.title}`,
        body: `<p>Hi ${lead.client_name},</p><p>I'm reaching out regarding the ${lead.title} project. Please find the proposal attached.</p><p>Best regards,<br/>${user?.name || "Team"}</p>`,
        attachments: [],
      });

      if (lead.proposal_id) {
        handleAttachProposal(lead.proposal_id);
      }
    }
  }, [visible, lead, fromEmail, form, user]);

  const handleAttachProposal = async (proposalId: string) => {
    try {
      setFetchingProposal(true);
      const response = await ProposalService.requestProposalExport(proposalId);
      const resData = response?.data?.data || response?.data || response;
      const pdfUrl = resData?.pdfUrl;

      if (pdfUrl) {
        const currentAttachments = form.getFieldValue("attachments") || [];
        form.setFieldsValue({
          attachments: [
            ...currentAttachments,
            {
              uid: '-1',
              name: `Proposal - ${lead?.title || 'Lead'}.pdf`,
              status: 'done',
              url: pdfUrl,
              response: { url: pdfUrl }
            }
          ]
        });
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
          contentType: file.type || file.contentType || 'application/pdf',
        }))
        .filter((a: any) => a.url);

      const mailData = {
        leadId: lead?.id,
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

  return (
    <Drawer
      title={
        <div className="mail-drawer-header">
          <div className="mail-header-icon">
            <Mail size={18} />
          </div>
          <div className="mail-header-content">
            <Title level={5} className="mail-header-title">Compose Email</Title>
            <Text className="mail-header-sub">Send personalized proposal to {lead?.client_name || "Client"}</Text>
          </div>
        </div>
      }
      width={780}
      onClose={onClose}
      open={visible}
      closeIcon={<X size={18} />}
      footer={
        <div className="mail-drawer-footer">
          <div className="mail-footer-left">
            {fetchingProposal && (
              <div className="mail-footer-hint">
                <Sparkles size={14} className="mail-sparkle" />
                <Text>Fetching proposal PDF...</Text>
              </div>
            )}
          </div>
          <Space size={12}>
            <Button onClick={onClose} className="mail-btn-cancel">Cancel</Button>
            <Button
              type="primary"
              icon={<Send size={16} />}
              onClick={() => form.submit()}
              loading={loading}
              className="mail-btn-send"
            >
              Send Message
            </Button>
          </Space>
        </div>
      }
      className="mail-compose-drawer-v2"
    >
      <div className="mail-drawer-body">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mail-form-premium"
        >
          <div className="mail-section-card">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="from"
                  label={<span className="mail-form-label">From Integration</span>}
                >
                  <Input 
                    prefix={<User size={14} className="mail-input-icon" />}
                    placeholder="Sender email" 
                    disabled 
                    className="mail-input-disabled"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="to"
                  label={<span className="mail-form-label">To Recipient</span>}
                  rules={[{ required: true, message: 'Recipient email is required', type: 'email' }]}
                >
                  <Input 
                    prefix={<Mail size={14} className="mail-input-icon" />}
                    placeholder="client@example.com" 
                    className="mail-input-premium"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="subject"
              label={<span className="mail-form-label">Email Subject</span>}
              rules={[{ required: true, message: 'Subject is required' }]}
            >
              <Input 
                prefix={<Info size={14} className="mail-input-icon" />}
                placeholder="Enter compelling subject" 
                className="mail-input-premium"
              />
            </Form.Item>
          </div>

          <div className="mail-section-card">
            <Form.Item
              name="body"
              label={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className="mail-form-label">Message Body</span>
                  <div className="mail-body-hint">
                    <Sparkles size={12} />
                    <span>AI-Generated Template</span>
                  </div>
                </div>
              }
              rules={[{ required: true, message: 'Body is required' }]}
            >
              <div className="mail-editor-wrapper">
                <TiptapEditor
                  content={form.getFieldValue("body")}
                  onChange={(content) => form.setFieldsValue({ body: content })}
                  minHeight={340}
                />
              </div>
            </Form.Item>
          </div>

          <div className="mail-section-card">
            <Form.Item
              name="attachments"
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={14} />
                  <span className="mail-form-label">Attachments</span>
                </div>
              }
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) return e;
                return e?.fileList;
              }}
            >
              <Upload
                listType="picture-card"
                className="mail-attachment-upload"
                fileList={form.getFieldValue("attachments")}
                customRequest={async ({ file, onSuccess, onError }: any) => {
                  try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const response = await MailService.uploadAttachment(reader.result, file.name);
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
                showUploadList={{
                  showRemoveIcon: true,
                  showDownloadIcon: true,
                }}
              >
                <div className="mail-upload-btn">
                  <div className="mail-upload-icon">
                    <Paperclip size={18} />
                  </div>
                  <div className="mail-upload-text">Attach</div>
                </div>
              </Upload>
            </Form.Item>
          </div>
        </Form>
      </div>

      <style jsx global>{`
        .mail-compose-drawer-v2 .ant-drawer-content {
          background: #f8fafc !important;
        }
        .mail-compose-drawer-v2 .ant-drawer-header {
          padding: 16px 24px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #fff !important;
        }
        .mail-drawer-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mail-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mail-header-title {
          margin: 0 !important;
          font-weight: 800 !important;
          font-size: 16px !important;
          color: #1e293b !important;
        }
        .mail-header-sub {
          display: block;
          font-size: 12px !important;
          color: #64748b !important;
          font-weight: 500 !important;
        }

        .mail-drawer-body {
          padding: 4px 0;
        }
        .mail-section-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .mail-form-label {
          font-size: 12px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mail-input-premium {
          border-radius: 10px !important;
          height: 40px !important;
          border-color: #e2e8f0 !important;
          background: #f8fafc !important;
          font-weight: 500 !important;
        }
        .mail-input-premium:hover, .mail-input-premium:focus {
          border-color: #6366f1 !important;
          background: #fff !important;
        }
        .mail-input-disabled {
          border-radius: 10px !important;
          height: 40px !important;
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
          color: #64748b !important;
          font-weight: 500 !important;
        }
        .mail-input-icon {
          color: #94a3b8;
        }

        .mail-body-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6366f1;
          font-size: 11px;
          font-weight: 700;
          background: rgba(99, 102, 241, 0.08);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .mail-editor-wrapper {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          background: #f8fafc;
        }

        .mail-attachment-upload .ant-upload-select-picture-card {
          border: 1px dashed #cbd5e1 !important;
          background: #f8fafc !important;
          border-radius: 12px !important;
          width: 100px !important;
          height: 100px !important;
        }
        .mail-upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .mail-upload-icon {
          color: #6366f1;
        }
        .mail-upload-text {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }

        .mail-drawer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        .mail-footer-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
        }
        @keyframes mail-sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .mail-sparkle {
          animation: mail-sparkle 1.5s infinite ease-in-out;
        }

        .mail-btn-cancel {
          height: 40px !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          border-color: #e2e8f0 !important;
        }
        .mail-btn-send {
          height: 40px !important;
          border-radius: 10px !important;
          font-weight: 700 !important;
          padding: 0 24px !important;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
        }
        .mail-btn-send:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* DARK MODE */
        [data-theme='dark'] .mail-compose-drawer-v2 .ant-drawer-content {
          background: #0d1117 !important;
        }
        [data-theme='dark'] .mail-compose-drawer-v2 .ant-drawer-header {
          background: #161b22 !important;
          border-bottom-color: #30363d !important;
        }
        [data-theme='dark'] .mail-header-icon {
          background: rgba(99, 102, 241, 0.2);
        }
        [data-theme='dark'] .mail-header-title {
          color: #f0f6fc !important;
        }
        [data-theme='dark'] .mail-header-sub {
          color: #8b949e !important;
        }
        [data-theme='dark'] .mail-section-card {
          background: #161b22;
          border-color: #30363d;
        }
        [data-theme='dark'] .mail-form-label {
          color: #8b949e;
        }
        [data-theme='dark'] .mail-input-premium {
          background: #0d1117 !important;
          border-color: #30363d !important;
          color: #c9d1d9 !important;
        }
        [data-theme='dark'] .mail-input-premium:hover, 
        [data-theme='dark'] .mail-input-premium:focus {
          border-color: #6366f1 !important;
          background: #161b22 !important;
        }
        [data-theme='dark'] .mail-input-disabled {
          background: #0d1117 !important;
          border-color: #30363d !important;
          color: #484f58 !important;
        }
        [data-theme='dark'] .mail-editor-wrapper {
          border-color: #30363d;
          background: #0d1117;
        }
        [data-theme='dark'] .mail-attachment-upload .ant-upload-select-picture-card {
          background: #0d1117 !important;
          border-color: #30363d !important;
        }
        [data-theme='dark'] .mail-upload-text {
          color: #8b949e;
        }
        [data-theme='dark'] .mail-btn-cancel {
          background: #21262d !important;
          border-color: #30363d !important;
          color: #c9d1d9 !important;
        }
      `}</style>
    </Drawer>
  );
};
