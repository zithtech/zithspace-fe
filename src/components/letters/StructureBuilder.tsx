'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Save,
  Layers,
} from 'lucide-react';
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

  useEffect(() => {
    if (editId) {
      LettersService.getStructureById(editId)
        .then(data => {
          setStructureName(data.name);
          setHtmlContent(data.htmlContent || '');
        })
        .catch(err => toast.error(err.message || 'Failed to load structure'));
    }
  }, [editId]);

  const handleSave = async () => {
    if (!structureName.trim()) {
      toast.error('Please enter a structure name');
      return;
    }
    if (!htmlContent.trim()) {
      toast.error('Please add some content to the structure');
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await LettersService.updateStructure(editId, structureName.trim(), htmlContent);
        toast.success('Structure updated successfully!');
      } else {
        await LettersService.createStructure(structureName.trim(), htmlContent);
        toast.success('Structure created successfully!');
      }
      router.push('/letters-docs/structures');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save structure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 28px', borderBottom: '1px solid var(--border-slate-200)',
        background: 'var(--bg-pure-white)', position: 'sticky', top: 0, zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-slate-200)',
              background: 'var(--bg-slate-50)', color: 'var(--text-slate-700)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {editId ? 'Edit Structure' : 'Structure Builder'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <input
                type="text"
                value={structureName}
                onChange={(e) => setStructureName(e.target.value)}
                placeholder="Enter Structure Name..."
                style={{
                  fontSize: '18px', fontWeight: 800, color: 'var(--text-slate-900)',
                  border: 'none', background: 'transparent', outline: 'none', width: '300px', padding: 0
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px',
              padding: '0 16px', height: '34px', fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 4px rgba(59,130,246,0.2)'
            }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '24px 0', overflowY: 'auto' }}>
          <div style={{
            maxWidth: '210mm', width: '100%', margin: '0 auto', background: '#fff',
            borderRadius: '4px', boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            border: '1px solid #e2e8f0', minHeight: '1000px', padding: '10mm 15mm'
          }}>
            <LetterTiptapEditor
              content={htmlContent}
              onChange={(html) => setHtmlContent(html)}
              minHeight={900}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
