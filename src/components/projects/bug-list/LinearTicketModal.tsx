"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, message, ConfigProvider, theme as antdTheme } from "antd";
import { Bug as BugIcon, Loader2, Users, Tag, ShieldCheck, Send } from "lucide-react";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { LinearService } from "@/services/linearService";
import { useTheme } from "@/context/ThemeContext";
import {
  LinearMark,
  TicketFlowHeader,
  ticketFlowModalProps,
  ticketFlowStyles,
  tfWrapClass,
} from "./ticket-flow";

interface LinearTicketModalProps {
  open: boolean;
  onCancel: () => void;
  bugIds: string[];
  onSuccess: () => void;
  /** Render as a wizard step body — no Modal of its own. */
  embedded?: boolean;
}

export const LinearTicketModal: React.FC<LinearTicketModalProps> = ({
  open,
  onCancel,
  bugIds,
  onSuccess,
  embedded,
}) => {
  const [form] = Form.useForm();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string, projects: { nodes: { id: string; name: string }[] } }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [labels, setLabels] = useState<{ id: string; name: string; color: string }[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      fetchLinearData();
    } else {
      form.resetFields();
      setSelectedTeamId(undefined);
    }
  }, [open]);

  const fetchLinearData = async () => {
    setFetchingData(true);
    try {
      const [teamsData, usersData, labelsData] = await Promise.all([
        LinearService.getTeams(),
        LinearService.getUsers(),
        LinearService.getLabels(),
      ]);
      setTeams(teamsData || []);
      setUsers(usersData || []);
      setLabels(labelsData || []);
    } catch (error: any) {
      message.error(error.message || "Failed to load Linear data");
    } finally {
      setFetchingData(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      await LinearService.createIssue({
        title: values.title,
        description: values.description,
        teamId: values.teamId,
        projectId: values.projectId,
        assigneeId: values.assigneeId,
        priority: values.priority !== undefined && values.priority !== null ? Number(values.priority) : undefined,
        labelIds: values.labelIds,
        bugIds,
      });
      message.success("Successfully created Linear issue and linked bugs");
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.message || "Failed to create Linear issue");
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
            mark={<LinearMark size={22} />}
            plate
            eyebrow="Step 3 · Compose the issue"
            title="Create a Linear issue"
            onClose={embedded ? undefined : onCancel}
            chips={[
              { icon: <BugIcon size={12} />, label: `${bugLabel} will be linked`, tone: "accent" },
              { icon: <ShieldCheck size={12} />, label: fetchingData ? "Loading workspace…" : "Workspace connected", tone: fetchingData ? "default" : "ok" },
            ]}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ priority: 0 }}
            style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
          >
            <div className="tf-body">
              <div className="tf-form">
                {/* Issue */}
                <section className="tf-fieldset">
                  <div className="tf-fieldset-head">
                    <BugIcon size={13} />
                    The issue
                    <span className="tf-fieldset-hint">Shown at the top of the Linear card</span>
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
                    <span className="tf-fieldset-hint">Team is required by Linear</span>
                  </div>

                  <div className="tf-fields">
                    <Form.Item
                      name="teamId"
                      label="Team"
                      rules={[{ required: true, message: "Please select a team" }]}
                    >
                      <SearchableDropdown
                        placeholder="Select a Linear team"
                        loading={fetchingData}
                        options={teams.map((t) => ({ label: t.name, value: t.id }))}
                        onChange={(val) => {
                          setSelectedTeamId(val);
                          form.setFieldsValue({ projectId: undefined });
                        }}
                      />
                    </Form.Item>

                    <Form.Item name="projectId" label="Project">
                      <SearchableDropdown
                        placeholder={selectedTeamId ? "Select a project (optional)" : "Pick a team first"}
                        allowClear
                        loading={fetchingData}
                        disabled={!selectedTeamId}
                        options={
                          selectedTeamId
                            ? teams
                                .find((t) => t.id === selectedTeamId)
                                ?.projects.nodes.map((p) => ({ label: p.name, value: p.id })) || []
                            : []
                        }
                      />
                    </Form.Item>

                    <Form.Item name="assigneeId" label="Assignee">
                      <SearchableDropdown
                        placeholder="Unassigned"
                        allowClear
                        loading={fetchingData}
                        options={users.map((u) => ({ label: u.name, value: u.id }))}
                      />
                    </Form.Item>

                    <Form.Item name="priority" label="Priority">
                      <SearchableDropdown
                        placeholder="Select priority"
                        allowClear
                        options={[
                          { label: "No priority", value: "0" },
                          { label: "Urgent", value: "1" },
                          { label: "High", value: "2" },
                          { label: "Medium", value: "3" },
                          { label: "Low", value: "4" },
                        ]}
                      />
                    </Form.Item>
                  </div>
                </section>

                {/* Labels */}
                <section className="tf-fieldset">
                  <div className="tf-fieldset-head">
                    <Tag size={13} />
                    Labels
                    <span className="tf-fieldset-hint">Optional</span>
                  </div>

                  <div className="tf-fields" style={{ ["--tf-fcols" as string]: 1 }}>
                    <Form.Item name="labelIds" label="Apply labels">
                      <SearchableDropdown
                        mode="multiple"
                        allowClear
                        renderTags
                        placeholder="Add labels..."
                        loading={fetchingData}
                        options={labels.map((l) => ({
                          label: l.name,
                          value: l.id,
                          badge: <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color }} />
                        }))}
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
                <button type="submit" className="tf-primary" disabled={loading || fetchingData}>
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
