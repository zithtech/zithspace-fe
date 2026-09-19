'use client';

/**
 * Settings › Document Types.
 *
 * The tenant's vocabulary of document kinds — Proposal, MSA, NDA, Change
 * Order. This replaced the free-text `category` templates used to carry: open
 * vocabularies drift, and 'NDA', 'nda' and 'Non-Disclosure' were three
 * categories describing one kind of document.
 *
 * NAME IS FREE TO CHANGE, CODE IS NOT. The code is what other systems key on,
 * so it is derived from the name once, on a new type, and then left alone —
 * editing an existing type will not quietly renumber it behind you.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Dropdown, Modal } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import {
  Filter,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SignalHigh,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import NoData from '@/components/common/NoData';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import TicketFilterPill from '@/components/projects/TicketFilterPill';
import { ListFooter, menuLabel } from '@/components/project-agreements/listChrome';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DOCUMENT_TYPE_STATUS_META,
  DocumentType,
  DocumentTypeStatus,
  ProjectAgreementsService,
  codeFromName,
} from '@/services/projectAgreementsService';

const STATUS_KEYS: DocumentTypeStatus[] = ['active', 'inactive'];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses', description: 'Do not filter by status' },
  ...STATUS_KEYS.map((s) => ({ value: s, label: DOCUMENT_TYPE_STATUS_META[s].label })),
];

/** A blank type, ready for the drawer. */
const EMPTY = { name: '', code: '', description: '', status: 'active' as DocumentTypeStatus };

export default function DocumentTypeSettings() {
  const perms = usePermission() as unknown as Record<string, any>;
  const canEdit = Boolean(perms.canManageAgreements);

  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // The editor. `editing` is the row being changed, or null for a new one.
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTypes(
        await ProjectAgreementsService.listDocumentTypes({ search: debouncedSearch || undefined })
      );
    } catch (err: any) {
      toast.error(err?.message || 'Could not load document types');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const counts = useMemo(() => {
    const base: Record<DocumentTypeStatus, number> = { active: 0, inactive: 0 };
    for (const t of types) base[t.status] += 1;
    return base;
  }, [types]);

  const filtered = useMemo(
    () => (status ? types.filter((t) => t.status === status) : types),
    [types, status]
  );

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const activeFilterCount = (status ? 1 : 0) + (search ? 1 : 0);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row: DocumentType) => {
    setEditing(row);
    setForm({
      name: row.name,
      code: row.code,
      description: row.description ?? '',
      status: row.status,
    });
    setErrors({});
    setOpen(true);
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give the type a name';
    if (!form.code.trim()) next.code = 'A code is required';
    else if (!/^[A-Z][A-Z0-9_]*$/.test(form.code.trim())) {
      next.code = 'Capitals, digits and underscores only, e.g. TEST_PROPOSAL';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(Object.values(next)[0]);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
        status: form.status,
      };
      if (editing) {
        await ProjectAgreementsService.updateDocumentType(editing.id, payload);
        toast.success('Document type updated');
      } else {
        await ProjectAgreementsService.createDocumentType(payload);
        toast.success('Document type created');
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not save that document type');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: DocumentType) => {
    const inUse = (row.templateCount ?? 0) + (row.agreementCount ?? 0);
    if (inUse > 0) {
      // The server refuses this too; saying so here saves a round trip and
      // names the alternative rather than just the obstacle.
      toast.error('Still in use — set it to Inactive instead.');
      return;
    }
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await ProjectAgreementsService.deleteDocumentType(row.id);
      setTypes((prev) => prev.filter((t) => t.id !== row.id));
      toast.success('Document type deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete that document type');
    }
  };

  const columns = [
    {
      title: 'Document type',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, row: DocumentType) => (
        <div className="pp-name-cell">
          <span className="pp-name-icon">
            <Layers size={13} />
          </span>
          <span className="pp-name-text">
            <span className="pp-name-title">{row.name}</span>
            <span className="pp-name-sub">
              {row.description || 'No description'}
            </span>
          </span>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 190,
      render: (v: string) => <span className="pa-code">{v}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: DocumentTypeStatus) => {
        const meta = DOCUMENT_TYPE_STATUS_META[s];
        return (
          <span className="pp-vis-pill" style={{ background: meta.bg, color: meta.color }}>
            <span className="pp-vis-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      },
    },
    {
      title: 'In use',
      key: 'inUse',
      width: 190,
      render: (_: unknown, row: DocumentType) => {
        const parts = [
          row.templateCount ? `${row.templateCount} template${row.templateCount === 1 ? '' : 's'}` : null,
          row.agreementCount ? `${row.agreementCount} agreement${row.agreementCount === 1 ? '' : 's'}` : null,
        ].filter(Boolean);
        return parts.length ? (
          <span className="pp-cell">{parts.join(' · ')}</span>
        ) : (
          <span className="pp-cell pp-cell-muted">Unused</span>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right' as const,
      render: (_: unknown, row: DocumentType) =>
        canEdit ? (
          <Dropdown
            overlayClassName="tl-action-pop"
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'edit',
                  label: menuLabel(<Pencil size={14} />, 'Edit', 'Rename or describe it', '#3b82f6'),
                  onClick: ({ domEvent }: any) => {
                    domEvent.stopPropagation();
                    openEdit(row);
                  },
                },
                { type: 'divider' as const, key: 'd1' },
                {
                  key: 'delete',
                  danger: true,
                  label: menuLabel(
                    <Trash2 size={14} />,
                    'Delete',
                    'Only while nothing uses it',
                    '#ef4444'
                  ),
                  onClick: ({ domEvent }: any) => {
                    domEvent.stopPropagation();
                    remove(row);
                  },
                },
              ],
            }}
          >
            <button
              type="button"
              className="pa-btn"
              style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Actions"
            >
              <EllipsisOutlined />
            </button>
          </Dropdown>
        ) : null,
    },
  ];

  return (
    <>
      <div className="tl-section-head">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{ background: '#3b82f6', boxShadow: '0 0 0 3px #3b82f633' }}
            />
            <span className="tl-sprint-title">
              {status ? DOCUMENT_TYPE_STATUS_META[status as DocumentTypeStatus].label : 'All document types'}
            </span>
            <span className="tl-sprint-tags">
              {STATUS_KEYS.map((key) => {
                const meta = DOCUMENT_TYPE_STATUS_META[key];
                return (
                  <span
                    key={key}
                    className="tl-sprint-tag"
                    style={{
                      color: meta.color,
                      background: `${meta.color}1a`,
                      borderColor: `${meta.color}40`,
                    }}
                  >
                    <b>{counts[key]}</b> {meta.label}
                  </span>
                );
              })}
            </span>
          </div>
          {canEdit && (
            <div className="tl-sprint-actions">
              <button type="button" className="pa-btn pa-btn-primary" onClick={openNew}>
                <Plus size={14} /> New type
              </button>
            </div>
          )}
        </div>
        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <b>{counts.active}</b> offered in the pickers
          </span>
          <span className="tl-sprint-meta">Inactive types stay on documents that cite them</span>
        </div>
      </div>

      <div className="tl-filter-row">
        <div className="tl-filter-row-label">
          <Filter size={11} />
          <span>Filters</span>
          <span className="tl-filter-row-count">{activeFilterCount}</span>
        </div>
        <div className="tl-filter-row-pills">
          <div className="tl-filter-search">
            <Search size={13} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code"
              aria-label="Search document types"
            />
          </div>
          <TicketFilterPill
            icon={<SignalHigh size={11} />}
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v: any) => setStatus(v ?? '')}
            multiple={false}
            itemNoun="statuses"
          />
        </div>
        {activeFilterCount > 0 && (
          <div className="tl-filter-row-actions">
            <button
              type="button"
              className="tl-filter-row-reset"
              onClick={() => {
                setStatus('');
                setSearch('');
              }}
            >
              <RotateCcw size={10} />
              Reset
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZukvoLoader size="md" />
        </div>
      ) : (
        <>
          <div className="pp-table-wrap">
            <Table
              className="pp-table"
              rowKey="id"
              size="small"
              columns={columns as any}
              dataSource={pageItems}
              pagination={false}
              scroll={{ x: 'max-content' }}
              rowClassName="pp-row"
              onRow={(record) => ({
                onClick: () => canEdit && openEdit(record),
              })}
              locale={{
                emptyText: (
                  <NoData
                    title={activeFilterCount > 0 ? 'Nothing matches' : 'No document types yet'}
                    description={
                      activeFilterCount > 0
                        ? 'Clear a filter to widen the search.'
                        : 'Add one — every template and agreement needs a kind.'
                    }
                    accent="#3b82f6"
                  />
                ),
              }}
            />
          </div>

          <ListFooter
            current={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            noun="document types"
          />
        </>
      )}

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={editing ? 'Edit document type' : 'New document type'}
        centered
        destroyOnHidden
        okText={saving ? 'Saving…' : editing ? 'Save changes' : 'Create type'}
        onOk={save}
        confirmLoading={saving}
        width={520}
      >
        <div style={{ display: 'grid', gap: 12, paddingTop: 4 }}>
          <div className="pa-field">
            <span className="pa-label">Name</span>
            <input
              className="pa-input"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  // Derived only for a NEW type. Editing one leaves the code
                  // alone: it is the handle other systems already hold.
                  code: editing ? f.code : codeFromName(name),
                }));
              }}
              placeholder="Test Proposal"
              autoFocus
            />
            {errors.name && <span className="pa-error">{errors.name}</span>}
          </div>

          <div className="pa-field">
            <span className="pa-label">Code</span>
            <input
              className="pa-input pa-code-input"
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 60) }))
              }
              placeholder="TEST_PROPOSAL"
            />
            <span className="pa-hint">
              {editing ? 'Changing this renames what other systems key on.' : 'Derived from the name; edit if you need.'}
            </span>
            {errors.code && <span className="pa-error">{errors.code}</span>}
          </div>

          <div className="pa-field">
            <span className="pa-label">Description</span>
            <textarea
              className="pa-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="When to use this type."
            />
          </div>

          <div className="pa-field">
            <span className="pa-label">Status</span>
            <div className="pa-seg">
              {STATUS_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`pa-seg-btn ${form.status === key ? 'is-on' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, status: key }))}
                >
                  {DOCUMENT_TYPE_STATUS_META[key].label}
                </button>
              ))}
            </div>
            <span className="pa-hint">Inactive leaves the pickers but keeps existing documents.</span>
          </div>
        </div>
      </Modal>
    </>
  );
}
