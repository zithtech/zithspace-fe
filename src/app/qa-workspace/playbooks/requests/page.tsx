"use client";

/**
 * Access requests for premium playbooks — Testiez staff only.
 *
 * Approving writes the unlock row that makes the playbook readable for that
 * workspace. When real payment lands it writes the same row, so this screen
 * stays the manual path rather than becoming dead code.
 *
 * The OTHER queue — "there is nothing for the feature we build, write one" —
 * lives at /qa-workspace/playbooks/requested. They look alike and are answered
 * completely differently: one by granting a row, the other by authoring.
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

export default function PlaybookRequestsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "PlaybookRequests" });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { canReadCase } = usePermission();

  const [status, setStatus] = useState("pending");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading, error } = useQuery<UnlockRequest[]>({
    queryKey: ["qa", "playbooks", "requests", "access", status],
    queryFn: () => axios.get(`/api/v2/qa/playbooks/admin/unlock-requests?status=${status}`),
    enabled: canReadCase,
  });

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
  if (error) {
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
                onClick={() => router.push("/qa-workspace/playbooks")}
              >
                Playbooks
              </Button>
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
            <ZukvoLoadingOverlay loading={isLoading} minHeight={320}>
              {isLoading ? null : (data ?? []).length === 0 ? (
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
                          <a
                            onClick={() =>
                              router.push(`/qa-workspace/playbooks/${row.playbook_slug}`)
                            }
                          >
                            {value}
                          </a>
                        ),
                      },
                      {
                        title: "Workspace",
                        render: (_: any, row) => row.tenant_name || row.tenant_subdomain || "—",
                      },
                      { title: "Requested by", dataIndex: "requested_by_name", render: (v) => v || "—" },
                      { title: "Message", dataIndex: "message", render: (v) => v || "—" },
                      {
                        title: "Price",
                        render: (_: any, row) =>
                          row.price_credits != null
                            ? `${row.price_credits} credits`
                            : row.price_amount != null
                            ? `${row.price_currency} ${row.price_amount}`
                            : "On request",
                      },
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
                </>
              )}
            </ZukvoLoadingOverlay>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
