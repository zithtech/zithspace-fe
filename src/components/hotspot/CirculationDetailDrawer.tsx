'use client';

import React, { useState } from 'react';
import { App, Button, Drawer, Image, Tooltip } from 'antd';
import { Download, FileText, Paperclip, Pencil, Pin, PinOff, Trash2, X } from 'lucide-react';
import TiptapViewer from '@/components/common/TiptapViewer';
import { PALETTE, TINT, fmtDateTime } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotCirculationService, {
  CirculationAttachment,
  CirculationPost,
} from '@/services/hotspotCirculationService';
import { CategoryChip, fileSizeLabel, postedAgo } from './circulationMeta';

// The full update, opened from a feed row.
//
// Everything the minimised card leaves out lives here: the rich-text body, the
// image gallery with a lightbox, the document list, and the author's actions.
// A drawer rather than a page because reading an update should not cost the
// reader their place in the feed.
export default function CirculationDetailDrawer({
  open,
  post,
  canModerate,
  onClose,
  onEdit,
  onChanged,
}: {
  open: boolean;
  post: CirculationPost | null;
  canModerate: boolean;
  onClose: () => void;
  onEdit: (post: CirculationPost) => void;
  onChanged: () => void;
}) {
  const { message, modal } = App.useApp();
  const [busy, setBusy] = useState(false);

  if (!post) return null;

  const images = post.attachments.filter((a) => a.kind === 'image');
  const documents = post.attachments.filter((a) => a.kind === 'document');

  const togglePin = async () => {
    setBusy(true);
    try {
      await HotspotCirculationService.setPinned(post.id, !post.isPinned);
      message.success(post.isPinned ? 'Post unpinned' : 'Post pinned to the top');
      onChanged();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not update the pin');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    modal.confirm({
      title: 'Delete this update?',
      content: 'It will be removed from the circulation feed for everyone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await HotspotCirculationService.remove(post.id);
          message.success('Update deleted');
          onChanged();
          onClose();
        } catch (err: any) {
          message.error(err?.response?.data?.error || 'Could not delete the update');
        }
      },
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
      closeIcon={null}
      styles={{ header: { display: 'none' }, body: { padding: 0 } }}
    >
      <div className="hscd">
        {/* A tinted banner carrying the category and the pin state, so the kind
            of update registers before any of the words do. */}
        <header className="hscd-hero">
          <div className="hscd-hero-top">
            <CategoryChip category={post.category} label={post.categoryLabel} />
            {post.isPinned && (
              <span className="hscd-pinned">
                <Pin size={11} />
                Pinned
              </span>
            )}
            <Button
              type="text"
              icon={<X size={18} />}
              onClick={onClose}
              aria-label="Close"
              className="hscd-close"
            />
          </div>

          <h2 className="hscd-title">{post.title}</h2>

          <div className="hscd-author">
            {post.authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="hscd-avatar" src={post.authorAvatarUrl} alt="" />
            ) : (
              <span
                className="hscd-avatar hscd-initials"
                style={{ background: avatarColorFor(post.authorName || post.authorUserId) }}
              >
                {initialsFor(post.authorName || 'Employee')}
              </span>
            )}
            <div className="hscd-author-text">
              <div className="hscd-author-name">{post.authorName || 'Employee'}</div>
              <div className="hscd-author-meta">
                {post.authorDesignation ? `${post.authorDesignation} · ` : ''}
                <span title={fmtDateTime(post.createdAt)}>{postedAgo(post.createdAt)}</span>
                {post.updatedAt !== post.createdAt && (
                  <span className="hscd-edited"> · edited</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="hscd-scroll">
          {post.body && (
            <section className="hscd-body">
              <TiptapViewer content={post.body} />
            </section>
          )}

          {images.length > 0 && (
            <section className="hscd-section">
              <div className="hscd-label">
                <Paperclip size={12} />
                {images.length} image{images.length === 1 ? '' : 's'}
              </div>
              <Image.PreviewGroup>
                <div className="hscd-gallery">
                  {images.map((img) => (
                    <div className="hscd-cell" key={img.id}>
                      <Image
                        src={img.fileUrl}
                        alt={img.fileName}
                        rootClassName="hscd-imgroot"
                        className="hscd-img"
                      />
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </section>
          )}

          {documents.length > 0 && (
            <section className="hscd-section">
              <div className="hscd-label">
                <Paperclip size={12} />
                {documents.length} document{documents.length === 1 ? '' : 's'}
              </div>
              <div className="hscd-docs">
                {documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </div>
            </section>
          )}
        </div>

        {(post.canEdit || canModerate) && (
          <footer className="hscd-foot">
            {canModerate && (
              <Tooltip title={post.isPinned ? 'Unpin from the top' : 'Pin to the top for everyone'}>
                <Button
                  icon={post.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                  onClick={togglePin}
                  loading={busy}
                >
                  {post.isPinned ? 'Unpin' : 'Pin'}
                </Button>
              </Tooltip>
            )}
            {post.canEdit && (
              <>
                <Button icon={<Pencil size={14} />} onClick={() => onEdit(post)}>
                  Edit
                </Button>
                <Button danger icon={<Trash2 size={14} />} onClick={confirmDelete}>
                  Delete
                </Button>
              </>
            )}
          </footer>
        )}

        <style jsx>{`
          .hscd {
            display: flex;
            flex-direction: column;
            min-height: 100%;
          }

          .hscd-hero {
            padding: 18px 24px 20px;
            background: linear-gradient(180deg, ${TINT.green} 0%, var(--bg-pure-white) 100%);
            border-bottom: 1px solid var(--border-slate-100);
          }
          .hscd-hero-top {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }
          .hscd-pinned {
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
          .hscd-hero-top :global(.hscd-close) {
            margin-left: auto;
          }

          .hscd-title {
            margin: 0 0 14px;
            font-size: 22px;
            font-weight: 800;
            line-height: 1.3;
            color: var(--text-slate-900);
            letter-spacing: -0.02em;
          }

          .hscd-author {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .hscd-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            flex-shrink: 0;
            object-fit: cover;
          }
          .hscd-initials {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
          }
          .hscd-author-text {
            min-width: 0;
          }
          .hscd-author-name {
            font-size: 13.5px;
            font-weight: 700;
            color: var(--text-slate-900);
            line-height: 1.3;
          }
          .hscd-author-meta {
            font-size: 11.5px;
            color: var(--text-slate-500);
            font-weight: 500;
          }
          .hscd-edited {
            color: var(--text-slate-400);
          }

          .hscd-scroll {
            flex: 1;
            padding: 20px 24px 24px;
          }
          .hscd-body {
            font-size: 14px;
            line-height: 1.7;
            color: var(--text-slate-800);
          }

          .hscd-section {
            margin-top: 22px;
          }
          .hscd-label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--text-slate-400);
            margin-bottom: 8px;
          }

          .hscd-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 8px;
          }
          /* Definite aspect box + absolutely-filled image: no percentage height
             resolves against an auto-height grid row. See BlogImageGrid. */
          .hscd-cell {
            position: relative;
            aspect-ratio: 4 / 3;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50);
          }
          .hscd-cell :global(.hscd-imgroot) {
            position: absolute;
            inset: 0;
            display: block;
          }
          .hscd-cell :global(.hscd-img) {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: zoom-in;
            display: block;
          }

          .hscd-docs {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .hscd-foot {
            position: sticky;
            bottom: 0;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 24px;
            border-top: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
          }
        `}</style>
      </div>
    </Drawer>
  );
}

function DocumentRow({ doc }: { doc: CirculationAttachment }) {
  const size = fileSizeLabel(doc.fileSize);
  return (
    <a className="hscd-doc" href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
      <span className="hscd-doc-icon">
        <FileText size={14} />
      </span>
      <span className="hscd-doc-text">
        <span className="hscd-doc-name">{doc.fileName}</span>
        {size && <span className="hscd-doc-size">{size}</span>}
      </span>
      <Download size={14} className="hscd-doc-dl" />

      <style jsx>{`
        /* Kept compact on purpose: a document row is a link, not a card, and
           the body above it is what the reader came for. */
        .hscd-doc {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 6px 10px;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          text-decoration: none;
          background: var(--bg-pure-white);
          transition:
            background 0.12s ease,
            border-color 0.12s ease;
        }
        .hscd-doc:hover {
          background: var(--bg-slate-50);
          border-color: ${PALETTE.blue}44;
        }
        .hscd-doc-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          color: ${PALETTE.ash};
          background: ${TINT.ash};
        }
        .hscd-doc-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .hscd-doc-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-800);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hscd-doc-size {
          font-size: 10.5px;
          line-height: 1.35;
          color: var(--text-slate-400);
          font-weight: 500;
        }
        .hscd-doc :global(.hscd-doc-dl) {
          color: var(--text-slate-400);
          flex-shrink: 0;
        }
      `}</style>
    </a>
  );
}
