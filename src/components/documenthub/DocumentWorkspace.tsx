'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
    ChevronRight,
    ChevronDown,
    FileText,
    Folder,
    Clock,
    Search,
    Plus,
    PanelLeftClose,
    PanelLeft,
    Share2,
    History,
    MoreHorizontal,
    Trash,
    ArrowLeft,
    BookOpen,
    Circle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import DocumentEditor, { ViewMode } from '@/components/common/DocumentEditor'
import MainLayout from '@/components/layout/MainLayout'
import { useDocumentHub, globalDataKeys } from '@/hooks/useGlobalData'
import { DocumentTreeNode } from '@/services/documentHub'
import { Modal, Form, Input, Dropdown, MenuProps, Button, message, Segmented, Drawer, Tooltip } from 'antd'
import { documentHubService as DocumentHubService } from '@/services/documentHub'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { EditOutlined, EyeOutlined, SaveOutlined, SplitCellsOutlined, FullscreenOutlined, FullscreenExitOutlined, ExportOutlined, ThunderboltOutlined } from '@ant-design/icons'
import DocumentHistory from '@/components/common/DocumentHistory'
import ShareModal from '@/components/documenthub/ShareModal'
import AiEditDocModal from '@/components/documenthub/AiEditDocModal'
import { useAutosaveDocument } from '@/hooks/useAutosaveDocument'

interface TreeItem extends DocumentTreeNode {
    children?: TreeItem[]
}

function TreeNode({
    item,
    selectedId,
    onSelect,
    expandedIds,
    onToggleExpand,
    onAddNode,
    onRenameNode,
    onDeleteDocument,
    draggedNodeId,
    dropTargetId,
    onDragStartNode,
    onDragEndNode,
    onDragOverNode,
    onDragLeaveNode,
    onDropNode,
    isDescendantOfDragged,
}: {
    item: TreeItem
    selectedId: string
    onSelect: (id: string) => void
    expandedIds: Set<string>
    onToggleExpand: (id: string) => void
    onAddNode: (parentId: string, type: 'file' | 'folder') => void
    onRenameNode: (id: string, newTitle: string) => void
    onDeleteDocument: (id: string, type: 'file' | 'folder' | 'section', documentId?: string) => void
    draggedNodeId: string | null
    dropTargetId: string | 'root' | null
    onDragStartNode: (id: string) => void
    onDragEndNode: () => void
    onDragOverNode: (e: React.DragEvent, id: string) => void
    onDragLeaveNode: (id: string) => void
    onDropNode: (e: React.DragEvent, id: string) => void
    /** True when this subtree contains the node being dragged. */
    isDescendantOfDragged: boolean
}) {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedIds.has(item.id)
    const isSelected = selectedId === item.id

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(item.title);

    const handleRename = () => {
        if (editTitle.trim() !== item.title) {
            onRenameNode(item.id, editTitle);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setEditTitle(item.title);
            setIsEditing(false);
        }
    };

    const menuItems: MenuProps['items'] = [
        {
            key: 'add-folder',
            label: 'Add Folder',
            icon: <Folder className="w-4 h-4" />,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onAddNode(item.id, 'folder');
            }
        },
        {
            key: 'add-file',
            label: 'Add File',
            icon: <FileText className="w-4 h-4" />,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onAddNode(item.id, 'file');
            }
        },
        {
            key: 'delete-node',
            label: 'Delete',
            icon: <Trash className="w-4 h-4 text-red-500" />,
            danger: true,
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onDeleteDocument(item.id, item.type as 'file' | 'folder' | 'section', item.documentId || undefined);
            }
        }
    ];

    const isBeingDragged = draggedNodeId === item.id;
    const isDropHere = dropTargetId === item.id;
    // Files can't be drop targets — only folders/sections accept children.
    const canBeDropTarget =
        !!draggedNodeId &&
        draggedNodeId !== item.id &&
        !isDescendantOfDragged &&
        item.type !== 'file';

    return (
        <div>
            <div
                draggable={!isEditing}
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                    onDragStartNode(item.id);
                }}
                onDragEnd={(e) => {
                    e.stopPropagation();
                    onDragEndNode();
                }}
                onDragOver={(e) => {
                    if (!canBeDropTarget) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    onDragOverNode(e, item.id);
                }}
                onDragLeave={(e) => {
                    e.stopPropagation();
                    onDragLeaveNode(item.id);
                }}
                onDrop={(e) => {
                    if (!canBeDropTarget) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onDropNode(e, item.id);
                }}
                className="group relative flex items-center gap-1.5 pl-2.5 pr-1.5 py-[7px] cursor-pointer rounded-lg text-[13px] transition-all duration-150"
                style={{
                    backgroundColor: isDropHere
                        ? 'var(--bg-blue-50)'
                        : isSelected
                            ? 'var(--bg-slate-50)'
                            : 'transparent',
                    color: isSelected ? 'var(--text-slate-900)' : 'var(--text-slate-700)',
                    fontWeight: isSelected ? 500 : 400,
                    boxShadow: isDropHere
                        ? 'inset 0 0 0 1.5px var(--text-blue-700)'
                        : isSelected
                            ? 'inset 2px 0 0 var(--text-blue-700)'
                            : 'none',
                    opacity: isBeingDragged ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!isSelected && !isDropHere) e.currentTarget.style.backgroundColor = 'var(--bg-slate-50)';
                }}
                onMouseLeave={(e) => {
                    if (!isSelected && !isDropHere) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                    if (hasChildren) {
                        onToggleExpand(item.id)
                    }
                    onSelect(item.id)
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
            >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    {hasChildren ? (
                        <button
                            className="p-0.5 rounded transition-colors"
                            style={{ color: 'var(--text-slate-400)' }}
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleExpand(item.id)
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                            )}
                        </button>
                    ) : (
                        <span className="w-[18px]" />
                    )}

                    {item.type === 'file' ? (
                        <FileText className="w-[15px] h-[15px] shrink-0" style={{ color: isSelected ? 'var(--text-blue-700)' : 'var(--text-slate-400)' }} />
                    ) : item.type === 'folder' ? (
                        <Folder className="w-[15px] h-[15px] shrink-0" style={{ color: isSelected ? 'var(--text-blue-700)' : 'var(--text-slate-400)' }} />
                    ) : (
                        <Clock className="w-[15px] h-[15px] shrink-0" style={{ color: 'var(--text-slate-400)' }} />
                    )}

                    {isEditing ? (
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 text-xs"
                        />
                    ) : (
                        <Tooltip title={item.title} placement="right" mouseEnterDelay={0.5}>
                            <span
                                className={`truncate min-w-0 ${item.type === 'section' ? 'text-[11px] font-semibold uppercase tracking-[0.08em]' : ''}`}
                                style={{ color: item.type === 'section' ? 'var(--text-slate-400)' : 'inherit' }}
                            >
                                {item.title}
                            </span>
                        </Tooltip>
                    )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <div
                            className="p-1 rounded-md flex items-center justify-center transition-colors"
                            style={{ color: 'var(--text-slate-400)' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-slate-100)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
                        </div>
                    </Dropdown>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-[15px] pl-1.5" style={{ borderLeft: '1px solid var(--border-slate-200)' }}>
                    {item.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            item={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            onAddNode={onAddNode}
                            onRenameNode={onRenameNode}
                            onDeleteDocument={onDeleteDocument}
                            draggedNodeId={draggedNodeId}
                            dropTargetId={dropTargetId}
                            onDragStartNode={onDragStartNode}
                            onDragEndNode={onDragEndNode}
                            onDragOverNode={onDragOverNode}
                            onDragLeaveNode={onDragLeaveNode}
                            onDropNode={onDropNode}
                            isDescendantOfDragged={isDescendantOfDragged || isBeingDragged}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*  Save status pill — driven by the autosave hook's state machine.           */
/* -------------------------------------------------------------------------- */

function formatRelative(ts: number | null): string {
    if (!ts) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString();
}

function SaveStatusPill({
    status,
    lastSavedAt,
    errorMessage,
    onRetry,
}: {
    status: 'idle' | 'dirty' | 'saving' | 'error' | 'conflict';
    lastSavedAt: number | null;
    errorMessage: string | null;
    onRetry: () => void;
}) {
    // Re-render the relative time once a minute so "Saved 5m ago" stays current.
    const [, force] = useState(0);
    useEffect(() => {
        if (status !== 'idle' || !lastSavedAt) return;
        const t = setInterval(() => force((n) => n + 1), 30_000);
        return () => clearInterval(t);
    }, [status, lastSavedAt]);

    const base =
        'inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-medium';

    if (status === 'saving') {
        return (
            <span
                className={base}
                style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)' }}
            >
                <span
                    className="w-2 h-2 rounded-full"
                    style={{
                        border: '1.5px solid currentColor',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                Saving…
            </span>
        );
    }

    if (status === 'dirty') {
        return (
            <span
                className={base}
                style={{ background: 'var(--bg-orange-50)', color: '#f59e0b' }}
            >
                <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
                {errorMessage ? errorMessage : 'Unsaved'}
            </span>
        );
    }

    if (status === 'error') {
        return (
            <span
                className={base}
                style={{ background: 'var(--bg-red-50)', color: 'var(--text-leave)' }}
            >
                <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
                {errorMessage || 'Save failed'}
                <button
                    onClick={onRetry}
                    className="ml-1 underline"
                    style={{ color: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                    Retry
                </button>
            </span>
        );
    }

    if (status === 'conflict') {
        return (
            <span
                className={base}
                style={{ background: 'var(--bg-red-50)', color: 'var(--text-leave)' }}
            >
                <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
                Conflict — reload required
            </span>
        );
    }

    // idle
    return (
        <span
            className={base}
            style={{ background: 'var(--bg-green-50)', color: 'var(--text-holiday)' }}
        >
            <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
            {lastSavedAt ? `Saved ${formatRelative(lastSavedAt)}` : 'Saved'}
        </span>
    );
}

interface DocumentWorkspaceProps {
    documentId: string;
}

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_WIDTH_STORAGE_KEY = 'documenthub:sidebarWidth';

export default function DocumentWorkspace({ documentId }: DocumentWorkspaceProps) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState('api-ref')
    const [searchValue, setSearchValue] = useState('')
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [sidebarWidth, setSidebarWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);

    // Load persisted sidebar width
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY) : null;
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!Number.isNaN(parsed) && parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
                setSidebarWidth(parsed);
            }
        }
    }, []);

    // Drag-to-resize handler
    useEffect(() => {
        if (!isResizing) return;
        const handleMove = (e: MouseEvent) => {
            const next = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX));
            setSidebarWidth(next);
        };
        const handleUp = () => {
            setIsResizing(false);
            try {
                window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
            } catch { }
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isResizing, sidebarWidth]);
    const [viewMode, setViewMode] = useState<ViewMode>("edit");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [previewVersion, setPreviewVersion] = useState<any | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isAiEditOpen, setIsAiEditOpen] = useState(false);
    // AI toggle for the Create-Folder/File modal
    const [useAiInAddModal, setUseAiInAddModal] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);

    // Add Node State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addNodeParentId, setAddNodeParentId] = useState<string | null>(null);
    const [addNodeType, setAddNodeType] = useState<'file' | 'folder'>('folder');
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const form = Form.useForm()[0];
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const lastSavedVersionRef = useRef<number | null>(null);
    const hasInitialLoadRef = useRef(false);

    // Fetch selected document content
    const { data: docData, isLoading: isDocumentLoading, refetch: refetchDocument } = useQuery({
        queryKey: ['document', selectedDoc],
        queryFn: () => DocumentHubService.getDocument(selectedDoc),
        enabled: !!selectedDoc && selectedDoc !== 'api-ref', // Don't fetch if placeholder
    });

    const [isEditingHubName, setIsEditingHubName] = useState(false);
    const [hubName, setHubName] = useState('');

    const { data: documentHub, isLoading: documentHubLoading, refetch: refetchHub } = useDocumentHub(documentId)

    useEffect(() => {
        if (documentHub?.name) {
            setHubName(documentHub.name);
        }
    }, [documentHub?.name]);

    // Sync lastSavedVersionRef with the loaded document's version
    useEffect(() => {
        if (docData && typeof (docData as any).version === 'number') {
            lastSavedVersionRef.current = (docData as any).version;
        }
    }, [docData]);

    // Fetch document history
    const { data: documentHistory = [], isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['documentHistory', selectedDoc],
        queryFn: () => DocumentHubService.getDocumentHistory(selectedDoc),
        enabled: !!selectedDoc && selectedDoc !== 'api-ref' && isHistoryOpen,
        refetchOnMount: 'always', // Ensure fresh history
    });

    // Initialize editor
    const editor = useCreateBlockNote({
        initialContent: undefined, // We'll handle content updates via useEffect
        uploadFile: async (file: File) => {
            try {
                // Convert to base64
                const base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                });

                // Use the API client to upload
                const { api } = await import('@/lib/axios');
                const res = await api.post("/api/tickets/upload-image", {
                    image: base64Image,
                });
                return res.url;
            } catch (error) {
                console.error("Failed to upload image:", error);
                messageApi.error("Failed to upload image");
                return ""; // Return empty string on failure as per BlockNote expectations
            }
        }
    });

    // Headless editor used only to convert AI HTML output into BlockNote blocks
    // when creating a new file via Zai.
    const aiParserEditor = useCreateBlockNote();

    // Autosave: debounced save + max-wait + localStorage draft + version
    // optimistic-locking. Disabled while previewing a historical version.
    const autosave = useAutosaveDocument({
        editor,
        documentId: selectedDoc && selectedDoc !== 'api-ref' ? selectedDoc : null,
        initialVersion:
            docData && typeof (docData as any).version === 'number'
                ? (docData as any).version
                : null,
        initialUpdatedAt: (docData as any)?.updatedAt ?? null,
        enabled: !previewVersion,
        onSaved: (updated: any) => {
            // Push the freshly-saved row directly into the React Query cache
            // for this document. Without this, navigating away and back would
            // serve the stale cached snapshot before a refetch lands, so the
            // user's just-saved edits would appear to be missing.
            if (updated && updated.id) {
                lastSavedVersionRef.current = updated.version;
                queryClient.setQueryData(['document', updated.id], updated);
            }
            if (isHistoryOpen) refetchHistory();
        },
    });
    const {
        status: saveStatus,
        lastSavedAt,
        errorMessage: saveError,
        flushNow,
        retry: retrySave,
        recovery,
        conflict,
        notifyChange,
        resync,
        beginProgrammaticUpdate,
        endProgrammaticUpdate,
    } = autosave;
    const isDirty = autosave.isDirty || saveStatus === 'saving';
    const isSaving = saveStatus === 'saving';

    // Expand all nodes by default when data loads and select first document
    useEffect(() => {
        if (documentHub?.treeNodes) {
            const allIds = documentHub.treeNodes.map(n => n.id);
            setExpandedIds(new Set(allIds));

            // Select first document if currently on placeholder
            if (selectedDoc === 'api-ref') {
                const firstFile = documentHub.treeNodes.find(n => n.type === 'file' && n.documentId);
                if (firstFile && firstFile.documentId) {
                    setSelectedDoc(firstFile.documentId);
                    setSelectedTreeNodeId(firstFile.id);
                }
            }
        }
    }, [documentHub?.treeNodes]);

    // Handle browser back/refresh — show the native unsaved-changes prompt only
    // while a save is genuinely in flight or pending. The autosave hook also
    // persists the latest content to localStorage on pagehide as a safety net.
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (saveStatus === 'saving' || saveStatus === 'dirty' || saveStatus === 'error') {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saveStatus]);

    // Track the last loaded document/version ID so we can distinguish between
    // "switching docs" and "server content updated".
    const lastLoadedIdRef = useRef<string | null>(null);

    // Update editor content when document changes or preview version changes
    useEffect(() => {
        if (!editor) return;

        const currentId = previewVersion ? `v-${previewVersion.id}` : selectedDoc;
        const isSwitchingDoc = lastLoadedIdRef.current !== currentId;
        lastLoadedIdRef.current = currentId;

        if (isSwitchingDoc) {
            lastSavedVersionRef.current = null;
        }

        const incomingVersion = (docData as any)?.version ?? null;
        const ed = editor as any;
        const isActuallyEmpty = ed.document.length === 1 && ed.document[0].content.length === 0;

        if (!isSwitchingDoc && !previewVersion && !isActuallyEmpty && incomingVersion !== null && lastSavedVersionRef.current === incomingVersion) {
            return;
        }

        let contentToLoad: any[] = [];
        let isProgrammaticLoad = false;

        if (previewVersion) {
            contentToLoad = Array.isArray(previewVersion.content) ? previewVersion.content : [];
            editor.isEditable = false; // Read-only in preview
            isProgrammaticLoad = true;
        } else if (docData?.content) {
            contentToLoad = Array.isArray(docData.content) ? docData.content : [];
            editor.isEditable = true; // Editable otherwise
            isProgrammaticLoad = true;
        } else {
            // Query is still loading or returned no content — leave the editor
            // alone rather than blanking it (prevents a "flash of empty editor"
            // and a follow-up autosave that would persist the empty state).
            editor.isEditable = !previewVersion;
            return;
        }

        // --- Selection preservation logic ---
        // BlockNote's replaceBlocks always resets the text cursor to the end.
        // To prevent this during autosave (where docData updates after
        // every save), we only run replaceBlocks if:
        // 1. We are switching to a DIFFERENT document or version.
        // 2. The server content is actually different from what we have.
        // 3. We are NOT currently dirty or saving (if we are, our local state is
        //    newer than the server's last-known state, so overwriting would
        //    cause both cursor jumps AND data loss).

        try {
            const blocksToLoad =
                contentToLoad.length > 0 ? contentToLoad : [{ type: 'paragraph', content: [] }];

            // 1. If we aren't switching docs, and we have unsaved changes, 
            //    NEVER overwrite the editor. The autosave hook will eventually 
            //    sync our changes to the server.
            // We use getIsDirty() for a synchronous check to avoid stale state.
            const currentlyDirty = autosave.getIsDirty() || saveStatus === 'saving';

            if (!isSwitchingDoc && !previewVersion && currentlyDirty) {
                // Still need to resync the version if it changed (post-save)
                const v = typeof (docData as any)?.version === 'number'
                    ? (docData as any).version
                    : null;
                resync(v, false);
                return;
            }

            // 2. Deep compare to skip if identical.
            // We strip any blocks that might have been added by BlockNote defaults
            // to ensure a clean comparison.
            const currentBlocks = JSON.stringify(editor.document);
            const incomingBlocks = JSON.stringify(blocksToLoad);

            if (currentBlocks === incomingBlocks) {
                if (isProgrammaticLoad) {
                    const v =
                        !previewVersion && typeof (docData as any)?.version === 'number'
                            ? (docData as any).version
                            : null;
                    resync(v);
                }
                return;
            }

            // 3. If we aren't switching docs, and we ARENT dirty, but the 
            //    JSON.stringify failed (maybe metadata changed?), we should
            //    still be very careful. For now, we'll allow the replace if 
            //    not dirty, as it might be an external update.
        } catch {
            // Fall through to a normal replace if the comparison fails.
        }

        // Open the suppress window BEFORE replaceBlocks so the onChange that
        // BlockNote fires synchronously inside replaceBlocks is dropped.
        beginProgrammaticUpdate();

        // Save current selection to restore after replaceBlocks
        const selection = editor.getTextCursorPosition();

        if (contentToLoad.length > 0) {
            editor.replaceBlocks(editor.document, contentToLoad);
        } else {
            editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
        }

        endProgrammaticUpdate();

        // Restore selection if we aren't switching documents
        if (selection && !isSwitchingDoc) {
            try {
                const sel = selection as any;
                if (sel && sel.block) {
                    // Try to find the block by ID in the new content to be precise
                    const blockId = sel.block.id;
                    const blockExists = !!editor.getBlock(blockId);

                    // Small delay to let Mantine/BlockNote settle
                    setTimeout(() => {
                        if (!editor) return;
                        try {
                            if (blockExists) {
                                editor.setTextCursorPosition(blockId, sel.index);
                            } else {
                                // Fallback to the original block object if ID search failed
                                editor.setTextCursorPosition(sel.block, sel.index);
                            }
                        } catch { }
                    }, 10);
                }
            } catch (e) {
                // If the block is gone (rare during autosave), just let it go.
            }
        }

        // Re-snapshot the autosave baseline immediately after the load. resync
        // also clears the localStorage draft since we're now in sync with the
        // server.
        if (isProgrammaticLoad) {
            const v =
                !previewVersion && typeof (docData as any)?.version === 'number'
                    ? (docData as any).version
                    : null;
            resync(v);
        }
    }, [docData, editor, previewVersion, resync, beginProgrammaticUpdate, isDirty, isSaving, selectedDoc]);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const treeData = useMemo(() => {
        if (!documentHub?.treeNodes) return [];

        const nodes = JSON.parse(JSON.stringify(documentHub.treeNodes)) as TreeItem[];
        const map = new Map<string, TreeItem>();
        const roots: TreeItem[] = [];

        nodes.forEach(node => {
            node.children = [];
            map.set(node.id, node);
        });

        nodes.forEach(node => {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children!.push(node);
            } else {
                roots.push(node);
            }
        });

        // No search → unfiltered tree.
        const q = searchValue.trim().toLowerCase();
        if (!q) return roots;

        // Recursively filter: keep a node if its title matches OR any descendant
        // matches. Folders containing matches are kept so the path stays visible.
        const filter = (items: TreeItem[]): TreeItem[] => {
            const out: TreeItem[] = [];
            for (const item of items) {
                const matches = (item.title || '').toLowerCase().includes(q);
                const filteredChildren = item.children ? filter(item.children) : [];
                if (matches || filteredChildren.length > 0) {
                    out.push({ ...item, children: filteredChildren });
                }
            }
            return out;
        };
        return filter(roots);
    }, [documentHub?.treeNodes, searchValue]);

    // Auto-expand any folder that has descendants matching the search so the
    // hits are actually visible. Reverts to the user's previous expansion
    // when the search is cleared.
    useEffect(() => {
        const q = searchValue.trim().toLowerCase();
        if (!q || !documentHub?.treeNodes) return;

        const all = documentHub.treeNodes;
        // Build child→parent index for ancestor walking.
        const byId = new Map(all.map((n) => [n.id, n] as const));
        const matchingIds = all
            .filter((n) => (n.title || '').toLowerCase().includes(q))
            .map((n) => n.id);

        const ancestorIds = new Set<string>();
        for (const id of matchingIds) {
            let cur = byId.get(id);
            while (cur?.parentId) {
                ancestorIds.add(cur.parentId);
                cur = byId.get(cur.parentId);
            }
        }
        if (ancestorIds.size === 0) return;
        setExpandedIds((prev) => {
            const next = new Set(prev);
            for (const id of ancestorIds) next.add(id);
            return next;
        });
    }, [searchValue, documentHub?.treeNodes]);

    // With autosave, switching documents / navigating away should flush any
    // pending changes rather than prompting. Only block when a save is actively
    // failing (status === 'error') — there's no safe path to leave then.
    const confirmAction = (action: () => void) => {
        if (saveStatus === 'error') {
            modal.confirm({
                title: 'Save failed',
                content: 'The last save failed. Leave anyway? Your draft is saved locally and you can retry later.',
                okText: 'Leave',
                cancelText: 'Stay',
                onOk: () => action(),
            });
            return;
        }
        if (saveStatus === 'dirty' || saveStatus === 'saving') {
            // Fire-and-forget: flush, then proceed. The autosave hook will
            // persist the very latest content via its localStorage fallback if
            // the request gets cancelled by navigation.
            void flushNow();
        }
        action();
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleAddNode = (parentId: string | null, type: 'file' | 'folder') => {
        setAddNodeParentId(parentId);
        setAddNodeType(type);
        setIsAddModalOpen(true);
    };

    const handleCreateNode = async (values: any) => {
        try {
            setIsCreatingNode(true);
            // Track the newly-created file so we can auto-select it after the
            // tree refetch lands. Only meaningful for type === 'file'.
            let createdFile: { treeNodeId: string; documentId: string | null } | null = null;

            // Manual flow — caller supplied a name.
            if (!useAiInAddModal) {
                const node = await DocumentHubService.createTreeNode({
                    documentHubId: documentId,
                    parentId: addNodeParentId,
                    type: addNodeType,
                    title: values.name,
                });
                if (addNodeType === 'file') {
                    createdFile = { treeNodeId: node.id, documentId: node.documentId };
                }
                await new Promise((resolve) => setTimeout(resolve, 300));
                messageApi.success(
                    `${addNodeType === 'folder' ? 'Folder' : 'File'} created successfully`,
                );
            } else {
                // AI flow — caller supplied a prompt; let Zai generate the title
                // (and content for files).
                setIsAiGenerating(true);
                const draft = await DocumentHubService.generateAiDocumentDraft({
                    prompt: values.prompt,
                });
                setIsAiGenerating(false);

                if (addNodeType === 'folder') {
                    const folderName = (draft.hubName || values.prompt).slice(0, 60);
                    await DocumentHubService.createTreeNode({
                        documentHubId: documentId,
                        parentId: addNodeParentId,
                        type: 'folder',
                        title: folderName,
                    });
                    messageApi.success('Folder created with Zai');
                } else {
                    const fileTitle = (draft.fileTitle || values.prompt).slice(0, 60);
                    const node = await DocumentHubService.createTreeNode({
                        documentHubId: documentId,
                        parentId: addNodeParentId,
                        type: 'file',
                        title: fileTitle,
                    });
                    createdFile = { treeNodeId: node.id, documentId: node.documentId };

                    // Parse the HTML body into BlockNote blocks and write them
                    // into the freshly-created file's document.
                    const rawHtml = draft.contentHtml || '';
                    let blocks: any[] = [];
                    try {
                        blocks = await aiParserEditor.tryParseHTMLToBlocks(rawHtml);
                    } catch (err) {
                        console.error('AI HTML parse failed', err);
                        blocks = [{ type: 'paragraph', content: rawHtml }];
                    }
                    if (!blocks.length) blocks = [{ type: 'paragraph', content: '' }];

                    // Prepend the title as a level-1 heading unless the AI
                    // already produced a matching heading at the top.
                    const firstBlock = blocks[0];
                    const firstText =
                        firstBlock?.type === 'heading' && Array.isArray(firstBlock.content)
                            ? firstBlock.content
                                .map((n: any) => (typeof n === 'string' ? n : n?.text ?? ''))
                                .join('')
                                .trim()
                                .toLowerCase()
                            : typeof firstBlock?.content === 'string'
                                ? firstBlock.content.trim().toLowerCase()
                                : '';
                    if (
                        firstBlock?.type !== 'heading' ||
                        firstText !== fileTitle.trim().toLowerCase()
                    ) {
                        blocks = [
                            { type: 'heading', props: { level: 1 }, content: fileTitle },
                            ...blocks,
                        ];
                    }

                    if (node.documentId) {
                        await DocumentHubService.updateDocument(node.documentId, {
                            content: blocks,
                        });
                    }
                    messageApi.success('File created with Zai');
                }
            }

            setIsAddModalOpen(false);
            setUseAiInAddModal(false);
            form.resetFields();

            // Invalidate query to refetch tree
            const ticketsKey = [...globalDataKeys.tickets, documentId];
            const hubKey = [...globalDataKeys.documentHub, documentId];
            queryClient.invalidateQueries({ queryKey: ticketsKey });
            queryClient.refetchQueries({ queryKey: ticketsKey });
            queryClient.invalidateQueries({ queryKey: hubKey });
            queryClient.refetchQueries({ queryKey: hubKey });

            // If we added to a parent, ensure it's expanded
            if (addNodeParentId) {
                setExpandedIds((prev) => new Set(prev).add(addNodeParentId));
            }

            // Auto-navigate into the newly-created file. The autosave hook
            // re-initialises on documentId change and the editor's content-load
            // effect picks up the new doc as soon as the query resolves.
            if (createdFile && createdFile.documentId) {
                setSelectedTreeNodeId(createdFile.treeNodeId);
                setSelectedDoc(createdFile.documentId);
                setPreviewVersion(null);
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to create item');
        } finally {
            setIsCreatingNode(false);
            setIsAiGenerating(false);
        }
    };

    // Manual "Save now" — short-circuits the debounce/max-wait timers and
    // forces an immediate save. Useful for users who want certainty before
    // navigating away.
    const handleSaveDocument = async () => {
        if (!editor) return;
        await flushNow();
    };

    const handleSelectVersion = (version: any) => {
        setPreviewVersion(version);
        messageApi.info(`Viewing version from ${new Date(version.createdAt).toLocaleString()}`);
    };

    const handleExitPreview = () => {
        setPreviewVersion(null);
        messageApi.info('Exited preview mode');
    };

    const handleRestoreVersion = async () => {
        if (!previewVersion || !editor) return;

        modal.confirm({
            title: 'Restore Version',
            content: 'Are you sure you want to restore this version? Current changes will be overwritten.',
            onOk: async () => {
                try {
                    // Restore is a deliberate overwrite — bypass optimistic
                    // version checking by not sending expectedVersion. The
                    // autosave hook will re-snapshot from the refetched doc.
                    const content = previewVersion.content;
                    await DocumentHubService.updateDocument(selectedDoc, { content });
                    messageApi.success('Version restored successfully');
                    setPreviewVersion(null);
                    refetchDocument();
                    if (isHistoryOpen) refetchHistory();
                } catch (error) {
                    console.error('Failed to restore version:', error);
                    messageApi.error('Failed to restore version');
                }
            }
        });
    };

    /** Restore a version directly from the history drawer (one-click). */
    const handleRestoreVersionEntry = async (entry: any) => {
        if (!editor || !entry?.content) return;
        try {
            await DocumentHubService.updateDocument(selectedDoc, {
                content: entry.content,
            });
            messageApi.success('Version restored');
            setPreviewVersion(null);
            refetchDocument();
            refetchHistory();
        } catch (error) {
            console.error('Failed to restore version:', error);
            messageApi.error('Failed to restore version');
        }
    };

    /** Permanently delete a single history entry. */
    const handleDeleteVersionEntry = async (entry: any) => {
        if (!entry?.id || !selectedDoc) return;
        try {
            await DocumentHubService.deleteDocumentHistoryEntry(selectedDoc, entry.id);
            messageApi.success('Version deleted');
            // If the user happened to be previewing the deleted entry, exit it.
            if (previewVersion?.id === entry.id) setPreviewVersion(null);
            refetchHistory();
        } catch (error: any) {
            console.error('Failed to delete version:', error);
            messageApi.error(
                error?.response?.data?.error || 'Failed to delete version',
            );
        }
    };

    const handleNodeSelect = (treeNodeId: string) => {
        confirmAction(() => {
            const node = documentHub?.treeNodes?.find((n: DocumentTreeNode) => n.id === treeNodeId);
            setSelectedTreeNodeId(treeNodeId);
            if (node && node.type === 'file' && node.documentId) {
                setSelectedDoc(node.documentId);
                setPreviewVersion(null); // Reset preview when switching docs
            }
        });
    };

    const selectedNode = useMemo(() => {
        return documentHub?.treeNodes?.find((n: DocumentTreeNode) => n.id === selectedTreeNodeId);
    }, [documentHub?.treeNodes, selectedTreeNodeId]);

    const handleRenameHub = async () => {
        if (!isEditingHubName) return; // Prevent double-trigger from both onBlur and onPressEnter

        if (!hubName.trim() || hubName === documentHub?.name) {
            setIsEditingHubName(false);
            setHubName(documentHub?.name || '');
            return;
        }

        try {
            await DocumentHubService.updateDocumentHub(documentId, { name: hubName });
            messageApi.success('Document Hub renamed successfully');
            const ticketsKey = [...globalDataKeys.tickets, documentId];
            const hubKey = [...globalDataKeys.documentHub, documentId];
            console.log('Invalidating and refetching Document Hub tree after rename with keys:', { ticketsKey, hubKey });

            queryClient.invalidateQueries({ queryKey: ticketsKey });
            queryClient.refetchQueries({ queryKey: ticketsKey });
            queryClient.invalidateQueries({ queryKey: hubKey });
            queryClient.refetchQueries({ queryKey: hubKey });
            setIsEditingHubName(false);
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to rename Document Hub');
        }
    };

    const handleRenameNode = async (id: string, newTitle: string) => {
        try {
            await DocumentHubService.updateTreeNode(id, { title: newTitle });
            messageApi.success('Renamed successfully');
            const ticketsKey = [...globalDataKeys.tickets, documentId];
            const hubKey = [...globalDataKeys.documentHub, documentId];
            console.log('Invalidating and refetching Document Hub tree after node rename with keys:', { ticketsKey, hubKey });

            queryClient.invalidateQueries({ queryKey: ticketsKey });
            queryClient.refetchQueries({ queryKey: ticketsKey });
            queryClient.invalidateQueries({ queryKey: hubKey });
            queryClient.refetchQueries({ queryKey: hubKey });
            // Also refetch document if it's the currently selected one
            if (selectedTreeNodeId === id) {
                refetchDocument();
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to rename item');
        }
    };

    // ------------------------- Drag & drop ----------------------------------
    // Track the node currently being dragged so we can disable invalid drop
    // targets (descendants of the source) and show visual feedback.
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | 'root' | null>(null);

    /** Build the set of descendants of `rootId` (inclusive) so we can reject
     *  drops that would create a cycle. */
    const getDescendantIds = (rootId: string): Set<string> => {
        const ids = new Set<string>([rootId]);
        const nodes = documentHub?.treeNodes || [];
        let added = true;
        while (added) {
            added = false;
            for (const n of nodes) {
                if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) {
                    ids.add(n.id);
                    added = true;
                }
            }
        }
        return ids;
    };

    const handleDragStartNode = (id: string) => {
        setDraggedNodeId(id);
        setDropTargetId(null);
    };
    const handleDragEndNode = () => {
        setDraggedNodeId(null);
        setDropTargetId(null);
    };
    const handleDragOverNode = (_e: React.DragEvent, id: string) => {
        if (dropTargetId !== id) setDropTargetId(id);
    };
    const handleDragLeaveNode = (id: string) => {
        // Only clear if we're actually leaving this node — onDragOver from a
        // child re-fires this on the parent, which would otherwise flicker.
        if (dropTargetId === id) setDropTargetId(null);
    };

    const handleMoveNode = async (
        nodeId: string,
        newParentId: string | null,
    ) => {
        // Resolve the source node so we can validate before hitting the API.
        const source = documentHub?.treeNodes?.find((n) => n.id === nodeId);
        if (!source) return;
        // No-op if dropped on its current parent.
        if ((source.parentId ?? null) === (newParentId ?? null)) return;
        // Reject self-drop / descendant drop on the client too.
        if (newParentId) {
            const blocked = getDescendantIds(nodeId);
            if (blocked.has(newParentId)) {
                messageApi.warning("Can't move a folder into itself or a descendant.");
                return;
            }
            const target = documentHub?.treeNodes?.find((n) => n.id === newParentId);
            if (target?.type === 'file') {
                messageApi.warning('Files cannot contain other items.');
                return;
            }
        }

        try {
            await DocumentHubService.updateTreeNode(nodeId, { parentId: newParentId });
            messageApi.success('Moved');
            const ticketsKey = [...globalDataKeys.tickets, documentId];
            const hubKey = [...globalDataKeys.documentHub, documentId];
            queryClient.invalidateQueries({ queryKey: ticketsKey });
            queryClient.refetchQueries({ queryKey: ticketsKey });
            queryClient.invalidateQueries({ queryKey: hubKey });
            queryClient.refetchQueries({ queryKey: hubKey });
            // If we moved INTO a folder, expand it so the user sees the result.
            if (newParentId) {
                setExpandedIds((prev) => new Set(prev).add(newParentId));
            }
        } catch (err) {
            console.error('Failed to move node', err);
            messageApi.error('Failed to move item');
        }
    };

    const handleDeleteDocument = async (id: string, type: 'file' | 'folder' | 'section', docId?: string) => {
        // For now only files (documents) deleting are implemented in backend fully as described
        // Folders are just nodes, but documents are separate entities.
        // My implementation of deleteDocument expects a documentId (not treeNodeId).

        if (type === 'file' && docId) {
            modal.confirm({
                title: 'Delete Document',
                content: 'Are you sure you want to delete this document?',
                okText: 'Delete',
                okType: 'danger',
                onOk: async () => {
                    try {
                        if (docId) {
                            await DocumentHubService.deleteDocument(docId);
                            messageApi.success('Document deleted');
                            // Invalidate document hub to refresh tree (removes deleted node)
                            const ticketsKey = [...globalDataKeys.tickets, documentId];
                            const hubKey = [...globalDataKeys.documentHub, documentId];
                            console.log('Invalidating and refetching Document Hub tree after file deletion with keys:', { ticketsKey, hubKey });

                            queryClient.invalidateQueries({ queryKey: ticketsKey });
                            queryClient.refetchQueries({ queryKey: ticketsKey });
                            queryClient.invalidateQueries({ queryKey: hubKey });
                            queryClient.refetchQueries({ queryKey: hubKey });

                            // Invalidate the individual document cache
                            queryClient.removeQueries({ queryKey: ['document', docId] });
                            // Invalidate document history cache
                            queryClient.removeQueries({ queryKey: ['documentHistory', docId] });
                            if (selectedDoc === docId) {
                                setSelectedDoc('api-ref');
                            }
                        }
                    } catch (error: any) {
                        console.error(error);
                        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete document';
                        messageApi.error(errorMessage);
                    }
                }
            });
        } else if (type === 'folder' || type === 'section') {
            modal.confirm({
                title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                content: `Are you sure you want to delete this ${type} and all its contents?`,
                okText: 'Delete',
                okType: 'danger',
                onOk: async () => {
                    try {
                        await DocumentHubService.deleteTreeNode(id);
                        messageApi.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
                        const ticketsKey = [...globalDataKeys.tickets, documentId];
                        const hubKey = [...globalDataKeys.documentHub, documentId];
                        console.log('Invalidating and refetching Document Hub tree after node deletion with keys:', { ticketsKey, hubKey });

                        queryClient.invalidateQueries({ queryKey: ticketsKey });
                        queryClient.refetchQueries({ queryKey: ticketsKey });
                        queryClient.invalidateQueries({ queryKey: hubKey });
                        queryClient.refetchQueries({ queryKey: hubKey });
                    } catch (error: any) {
                        console.error(error);
                        const errorMessage = error.response?.data?.error || error.message || `Failed to delete ${type}`;
                        messageApi.error(errorMessage);
                    }
                }
            });
        }
    };

    return (
        <MainLayout>
            {contextHolder}
            {modalContextHolder}
            <div className="flex w-full" style={{
                margin: "0 -8px 0 -8px",
                background: "var(--bg-pure-white)",
                height: "calc(100vh - 64px)"
            }}>
                {/* Sidebar */}
                {!isFullScreen && (
                    <aside
                        className="relative flex flex-col overflow-hidden shrink-0"
                        style={{
                            width: collapsed ? 0 : sidebarWidth,
                            transition: isResizing ? 'none' : 'width 240ms ease',
                            borderRight: collapsed ? 'none' : '1px solid var(--border-slate-200)',
                            background: 'var(--bg-secondary)'
                        }}
                    >
                        {/* Sidebar Header */}
                        <div
                            className="flex items-center gap-2.5 px-4 h-[58px] group/header shrink-0"
                            style={{ borderBottom: '1px solid var(--border-slate-200)' }}
                        >
                            <div
                                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, var(--text-blue-700) 0%, rgba(99, 102, 241, 0.9) 100%)',
                                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)'
                                }}
                            >
                                <BookOpen className="w-3.5 h-3.5 text-white" />
                            </div>
                            {isEditingHubName ? (
                                <Input
                                    size="small"
                                    value={hubName}
                                    onChange={(e) => setHubName(e.target.value)}
                                    onBlur={handleRenameHub}
                                    onPressEnter={handleRenameHub}
                                    autoFocus
                                    className="text-sm font-semibold"
                                />
                            ) : (
                                <div className="flex items-center justify-between flex-1 min-w-0 overflow-hidden">
                                    <Tooltip title={documentHub?.name} placement="right" mouseEnterDelay={0.5}>
                                        <h1
                                            className="text-[14px] font-semibold truncate flex-1 min-w-0 tracking-tight"
                                            style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
                                        >
                                            {documentHub?.name}
                                        </h1>
                                    </Tooltip>
                                    <EditOutlined
                                        className="cursor-pointer opacity-0 group-hover/header:opacity-100 transition-opacity ml-2 shrink-0"
                                        style={{ fontSize: 14, color: 'var(--text-slate-400)' }}
                                        onClick={() => setIsEditingHubName(true)}
                                    />
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <>
                                {/* Search */}
                                <div className="px-3 pt-3 pb-2">
                                    <div className="relative group/search">
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors"
                                            style={{ color: 'var(--text-slate-400)' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            className="w-full pl-9 pr-3 py-[7px] text-[13px] rounded-lg transition-all duration-150 focus:outline-none"
                                            style={{
                                                background: 'var(--bg-pure-white)',
                                                border: '1px solid var(--border-slate-200)',
                                                color: 'var(--text-slate-900)'
                                            }}
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--text-blue-700)';
                                                e.currentTarget.style.boxShadow = '0 0 0 3px var(--bg-blue-50)';
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-slate-200)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Section label */}
                                <div className="px-4 pt-2 pb-1">
                                    <span
                                        className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                                        style={{ color: 'var(--text-slate-400)' }}
                                    >
                                        Documents
                                    </span>
                                </div>

                                {/* Tree (also acts as the root drop zone — drop
                                    onto empty space to move the node to top
                                    level / outside any folder). */}
                                <div
                                    className="flex-1 overflow-y-auto px-2 pb-3 relative"
                                    onDragOver={(e) => {
                                        if (!draggedNodeId) return;
                                        // Only treat empty-space drag-over as
                                        // root: if a child handler already set
                                        // a target, don't override.
                                        if (dropTargetId && dropTargetId !== 'root') return;
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (dropTargetId !== 'root') setDropTargetId('root');
                                    }}
                                    onDragLeave={(e) => {
                                        // Only clear when actually leaving the
                                        // container, not when crossing into a
                                        // descendant.
                                        const related = e.relatedTarget as Node | null;
                                        if (related && e.currentTarget.contains(related)) return;
                                        if (dropTargetId === 'root') setDropTargetId(null);
                                    }}
                                    onDrop={(e) => {
                                        if (!draggedNodeId) return;
                                        e.preventDefault();
                                        const id = draggedNodeId;
                                        setDropTargetId(null);
                                        setDraggedNodeId(null);
                                        // null parent = top level.
                                        void handleMoveNode(id, null);
                                    }}
                                    style={{
                                        outline:
                                            draggedNodeId && dropTargetId === 'root'
                                                ? '2px dashed var(--text-blue-700)'
                                                : '2px dashed transparent',
                                        outlineOffset: -2,
                                        borderRadius: 8,
                                        transition: 'outline-color 0.15s',
                                    }}
                                >
                                    {treeData.map((item) => (
                                        <TreeNode
                                            key={item.id}
                                            item={item}
                                            selectedId={selectedTreeNodeId || ''}
                                            onSelect={handleNodeSelect}
                                            expandedIds={expandedIds}
                                            onToggleExpand={toggleExpand}
                                            onAddNode={handleAddNode}
                                            onRenameNode={handleRenameNode}
                                            onDeleteDocument={handleDeleteDocument}
                                            draggedNodeId={draggedNodeId}
                                            dropTargetId={dropTargetId}
                                            onDragStartNode={handleDragStartNode}
                                            onDragEndNode={handleDragEndNode}
                                            onDragOverNode={handleDragOverNode}
                                            onDragLeaveNode={handleDragLeaveNode}
                                            onDropNode={(_e, targetId) => {
                                                const id = draggedNodeId;
                                                setDropTargetId(null);
                                                setDraggedNodeId(null);
                                                if (id) void handleMoveNode(id, targetId);
                                            }}
                                            isDescendantOfDragged={false}
                                        />
                                    ))}
                                </div>

                                {/* New Document Button (Root Level) */}
                                <div className="p-3" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: 'add-root-folder',
                                                    label: 'New Folder',
                                                    icon: <Folder className="w-4 h-4" />,
                                                    onClick: () => handleAddNode(null, 'folder')
                                                },
                                                {
                                                    key: 'add-root-file',
                                                    label: 'New File',
                                                    icon: <FileText className="w-4 h-4" />,
                                                    onClick: () => handleAddNode(null, 'file')
                                                }
                                            ]
                                        }}
                                        trigger={['click']}
                                    >
                                        <button
                                            className="w-full flex items-center justify-center gap-2 px-4 py-[9px] text-[13px] font-medium rounded-lg transition-all duration-150"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--text-blue-700) 0%, rgba(99, 102, 241, 0.95) 100%)',
                                                color: '#ffffff',
                                                boxShadow: '0 1px 2px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                                            New Item
                                        </button>
                                    </Dropdown>
                                </div>
                            </>
                        )}

                        {/* Resize handle */}
                        {!collapsed && (
                            <div
                                role="separator"
                                aria-orientation="vertical"
                                aria-label="Resize sidebar"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsResizing(true);
                                }}
                                onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
                                className="absolute top-0 right-0 h-full w-1 cursor-col-resize group/resize"
                                style={{ zIndex: 10 }}
                            >
                                <div
                                    className="absolute top-0 right-0 h-full w-[2px] transition-colors"
                                    style={{
                                        background: isResizing ? 'var(--text-blue-700)' : 'transparent'
                                    }}
                                />
                                <div
                                    className="absolute top-0 right-0 h-full w-[2px] opacity-0 group-hover/resize:opacity-100 transition-opacity"
                                    style={{ background: 'var(--text-blue-700)' }}
                                />
                            </div>
                        )}
                    </aside>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header
                        className="flex items-center justify-between px-4 h-[58px] shrink-0"
                        style={{
                            background: 'var(--bg-pure-white)',
                            borderBottom: '1px solid var(--border-slate-200)'
                        }}
                    >
                        <div className="flex items-center gap-1 min-w-0">
                            <Tooltip title="Back to Document Hub" mouseEnterDelay={0.4}>
                                <button
                                    onClick={() => confirmAction(() => router.push('/documenthub'))}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--text-slate-600)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-slate-50)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <ArrowLeft className="w-[18px] h-[18px]" />
                                </button>
                            </Tooltip>
                            <Tooltip title={collapsed ? "Show sidebar" : "Hide sidebar"} mouseEnterDelay={0.4}>
                                <button
                                    onClick={() => setCollapsed(!collapsed)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: 'var(--text-slate-600)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-slate-50)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    {collapsed ? (
                                        <PanelLeft className="w-[18px] h-[18px]" />
                                    ) : (
                                        <PanelLeftClose className="w-[18px] h-[18px]" />
                                    )}
                                </button>
                            </Tooltip>
                            <div className="h-5 w-px mx-2" style={{ backgroundColor: 'var(--border-slate-200)' }} />
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Tooltip title={docData?.title} mouseEnterDelay={0.5}>
                                    <h2
                                        className="text-[15px] font-semibold truncate max-w-[420px] tracking-tight"
                                        style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
                                    >
                                        {(() => {
                                            const t = docData?.title;
                                            if (!t) return 'Select a document';
                                            return t.length > 24 ? `${t.slice(0, 27)}…` : t;
                                        })()}
                                    </h2>
                                </Tooltip>
                                {selectedDoc && selectedDoc !== 'api-ref' && (
                                    <SaveStatusPill
                                        status={saveStatus}
                                        lastSavedAt={lastSavedAt}
                                        errorMessage={saveError}
                                        onRetry={retrySave}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDoc && selectedDoc !== 'api-ref' && (
                                <>
                                    <Tooltip title="Generate or refine this page with Zai">
                                        <Button
                                            onClick={() => setIsAiEditOpen(true)}
                                            style={{
                                                height: 32,
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                paddingInline: 12,
                                                background: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                boxShadow: '0 2px 8px rgba(114, 46, 209, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                                            }}
                                        >
                                            <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
                                                <ThunderboltOutlined style={{ fontSize: 13 }} />
                                            </span>
                                            Create with Zai
                                        </Button>
                                    </Tooltip>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined className="w-4 h-4" />}
                                        loading={isSaving}
                                        onClick={handleSaveDocument}
                                        disabled={!isDirty && !isSaving}
                                    >
                                        Save
                                    </Button>
                                    <div className="h-5 w-px mx-1" style={{ backgroundColor: 'var(--border-slate-200)' }} />
                                    <Tooltip title="Open in New Tab">
                                        <Button
                                            type="text"
                                            icon={<ExportOutlined className="w-4 h-4" />}
                                            style={{ color: 'var(--text-slate-600)' }}
                                            onClick={() => window.open(`/document/${selectedDoc}`, '_blank')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Share Hub">
                                        <Button
                                            type="text"
                                            icon={<Share2 className="w-4 h-4" />}
                                            style={{ color: 'var(--text-slate-600)' }}
                                            onClick={() => setIsShareOpen(true)}
                                        />
                                    </Tooltip>
                                    <Tooltip title={`Delete ${selectedNode?.type || 'item'}`}>
                                        <Button
                                            type="text"
                                            icon={<Trash className="w-4 h-4" />}
                                            style={{ color: '#ef4444' }}
                                            onClick={() => {
                                                if (selectedNode) {
                                                    handleDeleteDocument(
                                                        selectedNode.id,
                                                        selectedNode.type as any,
                                                        selectedNode.documentId || undefined
                                                    );
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                    <div className="h-5 w-px mx-1" style={{ backgroundColor: 'var(--border-slate-200)' }} />
                                </>
                            )}
                            <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                                <Button
                                    type="text"
                                    icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                                    style={{ color: 'var(--text-slate-600)' }}
                                    onClick={() => {
                                        if (!document.fullscreenElement) {
                                            document.documentElement.requestFullscreen();
                                        } else {
                                            document.exitFullscreen();
                                        }
                                    }}
                                />
                            </Tooltip>

                            <button
                                className="flex items-center gap-1.5 px-2.5 py-[7px] text-[13px] font-medium rounded-lg transition-colors"
                                style={{
                                    color: isHistoryOpen ? 'var(--text-blue-700)' : 'var(--text-slate-600)',
                                    background: isHistoryOpen ? 'var(--bg-blue-50)' : 'transparent'
                                }}
                                onMouseEnter={(e) => !isHistoryOpen && (e.currentTarget.style.backgroundColor = 'var(--bg-slate-50)')}
                                onMouseLeave={(e) => !isHistoryOpen && (e.currentTarget.style.backgroundColor = 'transparent')}
                                onClick={() => setIsHistoryOpen(true)}
                            >
                                <History className="w-4 h-4" />
                                History
                            </button>
                        </div>
                    </header>

                    {/* Editor Content */}
                    <main
                        className="flex-1 overflow-auto flex flex-col"
                        style={{ background: 'var(--bg-primary)' }}
                    >
                        <div className="w-full  mx-auto px-6 md:px-10 pt-6 pb-8 flex flex-col flex-1">
                            {/* Local-draft recovery banner — surfaced when a
                                localStorage draft is newer than the server's
                                version of this doc. */}
                            {recovery.available && (
                                <div
                                    className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
                                    style={{
                                        background: 'var(--bg-orange-50)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                >
                                    <div className="flex items-center gap-2.5" style={{ color: '#b45309' }}>
                                        <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
                                        <span className="text-[13px] font-medium">
                                            Unsaved changes from {formatRelative(recovery.savedAt)} were found on this device
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="small" onClick={recovery.discard}>
                                            Discard
                                        </Button>
                                        <Button size="small" type="primary" onClick={recovery.restore}>
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Optimistic-locking conflict banner — autosave is
                                halted; the user must reload to see the changes
                                made by the other session. */}
                            {conflict.active && (
                                <div
                                    className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl"
                                    style={{
                                        background: 'var(--bg-red-50)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                    }}
                                >
                                    <div className="flex items-center gap-2.5" style={{ color: 'var(--text-leave)' }}>
                                        <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
                                        <span className="text-[13px] font-medium">
                                            This document was modified in another session — autosave paused
                                        </span>
                                    </div>
                                    <Button size="small" type="primary" danger onClick={conflict.reload}>
                                        Reload
                                    </Button>
                                </div>
                            )}

                            {previewVersion && (
                                <div
                                    className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl"
                                    style={{
                                        background: 'var(--bg-blue-50)',
                                        border: '1px solid var(--border-blue-200)'
                                    }}
                                >
                                    <div className="flex items-center gap-2.5" style={{ color: 'var(--text-blue-700)' }}>
                                        <div
                                            className="flex items-center justify-center w-7 h-7 rounded-lg"
                                            style={{ background: 'rgba(59, 130, 246, 0.15)' }}
                                        >
                                            <History className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                                                Viewing past version
                                            </span>
                                            <span className="text-[13px] font-medium">
                                                {new Date(previewVersion.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="small" onClick={handleExitPreview}>
                                            Exit Preview
                                        </Button>
                                        <Button size="small" type="primary" onClick={handleRestoreVersion}>
                                            Restore This Version
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedDoc && selectedDoc !== 'api-ref' ? (
                                isDocumentLoading ? (
                                    <div className="flex items-center justify-center flex-1">
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                                            style={{ borderColor: 'var(--text-blue-700)', borderTopColor: 'transparent' }}
                                        />
                                    </div>
                                ) : (
                                    <DocumentEditor
                                        editor={editor}
                                        viewMode={viewMode}
                                        onChange={notifyChange}
                                    />
                                )
                            ) : (
                                <div
                                    className="flex flex-col items-center justify-center flex-1 gap-4 text-center"
                                    style={{ color: 'var(--text-slate-400)' }}
                                >
                                    <div
                                        className="flex items-center justify-center w-14 h-14 rounded-2xl"
                                        style={{
                                            background: 'var(--bg-blue-50)',
                                            color: 'var(--text-blue-700)'
                                        }}
                                    >
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[15px] font-semibold" style={{ color: 'var(--text-slate-700)' }}>
                                            Select a document to edit
                                        </span>
                                        <span className="text-[13px]">
                                            Pick a file from the sidebar or create a new one to get started.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            <Drawer
                title={null}
                closable={false}
                placement="right"
                onClose={() => setIsHistoryOpen(false)}
                open={isHistoryOpen}
                width={460}
                styles={{
                    body: { padding: 0 },
                    header: { display: 'none' },
                }}
            >
                <DocumentHistory
                    history={documentHistory}
                    isLoading={isHistoryLoading}
                    onSelectVersion={handleSelectVersion}
                    onRestoreVersion={handleRestoreVersionEntry}
                    onDeleteVersion={handleDeleteVersionEntry}
                />
            </Drawer>

            <ShareModal
                open={isShareOpen}
                onClose={() => {
                    setIsShareOpen(false);
                    refetchHub();
                }}
                entityId={documentId}
                entityTitle={documentHub?.name || ''}
                entityType="hub"
                currentVisibility={documentHub?.visibility || 'private'}
                currentShareToken={documentHub?.shareToken || null}
            />

            {editor && (
                <AiEditDocModal
                    open={isAiEditOpen}
                    onClose={() => setIsAiEditOpen(false)}
                    editor={editor}
                    onApplied={() => {
                        // The autosave hook picks up the editor's onChange after the
                        // applied replaceBlocks/insertBlocks, so no manual save here.
                        notifyChange();
                    }}
                />
            )}

            <Modal
                open={isAddModalOpen}
                onCancel={() => {
                    if (isCreatingNode || isAiGenerating) return;
                    setIsAddModalOpen(false);
                    setUseAiInAddModal(false);
                    form.resetFields();
                }}
                title={null}
                footer={null}
                width={460}
                centered
                closable={false}
                maskClosable={!isCreatingNode && !isAiGenerating}
                styles={{
                    mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
                    content: { borderRadius: 16, padding: 0, overflow: 'hidden' },
                    body: { padding: 0 },
                }}
            >
                {/* Hero header */}
                <div
                    className="relative px-6 pt-5 pb-4"
                    style={{
                        background:
                            useAiInAddModal
                                ? 'linear-gradient(135deg, rgba(114, 46, 209, 0.06) 0%, rgba(57, 16, 133, 0.04) 100%)'
                                : 'linear-gradient(135deg, var(--bg-blue-50) 0%, transparent 100%)',
                        borderBottom: '1px solid var(--border-slate-200)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="flex items-center justify-center shrink-0 text-white"
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: useAiInAddModal
                                    ? 'linear-gradient(135deg, #722ed1 0%, #391085 100%)'
                                    : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                                boxShadow: useAiInAddModal
                                    ? '0 4px 12px rgba(114, 46, 209, 0.32), inset 0 1px 0 rgba(255,255,255,0.2)'
                                    : '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                            }}
                        >
                            {useAiInAddModal ? (
                                <ThunderboltOutlined style={{ fontSize: 16 }} />
                            ) : addNodeType === 'folder' ? (
                                <Folder className="w-[18px] h-[18px]" />
                            ) : (
                                <FileText className="w-[18px] h-[18px]" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-[15px] font-semibold tracking-tight m-0"
                                style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
                            >
                                {useAiInAddModal
                                    ? `Create ${addNodeType} with Zai`
                                    : `Create new ${addNodeType}`}
                            </h3>
                            <p
                                className="m-0 mt-0.5 text-[12.5px] leading-snug"
                                style={{ color: 'var(--text-slate-400)' }}
                            >
                                {useAiInAddModal
                                    ? addNodeType === 'folder'
                                        ? 'Zai will name the folder from your description.'
                                        : 'Zai will name the file and draft initial content.'
                                    : addNodeType === 'folder'
                                        ? 'Group related documents under a folder.'
                                        : 'Add a new page to this hub.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (isCreatingNode || isAiGenerating) return;
                                setIsAddModalOpen(false);
                                setUseAiInAddModal(false);
                                form.resetFields();
                            }}
                            disabled={isCreatingNode || isAiGenerating}
                            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
                            style={{
                                width: 28,
                                height: 28,
                                color: 'var(--text-slate-400)',
                                background: 'transparent',
                                border: 'none',
                                cursor: isCreatingNode || isAiGenerating ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (isCreatingNode || isAiGenerating) return;
                                e.currentTarget.style.background = 'var(--bg-slate-100)';
                                e.currentTarget.style.color = 'var(--text-slate-700)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-slate-400)';
                            }}
                            aria-label="Close"
                        >
                            <Plus className="w-4 h-4" style={{ transform: 'rotate(45deg)' }} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-4 pb-5">
                    {/* Mode switch */}
                    <div
                        className="flex items-center p-1 rounded-xl mb-5"
                        style={{
                            background: 'var(--bg-slate-50)',
                            border: '1px solid var(--border-slate-200)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setUseAiInAddModal(false);
                                form.resetFields();
                            }}
                            disabled={isCreatingNode || isAiGenerating}
                            style={{
                                flex: 1,
                                padding: '7px 12px',
                                borderRadius: 9,
                                border: 'none',
                                cursor:
                                    isCreatingNode || isAiGenerating ? 'not-allowed' : 'pointer',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: !useAiInAddModal
                                    ? 'var(--text-slate-900)'
                                    : 'var(--text-slate-600)',
                                background: !useAiInAddModal ? 'var(--bg-pure-white)' : 'transparent',
                                boxShadow: !useAiInAddModal
                                    ? '0 1px 2px rgba(15, 23, 42, 0.06)'
                                    : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            Manual
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUseAiInAddModal(true);
                                form.resetFields();
                            }}
                            disabled={isCreatingNode || isAiGenerating}
                            style={{
                                flex: 1,
                                padding: '7px 12px',
                                borderRadius: 9,
                                border: 'none',
                                cursor:
                                    isCreatingNode || isAiGenerating ? 'not-allowed' : 'pointer',
                                fontSize: 12.5,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                color: useAiInAddModal ? '#fff' : 'var(--text-slate-600)',
                                background: useAiInAddModal
                                    ? 'linear-gradient(135deg, #722ed1 0%, #391085 100%)'
                                    : 'transparent',
                                boxShadow: useAiInAddModal
                                    ? '0 2px 8px rgba(114, 46, 209, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
                                    : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            <ThunderboltOutlined style={{ fontSize: 12 }} />
                            Create with Zai
                        </button>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleCreateNode}>
                        {!useAiInAddModal ? (
                            <Form.Item
                                name="name"
                                label={
                                    <span
                                        className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                                        style={{ color: 'var(--text-slate-400)' }}
                                    >
                                        {addNodeType === 'folder' ? 'Folder name' : 'File name'}
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Please enter a name' },
                                    { min: 1, max: 80, message: 'Up to 80 characters' },
                                ]}
                                className="mb-2"
                            >
                                <Input
                                    placeholder={
                                        addNodeType === 'folder'
                                            ? 'e.g. Onboarding'
                                            : 'e.g. Getting started'
                                    }
                                    autoFocus
                                    size="large"
                                    prefix={
                                        addNodeType === 'folder' ? (
                                            <Folder className="w-4 h-4" style={{ color: 'var(--text-slate-400)' }} />
                                        ) : (
                                            <FileText className="w-4 h-4" style={{ color: 'var(--text-slate-400)' }} />
                                        )
                                    }
                                    style={{ borderRadius: 10, fontSize: 13.5 }}
                                />
                            </Form.Item>
                        ) : (
                            <Form.Item
                                name="prompt"
                                label={
                                    <span
                                        className="text-[12px] font-semibold uppercase tracking-[0.06em]"
                                        style={{ color: 'var(--text-slate-400)' }}
                                    >
                                        {addNodeType === 'folder'
                                            ? 'Describe this folder'
                                            : 'What should this file document?'}
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Please describe what to create' },
                                    { min: 5, message: 'Add a few more words so Zai has context' },
                                ]}
                                className="mb-2"
                            >
                                <Input.TextArea
                                    autoFocus
                                    placeholder={
                                        addNodeType === 'folder'
                                            ? 'e.g. Onboarding guides for new engineers'
                                            : 'e.g. API documentation for the payments service'
                                    }
                                    autoSize={{ minRows: 3, maxRows: 6 }}
                                    disabled={isAiGenerating}
                                    style={{ borderRadius: 10, fontSize: 13.5, padding: '10px 12px' }}
                                />
                            </Form.Item>
                        )}

                        {useAiInAddModal && (
                            <div
                                className="flex items-start gap-2 px-3 py-2 rounded-lg"
                                style={{
                                    background: 'rgba(114, 46, 209, 0.06)',
                                    border: '1px solid rgba(114, 46, 209, 0.18)',
                                }}
                            >
                                <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 12, marginTop: 3 }} />
                                <span
                                    className="text-[11.5px] leading-snug"
                                    style={{ color: 'var(--text-slate-600)' }}
                                >
                                    {addNodeType === 'folder'
                                        ? 'Zai will generate a concise folder name from your description.'
                                        : 'Zai will generate a file name and draft the initial content for you.'}
                                </span>
                            </div>
                        )}
                    </Form>
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-2 px-6 py-3"
                    style={{
                        borderTop: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-secondary)',
                    }}
                >
                    <Button
                        onClick={() => {
                            setIsAddModalOpen(false);
                            setUseAiInAddModal(false);
                            form.resetFields();
                        }}
                        disabled={isCreatingNode || isAiGenerating}
                        style={{ borderRadius: 9, height: 34, fontWeight: 500 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => form.submit()}
                        loading={isCreatingNode || isAiGenerating}
                        icon={
                            useAiInAddModal && !isAiGenerating ? (
                                <ThunderboltOutlined />
                            ) : undefined
                        }
                        style={{
                            borderRadius: 9,
                            height: 34,
                            fontWeight: 600,
                            paddingInline: 14,
                            ...(useAiInAddModal
                                ? {
                                    background:
                                        'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
                                    border: 'none',
                                    boxShadow:
                                        '0 4px 12px rgba(114, 46, 209, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                                }
                                : {}),
                        }}
                    >
                        {useAiInAddModal
                            ? isAiGenerating
                                ? 'Generating…'
                                : 'Generate & Create'
                            : 'Create'}
                    </Button>
                </div>
            </Modal>
        </MainLayout>
    )
}
