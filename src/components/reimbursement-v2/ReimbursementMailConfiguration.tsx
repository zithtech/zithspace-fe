'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Radio, Switch, Select, Button, message, Spin, Form, Input } from 'antd';
import { MailOutlined, SaveOutlined } from '@ant-design/icons';
import ReimbursementV2Service, { ReimbMailConfig } from '@/services/reimbursementV2Service';
import { userService, User } from '@/services/userService';

const PALETTE = { blue: '#3B82F6', green: '#10B981', red: '#EF4444', grey: '#94A3B8', amber: '#F59E0B' } as const;

export default function ReimbursementMailConfiguration() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ReimbMailConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users for dropdowns
      const userData = await userService.getUsers();
      const userList = Array.isArray(userData) ? userData : (userData as any)?.data || [];
      setUsers(userList);

      // Fetch settings
      const settings = await ReimbursementV2Service.getMailSettings();
      form.setFieldsValue({
        replyToMode: settings.replyToMode || 'logged_in_user',
        customReplyToEmail: settings.customReplyToEmail || '',
        reportsToEnabled: settings.reportsToEnabled ?? true,
        additionalToEmails: settings.additionalToEmails || [],
        customToEmails: settings.customToEmails || [],
        officeCcEnabled: settings.officeCcEnabled ?? true,
        additionalCcEmails: settings.additionalCcEmails || [],
        customCcEmails: settings.customCcEmails || [],
      });
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error || 'Failed to load mail configuration');
    } finally {
      setLoading(false);
    }
  }, [form, messageApi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onFinish = async (values: ReimbMailConfig) => {
    setSaving(true);
    try {
      await ReimbursementV2Service.updateMailSettings(values);
      messageApi.success('Mail configuration saved successfully');
    } catch (err: any) {
      messageApi.error(err?.response?.data?.error || 'Failed to save mail configuration');
    } finally {
      setSaving(false);
    }
  };

  const userOptions = (Array.isArray(users) ? users : [])
    .filter(u => u.workEmail || u.email)
    .map(u => {
      const emailToUse = u.workEmail || u.email;
      return { label: `${u.name} (${emailToUse})`, value: emailToUse };
    });

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;
  }

  return (
    <div className="mail-config">
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          replyToMode: 'logged_in_user',
          reportsToEnabled: true,
          officeCcEnabled: true,
        }}
      >
        <div className="rb2-cards">
          {/* REPLY-TO SECTION */}
          <div className="rb2-card">
            <div className="rb2-card-head"><MailOutlined style={{ color: PALETTE.blue }} /> Reply-To Email</div>
            <div className="rb2-card-body">
              <div className="rb2-hint" style={{ marginBottom: 16, marginTop: -8 }}>
                The <strong>From</strong> address is automatically set to the configured SMTP account to ensure deliverability and avoid spoofing rejection. 
                Configure the <strong>Reply-To</strong> address below:
              </div>

              <Form.Item name="replyToMode" label="Reply-To Mode">
                <Radio.Group>
                  <Radio value="logged_in_user">Logged-in User (Default)</Radio>
                  <Radio value="custom">Custom Email</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.replyToMode !== currentValues.replyToMode}
              >
                {({ getFieldValue }) =>
                  getFieldValue('replyToMode') === 'custom' ? (
                    <Form.Item
                      name="customReplyToEmail"
                      label="Custom Reply-To Address"
                      rules={[{ required: true, message: 'Please enter custom email' }, { type: 'email' }]}
                    >
                      <Input placeholder="e.g. hr@company.com" />
                    </Form.Item>
                  ) : (
                    <div className="rb2-hint" style={{ marginBottom: 24 }}>
                      The email address of the employee applying for reimbursement will be used as the Reply-To address, so the manager can reply directly to them.
                    </div>
                  )
                }
              </Form.Item>
            </div>
          </div>

          {/* TO SECTION */}
          <div className="rb2-card">
            <div className="rb2-card-head"><MailOutlined style={{ color: PALETTE.green }} /> To Recipients</div>
            <div className="rb2-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-800)' }}>Reports To Manager</span>
                <Form.Item name="reportsToEnabled" valuePropName="checked" noStyle>
                  <Switch size="small" />
                </Form.Item>
              </div>
              <div className="rb2-hint" style={{ marginBottom: 20, marginTop: 0 }}>
                The user's "Reports To" manager will automatically be used as the primary recipient.
              </div>

              <Form.Item name="additionalToEmails" label="Additional Employee Recipients">
                <Select
                  mode="multiple"
                  placeholder="Select employees"
                  options={userOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item name="customToEmails" label="Custom Recipients">
                <Select
                  mode="tags"
                  placeholder="Add custom emails and press enter"
                  tokenSeparators={[',']}
                  open={false}
                  suffixIcon={null}
                />
              </Form.Item>
            </div>
          </div>

          {/* CC SECTION */}
          <div className="rb2-card">
            <div className="rb2-card-head"><MailOutlined style={{ color: PALETTE.amber }} /> CC Recipients</div>
            <div className="rb2-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-800)' }}>Office Email</span>
                <Form.Item name="officeCcEnabled" valuePropName="checked" noStyle>
                  <Switch size="small" />
                </Form.Item>
              </div>
              <div className="rb2-hint" style={{ marginBottom: 20, marginTop: 0 }}>
                Default CC email (owner@zithtech.com) will be added.
              </div>

              <Form.Item name="additionalCcEmails" label="Additional Employee CC">
                <Select
                  mode="multiple"
                  placeholder="Select employees"
                  options={userOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item name="customCcEmails" label="Custom CC">
                <Select
                  mode="tags"
                  placeholder="Add custom emails and press enter"
                  tokenSeparators={[',']}
                  open={false}
                  suffixIcon={null}
                />
              </Form.Item>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
            Save Mail Configuration
          </Button>
        </div>
      </Form>

      <style jsx>{`
        .mb-2 { margin-bottom: 8px; }
        .rb2-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; align-items: stretch; }
        .rb2-card { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0px; height: 100%; }
        .rb2-card-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100); font-size: 13px; font-weight: 700; color: var(--text-slate-800); }
        .rb2-card-body { padding: 14px 16px; }
        .rb2-hint { font-size: 11.5px; color: var(--text-slate-400); margin-top: 10px; line-height: 1.5; }
        .rb2-hint code { background: var(--bg-slate-100); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
      `}</style>
    </div>
  );
}
