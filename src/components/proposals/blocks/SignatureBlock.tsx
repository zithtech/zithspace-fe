import React from 'react';
import { Typography, Row, Col, Form, Input, Divider, Button } from 'antd';
import {
  SafetyCertificateOutlined,
  FileProtectOutlined,
  UserOutlined,
  BankOutlined,
  EditOutlined,
} from '@ant-design/icons';
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import { AIEnhanceButton } from '../AIEnhanceButton';
import { BlockGhostHint, BlockGhostLine } from './BlockGhost';

const { Title, Text } = Typography;

interface SignatureBlockProps {
  data: any;
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ data }) => {
  const isEmpty = !data.title && !data.ipClause && !data.revisionClause && !data.terminationClause && !data.ndaClause && !data.companyName && !data.clientName;

  const clauses: { key: string; title: string; value: string }[] = [
    { key: 'ipClause', title: 'Intellectual Property (IP)', value: data.ipClause },
    { key: 'revisionClause', title: 'Revision Policy', value: data.revisionClause },
    { key: 'terminationClause', title: 'Termination Clause', value: data.terminationClause },
    { key: 'ndaClause', title: 'Confidentiality Agreement', value: data.ndaClause },
  ];

  return (
    <div style={{ padding: '40px', pageBreakInside: 'avoid' }}>
      {isEmpty && <BlockGhostHint />}

      <Title
        level={2}
        style={{
          marginBottom: '40px',
          color: data.title ? 'var(--text-primary)' : 'var(--text-slate-400)',
          fontStyle: data.title ? 'normal' : 'italic',
        }}
      >
        {data.title || 'Terms & Conditions'}
      </Title>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', marginBottom: '48px', color: 'var(--text-secondary)' }}>
        {clauses.map((c) => (
          <div key={c.key}>
            <Text strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>
              {c.title}
            </Text>
            {c.value ? (
              <div style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                <TiptapViewer content={c.value} />
              </div>
            ) : (
              <div>
                <BlockGhostLine width="92%" />
                <BlockGhostLine width="84%" />
                <BlockGhostLine width="60%" />
              </div>
            )}
          </div>
        ))}
      </div>

      <Divider style={{ borderColor: 'var(--border-color)', marginBottom: '48px' }} />

      <Row gutter={[64, 48]}>
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text strong style={{ fontSize: '1.1rem', color: data.companyName ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.companyName ? 'normal' : 'italic' }}>
              For: {data.companyName || 'Your Company'}
            </Text>
            <div style={{ height: '80px', borderBottom: '2px solid var(--border-color)', marginTop: '20px' }}></div>
            <Text style={{ marginTop: '8px', color: 'var(--text-secondary)', fontStyle: data.companySigner ? 'normal' : 'italic' }}>
              {data.companySigner || 'Authorized Signer'}
            </Text>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Date</Text>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text strong style={{ fontSize: '1.1rem', color: data.clientName ? 'var(--text-primary)' : 'var(--text-slate-400)', fontStyle: data.clientName ? 'normal' : 'italic' }}>
              For: {data.clientName || 'Client Name'}
            </Text>
            <div style={{ height: '80px', borderBottom: '2px solid var(--border-color)', marginTop: '20px' }}></div>
            <Text style={{ marginTop: '8px', color: 'var(--text-secondary)', fontStyle: data.clientSigner ? 'normal' : 'italic' }}>
              {data.clientSigner || 'Authorized Signer'}
            </Text>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Date</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export const SignatureBlockSettings: React.FC<{ data: any, onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  const handleUpdate = (changed: any) => {
    onUpdate({ ...data, ...changed });
  };

  return (
    <Form layout="vertical">
      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <SafetyCertificateOutlined style={{ color: 'var(--premium-blue)' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Agreement Definition</Text>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Form.Item 
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={labelStyle}>Section Title</span>
                <AIEnhanceButton 
                  originalData={data.title} 
                  blockType="signature (title)" 
                  onApply={(newTitle) => handleUpdate({ title: newTitle })} 
                />
              </div>
            } 
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<EditOutlined style={{ color: 'var(--border-color)' }} />}
              placeholder="e.g. Agreement & Sign-off"
              variant="filled"
              style={inputStyle}
              value={data.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
            />
          </Form.Item>
        </div>
      </div>

      {/* Legal Clauses Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileProtectOutlined style={{ color: '#6366f1' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Legal Clauses</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={labelStyle}>Intellectual Property (IP)</span>
              <AIEnhanceButton 
                originalData={data.ipClause} 
                blockType="legal (IP clause)" 
                onApply={(newText) => handleUpdate({ ipClause: newText })} 
              />
            </div>
            <TiptapEditor content={data.ipClause || ''} onChange={(html) => handleUpdate({ ipClause: html })} minHeight={100} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={labelStyle}>Revision Policy</span>
              <AIEnhanceButton 
                originalData={data.revisionClause} 
                blockType="legal (Revision Policy)" 
                onApply={(newText) => handleUpdate({ revisionClause: newText })} 
              />
            </div>
            <TiptapEditor content={data.revisionClause || ''} onChange={(html) => handleUpdate({ revisionClause: html })} minHeight={100} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={labelStyle}>Termination Clause</span>
              <AIEnhanceButton 
                originalData={data.terminationClause} 
                blockType="legal (Termination Clause)" 
                onApply={(newText) => handleUpdate({ terminationClause: newText })} 
              />
            </div>
            <TiptapEditor content={data.terminationClause || ''} onChange={(html) => handleUpdate({ terminationClause: html })} minHeight={100} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={labelStyle}>Confidentiality / NDA</span>
              <AIEnhanceButton 
                originalData={data.ndaClause} 
                blockType="legal (NDA clause)" 
                onApply={(newText) => handleUpdate({ ndaClause: newText })} 
              />
            </div>
            <TiptapEditor content={data.ndaClause || ''} onChange={(html) => handleUpdate({ ndaClause: html })} minHeight={100} />
          </div>
        </div>
      </div>

      {/* Formal Sign-Off Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <UserOutlined style={{ color: '#10b981' }} />
          <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Formal Sign-Off</Text>
        </div>

        {/* Your Details */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
              <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Organization</Text>
            </div>
            <AIEnhanceButton 
              originalData={{ 
                companyName: data.companyName, 
                signerTitle: data.companySigner 
              }} 
              blockType="signature (company details)" 
              onApply={(val) => {
                handleUpdate({ 
                  companyName: val.companyName || data.companyName, 
                  companySigner: val.signerTitle || data.companySigner 
                });
              }} 
            />
          </div>
          <Form.Item label={<span style={labelStyle}>Company Name</span>} style={{ marginBottom: 12 }}>
            <Input
              prefix={<BankOutlined style={{ color: '#cbd5e1' }} />}
              variant="filled"
              style={inputStyle}
              value={data.companyName}
              onChange={(e) => handleUpdate({ companyName: e.target.value })}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Signer Name / Title</span>} style={{ marginBottom: 0 }}>
            <Input
              prefix={<UserOutlined style={{ color: '#cbd5e1' }} />}
              variant="filled"
              style={inputStyle}
              value={data.companySigner}
              onChange={(e) => handleUpdate({ companySigner: e.target.value })}
            />
          </Form.Item>
        </div>

        {/* Client Details */}
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--box-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Client Approval</Text>
            </div>
            <AIEnhanceButton 
              originalData={{ 
                clientName: data.clientName, 
                signerTitle: data.clientSigner 
              }} 
              blockType="signature (client details)" 
              onApply={(val) => {
                handleUpdate({ 
                  clientName: val.clientName || data.clientName, 
                  clientSigner: val.signerTitle || data.clientSigner 
                });
              }} 
            />
          </div>
          <Form.Item label={<span style={labelStyle}>Client Name</span>} style={{ marginBottom: 12 }}>
            <Input
              prefix={<BankOutlined style={{ color: '#cbd5e1' }} />}
              variant="filled"
              style={inputStyle}
              value={data.clientName}
              onChange={(e) => handleUpdate({ clientName: e.target.value })}
            />
          </Form.Item>
          <Form.Item label={<span style={labelStyle}>Client Signer Name / Title</span>} style={{ marginBottom: 0 }}>
            <Input
              prefix={<UserOutlined style={{ color: '#cbd5e1' }} />}
              variant="filled"
              style={inputStyle}
              value={data.clientSigner}
              onChange={(e) => handleUpdate({ clientSigner: e.target.value })}
            />
          </Form.Item>
        </div>
      </div>
    </Form>
  );
};
