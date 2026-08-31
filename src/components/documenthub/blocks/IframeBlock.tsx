import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useState } from "react";
import { Input, Button } from "antd";

// Helper to convert watch URLs or extract raw iframes
export const parseEmbedUrl = (input: string): string => {
  let url = input.trim();
  
  // If the user pasted a raw HTML iframe snippet, extract the src attribute securely
  if (url.toLowerCase().startsWith("<iframe") && url.includes("src=")) {
    const srcMatch = url.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    }
  }

  // Convert standard youtube watch URLs to embed URLs
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("watch?v=")[1].split("&")[0];
    url = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1].split("?")[0];
    url = `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
};

export const IframeBlock = createReactBlockSpec(
  {
    type: "iframe",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      url: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const [inputUrl, setInputUrl] = useState("");

      const handleSave = () => {
        if (!inputUrl.trim()) return;
        const parsedUrl = parseEmbedUrl(inputUrl);
        props.editor.updateBlock(props.block, {
          type: "iframe",
          props: { url: parsedUrl },
        });
      };

      if (!props.block.props.url) {
        return (
          <div
            style={{
              padding: "16px",
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-slate-200)",
              borderRadius: "8px",
              display: "flex",
              gap: "10px",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              Embed a Web Player
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-slate-500)", marginBottom: "8px" }}>
              Paste a YouTube URL, Vimeo URL, or raw HTML <code>&lt;iframe&gt;</code> snippet below.
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <Button type="primary" onClick={handleSave}>
                Embed
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="iframe-wrapper" style={{ width: "100%", margin: "16px 0" }}>
          <iframe
            src={props.block.props.url}
            width="100%"
            height="400"
            frameBorder="0"
            allowFullScreen
            style={{ borderRadius: "8px", border: "1px solid var(--border-slate-200)" }}
          />
        </div>
      );
    },
  }
);
