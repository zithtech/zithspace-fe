"use client";

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Button, Space, Typography, Divider, message } from 'antd';
import { SendOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useSendInvoiceEmail } from '@/hooks/useInvoices';


const { Text } = Typography;
const { TextArea } = Input;

interface ComposeEmailDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
}

export default function ComposeEmailDrawer({ open, onClose, invoice }: ComposeEmailDrawerProps) {
  const [form] = Form.useForm();
  const { mutate: sendEmail, isPending } = useSendInvoiceEmail();


  useEffect(() => {
  if (open && invoice) {
    console.log('📎 ComposeEmailDrawer - Invoice loaded:', {
      invoiceNumber: invoice.invoiceNumber,
      pdfUrl: invoice.pdfUrl,
      hasPdf: !!invoice.pdfUrl,
      pdfUrlType: invoice.pdfUrl ? typeof invoice.pdfUrl : 'null',
      pdfUrlLength: invoice.pdfUrl?.length
    });
    
    // Rest of your form setup
    const customer = invoice.customerSnapshot || invoice.customer;
    form.setFieldsValue({
      to: customer?.email,
      subject: `Invoice ${invoice.invoiceNumber} from your Company Name`,
      message: `Dear ${customer?.name || 'Customer'},\n\nPlease find attached invoice ${invoice.invoiceNumber} for the amount of $${invoice.grandTotal || '0.00'}.\n\nKind regards,\nAccounts Team`,
    });
  }
}, [open, invoice, form]);



  // Reset form when invoice changes or drawer opens
  useEffect(() => {
    if (open && invoice) {
      const customer = invoice.customerSnapshot || invoice.customer;
      form.setFieldsValue({
        to: customer?.email,
        subject: `Invoice ${invoice.invoiceNumber} from your Company Name`,
        message: `Dear ${customer?.name || 'Customer'},\n\nPlease find attached invoice ${invoice.invoiceNumber} for the amount of $${invoice.grandTotal || '0.00'}.\n\nKind regards,\nAccounts Team`,
      });
    }
  }, [open, invoice, form]);

//   const onFinish = (values: any) => {
//     sendEmail({
//       id: invoice.id,
//       data: values
//     }, {
//       onSuccess: () => {
//         message.success("Email sent successfully!");
//         onClose();
//       },
//       onError: (err: any) => {
//         message.error(err.message || "Failed to send email");
//       }
//     });
//   };

const onFinish = (values: any) => {
  const customer = invoice.customerSnapshot || invoice.customer;
  
  // SIMPLIFIED - Only send what the API actually expects
  const payload = {
    to: values.to,
    subject: values.subject,
    message: values.message,  // API expects 'message', not 'customMessage'
    pdfUrl: invoice.pdfUrl
  };

  // DEBUG - Check if PDF URL is present
  console.log('📤 ComposeEmailDrawer - Sending email:', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    hasPdfUrl: !!invoice.pdfUrl,
    pdfUrl: invoice.pdfUrl,
    payload
  });

  sendEmail({
    id: invoice.id,
    data: payload
  }, {
    onSuccess: () => {
      message.success(`Email sent to ${values.to}`);
      onClose();
    },
    onError: (err: any) => {
      console.error('❌ Send email failed:', err);
      message.error(err.message || "Failed to send email");
    }
  });
};



  return (
    <Drawer
      title={
        <Space>
          <MailOutlined style={{ color: 'var(--text-sky-500)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Compose Email - {invoice?.invoiceNumber}</span>
        </Space>
      }
      width={720}
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            loading={isPending}
            onClick={() => form.submit()}
          >
            Send Email
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isPending}
      >
        <Form.Item
          label="To"
          name="to"
          rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
        >
          <Input prefix={<UserOutlined style={{ color: 'var(--text-secondary)' }} />} placeholder="recipient@email.com" />
        </Form.Item>

        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: 'Subject is required' }]}
        >
          <Input placeholder="Enter email subject" />
        </Form.Item>

        <Divider />

        <Form.Item
          label="Message Body"
          name="message"
          rules={[{ required: true, message: 'Message body cannot be empty' }]}
        >
          <TextArea 
            rows={10} 
            placeholder="Write your message here..."
            className="font-sans"
          />
        </Form.Item>

        {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
  <Text type="secondary" className="text-xs">
    <strong>Attachment:</strong> Your system will automatically attach the PDF for Invoice {invoice?.invoiceNumber}.
  </Text>
</div> */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-blue-50)', 
            borderColor: 'var(--border-blue-200)' 
          }} 
          className="p-4 rounded-lg border mt-4"
        >
          <Text type="secondary" className="text-xs">
            {invoice?.pdfUrl || (invoice?.attachments && invoice.attachments.some((a: any) => a.fileName.toLowerCase().endsWith('.pdf') || a.fileUrl.toLowerCase().endsWith('.pdf'))) ? (
              <Space>
                <span style={{ color: 'var(--text-holiday)' }}>●</span>
                <strong style={{ color: 'var(--text-primary)' }}>Attachment Ready:</strong> 
                <span style={{ color: 'var(--text-secondary)' }}>Invoice_{invoice.invoiceNumber}.pdf</span>
              </Space>
            ) : (
              <Space>
                <span style={{ color: 'var(--text-sky-500)' }}>●</span>
                <strong style={{ color: 'var(--text-primary)' }}>Automatic Attachment:</strong> 
                <span style={{ color: 'var(--text-secondary)' }}>System will generate and attach the latest invoice PDF.</span>
              </Space>
            )}
          </Text>
        </div>
      </Form>
    </Drawer>
  );
}