import React from 'react';
import { useProposalStore } from '@/store/proposalStore';
import { BlockSettingsRenderer } from './blocks';
import { Typography, Empty, Divider, Upload, Input, Tooltip } from 'antd';
import {
  UploadOutlined,
  RocketOutlined,
  EditOutlined
} from '@ant-design/icons';
import { AIEnhanceButton } from './AIEnhanceButton';

const { Text } = Typography;

export const BlockProperties = () => {
  const { blocks, selectedBlockId, updateBlock, setSelectedBlockId } = useProposalStore();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const otherBlocks = blocks.filter((b) => b.id !== selectedBlockId);
  const coverBlock = blocks.find((b) => b.type === 'cover');

  const handleUpdateBranding = (data: any) => {
    if (coverBlock) {
      updateBlock(coverBlock.id, data);
    }
  };

  return (
    <div className="no-scrollbar" style={{ padding: '20px', background: 'var(--bg-secondary)', height: '100%', borderLeft: '1px solid var(--border-color)', overflowY: 'auto' }}>
      {/* 1. Selected Block Settings (if any) */}
      {selectedBlock && (
        <div
          key={selectedBlock.id}
          style={{
            marginBottom: '32px',
            padding: '20px',
            border: '2px solid var(--premium-blue)',
            borderRadius: '16px',
            background: 'var(--bg-blue-50)',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <EditOutlined style={{ color: 'var(--premium-blue)' }} />
            <Text strong style={{ fontSize: '1rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {selectedBlock.type} Settings (Active)
            </Text>
          </div>
          <div style={{ paddingLeft: '4px' }}>
            <BlockSettingsRenderer
              type={selectedBlock.type}
              data={selectedBlock.data}
              onUpdate={(data) => updateBlock(selectedBlock.id, data)}
            />
          </div>
          <Divider />
        </div>
      )}

      {/* 2. Global Branding Section */}
      <div style={{
        marginBottom: '24px',
        padding: '20px',
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RocketOutlined style={{ color: 'var(--premium-blue)' }} />
            <Text strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Branding & Identity</Text>
          </div>
          <AIEnhanceButton
            originalData={{
              company: coverBlock?.data?.senderCompany,
              name: coverBlock?.data?.senderName,
              contact: coverBlock?.data?.senderContact,
              email: coverBlock?.data?.senderEmail
            }}
            blockType="branding (agency details)"
            onApply={(newBrand) => handleUpdateBranding({
              senderCompany: newBrand.company || coverBlock?.data?.senderCompany,
              senderName: newBrand.name || coverBlock?.data?.senderName,
              senderContact: newBrand.contact || coverBlock?.data?.senderContact,
              senderEmail: newBrand.email || coverBlock?.data?.senderEmail
            })}
          />
        </div>

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
            <div style={{ width: '56px', height: '56px', borderRadius: '8px', border: '1.5px dashed var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
              {coverBlock?.data?.logoUrl ? (
                <img src={coverBlock.data.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <UploadOutlined style={{ color: '#94a3b8' }} />
              )}
            </div>
          </Upload>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>ORGANIZATION</Text>
            <Input
              placeholder="Agency Name"
              value={coverBlock?.data?.senderCompany}
              onChange={(e) => handleUpdateBranding({ senderCompany: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <Text style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>POINT OF CONTACT</Text>
            <Input
              placeholder="Name"
              value={coverBlock?.data?.senderName}
              onChange={(e) => handleUpdateBranding({ senderName: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input placeholder="Phone" value={coverBlock?.data?.senderContact} onChange={(e) => handleUpdateBranding({ senderContact: e.target.value })} />
            <Input placeholder="Email" value={coverBlock?.data?.senderEmail} onChange={(e) => handleUpdateBranding({ senderEmail: e.target.value })} />
          </div>
        </div>
      </div>

      {/* 3. All Other Blocks */}
      {otherBlocks.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '32px 0 16px' }}>
            <Text type="secondary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>OTHER SECTIONS</Text>
          </Divider>
          {otherBlocks.map((block) => (
            <div
              key={block.id}
              style={{ marginBottom: '24px', cursor: 'pointer' }}
              onClick={() => setSelectedBlockId(block.id)}
            >
              <Text strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'capitalize' }}>
                {block.type} Settings
              </Text>
              <div style={{ paddingLeft: '8px', opacity: 0.8 }}>
                <BlockSettingsRenderer
                  type={block.type}
                  data={block.data}
                  onUpdate={(data) => updateBlock(block.id, data)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {blocks.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Empty description="Add blocks to start editing" />
        </div>
      )}
    </div>
  );
};
