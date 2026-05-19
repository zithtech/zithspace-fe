import React from 'react';
import { Typography, Form, Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import { AIEnhanceButton } from '../AIEnhanceButton';
import { BlockGhostHint, BlockGhostLine } from './BlockGhost';

const { Title } = Typography;

interface TextBlockProps {
  data: any;
  isEditor?: boolean;
  onUpdate?: (data: any) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({ data }) => {
  const isEmpty = !data.heading && !data.content;
  return (
    <div style={{ padding: '40px' }}>
      {isEmpty && <BlockGhostHint />}
      <Title
        level={2}
        style={{
          marginBottom: '12px',
          color: data.heading ? 'var(--text-primary)' : 'var(--text-slate-400)',
          fontWeight: 700,
          fontStyle: data.heading ? 'normal' : 'italic',
        }}
      >
        {data.heading || 'Section Heading'}
      </Title>
      {data.content ? (
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          <TiptapViewer content={data.content} />
        </div>
      ) : (
        <div>
          <BlockGhostLine width="92%" />
          <BlockGhostLine width="86%" />
          <BlockGhostLine width="78%" />
          <BlockGhostLine width="64%" />
        </div>
      )}
    </div>
  );
};

export const TextBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  return (
    <Form layout="vertical">
      <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <Form.Item 
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ ...labelStyle, flex: 1 }}>Section Heading</span>
              <AIEnhanceButton 
                originalData={data.heading} 
                blockType="text (heading)" 
                onApply={(newHeading) => onUpdate({ ...data, heading: newHeading })} 
              />
            </div>
          }
        >
          <Input 
            prefix={<EditOutlined style={{ color: 'var(--border-color)' }} />} 
            placeholder="e.g. Project Background" 
            variant="filled" 
            style={inputStyle} 
            value={data.heading}
            onChange={(e) => onUpdate({ ...data, heading: e.target.value })}
          />
        </Form.Item>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 6 }}>
            <span style={{ ...labelStyle, flex: 1 }}>Main Content</span>
            <AIEnhanceButton 
              originalData={data.content} 
              blockType="text (content)" 
              onApply={(newContent) => onUpdate({ ...data, content: newContent })} 
            />
          </div>
          <TiptapEditor 
            content={data.content || ''} 
            onChange={(html) => onUpdate({ ...data, content: html })}
            minHeight={300}
          />
        </div>
      </div>
    </Form>
  );
};
