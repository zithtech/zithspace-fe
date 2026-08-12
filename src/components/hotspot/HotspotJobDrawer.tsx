import React from 'react';
import { Drawer, Button, Typography, Tag, Divider, Space } from 'antd';
import { OpeningListItem } from '@/services/openingV2Service';
import { Briefcase, Clock, Users, Building2, Calendar, FileText, CheckCircle2, Flame, GraduationCap, Banknote, Laptop } from 'lucide-react';
import { experienceRange, salaryRange, relativeDays, PALETTE, TINT } from '@/components/openings/ui';
import { usePermission } from '@/hooks/usePermission';

const { Title, Text, Paragraph } = Typography;

interface HotspotJobDrawerProps {
  open: boolean;
  opening: OpeningListItem | null;
  onClose: () => void;
  onApply: () => void;
}

export default function HotspotJobDrawer({ open, opening, onClose, onApply }: HotspotJobDrawerProps) {
  const { canCreateHotspotOpening } = usePermission();
  
  if (!opening) return null;

  return (
    <Drawer
      title={null}
      width={840}
      open={open}
      onClose={onClose}
      closable={false}
      styles={{ body: { padding: 0 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px' }}>
          <Button size="large" onClick={onClose} style={{ borderRadius: 8, fontWeight: 600 }}>Close</Button>
          {canCreateHotspotOpening && (
            <Button size="large" type="primary" onClick={onApply} style={{ borderRadius: 8, fontWeight: 600, padding: '0 32px' }}>
              Apply / Refer
            </Button>
          )}
        </div>
      }
    >
      <div className="hotspot-drawer-header-section">
        <div className="hotspot-drawer-header-inner">
          <div className="hotspot-drawer-badge">
            <Flame size={14} className="hotspot-drawer-badge-icon" />
            Internal Opening
          </div>
          <Title level={2} className="hotspot-drawer-title">{opening.jobTitle}</Title>
          <div className="hotspot-drawer-meta-row">
            <span className="hotspot-code">{opening.openingCode}</span>
            <span className="hotspot-company">
              <Building2 size={15} />
              {opening.clientName || 'Internal'}
              {opening.departmentName && ` • ${opening.departmentName}`}
            </span>
          </div>
        </div>
      </div>

      <div className="hotspot-drawer-body">
        <div className="hotspot-info-cards">
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Laptop size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Work Mode</div>
              <div className="hotspot-info-val">{opening.workMode?.replace('_', ' ') || 'Office'}</div>
            </div>
          </div>
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Briefcase size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Experience</div>
              <div className="hotspot-info-val">{experienceRange(opening.minExperience, opening.maxExperience)}</div>
            </div>
          </div>
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Clock size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Employment</div>
              <div className="hotspot-info-val">{opening.employmentType?.replace('_', ' ') || 'Full Time'}</div>
            </div>
          </div>
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Users size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Positions</div>
              <div className="hotspot-info-val">{opening.numberOfPositions} Position{opening.numberOfPositions > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Banknote size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Salary</div>
              <div className="hotspot-info-val">{salaryRange(opening.salaryMin, opening.salaryMax, opening.salaryCurrency, opening.salaryPeriod) || 'Not Disclosed'}</div>
            </div>
          </div>
          <div className="hotspot-info-card">
            <div className="hotspot-info-icon-wrapper">
              <Calendar size={18} />
            </div>
            <div className="hotspot-info-text">
              <div className="hotspot-info-label">Posted</div>
              <div className="hotspot-info-val">{opening.postedInternallyAt ? relativeDays(opening.postedInternallyAt) : 'Recently'}</div>
            </div>
          </div>
        </div>

        <div className="hotspot-content-card">
          <h3 className="hotspot-section-title">
            <div className="hotspot-section-icon"><FileText size={18} /></div>
            Job Description
          </h3>
          {opening.jobDescription ? (
            <div className="hotspot-html-content" dangerouslySetInnerHTML={{ __html: opening.jobDescription }} />
          ) : (
            <div className="hotspot-empty-state">No job description provided.</div>
          )}
        </div>

        {opening.responsibilities && (
          <div className="hotspot-content-card">
            <h3 className="hotspot-section-title">
              <div className="hotspot-section-icon"><CheckCircle2 size={18} /></div>
              Responsibilities
            </h3>
            <div className="hotspot-html-content" dangerouslySetInnerHTML={{ __html: opening.responsibilities }} />
          </div>
        )}

        {(opening.education) && (
          <div className="hotspot-content-card">
            <h3 className="hotspot-section-title">
              <div className="hotspot-section-icon"><GraduationCap size={18} /></div>
              Education
            </h3>
            <div className="hotspot-html-content">{opening.education}</div>
          </div>
        )}

        {(opening.requiredSkills?.length > 0 || opening.preferredSkills?.length > 0) && (
          <div className="hotspot-content-card">
            <h3 className="hotspot-section-title">
              <div className="hotspot-section-icon"><CheckCircle2 size={18} /></div>
              Skills & Requirements
            </h3>
            <div className="hotspot-skills">
              {opening.requiredSkills?.map((skill, idx) => (
                <div className="hotspot-skill-tag required" key={`req-${idx}`}>{skill}</div>
              ))}
              {opening.preferredSkills?.map((skill, idx) => (
                <div className="hotspot-skill-tag preferred" key={`pref-${idx}`}>{skill}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .hotspot-drawer-header-section {
          background: var(--bg-pure-white);
          border-bottom: 1px solid var(--border-slate-200);
          position: relative;
        }
        .hotspot-drawer-header-inner {
          padding: 40px 32px 32px 32px;
        }
        .hotspot-drawer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-slate-100);
          color: var(--text-slate-700);
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }
        .hotspot-drawer-title {
          margin: 0 0 16px 0 !important;
          font-size: 28px !important;
          font-weight: 800 !important;
          color: var(--text-slate-900);
          line-height: 1.2 !important;
          letter-spacing: -0.02em;
        }
        .hotspot-drawer-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hotspot-code {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-700);
          background: var(--bg-slate-100);
          padding: 4px 10px;
          border-radius: 6px;
        }
        .hotspot-company {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          color: var(--text-slate-600);
          font-weight: 600;
        }
        .hotspot-drawer-body {
          padding: 32px;
          background: var(--bg-slate-50);
        }
        .hotspot-info-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .hotspot-info-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .hotspot-info-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-slate-50);
          color: var(--text-slate-600);
        }
        .hotspot-info-text {
          flex: 1;
        }
        .hotspot-info-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-slate-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .hotspot-info-val {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-slate-900);
          text-transform: capitalize;
        }
        .hotspot-content-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .hotspot-content-card:last-child {
          margin-bottom: 0;
        }
        .hotspot-section-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-slate-900);
          margin: 0 0 24px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hotspot-section-icon {
          width: 32px;
          height: 32px;
          background: var(--bg-slate-100);
          color: var(--text-slate-700);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hotspot-html-content {
          font-size: 15px;
          color: var(--text-slate-600);
          line-height: 1.8;
        }
        .hotspot-html-content :global(p) { 
          margin-bottom: 1.5em; 
        }
        .hotspot-html-content :global(p:last-child) { 
          margin-bottom: 0; 
        }
        .hotspot-html-content :global(ul), .hotspot-html-content :global(ol) {
          margin-bottom: 1.5em;
          padding-left: 20px;
        }
        .hotspot-html-content :global(li) { 
          margin-bottom: 8px; 
        }
        .hotspot-html-content :global(li::marker) {
          color: var(--text-slate-400);
        }
        .hotspot-html-content :global(strong) { 
          color: var(--text-slate-900); 
          font-weight: 600; 
        }
        .hotspot-empty-state {
          padding: 24px;
          background: var(--bg-slate-50);
          border-radius: 8px;
          border: 1px dashed var(--border-slate-300);
          color: var(--text-slate-500);
          font-size: 14px;
          text-align: center;
        }
        .hotspot-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .hotspot-skill-tag {
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
        }
        .hotspot-skill-tag.required {
          background: var(--bg-slate-100);
          color: var(--text-slate-800);
          border: 1px solid var(--border-slate-200);
        }
        .hotspot-skill-tag.preferred {
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          border: 1px solid var(--border-slate-200);
        }
      `}</style>
    </Drawer>
  );
}
