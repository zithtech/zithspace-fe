import { Typography, Form, Input } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface TextBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  return (
    <div style={{ padding: '24px 0' }}>
      {data.heading && (
        <Title level={2} style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 700 }}>
          {data.heading}
        </Title>
      )}
      <Paragraph style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        {data.content}
      </Paragraph>
    </div>
  );
};

export const TextBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <Form layout="vertical" initialValues={data} onValuesChange={(_, allValues) => onUpdate(allValues)}>
      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <Form.Item label={<span style={labelStyle}>Section Heading</span>} name="heading">
          <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Project Background" variant="filled" style={inputStyle} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Main Content</span>} name="content" style={{ marginBottom: 0 }}>
          <Input.TextArea prefix={<FileTextOutlined style={{ color: '#cbd5e1' }} />} rows={10} placeholder="Enter your detailed content here..." variant="filled" style={inputStyle} />
        </Form.Item>
      </div>
    </Form>
  );
};
