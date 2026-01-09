"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { $getRoot } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { Toolbar } from "./EditorToolbar";

function Placeholder() {
  return (
    <div className="absolute top-3 left-3 text-gray-400 text-sm">
      Write notes here…
    </div>
  );
}

export default function NotesEditor({
  onChange,
}: {
  onChange?: (value: string) => void;
}) {
  const config = {
    namespace: "NotesEditor",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      // Add these if you want extra formatting:
      // BoldNode, ItalicNode, UnderlineNode, StrikethroughNode
    ],
    onError(error: Error) {
      console.error(error);
    },
  };

  return (
    <LexicalComposer initialConfig={config}>
      <div className="border rounded-lg bg-white">
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[120px] p-3 outline-none" />
          }
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              const text = $getRoot().getTextContent();
              onChange?.(text);
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
