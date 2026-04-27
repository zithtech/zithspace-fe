import React, { useState } from 'react';
import { Button, Modal, Input, message, Spin, Typography, Space, Divider, Tag } from 'antd';
import { Sparkles } from 'lucide-react';
import { ProposalService } from '@/services/proposalService';
import { ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;

interface AIEnhanceButtonProps {
  originalData: any;
  blockType: string;
  label?: string;
  onApply: (newData: any) => void;
  style?: React.CSSProperties;
}

export const AIEnhanceButton: React.FC<AIEnhanceButtonProps> = ({
  originalData,
  blockType,
  label,
  onApply,
  style
}) => {
  const [visible, setVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [refinedData, setRefinedData] = useState<any>(null);

  const handleRefine = async () => {
    if (!instruction.trim()) return message.warning('Please enter an instruction first.');

    setLoading(true);
    try {
      const res = await ProposalService.refineBlock({
        blockType,
        currentData: originalData,
        userPrompt: instruction
      }) as any;

      console.log('🔍 [AI DEBUG] Refined Response:', res);

      // Your interceptor returns the data directly (e.g. { id, title, etc })
      // Or sometimes the success wrapper if it's a different path
      let payload = null;
      let isSuccess = false;

      if (res && (res.success === true || res?.data?.success === true)) {
        // Standard wrapper case
        payload = res.data?.data || res.data;
        isSuccess = true;
      } else if (res && typeof res === 'object') {
        // Direct payload case (interceptor stripped the wrapper)
        payload = res;
        isSuccess = true;
      } else if (res && typeof res === 'string') {
        // Direct string case
        payload = res;
        isSuccess = true;
      }

      if (isSuccess && payload) {
        console.log('✨ [AI DEBUG] Final Payload to display:', payload);
        setRefinedData(payload);
        message.success('Ready to review!');
      } else {
        console.warn('⚠️ [AI DEBUG] Could not determine success or payload');
        message.error('Failed to refine content.');
      }
    } catch (err: any) {
      console.error('❌ [AI DEBUG] Error:', err);
      message.error('Error during refinement.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(refinedData);
    setVisible(false);
    setInstruction('');
    setRefinedData(null);
  };

  const renderPreview = (content: any, type: 'original' | 'refined' = 'original') => {
    // For original strings, if empty, show placeholder
    if (!content && type === 'original') {
      return <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Empty / No content</div>;
    }
    
    if (!content) return null;
    
    if (typeof content === 'string') {
      const isHtml = /<[a-z][\s\S]*>/i.test(content);
      
      if (isHtml) {
        return (
          <div 
            style={{ 
              color: type === 'refined' ? 'var(--premium-blue)' : 'var(--text-primary)', 
              lineHeight: 1.6, 
              fontSize: '0.9rem' 
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }

      return (
        <div style={{ 
          color: type === 'refined' ? 'var(--premium-blue)' : 'var(--text-primary)', 
          lineHeight: 1.7, 
          fontSize: '0.95rem', 
          whiteSpace: 'pre-wrap',
          fontWeight: type === 'refined' ? 500 : 400
        }}>
          {content}
        </div>
      );
    }

    const isObject = content && typeof content === 'object' && !Array.isArray(content);
    const hasOriginalObject = originalData && typeof originalData === 'object' && !Array.isArray(originalData);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isObject && Object.entries(content).map(([key, value]) => {
          if (key === 'id') return null;
          
          // For refined view, only show if it changed from original
          if (type === 'refined' && hasOriginalObject) {
            const originalValue = (originalData as any)[key];
            const isChanged = JSON.stringify(originalValue) !== JSON.stringify(value);
            if (!isChanged) return null;
            
            return (
              <div key={key} style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                  <Tag color="green" style={{ fontSize: '0.6rem', margin: 0, borderRadius: '10px', border: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>UPDATED</Tag>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--premium-blue)', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </div>
              </div>
            );
          }

          return (
            <div key={key} style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </div>
            </div>
          );
        })}

        {type === 'refined' && isObject && hasOriginalObject && 
         Object.keys(content).every(k => JSON.stringify((originalData as any)[k]) === JSON.stringify(content[k])) && (
           <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
             No changes detected for these fields.
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<Sparkles size={14} color="var(--premium-blue)" />}
        onClick={() => {
          setRefinedData(null);
          setInstruction('');
          setVisible(true);
        }}
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--premium-blue)',
          height: '24px',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s',
          ...style
        }}
        className="hover:shadow-sm hover:scale-105"
      >
        {label || 'Enhance'}
      </Button>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px', borderRadius: '10px' }}>
              <Sparkles size={18} color="var(--premium-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Smart Refinement</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Precision editing powered by Gemini AI</div>
            </div>
          </div>
        }
        open={visible}
        onCancel={() => !loading && setVisible(false)}
        width={950} // Increased width for better side-by-side
        footer={null}
        destroyOnHidden
        centered
        styles={{
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.5)' },
          content: { borderRadius: '20px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', background: 'var(--bg-pure-white)' }
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Instruction Bar */}
          <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ExperimentOutlined style={{ color: 'var(--premium-blue)' }} />
              <Text strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>What should AI change?</Text>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Input.TextArea
                rows={2}
                placeholder="e.g. 'Make it professional', 'Add a step for testing', 'Focus on value proposition'..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={loading}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  padding: '12px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
              <Button
                type="primary"
                onClick={handleRefine}
                loading={loading}
                style={{
                  background: 'var(--premium-blue)',
                  height: 'auto',
                  padding: '0 24px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                }}
              >
                Refine Content
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {[
                'Make it professional',
                'Summarize this',
                'Fix grammar & flow',
                'Make it more persuasive',
                'Simplify the language'
              ].map((s) => (
                <Tag
                  key={s}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                  className="hover:border-indigo-400 hover:text-indigo-600"
                  onClick={() => setInstruction(s)}
                >
                  {s}
                </Tag>
              ))}
            </div>
          </div>

          {/* Comparison View */}
          <div style={{ display: 'flex', gap: '24px', position: 'relative' }}>
            {/* LEFT: ORIGINAL */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                <Text strong style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Old Content</Text>
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                height: '400px',
                overflow: 'auto',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                {renderPreview(originalData, 'original')}
              </div>
            </div>

            {/* Middle Divider Arrow */}
            <div style={{ alignSelf: 'center', color: '#cbd5e1' }}>
              <ArrowRightOutlined style={{ fontSize: '20px' }} />
            </div>

            {/* AI Suggestion */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: refinedData ? 'var(--premium-blue)' : 'var(--text-secondary)' }} />
                <Text strong style={{ color: refinedData ? 'var(--premium-blue)' : 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Updated Content</Text>
              </div>
              <div style={{
                background: refinedData ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '24px',
                border: refinedData ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-color)',
                height: '400px',
                overflow: 'auto',
                boxShadow: refinedData ? '0 10px 15px -3px rgba(16, 185, 129, 0.05)' : 'none'
              }}>
                {loading ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <Spin size="large" />
                    <Text style={{ color: '#64748b', fontSize: '0.85rem' }}>AI is polishing your content...</Text>
                  </div>
                ) : refinedData ? (
                  renderPreview(refinedData, 'refined')
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                      <ExperimentOutlined style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '12px' }} />
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Results will appear here</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          {refinedData && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleApply}
                style={{
                  background: '#10b981',
                  borderColor: '#10b981',
                  borderRadius: '14px',
                  padding: '0 40px',
                  height: '48px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.25)'
                }}
              >
                Apply AI Suggestions
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
