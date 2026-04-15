import { Typography, Form, Input, Button, Divider, DatePicker, Timeline, Tooltip, Row, Col } from 'antd';
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

const { Title, Text } = Typography;

interface TimelineBlockProps {
  data: any;
}

export const TimelineBlock: React.FC<TimelineBlockProps> = ({ data }) => {
  const phases = data.phases || [];

  return (
    <div style={{ padding: '32px 0' }}>
      {data.title && (
        <Title level={2} style={{ marginBottom: '40px', color: '#0f172a', fontWeight: 700 }}>
          {data.title}
        </Title>
      )}

      <div style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <Timeline
          mode="left"
          items={[
            // Start Date
            {
              dot: <FlagOutlined style={{ fontSize: '16px', color: '#10b981' }} />,
              color: 'green',
              children: (
                <div style={{ paddingBottom: '24px' }}>
                  <Text style={{ display: 'block', color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Project Kickoff
                  </Text>
                  <Text strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                    {data.startDate ? dayjs(data.startDate).format('MMMM D, YYYY') : 'TBD'}
                  </Text>
                </div>
              ),
            },
            // Phases
            ...phases.map((phase: any, index: number) => ({
              dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
              color: 'blue',
              children: (
                <div style={{ paddingBottom: '24px' }}>
                  <Text style={{ display: 'block', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    Phase {index + 1}
                  </Text>
                  <Text strong style={{ display: 'block', fontSize: '1.1rem', color: '#1e293b', marginBottom: '8px' }}>
                    {phase.title || 'Untitled Phase'}
                  </Text>
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', display: 'inline-flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid #cbd5e1' }}>
                    <Text style={{ color: '#475569', fontSize: '0.95rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Deadline:</span> {phase.deadline ? dayjs(phase.deadline).format('MMMM D, YYYY') : 'TBD'}
                    </Text>
                    {phase.reviewPeriod && (
                      <Text style={{ color: '#475569', fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: 600, color: '#334155' }}>Review Period:</span> {phase.reviewPeriod}
                      </Text>
                    )}
                    {phase.description && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <Text style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.5, display: 'block' }}>
                          {phase.description}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              ),
            })),
            // Final Launch
            {
              dot: <RocketOutlined style={{ fontSize: '16px', color: '#6366f1' }} />,
              color: '#6366f1',
              children: (
                <div>
                  <Text style={{ display: 'block', color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>
                    Final Launch / Delivery
                  </Text>
                  <Text strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                    {data.finalDate ? dayjs(data.finalDate).format('MMMM D, YYYY') : 'TBD'}
                  </Text>
                </div>
              ),
            }
          ]}
        />
      </div>

      {/* Dependency Notes */}
      {data.dependencyNotes && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#fffbeb', borderRadius: '8px', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <InfoCircleOutlined style={{ color: '#d97706', fontSize: '18px', marginTop: '2px' }} />
          <div>
            <Text strong style={{ display: 'block', color: '#92400e', marginBottom: '4px' }}>Important Note</Text>
            <Text style={{ color: '#b45309', lineHeight: 1.5 }}>
              {data.dependencyNotes}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export const TimelineBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <Form 
      layout="vertical" 
      initialValues={{
        ...data,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        finalDate: data.finalDate ? dayjs(data.finalDate) : null,
        phases: (data.phases || []).map((p: any) => ({ ...p, deadline: p.deadline ? dayjs(p.deadline) : null }))
      }} 
      onValuesChange={(_, allValues) => {
        const serialized = {
          ...data,
          ...allValues,
          startDate: allValues.startDate ? allValues.startDate.toISOString().split('T')[0] : null,
          finalDate: allValues.finalDate ? allValues.finalDate.toISOString().split('T')[0] : null,
          phases: (allValues.phases || []).map((p: any) => ({
            ...p,
            deadline: p.deadline ? p.deadline.toISOString().split('T')[0] : null
          }))
        };
        onUpdate(serialized);
      }}
    >
      {/* Timeline Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <HistoryOutlined style={{ color: '#3b82f6' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Section Definition</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Section Title</span>} name="title" style={{ marginBottom: 0 }}>
            <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Project Timeline" variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>

      {/* Project Anchors */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FlagOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Key Milestones</Text>
        </div>
        
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Kickoff Date</span>} name="startDate" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<FlagOutlined style={{ color: '#cbd5e1' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<span style={labelStyle}>Final Delivery</span>} name="finalDate" style={{ marginBottom: 0 }}>
                <DatePicker prefix={<RocketOutlined style={{ color: '#cbd5e1' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </div>

      {/* Project Phases */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <ClockCircleOutlined style={{ color: '#6366f1' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Project Phases</Text>
        </div>
        
        <Form.List name="phases">
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
                  <Tooltip title="Remove Phase">
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => remove(name)}
                      style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                    />
                  </Tooltip>
                  
                  <Form.Item {...restField} name={[name, 'title']} label={<span style={labelStyle}>Phase Name</span>} style={{ marginBottom: 12 }}>
                    <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. Design & Prototype" variant="filled" style={inputStyle} />
                  </Form.Item>
                  
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item {...restField} name={[name, 'deadline']} label={<span style={labelStyle}>Deadline</span>} style={{ marginBottom: 0 }}>
                        <DatePicker prefix={<CalendarOutlined style={{ color: '#cbd5e1' }} />} style={{ ...inputStyle, width: '100%' }} variant="filled" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item {...restField} name={[name, 'reviewPeriod']} label={<span style={labelStyle}>Review Period</span>} style={{ marginBottom: 0 }}>
                        <Input prefix={<ClockCircleOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. 3 Days" variant="filled" style={inputStyle} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              <Button type="dashed" onClick={() => add({ id: nanoid(), title: '', reviewPeriod: '', description: '' })} block icon={<PlusOutlined />} style={{ borderRadius: '12px', height: '40px' }}>
                Add Phase Deadline
              </Button>
            </>
          )}
        </Form.List>
      </div>

      {/* Conditions */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <InfoCircleOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Timeline Constraints</Text>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Form.Item label={<span style={labelStyle}>Dependency Notes</span>} name="dependencyNotes" style={{ marginBottom: 0 }}>
            <Input.TextArea rows={3} placeholder="Explain how client feedback delays affect the schedule..." variant="filled" style={inputStyle} />
          </Form.Item>
        </div>
      </div>
    </Form>
  );
};
