import React from 'react';
import { useProposalStore } from '@/store/proposalStore';
import { BlockSettingsRenderer } from './blocks';
import { Typography, Empty, Divider, Upload, Button, message, Input, Tooltip } from 'antd';
import { 
  UploadOutlined, 
  UserOutlined, 
  BankOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  EnvironmentOutlined,
  RocketOutlined,
  EditOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export const BlockProperties = () => {
  const { blocks, selectedBlockId, updateBlock } = useProposalStore();
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const coverBlock = blocks.find((b) => b.type === 'cover');

  const handleUpdateBranding = (data: any) => {
    if (coverBlock) {
      updateBlock(coverBlock.id, data);
    }
  };

  return (
    <div className="no-scrollbar" style={{ padding: '16px', background: '#ffffff', height: '100%', borderLeft: '1px solid #e2e8f0', overflowY: 'auto' }}>
      {/* Premium Branding Section */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background accent */}
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: '#f1f5f9', borderRadius: '50%', opacity: 0.5, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <RocketOutlined />
            </div>
            <Text strong style={{ fontSize: '0.95rem', color: '#0f172a', letterSpacing: '-0.01em' }}>Branding & Identity</Text>
          </div>
          
          {/* Row 1: Logo and Company */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <Upload
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => handleUpdateBranding({ logoUrl: e.target?.result as string });
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Tooltip title="Click to update logo">
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '12px', 
                  border: '1.5px dashed #cbd5e1', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  background: '#fff',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff'; }}
                >
                  {coverBlock?.data?.logoUrl ? (
                    <img src={coverBlock.data.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <UploadOutlined style={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                    </div>
                  )}
                </div>
              </Tooltip>
            </Upload>
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Organization</Text>
              <Input 
                prefix={<BankOutlined style={{ color: '#cbd5e1', fontSize: '0.9rem' }} />}
                placeholder="Agency Name" 
                value={coverBlock?.data?.senderCompany} 
                onChange={(e) => handleUpdateBranding({ senderCompany: e.target.value })}
                variant="filled"
                style={{ borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>

          {/* Grid Layout for Personal Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <Text style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Point of Contact</Text>
              <Input 
                prefix={<UserOutlined style={{ color: '#cbd5e1', fontSize: '0.9rem' }} />}
                placeholder="Your Full Name" 
                value={coverBlock?.data?.senderName} 
                onChange={(e) => handleUpdateBranding({ senderName: e.target.value })}
                variant="filled"
                style={{ borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Text style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Phone</Text>
                <Input 
                  prefix={<PhoneOutlined style={{ color: '#cbd5e1', fontSize: '0.8rem' }} />}
                  placeholder="Contact No" 
                  value={coverBlock?.data?.senderContact} 
                  onChange={(e) => handleUpdateBranding({ senderContact: e.target.value })}
                  variant="filled"
                  style={{ borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }}
                />
              </div>
              <div>
                <Text style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Email</Text>
                <Input 
                  prefix={<MailOutlined style={{ color: '#cbd5e1', fontSize: '0.8rem' }} />}
                  placeholder="Mail" 
                  value={coverBlock?.data?.senderEmail} 
                  onChange={(e) => handleUpdateBranding({ senderEmail: e.target.value })}
                  variant="filled"
                  style={{ borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div>
              <Text style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Office Address</Text>
              <Input 
                prefix={<EnvironmentOutlined style={{ color: '#cbd5e1', fontSize: '0.9rem' }} />}
                placeholder="Business Address" 
                value={coverBlock?.data?.senderAddress} 
                onChange={(e) => handleUpdateBranding({ senderAddress: e.target.value })}
                variant="filled"
                style={{ borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '24px 0' }} />

      {!selectedBlock ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Empty description="Select a block to edit its properties" />
        </div>
      ) : (
        <>
          <Text strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a', marginBottom: '16px', textTransform: 'capitalize' }}>
            {selectedBlock.type} Settings
          </Text>
          <div style={{ paddingBottom: '24px' }}>
            <BlockSettingsRenderer 
              type={selectedBlock.type} 
              data={selectedBlock.data} 
              onUpdate={(data) => updateBlock(selectedBlock.id, data)} 
            />
          </div>
        </>
      )}
    </div>
  );
};
