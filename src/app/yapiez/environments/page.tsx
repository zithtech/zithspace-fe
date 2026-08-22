"use client";

/**
 * Environments — where a flow runs, and the values it starts with.
 *
 * {{baseUrl}} always exists (it is the environment's Base URL). Everything else
 * is a named variable, and a variable marked secret is never sent back to the
 * browser: it comes down masked, and leaving the mask untouched preserves the
 * stored value on save.
 */

import React, { useCallback, useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Drawer, Input, Switch, Typography, message } from "antd";
import { Plus, Layers, Trash2, Pencil, Star } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ProjectService } from "@/services/projectService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { EnvVariable, SECRET_MASK, YapiezEnvironment, YapiezService } from "@/services/yapiezService";

const { Text } = Typography;
const { TextArea } = Input;

const emptyEnvironment = (): Partial<YapiezEnvironment> => ({
  name: "",
  baseUrl: "",
  description: "",
  variables: [],
  isDefault: false,
});

export default function EnvironmentsPage() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "Environments" });

  const { canManageYapiezEnv } = usePermission();

  const [environments, setEnvironments] = useState<YapiezEnvironment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<YapiezEnvironment>>(emptyEnvironment());
  const [projects, setProjects] = useState<{ value: string; label: string; description?: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEnvironments(await YapiezService.listEnvironments());
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load environments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    ProjectService.getUserProjects(true)
      .then((res: any) => {
        const list: any[] = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(
          list
            .map((project: any) => ({
              value: String(project.value ?? project.id ?? ""),
              label: String(project.label ?? project.name ?? ""),
              description: project.code || undefined,
            }))
            .filter((option) => option.value && option.label)
        );
      })
      .catch(() => setProjects([]));
  }, []);

  const save = async () => {
    if (!editing.name?.trim()) {
      message.warning("Give the environment a name");
      return;
    }
    if (!editing.baseUrl?.trim()) {
      message.warning("Give the environment a Base URL");
      return;
    }

    setSaving(true);
    try {
      if (editing.id) {
        await YapiezService.updateEnvironment(editing.id, editing);
        message.success("Environment updated");
      } else {
        await YapiezService.createEnvironment(editing);
        message.success("Environment created");
      }
      setDrawerOpen(false);
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save this environment");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (environment: YapiezEnvironment) => {
    try {
      await YapiezService.deleteEnvironment(environment.id);
      message.success("Environment deleted");
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not delete this environment");
    }
  };

  const patchVariable = (index: number, changes: Partial<EnvVariable>) => {
    const variables = (editing.variables ?? []).map((variable, i) =>
      i === index ? { ...variable, ...changes } : variable
    );
    setEditing({ ...editing, variables });
  };

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} style={{ color: "#475569" }} />
              <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Environments</Text>
            </div>
            <Text style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              A Base URL and the variables a flow starts from — QA, Staging, Production.
            </Text>
          </div>
          {canManageYapiezEnv && (
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditing(emptyEnvironment());
                setDrawerOpen(true);
              }}
            >
              New environment
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <ZukvoLoader size="lg" />
          </div>
        ) : !environments.length ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              borderRadius: 10,
              border: "1px dashed var(--border-color, #cbd5e1)",
            }}
          >
            <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              No environments yet. A flow needs one to resolve {"{{baseUrl}}"} and its credentials.
            </Text>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {environments.map((environment) => (
              <div
                key={environment.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: "var(--card-bg, #ffffff)",
                  border: `1px solid ${environment.isDefault ? "#bfdbfe" : "var(--border-color, #e2e8f0)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {environment.name}
                  </Text>
                  {environment.isDefault && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        padding: "1px 7px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#1d4ed8",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <Star size={9} /> DEFAULT
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  {canManageYapiezEnv && (
                    <>
                      <Button
                        size="small"
                        type="text"
                        icon={<Pencil size={13} />}
                        onClick={() => {
                          setEditing(environment);
                          setDrawerOpen(true);
                        }}
                      />
                      <ConfirmDialog
                        title="Delete this environment?"
                        description="Flows pointing at it fall back to the default environment."
                        tone="danger"
                        confirmText="Delete"
                        onConfirm={() => remove(environment)}
                      >
                        <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
                      </ConfirmDialog>
                    </>
                  )}
                </div>

                <Text
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {environment.baseUrl}
                </Text>

                <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {environment.projectId
                    ? projects.find((p) => p.value === environment.projectId)?.label ?? "One project"
                    : "Shared across all projects"}
                </Text>

                {environment.description && (
                  <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>{environment.description}</Text>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                  {environment.variables.map((variable) => (
                    <span
                      key={variable.key}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 5,
                        fontSize: 11,
                        fontFamily: "ui-monospace, monospace",
                        color: variable.secret ? "#475569" : "#1d4ed8",
                        background: variable.secret ? "#f1f5f9" : "#eff6ff",
                        border: `1px solid ${variable.secret ? "#e2e8f0" : "#bfdbfe"}`,
                      }}
                    >
                      {`{{${variable.key}}}`}
                      {variable.secret ? " ••••" : ""}
                    </span>
                  ))}
                  {!environment.variables.length && (
                    <Text style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Only {"{{baseUrl}}"} is available
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Drawer
        {...commonDrawerProps}
        width={620}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ ...commonDrawerProps.styles, body: { padding: 0, background: "var(--card-bg, #ffffff)" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--border-color, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {editing.id ? "Edit environment" : "New environment"}
            </Text>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={save}>
                Save
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Name</Text>
              <Input
                placeholder="QA"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Project</Text>
              <SearchableDropdown
                value={editing.projectId ?? null}
                onChange={(value: string) => setEditing({ ...editing, projectId: value || null })}
                options={projects}
                placeholder="Shared across all projects"
                itemNoun="projects"
                width={420}
              />
              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                A base URL is usually per-application, so most environments belong to one project. Leave it blank
                for a shared sandbox that every project can run against.
              </Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Base URL</Text>
              <Input
                placeholder="https://qa.example.com"
                value={editing.baseUrl}
                onChange={(e) => setEditing({ ...editing, baseUrl: e.target.value })}
                style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
              />
              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Available to every API as {"{{baseUrl}}"}. Relative API URLs are joined onto it.
              </Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Description</Text>
              <TextArea
                rows={2}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch
                checked={!!editing.isDefault}
                onChange={(checked) => setEditing({ ...editing, isDefault: checked })}
              />
              <div>
                <Text style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Default environment</Text>
                <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  Used by any flow that has not chosen one.
                </Text>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Variables</Text>
              {(editing.variables ?? []).map((variable, index) => (
                <div key={index} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Input
                    size="small"
                    placeholder="username"
                    value={variable.key}
                    onChange={(e) => patchVariable(index, { key: e.target.value })}
                    style={{ flex: "0 0 180px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                  />
                  <Input
                    size="small"
                    placeholder="qa@example.com"
                    type={variable.secret ? "password" : "text"}
                    value={variable.value}
                    onChange={(e) => patchVariable(index, { value: e.target.value })}
                    onFocus={() => {
                      // The server sends a marker for a stored secret. Clearing it
                      // on focus means typing replaces the secret and leaving it
                      // alone keeps it — no accidental blanking either way.
                      if (variable.value === SECRET_MASK) patchVariable(index, { value: "" });
                    }}
                    style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Switch
                      size="small"
                      checked={!!variable.secret}
                      onChange={(checked) => patchVariable(index, { secret: checked })}
                    />
                    <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>Secret</Text>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove variable"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        variables: (editing.variables ?? []).filter((_, i) => i !== index),
                      })
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setEditing({ ...editing, variables: [...(editing.variables ?? []), { key: "", value: "" }] })
                }
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "1px dashed var(--border-color, #cbd5e1)",
                  background: "transparent",
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                <Plus size={13} /> Add variable
              </button>

              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                A secret value is masked in run records and never sent back to the browser.
              </Text>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
