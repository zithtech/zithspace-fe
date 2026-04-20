import React from 'react';
import { Typography, Form, Input, Button, Divider, Card, ColorPicker, Tooltip } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  FlagOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  TagOutlined
} from '@ant-design/icons';
import { nanoid } from 'nanoid';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';

const { Title, Text } = Typography;

interface ScopeBlockProps {
  data: any;
}

export const ScopeBlock: React.FC<ScopeBlockProps> = ({ data }) => {
  const milestones = data.milestones || [];

  return (
    <div style={{ padding: '32px 0' }}>
      {data.title && (
        <Title level={2} style={{ marginBottom: '32px', color: 'var(--text-primary)', fontWeight: 700 }}>
          {data.title}
        </Title>
      )}

      {/* Milestones / Phases */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {milestones.map((m: any, idx: number) => (
            <Card
              key={m.id}
              style={{ borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              bodyStyle={{ padding: '24px' }}
            >
              <Title level={4} style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem' }}>
                  Phase {idx + 1}
                </span>
                {m.title}
              </Title>

              <div style={{ marginBottom: '16px' }}>
                <Text strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}><CheckCircleOutlined style={{ color: '#10b981', marginRight: '6px' }} /> Deliverables:</Text>
                <Text style={{ color: 'var(--text-primary)', display: 'block', paddingLeft: '22px' }}>{m.deliverables}</Text>
              </div>

              <div>
                <Text strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px' }}>Task List:</Text>
                <ul style={{ margin: 0, paddingLeft: '22px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
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
            const hexColor = term.color || (term.title?.toLowerCase().includes('exclusion') ? '#ef4444' : 'var(--text-secondary)');
            return (
              <div key={term.id} style={{ padding: '4px 10px', background: 'var(--bg-primary)', borderRadius: '8px', borderLeft: `4px solid ${hexColor}` }}>
                <Text strong style={{ color: hexColor, marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: '8px' }} /> {term.title}
                </Text>
                <div style={{ color: 'var(--text-secondary)', }}>
                  <TiptapViewer content={term.description || ''} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


export const ScopeBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  const handleUpdate = (changed: any) => {
    onUpdate({ ...data, ...changed });
  };

  return (
    <Form layout="vertical">
      {/* Scope Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FlagOutlined style={{ color: 'var(--premium-blue)' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Section Definition</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.Item label={<span style={labelStyle}>Section Title</span>} style={{ marginBottom: 0 }}>
            <Input
              prefix={<FileTextOutlined style={{ color: '#cbd5e1' }} />}
              placeholder="e.g. Scope of Work"
              variant="filled"
              style={inputStyle}
              value={data.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </Form.Item>
        </div>
      </div>

      {/* Milestones / Phases */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UnorderedListOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Milestones & Deliverables</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data.milestones || []).map((m: any, index: number) => (
            <div key={m.id} style={{
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const newMilestones = [...data.milestones];
                  newMilestones.splice(index, 1);
                  handleUpdate({ milestones: newMilestones });
                }}
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
              />

              <Form.Item label={<span style={labelStyle}>Phase Name</span>} style={{ marginBottom: 12 }}>
                <Input
                  placeholder="e.g. Discovery"
                  variant="filled"
                  style={inputStyle}
                  value={m.title}
                  onChange={(e) => {
                    const newMilestones = [...data.milestones];
                    newMilestones[index] = { ...m, title: e.target.value };
                    handleUpdate({ milestones: newMilestones });
                  }}
                />
              </Form.Item>

              <Form.Item label={<span style={labelStyle}>Primary Deliverable</span>} style={{ marginBottom: 12 }}>
                <Input
                  placeholder="e.g. UX Audit"
                  variant="filled"
                  style={inputStyle}
                  value={m.deliverables}
                  onChange={(e) => {
                    const newMilestones = [...data.milestones];
                    newMilestones[index] = { ...m, deliverables: e.target.value };
                    handleUpdate({ milestones: newMilestones });
                  }}
                />
              </Form.Item>

              <Form.Item label={<span style={labelStyle}>Sub-Tasks</span>} style={{ marginBottom: 0 }}>
                <Input.TextArea
                  rows={3}
                  placeholder="Tasks..."
                  variant="filled"
                  style={inputStyle}
                  value={m.tasks}
                  onChange={(e) => {
                    const newMilestones = [...data.milestones];
                    newMilestones[index] = { ...m, tasks: e.target.value };
                    handleUpdate({ milestones: newMilestones });
                  }}
                />
              </Form.Item>
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => handleUpdate({ milestones: [...(data.milestones || []), { id: nanoid(), title: '', deliverables: '', tasks: '' }] })}
            block icon={<PlusOutlined />}
            style={{ borderRadius: '12px', height: '40px' }}
          >
            Add New Milestone
          </Button>
        </div>
      </div>

      {/* Terms & Boundaries */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <InfoCircleOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Terms & Boundaries</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data.terms || []).map((term: any, index: number) => (
            <div key={term.id} style={{
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              borderLeft: `4px solid ${term.color || 'var(--border-color)'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Input
                    placeholder="e.g. Exclusions"
                    value={term.title}
                    onChange={(e) => {
                      const newTerms = [...data.terms];
                      newTerms[index] = { ...term, title: e.target.value };
                      handleUpdate({ terms: newTerms });
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <ColorPicker
                    value={term.color || '#64748b'}
                    onChange={(val) => {
                      const newTerms = [...data.terms];
                      newTerms[index] = { ...term, color: val.toHexString() };
                      handleUpdate({ terms: newTerms });
                    }}
                  />
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const newTerms = [...data.terms];
                    newTerms.splice(index, 1);
                    handleUpdate({ terms: newTerms });
                  }}
                />
              </div>

              <div>
                <span style={labelStyle}>Description Details</span>
                <TiptapEditor
                  content={term.description || ''}
                  onChange={(html) => {
                    const newTerms = [...data.terms];
                    newTerms[index] = { ...term, description: html };
                    handleUpdate({ terms: newTerms });
                  }}
                  minHeight={150}
                />
              </div>
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => handleUpdate({ terms: [...(data.terms || []), { id: nanoid(), title: '', description: '', color: '#64748b' }] })}
            block icon={<PlusOutlined />}
            style={{ borderRadius: '12px', height: '40px' }}
          >
            Add Boundary Condition
          </Button>
        </div>
      </div>
    </Form>
  );
};
