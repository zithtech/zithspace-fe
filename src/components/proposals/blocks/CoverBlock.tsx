import { Space, Typography, Form, Input, DatePicker, Row, Col, Divider, Upload, Button, message, Tag } from 'antd';
import {
  UploadOutlined,
  EditOutlined,
  SolutionOutlined,
  UserOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import React from 'react';
import { AIEnhanceButton } from '../AIEnhanceButton';
import { BlockGhostHint } from './BlockGhost';

const { Title, Text } = Typography;

interface CoverBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const CoverBlock: React.FC<CoverBlockProps> = ({ data, isEditor }) => {
  const isEmpty = !data.title && !data.projectSummary && !data.clientName && !data.clientCompany && !data.senderName && !data.senderCompany;
  const ghost = (val: string | undefined, fallback: string) => val || fallback;
  const ghostStyle = (val: any): React.CSSProperties =>
    val ? {} : { color: 'var(--text-slate-400)', fontStyle: 'italic' };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 24px',
      background: 'transparent',
    }}>
      {isEmpty && <div style={{ marginBottom: 16 }}><BlockGhostHint /></div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt="Logo"
              style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px' }}
            />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 8,
              border: '1.5px dashed var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-slate-400)', fontSize: 11, fontWeight: 600,
              fontStyle: 'italic', background: 'var(--bg-slate-50)',
            }}>Logo</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end' }}>
          <Text strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', ...ghostStyle(data.senderCompany) }}>
            {ghost(data.senderCompany, 'Your Agency LLC')}
          </Text>
          <Text style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', ...ghostStyle(data.senderName) }}>
            {ghost(data.senderName, 'Your Name')}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <Text style={{ color: 'inherit', ...ghostStyle(data.senderEmail) }}>{ghost(data.senderEmail, 'contact@youragency.com')}</Text>
            <div style={{ width: '1px', height: '10px', background: 'var(--border-color)' }}></div>
            <Text style={{ color: 'inherit', ...ghostStyle(data.senderContact) }}>{ghost(data.senderContact, '(555) 000-0000')}</Text>
          </div>
          <Text style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginTop: '4px', ...ghostStyle(data.senderAddress) }}>
            {ghost(data.senderAddress, 'Your business address')}
          </Text>
        </div>
      </div>

      <div style={{ marginBottom: (data.projectSummary || isEditor) ? '8px' : '0px' }}>
        <Text style={{ color: 'var(--premium-blue)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Proposal For</Text>
        <Title level={1} className="pb-cover-title" style={{ margin: '4px 0 2px 0', fontWeight: 800, lineHeight: 1.2, color: data.title ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.title ? 'normal' : 'italic' }}>
          {data.title || 'Proposal Title'}
        </Title>
        {(data.projectSummary || isEditor) && (
          <div className="pb-cover-summary" style={{ maxWidth: '600px', display: 'block', lineHeight: 1.5, color: data.projectSummary ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.projectSummary ? 'normal' : 'italic' }}>
            {data.projectSummary
              ? <TiptapViewer content={data.projectSummary} />
              : 'A short, persuasive summary of what this proposal delivers and why it matters.'}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0px' }}>
        <Divider style={{ margin: '4px 0 12px 0' }} />
        <Row gutter={48}>
          <Col span={14}>
            <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Prepared For</Text>
            <Text strong style={{ display: 'block', fontSize: '1rem', color: data.clientCompany ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.clientCompany ? 'normal' : 'italic' }}>
              {ghost(data.clientCompany, 'Client Company')}
            </Text>
            <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', ...ghostStyle(data.clientName) }}>
              {ghost(data.clientName, 'Client contact name')}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
              <Text style={{ color: 'inherit', ...ghostStyle(data.clientEmail) }}>{ghost(data.clientEmail, 'client@email.com')}</Text>
              <div style={{ width: '1px', height: '12px', background: 'var(--border-color)' }}></div>
              <Text style={{ color: 'inherit', ...ghostStyle(data.clientPhone) }}>{ghost(data.clientPhone, '(555) 000-0000')}</Text>
            </div>
            <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', ...ghostStyle(data.clientAddress) }}>
              {ghost(data.clientAddress, 'Client business address')}
            </Text>
          </Col>
          <Col span={10} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>Date</Text>
              <Text strong style={{ fontSize: '0.9rem', color: data.date ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.date ? 'normal' : 'italic' }}>
                {data.date ? dayjs(data.date).format('MMMM D, YYYY') : 'Pick a date'}
              </Text>
            </div>
            <div>
              <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>Valid Until</Text>
              <Text strong style={{ fontSize: '0.9rem', color: data.validUntil ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.validUntil ? 'normal' : 'italic' }}>
                {data.validUntil ? dayjs(data.validUntil).format('MMMM D, YYYY') : 'Pick an expiry date'}
              </Text>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export const CoverBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const [form] = Form.useForm();

  // Sync form when data changes externally (e.g. from Branding sync or initial load)
  React.useEffect(() => {
    form.setFieldsValue({
      ...data,
      date: data.date ? dayjs(data.date) : null,
      validUntil: data.validUntil ? dayjs(data.validUntil) : null
    });
  }, [data, form]);

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05rem',
    marginBottom: '6px',
    display: 'block'
  };

  const inputStyle: React.CSSProperties = {
    borderRadius: '8px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)'
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...data,
        date: data.date ? dayjs(data.date) : null,
        validUntil: data.validUntil ? dayjs(data.validUntil) : null
      }}
      onValuesChange={(_, allValues) => {
        onUpdate({
          ...allValues,
          date: allValues.date ? allValues.date.toISOString().split('T')[0] : null,
          validUntil: allValues.validUntil ? allValues.validUntil.toISOString().split('T')[0] : null
        });
      }}
    >

      {/* Identity & Summary Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <SolutionOutlined style={{ color: 'var(--premium-blue)' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Project Identity</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }}>
            <span style={{ ...labelStyle, flex: 1, display: 'inline-flex', alignItems: 'center' }}>Proposal Title <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></span>
            <AIEnhanceButton 
              originalData={{ title: data.title, projectSummary: data.projectSummary }} 
              blockType="cover (identity)" 
              onApply={(newData) => onUpdate({ ...data, ...newData })} 
            />
          </div>
          <Form.Item name="title" style={{ marginBottom: 16 }}>
            <Input prefix={<EditOutlined style={{ color: 'var(--border-color)' }} />} placeholder="e.g., E-commerce Redesign" variant="filled" style={inputStyle} />
          </Form.Item>
          <div style={{ marginBottom: 0 }}>
            <span style={labelStyle}>Project Summary</span>
            <TiptapEditor
              content={data.projectSummary || ''}
              onChange={(html) => onUpdate({ ...data, projectSummary: html })}
              minHeight={120}
            />
          </div>
        </div>
      </div>

      {/* Client Information Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UserOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Client Context</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.Item label={<span style={labelStyle}>Company Name</span>} name="clientCompany">
            <Input prefix={<BankOutlined style={{ color: 'var(--border-color)' }} />} placeholder="Client Company" variant="filled" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={{ ...labelStyle, display: 'inline-flex', alignItems: 'center' }}>Contact Person <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span></span>} name="clientName">
            <Input prefix={<UserOutlined style={{ color: 'var(--border-color)' }} />} placeholder="Client Name" variant="filled" style={inputStyle} />
          </Form.Item>

          <Row gutter={8}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Mail</span>} name="clientEmail">
                <Input prefix={<MailOutlined style={{ color: 'var(--border-color)' }} />} placeholder="jane@acme.com" variant="filled" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Phone</span>} name="clientPhone">
                <Input prefix={<PhoneOutlined style={{ color: 'var(--border-color)' }} />} placeholder="(555) 000-0000" variant="filled" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span style={labelStyle}>Address</span>} name="clientAddress" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="Physical Address" variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>

      {/* Dates Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CalendarOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Timeline Logistics</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Issue Date</span>} name="date" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<CalendarOutlined style={{ color: 'var(--border-color)' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Valid Until</span>} name="validUntil" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<CalendarOutlined style={{ color: 'var(--border-color)' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </div>

      {/* Redundant Sender Info - Stylized as Synced */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <GlobalOutlined style={{ color: 'var(--text-secondary)' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Organization Sync</Text>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <InfoCircleOutlined style={{ color: '#3b82f6', marginTop: '2px' }} />
            <Text style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              These fields are synchronized with your <strong>Branding & Identity</strong> profile at the top of the sidebar.
            </Text>
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Form.Item label={<span style={labelStyle}>Your Company</span>} name="senderCompany" style={{ marginBottom: 8 }}>
            <Input prefix={<BankOutlined style={{ color: 'var(--border-color)' }} />} variant="filled" style={inputStyle} disabled />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Your Name</span>} name="senderName" style={{ marginBottom: 8 }}>
            <Input prefix={<UserOutlined style={{ color: 'var(--border-color)' }} />} variant="filled" style={inputStyle} disabled />
          </Form.Item>
        </Space>
      </div>
    </Form>
  );
};
