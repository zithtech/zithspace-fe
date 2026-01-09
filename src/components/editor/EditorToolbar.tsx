"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  ElementNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { HeadingNode } from "@lexical/rich-text";
import { Button } from "antd";

// Paragraph factory
function createParagraphNode(): ElementNode {
  return new (class extends ElementNode {})();
}

export function Toolbar() {
  const [editor] = useLexicalComposerContext();

  // Toggle heading
  const toggleHeading = (level: 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => new HeadingNode(`h${level}`));
      }
    });
  };

  // Reset to paragraph
  const toggleParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, createParagraphNode);
      }
    });
  };

  return (
    <div className="flex gap-2 border-b p-2 flex-wrap">
      {/* Text formatting */}
      <Button
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        B
      </Button>
      <Button
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        I
      </Button>
      <Button
        size="small"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        U
      </Button>
      <Button
        size="small"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
      >
        S
      </Button>

      {/* Headings */}
      <Button size="small" onClick={() => toggleHeading(1)}>
        H1
      </Button>
      <Button size="small" onClick={() => toggleHeading(2)}>
        H2
      </Button>
      <Button size="small" onClick={() => toggleHeading(3)}>
        H3
      </Button>
      <Button size="small" onClick={toggleParagraph}>
        P
      </Button>

      {/* Lists */}
      <Button
        size="small"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        • List
      </Button>
      <Button
        size="small"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        1. List
      </Button>

      {/* Alignment placeholder */}
      <Button size="small" onClick={() => console.log("Left")}>
        Left
      </Button>
      <Button size="small" onClick={() => console.log("Center")}>
        Center
      </Button>
      <Button size="small" onClick={() => console.log("Right")}>
        Right
      </Button>
    </div>
  );
}
