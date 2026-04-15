import { Typography, Row, Col, Form, Input, Divider, Space } from 'antd';
import { 
  SafetyCertificateOutlined, 
  FileProtectOutlined, 
  UserOutlined, 
  BankOutlined, 
  EditOutlined,
  FileTextOutlined,
  LockOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface SignatureBlockProps {
  data: any;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ data }) => {
  return (
    <div style={{ padding: '40px 0 24px 0', pageBreakInside: 'avoid' }}>
      {data.title && (
        <Title level={2} style={{ marginBottom: '40px', color: '#0f172a' }}>
          {data.title}
        </Title>
      )}

      {/* Legal Clauses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '48px', color: '#475569' }}>
        {data.ipClause && (
          <div>
            <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '1rem' }}>Intellectual Property (IP)</Text>
            <Text style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{data.ipClause}</Text>
          </div>
        )}
        {data.revisionClause && (
          <div>
            <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '1rem' }}>Revision Policy</Text>
            <Text style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{data.revisionClause}</Text>
          </div>
        )}
        {data.terminationClause && (
          <div>
            <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '1rem' }}>Termination Clause</Text>
            <Text style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{data.terminationClause}</Text>
          </div>
        )}
        {data.ndaClause && (
          <div>
            <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: '8px', fontSize: '1rem' }}>Confidentiality Agreement</Text>
            <Text style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{data.ndaClause}</Text>
          </div>
        )}
      </div>

      <Divider style={{ borderColor: '#e2e8f0', marginBottom: '48px' }} />
      
      <Row gutter={[64, 48]}>
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text strong style={{ fontSize: '1.1rem' }}>For: {data.companyName}</Text>
            <div style={{ height: '80px', borderBottom: '2px solid #e2e8f0', marginTop: '20px' }}></div>
            <Text style={{ marginTop: '8px', color: '#64748b' }}>{data.companySigner}</Text>
            <Text style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Date</Text>
          </div>
        </Col>
        
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text strong style={{ fontSize: '1.1rem' }}>For: {data.clientName}</Text>
            <div style={{ height: '80px', borderBottom: '2px solid #e2e8f0', marginTop: '20px' }}></div>
            <Text style={{ marginTop: '8px', color: '#64748b' }}>{data.clientSigner}</Text>
            <Text style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Date</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export const SignatureBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <Form layout="vertical" onValuesChange={(_, allValues) => onUpdate({ ...data, ...allValues })} initialValues={data}>
      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <SafetyCertificateOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Agreement Definition</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Section Title</span>} name="title" style={{ marginBottom: 0 }}>
            <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Agreement & Sign-off" variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>

      {/* Legal Clauses Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileProtectOutlined style={{ color: '#6366f1' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Legal Clauses</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Intellectual Property (IP)</span>} name="ipClause">
            <Input.TextArea prefix={<LockOutlined style={{ color: '#cbd5e1' }} />} rows={2} placeholder="Ownership transfers only after full payment..." variant="filled" style={inputStyle} />
          </Form.Item>
          
          <Form.Item label={<span style={labelStyle}>Revision Policy</span>} name="revisionClause">
            <Input.TextArea prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} rows={2} placeholder="Define what constitutes a minor revision..." variant="filled" style={inputStyle} />
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>Termination Clause</span>} name="terminationClause">
            <Input.TextArea rows={2} placeholder="How either party can exit the agreement..." variant="filled" style={inputStyle} />
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>Confidentiality / NDA</span>} name="ndaClause" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={2} placeholder="Protection of sensitive information..." variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>

      {/* Formal Sign-Off Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UserOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Formal Sign-Off</Text>
        </div>
        
        {/* Your Details */}
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
            <Text strong style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>Your Organization</Text>
          </div>
          <Form.Item label={<span style={labelStyle}>Company Name</span>} name="companyName">
            <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Signer Name / Title</span>} name="companySigner" style={{ marginBottom: 0 }}>
            <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} />
          </Form.Item>
        </div>

        {/* Client Details */}
        <div style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            <Text strong style={{ fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>Client Approval</Text>
          </div>
          <Form.Item label={<span style={labelStyle}>Client Name</span>} name="clientName">
            <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Client Signer Name / Title</span>} name="clientSigner" style={{ marginBottom: 0 }}>
            <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>
    </Form>
  );
};
