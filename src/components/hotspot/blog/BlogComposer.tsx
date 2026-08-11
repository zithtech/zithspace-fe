'use client';

import React, { useEffect, useRef, useState } from 'react';
import { App, Button, Modal, Tooltip } from 'antd';
import { AtSign, ImagePlus, Trash2, X } from 'lucide-react';
import { PALETTE, TINT } from '@/components/openings/ui';
import { avatarColorFor, initialsFor } from '@/components/common/SearchableDropdown';
import HotspotBlogService, { BlogPost, BlogUser } from '@/services/hotspotBlogService';
import BlogRichEditor from './BlogRichEditor';

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

interface PendingImage {
  file: File;
  /** Object URL for the local preview — revoked on unmount. */
  preview: string;
}

// The post composer, as a modal over the feed.
//
// Images upload AFTER the post exists, because the backend keys them on a post
// id. That is why `hasImages` goes out with the create call: without it the
// server would reject a text-free post as empty, a moment before its images
// arrive. If the upload then fails, the post survives and the message says so
// rather than implying the whole thing was lost.
export default function BlogComposer({
  open,
  post,
  me,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Present when editing; null when writing a new post. */
  post: BlogPost | null;
  me: { name: string; avatarUrl: string | null } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { message } = App.useApp();

  const [body, setBody] = useState('');
  // The editor's plain-text projection, mirrored here so "is this post empty?"
  // never has to guess by counting angle brackets.
  const [bodyText, setBodyText] = useState('');
  const [mentioned, setMentioned] = useState<BlogUser[]>([]);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [existing, setExisting] = useState<BlogPost['images']>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!post;

  useEffect(() => {
    if (!open) return;
    setBody(post?.body ?? '');
    setBodyText(post?.bodyText ?? '');
    setMentioned(post?.mentions ?? []);
    setExisting(post?.images ?? []);
    setPending([]);
  }, [open, post]);

  // Object URLs leak if they outlive the component — but this cleanup must run
  // ONLY on unmount. With `pending` in the dependency array it re-ran on every
  // add and revoked the URLs of the images already staged, blanking their
  // thumbnails. The ref holds the current list without re-triggering the effect.
  const pendingRef = useRef<PendingImage[]>([]);
  pendingRef.current = pending;
  useEffect(
    () => () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    []
  );

  const pickImages = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      const room = MAX_IMAGES - (existing.length + pending.length);
      if (room <= 0) {
        message.warning(`A post can hold at most ${MAX_IMAGES} images`);
        return;
      }

      const accepted: PendingImage[] = [];
      for (const file of files.slice(0, room)) {
        if (file.size > MAX_IMAGE_BYTES) {
          message.error(`${file.name} is larger than 15 MB`);
          continue;
        }
        accepted.push({ file, preview: URL.createObjectURL(file) });
      }
      if (files.length > room) {
        message.warning(`Only ${room} more image${room === 1 ? '' : 's'} fit on this post`);
      }
      setPending((list) => [...list, ...accepted]);
    };
    input.click();
  };

  const dropPending = (index: number) => {
    setPending((list) => {
      URL.revokeObjectURL(list[index].preview);
      return list.filter((_, i) => i !== index);
    });
  };

  const dropExisting = async (imageId: string) => {
    if (!post) return;
    try {
      const updated = await HotspotBlogService.removeImage(post.id, imageId);
      setExisting(updated.images);
      onSaved();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not remove the image');
    }
  };

  const totalImages = existing.length + pending.length;
  const canPost = bodyText.trim().length > 0 || totalImages > 0;

  const submit = async () => {
    if (!canPost) {
      message.error('Write something or add an image');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        // Send the HTML as-is; the server sanitises it and derives its own
        // plain-text projection.
        body: bodyText.trim() ? body : '',
        mentionUserIds: mentioned.map((u) => u.id),
        hasImages: totalImages > 0,
      };

      const saved = isEdit
        ? await HotspotBlogService.update(post!.id, payload)
        : await HotspotBlogService.create(payload);

      if (pending.length > 0) {
        try {
          await HotspotBlogService.uploadImages(
            saved.id,
            pending.map((p) => p.file)
          );
        } catch (err: any) {
          message.error(
            err?.response?.data?.error || 'Post saved, but the images could not be uploaded'
          );
          onSaved();
          onClose();
          return;
        }
      }

      message.success(isEdit ? 'Post updated' : 'Posted');
      onSaved();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not save the post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      width={620}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
      className="hsb-composer-modal"
    >
      <div className="hsb-composer">
        <header className="hsb-comp-head">
          <span className="hsb-comp-title">{isEdit ? 'Edit post' : 'Create a post'}</span>
          <Button type="text" icon={<X size={18} />} onClick={onClose} aria-label="Close" />
        </header>

        <div className="hsb-comp-author">
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hsb-comp-avatar" src={me.avatarUrl} alt="" />
          ) : (
            <span
              className="hsb-comp-avatar hsb-comp-initials"
              style={{ background: avatarColorFor(me?.name || 'You') }}
            >
              {initialsFor(me?.name || 'You')}
            </span>
          )}
          <div className="hsb-comp-author-text">
            <div className="hsb-comp-name">{me?.name || 'You'}</div>
            <div className="hsb-comp-scope">Visible to everyone in your company</div>
          </div>
        </div>

        <div className="hsb-comp-body">
          <BlogRichEditor
            value={body}
            onChange={(html, text) => {
              setBody(html);
              setBodyText(text);
            }}
            mentionedUsers={mentioned}
            onMentionedUsersChange={setMentioned}
            disabled={saving}
            autoFocus
          />
        </div>

        {(existing.length > 0 || pending.length > 0) && (
          <div className="hsb-comp-images">
            {existing.map((img) => (
              <div className="hsb-comp-thumb" key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.fileUrl} alt={img.fileName} />
                <button
                  type="button"
                  className="hsb-comp-drop"
                  onClick={() => dropExisting(img.id)}
                  aria-label="Remove image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {pending.map((p, i) => (
              <div className="hsb-comp-thumb" key={p.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={p.file.name} />
                <button
                  type="button"
                  className="hsb-comp-drop"
                  onClick={() => dropPending(i)}
                  aria-label="Remove image"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <footer className="hsb-comp-foot">
          <div className="hsb-comp-tools">
            <Tooltip title="Add images">
              <Button
                type="text"
                icon={<ImagePlus size={18} />}
                onClick={pickImages}
                disabled={saving || totalImages >= MAX_IMAGES}
              />
            </Tooltip>
            {mentioned.length > 0 && (
              <span className="hsb-comp-tagged">
                <AtSign size={12} />
                {mentioned.length} tagged
              </span>
            )}
          </div>
          <Button type="primary" onClick={submit} loading={saving} disabled={!canPost}>
            {isEdit ? 'Save' : 'Post'}
          </Button>
        </footer>
      </div>

      <style jsx>{`
        .hsb-composer { display: flex; flex-direction: column; }
        .hsb-comp-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
        }
        .hsb-comp-title {
          font-size: 15px; font-weight: 700; color: var(--text-slate-900);
          letter-spacing: -0.015em;
        }
        .hsb-comp-author { display: flex; align-items: center; gap: 10px; padding: 14px 16px 8px; }
        .hsb-comp-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
        }
        .hsb-comp-initials {
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 13px; font-weight: 700;
        }
        .hsb-comp-author-text { min-width: 0; }
        .hsb-comp-name { font-size: 14px; font-weight: 700; color: var(--text-slate-900); }
        .hsb-comp-scope { font-size: 11.5px; color: var(--text-slate-400); font-weight: 500; }

        .hsb-comp-body { padding: 4px 16px 12px; min-height: 120px; }

        .hsb-comp-images {
          display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px;
        }
        .hsb-comp-thumb {
          position: relative; width: 92px; height: 92px; border-radius: 10px;
          overflow: hidden; border: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
        }
        .hsb-comp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hsb-comp-drop {
          position: absolute; top: 4px; right: 4px; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          border: none; border-radius: 50%; cursor: pointer;
          background: rgba(15, 23, 42, 0.65); color: #fff;
        }
        .hsb-comp-drop:hover { background: rgba(15, 23, 42, 0.85); }

        .hsb-comp-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 16px; border-top: 1px solid var(--border-slate-100);
        }
        .hsb-comp-tools { display: flex; align-items: center; gap: 8px; }
        .hsb-comp-tagged {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11.5px; font-weight: 600; color: ${PALETTE.blue};
          background: ${TINT.blue}; padding: 2px 8px; border-radius: 100px;
        }
      `}</style>
    </Modal>
  );
}
