import React, { useState } from 'react';
import { Button, Modal, Input, message, Typography, Tag } from 'antd';
import { Sparkles, Wand2, ArrowRight, Check, Zap } from 'lucide-react';
import { ProposalService } from '@/services/proposalService';
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;

interface AIEnhanceButtonProps {
  originalData: any;
  blockType: string;
  label?: string;
  onApply: (newData: any) => void;
  style?: React.CSSProperties;
}

const QUICK_SUGGESTIONS = [
  { label: 'Make it professional', icon: '💼' },
  { label: 'Summarize this',        icon: '📋' },
  { label: 'Fix grammar & flow',    icon: '✏️' },
  { label: 'Make it more persuasive', icon: '🎯' },
  { label: 'Simplify the language', icon: '✨' },
];

export const AIEnhanceButton: React.FC<AIEnhanceButtonProps> = ({
  originalData,
  blockType,
  label,
  onApply,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [refinedData, setRefinedData] = useState<any>(null);

  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_proposals_builder_prime');
  
  if (!hasPrime) return null;

  const isEmptyOriginal = !originalData ||
    (typeof originalData === 'object' && Object.values(originalData).every((v) => !v));

  const triggerLabel = label || (isEmptyOriginal ? 'Create with Zai' : 'Enhance with Zai');

  const handleRefine = async () => {
    if (!instruction.trim()) return message.warning('Please enter an instruction first.');

    setLoading(true);
    setRefinedData(null);
    try {
      const res = (await ProposalService.refineBlock({
        blockType,
        currentData: originalData,
        userPrompt: instruction,
      })) as any;

      let payload = null;
      let isSuccess = false;

      if (res && (res.success === true || res?.data?.success === true)) {
        payload = res.data?.data || res.data;
        isSuccess = true;
      } else if (res && typeof res === 'object') {
        payload = res;
        isSuccess = true;
      } else if (res && typeof res === 'string') {
        payload = res;
        isSuccess = true;
      }

      if (isSuccess && payload) {
        setRefinedData(payload);
        message.success('Zai is ready — review the suggestion');
      } else {
        message.error('Failed to refine content.');
      }
    } catch (err: any) {
      console.error('Zai refine error:', err);
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
    if (!content && type === 'original') {
      return <div style={{ color: 'var(--text-slate-400)', fontStyle: 'italic' }}>Empty / No content</div>;
    }
    if (!content) return null;

    if (typeof content === 'string') {
      const isHtml = /<[a-z][\s\S]*>/i.test(content);
      if (isHtml) {
        return (
          <div
            className={type === 'refined' ? 'zai-refined-text' : 'zai-original-text'}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }
      return (
        <div className={type === 'refined' ? 'zai-refined-text' : 'zai-original-text'} style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      );
    }

    const isObject = content && typeof content === 'object' && !Array.isArray(content);
    const hasOriginalObject = originalData && typeof originalData === 'object' && !Array.isArray(originalData);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isObject &&
          Object.entries(content).map(([key, value]) => {
            if (key === 'id') return null;

            if (type === 'refined' && hasOriginalObject) {
              const originalValue = (originalData as any)[key];
              const isChanged = JSON.stringify(originalValue) !== JSON.stringify(value);
              if (!isChanged) return null;
              return (
                <div key={key} className="zai-field-card zai-field-card--changed">
                  <div className="zai-field-card__head">
                    <span className="zai-field-card__label">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="zai-chip zai-chip--changed">Updated by Zai</span>
                  </div>
                  <div className="zai-field-card__value zai-field-card__value--refined">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="zai-field-card">
                <div className="zai-field-card__head">
                  <span className="zai-field-card__label">{key.replace(/([A-Z])/g, ' $1')}</span>
                </div>
                <div className="zai-field-card__value">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </div>
              </div>
            );
          })}

        {type === 'refined' &&
          isObject &&
          hasOriginalObject &&
          Object.keys(content).every(
            (k) => JSON.stringify((originalData as any)[k]) === JSON.stringify(content[k])
          ) && (
            <div style={{ textAlign: 'center', color: 'var(--text-slate-400)', padding: 20 }}>
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
        onClick={() => {
          setRefinedData(null);
          setInstruction('');
          setVisible(true);
        }}
        className="zai-trigger"
        style={style}
      >
        <span className="zai-trigger__icon">
          <Sparkles size={11} />
        </span>
        <span className="zai-trigger__text">{triggerLabel}</span>
      </Button>

      <Modal
        title={null}
        open={visible}
        onCancel={() => !loading && setVisible(false)}
        width={1000}
        footer={null}
        destroyOnHidden
        centered
        closable={false}
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 24, 0.55)' },
          content: { padding: 0, borderRadius: 22, overflow: 'hidden', background: 'transparent', boxShadow: '0 30px 80px rgba(8,12,24,0.45)' },
          body: { padding: 0 },
        }}
        wrapClassName="zai-modal-wrap"
      >
        <div className="zai-modal">
          {/* Hero */}
          <div className="zai-hero">
            <div className="zai-hero__bg" />
            <div className="zai-hero__content">
              <div className="zai-hero__brand">
                <div className="zai-orb">
                  <Sparkles size={20} />
                </div>
                <div className="zai-hero__title-wrap">
                  <div className="zai-hero__eyebrow">
                    <span className="zai-pill"><Zap size={10} strokeWidth={2.5} />ZAI · Smart Refinement</span>
                  </div>
                  <h2 className="zai-hero__title">
                    {isEmptyOriginal ? 'Create with' : 'Enhance with'} <span className="zai-grad">Zai</span>
                  </h2>
                  <p className="zai-hero__sub">
                    Tell Zai what to change. It rewrites your block in your voice — precise, persuasive, on-brand.
                  </p>
                </div>
              </div>
              <button className="zai-close" onClick={() => !loading && setVisible(false)} aria-label="Close">×</button>
            </div>
          </div>

          {/* Body */}
          <div className="zai-body">
            {/* Prompt bar */}
            <div className="zai-prompt">
              <div className="zai-prompt__label">
                <Wand2 size={14} />
                <span>Instruction</span>
              </div>
              <div className="zai-prompt__row">
                <Input.TextArea
                  rows={2}
                  placeholder='Tell Zai what to change… e.g. "Make it more persuasive and lead with ROI"'
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  disabled={loading}
                  className="zai-textarea"
                  bordered={false}
                />
                <Button
                  type="primary"
                  onClick={handleRefine}
                  loading={loading}
                  className="zai-cta"
                  icon={!loading ? <Sparkles size={14} /> : null}
                >
                  {loading ? 'Zai is thinking…' : isEmptyOriginal ? 'Create with Zai' : 'Enhance with Zai'}
                </Button>
              </div>

              <div className="zai-suggestions">
                <span className="zai-suggestions__label">Try:</span>
                {QUICK_SUGGESTIONS.map((s) => (
                  <Tag
                    key={s.label}
                    className={`zai-chip ${instruction === s.label ? 'zai-chip--active' : ''}`}
                    onClick={() => setInstruction(s.label)}
                  >
                    <span style={{ marginRight: 6 }}>{s.icon}</span>
                    {s.label}
                  </Tag>
                ))}
              </div>
            </div>

            {/* Comparison */}
            <div className="zai-compare">
              <div className="zai-pane">
                <div className="zai-pane__head">
                  <span className="zai-pane__dot zai-pane__dot--old" />
                  <Text className="zai-pane__title">Current</Text>
                </div>
                <div className="zai-pane__body zai-pane__body--old">
                  {renderPreview(originalData, 'original')}
                </div>
              </div>

              <div className="zai-arrow">
                <ArrowRight size={18} />
              </div>

              <div className="zai-pane zai-pane--new">
                <div className="zai-pane__head">
                  <span className={`zai-pane__dot ${refinedData ? 'zai-pane__dot--new' : 'zai-pane__dot--idle'}`} />
                  <Text className={`zai-pane__title ${refinedData ? 'zai-pane__title--new' : ''}`}>
                    {refinedData ? "Zai's Suggestion" : 'Awaiting Zai'}
                  </Text>
                  {refinedData && <span className="zai-pane__badge">Ready</span>}
                </div>
                <div className={`zai-pane__body ${refinedData ? 'zai-pane__body--new' : 'zai-pane__body--idle'}`}>
                  {loading ? (
                    <div className="zai-loading">
                      <div className="zai-loading__orb">
                        <Sparkles size={24} />
                      </div>
                      <div className="zai-loading__bars">
                        <span /><span /><span />
                      </div>
                      <Text className="zai-loading__text">Zai is composing your refinement…</Text>
                    </div>
                  ) : refinedData ? (
                    renderPreview(refinedData, 'refined')
                  ) : (
                    <div className="zai-empty">
                      <div className="zai-empty__orb">
                        <Sparkles size={22} />
                      </div>
                      <div className="zai-empty__title">Zai is standing by</div>
                      <div className="zai-empty__sub">Write an instruction above to begin.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="zai-footer">
              <div className="zai-footer__hint">
                {refinedData
                  ? 'Review the suggestion. Apply replaces the current content.'
                  : 'Powered by Zai — your AI co-writer.'}
              </div>
              <div className="zai-footer__actions">
                <Button onClick={() => !loading && setVisible(false)} className="zai-btn-ghost" disabled={loading}>
                  Cancel
                </Button>
                {refinedData && (
                  <Button
                    type="primary"
                    icon={<Check size={14} />}
                    onClick={handleApply}
                    className="zai-btn-apply"
                  >
                    Apply Zai's Suggestion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </>
  );
};
