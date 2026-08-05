import React from 'react';
import { Button } from 'antd';
import { Building2, MapPin, Briefcase, Clock, Users } from 'lucide-react';
import { OpeningListItem } from '@/services/openingV2Service';
import { PALETTE, TINT, relativeDays, experienceRange } from '@/components/openings/ui';
import { useReferenceData } from '@/components/openings/useReferenceData';

export default function HotspotCard({
  opening,
  onApply,
  onClick,
}: {
  opening: OpeningListItem;
  onApply: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  const reference = useReferenceData(true);
  const resolvedLocation = opening.locationId
    ? reference.locations.find((l) => l.value === opening.locationId)?.label || opening.location
    : opening.location;

  return (
    <div className="hotspot-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="hotspot-card-header">
        <div className="hotspot-title-row">
          <h3 className="hotspot-title">{opening.jobTitle}</h3>
          <span className="hotspot-code">{opening.openingCode}</span>
        </div>
        <div className="hotspot-company">
          <Building2 size={14} />
          {opening.clientName || 'Internal'}
          {opening.departmentName && ` • ${opening.departmentName}`}
        </div>
      </div>

      <div className="hotspot-card-body">
        <div className="hotspot-info-grid">
          <div className="hotspot-info-item">
            <MapPin size={14} className="hotspot-info-icon" />
            <span>{resolvedLocation || 'Remote'}</span>
          </div>
          <div className="hotspot-info-item">
            <Briefcase size={14} className="hotspot-info-icon" />
            <span>{experienceRange(opening.minExperience, opening.maxExperience)}</span>
          </div>
          <div className="hotspot-info-item">
            <Clock size={14} className="hotspot-info-icon" />
            <span>{opening.employmentType?.replace('_', ' ') || 'Full Time'}</span>
          </div>
          <div className="hotspot-info-item">
            <Users size={14} className="hotspot-info-icon" />
            <span>{opening.numberOfPositions} Position{opening.numberOfPositions > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="hotspot-tags">
          {opening.requiredSkills.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="hotspot-tag">{skill}</span>
          ))}
          {opening.requiredSkills.length > 4 && (
            <span className="hotspot-tag">+{opening.requiredSkills.length - 4}</span>
          )}
        </div>
      </div>

      <div className="hotspot-card-footer">
        <div className="hotspot-posted-time">
          {opening.postedInternallyAt ? `Posted ${relativeDays(opening.postedInternallyAt)}` : ''}
        </div>
        <Button
          type="primary"
          onClick={(e) => { e.stopPropagation(); onApply(e); }}
          className="hotspot-apply-btn"
        >
          Apply Now
        </Button>
      </div>

      <style jsx>{`
        .hotspot-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.2s ease;
        }
        .hotspot-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border-color: ${PALETTE.blue}40;
          transform: translateY(-1px);
        }
        .hotspot-card-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-slate-100);
          background: linear-gradient(180deg, var(--bg-slate-50) 0%, var(--bg-pure-white) 100%);
        }
        .hotspot-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 4px;
        }
        .hotspot-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-slate-900);
          margin: 0;
          line-height: 1.3;
        }
        .hotspot-code {
          font-size: 10px;
          font-weight: 700;
          color: ${PALETTE.blue};
          background: ${TINT.blue};
          padding: 2px 6px;
          border-radius: 4px;
        }
        .hotspot-company {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-slate-600);
          font-weight: 500;
        }
        .hotspot-card-body {
          padding: 12px 16px;
          flex: 1;
        }
        .hotspot-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }
        .hotspot-info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-slate-700);
          font-weight: 500;
        }
        .hotspot-info-icon {
          color: var(--text-slate-400);
        }
        .hotspot-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .hotspot-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-slate-600);
          background: var(--bg-slate-100);
          padding: 2px 8px;
          border-radius: 100px;
        }
        .hotspot-card-footer {
          padding: 10px 16px;
          border-top: 1px solid var(--border-slate-100);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-slate-50);
        }
        .hotspot-posted-time {
          font-size: 11px;
          color: var(--text-slate-500);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
