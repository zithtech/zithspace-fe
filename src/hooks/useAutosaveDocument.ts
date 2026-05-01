"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { documentHubService as DocumentHubService } from "@/services/documentHub";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type SaveStatus =
  | "idle" // no edits, no pending save (= "Saved")
  | "dirty" // edits exist, debounce/max-wait will fire
  | "saving" // request in flight
  | "error" // save failed after retries — manual retry needed
  | "conflict"; // 409 from server — another session updated the doc

export interface AutosaveControls {
  status: SaveStatus;
  /** Last successful save time (ms epoch) — null if never saved this session. */
  lastSavedAt: number | null;
  /** Most recent error message, when status === "error". */
  errorMessage: string | null;
  /** Manual flush — used by "Save now" button. */
  flushNow: () => Promise<void>;
  /** Retry after an error. */
  retry: () => void;
  /** Recovery banner state when a localStorage draft is newer than the server. */
  recovery:
    | { available: false }
    | {
        available: true;
        savedAt: number;
        restore: () => void;
        discard: () => void;
      };
  /** Conflict banner state when the server returned 409. */
  conflict:
    | { active: false }
    | {
        active: true;
        reload: () => void;
      };
  /** Mark the editor content as changed — wire to the editor's onChange. */
  notifyChange: () => void;
  /**
   * Re-snapshot the current editor content as the "last saved" state. Call
   * this after a programmatic content load (e.g. switching documents,
   * restoring a version) so the spurious onChange that BlockNote fires after
   * `replaceBlocks` doesn't trigger an autosave that overwrites the just-
   * loaded content.
   */
  resync: (version?: number | null) => void;
  /**
   * Open a "programmatic-update" window: suppresses notifyChange for ~1s.
   * Call this BEFORE running `editor.replaceBlocks(...)` so the onChange that
   * BlockNote fires synchronously inside replaceBlocks is dropped instead of
   * triggering an autosave + localStorage draft write. Pair with `resync()`
   * after the load to snapshot the new content.
   */
  beginProgrammaticUpdate: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Tunables                                                                  */
/* -------------------------------------------------------------------------- */

const DEBOUNCE_MS = 1500;
const MAX_WAIT_MS = 10_000;
const LOCAL_DRAFT_THROTTLE_MS = 1000;
const RETRY_DELAYS_MS = [1000, 3000, 7000]; // exponential-ish, jittered ±20%
const RETRY_JITTER = 0.2;

const draftKey = (documentId: string) => `documenthub:draft:${documentId}`;

/* -------------------------------------------------------------------------- */
/*  Stable hash (FNV-1a 32-bit)                                               */
/* -------------------------------------------------------------------------- */

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
}

function hashContent(blocks: any): string {
  // Cost is paid only when we're about to save — never per keystroke.
  try {
    return fnv1a(JSON.stringify(blocks)).toString(16);
  } catch {
    return String(Date.now());
  }
}

/* -------------------------------------------------------------------------- */
/*  Error classification                                                      */
/* -------------------------------------------------------------------------- */

function isRetriableError(err: any): boolean {
  // Network / no response → retry
  if (!err?.response) return true;
  const status = err.response.status as number;
  if (status === 429 || status >= 500) return true;
  return false;
}

function isConflictError(err: any): boolean {
  return err?.response?.status === 409;
}

/* -------------------------------------------------------------------------- */
/*  Local draft (throttled)                                                   */
/* -------------------------------------------------------------------------- */

interface LocalDraft {
  blocks: any;
  savedAt: number;
  baseVersion: number | null;
}

function readDraft(documentId: string): LocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(documentId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalDraft;
  } catch {
    return null;
  }
}

function writeDraft(documentId: string, draft: LocalDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftKey(documentId), JSON.stringify(draft));
  } catch (err) {
    // Quota exceeded or storage disabled — skip silently. Server save is still
    // the source of truth; the local draft is purely a recovery aid.
    console.warn("[autosave] failed to write local draft", err);
  }
}

function clearDraft(documentId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(documentId));
  } catch {
    /* noop */
  }
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

interface Args {
  editor: BlockNoteEditor | null;
  documentId: string | null;
  /** Server's current version when the doc was loaded. Re-keyed when doc changes. */
  initialVersion: number | null;
  /** Server's `updatedAt` when the doc was loaded — used for recovery comparison. */
  initialUpdatedAt: string | null;
  /** Whether the editor is editable (skip autosave in preview / version-preview). */
  enabled: boolean;
  /**
   * Called after a successful save with the freshly-saved server document so
   * the host can update its React Query cache, refetch history, etc.
   */
  onSaved?: (updated: any) => void;
}

export function useAutosaveDocument({
  editor,
  documentId,
  initialVersion,
  initialUpdatedAt,
  enabled,
  onSaved,
}: Args): AutosaveControls {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryAvailable, setRecoveryAvailable] = useState<{
    savedAt: number;
    blocks: any;
  } | null>(null);
  const [conflictActive, setConflictActive] = useState(false);

  // --- refs (not state) — these never need to trigger re-render ---------------
  const dirtyRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localPendingRef = useRef(false);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const lastSavedHashRef = useRef<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const documentIdRef = useRef<string | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  // notifyChange ignores onChange events that fire before this timestamp.
  // BlockNote fires onChange when replaceBlocks runs programmatically; without
  // this guard those spurious changes get treated as real user edits and
  // trigger autosaves that overwrite the just-loaded content.
  const suppressUntilRef = useRef(0);
  // Halts performSave when a 409 has been received until the user reloads.
  const conflictRef = useRef(false);

  const setSuppressFor = (ms: number) => {
    const next = Date.now() + ms;
    if (next > suppressUntilRef.current) suppressUntilRef.current = next;
  };

  // Always-fresh refs for callbacks
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  /* --- timer cleanup ------------------------------------------------------ */
  const clearAllTimers = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    if (localThrottleTimerRef.current) clearTimeout(localThrottleTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    debounceTimerRef.current = null;
    maxWaitTimerRef.current = null;
    localThrottleTimerRef.current = null;
    retryTimerRef.current = null;
  }, []);

  /* --- per-document init: reset all state when the doc changes ------------ */
  useEffect(() => {
    clearAllTimers();
    documentIdRef.current = documentId;
    versionRef.current = initialVersion ?? null;
    dirtyRef.current = false;
    inFlightRef.current = false;
    queuedRef.current = false;
    retryAttemptRef.current = 0;
    localPendingRef.current = false;
    conflictRef.current = false;
    // Suppress notifyChange for ~1.5s while the editor receives the new
    // content. The workspace will replaceBlocks shortly after this effect, and
    // BlockNote's onChange must not be treated as a real edit.
    setSuppressFor(1500);
    setStatus("idle");
    setErrorMessage(null);
    setConflictActive(false);
    setLastSavedAt(null);

    // Snapshot the just-loaded content so we can detect no-op saves.
    if (editorRef.current) {
      try {
        lastSavedHashRef.current = hashContent(editorRef.current.document);
      } catch {
        lastSavedHashRef.current = null;
      }
    } else {
      lastSavedHashRef.current = null;
    }

    // Recovery check: is there a local draft newer than the server snapshot?
    if (documentId) {
      const draft = readDraft(documentId);
      const serverTs = initialUpdatedAt
        ? new Date(initialUpdatedAt).getTime()
        : 0;
      if (draft && draft.blocks && draft.savedAt > serverTs + 1000) {
        setRecoveryAvailable({ savedAt: draft.savedAt, blocks: draft.blocks });
      } else {
        setRecoveryAvailable(null);
        // Stale draft (server is newer) — drop it.
        if (draft) clearDraft(documentId);
      }
    } else {
      setRecoveryAvailable(null);
    }

    return () => clearAllTimers();
  }, [documentId, initialVersion, initialUpdatedAt, clearAllTimers]);

  /* --- the actual network call ------------------------------------------- */
  const performSave = useCallback(async (): Promise<void> => {
    const ed = editorRef.current;
    const docId = documentIdRef.current;
    if (!ed || !docId || !enabledRef.current) return;
    // Once we've raised a conflict, do not keep firing PUTs — the only valid
    // recovery is the user reloading.
    if (conflictRef.current) return;
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    if (!dirtyRef.current) return;

    // Snapshot content + hash AT FIRE TIME (not at debounce-start time) — this
    // is the rule from the plan: queued saves use the latest snapshot.
    const blocks = ed.document;
    const hash = hashContent(blocks);
    if (lastSavedHashRef.current && lastSavedHashRef.current === hash) {
      // No real change — clear dirty + go idle.
      dirtyRef.current = false;
      setStatus("idle");
      return;
    }

    inFlightRef.current = true;
    setStatus("saving");

    const expectedVersion = versionRef.current;

    try {
      const updated = await DocumentHubService.updateDocument(docId, {
        content: blocks,
        expectedVersion: expectedVersion ?? undefined,
      });

      // Success — promote snapshot, bump version, clear local draft.
      lastSavedHashRef.current = hash;
      if (updated && typeof updated.version === "number") {
        versionRef.current = updated.version;
      } else if (versionRef.current !== null) {
        versionRef.current = versionRef.current + 1;
      }
      retryAttemptRef.current = 0;
      clearDraft(docId);

      // Did the user type *during* this request? If so, stay dirty so the
      // next debounce cycle picks it up.
      const stillDirty = hashContent(ed.document) !== hash;
      dirtyRef.current = stillDirty;
      setLastSavedAt(Date.now());
      setStatus(stillDirty ? "dirty" : "idle");
      setErrorMessage(null);
      onSavedRef.current?.(updated);

      // Drain queued save if one was requested mid-flight.
      inFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        // Reschedule to next tick so we don't blow the call stack on rapid edits.
        setTimeout(() => {
          void performSave();
        }, 0);
      }
    } catch (err: any) {
      inFlightRef.current = false;
      queuedRef.current = false;

      if (isConflictError(err)) {
        conflictRef.current = true;
        // Stop any pending timers so we don't keep retrying.
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        debounceTimerRef.current = null;
        maxWaitTimerRef.current = null;
        retryTimerRef.current = null;
        setConflictActive(true);
        setStatus("conflict");
        setErrorMessage(
          "This document was modified by another session. Reload to see the latest version.",
        );
        return;
      }

      if (isRetriableError(err)) {
        // Don't retry if the user has typed since — let the next debounce save
        // it with the newer content. Just transition back to dirty.
        if (dirtyRef.current && retryAttemptRef.current === 0) {
          setStatus("dirty");
          // Schedule a fresh debounced save attempt
          scheduleDebouncedSave();
          return;
        }

        if (retryAttemptRef.current < RETRY_DELAYS_MS.length) {
          const base = RETRY_DELAYS_MS[retryAttemptRef.current];
          const jitter = base * RETRY_JITTER * (Math.random() * 2 - 1);
          const delay = Math.max(500, Math.round(base + jitter));
          retryAttemptRef.current += 1;
          setStatus("dirty");
          setErrorMessage(
            `Save failed — retrying in ${(delay / 1000).toFixed(1)}s (attempt ${retryAttemptRef.current}/${RETRY_DELAYS_MS.length})…`,
          );
          retryTimerRef.current = setTimeout(() => {
            dirtyRef.current = true;
            void performSave();
          }, delay);
          return;
        }
      }

      // Non-retriable or retries exhausted.
      retryAttemptRef.current = 0;
      setStatus("error");
      setErrorMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Save failed. Click retry to try again.",
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- timers ------------------------------------------------------------- */
  const scheduleMaxWait = useCallback(() => {
    if (maxWaitTimerRef.current) return; // already scheduled
    maxWaitTimerRef.current = setTimeout(() => {
      maxWaitTimerRef.current = null;
      // Clear any pending debounce so we don't double-fire.
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      void performSave();
    }, MAX_WAIT_MS);
  }, [performSave]);

  const scheduleDebouncedSave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      // Cancel max-wait — debounce won the race.
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
        maxWaitTimerRef.current = null;
      }
      void performSave();
    }, DEBOUNCE_MS);
  }, [performSave]);

  /* --- onChange entry point ---------------------------------------------- */
  const notifyChange = useCallback(() => {
    if (!enabledRef.current || !documentIdRef.current || !editorRef.current) {
      return;
    }
    // Drop spurious onChange events that fire while the editor is being
    // populated programmatically (replaceBlocks, version restore, etc.).
    if (Date.now() < suppressUntilRef.current) return;
    // Halt all autosave activity once a conflict has been raised — the user
    // must reload before any further writes are safe.
    if (conflictRef.current) return;
    dirtyRef.current = true;
    if (status !== "saving" && status !== "conflict" && status !== "error") {
      setStatus("dirty");
    }
    // Throttled local-draft write — fires immediately on first edit, then at
    // most once per LOCAL_DRAFT_THROTTLE_MS while edits keep coming. This is
    // the safety net against tab crash / network failure.
    if (!localThrottleTimerRef.current) {
      const docId = documentIdRef.current;
      const blocks = editorRef.current.document;
      writeDraft(docId, {
        blocks,
        savedAt: Date.now(),
        baseVersion: versionRef.current,
      });
      localThrottleTimerRef.current = setTimeout(() => {
        localThrottleTimerRef.current = null;
        if (localPendingRef.current) {
          localPendingRef.current = false;
          if (documentIdRef.current && editorRef.current) {
            writeDraft(documentIdRef.current, {
              blocks: editorRef.current.document,
              savedAt: Date.now(),
              baseVersion: versionRef.current,
            });
          }
        }
      }, LOCAL_DRAFT_THROTTLE_MS);
    } else {
      localPendingRef.current = true;
    }

    scheduleDebouncedSave();
    scheduleMaxWait();
  }, [scheduleDebouncedSave, scheduleMaxWait, status]);

  /* --- flush triggers ---------------------------------------------------- */
  const flushNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  // Save when tab is hidden (mobile / background tab eviction).
  useEffect(() => {
    if (!enabled || !documentId) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        void flushNow();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, documentId, flushNow]);

  // beforeunload — best-effort. The local draft is the real safety net.
  useEffect(() => {
    if (!enabled || !documentId) return;
    const onUnload = () => {
      if (dirtyRef.current && editorRef.current && documentIdRef.current) {
        // Persist to localStorage synchronously — this WILL run even when the
        // network call gets killed.
        writeDraft(documentIdRef.current, {
          blocks: editorRef.current.document,
          savedAt: Date.now(),
          baseVersion: versionRef.current,
        });
      }
    };
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("pagehide", onUnload);
    };
  }, [enabled, documentId]);

  /* --- programmatic resync (post-load) ---------------------------------- */
  const resync = useCallback((version?: number | null) => {
    const ed = editorRef.current;
    if (!ed) return;
    // Extend the suppress window so any onChange that fires *after* resync
    // (BlockNote may fire it on a microtask / next render) is still ignored.
    setSuppressFor(500);
    // Snapshot the now-loaded content as the "last saved" baseline, clear any
    // dirty/queued state from the spurious onChange that BlockNote fires after
    // replaceBlocks, and stop pending timers so we don't autosave the just-
    // loaded content as if it were a user edit.
    try {
      lastSavedHashRef.current = hashContent(ed.document);
    } catch {
      lastSavedHashRef.current = null;
    }
    if (typeof version === "number") versionRef.current = version;
    dirtyRef.current = false;
    queuedRef.current = false;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
    // We're now back in sync with the server — drop any stale localStorage
    // draft so the recovery banner doesn't surface on the next visit.
    if (documentIdRef.current) clearDraft(documentIdRef.current);
    setStatus((prev) => (prev === "saving" ? prev : "idle"));
  }, []);

  /* --- programmatic-update guard (pre-load) ------------------------------ */
  const beginProgrammaticUpdate = useCallback(() => {
    // 1s window covers the synchronous onChange fired inside replaceBlocks
    // plus any microtask / next-render onChange BlockNote may emit later.
    setSuppressFor(1000);
  }, []);

  /* --- error retry (manual) --------------------------------------------- */
  const retry = useCallback(() => {
    if (status !== "error") return;
    retryAttemptRef.current = 0;
    setErrorMessage(null);
    // Clear conflict guard if it was set (it shouldn't be in 'error', but be
    // defensive) so the retry actually fires.
    conflictRef.current = false;
    dirtyRef.current = true;
    setStatus("dirty");
    void performSave();
  }, [status, performSave]);

  /* --- recovery banner actions ------------------------------------------ */
  const restore = useCallback(() => {
    const ed = editorRef.current;
    if (!ed || !recoveryAvailable) return;
    try {
      ed.replaceBlocks(ed.document, recoveryAvailable.blocks);
      dirtyRef.current = true;
      setStatus("dirty");
      scheduleDebouncedSave();
      scheduleMaxWait();
    } catch (err) {
      console.error("[autosave] failed to restore draft", err);
    }
    setRecoveryAvailable(null);
  }, [recoveryAvailable, scheduleDebouncedSave, scheduleMaxWait]);

  const discard = useCallback(() => {
    if (documentIdRef.current) clearDraft(documentIdRef.current);
    setRecoveryAvailable(null);
  }, []);

  /* --- conflict banner action ------------------------------------------- */
  const reload = useCallback(() => {
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  /* --- assemble controls ------------------------------------------------- */
  return {
    status,
    lastSavedAt,
    errorMessage,
    flushNow,
    retry,
    recovery: recoveryAvailable
      ? {
          available: true,
          savedAt: recoveryAvailable.savedAt,
          restore,
          discard,
        }
      : { available: false },
    conflict: conflictActive ? { active: true, reload } : { active: false },
    notifyChange,
    resync,
    beginProgrammaticUpdate,
  };
}
