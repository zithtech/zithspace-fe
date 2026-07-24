"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Select, TimePicker, Button, App, Space, Typography, Tag, DatePicker, Row, Col } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  ProjectOutlined,
  TagOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ThunderboltFilled,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { TimeTrackingService } from '@/services/timeTracking.service';
import TicketService from '@/services/ticketService';
import { ProjectService } from '@/services/projectService';
import { useMembers } from '@/hooks/useGlobalData';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ManageTimeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: dayjs.Dayjs;
}

export const ManageTimeModal: React.FC<ManageTimeModalProps> = ({ open, onClose, onSuccess, selectedDate }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const effectiveDate = selectedDate || dayjs();
  const selectedUserId = Form.useWatch('userId', form);
  const selectedProjectIds = Form.useWatch('projectIds', form) || [];
  const selectedTicketIds = Form.useWatch('ticketIds', form) || [];
  const startTime = Form.useWatch('startTime', form);
  const endTime = Form.useWatch('endTime', form);

  const { data: members = [] } = useMembers();

  const totalDuration = useMemo(() => {
    if (startTime && endTime) {
      if (startTime.isAfter(endTime)) return null;
      const diffInMinutes = endTime.diff(startTime, 'minute');
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return { hours, minutes, totalMinutes: diffInMinutes };
    }
    return null;
  }, [startTime, endTime]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const projectsQueryParam = selectedProjectIds.length > 0 ? selectedProjectIds.join(',') : undefined;

  const { data: userTicketsResponse, isLoading: loadingTickets } = useQuery({
    queryKey: ['user-tickets', selectedUserId, projectsQueryParam, debouncedSearch],
    queryFn: () => TicketService.getTickets({ 
      assigneeId: selectedUserId, 
      projectId: projectsQueryParam,
      search: debouncedSearch || undefined,
      limit: 20 
    }),
    enabled: !!selectedUserId
  });

  const filteredTickets = useMemo(() => userTicketsResponse?.data || [], [userTicketsResponse]);
  const allUserTickets = filteredTickets;

  const { data: userProjectsResponse, isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects-manage', selectedUserId],
    queryFn: () => ProjectService.getProjects({ userId: selectedUserId, limit: 1000 }),
    enabled: !!selectedUserId
  });

  const availableProjects = useMemo(() => {
    const projects = userProjectsResponse?.data || [];
    return projects.map((p: any) => ({ value: p.id, label: p.name }));
  }, [userProjectsResponse]);

  useEffect(() => {
    form.setFieldsValue({ projectIds: [], ticketIds: [] });
    setSearchTerm('');
    setDebouncedSearch('');
  }, [selectedUserId, form]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSearchTerm('');
      setDebouncedSearch('');
    }
  }, [open, form]);

  const selectedMember = useMemo(
    () => members.find(m => m.value === selectedUserId),
    [members, selectedUserId]
  );

  const handleSubmit = async (values: any) => {
    const { userId, ticketIds, startTime, endTime } = values;

    if (!startTime || !endTime) {
      message.error("Start and End times are required");
      return;
    }

    if (startTime.isAfter(endTime)) {
      message.error("Start time must be before end time");
      return;
    }

    setLoading(true);
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      const startDayjs = dayjs(`${dateStr} ${startTime.format('HH:mm:ss')}`);
      const endDayjs = dayjs(`${dateStr} ${endTime.format('HH:mm:ss')}`);
      const startISO = startDayjs.toISOString();
      const endISO = endDayjs.toISOString();

      let successCount = 0;
      for (const tId of ticketIds) {
        const ticketObj = allUserTickets.find((t: any) => t.id === tId);
        let pId: string | undefined = undefined;
        if (ticketObj) {
          if (ticketObj.project && typeof ticketObj.project === 'object') {
            pId = (ticketObj.project as any).id;
          } else if (typeof ticketObj.project === 'string') {
            pId = ticketObj.project;
          }
        }

        try {
          await TimeTrackingService.addManualEntry({
            userId,
            projectId: pId,
            ticketId: tId,
            startTime: startISO,
            endTime: endISO,
            billable: true
          });
          successCount++;
        } catch (e) {
          console.error(`Error creating entry for ticket ${tId}:`, e);
        }
      }

      if (successCount > 0) {
        message.success(`Time Logged Successfully: Created ${successCount} ${successCount === 1 ? 'entry' : 'entries'} for ${totalDuration?.hours}h ${totalDuration?.minutes}m total.`);
        useTimeTrackerStore.getState().fetchActiveTimer();
        onSuccess();
        onClose();
      } else {
        message.error("Failed to create entries.");
      }
    } catch (error: any) {
      message.error(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const ticketCount = selectedTicketIds.length;
  const totalLoggedMinutes = (totalDuration?.totalMinutes || 0) * Math.max(ticketCount, 1);
  const hasInvalidRange = startTime && endTime && startTime.isAfter(endTime);

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={680}
      className="manage-time-modal"
      closeIcon={<CloseCircleOutlined style={{ fontSize: 18 }} />}
    >
      <div className="mtm-hero">
        <div className="mtm-hero__icon">
          <ClockCircleOutlined />
        </div>
        <div className="mtm-hero__copy">
          <div className="mtm-hero__title">Log Time Session</div>
          <div className="mtm-hero__subtitle">Manually record a work session against one or more tickets</div>
        </div>
        <div className={`mtm-hero__duration ${totalDuration ? 'is-active' : ''} ${hasInvalidRange ? 'is-error' : ''}`}>
          <span className="mtm-hero__duration-label">
            {hasInvalidRange ? 'Invalid range' : 'Duration'}
          </span>
          <span className="mtm-hero__duration-value">
            {hasInvalidRange
              ? '—'
              : totalDuration
                ? `${totalDuration.hours}h ${String(totalDuration.minutes).padStart(2, '0')}m`
                : '00h 00m'}
          </span>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          userId: undefined,
          projectIds: [],
          ticketIds: [],
          date: effectiveDate
        }}
        autoComplete="off"
        className="mtm-form"
        requiredMark={false}
      >
        <div className="mtm-section">
          <div className="mtm-section__header">
            <span className="mtm-section__index">1</span>
            <span className="mtm-section__title">Who & When</span>
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userId"
                label={<span className="mtm-label"><UserOutlined /> Team Member</span>}
                rules={[{ required: true, message: 'Please select a user' }]}
              >
                <Select
                      placeholder="Search team member"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={members.map(m => ({ value: m.value, label: m.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label={<span className="mtm-label"><CalendarOutlined /> Date</span>}
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="MMM D, YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mtm-section">
          <div className="mtm-section__header">
            <span className="mtm-section__index">2</span>
            <span className="mtm-section__title">What was worked on</span>
            {selectedMember && (
              <span className="mtm-section__hint">
                {allUserTickets.length} {allUserTickets.length === 1 ? 'ticket' : 'tickets'} assigned
              </span>
            )}
          </div>

          <Form.Item
            name="projectIds"
            label={<span className="mtm-label"><ProjectOutlined /> Projects</span>}
            rules={[{ required: true, message: 'Select at least one project' }]}
          >
            <Select
              mode="multiple"
              placeholder={selectedUserId ? 'Select projects' : 'Pick a team member first'}
              disabled={!selectedUserId}
              options={availableProjects}
              loading={loadingTickets}
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              onChange={() => form.setFieldsValue({ ticketIds: [] })}
            />
          </Form.Item>

          <Form.Item
            name="ticketIds"
            label={<span className="mtm-label"><TagOutlined /> Tickets</span>}
            rules={[{ required: true, message: 'Select at least one ticket' }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              mode="multiple"
              placeholder={selectedProjectIds.length === 0 ? 'Pick a project first' : 'Select tickets'}
              disabled={selectedProjectIds.length === 0}
              loading={loadingTickets}
              maxTagCount="responsive"
              showSearch
              onSearch={setSearchTerm}
              onClear={() => setSearchTerm('')}
              filterOption={false}
              optionLabelProp="label"
            >
              {filteredTickets.map((t: any) => (
                <Select.Option key={t.id} value={t.id} label={`${t.ticketNumber}: ${t.title}`}>
                  <Space>
                    <Tag color="blue" bordered={false}>{t.ticketNumber}</Tag>
                    <Text ellipsis style={{ maxWidth: 350 }}>{t.title}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {!loadingTickets && selectedUserId && filteredTickets.length === 0 && (
            <div className="mtm-empty">
              <InfoCircleOutlined /> This user has no tickets assigned to the selected projects.
            </div>
          )}
        </div>

        <div className="mtm-section">
          <div className="mtm-section__header">
            <span className="mtm-section__index">3</span>
            <span className="mtm-section__title">Time window</span>
          </div>
          <div className="mtm-time-card">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startTime"
                  label={<span className="mtm-label"><PlayCircleOutlined /> Start</span>}
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <TimePicker
                          style={{ width: '100%' }}
                    format="h:mm A"
                    use12Hours
                    needConfirm={false}
                    suffixIcon={<ClockCircleOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endTime"
                  label={<span className="mtm-label"><PauseCircleOutlined /> End</span>}
                  rules={[{ required: true, message: 'Required' }]}
                  style={{ marginBottom: 0 }}
                >
                  <TimePicker
                          style={{ width: '100%' }}
                    format="h:mm A"
                    use12Hours
                    needConfirm={false}
                    suffixIcon={<ClockCircleOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {ticketCount > 0 && totalDuration && (
              <div className="mtm-summary">
                <ThunderboltFilled className="mtm-summary__icon" />
                <span>
                  This will create <strong>{ticketCount}</strong> {ticketCount === 1 ? 'entry' : 'entries'} ·
                  <strong> {Math.floor(totalLoggedMinutes / 60)}h {String(totalLoggedMinutes % 60).padStart(2, '0')}m</strong> total logged
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mtm-footer">
          <Button
            onClick={onClose}
            size="large"
            className="mtm-btn-cancel"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<CheckCircleOutlined />}
            className="mtm-btn-primary"
            disabled={!!hasInvalidRange}
          >
            Create Entry
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
