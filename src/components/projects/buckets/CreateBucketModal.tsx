"use client";
import React, { useEffect } from "react";

import {
  Modal,
  Form,
  Input,
  Select,
  ColorPicker,
  Typography,
  Switch,
  Divider,
  Row,
  Col,
  Space,
  App,
} from "antd";
import {
  FolderOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BgColorsOutlined,
  TeamOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useUserProjects } from "@/hooks/useGlobalData";
import { useCreateBucket, useUpdateBucket } from "@/hooks/useBuckets";
import type { Bucket } from "@/services/bucketService";
import type { Color } from "antd/es/color-picker";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateBucketModalProps {
  open: boolean;
  bucket?: Bucket | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBucketModal({
  open,
  bucket,
  onClose,
  onSuccess,
}: CreateBucketModalProps) {
  const { notification: notifyApi } = App.useApp();
  const [form] = Form.useForm();
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();

  const createBucket = useCreateBucket();
  const updateBucket = useUpdateBucket();

  const isEditing = !!bucket;

  // Reset form when modal opens/closes or bucket changes
  useEffect(() => {
    if (open && bucket) {
      form.setFieldsValue({
        name: bucket.name,
        description: bucket.description,
        projectId: typeof bucket.project === "string" ? bucket.project : bucket.project?.id,
        color: bucket.color || "#6366f1",
        isShared: bucket.isShared ?? true,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ color: "#6366f1", isShared: true });
    }
  }, [open, bucket, form]);

  const showTinyToast = (
    kind: 'success' | 'error',
    label: string
  ) => {
    const palette =
      kind === 'success'
        ? { dot: '#10b981', icon: '✓' }
        : { dot: '#ef4444', icon: '!' };

    notifyApi.open({
      key: 'bucket-save-toast',
      placement: 'top',
      duration: 3,
      className: 'tiny-toast',
      message: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: palette.dot,
              color: '#fff',
              fontSize: 10,
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {palette.icon}
          </span>
          {label}
        </span>
      ),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Handle color picker value
      const colorValue = typeof values.color === 'string'
        ? values.color
        : values.color?.toHexString?.() || "#1890ff";

      const data = {
        name: values.name,
        description: values.description || "",
        projectId: values.projectId,
        color: colorValue,
        isShared: values.isShared ?? true,
      };

      if (isEditing && bucket) {
        await updateBucket.mutateAsync({ id: bucket.id, data });
        showTinyToast('success', "Hub parameters updated successfully");
      } else {
        await createBucket.mutateAsync(data);
        showTinyToast('success', "New task repository initialized");
      }

      onSuccess();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      console.error("Failed to save bucket:", error);
      showTinyToast('error', error.message || "Failed to save hub");
    }
  };

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="cbm-header-icon">
              <FolderOutlined style={{ fontSize: 20, color: '#7c3aed' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}>
                {isEditing ? "Configure Bucket" : "create New Bucket"}
              </Title>
              <Text style={{ fontSize: 13, color: 'var(--text-slate-600)', fontWeight: 500 }}>
                {isEditing
                  ? "Update repository parameters and visibility settings"
                  : "Initialize a new task repository for specialized tracking"}
              </Text>
            </div>
          </div>
        }
        open={open}
        onCancel={onClose}
        onOk={handleSubmit}
        okText={isEditing ? "Save Changes" : "Initialize Bucket"}
        cancelText="Discard"
        width={540}
        centered
        className="premium-modal"
        okButtonProps={{
          style: {
            height: 40,
            padding: '0 24px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            border: 'none',
            borderRadius: 6
          }
        }}
        cancelButtonProps={{
          style: {
            height: 40,
            fontWeight: 600,
            borderRadius: 6
          }
        }}
        confirmLoading={createBucket.isPending || updateBucket.isPending}
        maskClosable={false}
      >
        <Divider style={{ margin: '16px 0 24px', opacity: 0.6 }} />
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ color: "#1890ff" }}
        >
          <Form.Item
            label={<Text strong style={{ fontSize: 13, color: 'var(--text-slate-600)' }}>REPOSITORY IDENTIFIER</Text>}
            name="name"
            rules={[
              { required: true, message: "Bucket name is required" },
              { max: 100, message: "Name must be less than 100 characters" },
            ]}
          >
            <Input
              prefix={<FolderOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
              placeholder="e.g. Technical Backlog v2"
              style={{ height: 42, borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            label={<Text strong style={{ fontSize: 13, color: 'var(--text-slate-600)' }}>SCOPE DEFINITION</Text>}
            name="projectId"
            rules={[{ required: true, message: "Project context is required" }]}
          >
            <Select
              placeholder="Select operational project"
              style={{ width: '100%' }}
              suffixIcon={<ProjectOutlined style={{ color: '#94a3b8' }} />}
              loading={projectsLoading}
              options={projects}
              showSearch
              filterOption={(input, option) =>
                (option?.label?.toString() || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label={<Text strong style={{ fontSize: 13, color: 'var(--text-slate-600)' }}>CONTEXTUAL DESCRIPTION</Text>}
            name="description"
            rules={[
              { max: 500, message: "Description must be less than 500 characters" },
            ]}
          >
            <TextArea
              rows={2}
              placeholder="Outline the operational scope of this repository..."
              style={{ resize: "none", borderRadius: 6, padding: '10px 12px' }}
            />
          </Form.Item>

          <div className="cbm-settings-panel">
            <Row gutter={24} align="middle">
              <Col span={12}>
                <Form.Item
                  label={<Text strong style={{ fontSize: 12, color: 'var(--text-slate-600)' }}>VISUAL COLOR CODE</Text>}
                  name="color"
                  style={{ marginBottom: 0 }}
                >
                  <ColorPicker
                    showText
                    format="hex"
                    presets={[
                      {
                        label: "Enterprise Palette",
                        colors: ["#6366f1", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f43f5e"]
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12} style={{ borderLeft: '1px solid var(--border-slate-200)' }}>
                <Form.Item
                  label={<Text strong style={{ fontSize: 12, color: 'var(--text-slate-600)' }}>ACCESS VISIBILITY</Text>}
                  name="isShared"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <Switch size="small" />
                    <Space size={4}>
                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isShared !== curr.isShared}>
                        {({ getFieldValue }) => (
                          <>
                            {getFieldValue('isShared') ?
                              <><TeamOutlined style={{ color: '#7c3aed' }} /><Text style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>SHARED WORKSPACE</Text></> :
                              <><LockOutlined style={{ color: '#64748b' }} /><Text style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>PRIVATE NODE</Text></>
                            }
                          </>
                        )}
                      </Form.Item>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>

      <style jsx global>{`
        .cbm-header-icon {
          width: 40px; height: 40px;
          background: var(--bg-purple-50);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(139,92,246,0.2);
        }
        [data-theme='dark'] .cbm-header-icon {
          background: rgba(124,58,237,0.15) !important;
          border-color: rgba(124,58,237,0.25) !important;
        }
        .cbm-settings-panel {
          background: var(--bg-slate-50);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200);
          margin-top: 8px;
        }
        [data-theme='dark'] .cbm-settings-panel {
          background: #161b22 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .cbm-settings-panel .ant-col[style*='border-left'] {
          border-left-color: #1f2937 !important;
        }
        [data-theme='dark'] .premium-modal .ant-modal-content {
          background: #0d1117 !important;
          border: 1px solid #1f2937;
        }
        [data-theme='dark'] .premium-modal .ant-modal-header {
          background: #0d1117 !important;
          border-bottom-color: #1f2937 !important;
        }
        [data-theme='dark'] .premium-modal .ant-divider {
          border-color: #1f2937 !important;
        }
      `}</style>
    </>
  );
}
