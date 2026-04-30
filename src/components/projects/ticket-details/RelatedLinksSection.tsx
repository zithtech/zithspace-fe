"use client";

import React, { useState } from "react";
import { Card, Select, Space, Input, Button, List, Typography, message, Divider, Dropdown } from "antd";
import {
  PlusOutlined,
  BgColorsOutlined,
  FileTextOutlined,
  ApiOutlined,
  CodeOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined
} from "@ant-design/icons";
import { LinkType, RelatedLinkFormData } from "@/types/ticket";

const { Text, Paragraph } = Typography;

interface RelatedLinksSectionProps {
  relatedLinks: any[];
  isEditing: boolean;
  onAddLink: (linkType: LinkType, linkData: { title: string; description: string; url: string }) => Promise<void>;
  onUpdateLink: (linkId: string, linkData: { title: string; description: string; url: string }) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
  isAddingLink: boolean;
  isUpdatingLink: boolean;
  isDeletingLink: boolean;
}

export default function RelatedLinksSection({
  relatedLinks,
  isEditing,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  isAddingLink,
  isUpdatingLink,
  isDeletingLink,
}: RelatedLinksSectionProps) {
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType | null>(null);
  const [linkFormData, setLinkFormData] = useState<RelatedLinkFormData>({
    description: "",
    url: "",
  });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const handleSaveLink = async () => {
    if (!linkFormData.description.trim() || !linkFormData.url.trim()) {
      message.error("Please fill in all fields");
      return;
    }

    try {
      if (editingLinkId) {
        await onUpdateLink(editingLinkId, {
          title: linkFormData.description.trim().substring(0, 100),
          description: linkFormData.description.trim(),
          url: linkFormData.url.trim(),
        });
        message.success("Link updated successfully");
      } else {
        await onAddLink(selectedLinkType!, {
          title: linkFormData.description.trim().substring(0, 100),
          description: linkFormData.description.trim(),
          url: linkFormData.url.trim(),
        });
        message.success("Link added successfully");
      }

      // Reset form
      setShowAddLinkForm(false);
      setSelectedLinkType(null);
      setLinkFormData({ description: "", url: "" });
      setEditingLinkId(null);
    } catch (error) {
      console.error("Failed to save link:", error);
      message.error("Failed to save link");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await onDeleteLink(linkId);
      message.success("Link deleted successfully");
    } catch (error) {
      console.error("Failed to delete link:", error);
      message.error("Failed to delete link");
    }
  };

  const getLinkIcon = (type: string) => {
    const style = { fontSize: "14px" };
    switch (type) {
      case "ui_design":
        return <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1677ff' }}><BgColorsOutlined style={style} /></div>;
      case "scope_doc":
        return <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52c41a' }}><FileTextOutlined style={style} /></div>;
      case "sample_response":
        return <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fa8c16' }}><ApiOutlined style={style} /></div>;
      case "dev_doc":
        return <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#722ed1' }}><CodeOutlined style={style} /></div>;
      default:
        return <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c' }}><FileTextOutlined style={style} /></div>;
    }
  };

  const getLinkTypeLabel = (type: LinkType) => {
    switch (type) {
      case "ui_design": return "UI Design";
      case "scope_doc": return "Scope Doc";
      case "sample_response": return "Sample Response";
      case "dev_doc": return "Dev Doc";
      default: return "Link";
    }
  };

  const menuItems = [
    { key: "ui_design", label: "UI Design", icon: <BgColorsOutlined /> },
    { key: "scope_doc", label: "Scope Doc", icon: <FileTextOutlined /> },
    { key: "sample_response", label: "Sample Response", icon: <ApiOutlined /> },
    { key: "dev_doc", label: "Dev Doc", icon: <CodeOutlined /> },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Typography.Title level={5} style={{ fontSize: 13, margin: 0, color: '#595959' }}>
          Related Resources
          <span style={{ fontSize: 12, color: '#bfbfbf', fontWeight: 400, marginLeft: 6 }}>• {relatedLinks.length} items</span>
        </Typography.Title>
        {!isEditing && (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => {
                setSelectedLinkType(key as LinkType);
                setShowAddLinkForm(true);
                setLinkFormData({ description: "", url: "" });
                setEditingLinkId(null);
              }
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button 
              type="text" 
              size="small" 
              style={{ 
                height: 28, 
                borderRadius: 6, 
                color: '#1890ff', 
                fontWeight: 600, 
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 8px'
              }}
              icon={<PlusOutlined style={{ fontSize: 13 }} />}
            >
              Resource <DownOutlined style={{ fontSize: 10, marginTop: 1 }} />
            </Button>
          </Dropdown>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Add Link Form (at top ONLY for new links, editing handled inline) */}
        {showAddLinkForm && selectedLinkType && !editingLinkId && (
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid #1890ff', 
            borderRadius: 12, 
            padding: 16,
            boxShadow: '0 4px 12px rgba(24, 144, 255, 0.08)',
            marginBottom: 4
          }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {getLinkIcon(selectedLinkType)}
              <Text strong style={{ fontSize: 13, color: '#262626' }}>
                Add {getLinkTypeLabel(selectedLinkType)}
              </Text>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>DESCRIPTION</Text>
                <Input
                  placeholder="e.g. Figma Design Link for Auth Flow"
                  value={linkFormData.description}
                  onChange={(e) => setLinkFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{ borderRadius: 6 }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>LINK URL</Text>
                <Input
                  placeholder="https://..."
                  value={linkFormData.url}
                  onChange={(e) => setLinkFormData((prev) => ({ ...prev, url: e.target.value }))}
                  style={{ borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <Button
                  size="small"
                  type="text"
                  onClick={() => {
                    setShowAddLinkForm(false);
                    setSelectedLinkType(null);
                    setLinkFormData({ description: "", url: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="small"
                  style={{ borderRadius: 6, padding: '0 16px', fontWeight: 600 }}
                  loading={isAddingLink}
                  onClick={handleSaveLink}
                >
                  Add Resource
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Display existing links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {relatedLinks.length === 0 && !showAddLinkForm ? (
            <div style={{ 
              padding: '24px 0', 
              textAlign: 'center', 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: 8, 
              border: '1px dashed var(--border-color)' 
            }}>
               <Text type="secondary" style={{ fontSize: 13 }}>No related links added</Text>
            </div>
          ) : (
            relatedLinks.map((link) => {
              const isEditingThis = editingLinkId === link.id;

              return (
                <div key={link.id} className={`link-card ${isEditingThis ? 'editing' : ''}`} style={{ 
                  display: 'flex', 
                  flexDirection: isEditingThis ? 'column' : 'row',
                  alignItems: isEditingThis ? 'stretch' : 'center', 
                  gap: 12, 
                  padding: isEditingThis ? '16px' : '10px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: isEditingThis ? '1px solid #1890ff' : '1px solid var(--border-color)',
                  borderRadius: 12,
                  position: 'relative',
                  transition: 'all 0.2s',
                  boxShadow: isEditingThis ? '0 4px 12px rgba(24, 144, 255, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {isEditingThis ? (
                    <>
                      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {getLinkIcon(link.type)}
                        <Text strong style={{ fontSize: 13 }}>Edit {getLinkTypeLabel(link.type as any)}</Text>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <Text type="secondary" style={{ fontSize: 10, marginBottom: 2, display: 'block' }}>DESCRIPTION</Text>
                          <Input
                            placeholder="Description"
                            variant="filled"
                            value={linkFormData.description}
                            onChange={(e) => setLinkFormData((prev) => ({ ...prev, description: e.target.value }))}
                            style={{ borderRadius: 6, fontSize: 12 }}
                          />
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 10, marginBottom: 2, display: 'block' }}>URL</Text>
                          <Input
                            placeholder="URL"
                            variant="filled"
                            value={linkFormData.url}
                            onChange={(e) => setLinkFormData((prev) => ({ ...prev, url: e.target.value }))}
                            style={{ borderRadius: 6, fontSize: 12 }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                          <Button size="small" type="text" onClick={() => setEditingLinkId(null)}>Cancel</Button>
                          <Button
                            type="primary"
                            size="small"
                            style={{ borderRadius: 6, padding: '0 16px', fontWeight: 600 }}
                            loading={isUpdatingLink}
                            onClick={handleSaveLink}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flexShrink: 0 }}>
                        {getLinkIcon(link.type)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 1 }}>
                          {getLinkTypeLabel(link.type)}
                        </Text>
                        
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-title"
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 13, color: '#1890ff', lineHeight: 1.4 }}
                        >
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {link.description || link.title || "Untitled Link"}
                          </span>
                          <ExportOutlined style={{ fontSize: 11, color: '#bfbfbf', flexShrink: 0 }} />
                        </a>
                        
                        <Text type="secondary" style={{ fontSize: 11, color: '#8c8c8c', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 1 }}>
                          {link.url}
                        </Text>
                      </div>

                      <div className="link-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />}
                          onClick={() => {
                            setEditingLinkId(link.id || "");
                            setLinkFormData({
                              description: link.description,
                              url: link.url,
                            });
                          }}
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                          loading={isDeletingLink}
                          onClick={() => handleDeleteLink(link.id || "")}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx global>{`
        .link-card:not(.editing):hover {
          border-color: #1890ff40 !important;
          background-color: var(--bg-secondary) !important;
          filter: brightness(0.98);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          transform: translateY(-1px);
        }
        .link-card:hover .link-actions {
          opacity: 1 !important;
        }
        .link-title:hover {
          color: #1890ff !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
