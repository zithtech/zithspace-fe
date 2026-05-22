'use client';

import React from 'react';
import { Tooltip } from 'antd';
import { ZoomIn, ZoomOut, Maximize2, GitBranch, Share2, Clock } from 'lucide-react';

interface CanvasChromeProps {
  zoom: number;
  onZoomChange: (next: number) => void;
  blockCount: number;
  savedAt: Date | null;
  onShare?: () => void;
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

const formatSavedAt = (d: Date | null): string => {
  if (!d) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const CanvasChrome: React.FC<CanvasChromeProps> = ({
  zoom,
  onZoomChange,
  blockCount,
  savedAt,
  onShare,
}) => {
  const idx = ZOOM_STEPS.indexOf(zoom);
  const canZoomOut = idx > 0;
  const canZoomIn = idx >= 0 && idx < ZOOM_STEPS.length - 1;

  const setStep = (delta: number) => {
    const safeIdx = idx === -1 ? ZOOM_STEPS.indexOf(1) : idx;
    const next = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, safeIdx + delta))];
    onZoomChange(next);
  };

  return (
    <div className="pb-chrome">
      <div className="pb-chrome__left">
        <div className="pb-chrome__chip">
          <GitBranch size={11} />
          <span>v1.0 · Draft</span>
        </div>
        <span className="pb-chrome__sep" />
        <div className="pb-chrome__meta">
          <Clock size={11} />
          <span className="pb-chrome__mono">Saved · {formatSavedAt(savedAt)}</span>
        </div>
      </div>

      <div className="pb-chrome__center">
        <div className="pb-chrome__zoom">
          <Tooltip title="Zoom out">
            <button
              type="button"
              className="pb-chrome__icon-btn"
              onClick={() => setStep(-1)}
              disabled={!canZoomOut}
            >
              <ZoomOut size={13} />
            </button>
          </Tooltip>
          <button
            type="button"
            className="pb-chrome__zoom-val"
            onClick={() => onZoomChange(1)}
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Tooltip title="Zoom in">
            <button
              type="button"
              className="pb-chrome__icon-btn"
              onClick={() => setStep(1)}
              disabled={!canZoomIn}
            >
              <ZoomIn size={13} />
            </button>
          </Tooltip>
          <Tooltip title="Fit to screen">
            <button
              type="button"
              className="pb-chrome__icon-btn"
              onClick={() => onZoomChange(1)}
            >
              <Maximize2 size={12} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="pb-chrome__right">
        <span className="pb-chrome__count">
          {blockCount} {blockCount === 1 ? 'section' : 'sections'}
        </span>
        <button type="button" className="pb-chrome__share" onClick={onShare}>
          <Share2 size={12} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};
