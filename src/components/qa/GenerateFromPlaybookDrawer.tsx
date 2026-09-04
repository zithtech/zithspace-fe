"use client";

/**
 * Generate Test Cases from a playbook selection.
 *
 * The playbook supplies the *content*; this drawer supplies the *filing* — which
 * project, which module, which feature, and the business scenario the generated
 * cases hang under. That mirrors how the Cases page already asks for a module
 * before anything can be created, so a generated case lands somewhere a QA can
 * actually find it.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Drawer, Button, Input, Form, Tooltip, message } from "antd";
import { InfoCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import {
  ArrowRight,
  BookOpen,
  FileStack,
  FolderTree,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  useQaModules,
  NoModulesEmpty,
  NO_MODULES_STYLES,
} from "@/components/qa/ModuleSettingsSection";
import { useQaProject, useQaProjects } from "@/components/qa/QaProjectGate";
import {
  commonDrawerProps,
  SectionCard,
  drawerFormStyles as formStyles,
} from "@/components/common/DrawerSection";
import { api as axios } from "@/lib/axios";
import { PLAYBOOK_STYLES } from "@/components/qa/playbookShared";

interface Props {
  open: boolean;
  onClose: () => void;
  playbookSlug: string;
  playbookName: string;
  itemIds: string[];
  onGenerated: (parentId: string) => void;
}

export default function GenerateFromPlaybookDrawer({
  open,
  onClose,
  playbookSlug,
  playbookName,
  itemIds,
  onGenerated,
}: Props) {
  const { projectId: rememberedProjectId, setProjectId } = useQaProject();
  const { data: projects = [], isLoading: loadingProjects } = useQaProjects();
  const { items: modules, loading: loadingModules, refetch: refetchModules } = useQaModules(open);

  const [projectValue, setProjectValue] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string | undefined>(undefined);
  const [feature, setFeature] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"Draft" | "Ready">("Draft");
  const [submitting, setSubmitting] = useState(false);

  /* Reopening should pick up where the QA left off: the remembered QA Space
     project, and a scenario title named after the playbook. */
  useEffect(() => {
    if (!open) return;
    setProjectValue(rememberedProjectId ?? null);
    setTitle((prev) => prev || `${playbookName} — playbook coverage`);
  }, [open, rememberedProjectId, playbookName]);

  /* A module belongs to a project, so offering modules from another project
     would file the cases somewhere the QA is not looking. Legacy modules with
     no project stay visible — they predate the project column. */
  const moduleOptions = useMemo(
    () =>
      modules
        .filter((m) => !projectValue || !m.project_id || m.project_id === projectValue)
        .map((m) => ({
          value: m.id,
          label: m.module_name,
          description: m.project_name || undefined,
        })),
    [modules, projectValue]
  );

  useEffect(() => {
    if (moduleId && !moduleOptions.some((o) => o.value === moduleId)) setModuleId(undefined);
  }, [moduleOptions, moduleId]);

  const projectLabel = projects.find((p) => p.value === projectValue)?.label ?? "";
  const moduleLabel = moduleOptions.find((o) => o.value === moduleId)?.label ?? "";
  /* The same three conditions submit() checks, so the button is only live when
     pressing it would actually work. */
  const ready = !!moduleId && !!title.trim() && itemIds.length > 0;

  const submit = async () => {
    if (!title.trim()) return message.error("A scenario title is required");
    if (!moduleId) return message.error("Module is required");
    if (itemIds.length === 0) return message.error("Select at least one recommendation");

    try {
      setSubmitting(true);
      const result: any = await axios.post(
        `/api/v2/qa/playbooks/${encodeURIComponent(playbookSlug)}/generate`,
        {
          item_ids: itemIds,
          parent_title: title.trim(),
          module_id: moduleId,
          project_id: projectValue || null,
          feature: feature.trim() || null,
          status,
        }
      );
      message.success(
        `Created ${result.created_count} test case${result.created_count === 1 ? "" : "s"}`
      );
      // Remember the project so Cases, Suites and Runs open on the same one.
      if (projectValue) setProjectId(projectValue);
      onGenerated(result.parent_id);
    } catch (err: any) {
      message.error(err?.message || "Could not generate test cases");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      open={open}
      onClose={onClose}
      title="Generate Test Cases"
      className="pb-gen"
      footer={
        <div className="pb-gen__foot">
          <span className="pb-gen__footwhat">
            {ready ? (
              <>
                Files under <b>{moduleLabel}</b>
                {feature.trim() ? (
                  <>
                    {" "}
                    · <b>{feature.trim()}</b>
                  </>
                ) : null}
              </>
            ) : (
              "Pick a module and name the scenario to continue"
            )}
          </span>
          <Button className="pb-btn" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            className="pb-btn"
            loading={submitting}
            disabled={!ready}
            icon={<Sparkles size={14} />}
            onClick={submit}
          >
            Generate {itemIds.length} case{itemIds.length === 1 ? "" : "s"}
          </Button>
        </div>
      }
    >
      <style
        dangerouslySetInnerHTML={{ __html: formStyles + NO_MODULES_STYLES + PLAYBOOK_STYLES }}
      />

      {/* The drawer's own header: commonDrawerProps hides antd's, so without
          this the panel opened with no title on it at all. */}
      <div className="pb-gen__head">
        <span className="pb-gen__badge">
          <Sparkles size={18} />
        </span>
        <div className="pb-gen__headtext">
          <h3 className="pb-gen__title">Generate test cases</h3>
          <p className="pb-gen__sub">
            <BookOpen size={12} />
            {playbookName} · {itemIds.length} recommendation
            {itemIds.length === 1 ? "" : "s"} selected
          </p>
        </div>
        <Tooltip title="Close">
          <button type="button" className="pb-gen__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </Tooltip>
      </div>

      {/* What is about to happen, as the shape it happens in. */}
      <div className="pb-gen__flow">
        <div className="pb-gen__step">
          <span className="pb-gen__stepicon">
            <Layers size={15} />
          </span>
          <b>{itemIds.length}</b>
          <em>recommendation{itemIds.length === 1 ? "" : "s"}</em>
        </div>
        <ArrowRight size={15} className="pb-gen__arrow" />
        <div className="pb-gen__step">
          <span className="pb-gen__stepicon">
            <FolderTree size={15} />
          </span>
          <b>1</b>
          <em>scenario</em>
        </div>
        <ArrowRight size={15} className="pb-gen__arrow" />
        <div className="pb-gen__step is-out">
          <span className="pb-gen__stepicon">
            <FileStack size={15} />
          </span>
          <b>{itemIds.length}</b>
          <em>test case{itemIds.length === 1 ? "" : "s"}</em>
        </div>
      </div>

      {/* Where they land, updating as the form is filled — the filing is the
          whole job of this drawer, so it is shown rather than described. */}
      <div className="pb-gen__path">
        <span className={projectLabel ? "is-set" : ""}>{projectLabel || "No project"}</span>
        <i>/</i>
        <span className={moduleId ? "is-set" : ""}>{moduleLabel || "Module"}</span>
        <i>/</i>
        <span className={feature.trim() ? "is-set" : ""}>{feature.trim() || "Feature"}</span>
        <i>/</i>
        <span className={title.trim() ? "is-set" : ""}>{title.trim() || "Scenario title"}</span>
      </div>

      <SectionCard
        step="STEP 1"
        icon={<InfoCircleOutlined />}
        title="Where these cases live"
        subtitle="Generated cases file exactly like hand-written ones — pick the project and module they belong to"
      >
        <Form.Item label="Project" style={{ marginBottom: 16 }}>
          <SearchableDropdown
            value={projectValue}
            onChange={(value: string) => setProjectValue(value || null)}
            options={projects.map((p) => ({
              value: p.value,
              label: p.label,
              description: p.description,
            }))}
            loading={loadingProjects}
            placeholder="Select a project"
            searchPlaceholder="Search projects"
          />
        </Form.Item>

        <Form.Item label="Module" required style={{ marginBottom: 16 }}>
          <SearchableDropdown
            value={moduleId ?? null}
            onChange={(value: string) => setModuleId(value || undefined)}
            options={moduleOptions}
            loading={loadingModules}
            placeholder="Select a module"
            searchPlaceholder="Search modules"
            emptyComponent={
              <NoModulesEmpty
                projectName={projects.find((p) => p.value === projectValue)?.label}
                onRefresh={refetchModules}
              />
            }
          />
        </Form.Item>

        <Form.Item label="Feature" style={{ marginBottom: 0 }}>
          <Input
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            placeholder="e.g., Sign in"
            size="large"
            maxLength={255}
          />
        </Form.Item>
      </SectionCard>

      <SectionCard
        step="STEP 2"
        icon={<FileTextOutlined />}
        title="Scenario & status"
        subtitle="The business scenario the generated cases hang under, and the state they start in"
      >
        <Form.Item label="Scenario title" required style={{ marginBottom: 16 }}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Login — playbook coverage"
            size="large"
            maxLength={255}
          />
        </Form.Item>

        <Form.Item label="Status" style={{ marginBottom: 0 }}>
          <SearchableDropdown
            value={status}
            onChange={(value: string) => setStatus((value as "Draft" | "Ready") || "Draft")}
            options={[
              {
                value: "Draft",
                label: "Draft",
                description: "Review and adjust to your product before running",
              },
              { value: "Ready", label: "Ready", description: "Ready to add to a suite or run" },
            ]}
            placeholder="Select a status"
          />
        </Form.Item>
      </SectionCard>
    </Drawer>
  );
}
