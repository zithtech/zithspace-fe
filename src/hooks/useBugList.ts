import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import BugListService, {
  BugConfigCreateInput,
  BugConfigUpdateInput,
  BugListFilters,
  BugSheetStatus,
  BugStatus,
  BulkConvertGroup,
  CreateBugInput,
  UpdateBugInput,
} from "@/services/bugListService";

export const bugKeys = {
  all: ["bug-list"] as const,
  folders: () => [...bugKeys.all, "folders"] as const,
  sheets: (folderId: string) => [...bugKeys.all, "sheets", folderId] as const,
  bugLists: () => [...bugKeys.all, "bugs"] as const,
  bugList: (filters: BugListFilters) => [...bugKeys.bugLists(), filters] as const,
  bug: (id: string) => [...bugKeys.all, "bug", id] as const,
};

// ==================== Folders ====================
export const useBugFolders = (projectId?: string) =>
  useQuery({
    queryKey: projectId ? [...bugKeys.folders(), projectId] : bugKeys.folders(),
    queryFn: () => BugListService.getFolders(projectId),
    staleTime: 60 * 1000,
  });

export const useCreateBugFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: BugListService.createFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Folder created");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBugFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof BugListService.updateFolder>[1] }) =>
      BugListService.updateFolder(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Folder updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useDeleteBugFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all }); 
      message.success("Folder moved to trash");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useArchivedFolders = () =>
  useQuery({
    queryKey: [...bugKeys.all, "archived-folders"] as const,
    queryFn: () => BugListService.getArchivedFolders(),
    staleTime: 60 * 1000,
  });

export const useTrashedFolders = () =>
  useQuery({
    queryKey: [...bugKeys.all, "trashed-folders"] as const,
    queryFn: () => BugListService.getTrashedFolders(),
    staleTime: 30 * 1000,
  });

export const useTrashedSheets = (folderId?: string) =>
  useQuery({
    queryKey: [...bugKeys.all, "trashed-sheets", folderId || "all"] as const,
    queryFn: () => BugListService.getTrashedSheets(folderId),
    staleTime: 60 * 1000,
  });

export const useArchiveFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.archiveFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Folder archived");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useRestoreFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.restoreFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Folder restored");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const usePermanentDeleteFolder = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.permanentDeleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Folder permanently deleted");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkRestoreFolders = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (folderIds: string[]) => BugListService.bulkRestoreFolders(folderIds),
    onSuccess: ({ restored }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${restored} folder(s) restored`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkPermanentDeleteFolders = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (folderIds: string[]) => BugListService.bulkPermanentDeleteFolders(folderIds),
    onSuccess: ({ deleted }) => {
      qc.invalidateQueries({ queryKey: [...bugKeys.all, "trashed-folders"] });
      message.success(`${deleted} folder(s) permanently deleted`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== Sheets ====================
export const useBugSheets = (folderId: string | null) =>
  useQuery({
    queryKey: bugKeys.sheets(folderId || ""),
    queryFn: () => BugListService.getSheets(folderId as string),
    enabled: !!folderId,
    staleTime: 60 * 1000,
  });

export const useProjectSheets = (projectId: string | null) =>
  useQuery({
    queryKey: ["bug-list", "sheets", "project", projectId],
    queryFn: () => BugListService.getProjectSheets(projectId!),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

export const useArchivedSheets = (folderId?: string) =>
  useQuery({
    queryKey: [...bugKeys.all, "archived-sheets", folderId || "all"] as const,
    queryFn: () => BugListService.getArchivedSheets(folderId),
    staleTime: 60 * 1000,
  });

export const useCreateBugSheet = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: BugListService.createSheet,
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Sheet created");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBugSheet = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof BugListService.updateSheet>[1] }) =>
      BugListService.updateSheet(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Sheet updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBugSheetStatus = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BugSheetStatus }) =>
      BugListService.updateSheetStatus(id, status),
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      const statusMessages = {
        active: "Sheet reopened",
        current: "Sheet marked as current", 
        completed: "Sheet marked as completed",
        archived: "Sheet moved to archive",
      };
      const statusKey = status as keyof typeof statusMessages;
      message.success(statusMessages[statusKey] || "Sheet updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useDeleteBugSheet = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.deleteSheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      qc.invalidateQueries({ queryKey: [...bugKeys.all, "trashed-sheets"] });
      qc.invalidateQueries({ queryKey: [...bugKeys.all, "archived-sheets"] });
      message.success("Sheet moved to trash");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useRestoreSheet = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.restoreSheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Sheet restored");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const usePermanentDeleteSheet = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.permanentDeleteSheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Sheet permanently deleted");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkRestoreSheets = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (sheetIds: string[]) => BugListService.bulkRestoreSheets(sheetIds),
    onSuccess: ({ restored }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${restored} sheet(s) restored`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkPermanentDeleteSheets = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (sheetIds: string[]) => BugListService.bulkPermanentDeleteSheets(sheetIds),
    onSuccess: ({ deleted }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${deleted} sheet(s) permanently deleted`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== Bugs ====================
export const useBugs = (filters: BugListFilters) =>
  useQuery({
    queryKey: bugKeys.bugList(filters),
    queryFn: () => BugListService.listBugs(filters),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });

export const useBug = (id: string) =>
  useQuery({
    queryKey: bugKeys.bug(id),
    queryFn: () => BugListService.getBug(id),
    enabled: !!id,
  });

export const useCreateBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (input: CreateBugInput) => BugListService.createBug(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug captured");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBugInput }) =>
      BugListService.updateBug(id, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useDeleteBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.deleteBug(id),
    onSuccess: (_, bugId) => {
      // Immediately remove the deleted bug from ALL cached bug list queries
      // (including the archived view) so it doesn't reappear on navigation.
      qc.setQueriesData({ queryKey: bugKeys.bugLists() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          bugs: (old.bugs ?? []).filter((b: any) => b.id !== bugId),
          pagination: old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? 0) - 1) }
            : old.pagination,
        };
      });
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug moved to trash");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const usePermanentDeleteBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.permanentDeleteBug(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug permanently deleted");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useRestoreBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.restoreBug(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug restored");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkUpdateBugStatus = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ bugIds, status }: { bugIds: string[]; status: BugStatus }) =>
      BugListService.bulkUpdateStatus(bugIds, status),
    onSuccess: ({ updated }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${updated} bug(s) updated`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkDeleteBugs = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugIds: string[]) => BugListService.bulkDelete(bugIds),
    onSuccess: ({ movedToTrash }, bugIds) => {
      const idSet = new Set(bugIds);
      // Immediately remove from all cached bug list queries
      qc.setQueriesData({ queryKey: bugKeys.bugLists() }, (old: any) => {
        if (!old) return old;
        const filtered = (old.bugs ?? []).filter((b: any) => !idSet.has(b.id));
        return {
          ...old,
          bugs: filtered,
          pagination: old.pagination
            ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? 0) - (old.bugs?.length - filtered.length)) }
            : old.pagination,
        };
      });
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${movedToTrash} bug(s) moved to trash`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkPermanentDeleteBugs = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugIds: string[]) => BugListService.bulkPermanentDelete(bugIds),
    onSuccess: ({ deleted }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${deleted} bug(s) permanently deleted`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkRestoreBugs = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugIds: string[]) => BugListService.bulkRestore(bugIds),
    onSuccess: ({ restored }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${restored} bug(s) restored`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkMoveBugs = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ bugIds, targetSheetId }: { bugIds: string[]; targetSheetId: string }) =>
      BugListService.bulkMove(bugIds, targetSheetId),
    onSuccess: ({ moved }) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success(`${moved} bug(s) moved`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== Stats ====================
export const useBugStats = (params: {
  folderId?: string;
  sheetId?: string;
  scope?: "all" | "mine" | "trash" | "archived";
  projectId?: string;
}) =>
  useQuery({
    queryKey: [...bugKeys.all, "stats", params] as const,
    queryFn: () => BugListService.getStats(params),
    staleTime: 30 * 1000,
  });

// ==================== AI ====================
export const useAiReviewBugs = () => {
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugIds: string[]) => BugListService.aiReview(bugIds),
    onError: (err: Error) => message.error(err.message),
  });
};

export const useAiSuggestGroups = () => {
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugIds: string[]) => BugListService.aiSuggestGroups(bugIds),
    onError: (err: Error) => message.error(err.message),
  });
};

export const useBulkConvertBugsToTickets = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (groups: BulkConvertGroup[]) =>
      BugListService.bulkConvertToTickets(groups),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      message.success(`${created.length} ticket(s) created`);
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== QA verify ====================
export const useVerifyBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugId: string) => BugListService.verify(bugId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug verified");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useReopenBug = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (bugId: string) => BugListService.reopen(bugId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugKeys.all });
      message.success("Bug reopened");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== Config: Severity options ====================
export const severityKeys = {
  all: ["bug-list", "config", "severities"] as const,
};

export const useBugSeverityOptions = () =>
  useQuery({
    queryKey: severityKeys.all,
    queryFn: () => BugListService.listSeverityOptions(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateBugSeverity = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (input: BugConfigCreateInput) =>
      BugListService.createSeverityOption(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: severityKeys.all });
      message.success("Severity created");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBugSeverity = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BugConfigUpdateInput }) =>
      BugListService.updateSeverityOption(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: severityKeys.all });
      message.success("Severity updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useDeleteBugSeverity = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.deleteSeverityOption(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: severityKeys.all });
      message.success("Severity deleted");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

// ==================== Config: Type options ====================
export const bugTypeKeys = {
  all: ["bug-list", "config", "types"] as const,
};

export const useBugTypeOptions = () =>
  useQuery({
    queryKey: bugTypeKeys.all,
    queryFn: () => BugListService.listTypeOptions(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateBugType = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (input: BugConfigCreateInput) =>
      BugListService.createTypeOption(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugTypeKeys.all });
      message.success("Type created");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useUpdateBugType = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BugConfigUpdateInput }) =>
      BugListService.updateTypeOption(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugTypeKeys.all });
      message.success("Type updated");
    },
    onError: (err: Error) => message.error(err.message),
  });
};

export const useDeleteBugType = () => {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id: string) => BugListService.deleteTypeOption(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bugTypeKeys.all });
      message.success("Type deleted");
    },
    onError: (err: Error) => message.error(err.message),
  });
};
