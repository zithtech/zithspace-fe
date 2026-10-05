// src/app/mail/components/libraryStyles.ts
//
// The stylesheet shared by every screen in the mail Library — the template
// list, the template editor, the signature editor and the placeholder panel
// they all embed.
//
// It lives in one module because the panel is rendered by two different views:
// keeping the rules next to only one of them is exactly how the signature
// editor once shipped unstyled.

export const LIBRARY_STYLES = `
  .mt-toolbar {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 24px;
    background: var(--bg-pure-white);
    border-bottom: 1px solid var(--border-slate-200);
  }
  .mt-search {
    display: flex; align-items: center; gap: 8px;
    flex: 1; max-width: 420px;
    height: 32px; padding: 0 10px;
    border: 1px solid var(--border-slate-200);
    border-radius: 8px;
    background: var(--bg-slate-50);
    color: var(--text-slate-400);
  }
  .mt-search input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--text-slate-900);
  }
  .mt-search input::placeholder { color: var(--text-slate-400); }
  .mt-count { font-size: 12px; color: var(--text-slate-500); margin-left: auto; }
  .mt-filter-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 24px; padding: 0 8px; border-radius: 12px;
    border: 1px solid var(--mail-primary); background: var(--bg-blue-50);
    color: var(--mail-primary); cursor: pointer;
    font-size: 11.5px; font-weight: 600;
  }
  .mt-filter-chip:hover { background: var(--bg-pure-white); }
  .mt-new-btn { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }

  /* min-height:0 so the list scrolls inside the flex column instead of
     pushing the page. */
  .mt-list { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 24px 32px; }

  .mt-card {
    border: 1px solid var(--border-slate-200);
    border-radius: 10px;
    background: var(--bg-pure-white);
    padding: 14px 16px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .mt-card:hover {
    border-color: var(--mail-primary);
    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.06);
  }
  .mt-card-head { display: flex; align-items: flex-start; gap: 12px; }
  .mt-card-titles { flex: 1; min-width: 0; }
  .mt-card-titles h4 {
    margin: 0; font-size: 13.5px; font-weight: 600;
    color: var(--text-slate-900);
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .mt-card-subject {
    margin: 4px 0 0; font-size: 12.5px; color: var(--text-slate-700);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mt-card-excerpt {
    margin: 8px 0 0; font-size: 12px; line-height: 1.55;
    color: var(--text-slate-500);
  }
  .mt-card-tokens {
    display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
  }

  .mt-chip {
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.02em;
    padding: 1px 7px; border-radius: 5px;
    background: var(--bg-slate-100); color: var(--text-slate-500);
  }
  .mt-chip-default { background: var(--bg-green-50); color: var(--mail-emerald); }

  .mt-token-tag {
    font-size: 10.5px; font-weight: 500;
    padding: 2px 7px; border-radius: 5px;
    background: var(--bg-blue-50); color: var(--mail-primary);
  }
  /* A token nothing will fill is a mistake the writer should see. */
  .mt-token-tag.is-unknown { background: var(--bg-red-50); color: var(--mail-rose); }
  .mt-muted { font-size: 11.5px; color: var(--text-slate-400); }

  .mt-icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    border: 1px solid transparent; background: transparent;
    color: var(--text-slate-500); cursor: pointer; transition: all 0.15s;
  }
  .mt-icon-btn:hover:not(:disabled) {
    background: var(--bg-slate-100); color: var(--mail-primary);
  }
  .mt-icon-btn.is-on { color: var(--mail-emerald); }
  .mt-icon-btn.is-danger:hover { background: var(--bg-red-50); color: var(--mail-rose); }
  .mt-icon-btn:disabled { cursor: default; }

  .mt-skeleton { pointer-events: none; }
  .mt-skel-line {
    height: 10px; border-radius: 4px; margin-bottom: 8px;
    background: var(--bg-slate-100);
  }

  .mt-empty { text-align: center; padding: 8px; }
  .mt-empty-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 56px; height: 56px; border-radius: 14px; margin-bottom: 12px;
    background: var(--bg-slate-100); color: var(--text-slate-400);
  }
  .mt-empty h3 {
    margin: 0 0 6px; font-size: 14px; font-weight: 600; color: var(--text-slate-900);
  }
  .mt-empty p { margin: 0; font-size: 12.5px; color: var(--text-slate-500); }

  .mt-drawer-title {
    font-size: 15px; font-weight: 600; color: var(--text-slate-900);
  }

  .mt-banner {
    border: 1px solid var(--mail-rose); background: var(--bg-red-50);
    color: var(--mail-rose); border-radius: 8px;
    padding: 8px 12px; font-size: 12px; margin-bottom: 14px;
  }

  .mt-mailcard {
    border: 1px solid var(--border-slate-200); border-radius: 10px;
    background: var(--bg-pure-white); overflow: hidden;
  }
  .mt-mailcard-head {
    padding: 14px 16px; border-bottom: 1px solid var(--border-slate-200);
    background: var(--bg-slate-50);
  }
  .mt-mailcard-line {
    margin: 0 0 6px; font-size: 12px; color: var(--text-slate-500);
    display: flex; gap: 8px;
  }
  .mt-mailcard-line span { font-weight: 600; color: var(--text-slate-400); min-width: 26px; }
  .mt-mailcard-subject {
    margin: 0; font-size: 14px; font-weight: 600; color: var(--text-slate-900);
  }
  .mt-mailcard-body {
    padding: 16px; font-size: 13px; line-height: 1.6; color: var(--text-slate-700);
  }
  .mt-mailcard-body img { max-width: 100%; }
  .mt-mailcard-signature {
    padding: 12px 16px 16px;
    border-top: 1px dashed var(--border-slate-200);
    font-size: 12.5px; line-height: 1.6; color: var(--text-slate-500);
  }
  .mt-token {
    background: var(--bg-blue-50); color: var(--mail-primary);
    padding: 1px 4px; border-radius: 4px; font-weight: 600;
  }

  .mt-editor { display: flex; gap: 20px; align-items: flex-start; }
  .mt-editor-main { flex: 1; min-width: 0; }
  .mt-editor-side {
    width: 290px; flex-shrink: 0;
    position: sticky; top: 0;
  }
  .mt-field { display: block; margin-bottom: 14px; }
  .mt-field > span {
    display: block; margin-bottom: 5px;
    font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em;
    text-transform: uppercase; color: var(--text-slate-400);
  }
  .mt-field-body { margin-bottom: 0; }

  .mt-placeholders {
    border: 1px solid var(--border-slate-200); border-radius: 10px;
    background: var(--bg-slate-50); padding: 12px;
  }
  .mt-ph-head { margin-bottom: 10px; }
  .mt-ph-title { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); }
  .mt-ph-sub { font-size: 11px; color: var(--text-slate-500); margin-top: 2px; line-height: 1.45; }
  .mt-ph-search {
    display: flex; align-items: center; gap: 6px;
    height: 30px; padding: 0 8px; margin-bottom: 10px;
    border: 1px solid var(--border-slate-200); border-radius: 7px;
    background: var(--bg-pure-white); color: var(--text-slate-400);
  }
  .mt-ph-empty { font-size: 11.5px; color: var(--text-slate-400); padding: 4px 2px; }

  .mt-ph-group + .mt-ph-group { margin-top: 10px; }
  .mt-ph-group-head {
    display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 6px 4px; border: none; background: transparent;
    cursor: pointer; text-align: left;
  }
  .mt-ph-group-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    background: var(--bg-blue-50); color: var(--mail-primary);
  }
  .mt-ph-group-titles { flex: 1; min-width: 0; }
  .mt-ph-group-label {
    display: block; font-size: 12px; font-weight: 600; color: var(--text-slate-900);
  }
  .mt-ph-group-desc {
    display: block; font-size: 10.5px; color: var(--text-slate-500); line-height: 1.4;
  }
  .mt-ph-group-count {
    font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
    background: var(--bg-slate-100); border-radius: 10px; padding: 1px 6px;
  }
  .mt-ph-chevron { color: var(--text-slate-400); transition: transform 0.15s; }
  .mt-ph-chevron.is-collapsed { transform: rotate(-90deg); }

  .mt-ph-chips { display: flex; flex-direction: column; gap: 5px; padding: 2px 0 2px 30px; }
  .mt-ph-chip {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; padding: 5px 8px; border-radius: 7px;
    border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
    cursor: pointer; transition: all 0.15s;
  }
  .mt-ph-chip:hover { border-color: var(--mail-primary); background: var(--bg-blue-50); }
  .mt-ph-chip-label { font-size: 11.5px; font-weight: 500; color: var(--text-slate-700); }
  .mt-ph-chip code {
    font-size: 10.5px; color: var(--text-slate-400);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  /* Already in the template — dimmer, but still insertable a second time. */
  .mt-ph-chip.is-used { background: var(--bg-slate-100); }
  .mt-ph-chip.is-used .mt-ph-chip-label { color: var(--mail-primary); }
`;
