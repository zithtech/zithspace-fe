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

const { Title, Text } = Typography;

interface CoverBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const CoverBlock: React.FC<CoverBlockProps> = ({ data }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 32px',
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    }}>
      {/* Header: Identity & Logo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          {data.logoUrl && (
            <img 
              src={data.logoUrl} 
              alt="Logo" 
              style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px' }} 
            />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', alignItems: 'flex-end' }}>
          <Text strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{data.senderCompany}</Text>
          <Text style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '4px' }}>{data.senderName}</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem' }}>
            <Text style={{ color: 'inherit' }}>{data.senderEmail}</Text>
            <div style={{ width: '1px', height: '10px', background: '#e2e8f0' }}></div>
            <Text style={{ color: 'inherit' }}>{data.senderContact}</Text>
          </div>
          <Text style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'pre-wrap', marginTop: '4px' }}>{data.senderAddress}</Text>
        </div>
      </div>

      {/* Main Identity */}
      <div style={{ marginBottom: '32px' }}>
        <Text style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Proposal For</Text>
        <Title level={1} style={{ margin: '4px 0 12px 0', fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          {data.title || 'Proposal Title'}
        </Title>
        <Text style={{ fontSize: '1rem', color: '#475569', maxWidth: '600px', display: 'block', lineHeight: 1.5 }}>
          {data.projectSummary}
        </Text>
      </div>

      {/* Client Informarion & Dates */}
      <div style={{ marginTop: 'auto' }}>
        <Divider style={{ margin: '0 0 20px 0' }} />
        <Row gutter={48}>
          <Col span={14}>
            <Text style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Prepared For</Text>
            <Text strong style={{ display: 'block', color: '#0f172a', fontSize: '1rem' }}>{data.clientCompany}</Text>
            <Text style={{ display: 'block', color: '#475569', fontSize: '0.9rem', marginBottom: '4px' }}>{data.clientName}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', marginBottom: '8px' }}>
              <Text style={{ color: 'inherit' }}>{data.clientEmail}</Text>
              <div style={{ width: '1px', height: '12px', background: '#e2e8f0' }}></div>
              <Text style={{ color: 'inherit' }}>{data.clientPhone}</Text>
            </div>
            <Text style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{data.clientAddress}</Text>
          </Col>
          <Col span={10} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <Text style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>Date</Text>
              <Text strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{data.date ? dayjs(data.date).format('MMMM D, YYYY') : '-'}</Text>
            </div>
            <div>
              <Text style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>Valid Until</Text>
              <Text strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{data.validUntil ? dayjs(data.validUntil).format('MMMM D, YYYY') : '-'}</Text>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export const CoverBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { 
    fontSize: '0.7rem', 
    color: '#94a3b8', 
    fontWeight: 600, 
    textTransform: 'uppercase', 
    letterSpacing: '0.05rem', 
    marginBottom: '6px',
    display: 'block'
  };

  const inputStyle: React.CSSProperties = {
    borderRadius: '8px',
    background: '#ffffff',
    border: '1px solid #e2e8f0'
  };

  return (
    <Form 
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
          <SolutionOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Project Identity</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Proposal Title</span>} name="title">
            <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g., E-commerce Redesign" variant="filled" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Project Summary</span>} name="projectSummary" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Brief summary of the goals" variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>

      {/* Client Information Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UserOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Client Context</Text>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Company Name</span>} name="clientCompany">
            <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} placeholder="Client Company" variant="filled" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Contact Person</span>} name="clientName">
            <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} placeholder="Client Name" variant="filled" style={inputStyle} />
          </Form.Item>
          
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Mail</span>} name="clientEmail">
                <Input prefix={<MailOutlined style={{ color: '#cbd5e1' }} />} placeholder="jane@acme.com" variant="filled" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Phone</span>} name="clientPhone">
                <Input prefix={<PhoneOutlined style={{ color: '#cbd5e1' }} />} placeholder="(555) 000-0000" variant="filled" style={inputStyle} />
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
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Timeline Logistics</Text>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Issue Date</span>} name="date" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<CalendarOutlined style={{ color: '#cbd5e1' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Valid Until</span>} name="validUntil" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<CalendarOutlined style={{ color: '#cbd5e1' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </div>

      {/* Redundant Sender Info - Stylized as Synced */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <GlobalOutlined style={{ color: '#64748b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Organization Sync</Text>
        </div>
        
        <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <InfoCircleOutlined style={{ color: '#3b82f6', marginTop: '2px' }} />
            <Text style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.5 }}>
              These fields are synchronized with your <strong>Branding & Identity</strong> profile at the top of the sidebar.
            </Text>
          </div>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Form.Item label={<span style={labelStyle}>Your Company</span>} name="senderCompany" style={{ marginBottom: 8 }}>
            <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} disabled />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Your Name</span>} name="senderName" style={{ marginBottom: 8 }}>
            <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} disabled />
          </Form.Item>
        </Space>
      </div>
    </Form>
  );
};
