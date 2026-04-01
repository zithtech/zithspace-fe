"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Select, TimePicker, Button, notification, Space, Typography, Tag, DatePicker, Row, Col } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  ProjectOutlined,
  TagOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { TimeTrackingService, TimeTrackingEntry } from '@/services/timeTracking.service';
import TicketService from '@/services/ticketService';
import { useMembers } from '@/hooks/useGlobalData';
import { useTimeTrackerStore } from '@/store/useTimeTrackerStore';
import { useQuery } from '@tanstack/react-query';
import { processLogsToSessions } from '@/utils/timeTrackingUtils';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface ManageTimeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: dayjs.Dayjs;
}

export const ManageTimeModal: React.FC<ManageTimeModalProps> = ({ open, onClose, onSuccess, selectedDate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const effectiveDate = selectedDate || dayjs();
  const selectedUserId = Form.useWatch('userId', form);
  const selectedProjectIds = Form.useWatch('projectIds', form) || [];
  const startTime = Form.useWatch('startTime', form);
  const endTime = Form.useWatch('endTime', form);

  const { data: members = [] } = useMembers();

  // Calculate total duration
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

  // Fetch tickets for the selected user
  const { data: userTicketsResponse, isLoading: loadingTickets } = useQuery({
    queryKey: ['user-tickets', selectedUserId],
    queryFn: () => TicketService.getTickets({ assigneeId: selectedUserId, limit: 1000 }),
    enabled: !!selectedUserId
  });

  const allUserTickets = useMemo(() => userTicketsResponse?.data || [], [userTicketsResponse]);

  // Extract unique projects from tickets
  const availableProjects = useMemo(() => {
    const projectMap = new Map();
    allUserTickets.forEach((ticket: any) => {
      const project = ticket.project;
      if (typeof project === 'object' && project.id) {
        projectMap.set(project.id, { value: project.id, label: project.name });
      } else if (typeof project === 'string') {
        projectMap.set(project, { value: project, label: `Project ${project}` });
      }
    });
    return Array.from(projectMap.values());
  }, [allUserTickets]);

  // Filter tickets by selected projects
  const filteredTickets = useMemo(() => {
    if (selectedProjectIds.length === 0) return allUserTickets;
    return allUserTickets.filter((t: any) => {
      const pId = (t.project && typeof t.project === 'object') ? t.project.id : t.project;
      return selectedProjectIds.includes(pId);
    });
  }, [allUserTickets, selectedProjectIds]);

  // Reset fields when user changes
  useEffect(() => {
    form.setFieldsValue({ projectIds: [], ticketIds: [] });
  }, [selectedUserId, form]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: any) => {
    const { userId, projectIds, ticketIds, startTime, endTime } = values;

    if (!startTime || !endTime) {
      notification.error({ message: "Start and End times are required" });
      return;
    }

    if (startTime.isAfter(endTime)) {
      notification.error({ message: "Start time must be before end time" });
      return;
    }

    setLoading(true);
    try {
      const dateStr = values.date.format('YYYY-MM-DD');
      const startDayjs = dayjs(`${dateStr} ${startTime.format('HH:mm:ss')}`);
      const endDayjs = dayjs(`${dateStr} ${endTime.format('HH:mm:ss')}`);
      const startISO = startDayjs.toISOString();
      const endISO = endDayjs.toISOString();

      // 1. Fetch ALL entries for this user on this day
      const allUserEntries = await TimeTrackingService.getEntries({
        userId,
        startDate: values.date.startOf('day').toISOString(),
        endDate: values.date.endOf('day').toISOString(),
      });

      // 2. Identify entries that overlap with the [startDayjs, endDayjs] range
      const overlappingEntries = (allUserEntries || []).filter((entry: TimeTrackingEntry) => {
        const existingStart = dayjs(entry.startTime);
        const existingEnd = entry.endTime ? dayjs(entry.endTime) : dayjs();

        // Overlap condition: (StartA < EndB) AND (EndA > StartB)
        const overlaps = existingStart.isBefore(endDayjs) && startDayjs.isBefore(existingEnd);
        if (!overlaps) return false;

        // Session-aware check: Check if any of the active sessions in this entry overlap
        const sessions = processLogsToSessions(entry.logs, entry.startTime, entry.endTime, entry.status);
        return sessions.some((s: any) => {
          const sStart = dayjs(s.start);
          const sEnd = s.end ? dayjs(s.end) : dayjs();
          return sStart.isBefore(endDayjs) && startDayjs.isBefore(sEnd);
        });
      });

      // 3. Resolve Overlaps (Smart Adjustment / Split)
      for (const entry of overlappingEntries) {
        const existingStart = dayjs(entry.startTime);
        const existingEnd = entry.endTime ? dayjs(entry.endTime) : dayjs();

        // Case: Split (New entry in the middle of existing)
        if (existingStart.isBefore(startDayjs) && endDayjs.isBefore(existingEnd)) {
          // A. Truncate current entry to end at new entry's start
          await TimeTrackingService.updateEntry(entry.id, {
            endTime: startISO,
            status: 'STOPPED'
          });

          // B. Create a NEW entry for the remaining time (end to existingEnd)
          await TimeTrackingService.addManualEntry({
            userId,
            projectId: (entry.project && typeof entry.project === 'object') ? (entry.project as any).id : entry.project,
            ticketId: entry.ticketId,
            description: entry.description,
            startTime: endISO,
            endTime: existingEnd.toISOString(),
            billable: entry.billable
          });
        } 
        // Case: Truncate End (Existing starts before new, ends inside new)
        else if (existingStart.isBefore(startDayjs) && existingEnd.isAfter(startDayjs)) {
          await TimeTrackingService.updateEntry(entry.id, {
            endTime: startISO,
            status: 'STOPPED'
          });
        }
        // Case: Truncate Start (Existing starts inside new, ends after new)
        else if (existingStart.isAfter(startDayjs) && existingEnd.isAfter(endDayjs)) {
          await TimeTrackingService.updateEntry(entry.id, {
            startTime: endISO
          });
        }
        // Case: Full Overlap (Existing is completely inside new)
        else if (existingStart.isSame(startDayjs) || existingStart.isAfter(startDayjs)) {
          if (existingEnd.isSame(endDayjs) || existingEnd.isBefore(endDayjs)) {
            await TimeTrackingService.deleteEntry(entry.id);
          }
        }
      }

      // 4. Create the requested entries
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
        notification.success({
          message: "Time Logged Successfully",
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          description: `Created ${successCount} entries for ${totalDuration?.hours}h ${totalDuration?.minutes}m total.`
        });
        useTimeTrackerStore.getState().fetchActiveTimer();
        onSuccess();
        onClose();
      } else {
        notification.error({ message: "Error", description: "Failed to create entries." });
      }
    } catch (error: any) {
      notification.error({ message: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space size="middle">
          <div style={{ background: "#e0f2fe", padding: 6, borderRadius: 8, display: "flex", color: "#0ea5e9" }}>
            <ClockCircleOutlined style={{ fontSize: 18 }} />
          </div>
          <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Log Time Session</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={650}
      className="manage-time-modal"
    >
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
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label={<Space><CalendarOutlined /><span>Select Date</span></Space>}
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MMM D, YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="userId"
              label={<Space><UserOutlined /><span>Select User</span></Space>}
              rules={[{ required: true, message: 'Please select a user' }]}
            >
              <Select
                placeholder="Search User"
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
                options={members.map((m: any) => ({ value: m.value, label: m.label }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="projectIds"
          label={<Space><ProjectOutlined /><span>Projects</span></Space>}
          rules={[{ required: true, message: 'Select at least one project' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select Projects"
            disabled={!selectedUserId}
            options={availableProjects}
            loading={loadingTickets}
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
            onChange={() => form.setFieldsValue({ ticketIds: [] })}
          />
        </Form.Item>

        <Form.Item
          name="ticketIds"
          label={<Space><TagOutlined /><span>Tickets</span></Space>}
          rules={[{ required: true, message: 'Select at least one ticket' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select Tickets"
            disabled={selectedProjectIds.length === 0}
            loading={loadingTickets}
            maxTagCount="responsive"
            showSearch
            filterOption={(input, option) => {
              const ticket = allUserTickets.find((t: any) => t.id === option?.value);
              if (!ticket) return false;
              return (
                ticket.title.toLowerCase().includes(input.toLowerCase()) ||
                ticket.ticketNumber.toLowerCase().includes(input.toLowerCase())
              );
            }}
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

        <div style={{
          background: '#f8faff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e6f4ff',
          marginBottom: '24px'
        }}>
          <Row gutter={16} align="bottom">
            <Col span={10}>
              <Form.Item
                name="startTime"
                label={<Space><ClockCircleOutlined /><span>Start Time</span></Space>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <TimePicker style={{ width: '100%' }} format="h:mm A" changeOnBlur use12Hours />
              </Form.Item>
            </Col>

            <Col span={10}>
              <Form.Item
                name="endTime"
                label={<Space><ClockCircleOutlined /><span>End Time</span></Space>}
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <TimePicker style={{ width: '100%' }} format="h:mm A" changeOnBlur use12Hours />
              </Form.Item>
            </Col>

            <Col span={4}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>Duration</Text>
                <Tag color={totalDuration ? "blue" : "default"} style={{ margin: 0, fontWeight: 600, fontSize: '14px', width: '100%', textAlign: 'center' }}>
                  {totalDuration ? `${totalDuration.hours}h ${totalDuration.minutes}m` : '--:--'}
                </Tag>
              </div>
            </Col>
          </Row>
        </div>

        {!loadingTickets && selectedUserId && filteredTickets.length === 0 && (
          <Text type="warning" style={{ display: 'block', marginBottom: 16 }}>
            <InfoCircleOutlined /> This user has no tickets assigned to the selected projects.
          </Text>
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 32, textAlign: 'right' }}>
          <Space size="middle">
            <Button
              onClick={onClose}
              icon={<CloseCircleOutlined />}
              style={{ borderRadius: 8, height: 40 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<CheckCircleOutlined />}
              style={{
                height: 40,
                padding: '0 24px',
                borderRadius: 8,
                fontWeight: 600,
                background: "#1677ff",
                border: "none",
                // boxShadow: '0 4px 10px rgba(22, 119, 255, 0.25)'
              }}
            >
              Create Entry
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

