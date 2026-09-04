"use client";

/**
 * Requested Playbooks — the demand side of the catalog.
 *
 * Every workspace sees its own asks and where each one has got to. Testiez sees
 * all of them, and moves them along: planned → published, or declined with a
 * reason the asking workspace reads here.
 *
 * Separate from /playbooks/requests, which is the premium ACCESS queue. The two
 * look similar and are answered completely differently — one by granting a row,
 * this one by sitting down and authoring a playbook.
 */

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Drawer, Input, Tooltip, message } from "antd";
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  Inbox,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import dayjs from "dayjs";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import RequestPlaybookDrawer from "@/components/qa/RequestPlaybookDrawer";
import { PLAYBOOK_STYLES } from "@/components/qa/playbookShared";

interface PlaybookRequest {
  id: string;
  title: string;
  category: string | null;
  details: string | null;
  status: string;
  decision_note: string | null;
  created_at: string;
  playbook_id: string | null;
  playbook_slug: string | null;
  playbook_name: string | null;
  tenant_name: string | null;
  tenant_subdomain: string | null;
  requested_by_name: string | null;
}

const STATUSES = ["pending", "planned", "published", "declined", "all"];

/** What each state means to the workspace that asked, in their words. */
const STATUS_COPY: Record<string, string> = {
  pending: "Waiting on Testiez",
  planned: "Accepted — on the list to write",
  published: "Written and in your catalog",
  declined: "Not something the library will cover",
};

export default function RequestedPlaybooksPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "RequestedPlaybooks" });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { canReadCase } = usePermission();

  const [status, setStatus] = useState("all");
  const [askOpen, setAskOpen] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [openRequest, setOpenRequest] = useState<PlaybookRequest | null>(null);

  /* canPublish rides on the catalog endpoint every reader may call — the same
     flag that decides whether this page shows one workspace or all of them. */
  const { data: catalog } = useQuery<{ canPublish: boolean }>({
    queryKey: ["qa", "playbooks", "catalog"],
    queryFn: () => axios.get("/api/v2/qa/playbooks?all=true"),
    enabled: canReadCase,
    staleTime: 5 * 60 * 1000,
  });
  const isAdmin = catalog?.canPublish ?? false;

  /* Two endpoints rather than a `mine` flag: "only my workspace" is not
     something a tenant should be able to drop from a query string. */
  const { data, isLoading } = useQuery<PlaybookRequest[]>({
    queryKey: ["qa", "playbooks", "requested", isAdmin, status],
    queryFn: () =>
      axios.get(
        isAdmin
          ? `/api/v2/qa/playbooks/admin/playbook-requests?status=${status}`
          : `/api/v2/qa/playbooks/requests${status === "all" ? "" : `?status=${status}`}`
      ),
    enabled: canReadCase,
  });

  const requests = data ?? [];

  /* The drawer holds a row, not an id, so after a decision it would still be
     showing the old status. Re-read it from the refreshed list instead. */
  const detail = useMemo(
    () => (openRequest ? requests.find((r) => r.id === openRequest.id) ?? openRequest : null),
    [openRequest, requests]
  );

  const workspaceOf = (request: PlaybookRequest) =>
    request.tenant_name || request.tenant_subdomain || "Unknown workspace";

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of requests) map[r.status] = (map[r.status] ?? 0) + 1;
    return map;
  }, [requests]);

  const setRequestStatus = async (id: string, next: string) => {
    try {
      setDeciding(id);
      await axios.post(`/api/v2/qa/playbooks/admin/playbook-requests/${id}`, {
        status: next,
        note: note.trim() || null,
      });
      message.success(`Marked ${next}`);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
    } catch (err: any) {
      message.error(
        err?.response?.data?.error || err?.message || "Could not update the request"
      );
    } finally {
      setDeciding(null);
    }
  };

  if (!canReadCase) {
    return (
      <MainLayout>
        <NoData
          title="No access to QA Playbooks"
          description="You need test case read access to open the playbook library."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          <div className="pb-hero">
            <span className="pb-hero__badge">
              <Sparkles size={18} />
            </span>
            <div className="pb-hero__text">
              <h1 className="pb-hero__title">Requested Playbooks</h1>
              <p className="pb-hero__sub">
                {isAdmin
                  ? "What every workspace has asked the library to cover. Plan it, publish it, or say why not — they read your note here."
                  : "What your workspace has asked Testiez to write, and where each ask has got to."}
              </p>
            </div>
            <div className="pb-hero__stats">
              <div className="pb-hero__stat">
                <Inbox size={14} />
                <b>{requests.length}</b>
                <span>{requests.length === 1 ? "request" : "requests"}</span>
              </div>
              <div className="pb-hero__stat">
                <Clock size={14} />
                <b>{counts.pending ?? 0}</b>
                <span>waiting</span>
              </div>
            </div>
          </div>

          <div className="pb-toolbar">
            <div className="pb-pills">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pb-pill ${status === s ? "is-on" : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div className="pb-toolbar__actions">
              <Button
                className="pb-btn"
                icon={<Inbox size={14} />}
                onClick={() => router.push("/qa-workspace/playbooks")}
              >
                Playbooks
              </Button>
              <Button
                type="primary"
                className="pb-btn"
                icon={<Send size={14} />}
                onClick={() => setAskOpen(true)}
              >
                Request playbook
              </Button>
            </div>
          </div>

          <div className="dh-main-scroll">
            <ZukvoLoadingOverlay loading={isLoading} minHeight={320}>
              {isLoading ? null : requests.length === 0 ? (
                <NoData
                  title="No requests yet"
                  description={
                    isAdmin
                      ? "No workspace has asked for a playbook with this status."
                      : "Ask for a playbook and it shows up here with its progress."
                  }
                />
              ) : (
                <>
                  {isAdmin && (
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note recorded with the next update — the asking workspace reads it"
                      className="pb-search is-wide"
                      style={{ marginBottom: 12, width: 520, maxWidth: "100%" }}
                    />
                  )}

                  <div className="pb-reqlist">
                    {requests.map((request) => (
                      <article
                        key={request.id}
                        className="pb-req is-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenRequest(request)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenRequest(request);
                          }
                        }}
                      >
                        <div className="pb-req__top">
                          <span className={`pb-req__dot is-${request.status}`} />
                          <div className="pb-req__id">
                            <span className="pb-req__title">{request.title}</span>
                            <span className="pb-req__meta">
                              {request.category ? `${request.category} · ` : ""}
                              asked {dayjs(request.created_at).format("D MMM YYYY")}
                              {request.requested_by_name ? ` · ${request.requested_by_name}` : ""}
                            </span>
                          </div>

                          {/* Who is asking is the first thing Testiez needs off a
                              queue of these, so it is a chip rather than a word in
                              the meta line. */}
                          <span className="pb-req__ws" title={workspaceOf(request)}>
                            <span className="pb-req__wsav">
                              {workspaceOf(request).slice(0, 2).toUpperCase()}
                            </span>
                            {workspaceOf(request)}
                          </span>

                          <span className={`pb-req__status is-${request.status}`}>
                            {request.status}
                          </span>
                        </div>

                        {request.details && <p className="pb-req__body">{request.details}</p>}

                        <div className="pb-req__foot">
                          <span className="pb-req__state">
                            {STATUS_COPY[request.status] ?? request.status}
                            {request.decision_note ? ` — ${request.decision_note}` : ""}
                          </span>

                          {request.playbook_slug && (
                            <button
                              type="button"
                              className="pb-req__open"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/qa-workspace/playbooks/${request.playbook_slug}`
                                );
                              }}
                            >
                              Open {request.playbook_name}
                              <ArrowUpRight size={13} />
                            </button>
                          )}

                          {isAdmin && (
                            <div
                              className="pb-req__actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {request.status !== "planned" && request.status !== "published" && (
                                <Tooltip title="Accepted, on the list to write">
                                  <Button
                                    size="small"
                                    className="pb-btn"
                                    loading={deciding === request.id}
                                    onClick={() => setRequestStatus(request.id, "planned")}
                                  >
                                    Plan it
                                  </Button>
                                </Tooltip>
                              )}
                              {request.status !== "published" && (
                                <Button
                                  size="small"
                                  type="primary"
                                  className="pb-btn"
                                  icon={<Check size={13} />}
                                  loading={deciding === request.id}
                                  onClick={() => setRequestStatus(request.id, "published")}
                                >
                                  Published
                                </Button>
                              )}
                              {request.status !== "declined" && (
                                <Button
                                  size="small"
                                  className="pb-btn"
                                  icon={<X size={13} />}
                                  loading={deciding === request.id}
                                  onClick={() => setRequestStatus(request.id, "declined")}
                                >
                                  Decline
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>

      <RequestPlaybookDrawer
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onSubmitted={() =>
          queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "requested"] })
        }
      />

      {/* The whole ask, unabridged: the card is a summary, and the detail — who
          asked, from which workspace, in their own words — is what a decision
          gets made on. */}
      <Drawer
        open={!!detail}
        onClose={() => setOpenRequest(null)}
        width={520}
        className="pb-reqdrawer"
        title={
          detail ? (
            <div className="pb-reqdrawer__head">
              <span className={`pb-req__dot is-${detail.status}`} />
              <div>
                <div className="pb-reqdrawer__title">{detail.title}</div>
                <div className="pb-reqdrawer__sub">
                  {STATUS_COPY[detail.status] ?? detail.status}
                </div>
              </div>
              <span className={`pb-req__status is-${detail.status}`}>{detail.status}</span>
            </div>
          ) : null
        }
        footer={
          detail && isAdmin ? (
            <div className="pb-reqdrawer__foot">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note the workspace will read"
                className="pb-search"
                style={{ width: "100%", marginBottom: 8 }}
              />
              <div className="pb-reqdrawer__actions">
                {detail.status !== "planned" && detail.status !== "published" && (
                  <Button
                    className="pb-btn"
                    loading={deciding === detail.id}
                    onClick={() => setRequestStatus(detail.id, "planned")}
                  >
                    Plan it
                  </Button>
                )}
                {detail.status !== "declined" && (
                  <Button
                    className="pb-btn"
                    icon={<X size={13} />}
                    loading={deciding === detail.id}
                    onClick={() => setRequestStatus(detail.id, "declined")}
                  >
                    Decline
                  </Button>
                )}
                {detail.status !== "published" && (
                  <Button
                    type="primary"
                    className="pb-btn"
                    icon={<Check size={13} />}
                    loading={deciding === detail.id}
                    onClick={() => setRequestStatus(detail.id, "published")}
                  >
                    Mark published
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {detail && (
          <div className="pb-reqdetail">
            <div className="pb-reqdetail__who">
              <span className="pb-reqdetail__av">
                {workspaceOf(detail).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="pb-reqdetail__ws">
                  <Building2 size={12} />
                  {workspaceOf(detail)}
                  {detail.tenant_subdomain && detail.tenant_name
                    ? ` · ${detail.tenant_subdomain}`
                    : ""}
                </div>
                <div className="pb-reqdetail__by">
                  <User size={12} />
                  {detail.requested_by_name || "Someone in that workspace"} · asked{" "}
                  {dayjs(detail.created_at).format("D MMM YYYY, h:mm A")}
                </div>
              </div>
            </div>

            <dl className="pb-reqdetail__grid">
              <div>
                <dt>Area</dt>
                <dd>{detail.category || "Not given"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{STATUS_COPY[detail.status] ?? detail.status}</dd>
              </div>
            </dl>

            <section className="pb-reqdetail__block">
              <h4>What they build</h4>
              <p>{detail.details || "No description was given with this request."}</p>
            </section>

            {detail.decision_note && (
              <section className="pb-reqdetail__block">
                <h4>Note from Testiez</h4>
                <p>{detail.decision_note}</p>
              </section>
            )}

            {detail.playbook_slug && (
              <Button
                className="pb-btn"
                icon={<ArrowUpRight size={14} />}
                onClick={() =>
                  router.push(`/qa-workspace/playbooks/${detail.playbook_slug}`)
                }
              >
                Open {detail.playbook_name}
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </MainLayout>
  );
}
