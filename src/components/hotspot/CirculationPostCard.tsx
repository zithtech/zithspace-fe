'use client';

import React from 'react';
import { ImageIcon, Paperclip, Pin } from 'lucide-react';
import { PALETTE, TINT, fmtDateTime } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import { CirculationPost } from '@/services/hotspotCirculationService';
import { CategoryChip, postedAgo } from './circulationMeta';

// A row in the Circulation feed — deliberately MINIMISED.
//
// The card's job is to let someone scan a list and decide what to open: who
// posted, what it is about, how big it is. The full update (rich text, image
// gallery, documents, actions) lives in the detail drawer, because an expanded
// policy notice inline pushes every other update off the screen.
//
// The whole card is the click target, so there is no "read more" to aim at.
export default function CirculationPostCard({
  post,
  onOpen,
}: {
  post: CirculationPost;
  onOpen: () => void;
}) {
  const images = post.attachments.filter((a) => a.kind === 'image');
  const documents = post.attachments.filter((a) => a.kind === 'document');
  const preview = post.bodyText.replace(/\s+/g, ' ').trim();
  const thumb = images[0];

  return (
    <article
      className={`hsc-card ${post.isPinned ? 'is-pinned' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="hsc-card-main">
        <div className="hsc-card-top">
          {post.isPinned && (
            <span className="hsc-pinned-chip">
              <Pin size={11} />
              Pinned
            </span>
          )}
          <CategoryChip category={post.category} label={post.categoryLabel} />
          <span className="hsc-card-time" title={fmtDateTime(post.createdAt)}>
            {postedAgo(post.createdAt)}
          </span>
        </div>

        <h3 className="hsc-card-title">{post.title}</h3>

        {preview && <p className="hsc-card-preview">{preview}</p>}

        <div className="hsc-card-foot">
          {post.authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hsc-card-avatar" src={post.authorAvatarUrl} alt="" />
          ) : (
            <span
              className="hsc-card-avatar hsc-card-initials"
              style={{ background: avatarColorFor(post.authorName || post.authorUserId) }}
            >
              {initialsFor(post.authorName || 'Employee')}
            </span>
          )}
          <span className="hsc-card-author">{post.authorName || 'Employee'}</span>
          {post.authorDesignation && (
            <span className="hsc-card-role">{post.authorDesignation}</span>
          )}

          {(images.length > 0 || documents.length > 0) && (
            <span className="hsc-card-attach">
              {images.length > 0 && (
                <span className="hsc-card-attach-item">
                  <ImageIcon size={12} />
                  {images.length}
                </span>
              )}
              {documents.length > 0 && (
                <span className="hsc-card-attach-item">
                  <Paperclip size={12} />
                  {documents.length}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* One thumbnail is enough of a hint; the gallery is in the drawer. */}
      {thumb && (
        <div className="hsc-card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb.fileUrl} alt="" />
          {images.length > 1 && <span className="hsc-card-thumb-more">+{images.length - 1}</span>}
        </div>
      )}

      <style jsx>{`
        .hsc-card {
          display: flex;
          align-items: stretch;
          gap: 14px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          padding: 14px 16px;
          cursor: pointer;
          text-align: left;
          transition:
            border-color 0.12s ease,
            box-shadow 0.12s ease,
            transform 0.12s ease;
        }
        .hsc-card:hover {
          border-color: ${PALETTE.blue}55;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }
        .hsc-card:focus-visible {
          outline: 2px solid ${PALETTE.blue};
          outline-offset: 2px;
        }
        .hsc-card.is-pinned {
          border-color: ${PALETTE.blue}55;
          background: linear-gradient(180deg, ${TINT.blue} 0%, var(--bg-pure-white) 60px);
        }

        .hsc-card-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .hsc-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hsc-pinned-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 100px;
          color: ${PALETTE.blue};
          background: ${TINT.blue};
          border: 1px solid ${PALETTE.blue}22;
        }
        .hsc-card-time {
          font-size: 11px;
          color: var(--text-slate-400);
          font-weight: 500;
          margin-left: auto;
        }

        .hsc-card-title {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }

        /* Two lines, then ellipsis — a fixed clamp keeps every row the same
           height, which is what makes a list scannable. */
        .hsc-card-preview {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-slate-500);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hsc-card-foot {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .hsc-card-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }
        .hsc-card-initials {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
        }
        .hsc-card-author {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-700);
        }
        .hsc-card-role {
          font-size: 11px;
          color: var(--text-slate-400);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
        .hsc-card-attach {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .hsc-card-attach-item {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-400);
        }

        .hsc-card-thumb {
          position: relative;
          width: 92px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-slate-50);
        }
        .hsc-card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hsc-card-thumb-more {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.5);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }
        @media (max-width: 560px) {
          .hsc-card-thumb {
            display: none;
          }
        }
      `}</style>
    </article>
  );
}
