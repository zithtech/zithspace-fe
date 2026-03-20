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
    isLoading,
    isPopoverOpen,
    setPopoverOpen,
    fetchActiveTimer,
    startTimer,
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

  // Pre-fill form when there's an active (running/paused) entry
  useEffect(() => {
    if (activeEntry && (activeEntry.status === 'RUNNING' || activeEntry.status === 'PAUSED')) {
      form.setFieldsValue({
        projectId: activeEntry.projectId,
        ticketId: activeEntry.ticketId,
        description: activeEntry.description,
        billable: activeEntry.billable,
        billingRate: activeEntry.billingRate,
      });
      if (activeEntry.projectId) {
        loadTickets(activeEntry.projectId);
      }
    } else if (!activeEntry) {
      form.resetFields();
    }
  }, [activeEntry?.id]);

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
      const res = await ProjectService.getProjects();
      setProjects(res.data || []);
    } catch (err) {
      // omit Error log to stay clean
    }
  };

  const loadTickets = async (projectId: string) => {
    try {
      const res = await TicketService.getProjectTickets(projectId);
      setTickets(res || []);
    } catch (err) {
      setTickets([]);
    }
  };

  const handleProjectChange = (projectId: string) => {
    form.setFieldsValue({ ticketId: undefined });
    loadTickets(projectId);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async (values: any) => {
    try {
      await startTimer({
        projectId: values.projectId,
        ticketId: values.ticketId,
        description: values.description,
        billable: values.billable,
        billingRate: values.billingRate
      });
      notification.success({ message: "Timer started successfully!" });
    } catch (error: any) {
      notification.error({ message: "Failed to start timer", description: error.message });
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
                style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' }}
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
            style={{ width: 64, height: 64, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981' }}
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
          rules={[{ required: true, message: 'Please select a project' }]}
        >
          <Select placeholder="Select a project" onChange={handleProjectChange} allowClear disabled={!!activeEntry || isLoading} showSearch filterOption={(input, option) => String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
            {projects.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
          </Select>
        </Form.Item>

        <Form.Item 
          name="ticketId" 
          label="Task / Ticket"
          rules={[{ required: true, message: 'Please select a task' }]}
        >
          <Select placeholder="Select a task" allowClear disabled={!!activeEntry || isLoading || !form.getFieldValue('projectId')} showSearch filterOption={(input, option) => String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
            {tickets.map(t => <Select.Option key={t.id} value={t.id}>{t.title}</Select.Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="What are you working on?">
          <Input.TextArea rows={2} placeholder="Description..." />
        </Form.Item>
        {/*
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="billable" label="Billable" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch />
          </Form.Item>
          <Form.Item name="billingRate" label="Rate/hr ($)" style={{ marginBottom: 0 }}>
            <Input type="number" placeholder="0.00" style={{ width: 100 }} />
          </Form.Item>
        </div>
        */}
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
        danger={activeEntry?.status === 'RUNNING'}
        icon={activeEntry ? (activeEntry.status === 'RUNNING' ? <div style={{ width: 12, height: 12, backgroundColor: 'currentColor', borderRadius: 2 }} /> : <PauseCircleFilled style={{ color: '#f59e0b' }} />) : <PlayCircleFilled style={{ color: '#10b981' }} />}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          backgroundColor: activeEntry ? (activeEntry.status === 'RUNNING' ? '#fef2f2' : '#fffbeb') : 'white',
          color: activeEntry ? (activeEntry.status === 'RUNNING' ? '#ef4444' : '#d97706') : '#374151',
          borderColor: activeEntry ? (activeEntry.status === 'RUNNING' ? '#fca5a5' : '#fcd34d') : '#d1d5db'
        }}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatTime(elapsedTime)}</span>
      </Button>
    </Popover>
  );
};
