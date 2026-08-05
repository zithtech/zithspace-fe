import React, { useEffect, useState } from 'react';
import { OpeningDetail } from '@/services/openingV2Service';
import { PipelineService as pipelineClient } from '@/services/pipelineService';

export function RoundsTab({ opening }: { opening: OpeningDetail }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await pipelineClient.listConfigs();
        if (res.success) {
          const match = res.data.find(
            (c: any) => c.role?.toLowerCase().trim() === opening.jobTitle?.toLowerCase().trim()
          );
          setConfig(match || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [opening.jobTitle]);

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading rounds...</div>;
  if (!config) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>No pipeline configuration found for this role.</div>;

  return (
    <div style={{ paddingBottom: 24 }}>
      {config.rounds?.sort((a: any, b: any) => a.round_number - b.round_number).map((round: any, i: number) => (
        <div className="omp-section" key={round.id || i} style={{ marginBottom: 20, borderRadius: 12 }}>
          <div className="omp-section-head" style={{ margin: '-24px -24px 20px -24px', borderRadius: '12px 12px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <div className="omp-section-title">
                  Round {round.round_number}: {round.round_name || 'Interview Round'}
                </div>
                <div className="omp-section-sub">
                  {round.scorecards?.length || 0} evaluation criteria
                </div>
              </div>
              <div style={{ 
                fontSize: 11, fontWeight: 700, color: 'var(--text-slate-500)', 
                background: 'var(--bg-slate-200)', padding: '4px 10px', 
                borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' 
              }}>
                {round.round_type?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          
          {round.scorecards && round.scorecards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {round.scorecards.map((sc: any, j: number) => (
                <div key={sc.id || j} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '12px 16px', border: '1px solid var(--border-slate-100)', 
                  borderRadius: 8, background: 'var(--bg-slate-50)' 
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-700)' }}>
                    {sc.criteria_name}
                  </span>
                  <span style={{ 
                    fontSize: 12, fontWeight: 700, color: 'var(--text-slate-500)', 
                    background: 'var(--bg-pure-white)', padding: '2px 8px', 
                    borderRadius: 12, border: '1px solid var(--border-slate-200)',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.02)'
                  }}>
                    {sc.weight_percentage}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="omp-empty" style={{ padding: '24px 0' }}>
              <div className="omp-empty-title">No specific criteria</div>
              <div className="omp-empty-sub">This round has no defined scorecards.</div>
            </div>
          )}
        </div>
      ))}
      
      {(!config.rounds || config.rounds.length === 0) && (
        <div className="omp-empty">
          <div className="omp-empty-title">No rounds configured</div>
          <div className="omp-empty-sub">This role doesn't have an interview pipeline yet.</div>
        </div>
      )}
    </div>
  );
}
