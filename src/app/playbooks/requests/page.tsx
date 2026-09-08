"use client";

/**
 * Access requests for premium playbooks AND for premium collections — Testiez
 * staff only.
 *
 * Approving writes the unlock row that makes the content readable for that
 * workspace. When real payment lands it writes the same row, so this screen
 * stays the manual path rather than becoming dead code.
 *
 * ONE SCREEN, TWO SCOPES. A playbook unlock and a collection unlock are the
 * same job — someone asked for access, an admin grants or declines it — and the
 * only differences are which table the row lands in and what a grant covers. A
 * second page would have been the same table with one column renamed, and the
 * queue is meant to be somewhere you clear, not somewhere you navigate.
 *
 * A COLLECTION GRANT IS WIDER THAN IT LOOKS: it opens every playbook in the
 * pack, including any added to it later. The column that says how many says so.
 *
 * The OTHER queue — "there is nothing for the feature we build, write one" —
 * lives at /playbooks/requested. It looks alike and is answered completely
 * differently: one by granting a row, the other by authoring.
 */

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, Input, Table, Tag, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import dayjs from "dayjs";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import { PLAYBOOK_STYLES } from "@/components/qa/playbookShared";

interface UnlockRequest {
  id: string;
  playbook_name: string;
  playbook_slug: string;
  tenant_name: string | null;
  tenant_subdomain: string | null;
  requested_by_name: string | null;
  message: string | null;
  status: string;
  created_at: string;
  price_credits: number | null;
  price_amount: string | null;
  price_currency: string;
}

/** The collection queue's row. Same job, camelCase from its own repo. */
interface CollectionUnlockRequest {
  id: string;
  collectionName: string;
  collectionSlug: string;
  tenantName: string | null;
  tenantSubdomain: string | null;
  requestedByName: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  priceCredits: number | null;
  priceAmount: string | null;
  priceCurrency: string;
}

type Scope = "playbooks" | "collections";

/** Both queues price the same way, so both render it the same way. */
function priceText(row: {
  priceCredits?: number | null;
  priceAmount?: string | null;
  priceCurrency?: string;
  price_credits?: number | null;
  price_amount?: string | null;
  price_currency?: string;
}) {
  const credits = row.priceCredits ?? row.price_credits;
  const amount = row.priceAmount ?? row.price_amount;
  const currency = row.priceCurrency ?? row.price_currency ?? "USD";
  if (credits != null) return `${credits} credits`;
  if (amount != null) return `${currency} ${amount}`;
  return "On request";
}

export default function PlaybookRequestsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "PlaybookRequests" });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { canReadCase } = usePermission();

  const [scope, setScope] = useState<Scope>("playbooks");
  const [status, setStatus] = useState("pending");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading, error } = useQuery<UnlockRequest[]>({
    queryKey: ["qa", "playbooks", "requests", "access", status],
    queryFn: () => axios.get(`/api/v2/qa/playbooks/admin/unlock-requests?status=${status}`),
    enabled: canReadCase && scope === "playbooks",
  });

  const {
    data: collectionData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery<{ requests: CollectionUnlockRequest[] }>({
    queryKey: ["qa", "collections", "requests", "access", status],
    queryFn: () =>
      axios.get(`/api/v2/qa/playbooks/collections/admin/unlock-requests?status=${status}`),
    enabled: canReadCase && scope === "collections",
  });

  const decideCollection = async (id: string, decision: "approved" | "declined") => {
    try {
      setDeciding(id);
      await axios.post(`/api/v2/qa/playbooks/collections/admin/unlock-requests/${id}`, {
        decision,
        note: note.trim() || null,
      });
      message.success(
        decision === "approved"
          ? "Pack granted — every playbook in it is now open for that workspace"
          : "Request declined"
      );
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["qa", "collections", "requests"] });
    } catch (err: any) {
      message.error(err?.message || "Could not record the decision");
    } finally {
      setDeciding(null);
    }
  };

  const loading = scope === "playbooks" ? isLoading : collectionsLoading;
  const rows =
    scope === "playbooks" ? data ?? [] : collectionData?.requests ?? [];

  const decide = async (id: string, decision: "approved" | "declined") => {
    try {
      setDeciding(id);
      await axios.post(`/api/v2/qa/playbooks/admin/unlock-requests/${id}`, {
        decision,
        note: note.trim() || null,
      });
      message.success(decision === "approved" ? "Access granted" : "Request declined");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks", "requests"] });
    } catch (err: any) {
      message.error(err?.message || "Could not record the decision");
    } finally {
      setDeciding(null);
    }
  };

  // The API returns 403 for anyone who is not Testiez staff.
  if (error || collectionsError) {
    return (
      <MainLayout>
        <NoData
          title="Restricted"
          description="Access requests are reviewed by Testiez administrators."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          <div className="saas-header-container sc-header">
            <div className="sc-header-controls">
              <Button
                type="text"
                size="small"
                icon={<ArrowLeft size={15} />}
                onClick={() => router.push("/playbooks")}
              >
                Playbooks
              </Button>
              <div className="pb-pills">
                {(["playbooks", "collections"] as Scope[]).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    className={`pb-pill ${scope === sc ? "is-on" : ""}`}
                    onClick={() => setScope(sc)}
                  >
                    {sc === "playbooks" ? "Playbooks" : "Collections"}
                  </button>
                ))}
              </div>
              <div className="pb-pills">
                {["pending", "approved", "declined", "all"].map((s) => (
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
            </div>

          </div>

          <div className="dh-main-scroll">
            <ZukvoLoadingOverlay loading={loading} minHeight={320}>
              {loading ? null : rows.length === 0 ? (
                <NoData
                  title="No requests"
                  description={
                    status === "pending"
                      ? "Nothing is waiting on a decision."
                      : "No requests with this status."
                  }
                />
              ) : (
                <>
                  {status === "pending" && (
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note recorded with the next decision"
                      style={{ maxWidth: 460, marginBottom: 12, borderRadius: 0 }}
                    />
                  )}

                  {scope === "playbooks" ? (
                    <Table<UnlockRequest>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={data}
                      columns={[
                        {
                          title: "Playbook",
                          dataIndex: "playbook_name",
                          render: (value: string, row) => (
                            <a onClick={() => router.push(`/playbooks/${row.playbook_slug}`)}>
                              {value}
                            </a>
                          ),
                        },
                        {
                          title: "Workspace",
                          render: (_: any, row) => row.tenant_name || row.tenant_subdomain || "—",
                        },
                        {
                          title: "Requested by",
                          dataIndex: "requested_by_name",
                          render: (v) => v || "—",
                        },
                        { title: "Message", dataIndex: "message", render: (v) => v || "—" },
                        { title: "Price", render: (_: any, row) => priceText(row) },
                        {
                          title: "Asked",
                          dataIndex: "created_at",
                          render: (v: string) => dayjs(v).format("D MMM YYYY"),
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          render: (v: string) => (
                            <Tag
                              color={
                                v === "approved" ? "green" : v === "declined" ? "default" : "blue"
                              }
                            >
                              {v}
                            </Tag>
                          ),
                        },
                        {
                          title: "",
                          render: (_: any, row) =>
                            row.status !== "pending" ? null : (
                              <div style={{ display: "flex", gap: 6 }}>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<Check size={13} />}
                                  loading={deciding === row.id}
                                  onClick={() => decide(row.id, "approved")}
                                >
                                  Grant
                                </Button>
                                <Button
                                  size="small"
                                  icon={<X size={13} />}
                                  loading={deciding === row.id}
                                  onClick={() => decide(row.id, "declined")}
                                >
                                  Decline
                                </Button>
                              </div>
                            ),
                        },
                      ]}
                    />
                  ) : (
                    <Table<CollectionUnlockRequest>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={collectionData?.requests ?? []}
                      columns={[
                        {
                          title: "Collection",
                          dataIndex: "collectionName",
                          render: (value: string, row) => (
                            <a
                              onClick={() =>
                                router.push(`/playbooks/collections/${row.collectionSlug}`)
                              }
                            >
                              {value}
                            </a>
                          ),
                        },
                        {
                          title: "Workspace",
                          render: (_: any, row) => row.tenantName || row.tenantSubdomain || "—",
                        },
                        {
                          title: "Requested by",
                          dataIndex: "requestedByName",
                          render: (v) => v || "—",
                        },
                        { title: "Message", dataIndex: "message", render: (v) => v || "—" },
                        { title: "Price", render: (_: any, row) => priceText(row) },
                        {
                          title: "Asked",
                          dataIndex: "createdAt",
                          render: (v: string) => dayjs(v).format("D MMM YYYY"),
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          render: (v: string) => (
                            <Tag
                              color={
                                v === "approved" ? "green" : v === "declined" ? "default" : "blue"
                              }
                            >
                              {v}
                            </Tag>
                          ),
                        },
                        {
                          title: "",
                          render: (_: any, row) =>
                            row.status !== "pending" ? null : (
                              <div style={{ display: "flex", gap: 6 }}>
                                {/* "Grant pack" rather than "Grant": this opens
                                    every playbook inside it, now and later. */}
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<Check size={13} />}
                                  loading={deciding === row.id}
                                  onClick={() => decideCollection(row.id, "approved")}
                                >
                                  Grant pack
                                </Button>
                                <Button
                                  size="small"
                                  icon={<X size={13} />}
                                  loading={deciding === row.id}
                                  onClick={() => decideCollection(row.id, "declined")}
                                >
                                  Decline
                                </Button>
                              </div>
                            ),
                        },
                      ]}
                    />
                  )}
                </>
              )}
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
