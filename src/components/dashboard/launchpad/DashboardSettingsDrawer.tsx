"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button, Switch, App } from "antd";
import { ExternalLink } from "lucide-react";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import {
  SEGMENT_SECTIONS,
  DEFAULT_SETTINGS,
  DashboardSegment,
} from "./dashboardCards";

interface DashboardSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  segment: DashboardSegment;
  onSegmentChange: (segment: DashboardSegment) => void;
  /** Lets the launchpad's card list reflect a save without a refetch. */
  onSaved?: (visibleCards: Record<string, boolean>) => void;
}

export default function DashboardSettingsDrawer({
  open,
  onClose,
  segment,
  onSegmentChange,
  onSaved,
}: DashboardSettingsDrawerProps) {
  const router = useRouter();
  const { message: messageApi } = App.useApp();
  const { hasAnySubscriptionFeature } = useAuth();
  const { canUpdateSettings } = usePermission();

  const [values, setValues] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getSettings();
      setValues({ ...DEFAULT_SETTINGS, ...(data?.visibleCards || {}) });
    } catch (error) {
      console.error("Failed to fetch dashboard settings", error);
      setValues(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    try {
      setSaving(true);
      await dashboardService.updateSettings(values as any);
      onSaved?.(values);
      messageApi.success("Setting saved");
      onClose();
    } catch (error) {
      console.error("Failed to update dashboard settings:", error);
      messageApi.error("Failed to update dashboard settings");
    } finally {
      setSaving(false);
    }
  };

  const sections = SEGMENT_SECTIONS[segment];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title="Dashboard settings"
      styles={{ body: { padding: 0 } }}
      extra={
        <Button
          type="text"
          size="small"
          icon={<ExternalLink size={14} />}
          onClick={() => {
            onClose();
            router.push("/dashboard/settings");
          }}
        >
          Full page
        </Button>
      }
      footer={
        canUpdateSettings ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={save} disabled={loading}>
              Save changes
            </Button>
          </div>
        ) : null
      }
    >
      <div className="lp-drawer">
        <div className="lp-drawer-sub">
          Control which cards are visible on your dashboard.
        </div>

        <div className="lp-seg" role="tablist" aria-label="Dashboard view">
          {(["me", "organization"] as DashboardSegment[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={segment === key}
              className={`lp-seg-item${segment === key ? " is-active" : ""}`}
              onClick={() => onSegmentChange(key)}
            >
              {key === "me" ? "Me" : "Organization"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px 0" }}>
            <ZukvoLoader size="lg" />
          </div>
        ) : (
          sections.map((section) => {
            const cards = section.cards.filter(
              (c) => !c.requiredFeatures || hasAnySubscriptionFeature(...c.requiredFeatures),
            );
            if (!cards.length) return null;

            return (
              <div key={section.label}>
                <div className="lp-group-label">{section.label}</div>
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.name} className="lp-row lp-row--static">
                      <span
                        className="lp-row-icon"
                        style={{
                          background: `${card.color}1A`,
                          borderColor: `${card.color}33`,
                          color: card.color,
                        }}
                      >
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className="lp-row-body">
                        <span className="lp-row-title">
                          <span>{card.title}</span>
                        </span>
                        <span className="lp-row-trail">{card.description}</span>
                      </span>
                      <Switch
                        size="small"
                        checked={values[card.name] !== false}
                        disabled={!canUpdateSettings}
                        onChange={(checked) =>
                          setValues((prev) => ({ ...prev, [card.name]: checked }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
}
