import NoData from "@/components/common/NoData";
import React, { useState, useEffect } from "react";
import { Modal, Breadcrumb, List, Checkbox, Button, Spin, Empty, message, Progress, ConfigProvider, theme as antdTheme } from "antd";
import { Folder, File, ArrowLeft } from "lucide-react";
import { CloudDownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { api } from "@/lib/axios";
import { useTheme } from "@/context/ThemeContext";
import {
  TicketFlowHeader,
  ticketFlowModalProps,
  ticketFlowStyles,
  tfWrapClass,
  NotionMark,
  AzureMark,
} from "@/components/projects/bug-list/ticket-flow";

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

export function GoogleDriveMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.2 14.5L12 21L24 21L20.2 14.5L8.2 14.5Z" fill="#1FA363"/>
      <path d="M3.8 21L0 14.5L6 4L9.8 10.5L3.8 21Z" fill="#005BCA"/>
      <path d="M12 4L18 4L24 14.5L18 14.5L12 4Z" fill="#FDD700"/>
    </svg>
  );
}

const ExternalDriveBrowserModal: React.FC<ExternalDriveBrowserModalProps> = ({
  open,
  onClose,
  hubId,
  parentId,
  provider,
  onImportComplete,
}) => {
  const { theme } = useTheme();
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
        ? `/api/v2/document-hubs/${hubId}/external/notion/files?folderId=${folderId}`
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
    if (provider === "my_computer") {
      const fileInput = document.getElementById("local-upload-input") as HTMLInputElement;
      if (fileInput) fileInput.click();
      return;
    }
    
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

  const getProviderName = () => {
    switch (provider) {
      case "google_drive": return "Google Drive";
      case "zoho_drive": return "Zoho Drive";
      case "my_computer": return "My Computer";
      case "microsoft_onedrive": return "OneDrive";
      case "notion": return "Notion";
      default: return "External Drive";
    }
  };

  const getProviderMark = () => {
    switch (provider) {
      case "google_drive": return <GoogleDriveMark size={22} />;
      case "microsoft_onedrive": return <AzureMark size={22} />;
      case "notion": return <NotionMark size={22} />;
      case "my_computer": return <UploadOutlined style={{ fontSize: 22, color: '#64748b' }} />;
      default: return <CloudDownloadOutlined style={{ fontSize: 22, color: '#64748b' }} />;
    }
  };

  const renderContent = () => {
    if (provider === "my_computer") {
      return (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" style={{ margin: 20 }}>
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-5">
            <UploadOutlined className="text-4xl text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Upload Files from Your Computer</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center max-w-md">
            Select files from your device to upload them directly into this Document Hub. You can select multiple files at once.
          </p>
          <div className="relative overflow-hidden inline-block">
            <input 
              id="local-upload-input"
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
        <div className="flex flex-col items-center justify-center py-12 px-4" style={{ margin: 20 }}>
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
      <div className="flex flex-col h-[55vh]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Button 
              type="text" 
              icon={<ArrowLeft size={16} className="text-slate-500" />} 
              onClick={handleBack} 
              disabled={folderStack.length <= 1} 
              size="small"
              className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            />
            <Breadcrumb
              separator={<span className="text-slate-300 dark:text-slate-600">/</span>}
              items={folderStack.map((f, i) => ({
                key: f.id,
                title: (
                  <a 
                    onClick={() => handleBreadcrumbClick(i)}
                    className={`font-semibold text-[13px] tracking-wide transition-colors ${i === folderStack.length - 1 ? 'text-slate-800 dark:text-slate-200 cursor-default' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                  >
                    {f.name.toUpperCase()}
                  </a>
                )
              }))}
            />
          </div>
          <div className="text-xs font-medium text-slate-400">
            {files.length} {files.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-full text-slate-400 py-12">
              <Spin size="large" />
              <span className="mt-4 font-medium text-sm">Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <NoData description={<span className="text-slate-500 font-medium">No files found</span>} />
          ) : (
            <div className="flex flex-col border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-[#151b28] shadow-sm overflow-hidden">
              {files.map((file) => {
                const folder = isFolder(file.mimeType);
                const isSelected = selectedIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    className={`group relative flex items-center w-full transition-all duration-200 ease-in-out cursor-pointer px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0
                      ${isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-900/15' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}
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
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r-full" />
                    )}
                    
                    <div className="mr-4 flex items-center justify-center w-5" onClick={(e) => e.stopPropagation()}>
                      {!folder ? (
                        <Checkbox 
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(file.id);
                            else newSet.delete(file.id);
                            setSelectedIds(newSet);
                          }}
                          className={`scale-110 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                      ) : (
                         <div className="w-5" />
                      )}
                    </div>
                    
                    <div className={`mr-4 p-2 rounded-xl flex items-center justify-center transition-all ${
                        folder 
                          ? 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 text-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-amber-200/50 dark:border-amber-700/50' 
                          : 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/10 text-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-blue-200/50 dark:border-blue-700/50'
                      }`}
                    >
                      {folder ? <Folder size={18} strokeWidth={2.5} className="fill-amber-500/20" /> : <File size={18} strokeWidth={2.5} className="fill-blue-500/20" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <div className={`font-medium truncate transition-colors text-[14.5px] ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                        {file.name}
                      </div>
                      <div className="text-[12.5px] font-medium text-slate-400 dark:text-slate-500/80 mt-0.5">
                        {folder ? 'Folder' : 'File'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const body = (
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgContainer: theme === "dark" ? "#141A26" : "#F8FAFC",
          colorText: theme === "dark" ? "#F1F5F9" : "#0F172A",
          borderRadius: 9,
        },
      }}
    >
      <div className="tf">
        <TicketFlowHeader
          mark={getProviderMark()}
          plate
          eyebrow={`Import from ${getProviderName()}`}
          title="Select files to import"
          onClose={!importing ? onClose : undefined}
          chips={[
            { icon: <CloudDownloadOutlined />, label: `${selectedIds.size} file(s) selected`, tone: selectedIds.size > 0 ? "accent" : "default" }
          ]}
        />
        <div className="tf-body">
          <div className="tf-form">
            {renderContent()}
          </div>
        </div>
        <footer className="tf-foot">
          <div className="tf-foot-left">
            {importing && (
              <div className="flex items-center gap-3 w-full max-w-[200px]">
                <Progress percent={progress} size="small" showInfo={false} strokeColor="#3b82f6" className="flex-1 m-0" />
                <span className="text-xs text-slate-500 whitespace-nowrap">Importing...</span>
              </div>
            )}
          </div>
          <div className="tf-foot-right">
            <button type="button" className="tf-secondary" onClick={onClose} disabled={importing}>
              Cancel
            </button>
            <button 
              type="button" 
              className="tf-primary" 
              onClick={handleImport} 
              disabled={importing || (provider !== "my_computer" && selectedIds.size === 0)}
            >
              {importing ? (
                <>
                  <Spin size="small" style={{ color: "white" }} />
                  Importing...
                </>
              ) : provider === "my_computer" ? "Browse Files" : "Import Selected"}
            </button>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );

  return (
    <Modal
      open={open}
      onCancel={!importing ? onClose : undefined}
      {...ticketFlowModalProps}
      width={900}
      wrapClassName={tfWrapClass(theme)}
    >
      <style>{ticketFlowStyles}</style>
      {body}
    </Modal>
  );
};

export default ExternalDriveBrowserModal;
