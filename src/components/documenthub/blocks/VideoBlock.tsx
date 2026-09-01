"use client";

import { createVideoBlockConfig, videoParse } from "@blocknote/core";
import { createReactBlockSpec, ResizableFileBlockWrapper } from "@blocknote/react";

/**
 * Detect whether a URL requires iframe embedding (YouTube, Vimeo, etc.) and
 * convert watch/share URLs to their embeddable form.
 *
 * Returns the embed URL string, or null if the URL is a direct video file
 * that can be used with a native <video> element.
 */
export const toVideoEmbedUrl = (url: string): string | null => {
  const u = url.trim();

  // YouTube variants
  if (u.includes("youtube.com/watch?v=")) {
    const id = u.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (u.includes("youtu.be/")) {
    const id = u.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (u.includes("youtube.com/embed/")) {
    return u; // already embeddable
  }
  if (u.includes("youtube.com/shorts/")) {
    const id = u.split("youtube.com/shorts/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  // Vimeo
  if (u.includes("vimeo.com/")) {
    const match = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }

  // Not a known embeddable URL — treat as a direct video file
  return null;
};

// VideoIconSVG — matches BlockNote's built-in video icon
const VideoIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    width="24"
    height="24"
  >
    <path d="M2 3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918C2.44405 21 2 20.5551 2 20.0066V3.9934ZM8 5V19H16V5H8ZM4 5V7H6V5H4ZM18 5V7H20V5H18ZM4 9V11H6V9H4ZM18 9V11H20V9H18ZM4 13V15H6V13H4ZM18 13V15H20V13H18ZM4 17V19H6V17H4ZM18 17V19H20V17H18Z" />
  </svg>
);

/**
 * Custom VideoBlock that overrides BlockNote's default video block.
 *
 * Key difference from the default:
 *   • When the `url` is a YouTube / Vimeo link the block renders an <iframe>
 *     so the video actually plays (a native <video> element cannot load those
 *     streaming URLs — it just shows "Loading…" indefinitely).
 *   • For direct video file URLs (uploads) it falls back to a standard
 *     <video controls> element exactly as before.
 *   • The empty state (no URL yet) is handled by BlockNote's
 *     ResizableFileBlockWrapper which is accessed via require() to avoid
 *     TypeScript generic-type conflicts while keeping full runtime behaviour.
 */
export const VideoBlock = createReactBlockSpec(
  // Reuse the exact same propSchema as BlockNote's built-in video block so
  // serialisation, paste-parsing, and the FilePanel (Embed / Upload tabs)
  // keep working without any changes.
  createVideoBlockConfig({}),
  {
    render: (props: any) => {
      const { url } = props.block.props;
      const embedUrl = url ? toVideoEmbedUrl(url) : null;

      // ResizableFileBlockWrapper handles:
      //   • Empty state → "Add video" button that opens the FilePanel
      //   • Non-empty state → resize handles + children (our preview)
      return (
        <ResizableFileBlockWrapper
          {...(props as any)}
          buttonIcon={<VideoIconSVG />}
        >
          {embedUrl ? (
            /* ── Embeddable URL (YouTube / Vimeo / etc.) ── */
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%", // 16:9 aspect ratio
                height: 0,
                overflow: "hidden",
                borderRadius: "8px",
                width: props.block.props.previewWidth ? "100%" : "512px",
                maxWidth: "100%",
              }}
              contentEditable={false}
            >
              <iframe
                src={embedUrl}
                title="Embedded video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>
          ) : (
            /* ── Direct video file (uploaded MP4 / WebM / etc.) ── */
            <video
              src={url}
              className="bn-visual-media"
              controls
              contentEditable={false}
              draggable={false}
            />
          )}
        </ResizableFileBlockWrapper>
      );
    },
    // Keep BlockNote's built-in parse so the block is correctly deserialised
    // from HTML paste and document content.
    parse: videoParse({}) as any,
  }
);
