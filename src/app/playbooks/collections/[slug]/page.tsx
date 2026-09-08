"use client";

/**
 * One collection — the pack, in the order it should be read.
 *
 * A numbered list rather than a grid, because the order IS the content: a
 * customer who does not know where to start is being told where to start. The
 * curator's note on each row says why that playbook earns its place in THIS
 * pack, which is a different answer per pack for the same playbook.
 */

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button, Tooltip, message } from "antd";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Layers,
  ListOrdered,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import NoData from "@/components/common/NoData";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import CollectionCurateDrawer from "@/components/qa/CollectionCurateDrawer";
import CollectionFormModal from "@/components/qa/CollectionFormModal";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import {
  COLLECTION_KIND_LABELS,
  PLAYBOOK_STYLES,
  type CollectionDetail,
} from "@/components/qa/playbookShared";

export default function CollectionDetailPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "Playbook Collection" });

  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { canReadPlaybook } = usePermission();
  const slug = String(params?.slug ?? "");

  const [curating, setCurating] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, isLoading, isError } = useQuery<CollectionDetail>({
    queryKey: ["qa", "collections", "detail", slug],
    queryFn: () => axios.get(`/api/v2/qa/playbooks/collections/${slug}`),
    enabled: canReadPlaybook && Boolean(slug),
    staleTime: 60 * 1000,
  });

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      axios.post(`/api/v2/qa/playbooks/collections/${data?.id}/status`, { status }),
    onSuccess: (_r, status) => {
      message.success(status === "published" ? "Collection is live" : "Collection unpublished");
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not change the status"
      );
    },
  });

  /**
   * Ask for a premium pack.
   *
   * The page is readable either way — what an unlock buys is the BODIES of the
   * playbooks inside, not the list of them. See migration 007.
   */
  const requestAccess = useMutation({
    mutationFn: () =>
      axios.post(`/api/v2/qa/playbooks/collections/${slug}/unlock-request`, {}),
    onSuccess: () => {
      message.success("Access requested — Testiez will come back to you");
      queryClient.invalidateQueries({ queryKey: ["qa", "collections", "detail", slug] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || err?.message || "Could not send the request");
    },
  });

  const remove = useMutation({
    mutationFn: () => axios.delete(`/api/v2/qa/playbooks/collections/${data?.id}`),
    onSuccess: () => {
      message.success("Collection moved to Trash");
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
      router.push("/playbooks/collections");
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || err?.message || "Could not delete it");
    },
  });

  if (!canReadPlaybook) {
    return (
      <MainLayout>
        <NoData
          title="No access to collections"
          description="You need test playbook read access to open the playbook library."
        />
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <ZukvoLoadingOverlay loading minHeight={320}>
          <div />
        </ZukvoLoadingOverlay>
      </MainLayout>
    );
  }

  if (isError || !data) {
    return (
      <MainLayout>
        <NoData
          title="Collection not found"
          description="It may have been unpublished, or the link is out of date."
        />
      </MainLayout>
    );
  }

  const canCurate = data.canCurate;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: PLAYBOOK_STYLES }} />

      <div className="dh-shell">
        <main className="dh-main">
          <div className="sc-header">
            <Button
              type="text"
              icon={<ArrowLeft size={15} />}
              onClick={() => router.push("/playbooks/collections")}
            >
              Collections
            </Button>
            <div className="sc-header-right">
              {/* Premium and not bought. The pack still reads — this is the way
                  to ask for the playbooks inside it. */}
              {data.locked &&
                (data.pendingRequest ? (
                  <Button icon={<Check size={14} />} disabled>
                    Access requested
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<Lock size={14} />}
                    loading={requestAccess.isPending}
                    onClick={() => requestAccess.mutate()}
                  >
                    Request access
                  </Button>
                ))}

              {canCurate && (
                <>
                  <Tooltip title="Edit name, kind and summary">
                    <Button icon={<Pencil size={14} />} onClick={() => setEditing(true)} />
                  </Tooltip>
                  <ConfirmDialog
                    tone="danger"
                    title="Delete this collection?"
                    description={`"${data.name}" is removed from the shelf. The playbooks in it are library entries and are left untouched.`}
                    confirmText="Delete"
                    onConfirm={() => remove.mutate()}
                  >
                    <Tooltip title="Delete">
                      <Button danger icon={<Trash2 size={14} />} loading={remove.isPending} />
                    </Tooltip>
                  </ConfirmDialog>
                  <Button icon={<ListOrdered size={14} />} onClick={() => setCurating(true)}>
                    Map playbooks
                  </Button>
                  <Button
                    type="primary"
                    loading={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(data.status === "published" ? "draft" : "published")
                    }
                  >
                    {data.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="pb-hero">
            <span className="pb-hero__badge">
              <CollectionIcon name={data.icon} size={18} />
            </span>
            <div className="pb-hero__text">
              <h1 className="pb-hero__title">{data.name}</h1>
              <p className="pb-hero__sub">
                {data.industry || COLLECTION_KIND_LABELS[data.kind]}
                {data.pinned ? " · Yours" : ""}
                {data.summary ? ` · ${data.summary}` : ""}
              </p>
            </div>
            <div className="pb-hero__stats">
              <span className="pb-hero__stat">
                <b>{data.playbookCount}</b>
                <span>Playbooks</span>
              </span>
              <span className="pb-hero__stat">
                <b>{data.itemCount}</b>
                <span>Recommendations</span>
              </span>
            </div>
          </div>

          <div className="dh-main-scroll">
            {data.description ? (
              <p
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.65,
                  color: "var(--text-slate-500)",
                  margin: "0 0 16px",
                  maxWidth: 760,
                  whiteSpace: "pre-wrap",
                }}
              >
                {data.description}
              </p>
            ) : null}

            {data.locked && (
              <div className="pbc-ask" style={{ marginBottom: 16 }}>
                <span className="pb-hero__badge">
                  <Lock size={17} />
                </span>
                <div className="pbc-ask__text">
                  <div className="pbc-ask__title">This pack is premium</div>
                  <div className="pbc-ask__sub">
                    The reading list below is yours to browse. Unlocking the pack opens the
                    full recommendations in every playbook it holds — including any added
                    to it later.
                  </div>
                </div>
              </div>
            )}

            {data.playbooks.length === 0 ? (
              <NoData
                title="Nothing mapped yet"
                description={
                  canCurate
                    ? "Use “Map playbooks” to pick the playbooks for this collection and put them in reading order."
                    : "This collection has not been filled in yet."
                }
              />
            ) : (
              <div className="pbc-list">
                {data.playbooks.map((playbook, index) => (
                  <button
                    key={playbook.id}
                    type="button"
                    className="pbc-row"
                    onClick={() => router.push(`/playbooks/${playbook.slug}`)}
                  >
                    {/* Position first: it is the reason the list is ordered. */}
                    <span className="pbc-row__no">{index + 1}</span>
                    <span className="pbc-row__body">
                      <span className="pbc-row__name">
                        {playbook.locked ? <Lock size={12} /> : null}
                        {playbook.name}
                      </span>
                      <span className="pbc-row__sub">
                        {playbook.category}
                        {playbook.summary ? ` · ${playbook.summary}` : ""}
                      </span>
                      {playbook.note ? (
                        <span className="pbc-row__note">{playbook.note}</span>
                      ) : null}
                    </span>
                    <span className="pbc-row__meta">
                      <BookOpen size={13} />
                      {playbook.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CollectionCurateDrawer
        collection={data}
        open={curating}
        onClose={() => {
          setCurating(false);
          queryClient.invalidateQueries({ queryKey: ["qa", "collections", "detail", slug] });
        }}
      />

      <CollectionFormModal
        collection={editing ? data : null}
        open={editing}
        canCurate={canCurate}
        onClose={() => setEditing(false)}
        onSaved={(nextSlug) => {
          queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
          // The slug follows the name, so an edited name means a new URL.
          if (nextSlug && nextSlug !== slug) {
            router.replace(`/playbooks/collections/${nextSlug}`);
          }
        }}
      />
    </MainLayout>
  );
}
