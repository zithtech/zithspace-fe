"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Select, TimePicker, Button, notification, Space, Typography, Tag } from 'antd';
import { TimeTrackingService, TimeTrackingEntry } from '@/services/timeTracking.service';
import TicketService from '@/services/ticketService';
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const effectiveDate = selectedDate || dayjs();
  const selectedUserId = Form.useWatch('userId', form);
  const selectedProjectIds = Form.useWatch('projectIds', form) || [];
  const selectedTicketIds = Form.useWatch('ticketIds', form) || [];

  const { data: members = [] } = useMembers();

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
      const pId = typeof t.project === 'object' ? t.project.id : t.project;
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
      const dateStr = effectiveDate.format('YYYY-MM-DD');
      const startDateTime = dayjs(`${dateStr} ${startTime.format('HH:mm:ss')}`).toISOString();
      const endDateTime = dayjs(`${dateStr} ${endTime.format('HH:mm:ss')}`).toISOString();

      let updateCount = 0;
      let errorCount = 0;

      // Iterate through all project-ticket combinations
      for (const pId of projectIds) {
        const projectTickets = ticketIds.filter((tId: string) => {
          const t = allUserTickets.find((ut: any) => ut.id === tId);
          const tpId = typeof t?.project === 'object' ? t.project.id : t?.project;
          return tpId === pId;
        });

        for (const tId of projectTickets) {
          try {
            // Find existing entry for this user/project/ticket on the effective date
            const entries = await TimeTrackingService.getEntries({
              userId,
              projectId: pId,
              ticketId: tId,
              startDate: effectiveDate.startOf('day').toISOString(),
              endDate: effectiveDate.endOf('day').toISOString(),
            });

            if (entries && entries.length > 0) {
              await TimeTrackingService.updateEntry(entries[0].id, {
                projectId: pId,
                ticketId: tId,
                startTime: startDateTime,
                endTime: endDateTime,
                status: 'STOPPED'
              });
              updateCount++;
            }
          } catch (err) {
            console.error(`Error updating entry for ${pId}/${tId}:`, err);
            errorCount++;
          }
        }
      }

      if (updateCount > 0) {
        notification.success({
          message: "Success",
          description: `Updated ${updateCount} time entries successfully.${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
        });
        
        // Synchronize global timer state (stops any running frontend timers for these records)
        useTimeTrackerStore.getState().fetchActiveTimer();
        
        onSuccess();
        onClose();
      } else {
        notification.warning({
          message: "No Updates",
          description: "No existing time records were found for the selected combinations today."
        });
      }
    } catch (error: any) {
      notification.error({ message: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Manage Time (Administrative)"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          userId: undefined,
          projectIds: [],
          ticketIds: [],
        }}
      >
        <Form.Item
          name="userId"
          label="Select User"
          rules={[{ required: true, message: 'Please select a user' }]}
        >
          <Select
            placeholder="Search User"
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
            options={members.map(m => ({ value: m.value, label: m.label }))}
          />
        </Form.Item>

        <Form.Item
          name="projectIds"
          label="Projects"
          rules={[{ required: true, message: 'Select at least one project' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select Projects"
            disabled={!selectedUserId}
            options={availableProjects}
            loading={loadingTickets}
          />
        </Form.Item>

        <Form.Item
          name="ticketIds"
          label="Tickets"
          rules={[{ required: true, message: 'Select at least one ticket' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select Tickets"
            disabled={selectedProjectIds.length === 0}
            loading={loadingTickets}
          >
            {filteredTickets.map((t: any) => (
              <Select.Option key={t.id} value={t.id}>
                <Space>
                  <Tag color="cyan">{t.ticketNumber}</Tag>
                  {t.title}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: 'Required' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            rules={[{ required: true, message: 'Required' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </div>

        {!loadingTickets && selectedUserId && filteredTickets.length === 0 && (
          <Text type="warning">This user has no tickets assigned.</Text>
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Time
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
