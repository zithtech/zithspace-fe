import { Typography, Form, Input, Button, Space, Divider, Card, Tag, ColorPicker, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  FlagOutlined,
  UnorderedListOutlined,
  BgColorsOutlined,
  FileTextOutlined,
  TagOutlined
} from '@ant-design/icons';
import { nanoid } from 'nanoid';

const { Title, Text, Paragraph } = Typography;

interface ScopeBlockProps {
  data: any;
}

export const ScopeBlock: React.FC<ScopeBlockProps> = ({ data }) => {
  const milestones = data.milestones || [];

  return (
    <div style={{ padding: '32px 0' }}>
      {data.title && (
        <Title level={2} style={{ marginBottom: '32px', color: '#0f172a', fontWeight: 700 }}>
          {data.title}
        </Title>
      )}

      {/* Milestones / Phases */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {milestones.map((m: any, idx: number) => (
            <Card 
              key={m.id} 
              bordered={true}
              style={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              bodyStyle={{ padding: '24px' }}
            >
              <Title level={4} style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem' }}>
                  Phase {idx + 1}
                </span>
                {m.title}
              </Title>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', color: '#475569', marginBottom: '8px' }}><CheckCircleOutlined style={{ color: '#10b981', marginRight: '6px' }} /> Deliverables:</Text>
                <Text style={{ color: '#334155', display: 'block', paddingLeft: '22px' }}>{m.deliverables}</Text>
              </div>

              <div>
                <Text strong style={{ display: 'block', color: '#475569', marginBottom: '8px' }}>Task List:</Text>
                <ul style={{ margin: 0, paddingLeft: '22px', color: '#334155', lineHeight: 1.6 }}>
                  {(m.tasks || '').split('\n').filter((t: string) => t.trim().length > 0).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Terms & Boundaries */}
      {data.terms && data.terms.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.terms.map((term: any) => {
            const hexColor = term.color || (term.title?.toLowerCase().includes('exclusion') ? '#ef4444' : '#64748b');
            return (
              <div key={term.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${hexColor}` }}>
                <Text strong style={{ display: 'block', color: hexColor, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: '8px' }} /> {term.title}
                </Text>
                <ul style={{ margin: 0, paddingLeft: '24px', color: '#475569', lineHeight: 1.6 }}>
                  {(term.description || '').split('\n').filter((t: string) => t.trim().length > 0).map((t: string, i: number) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


export const ScopeBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <Form layout="vertical" onValuesChange={(_, allValues) => onUpdate({ ...data, ...allValues })} initialValues={data}>
      {/* Scope Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FlagOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Section Definition</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Section Title</span>} name="title" style={{ marginBottom: 0 }}>
            <Input prefix={<FileTextOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Scope of Work" variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>
      
      {/* Milestones / Phases */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UnorderedListOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Milestones & Deliverables</Text>
        </div>
        
        <Form.List name="milestones">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  marginBottom: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative' 
                }}>
                  <Tooltip title="Remove Milestone">
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => remove(name)}
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                    />
                  </Tooltip>
                  
                  <Form.Item {...restField} name={[name, 'title']} label={<span style={labelStyle}>Phase Name</span>} style={{ marginBottom: 12 }}>
                    <Input prefix={<FlagOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Discovery & Strategy" variant="filled" style={inputStyle} />
                  </Form.Item>
                  
                  <Form.Item {...restField} name={[name, 'deliverables']} label={<span style={labelStyle}>Primary Deliverable</span>} style={{ marginBottom: 12 }}>
                    <Input prefix={<CheckCircleOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. UX Audit Report" variant="filled" style={inputStyle} />
                  </Form.Item>
                  
                  <Form.Item {...restField} name={[name, 'tasks']} label={<span style={labelStyle}>Sub-Tasks (One per line)</span>} style={{ marginBottom: 0 }}>
                    <Input.TextArea prefix={<UnorderedListOutlined style={{ color: '#cbd5e1' }} />} rows={3} placeholder="Requirement gathering&#10;User interviews..." variant="filled" style={inputStyle} />
                  </Form.Item>
                </div>
              ))}
              <Button type="dashed" onClick={() => add({ id: nanoid(), title: '', deliverables: '', tasks: '' })} block icon={<PlusOutlined />} style={{ borderRadius: '12px', height: '40px' }}>
                Add New Milestone
              </Button>
            </>
          )}
        </Form.List>
      </div>

      {/* Terms & Boundaries */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <InfoCircleOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Terms & Boundaries</Text>
        </div>

        <Form.List name="terms">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ 
                  background: '#ffffff', 
                  padding: '16px', 
                  marginBottom: '16px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                  borderLeft: `4px solid ${data.terms?.[name]?.color || '#e2e8f0'}`
                }}>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => remove(name)}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  />
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Form.Item {...restField} name={[name, 'title']} label={<span style={labelStyle}>Term Label</span>} style={{ marginBottom: 0 }}>
                        <Input prefix={<TagOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Exclusions" variant="filled" style={inputStyle} />
                      </Form.Item>
                    </div>
                    <Form.Item 
                      {...restField} 
                      name={[name, 'color']} 
                      label={<span style={labelStyle}>Theme</span>} 
                      style={{ marginBottom: 0 }}
                      getValueProps={(val) => ({ value: val || '#64748b' })}
                      normalize={(val) => typeof val === 'string' ? val : val?.toHexString?.() || '#64748b'}
                    >
                      <ColorPicker format="hex" size="small" />
                    </Form.Item>
                  </div>
                  
                  <Form.Item {...restField} name={[name, 'description']} label={<span style={labelStyle}>Description Details</span>} style={{ marginBottom: 0 }}>
                    <Input.TextArea rows={3} placeholder="Specify boundaries or rules..." variant="filled" style={inputStyle} />
                  </Form.Item>
                </div>
              ))}
              <Button type="dashed" onClick={() => add({ id: nanoid(), title: '', description: '' })} block icon={<PlusOutlined />} style={{ borderRadius: '12px', height: '40px' }}>
                Add Boundary Condition
              </Button>
            </>
          )}
        </Form.List>
      </div>
    </Form>
  );
};
