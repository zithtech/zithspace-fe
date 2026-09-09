"use client";

/**
 * Mapping playbooks into a collection — and putting them in order.
 *
 * ORDER IS THE PRODUCT, not a nicety. A collection answers "we build a lending
 * app, where do I start?", and the answer is a reading order: Auth, then
 * Payments, then Reconciliation. So this is a sortable list rather than a
 * multi-select, and position is the array index — the same thing the API
 * stores, so what the curator drags is exactly what a customer reads.
 *
 * The whole membership is saved in one request (PUT .../playbooks). Per-row
 * add/remove endpoints would have made every drag a network call and left the
 * list arguing with the server about order after a failed one.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Drawer, Input, Tooltip, message } from "antd";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Layers, Lock, X } from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
import type {
  CollectionDetail,
  CollectionMember,
  PlaybookSummary,
} from "@/components/qa/playbookShared";

/** One row of the working list: the playbook, plus why it is in this pack. */
interface Pick {
  playbookId: string;
  name: string;
  category: string;
  itemCount: number;
  locked: boolean;
  note: string;
}

function fromMember(m: CollectionMember): Pick {
  return {
    playbookId: m.id,
    name: m.name,
    category: m.category,
    itemCount: m.itemCount,
    locked: m.locked,
    note: m.note ?? "",
  };
}

function SortableRow({
  pick,
  index,
  total,
  onNote,
  onRemove,
  onMove,
}: {
  pick: Pick;
  index: number;
  total: number;
  onNote: (note: string) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pick.playbookId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: isDragging ? "relative" : undefined,
      }}
      className={`pbc-pick ${isDragging ? "is-dragging" : ""}`}
    >
      {/* The grip is the only drag handle: the note field below it has to stay
          selectable, and a whole-row handle would swallow every click into it. */}
      <span className="pbc-pick__grip" {...attributes} {...listeners} aria-label="Reorder">
        <GripVertical size={15} />
      </span>
      <span className="pbc-pick__no">{index + 1}</span>

      <div className="pbc-pick__body">
        <span className="pbc-pick__name">
          {pick.locked ? <Lock size={11} style={{ marginRight: 5 }} /> : null}
          {pick.name}
        </span>
        <Input
          className="pbc-pick__note"
          size="small"
          value={pick.note}
          maxLength={400}
          placeholder={`Why this is in the pack — optional`}
          onChange={(e) => onNote(e.target.value)}
        />
      </div>

      {/* Keyboard and trackpad users get the same reordering the grip gives a
          mouse. Cheap, and the only way this list is usable without dragging. */}
      <span className="pbc-pick__moves">
        <Tooltip title="Move up">
          <button
            type="button"
            className="pb-iconbtn"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move up"
          >
            <ChevronUp size={14} />
          </button>
        </Tooltip>
        <Tooltip title="Move down">
          <button
            type="button"
            className="pb-iconbtn"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Move down"
          >
            <ChevronDown size={14} />
          </button>
        </Tooltip>
        <Tooltip title="Remove from collection">
          <button
            type="button"
            className="pb-iconbtn"
            onClick={onRemove}
            aria-label="Remove from collection"
          >
            <X size={14} />
          </button>
        </Tooltip>
      </span>
    </div>
  );
}

export default function CollectionCurateDrawer({
  collection,
  open,
  onClose,
}: {
  collection: CollectionDetail;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [picks, setPicks] = useState<Pick[]>([]);

  /* Re-seed whenever the drawer opens, so a cancelled edit is genuinely
     cancelled rather than lingering as half-applied local state. */
  useEffect(() => {
    if (open) setPicks(collection.playbooks.map(fromMember));
  }, [open, collection.playbooks]);

  /* The whole library to pick from. `all=true` is what lets a curator assemble
     a pack out of playbooks that are still drafts — the API ignores it for
     anyone who is not a super_admin. */
  const { data, isLoading } = useQuery<{ playbooks: PlaybookSummary[] }>({
    queryKey: ["qa", "playbooks", "curate-source"],
    queryFn: () => axios.get("/api/v2/qa/playbooks?all=true"),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const chosen = useMemo(() => new Set(picks.map((p) => p.playbookId)), [picks]);

  const options = useMemo(
    () =>
      (data?.playbooks ?? []).map((p) => ({
        value: p.id,
        label: p.name,
        description: `${p.category} · ${p.itemCount} recommendations`,
      })),
    [data]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* The dropdown reports the whole selection, so this diffs rather than
     replaces: playbooks already in the list keep their position AND their note,
     and a newly ticked one lands at the end where the curator can move it. */
  const onSelectionChange = (value: string[]) => {
    const next = new Set(value);
    const kept = picks.filter((p) => next.has(p.playbookId));
    const keptIds = new Set(kept.map((p) => p.playbookId));
    const added = value
      .filter((id) => !keptIds.has(id))
      .map((id) => {
        const source = (data?.playbooks ?? []).find((p) => p.id === id);
        return {
          playbookId: id,
          name: source?.name ?? "Playbook",
          category: source?.category ?? "",
          itemCount: source?.itemCount ?? 0,
          locked: source?.locked ?? false,
          note: "",
        };
      });
    setPicks([...kept, ...added]);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPicks((prev) => {
      const from = prev.findIndex((p) => p.playbookId === active.id);
      const to = prev.findIndex((p) => p.playbookId === over.id);
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  };

  const save = useMutation({
    mutationFn: () =>
      axios.put(`/api/v2/qa/playbooks/collections/${collection.id}/playbooks`, {
        playbooks: picks.map((p) => ({
          playbook_id: p.playbookId,
          note: p.note.trim() ? p.note.trim() : null,
        })),
      }),
    onSuccess: (result: any) => {
      const rejected = result?.rejected?.length ?? 0;
      if (rejected > 0) {
        message.warning(
          `Saved ${result.playbookCount} playbooks. ${rejected} could not be added to this collection.`
        );
      } else {
        message.success(
          picks.length === 0
            ? "Collection emptied"
            : `${picks.length} playbook${picks.length === 1 ? "" : "s"} mapped, in order`
        );
      }
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
      queryClient.invalidateQueries({ queryKey: ["qa", "playbooks"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not save the collection"
      );
    },
  });

  const totalItems = picks.reduce((sum, p) => sum + p.itemCount, 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={null}
      closable={false}
      styles={{ body: { padding: 0 } }}
      className="pb-gen"
      footer={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ marginRight: "auto", fontSize: 11.5, color: "var(--text-slate-400)" }}>
            {picks.length} playbook{picks.length === 1 ? "" : "s"} · {totalItems} recommendations
          </span>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={() => save.mutate()}>
            Save order
          </Button>
        </div>
      }
    >
      <div className="pbc-curate__head">
        <span className="pbc-card__av">
          <Layers size={16} />
        </span>
        <div className="pbc-curate__headtext">
          <div className="pbc-curate__title">{collection.name}</div>
          <div className="pbc-curate__sub">
            Pick the playbooks, then drag them into the order they should be read
          </div>
        </div>
      </div>

      <div className="pbc-curate__body">
        <SearchableDropdown
          mode="multiple"
          renderTags={false}
          value={picks.map((p) => p.playbookId)}
          onChange={onSelectionChange}
          options={options}
          loading={isLoading}
          placeholder="Add playbooks to this collection"
          searchPlaceholder="Search the library…"
          itemNoun="playbooks"
          width="100%"
          style={{ width: "100%" }}
        />

        {picks.length === 0 ? (
          <div className="pbc-curate__empty">
            Nothing in this collection yet. Pick playbooks above — the order you put
            them in is the order a customer reads them.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={picks.map((p) => p.playbookId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="pbc-list">
                {picks.map((pick, index) => (
                  <SortableRow
                    key={pick.playbookId}
                    pick={pick}
                    index={index}
                    total={picks.length}
                    onNote={(note) =>
                      setPicks((prev) =>
                        prev.map((p) => (p.playbookId === pick.playbookId ? { ...p, note } : p))
                      )
                    }
                    onRemove={() =>
                      setPicks((prev) => prev.filter((p) => p.playbookId !== pick.playbookId))
                    }
                    onMove={(delta) =>
                      setPicks((prev) => {
                        const to = index + delta;
                        if (to < 0 || to >= prev.length) return prev;
                        return arrayMove(prev, index, to);
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </Drawer>
  );
}
