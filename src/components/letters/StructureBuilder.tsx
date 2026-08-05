'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import LetterTiptapEditor from './LetterTiptapEditor';
import { LettersService } from '@/services/lettersService';
import { toast } from 'react-hot-toast';

export default function StructureBuilder() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const [structureName, setStructureName] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      LettersService.getStructureById(editId)
        .then(data => {
          setStructureName(data.name);
          setHtmlContent(data.htmlContent || '');
        })
        .catch(err => toast.error(err.message || 'Failed to load format'));
    }
  }, [editId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStructureName(e.target.value);
    if (nameError) setNameError(null); // clear error as user types
  };

  const handleSave = async () => {
    const trimmedName = structureName.trim();

    // Validate: name required
    if (!trimmedName) {
      setNameError('Format name is required.');
      return;
    }

    // Validate: content required
    if (!htmlContent.trim()) {
      toast.error('Please add some content to the format before saving.');
      return;
    }

    try {
      setSaving(true);

      // Validate: duplicate name check
      const existing = await LettersService.getStructures();
      const duplicate = existing.find(
        (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase() && s.id !== editId
      );
      if (duplicate) {
        setNameError(`A format named "${duplicate.name}" already exists. Please choose a different name.`);
        setSaving(false);
        return;
      }

      if (editId) {
        await LettersService.updateStructure(editId, trimmedName, htmlContent);
        toast.success('Format updated successfully!');
      } else {
        await LettersService.createStructure(trimmedName, htmlContent);
        toast.success('Format created successfully!');
      }
      router.push('/letters-docs/structures');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save format');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 64px)' }}
    >
      {/* ── Header ── */}
      <div
        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 28px', borderBottom: '1px solid',
          position: 'sticky', top: 0, zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.back()}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {editId ? 'Edit Format' : 'Format Builder'}
            </div>

            {/* Name input + inline validation error */}
            <div style={{ marginTop: '2px' }}>
              <input
                type="text"
                value={structureName}
                onChange={handleNameChange}
                placeholder="Enter Format Name..."
                className="text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                style={{
                  fontSize: '18px', fontWeight: 800,
                  border: 'none', background: 'transparent', outline: 'none',
                  width: '340px', padding: 0,
                }}
              />
              {nameError && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '3px', fontWeight: 500 }}>
                  ⚠ {nameError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0 18px', height: '36px', fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            }}
          >
            <Save size={14} />
            {saving ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={14} />
                Saving...
              </div>
            ) : editId ? (
              'Update Format'
            ) : (
              'Save Format'
            )}
          </button>
        </div>
      </div>

      {/* ── Editor Canvas (wider, dark-themed) ── */}
      <div
        className="bg-slate-100 dark:bg-slate-950"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '24px 32px' }}
      >
        <div
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          style={{
            width: '100%', maxWidth: '1100px', margin: '0 auto',
            borderRadius: '8px', border: '1px solid',
            boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
            minHeight: '600px',
          }}
        >
          <LetterTiptapEditor
            content={htmlContent}
            onChange={(html) => setHtmlContent(html)}
            minHeight={600}
          />
        </div>
      </div>
    </div>
  );
}

