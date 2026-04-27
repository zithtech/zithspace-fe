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
import { AIEnhanceButton } from '../AIEnhanceButton';

const { Title, Text } = Typography;

interface ScopeBlockProps {
  data: any;
}

export const ScopeBlock: React.FC<ScopeBlockProps> = ({ data }) => {
  const milestones = data.milestones || [];

  return (
    <div style={{ padding: '40px' }}>
      {data.title && (
        <Title level={2} style={{ marginBottom: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
          {data.title}
        </Title>
      )}

      {/* Milestones / Phases */}
      {milestones.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {milestones.map((m: any, idx: number) => (
            <div key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <span style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  color: 'var(--premium-blue)', 
                  padding: '4px 16px', 
                  borderRadius: '20px', 
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  Phase {idx + 1}
                </span>
                <Title level={4} style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  {m.title}
                </Title>
              </div>

              <div style={{ paddingLeft: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                  <CheckCircleOutlined style={{ color: '#10b981', marginTop: '6px', fontSize: '1.2rem' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '8px' }}>Major Deliverables</Text>
                    <Text style={{ color: 'var(--text-secondary)', display: 'block', lineHeight: 1.8, fontSize: '1rem' }}>{m.deliverables}</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingLeft: '4px' }}>
                  <UnorderedListOutlined style={{ color: 'var(--premium-blue)', marginTop: '4px', fontSize: '1.1rem' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px' }}>Detailed Tasks</Text>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                      {(m.tasks || '').split('\n').filter((t: string) => t.trim().length > 0).map((t: string, i: number) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {idx < milestones.length - 1 && <Divider style={{ margin: '40px 0', borderColor: 'var(--border-color)', opacity: 0.6 }} />}
            </div>
          ))}
        </div>
      )}

      {/* Terms & Boundaries */}
      {data.terms && data.terms.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.terms.map((term: any) => {
            const hexColor = term.color || (term.title?.toLowerCase().includes('exclusion') ? '#ef4444' : 'var(--text-secondary)');
            return (
              <div key={term.id} style={{ padding: '12px 16px', background: 'var(--bg-slate-50)', borderRadius: '8px', borderLeft: `4px solid ${hexColor}`, border: '1px solid var(--border-color)', borderLeftWidth: '4px' }}>
                <Text strong style={{ color: hexColor, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: '8px' }} /> {term.title}
                </Text>
                <div style={{ color: 'var(--text-primary)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={labelStyle}>Section Details</span>
            <AIEnhanceButton 
              originalData={{ title: data.title }} 
              blockType="scope (title)" 
              onApply={(newData) => handleUpdate({ ...data, ...newData })} 
            />
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Milestone Phase</Text>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AIEnhanceButton 
                    originalData={m} 
                    blockType="scope (milestone)" 
                    onApply={(newM) => {
                      const newMilestones = [...data.milestones];
                      newMilestones[index] = { ...newM, id: m.id };
                      handleUpdate({ milestones: newMilestones });
                    }} 
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newMilestones = [...data.milestones];
                      newMilestones.splice(index, 1);
                      handleUpdate({ milestones: newMilestones });
                    }}
                    style={{ height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </div>
              </div>

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={labelStyle}>Boundary Details</span>
                    <AIEnhanceButton 
                      originalData={term} 
                      blockType="scope (boundary)" 
                      onApply={(newTerm) => {
                        const newTerms = [...data.terms];
                        newTerms[index] = { ...newTerm, id: term.id };
                        handleUpdate({ terms: newTerms });
                      }} 
                    />
                  </div>
                  <Input
                    placeholder="e.g. Exclusions"
                    value={term.title}
                    onChange={(e) => {
                      const newTerms = [...data.terms];
                      newTerms[index] = { ...term, title: e.target.value };
                      handleUpdate({ terms: newTerms });
                    }}
                    style={{ ...inputStyle, flex: 1, marginBottom: 8 }}
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
