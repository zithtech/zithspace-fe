import React, { useState, useEffect } from "react";
import { Modal, Breadcrumb, List, Checkbox, Button, Spin, Empty, message, Progress } from "antd";
import { Folder, File, ArrowLeft } from "lucide-react";
import { CloudDownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { api } from "@/lib/axios";

export type DriveProvider = "google_drive" | "zoho_drive" | "my_computer" | "microsoft_onedrive" | "notion";

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

  // Simulated progress during import
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (importing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          // Random increment between 2 and 8
          const increment = Math.floor(Math.random() * 7) + 2;
          return Math.min(95, prev + increment);
        });
      }, 600);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [importing]);

  const fetchFiles = async (folderId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const endpoint = provider === "google_drive" 
        ? `/api/v2/document-hubs/${hubId}/external/google/files?folderId=${folderId}`
        : provider === "zoho_drive" 
        ? `/api/v2/document-hubs/${hubId}/external/zoho/files?folderId=${folderId}`
        : provider === "notion"
        ? `/api/v2/document-hubs/${hubId}/external/notion/files`
        : `/api/v2/document-hubs/${hubId}/external/onedrive/files?folderId=${folderId}`;
        
      const data = await api.get(endpoint);
      setFiles(data || []);
    } catch (error: any) {
      if (error.status === 403 || error.status === 401) {
        let msg = `Your ${provider === "google_drive" ? "Google" : provider === "zoho_drive" ? "Zoho" : provider === "notion" ? "Notion" : "Microsoft"} connection is missing Drive permissions. Please reconnect it from Integrations.`;
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

  const handleConnectNotion = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/v2/auth/notion/connect');
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Failed to get notion auth url", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    
    setImporting(true);
    
    const selectedFiles = files.filter(f => selectedIds.has(f.id));
    let completed = 0;
    let errors = 0;

    for (const file of selectedFiles) {
      try {
        const endpoint = provider === "google_drive"
          ? `/api/v2/document-hubs/${hubId}/external/google/import`
          : provider === "zoho_drive"
          ? `/api/v2/document-hubs/${hubId}/external/zoho/import`
          : provider === "notion"
          ? `/api/v2/document-hubs/${hubId}/external/notion/import`
          : `/api/v2/document-hubs/${hubId}/external/onedrive/import`;

        await api.post(endpoint, {
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          ...(parentId ? { parentId } : {})
        });
        completed++;
      } catch (err: any) {
        if (err.status !== 409) { // ignore duplicates
          errors++;
          console.error("Failed to import", file.name, err);
        }
      }
    }

    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 400)); // Allow progress bar to animate to 100%
    setImporting(false);
    
    if (errors > 0) {
      message.warning(`Imported ${completed} files, ${errors} failed.`);
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
    
    let completed = 0;
    let errors = 0;
    
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const formData = new FormData();
      formData.append("file", file);
      if (parentId) formData.append("parentId", parentId);

      try {
        await api.post(`/api/v2/document-hubs/${hubId}/upload/local`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        completed++;
      } catch (err: any) {
        errors++;
        console.error("Failed to upload local file", err);
      }
    }

    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 400));
    setImporting(false);
    
    if (errors > 0) {
      message.warning(`Uploaded ${completed} files, ${errors} failed.`);
    } else {
      message.success(`Successfully uploaded ${completed} files.`);
    }
    
    onImportComplete();
    onClose();
  };

  const renderContent = () => {
    if (provider === "my_computer") {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-5">
            <UploadOutlined className="text-4xl text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Upload Files from Your Computer</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
            Select files from your device to upload them directly into this Document Hub. You can select multiple files at once.
          </p>
          <div className="relative overflow-hidden inline-block">
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleLocalUpload}
              disabled={importing}
            />
            <Button type="primary" size="large" loading={importing} className="px-8 shadow-md hover:shadow-lg transition-shadow">
              Browse Files
            </Button>
          </div>
          {importing && (
            <div className="w-full max-w-md mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
              <Progress percent={progress} size="small" status="active" strokeColor="#3b82f6" />
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-2 font-medium">Uploading and extracting content...</p>
            </div>
          )}
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <Folder size={32} className="text-red-500" />
          </div>
          <div className="text-red-600 dark:text-red-400 font-medium text-lg mb-6 text-center max-w-lg">{errorMsg}</div>
          {provider === "notion" ? (
            <Button 
              type="primary" 
              size="large"
              onClick={handleConnectNotion}
              loading={loading}
              className="px-8 shadow-md"
            >
              Connect Notion
            </Button>
          ) : (
            <Button 
              type="primary" 
              size="large"
              onClick={() => window.open(`/integrations`, "_blank")}
              className="px-8 shadow-md"
            >
              Go to Integrations
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[70vh] -mt-2">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <Button 
            type="text" 
            icon={<ArrowLeft size={18} className="text-slate-500" />} 
            onClick={handleBack} 
            disabled={folderStack.length <= 1} 
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          />
          <Breadcrumb
            separator={<span className="text-slate-400">/</span>}
            items={folderStack.map((f, i) => ({
              key: f.id,
              title: (
                <a 
                  onClick={() => handleBreadcrumbClick(i)}
                  className={`font-medium transition-colors ${i === folderStack.length - 1 ? 'text-slate-800 dark:text-slate-200 hover:text-slate-800' : 'text-blue-500 hover:text-blue-600'}`}
                >
                  {f.name}
                </a>
              )
            }))}
          />
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#111827] shadow-inner">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-full text-slate-400">
              <Spin size="large" />
              <span className="mt-4 font-medium text-sm">Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <Empty description={<span className="text-slate-500 font-medium">No files found</span>} className="mt-20" />
          ) : (
            <List
              dataSource={files}
              className="p-1"
              renderItem={(file) => {
                const folder = isFolder(file.mimeType);
                const isSelected = selectedIds.has(file.id);
                return (
                  <List.Item
                    className={`transition-all duration-200 ease-in-out cursor-pointer px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 rounded-md mb-1
                      ${isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-900/20 shadow-sm' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
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
                      <div className="mr-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {!folder && (
                          <Checkbox 
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedIds);
                              if (e.target.checked) newSet.add(file.id);
                              else newSet.delete(file.id);
                              setSelectedIds(newSet);
                            }}
                            className="scale-110"
                          />
                        )}
                        {folder && <div className="w-[18px]"></div>} {/* Spacer to align folders with files */}
                      </div>
                      <div className={`mr-4 p-2 rounded-lg transition-colors ${folder ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'}`}>
                        {folder ? <Folder size={20} className="fill-amber-500/20" /> : <File size={20} className="fill-blue-500/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {folder ? 'Folder' : 'File'}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{selectedIds.size}</span> file(s) selected
          </div>
          <div className="flex items-center gap-3">
            {importing && (
              <div className="flex flex-col items-end mr-2">
                <Progress percent={progress} size="small" style={{ width: 160, margin: 0 }} strokeColor="#3b82f6" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Importing & extracting...</span>
              </div>
            )}
            <Button onClick={onClose} disabled={importing} size="large" className="px-6 font-medium">Cancel</Button>
            <Button 
              type="primary" 
              size="large"
              icon={<CloudDownloadOutlined />} 
              onClick={handleImport}
              loading={importing}
              disabled={selectedIds.size === 0}
              className="px-6 font-medium shadow-md hover:shadow-lg transition-shadow"
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
      width={1000}
      destroyOnHidden
      maskClosable={!importing}
      closable={!importing}
    >
      {renderContent()}
    </Modal>
  );
};

export default ExternalDriveBrowserModal;
