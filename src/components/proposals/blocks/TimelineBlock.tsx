import React from 'react';
import { Typography, Form, Input, Button, DatePicker, Timeline, Tooltip, Row, Col } from 'antd';
import { BlockGhostHint, BlockGhostLine } from './BlockGhost';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  RocketOutlined,
  CalendarOutlined,
  EditOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import { AIEnhanceButton } from '../AIEnhanceButton';

const { Title, Text } = Typography;

interface TimelineBlockProps {
  data: any;
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ data }) => {
  const phases = data.phases || [];
  const isEmpty = !data.title && phases.length === 0 && !data.startDate && !data.finalDate && !data.dependencyNotes;

  const ghostPhases = [
    { id: 'g1', title: 'Phase 1 — Discovery', reviewPeriod: '3 Days', description: 'Define goals, audit, and align on scope.', _ghost: true },
    { id: 'g2', title: 'Phase 2 — Design & Build', reviewPeriod: '5 Days', description: 'Wireframes, visual design, then development.', _ghost: true },
  ];
  const phasesToRender = phases.length > 0 ? phases : ghostPhases;

  return (
    <div style={{ padding: '16px 0' }}>
      {isEmpty && <BlockGhostHint />}

      <Title
        level={2}
        style={{
          marginBottom: '16px',
          color: data.title ? 'var(--text-primary)' : 'var(--text-slate-400)',
          fontStyle: data.title ? 'normal' : 'italic',
          fontWeight: 700,
        }}
      >
        {data.title || 'Timeline & Schedule'}
      </Title>

      <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--box-shadow)' }}>
        <Timeline
          mode="left"
          items={[
            {
              dot: <FlagOutlined style={{ fontSize: '16px', color: '#10b981' }} />,
              color: 'green',
              children: (
                <div style={{ paddingBottom: '24px' }}>
                  <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Project Kickoff
                  </Text>
                  <Text strong style={{ fontSize: '1.2rem', color: data.startDate ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.startDate ? 'normal' : 'italic' }}>
                    {data.startDate ? dayjs(data.startDate).format('MMMM D, YYYY') : 'Set kickoff date'}
                  </Text>
                </div>
              ),
            },
            ...phasesToRender.map((phase: any, index: number) => ({
              dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
              color: 'blue',
              children: (
                <div style={{ paddingBottom: '24px', opacity: phase._ghost ? 0.75 : 1 }}>
                  <Text style={{ display: 'block', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    Phase {index + 1}
                  </Text>
                  <Text strong style={{ display: 'block', fontSize: '1.1rem', color: phase._ghost ? 'var(--text-slate-400)' : 'var(--text-primary)', fontStyle: phase._ghost ? 'italic' : 'normal', marginBottom: '8px' }}>
                    {phase.title || 'Untitled Phase'}
                  </Text>
                  <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: '8px', display: 'inline-flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid var(--border-color)' }}>
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Deadline:</span>{' '}
                      <span style={{ color: phase.deadline ? 'inherit' : 'var(--text-slate-400)', fontStyle: phase.deadline ? 'normal' : 'italic' }}>
                        {phase.deadline ? dayjs(phase.deadline).format('MMMM D, YYYY') : 'Set a date'}
                      </span>
                    </Text>
                    {phase.reviewPeriod && (
                      <Text style={{ color: phase._ghost ? 'var(--text-slate-400)' : 'var(--text-secondary)', fontStyle: phase._ghost ? 'italic' : 'normal', fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Review Period:</span> {phase.reviewPeriod}
                      </Text>
                    )}
                    {phase.description && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <Text style={{ color: phase._ghost ? 'var(--text-slate-400)' : 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}>
                          {phase.description}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              ),
            })),
            {
              dot: <RocketOutlined style={{ fontSize: '16px', color: '#6366f1' }} />,
              color: '#6366f1',
              children: (
                <div>
                  <Text style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Final Launch / Delivery
                  </Text>
                  <Text strong style={{ fontSize: '1.2rem', color: data.finalDate ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.finalDate ? 'normal' : 'italic' }}>
                    {data.finalDate ? dayjs(data.finalDate).format('MMMM D, YYYY') : 'Set delivery date'}
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </div>

      {data.dependencyNotes ? (
        <div style={{
          marginTop: '24px', padding: '24px',
          background: 'rgba(253, 230, 138, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(253, 230, 138, 0.3)',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <InfoCircleOutlined style={{ color: '#d97706', fontSize: '20px', marginTop: '2px' }} />
          <div>
            <Text strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem' }}>Timeline Constraints & Dependencies</Text>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <TiptapViewer content={data.dependencyNotes} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: '24px', padding: '20px',
          background: 'rgba(253, 230, 138, 0.06)',
          borderRadius: '12px',
          border: '1px dashed rgba(253, 230, 138, 0.5)',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <InfoCircleOutlined style={{ color: '#d97706', fontSize: '20px', marginTop: '2px', opacity: 0.6 }} />
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1rem' }}>Timeline Constraints & Dependencies</Text>
            <BlockGhostLine width="80%" />
            <BlockGhostLine width="60%" />
          </div>
        </div>
      )}
    </div>
  );
};

export const TimelineBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  const handleUpdate = (changed: any) => {
    onUpdate({ ...data, ...changed });
  };

  return (
    <Form layout="vertical">
      {/* Timeline Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <HistoryOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Section Definition</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={labelStyle}>Section Details</span>
            <AIEnhanceButton 
              originalData={{ title: data.title }} 
              blockType="timeline (title)" 
              onApply={(newData) => handleUpdate({ ...data, ...newData })} 
            />
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <Input
              prefix={<EditOutlined style={{ color: 'var(--border-color)' }} />}
              placeholder="e.g. Project Timeline"
              variant="filled"
              style={inputStyle}
              value={data.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </Form.Item>
        </div>
      </div>

      {/* Project Anchors */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlagOutlined style={{ color: '#10b981' }} />
            <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Key Milestones</Text>
          </div>
          <AIEnhanceButton 
            originalData={{ kickoff: data.startDate, deadline: data.finalDate }} 
            blockType="timeline (anchors)" 
            onApply={(newDates) => {
              handleUpdate({ 
                startDate: newDates.kickoff || data.startDate, 
                finalDate: newDates.deadline || data.finalDate 
              });
            }} 
          />
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Kickoff Date</span>} style={{ marginBottom: 0 }}>
                <DatePicker
                  style={{ ...inputStyle, width: '100%' }}
                  variant="filled"
                  value={data.startDate ? dayjs(data.startDate) : null}
                  onChange={(date) => handleUpdate({ startDate: date ? date.format('YYYY-MM-DD') : null })}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Final Delivery</span>} style={{ marginBottom: 0 }}>
                <DatePicker
                  style={{ ...inputStyle, width: '100%' }}
                  variant="filled"
                  value={data.finalDate ? dayjs(data.finalDate) : null}
                  onChange={(date) => handleUpdate({ finalDate: date ? date.format('YYYY-MM-DD') : null })}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </div>

      {/* Project Phases */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ClockCircleOutlined style={{ color: '#6366f1' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Project Phases</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data.phases || []).map((phase: any, index: number) => (
            <div key={phase.id} style={{
              background: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Project Phase</Text>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AIEnhanceButton 
                    originalData={phase} 
                    blockType="timeline (phase)" 
                    onApply={(newP) => {
                      const newPhases = [...data.phases];
                      newPhases[index] = { ...newP, id: phase.id };
                      handleUpdate({ phases: newPhases });
                    }} 
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newPhases = [...data.phases];
                      newPhases.splice(index, 1);
                      handleUpdate({ phases: newPhases });
                    }}
                    style={{ height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </div>
              </div>

              <Form.Item label={<span style={labelStyle}>Phase Name</span>} style={{ marginBottom: 12 }}>
                <Input
                  placeholder="e.g. Design & Prototype"
                  variant="filled"
                  style={inputStyle}
                  value={phase.title}
                  onChange={(e) => {
                    const newPhases = [...data.phases];
                    newPhases[index] = { ...phase, title: e.target.value };
                    handleUpdate({ phases: newPhases });
                  }}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label={<span style={labelStyle}>Deadline</span>} style={{ marginBottom: 0 }}>
                    <DatePicker
                      style={{ ...inputStyle, width: '100%' }}
                      variant="filled"
                      value={phase.deadline ? dayjs(phase.deadline) : null}
                      onChange={(date) => {
                        const newPhases = [...data.phases];
                        newPhases[index] = { ...phase, deadline: date ? date.format('YYYY-MM-DD') : null };
                        handleUpdate({ phases: newPhases });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={labelStyle}>Review Period</span>} style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="e.g. 3 Days"
                      variant="filled"
                      style={inputStyle}
                      value={phase.reviewPeriod}
                      onChange={(e) => {
                        const newPhases = [...data.phases];
                        newPhases[index] = { ...phase, reviewPeriod: e.target.value };
                        handleUpdate({ phases: newPhases });
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() => handleUpdate({ phases: [...(data.phases || []), { id: nanoid(), title: '', reviewPeriod: '', deadline: null, description: '' }] })}
            block icon={<PlusOutlined />}
            style={{ borderRadius: '12px', height: '40px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            Add Phase Deadline
          </Button>
        </div>
      </div>

      {/* Conditions */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <InfoCircleOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Timeline Constraints</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 6 }}>
              <span style={labelStyle}>Dependency Notes</span>
              <AIEnhanceButton 
                originalData={data.dependencyNotes} 
                blockType="timeline (dependencies)" 
                onApply={(newNotes) => handleUpdate({ dependencyNotes: newNotes })} 
              />
            </div>
            <TiptapEditor
              content={data.dependencyNotes || ''}
              onChange={(html) => handleUpdate({ dependencyNotes: html })}
              minHeight={150}
            />
          </div>
        </div>
      </div>
    </Form>
  );
};
