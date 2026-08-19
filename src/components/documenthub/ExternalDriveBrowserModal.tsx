import React, { useState, useEffect } from "react";
import { Modal, Breadcrumb, List, Checkbox, Button, Spin, Empty, message, Progress } from "antd";
import { Folder, File, ArrowLeft } from "lucide-react";
import { CloudDownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { api } from "@/lib/axios";

export type DriveProvider = "google_drive" | "zoho_drive" | "my_computer" | "microsoft_onedrive";

interface ExternalDriveBrowserModalProps {
  open: boolean;
  onClose: () => void;
  hubId: string;
  parentId?: string | null;
  provider: DriveProvider;
  onImportComplete: () => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
}

const ExternalDriveBrowserModal: React.FC<ExternalDriveBrowserModalProps> = ({
  open,
  onClose,
  hubId,
  parentId,
  provider,
  onImportComplete,
}) => {
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([{ id: "root", name: "Root" }]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentFolderId = folderStack[folderStack.length - 1]?.id || "root";

  useEffect(() => {
    if (open && provider !== "my_computer") {
      fetchFiles(currentFolderId);
    }
  }, [open, currentFolderId, provider]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFolderStack([{ id: "root", name: "Root" }]);
      setSelectedIds(new Set());
      setProgress(0);
      setImporting(false);
      setErrorMsg(null);
    }
  }, [open]);

  const fetchFiles = async (folderId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = provider === "google_drive" 
        ? `/api/v2/document-hubs/${hubId}/external/google/files?folderId=${folderId}`
        : provider === "zoho_drive" 
        ? `/api/v2/document-hubs/${hubId}/external/zoho/files?folderId=${folderId}`
        : `/api/v2/document-hubs/${hubId}/external/onedrive/files?folderId=${folderId}`;
        
      const data = await api.get(endpoint);
      setFiles(data || []);
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        let msg = `Your ${provider === "google_drive" ? "Google" : provider === "zoho_drive" ? "Zoho" : "Microsoft"} connection is missing Drive permissions. Please reconnect it from Integrations.`;
        if (error.message && error.message.includes("Google Error:")) {
           msg += `\n\nDetail: ${error.message}`;
        }
        setErrorMsg(msg);
      } else if (error.code === 'TOKEN_EXPIRED') {
        setErrorMsg("Session expired. Please login again.");
      } else {
        setErrorMsg(error.message || "An error occurred while fetching files.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFolder = (mimeType: string) => {
    return mimeType === "application/vnd.google-apps.folder" || mimeType === "folder"; // simplified check
  };

  const handleFolderClick = (file: DriveFile) => {
    setFolderStack([...folderStack, { id: file.id, name: file.name }]);
  };

  const handleBack = () => {
    if (folderStack.length > 1) {
      setFolderStack(folderStack.slice(0, -1));
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderStack(folderStack.slice(0, index + 1));
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    
    setImporting(true);
    setProgress(0);
    
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    const total = selectedFiles.length;
    let completed = 0;
    let errors = 0;

    for (const file of selectedFiles) {
      try {
        const endpoint = provider === "google_drive"
          ? `/api/v2/document-hubs/${hubId}/external/google/import`
          : provider === "zoho_drive"
          ? `/api/v2/document-hubs/${hubId}/external/zoho/import`
          : `/api/v2/document-hubs/${hubId}/external/onedrive/import`;

        await api.post(endpoint, {
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          ...(parentId ? { parentId } : {})
        });
      } catch (err: any) {
        if (err.status !== 409) { // ignore duplicates
          errors++;
          console.error("Failed to import", file.name, err);
        }
      } finally {
        completed++;
        setProgress(Math.round((completed / total) * 100));
      }
    }

    setImporting(false);
    if (errors > 0) {
      message.warning(`Imported ${completed - errors} files, ${errors} failed.`);
    } else {
      message.success(`Successfully imported ${completed} files.`);
    }
    
    onImportComplete();
    onClose();
  };

  const handleLocalUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = event.target.files;
    if (!filesList || filesList.length === 0) return;

    setImporting(true);
    setProgress(0);
    
    const total = filesList.length;
    let completed = 0;
    
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const formData = new FormData();
      formData.append("file", file);
      if (parentId) formData.append("parentId", parentId);

      try {
        await api.post(`/api/v2/document-hubs/${hubId}/upload/local`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (err: any) {
        console.error("Failed to upload local file", err);
      } finally {
        completed++;
        setProgress(Math.round((completed / total) * 100));
      }
    }

    setImporting(false);
    message.success(`Successfully uploaded ${completed} files.`);
    onImportComplete();
    onClose();
  };

  const renderContent = () => {
    if (provider === "my_computer") {
      return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
          <UploadOutlined className="text-4xl text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200">Upload Files from Your Computer</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 text-center max-w-sm">
            Select files from your device to upload them directly into this Document Hub.
          </p>
          <div className="relative overflow-hidden inline-block">
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleLocalUpload}
              disabled={importing}
            />
            <Button type="primary" loading={importing}>Browse Files</Button>
          </div>
          {importing && (
            <div className="w-full max-w-sm mt-6">
              <Progress percent={progress} size="small" />
              <p className="text-xs text-center text-gray-500 dark:text-slate-400 mt-1">Uploading and extracting content...</p>
            </div>
          )}
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{errorMsg}</div>
          <Button 
            type="primary" 
            onClick={() => window.open(`/integrations`, "_blank")}
          >
            Go to Integrations
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[60vh]">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-slate-800/50 rounded">
          <Button 
            type="text" 
            icon={<ArrowLeft size={16} />} 
            onClick={handleBack} 
            disabled={folderStack.length <= 1} 
          />
          <Breadcrumb
            items={folderStack.map((f, i) => ({
              key: f.id,
              title: <a onClick={() => handleBreadcrumbClick(i)}>{f.name}</a>
            }))}
          />
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin />
            </div>
          ) : files.length === 0 ? (
            <Empty description="No files found" className="mt-10" />
          ) : (
            <List
              dataSource={files}
              renderItem={(file) => {
                const folder = isFolder(file.mimeType);
                return (
                  <List.Item
                    className={`hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer px-4 ${selectedIds.has(file.id) ? 'bg-blue-50 dark:bg-slate-800' : ''}`}
                    onClick={() => {
                      if (folder) {
                        handleFolderClick(file);
                      } else {
                        const newSet = new Set(selectedIds);
                        if (newSet.has(file.id)) newSet.delete(file.id);
                        else newSet.add(file.id);
                        setSelectedIds(newSet);
                      }
                    }}
                  >
                    <div className="flex items-center w-full">
                      <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                        {!folder && (
                          <Checkbox 
                            checked={selectedIds.has(file.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedIds);
                              if (e.target.checked) newSet.add(file.id);
                              else newSet.delete(file.id);
                              setSelectedIds(newSet);
                            }}
                          />
                        )}
                      </div>
                      <div className="mr-3 text-gray-500 dark:text-slate-400">
                        {folder ? <Folder size={20} className="text-yellow-500" /> : <File size={20} />}
                      </div>
                      <div className="flex-1 truncate dark:text-slate-200">{file.name}</div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-slate-400">
            {selectedIds.size} file(s) selected
          </div>
          <div className="flex items-center gap-3">
            {importing && (
              <div className="flex flex-col items-end">
                <Progress percent={progress} size="small" style={{ width: 150, margin: 0 }} />
                <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Importing & extracting...</span>
              </div>
            )}
            <Button onClick={onClose} disabled={importing}>Cancel</Button>
            <Button 
              type="primary" 
              icon={<CloudDownloadOutlined />} 
              onClick={handleImport}
              loading={importing}
              disabled={selectedIds.size === 0}
            >
              Import Selected
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (provider) {
      case "google_drive": return "Import from Google Drive";
      case "zoho_drive": return "Import from Zoho Drive";
      case "my_computer": return "Upload from My Computer";
      default: return "Upload File";
    }
  };

  return (
    <Modal
      open={open}
      title={getTitle()}
      onCancel={!importing ? onClose : undefined}
      footer={null}
      width={700}
      destroyOnHidden
      maskClosable={!importing}
      closable={!importing}
    >
      {renderContent()}
    </Modal>
  );
};

export default ExternalDriveBrowserModal;
