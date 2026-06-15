import React from 'react';
import { Typography, Row, Col, Form, Input, DatePicker } from 'antd';
import {
  UserOutlined,
  BankOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AIEnhanceButton } from '../AIEnhanceButton';
import { BlockGhostHint } from './BlockGhost';

const { Title, Text } = Typography;

interface SignatureBlockProps {
  data: any;
}

const fmtDate = (d?: string) => (d ? dayjs(d).format('MMM D, YYYY') : '');

// Cursive signature styles (loaded via Google Fonts in app/layout.tsx).
export const SIGNATURE_FONTS = [
  { id: 'dancing', label: 'Flowing', family: "'Dancing Script', cursive" },
  { id: 'greatvibes', label: 'Elegant', family: "'Great Vibes', cursive" },
  { id: 'allura', label: 'Classic', family: "'Allura', cursive" },
  { id: 'sacramento', label: 'Casual', family: "'Sacramento', cursive" },
  { id: 'dafoe', label: 'Bold', family: "'Mr Dafoe', cursive" },
  { id: 'alexbrush', label: 'Artistic', family: "'Alex Brush', cursive" },
  { id: 'pinyon', label: 'Calligraphy', family: "'Pinyon Script', cursive" },
  { id: 'parisienne', label: 'Chic', family: "'Parisienne', cursive" },
  { id: 'delafield', label: 'Delicate', family: "'Mrs Saint Delafield', cursive" },
  { id: 'doulaise', label: 'Formal', family: "'Monsieur La Doulaise', cursive" },
];
export const sigFamily = (id?: string) =>
  SIGNATURE_FONTS.find((f) => f.id === id)?.family || SIGNATURE_FONTS[0].family;

const SignatureColumn: React.FC<{
  forName?: string;
  forPlaceholder: string;
  signer?: string;
  place?: string;
  date?: string;
  signature?: string;
  signatureFont?: string;
}> = ({ forName, forPlaceholder, signer, place, date, signature, signatureFont }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <Text
      strong
      style={{
        fontSize: '1.05rem',
        color: forName ? 'var(--text-primary)' : 'var(--text-slate-400)',
        fontStyle: forName ? 'normal' : 'italic',
      }}
    >
      For: {forName || forPlaceholder}
    </Text>

    {/* signing space — holds the cursive signature, sitting just above the line */}
    <div style={{ height: '78px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      {signature ? (
        <span
          style={{
            fontFamily: sigFamily(signatureFont),
            fontSize: '2.6rem',
            lineHeight: 1,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          {signature}
        </span>
      ) : null}
    </div>

    {/* signature line */}
    <div style={{ borderBottom: '1.5px solid var(--border-color)' }} />

    <Text
      style={{
        marginTop: '10px',
        color: 'var(--text-secondary)',
        fontStyle: signer ? 'normal' : 'italic',
        fontSize: '0.95rem',
      }}
    >
      {signer || 'Authorized Signer'}
    </Text>

    <Text style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
      {date ? `Date: ${fmtDate(date)}` : 'Date'}
    </Text>

    {place && (
      <Text style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
        Place: {place}
      </Text>
    )}
  </div>
);

const SignatureFontPicker: React.FC<{ value?: string; onChange: (id: string) => void; sample?: string }> = ({ value, onChange, sample }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {SIGNATURE_FONTS.map((f) => {
      const active = (value || SIGNATURE_FONTS[0].id) === f.id;
      return (
        <button
          key={f.id}
          type="button"
          title={f.label}
          onClick={() => onChange(f.id)}
          style={{
            border: `1px solid ${active ? '#2563eb' : 'var(--border-color)'}`,
            background: active ? 'rgba(37,99,235,0.06)' : 'var(--bg-secondary)',
            padding: '5px 13px',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: f.family,
            fontSize: '1.35rem',
            lineHeight: 1.15,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sample || f.label}
        </button>
      );
    })}
  </div>
);

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ data }) => {
  const isEmpty = !data.companyName && !data.clientName && !data.companySigner && !data.clientSigner;

  return (
    <div style={{ padding: '16px 24px', pageBreakInside: 'avoid' }}>
      {isEmpty && <BlockGhostHint />}

      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--premium-blue)',
          marginBottom: '6px',
        }}
      >
        Acceptance
      </div>
      <Title
        level={2}
        style={{
          marginTop: 0,
          marginBottom: '36px',
          color: data.title ? 'var(--text-primary)' : 'var(--text-slate-400)',
          fontStyle: data.title ? 'normal' : 'italic',
        }}
      >
        {data.title || 'Acceptance & Signatures'}
      </Title>

      <Row gutter={[64, 48]}>
        <Col xs={24} md={12}>
          <SignatureColumn
            forName={data.companyName}
            forPlaceholder="Your Company"
            signer={data.companySigner}
            place={data.place}
            date={data.date}
            signature={data.companySignature}
            signatureFont={data.companySignatureFont}
          />
        </Col>
        <Col xs={24} md={12}>
          <SignatureColumn
            forName={data.clientName}
            forPlaceholder="Client Name"
            signer={data.clientSigner}
            place={data.place}
            date={data.date}
            signature={data.clientSignature}
            signatureFont={data.clientSignatureFont}
          />
        </Col>
      </Row>
    </div>
  );
};

export const SignatureBlockSettings: React.FC<{ data: any; onUpdate: (data: any) => void }> = ({ data, onUpdate }) => {
  const labelStyle: React.CSSProperties = { fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '6px', display: 'block' };
  const inputStyle: React.CSSProperties = { borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };

  const handleUpdate = (changed: any) => onUpdate({ ...data, ...changed });

  const cardStyle: React.CSSProperties = { padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' };
  const sectionHead = (icon: React.ReactNode, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      {icon}
      <Text strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</Text>
    </div>
  );

  return (
    <Form layout="vertical">
      {/* Heading */}
      <div style={cardStyle}>
        {sectionHead(<SafetyCertificateOutlined style={{ color: 'var(--premium-blue)' }} />, 'Signature Heading')}
        <Form.Item
          label={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ ...labelStyle, flex: 1 }}>Section Title</span>
              <AIEnhanceButton originalData={data.title} blockType="signature (title)" onApply={(t) => handleUpdate({ title: t })} />
            </div>
          }
          style={{ marginBottom: 0 }}
        >
          <Input prefix={<EditOutlined style={{ color: 'var(--border-color)' }} />} placeholder="e.g. Acceptance & Signatures" variant="filled" style={inputStyle} value={data.title} onChange={(e) => handleUpdate({ title: e.target.value })} />
        </Form.Item>
      </div>

      {/* Signing details — place + date */}
      <div style={cardStyle}>
        {sectionHead(<EnvironmentOutlined style={{ color: '#059669' }} />, 'Signing Details')}
        <Form.Item label={<span style={labelStyle}>Signature Place</span>} style={{ marginBottom: 12 }}>
          <Input prefix={<EnvironmentOutlined style={{ color: '#cbd5e1' }} />} placeholder="e.g. San Francisco, CA" variant="filled" style={inputStyle} value={data.place} onChange={(e) => handleUpdate({ place: e.target.value })} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Date</span>} style={{ marginBottom: 0 }}>
          <DatePicker
            suffixIcon={<CalendarOutlined style={{ color: '#cbd5e1' }} />}
            variant="filled"
            style={{ ...inputStyle, width: '100%' }}
            format="MMM D, YYYY"
            value={data.date ? dayjs(data.date) : null}
            onChange={(d) => handleUpdate({ date: d ? d.format('YYYY-MM-DD') : '' })}
          />
        </Form.Item>
      </div>

      {/* Your organization */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Organization</Text>
          </div>
          <AIEnhanceButton
            originalData={{ companyName: data.companyName, signerTitle: data.companySigner }}
            blockType="signature (company details)"
            onApply={(val) => handleUpdate({ companyName: val.companyName || data.companyName, companySigner: val.signerTitle || data.companySigner })}
          />
        </div>
        <Form.Item label={<span style={labelStyle}>For (Company Name)</span>} style={{ marginBottom: 12 }}>
          <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} placeholder="Your Company LLC" variant="filled" style={inputStyle} value={data.companyName} onChange={(e) => handleUpdate({ companyName: e.target.value })} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Authorized Signer</span>} style={{ marginBottom: 12 }}>
          <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} placeholder="Name / Title" variant="filled" style={inputStyle} value={data.companySigner} onChange={(e) => handleUpdate({ companySigner: e.target.value })} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Signature (full name)</span>} style={{ marginBottom: 10 }}>
          <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="Type full name to sign" variant="filled" style={inputStyle} value={data.companySignature} onChange={(e) => handleUpdate({ companySignature: e.target.value })} />
        </Form.Item>
        <div>
          <span style={labelStyle}>Signature Style</span>
          <SignatureFontPicker value={data.companySignatureFont} onChange={(id) => handleUpdate({ companySignatureFont: id })} sample={data.companySignature || 'Signature'} />
        </div>
      </div>

      {/* Client */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <Text strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Client Approval</Text>
          </div>
          <AIEnhanceButton
            originalData={{ clientName: data.clientName, signerTitle: data.clientSigner }}
            blockType="signature (client details)"
            onApply={(val) => handleUpdate({ clientName: val.clientName || data.clientName, clientSigner: val.signerTitle || data.clientSigner })}
          />
        </div>
        <Form.Item label={<span style={labelStyle}>For (Client Name)</span>} style={{ marginBottom: 12 }}>
          <Input prefix={<BankOutlined style={{ color: '#cbd5e1' }} />} placeholder="Client Company" variant="filled" style={inputStyle} value={data.clientName} onChange={(e) => handleUpdate({ clientName: e.target.value })} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Authorized Signer</span>} style={{ marginBottom: 12 }}>
          <Input prefix={<UserOutlined style={{ color: '#cbd5e1' }} />} placeholder="Name / Title" variant="filled" style={inputStyle} value={data.clientSigner} onChange={(e) => handleUpdate({ clientSigner: e.target.value })} />
        </Form.Item>
        <Form.Item label={<span style={labelStyle}>Signature (full name)</span>} style={{ marginBottom: 10 }}>
          <Input prefix={<EditOutlined style={{ color: '#cbd5e1' }} />} placeholder="Type full name to sign" variant="filled" style={inputStyle} value={data.clientSignature} onChange={(e) => handleUpdate({ clientSignature: e.target.value })} />
        </Form.Item>
        <div>
          <span style={labelStyle}>Signature Style</span>
          <SignatureFontPicker value={data.clientSignatureFont} onChange={(id) => handleUpdate({ clientSignatureFont: id })} sample={data.clientSignature || 'Signature'} />
        </div>
      </div>
    </Form>
  );
};
