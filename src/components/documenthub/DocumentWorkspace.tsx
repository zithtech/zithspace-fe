'use client'

import { useState, useMemo, useEffect } from 'react'
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
    ArrowLeft
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
import { EditOutlined, EyeOutlined, SaveOutlined, SplitCellsOutlined, FullscreenOutlined, FullscreenExitOutlined, ExportOutlined } from '@ant-design/icons'
import DocumentHistory from '@/components/common/DocumentHistory'
import ShareModal from '@/components/documenthub/ShareModal'

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
    onDeleteDocument
}: {
    item: TreeItem
    selectedId: string
    onSelect: (id: string) => void
    expandedIds: Set<string>
    onToggleExpand: (id: string) => void
    onAddNode: (parentId: string, type: 'file' | 'folder') => void
    onRenameNode: (id: string, newTitle: string) => void
    onDeleteDocument: (id: string, type: 'file' | 'folder', documentId?: string) => void
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
                onDeleteDocument(item.id, item.type as 'file' | 'folder', item.documentId || undefined);
            }
        }
    ];

    return (
        <div>
            <div
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md text-sm transition-colors ${isSelected
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                onClick={() => {
                    if (hasChildren) {
                        onToggleExpand(item.id)
                    }
                    if (item.type === 'file') {
                        onSelect(item.id)
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
            >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    {hasChildren ? (
                        <button
                            className="p-0.5 hover:bg-gray-200 rounded"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleExpand(item.id)
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                    ) : (
                        <span className="w-5" />
                    )}

                    {item.type === 'file' ? (
                        <FileText className="w-4 h-4 text-gray-500" />
                    ) : item.type === 'folder' ? (
                        <Folder className="w-4 h-4 text-gray-500" />
                    ) : (
                        <Clock className="w-4 h-4 text-gray-500" />
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
                        <span className={`truncate ${item.type === 'section' ? 'text-xs font-semibold text-gray-500 uppercase tracking-wider' : ''}`}>
                            {item.title}
                        </span>
                    )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <div
                            className="p-1 hover:bg-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Plus className="w-3 h-3 text-gray-500" />
                        </div>
                    </Dropdown>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-4 border-l border-gray-200 pl-1">
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
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface DocumentWorkspaceProps {
    documentId: string;
}

export default function DocumentWorkspace({ documentId }: DocumentWorkspaceProps) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState('api-ref')
    const [searchValue, setSearchValue] = useState('')
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<ViewMode>("edit");
    const [isSaving, setIsSaving] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [previewVersion, setPreviewVersion] = useState<any | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Add Node State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addNodeParentId, setAddNodeParentId] = useState<string | null>(null);
    const [addNodeType, setAddNodeType] = useState<'file' | 'folder'>('folder');
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();

    const { data: documentHub, isLoading: documentHubLoading } = useDocumentHub(documentId)

    // Fetch selected document content
    const { data: documentContent, isLoading: isDocumentLoading, refetch: refetchDocument } = useQuery({
        queryKey: ['document', selectedDoc],
        queryFn: () => DocumentHubService.getDocument(selectedDoc),
        enabled: !!selectedDoc && selectedDoc !== 'api-ref', // Don't fetch if placeholder
    });

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
    });

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
                }
            }
        }
    }, [documentHub?.treeNodes]);

    // Handle browser back/refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Update editor content when document changes or preview version changes
    useEffect(() => {
        if (!editor) return;

        let contentToLoad = [];

        if (previewVersion) {
            contentToLoad = Array.isArray(previewVersion.content) ? previewVersion.content : [];
            editor.isEditable = false; // Read-only in preview
        } else if (documentContent?.content) {
            contentToLoad = Array.isArray(documentContent.content) ? documentContent.content : [];
            editor.isEditable = true; // Editable otherwise
        } else {
            contentToLoad = [];
            editor.isEditable = true;
        }

        if (contentToLoad.length > 0) {
            editor.replaceBlocks(editor.document, contentToLoad);
        } else {
            editor.replaceBlocks(editor.document, [{ type: "paragraph", content: [] }]);
        }

        setIsDirty(false); // Reset dirty state on new document load
    }, [documentContent, editor, previewVersion]);

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

        return roots;
    }, [documentHub?.treeNodes]);

    const confirmAction = (action: () => void) => {
        if (isDirty) {
            modal.confirm({
                title: 'Unsaved Changes',
                content: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
                okText: 'Leave',
                cancelText: 'Stay',
                onOk: () => {
                    setIsDirty(false);
                    action();
                }
            });
        } else {
            action();
        }
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
            await DocumentHubService.createTreeNode({
                documentHubId: documentId,
                parentId: addNodeParentId,
                type: addNodeType,
                title: values.name
            });

            // Add a small delay to ensure the loader is visible and prevent double clicks
            await new Promise(resolve => setTimeout(resolve, 500));

            messageApi.success(`${addNodeType === 'folder' ? 'Folder' : 'File'} created successfully`);
            setIsAddModalOpen(false);
            form.resetFields();

            // Invalidate query to refetch tree
            // Note: Using the same key construction as in useGlobalData
            queryClient.invalidateQueries({ queryKey: [...globalDataKeys.tickets, documentId] });

            // If we added to a parent, ensure it's expanded
            if (addNodeParentId) {
                setExpandedIds(prev => new Set(prev).add(addNodeParentId));
            }

        } catch (error) {
            console.error(error);
            messageApi.error('Failed to create item');
        } finally {
            setIsCreatingNode(false);
        }
    }

    const handleSaveDocument = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const content = editor.document;
            await DocumentHubService.updateDocument(selectedDoc, { content });
            messageApi.success('Document saved successfully');
            setIsDirty(false);
            refetchDocument();
            // Refetch history if open
            if (isHistoryOpen) {
                refetchHistory();
            }
        } catch (error) {
            console.error('Failed to save document:', error);
            messageApi.error('Failed to save document');
        } finally {
            setIsSaving(false);
        }
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
                    setIsSaving(true);
                    // Use the content from the preview version
                    const content = previewVersion.content;
                    await DocumentHubService.updateDocument(selectedDoc, { content });
                    messageApi.success('Version restored successfully');
                    setPreviewVersion(null); // Exit preview
                    refetchDocument(); // Refresh current doc
                    if (isHistoryOpen) refetchHistory(); // Refresh history
                } catch (error) {
                    console.error('Failed to restore version:', error);
                    messageApi.error('Failed to restore version');
                } finally {
                    setIsSaving(false);
                }
            }
        });
    };

    const handleNodeSelect = (treeNodeId: string) => {
        confirmAction(() => {
            const node = documentHub?.treeNodes?.find((n: DocumentTreeNode) => n.id === treeNodeId);
            if (node && node.type === 'file' && node.documentId) {
                setSelectedDoc(node.documentId);
                setPreviewVersion(null); // Reset preview when switching docs
            }
        });
    };

    const selectedTreeNodeId = useMemo(() => {
        return documentHub?.treeNodes?.find((n: DocumentTreeNode) => n.documentId === selectedDoc)?.id || '';
    }, [documentHub?.treeNodes, selectedDoc]);

    const handleRenameNode = async (id: string, newTitle: string) => {
        try {
            await DocumentHubService.updateTreeNode(id, { title: newTitle });
            messageApi.success('Renamed successfully');
            queryClient.invalidateQueries({ queryKey: [...globalDataKeys.tickets, documentId] });
            // Also refetch document if it's the currently selected one
            if (selectedTreeNodeId === id) {
                refetchDocument();
            }
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to rename item');
        }
    };

    const handleDeleteDocument = async (id: string, type: 'file' | 'folder', docId?: string) => {
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
                        await DocumentHubService.deleteDocument(docId);
                        messageApi.success('Document deleted');
                        // Invalidate document hub to refresh tree (removes deleted node)
                        queryClient.invalidateQueries({ queryKey: [...globalDataKeys.tickets, documentId] });
                        // Invalidate the individual document cache
                        queryClient.removeQueries({ queryKey: ['document', docId] });
                        // Invalidate document history cache
                        queryClient.removeQueries({ queryKey: ['documentHistory', docId] });
                        if (selectedDoc === docId) {
                            setSelectedDoc('api-ref');
                        }
                    } catch (error) {
                        console.error(error);
                        messageApi.error('Failed to delete document');
                    }
                }
            });
        } else {
            messageApi.warning('Deleting folders is not yet supported in this version.');
        }
    };

    return (
        <MainLayout>
            {contextHolder}
            {modalContextHolder}
            <div className="flex h-[calc(100vh-64px)] w-full bg-white">
                {/* Sidebar */}
                {!isFullScreen && (
                    <aside
                        className={`flex flex-col border-r border-gray-200 bg-[#f5f5f5] transition-all duration-300 overflow-hidden ${collapsed ? 'w-0 border-none' : 'w-64'
                            }`}
                    >
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between py-[4px] px-[8px] border-b border-gray-200 h-[40px]">
                            <h1 className="text-sm font-semibold text-gray-900 truncate">
                                {documentHub?.name}
                            </h1>
                        </div>

                        {!collapsed && (
                            <>
                                {/* Search */}
                                <div className="p-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Tree */}
                                <div className="flex-1 overflow-y-auto px-2">
                                    {treeData.map((item) => (
                                        <TreeNode
                                            key={item.id}
                                            item={item}
                                            selectedId={selectedTreeNodeId}
                                            onSelect={handleNodeSelect}
                                            expandedIds={expandedIds}
                                            onToggleExpand={toggleExpand}
                                            onAddNode={handleAddNode}
                                            onRenameNode={handleRenameNode}
                                            onDeleteDocument={handleDeleteDocument}
                                        />
                                    ))}
                                </div>

                                {/* New Document Button (Root Level) */}
                                <div className="p-4 border-t border-gray-200">
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
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors">
                                            <Plus className="w-4 h-4" />
                                            New Item
                                        </button>
                                    </Dropdown>
                                </div>
                            </>
                        )}
                    </aside>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex items-center justify-between py-[4px] px-[8px] border-b border-gray-200 bg-white">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => confirmAction(() => router.push('/documenthub'))}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-600 mr-1"
                                title="Back to Document Hub"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-1" />
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                            >
                                {collapsed ? (
                                    <PanelLeft className="w-5 h-5" />
                                ) : (
                                    <PanelLeftClose className="w-5 h-5" />
                                )}
                            </button>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {documentContent?.title || 'Select a document'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedDoc && selectedDoc !== 'api-ref' && (
                                <>
                                    <Segmented
                                        value={viewMode}
                                        onChange={(value) => setViewMode(value as ViewMode)}
                                        options={[
                                            {
                                                label: "Edit",
                                                value: "edit",
                                                icon: <EditOutlined className="w-4 h-4" />,
                                            },
                                            {
                                                label: "Preview",
                                                value: "preview",
                                                icon: <EyeOutlined className="w-4 h-4" />,
                                            },
                                            {
                                                label: "Combined",
                                                value: "combined",
                                                icon: <SplitCellsOutlined className="w-4 h-4" />,
                                            },
                                        ]}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined className="w-4 h-4" />}
                                        loading={isSaving}
                                        onClick={handleSaveDocument}
                                    >
                                        Save
                                    </Button>
                                    <Tooltip title="Open in New Tab">
                                        <Button
                                            icon={<ExportOutlined className="w-4 h-4" />}
                                            onClick={() => window.open(`/document/${selectedDoc}`, '_blank')}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Share Document">
                                        <Button
                                            icon={<Share2 className="w-4 h-4" />}
                                            onClick={() => setIsShareOpen(true)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Delete Document">
                                        <Button
                                            danger
                                            icon={<Trash className="w-4 h-4" />}
                                            onClick={() => handleDeleteDocument(selectedDoc, 'file', selectedDoc)}
                                        />
                                    </Tooltip>
                                    <div className="h-6 w-px bg-gray-200 mx-2" />
                                </>
                            )}
                            <Tooltip title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                                <Button
                                    type="text"
                                    icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
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
                                className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md ${isHistoryOpen ? 'bg-gray-100' : ''}`}
                                onClick={() => setIsHistoryOpen(true)}
                            >
                                <History className="w-4 h-4" />
                                History
                            </button>
                        </div>
                    </header>

                    {/* Editor Content */}
                    <main className="flex-1 overflow-auto px-4 pt-4 pb-2 bg-white flex flex-col">
                        {previewVersion && (
                            <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center justify-between mb-4 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <History className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        Viewing version from {new Date(previewVersion.createdAt).toLocaleString()}
                                    </span>
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
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                </div>
                            ) : (
                                <DocumentEditor
                                    editor={editor}
                                    viewMode={viewMode}
                                    onChange={() => setIsDirty(true)}
                                />
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Select a document to edit
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Drawer
                title="Document History"
                placement="right"
                onClose={() => setIsHistoryOpen(false)}
                open={isHistoryOpen}
                width={400}
            >
                <DocumentHistory
                    history={documentHistory}
                    isLoading={isHistoryLoading}
                    onSelectVersion={handleSelectVersion}
                />
            </Drawer>

            <ShareModal
                open={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                documentId={selectedDoc}
                documentTitle={documentContent?.title || ''}
                currentVisibility={documentContent?.visibility || 'private'}
                currentShareToken={documentContent?.shareToken || null}
            />

            <Modal
                title={`Create New ${addNodeType === 'folder' ? 'Folder' : 'File'}`}
                open={isAddModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateNode}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter a name' }]}
                    >
                        <Input placeholder={`Enter ${addNodeType} name`} autoFocus />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={isCreatingNode}>
                            Create
                        </Button>
                    </div>
                </Form>
            </Modal>
        </MainLayout>
    )
}
