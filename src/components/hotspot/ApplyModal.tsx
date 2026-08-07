'use client';

import React, { useState } from 'react';
import { Drawer, Form, Input, Radio, Upload, Button, message, ConfigProvider, Typography, Space } from 'antd';
import { UploadOutlined, CloseOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { OpeningListItem } from '@/services/openingV2Service';
import OpeningV2Service from '@/services/openingV2Service';
import { PipelineService } from '@/services/pipelineService';
import { commonDrawerProps, drawerFormStyles as formStyles, SectionCard } from '@/components/common/DrawerSection';

const { Text } = Typography;

export default function ApplyModal({
  open,
  opening,
  onClose,
}: {
  open: boolean;
  opening: OpeningListItem;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const isReferral = Form.useWatch('applicationType', form) === 'referral';

  const handleFinish = async (values: any) => {
    if (!file) {
      message.error('Please upload a resume');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload resume and parse it
      const parseRes = await PipelineService.parseResume(file);
      const fileUrl = parseRes.data?.file_url || parseRes.data?.url;
      const parsedData = parseRes.data?.parsed;

      if (values.applicationType === 'referral') {
        // Create a Referral which will sit in the opening's holding area
        await OpeningV2Service.addReferral(opening.id, {
          name: values.name,
          email: values.email,
          mobile: values.mobile,
          resumeUrl: fileUrl,
          notes: values.notes,
          skills: parsedData?.skills || [],
          totalExperience: parsedData?.total_experience || 0,
        });
        message.success('Referral submitted successfully!');
      } else {
        // 2. Create Candidate in pipeline
        const candidateRes = await PipelineService.createCandidate({
          role: opening.jobTitle,
          name: values.name,
          email: values.email,
          mobile: values.mobile,
          resume_url: fileUrl,
          total_experience: parsedData?.total_experience || 0,
          skills: parsedData?.skills || [],
        });

        const candidateId = candidateRes.data?.id;

        if (!candidateId) {
          throw new Error('Failed to create candidate');
        }

        // 3. Add Application to Opening
        await OpeningV2Service.addApplication(opening.id, {
          pipelineCandidateId: candidateId,
          source: 'internal_job_posting',
          notes: values.notes,
        });
        message.success('Application submitted successfully!');
      }
      onClose();
      form.resetFields();
      setFile(null);
    } catch (err: any) {
      console.error(err);
      message.error(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      width={800}
      open={open}
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        <style dangerouslySetInnerHTML={{ __html: formStyles }} />
        
        {/* Drawer Header */}
        <div
          className="customer-drawer-header"
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Apply for {opening.jobTitle}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {opening.openingCode}
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ color: "var(--text-secondary)" }}
          />
        </div>

        {/* Drawer Body */}
        <div
          className="customer-drawer-form"
          style={{ padding: "28px", overflowY: "auto", flex: 1 }}
        >
          <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 0 } } }}>
            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
              labelAlign="left"
              onFinish={handleFinish}
              initialValues={{ applicationType: 'myself' }}
            >
              <SectionCard
                icon={<UserOutlined />}
                title="Application Details"
                subtitle="Select whether this is for you or a referral"
                step="STEP 1"
              >
                <Form.Item
                  name="applicationType"
                  label="I am applying for"
                  style={{ marginBottom: 14 }}
                >
                  <Radio.Group>
                    <Radio value="myself">Myself</Radio>
                    <Radio value="referral">A Referral</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="name"
                  label={isReferral ? "Candidate's Name" : 'Your Name'}
                  rules={[
                    { required: true, message: 'Name is required' }
                  ]}
                  normalize={(value) => (value ? value.replace(/[^a-zA-Z\s]/g, '') : value)}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder="Enter full name" size="large" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={isReferral ? "Candidate's Email" : 'Your Email'}
                  rules={[
                    { required: true, message: 'Email is required' },
                    { type: 'email', message: 'Enter a valid email' },
                  ]}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder="Enter email address" size="large" />
                </Form.Item>

                <Form.Item
                  name="mobile"
                  label={isReferral ? "Candidate's Mobile" : 'Your Mobile'}
                  rules={[
                    { required: true, message: 'Mobile number is required' },
                    { min: 7, message: 'Mobile number must be at least 7 digits' },
                    { max: 15, message: 'Mobile number must be at most 15 digits' }
                  ]}
                  normalize={(value) => (value ? value.replace(/\D/g, '').slice(0, 15) : value)}
                  style={{ marginBottom: 14 }}
                >
                  <Input placeholder="Enter mobile number" size="large" />
                </Form.Item>
              </SectionCard>

              <SectionCard
                icon={<FileTextOutlined />}
                title="Resume & Notes"
                subtitle="Provide the required documentation"
                step="STEP 2"
              >
                <Form.Item
                  label="Resume"
                  required
                  style={{ marginBottom: 14 }}
                >
                  <Upload
                    beforeUpload={(f) => {
                      setFile(f);
                      return false;
                    }}
                    maxCount={1}
                    onRemove={() => setFile(null)}
                  >
                    <Button icon={<UploadOutlined />}>Select File</Button>
                  </Upload>
                </Form.Item>

                {isReferral && (
                  <Form.Item
                    name="notes"
                    label="Referral Notes"
                    style={{ marginBottom: 14 }}
                  >
                    <Input.TextArea
                      placeholder="Why is this person a good fit?"
                      autoSize={{ minRows: 3, maxRows: 6 }}
                      size="large"
                    />
                  </Form.Item>
                )}
              </SectionCard>
            </Form>
          </ConfigProvider>
        </div>

        {/* Drawer Footer */}
        <div
          className="customer-drawer-footer"
          style={{
            padding: "14px 28px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            bottom: 0,
          }}
        >
          <Text style={{ fontSize: 11.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
            Ensure all details are correct before submitting
          </Text>
          <Space size={10}>
            <Button
              onClick={onClose}
              disabled={loading}
              style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}
            >
              Submit Application
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
}
