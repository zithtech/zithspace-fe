import React, { useEffect, useState } from "react";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { Modal, Button, Input, message, Tooltip, Space, Typography, Spin } from "antd";
import { RobotOutlined, SendOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { aiService } from "@/services/ai";

export type ViewMode = "edit" | "preview" | "combined";

interface DocumentEditorProps {
  editor: BlockNoteEditor | null;
  viewMode: ViewMode;
  onChange?: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  editor,
  viewMode,
  onChange,
}) => {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // AI Selection State
  const [selection, setSelection] = useState<{ text: string; position: { top: number; left: number } } | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleMouseUp = () => {
    // Small delay to let the browser update selection
    setTimeout(() => {
      const activeSelection = window.getSelection();
      const selectedText = activeSelection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = activeSelection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();

        if (rect) {
          setSelection({
            text: selectedText,
            position: {
              top: rect.top + window.scrollY - 45,
              left: rect.left + window.scrollX + (rect.width / 2) - 20
            }
          });
        }
      } else {
        // Only clear if the modal is not open
        if (!isAIModalOpen) {
          setSelection(null);
        }
      }
    }, 10);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isAIModalOpen]);

  const handleAIProcess = async () => {
    if (!selection || !aiPrompt.trim()) return;

    setIsProcessing(true);
    try {
      const result = await aiService.processText(selection.text, aiPrompt);
      handleReplaceSelectionWithResult(result);
    } catch (error) {
      console.error("AI processing error:", error);
      message.error("Failed to process text");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    message.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // const handleReplaceSelectionWithResult = (resultText?: string) => {
  //   const textToUse = resultText || aiResult;
  //   if (!editor || !textToUse) return;

  //   const selectedBlocks = editor.getSelection()?.blocks || [];

  //   if (selectedBlocks.length > 0) {
  //     // Split AI result into lines and create blocks
  //     const lines = textToUse.split("\n").filter(line => line.trim() !== "");
  //     const newBlocks: any[] = lines.map(line => ({
  //       type: "paragraph",
  //       content: [{ type: "text", text: line, styles: {} }]
  //     }));

  //     try {
  //       editor.replaceBlocks(selectedBlocks, newBlocks);
  //       message.success("Text replaced directly in editor");
  //       setIsAIModalOpen(false);
  //       setSelection(null);
  //       if (onChange) onChange();
  //     } catch (error) {
  //       console.error("Failed to replace blocks:", error);
  //       message.error("Failed to replace text in editor");
  //     }
  //   } else {
  //     // Fallback: insert at cursor if no blocks are "selected" in the BlockNote sense
  //     try {
  //       editor.insertBlocks(
  //         [{ type: "paragraph", content: [{ type: "text", text: textToUse, styles: {} }] }],
  //         editor.getTextCursorPosition().block,
  //         "after"
  //       );
  //       message.success("Text inserted at cursor");
  //       setIsAIModalOpen(false);
  //       setSelection(null);
  //       if (onChange) onChange();
  //     } catch (error) {
  //       message.warning("Please select text in the editor first");
  //     }
  //   }
  // };

  const handleReplaceSelectionWithResult = (resultText?: string) => {
    const textToUse = resultText || aiResult;

    if (!editor || !textToUse?.trim()) return;

    try {
      const selectedBlocks = editor.getSelection()?.blocks || [];

      // ===============================
      // CASE 1: USER SELECTED CONTENT
      // Replace selected blocks directly
      // ===============================
      if (selectedBlocks.length > 0) {
        const lines = textToUse
          .split("\n")
          .filter((line) => line.trim() !== "");

        const newBlocks = lines.map((line) => ({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: line,
              styles: {},
            },
          ],
        }));

        editor.replaceBlocks(selectedBlocks, newBlocks as any);

        message.success("Selected text replaced successfully");
      }

      // ===============================
      // CASE 2: NO TEXT SELECTED
      // Insert at cursor position
      // ===============================
      else {
        editor.insertBlocks(
          [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: textToUse,
                  styles: {},
                },
              ],
            },
          ],
          editor.getTextCursorPosition().block,
          "after"
        );

        message.success("AI content inserted at cursor");
      }

      // ===============================
      // RESET UI
      // ===============================
      setIsAIModalOpen(false);
      setSelection(null);
      setAiPrompt("");
      setAiResult("");

      if (onChange) onChange();
    } catch (error) {
      console.error("Editor update failed:", error);
      message.error("Failed to update editor content");
    }
  };
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const theme = document.documentElement.getAttribute('data-theme');
          setCurrentTheme(theme === 'dark' ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Initial check
    const initialTheme = document.documentElement.getAttribute('data-theme');
    setCurrentTheme(initialTheme === 'dark' ? 'dark' : 'light');

    return () => observer.disconnect();
  }, []);

  // Secondary editor for the "Combined" view's preview pane
  const previewEditor = useCreateBlockNote();

  // Sync previewEditor with main editor content
  useEffect(() => {
    if (editor && previewEditor && viewMode === "combined") {
      const syncContent = () => {
        const blocks = editor.document;
        previewEditor.replaceBlocks(previewEditor.document, blocks);
      };

      // Initial sync
      syncContent();
    }
  }, [editor, previewEditor, viewMode]);

  if (!editor) {
    return null;
  }

  const handleEditorChange = () => {
    if (viewMode === "combined" && previewEditor) {
      previewEditor.replaceBlocks(previewEditor.document, editor.document);
    }
    if (onChange) {
      onChange();
    }
  }

  const renderEditor = (instance: BlockNoteEditor, editable: boolean, onInternalChange?: () => void) => (
    <div className="h-full overflow-auto p-4 bg-white rounded-lg shadow-sm border border-gray-100" style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }}>
      <BlockNoteView
        editor={instance}
        editable={editable}
        theme={currentTheme}
        onChange={onInternalChange || (editable ? onChange : undefined)}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "edit" && renderEditor(editor, true)}
        {viewMode === "preview" && renderEditor(editor, false)}
        {viewMode === "combined" && (
          <div className="flex h-full gap-4">
            <div className="flex-1 h-full overflow-hidden border-r border-gray-200" style={{ borderRightColor: 'var(--border-slate-200)' }}>
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2" style={{ color: 'var(--text-slate-400)' }}>
                EDITOR
              </div>
              {/* Main editor: Editable, triggers sync on change */}
              {renderEditor(editor, true, handleEditorChange)}
            </div>
            <div className="flex-1 h-full overflow-hidden">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2" style={{ color: 'var(--text-slate-400)' }}>
                PREVIEW
              </div>
              {/* Preview editor: Read-only */}
              {previewEditor ? renderEditor(previewEditor, false) : <div>Loading Preview...</div>}
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Icon */}
      {selection && !isAIModalOpen && (
        <div
          style={{
            position: 'absolute',
            top: selection.position.top,
            left: selection.position.left,
            zIndex: 1000,
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          <Tooltip title="AI Assistant">
            <Button
              type="primary"
              shape="circle"
              icon={<RobotOutlined />}
              size="large"
              onClick={() => {
                setIsAIModalOpen(true);
                setAiResult("");
                setAiPrompt("");
              }}
              style={{
                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.4)',
                background: 'linear-gradient(135deg, #1677ff 0%, #003eb3 100%)',
                border: 'none'
              }}
            />
          </Tooltip>
        </div>
      )}

      {/* AI Assistant Modal */}
      <Modal
        title={
          <Space>
            <div style={{
              background: "linear-gradient(135deg, #1677ff 0%, #003eb3 100%)",
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RobotOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            <span style={{ fontWeight: 600 }}>AI Assistant</span>
          </Space>
        }
        open={isAIModalOpen}
        onCancel={() => {
          setIsAIModalOpen(false);
          setSelection(null);
        }}
        footer={null}
        width={600}
        centered
        destroyOnClose
      >
        <div style={{ padding: '8px 0' }}>
          <Typography.Text type="secondary">Selected Text:</Typography.Text>
          <div style={{
            maxHeight: '100px',
            overflowY: 'auto',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            margin: '8px 0 20px 0',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
            "{selection?.text}"
          </div>

          <Typography.Text strong>What would you like to do?</Typography.Text>
          <Space.Compact style={{ width: '100%', marginTop: '8px' }}>
            <Input
              placeholder="e.g., Rewrite this to be more professional, Summarize this, Fix grammar..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onPressEnter={handleAIProcess}
              disabled={isProcessing}
              style={{ height: '40px', borderRadius: '8px 0 0 8px' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAIProcess}
              loading={isProcessing}
              style={{ height: '40px', borderRadius: '0 8px 8px 0' }}
            >
              Process
            </Button>
          </Space.Compact>

          {isProcessing && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Spin tip="AI is processing your request..." />
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DocumentEditor;