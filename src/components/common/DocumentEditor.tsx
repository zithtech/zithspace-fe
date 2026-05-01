import React, { useEffect, useRef } from "react";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import ZaiSelectionMenu from "@/components/documenthub/ZaiSelectionMenu";

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
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('light');

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

  // Container ref for the main editable editor — scopes the Zai selection menu
  // so it doesn't fire on selections in the read-only preview pane.
  const mainEditorContainerRef = useRef<HTMLDivElement>(null);

  const renderEditor = (
    instance: BlockNoteEditor,
    editable: boolean,
    onInternalChange?: () => void,
    ref?: React.Ref<HTMLDivElement>,
  ) => (
    <div
      ref={ref}
      className="h-full overflow-auto px-6 md:px-10 py-8 rounded-2xl"
      style={{
        background: 'var(--bg-pure-white)',
        border: '1px solid var(--border-slate-200)',
      }}
    >
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
        {viewMode === "edit" && renderEditor(editor, true, undefined, mainEditorContainerRef)}
        {viewMode === "preview" && renderEditor(editor, false)}
        {viewMode === "combined" && (
          <div className="flex h-full gap-4">
            <div className="flex-1 h-full overflow-hidden border-r border-gray-200" style={{ borderRightColor: 'var(--border-slate-200)' }}>
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2" style={{ color: 'var(--text-slate-400)' }}>
                EDITOR
              </div>
              {/* Main editor: Editable, triggers sync on change */}
              {renderEditor(editor, true, handleEditorChange, mainEditorContainerRef)}
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

      {/* Inline Zai menu — appears whenever the user selects text in the main
          editor. Hidden in pure-preview mode. */}
      {viewMode !== "preview" && (
        <ZaiSelectionMenu
          editor={editor}
          containerRef={mainEditorContainerRef}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default DocumentEditor;