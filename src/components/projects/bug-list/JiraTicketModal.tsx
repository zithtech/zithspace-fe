"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message, ConfigProvider, theme as antdTheme } from "antd";
import { Bug as BugIcon, Loader2, Users, ShieldCheck, Send } from "lucide-react";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { JiraService } from "@/services/jiraService";
import { useTheme } from "@/context/ThemeContext";
import {
  JiraMark,
  TicketFlowHeader,
  ticketFlowModalProps,
  ticketFlowStyles,
  tfWrapClass,
} from "./ticket-flow";

interface JiraTicketModalProps {
  open: boolean;
  onCancel: () => void;
  bugIds: string[];
  onSuccess: () => void;
  embedded?: boolean;
}

export const JiraTicketModal: React.FC<JiraTicketModalProps> = ({
  open,
  onCancel,
  bugIds,
  onSuccess,
  embedded,
}) => {
  const [form] = Form.useForm();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; key: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ accountId: string; displayName: string; emailAddress: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<{ id: string; name: string; description: string; iconUrl: string }[]>([]);
  
  const [fetchingInitialData, setFetchingInitialData] = useState(false);
  const [fetchingIssueTypes, setFetchingIssueTypes] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      fetchJiraData();
    } else {
      form.resetFields();
      setSelectedProjectId(undefined);
      setIssueTypes([]);
    }
  }, [open]);

  const fetchJiraData = async () => {
    setFetchingInitialData(true);
    try {
      const [projectsData, usersData] = await Promise.all([
        JiraService.getProjects(),
        JiraService.getUsers(),
      ]);
      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Jira data");
    } finally {
      setFetchingInitialData(false);
    }
  };

  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    form.setFieldsValue({ issueTypeId: undefined });
    if (!projectId) {
      setIssueTypes([]);
      return;
    }
    
    setFetchingIssueTypes(true);
    try {
      const types = await JiraService.getIssueTypes(projectId);
      setIssueTypes(types || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Jira issue types");
    } finally {
      setFetchingIssueTypes(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      await JiraService.createIssue({
        title: values.title,
        description: values.description,
        projectId: values.projectId,
        issueTypeId: values.issueTypeId,
        assigneeId: values.assigneeId,
        bugIds,
      });
      message.success("Successfully created Jira issue and linked bugs");
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.message || "Failed to create Jira issue");
    } finally {
      setLoading(false);
    }
  };

  const bugLabel = `${bugIds.length} bug${bugIds.length === 1 ? "" : "s"}`;

  const body = (
      <ConfigProvider
        theme={{
          algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgContainer: theme === "dark" ? "#141A26" : "#F8FAFC",
            colorText: theme === "dark" ? "#F1F5F9" : "#0F172A",
            borderRadius: 9,
          },
        }}
      >
        <div className={embedded ? "tf-plain" : "tf"}>
          <TicketFlowHeader
            mark={<JiraMark size={22} />}
            plate
            eyebrow="Step 3 · Compose the issue"
            title="Create a Jira issue"
            onClose={embedded ? undefined : onCancel}
            chips={[
              { icon: <BugIcon size={12} />, label: `${bugLabel} will be linked`, tone: "accent" },
              { icon: <ShieldCheck size={12} />, label: fetchingInitialData ? "Loading workspace…" : "Workspace connected", tone: fetchingInitialData ? "default" : "ok" },
            ]}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
          >
            <div className="tf-body">
              <div className="tf-form">
                {/* Issue */}
                <section className="tf-fieldset">
                  <div className="tf-fieldset-head">
                    <BugIcon size={13} />
                    The issue
                    <span className="tf-fieldset-hint">Shown at the top of the Jira card</span>
                  </div>

                  <div className="tf-fields" style={{ ["--tf-fcols" as string]: 1 }}>
                    <Form.Item
                      name="title"
                      label="Title"
                      rules={[{ required: true, message: "Please enter a title" }]}
                    >
                      <Input placeholder="e.g. Checkout fails on expired card" />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                      <Input.TextArea
                        rows={5}
                        placeholder="Context, repro steps, expected vs actual… (optional)"
                      />
                    </Form.Item>
                  </div>
                </section>

                {/* Routing */}
                <section className="tf-fieldset">
                  <div className="tf-fieldset-head">
                    <Users size={13} />
                    Where it goes
                    <span className="tf-fieldset-hint">Project is required by Jira</span>
                  </div>

                  <div className="tf-fields">
                    <Form.Item
                      name="projectId"
                      label="Project"
                      rules={[{ required: true, message: "Please select a project" }]}
                    >
                      <SearchableDropdown
                        placeholder="Select a Jira project"
                        loading={fetchingInitialData}
                        options={projects.map((p) => ({ label: p.name, value: p.id }))}
                        onChange={handleProjectChange}
                      />
                    </Form.Item>

                    <Form.Item
                      name="issueTypeId"
                      label="Issue Type"
                      rules={[{ required: true, message: "Please select an issue type" }]}
                    >
                      <SearchableDropdown
                        placeholder={selectedProjectId ? "Select an issue type" : "Pick a project first"}
                        loading={fetchingIssueTypes}
                        disabled={!selectedProjectId}
                        options={issueTypes.map((t) => ({ label: t.name, value: t.id }))}
                      />
                    </Form.Item>

                    <Form.Item name="assigneeId" label="Assignee">
                      <SearchableDropdown
                        placeholder="Unassigned"
                        allowClear
                        loading={fetchingInitialData}
                        options={users.map((u) => ({ label: u.displayName, value: u.accountId }))}
                      />
                    </Form.Item>
                  </div>
                </section>
              </div>
            </div>

            <footer className="tf-foot">
              <span className="tf-foot-note">
                {bugLabel} will be attached to this issue and marked as converted.
              </span>

              <div className="tf-foot-right">
                <button type="button" className="tf-secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button type="submit" className="tf-primary" disabled={loading || fetchingInitialData || fetchingIssueTypes}>
                  {loading ? <Loader2 size={13} className="tf-spin" /> : <Send size={13} />}
                  {loading ? "Creating…" : "Create issue"}
                </button>
              </div>
            </footer>
          </Form>
        </div>
      </ConfigProvider>
  );

  if (embedded) return body;

  return (
    <Modal
      {...ticketFlowModalProps}
      open={open}
      onCancel={onCancel}
      width={900}
      maskClosable={false}
      wrapClassName={tfWrapClass(theme)}
    >
      <style>{ticketFlowStyles}</style>
      {body}
    </Modal>
  );
};
