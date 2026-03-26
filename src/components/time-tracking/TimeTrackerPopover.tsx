"use client";

import React, { useEffect, useState } from "react";
import { Popover, Button, Input, Select, Switch, Form, Spin, App } from "antd";
import { PlayCircleFilled, PauseCircleFilled, HistoryOutlined } from "@ant-design/icons";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { ProjectService } from "@/services/projectService";
import TicketService from "@/services/ticketService";
import { useRouter } from "next/navigation";

export const TimeTrackerPopover: React.FC = () => {
  const { notification } = App.useApp();
  const {
    activeEntry,
    activeEntries,
    isLoading,
    isPopoverOpen,
    setPopoverOpen,
    fetchActiveTimer,
    startTimer,
    startMultipleTimers,
    pauseTimer,
    resumeTimer,
    stopTimer
  } = useTimeTrackerStore();

  const [form] = Form.useForm();
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveTimer();
    loadProjects();
  }, []);

  // Pre-fill form when there are active entries
  useEffect(() => {
    const runningOrPaused = activeEntries.filter(e => e.status === 'RUNNING' || e.status === 'PAUSED');
    if (runningOrPaused.length > 0) {
      const pIds = Array.from(new Set(runningOrPaused.map(e => e.projectId).filter(Boolean))) as string[];
      const tIds = Array.from(new Set(runningOrPaused.map(e => e.ticketId).filter(Boolean))) as string[];

      form.setFieldsValue({
        projectId: pIds,
        ticketId: tIds,
        description: runningOrPaused[0].description, // Use the most recent description
        billable: runningOrPaused.some(e => e.billable),
        billingRate: runningOrPaused[0].billingRate,
      });
      if (pIds.length > 0) {
        loadTickets(pIds);
      }
    } else if (activeEntries.length === 0) {
      form.resetFields();
    }
  }, [activeEntries.length]);

  // Elapsed time ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeEntry) {
      const baseDuration = activeEntry.duration || 0;

      if (activeEntry.status === 'RUNNING') {
        const lastLog = activeEntry.logs?.find(l => l.action === 'STARTED' || l.action === 'RESUMED');
        const lastActiveTime = lastLog ? new Date(lastLog.createdAt).getTime() : new Date(activeEntry.startTime).getTime();

        const updateTime = () => setElapsedTime(baseDuration + Math.floor((new Date().getTime() - lastActiveTime) / 1000));

        updateTime();
        interval = setInterval(updateTime, 1000);
      } else if (activeEntry.status === 'PAUSED') {
        setElapsedTime(baseDuration);
      }
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [activeEntry]);

  const loadProjects = async () => {
    try {
      const res = await ProjectService.getUserProjects();
      setProjects(res || []);
    } catch (err) {
      // omit Error log to stay clean
    }
  };

  const loadTickets = async (projectIds: string[]) => {
    if (!projectIds || projectIds.length === 0) {
      setTickets([]);
      return;
    }
    try {
      // Use individual try-catches to ensure one failing project doesn't block others
      const ticketPromises = projectIds.map(async (pid) => {
        try {
          // Only fetch tickets assigned to the current user for this project
          const projectTickets = await TicketService.getMyTicketsByProject(pid);
          return (projectTickets || []).map(t => ({ ...t, projectId: pid }));
        } catch (err) {
          console.error(`Failed to load tickets for project ${pid}:`, err);
          return [];
        }
      });

      const allTicketsResults = await Promise.all(ticketPromises);
      const mergedTickets = allTicketsResults.flat();

      setTickets(mergedTickets);
    } catch (err) {
      console.error("General error in loadTickets:", err);
      setTickets([]);
    }
  };

  const handleProjectChange = (projectIds: string[]) => {
    form.setFieldsValue({ ticketId: [] });
    loadTickets(projectIds);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async (values: any) => {
    try {
      const entriesToCreate = values.ticketId.map((tId: string) => {
        const ticket = tickets.find(t => t.id === tId);
        // Fallback to searching in all visible ticket options if needed
        const pId = ticket?.projectId || (values.projectId.length === 1 ? values.projectId[0] : undefined);

        return {
          projectId: pId,
          ticketId: tId,
          description: values.description,
          billable: values.billable,
          billingRate: values.billingRate
        };
      });

      await startMultipleTimers(entriesToCreate);
      notification.success({ message: "Timers started successfully!" });
    } catch (error: any) {
      notification.error({ message: "Failed to start timers", description: error.message });
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer();
      form.resetFields();
      notification.success({ message: "Timer stopped and saved!" });
    } catch (error: any) {
      notification.error({ message: "Failed to stop timer", description: error.message });
    }
  };

  const selectedPids = Form.useWatch('projectId', form) || [];

  const renderContent = () => (
    <div style={{ width: 320 }}>
      {isLoading && <div style={{ textAlign: "center", marginBottom: 16 }}><Spin /></div>}

      <div style={{ textAlign: "center", fontSize: '2rem', fontWeight: 600, fontFamily: 'monospace', marginBottom: '16px', color: activeEntry ? (activeEntry.status === 'PAUSED' ? '#f59e0b' : '#10b981') : '#374151' }}>
        {formatTime(elapsedTime)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: '24px' }}>
        {activeEntry ? (
          activeEntry.status === 'RUNNING' ? (
            <>
              <Button
                type="default"
                shape="circle"
                icon={<PauseCircleFilled style={{ fontSize: 32, color: '#f59e0b' }} />}
                style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={async () => { try { await pauseTimer(); } catch (e) { } }}
                loading={isLoading}
              />
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<div style={{ width: 24, height: 24, backgroundColor: 'white', borderRadius: 4 }} />}
                style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleStop}
                loading={isLoading}
              />
            </>
          ) : (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<PlayCircleFilled style={{ fontSize: 32 }} />}
                style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1677ff' }}
                onClick={async () => { try { await resumeTimer(); } catch (e) { } }}
                loading={isLoading}
              />
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<div style={{ width: 24, height: 24, backgroundColor: 'white', borderRadius: 4 }} />}
                style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleStop}
                loading={isLoading}
              />
            </>
          )
        ) : (
          <Button
            type="primary"
            shape="circle"
            icon={<PlayCircleFilled style={{ fontSize: 32 }} />}
            style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1677ff' }}
            onClick={() => form.submit()}
            loading={isLoading}
          />
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleStart}
        initialValues={{ billable: false }}
        disabled={!!activeEntry || isLoading}
      >
        <Form.Item
          name="projectId"
          label="Project"
          rules={[{ required: true, message: 'Please select at least one project' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select project(s)"
            onChange={handleProjectChange}
            allowClear
            disabled={!!activeEntry || isLoading}
            showSearch
            options={projects.map(p => ({ label: p.label, value: p.value }))}
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item
          name="ticketId"
          label="Task / Ticket"
          rules={[{ required: true, message: 'Please select at least one task' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select task(s)"
            allowClear
            disabled={!!activeEntry || isLoading || !selectedPids.length}
            showSearch
            options={tickets.map(t => ({
              label: `${t.title} ${selectedPids.length > 1 ? `(${projects.find(p => p.value === t.projectId)?.label || 'Unknown'})` : ''}`,
              value: t.id
            }))}
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>

        <Form.Item name="description" label="What are you working on?">
          <Input.TextArea rows={2} placeholder="Description..." />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
        <Button type="link" onClick={() => { setPopoverOpen(false); router.push('/time-tracking'); }}>
          View All Time Entries
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={renderContent()}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{activeEntry ? (activeEntry.status === 'RUNNING' ? "Running Timer" : "Paused Timer") : "Start New Timer"}</span>
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => router.push('/time-tracking')} />
        </div>
      }
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={setPopoverOpen}
      placement="bottomRight"
    >
      <Button
        type={activeEntry ? (activeEntry.status === 'RUNNING' ? "primary" : "default") : "default"}
        icon={activeEntry ? (activeEntry.status === 'RUNNING' ? <div style={{ width: 12, height: 12, backgroundColor: 'currentColor', borderRadius: 2 }} /> : <PauseCircleFilled style={{ color: '#f59e0b' }} />) : <PlayCircleFilled style={{ color: '#1677ff' }} />}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          backgroundColor: activeEntry
            ? (activeEntry.status === 'RUNNING' ? '#f0fdf4' : '#fffbeb')
            : 'white',
          color: activeEntry
            ? (activeEntry.status === 'RUNNING' ? '#15803d' : '#d97706')
            : '#374151',
          borderColor: activeEntry
            ? (activeEntry.status === 'RUNNING' ? '#bcf0da' : '#fcd34d')
            : '#d1d5db'
        }}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatTime(elapsedTime)}</span>
      </Button>
    </Popover>
  );
};
