"use client";

/**
 * "Write us a playbook for this."
 *
 * A QA who opens the catalog and finds nothing for the feature they are about
 * to test is the most useful person in the loop: they know what is missing.
 * This is the one place that demand is captured, and it goes to Testiez, who
 * author the playbook and answer the request with it.
 *
 * Deliberately three fields, with suggestions on two of them. An ask that takes
 * a form to file is an ask nobody files — and the suggestions are drawn from
 * the live catalog, so they lead people toward the gaps rather than toward
 * asking for something that already exists.
 */

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, Modal, message } from "antd";
import { ArrowUpRight, Layers, Send, Sparkles, Tags } from "lucide-react";

import { api as axios } from "@/lib/axios";
import type { PlaybookSummary } from "@/components/qa/playbookShared";

const { TextArea } = Input;

/**
 * The features a QA team most often has to test and the library most often has
 * nothing for. Only the ones with no playbook yet are offered — suggesting
 * "Login" to someone whose catalog already covers Login wastes the click and
 * produces a request that gets declined.
 */
const COMMON_FEATURES = [
  "File Upload",
  "Search & Filters",
  "Bulk Import / Export",
  "Payments & Checkout",
  "Notifications & Email",
  "Roles & Permissions",
  "Profile & Settings",
  "Dashboards & Reports",
  "Comments & Mentions",
  "Onboarding & Invites",
  "Two-Factor Authentication",
  "Audit Log & History",
];

/** Areas to file a request under when the catalog has none of its own yet. */
const FALLBACK_AREAS = [
  "Authentication",
  "Data Management",
  "Billing",
  "Collaboration",
  "Reporting",
  "Administration",
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Prefills the area when asked from inside a category. */
  category?: string;
  onSubmitted?: () => void;
}

export default function RequestPlaybookDrawer({ open, onClose, category, onSubmitted }: Props) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(category ?? "");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  /* The catalog is what the suggestions are built from. Fetched only while the
     modal is open, and shared with the page's own copy through react-query. */
  const { data: catalog } = useQuery<{ playbooks: PlaybookSummary[]; categories: string[] }>({
    queryKey: ["qa", "playbooks", "catalog"],
    queryFn: () => axios.get("/api/v2/qa/playbooks?all=true"),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const existingNames = useMemo(
    () => new Set((catalog?.playbooks ?? []).map((p) => p.name.trim().toLowerCase())),
    [catalog]
  );

  const featureSuggestions = useMemo(
    () => COMMON_FEATURES.filter((f) => !existingNames.has(f.toLowerCase())).slice(0, 8),
    [existingNames]
  );

  const areaSuggestions = useMemo(() => {
    const fromCatalog = catalog?.categories ?? [];
    const merged = [...fromCatalog, ...FALLBACK_AREAS.filter((a) => !fromCatalog.includes(a))];
    return merged.slice(0, 7);
  }, [catalog]);

  /* Asking for something that is already in the library is the one mistake this
     form can make on the requester's behalf, so it says so before they send. */
  const alreadyCovered = useMemo(() => {
    const term = title.trim().toLowerCase();
    if (term.length < 3) return null;
    return (
      (catalog?.playbooks ?? []).find(
        (p) =>
          p.name.trim().toLowerCase() === term ||
          p.name.trim().toLowerCase().includes(term) ||
          term.includes(p.name.trim().toLowerCase())
      ) ?? null
    );
  }, [title, catalog]);

  const reset = () => {
    setTitle("");
    setArea(category ?? "");
    setDetails("");
  };

  const submit = async () => {
    if (!title.trim()) return message.error("Say which feature needs a playbook");
    try {
      setSaving(true);
      const res: any = await axios.post("/api/v2/qa/playbooks/requests", {
        title: title.trim(),
        category: area.trim() || null,
        details: details.trim() || null,
      });
      message.success(
        res?.alreadyOpen
          ? "You already have this request open — we'll come back on it"
          : "Request sent. Testiez will pick it up and write the playbook."
      );
      reset();
      onSubmitted?.();
      onClose();
    } catch (err: any) {
      message.error(
        err?.response?.data?.error || err?.message || "Could not send the request"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={580}
      centered
      destroyOnClose
      className="pb-modal"
      title={
        <div className="pb-modal__head">
          <span className="pb-modal__badge">
            <Sparkles size={17} />
          </span>
          <div>
            <div className="pb-modal__title">Request a playbook</div>
            <div className="pb-modal__sub">
              Tell us what you are testing. Testiez writes the playbook and publishes it
              to your catalog.
            </div>
          </div>
        </div>
      }
      footer={
        <div className="pb-modal__foot">
          <span className="pb-modal__hint">
            {title.trim() ? `Asking for “${title.trim()}”` : "One ask, three fields."}
          </span>
          <Button className="pb-btn" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            className="pb-btn"
            icon={<Send size={13} />}
            loading={saving}
            disabled={!title.trim()}
            onClick={submit}
          >
            Send request
          </Button>
        </div>
      }
    >
      <div className="pb-ask">
        <label className="pb-ask__field">
          <span className="pb-ask__label">
            <Layers size={13} />
            Feature
            <em>required</em>
          </span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Bulk import from CSV"
            maxLength={160}
            className="pb-ask__input"
            autoFocus
          />

          {alreadyCovered ? (
            <a
              className="pb-ask__note"
              href={`/qa-workspace/playbooks/${alreadyCovered.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <ArrowUpRight size={12} />
              The library already has “{alreadyCovered.name}” — open it before asking.
            </a>
          ) : featureSuggestions.length > 0 ? (
            <div className="pb-ask__suggest">
              <span className="pb-ask__suggestlabel">Often asked for</span>
              {featureSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pb-ask__chip ${title === s ? "is-on" : ""}`}
                  onClick={() => setTitle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </label>

        <label className="pb-ask__field">
          <span className="pb-ask__label">
            <Tags size={13} />
            Area
          </span>
          <Input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g., Data Management"
            maxLength={80}
            className="pb-ask__input"
          />
          <div className="pb-ask__suggest">
            <span className="pb-ask__suggestlabel">In your catalog</span>
            {areaSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={`pb-ask__chip ${area === s ? "is-on" : ""}`}
                onClick={() => setArea(area === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="pb-ask__help">
            An area that is not there yet is fine — that is often the point.
          </span>
        </label>

        <label className="pb-ask__field">
          <span className="pb-ask__label">
            <Sparkles size={13} />
            What your flow looks like
            <b className="pb-ask__count">{details.length}/2000</b>
          </span>
          <TextArea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Users upload a CSV, we validate row by row, partial failures are allowed…"
            autoSize={{ minRows: 4, maxRows: 10 }}
            maxLength={2000}
            className="pb-ask__input"
          />
          <span className="pb-ask__help">
            What the feature does, and where you expect it to break. This is what the
            playbook gets written from.
          </span>
        </label>
      </div>
    </Modal>
  );
}
