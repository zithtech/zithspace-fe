'use client';

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { OpeningListItem } from '@/services/openingV2Service';
import OpeningV2Service from '@/services/openingV2Service';
import { OpeningStyles, PanelHeader } from '@/components/openings/ui';
import HotspotCard from './HotspotCard';
import ApplyModal from './ApplyModal';

import HotspotJobDrawer from './HotspotJobDrawer';

export default function HotspotDashboard() {
  const [openings, setOpenings] = useState<OpeningListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<OpeningListItem | null>(null);

  useEffect(() => {
    loadOpenings();
  }, [search]);

  const loadOpenings = async () => {
    setLoading(true);
    try {
      // Query openings that are actively posted internally
      const res = await OpeningV2Service.list({
        status: ['internal_posting'],
        search,
        pageSize: 100,
      });
      setOpenings(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (opening: OpeningListItem) => {
    setSelectedOpening(opening);
    setApplyModalOpen(true);
    setDrawerOpen(false); // Close drawer if it was open
  };

  const handleCardClick = (opening: OpeningListItem) => {
    setSelectedOpening(opening);
    setDrawerOpen(true);
  };

  return (
    <div className="omp hotspot-dashboard">
      <OpeningStyles />
      <PanelHeader
        icon={<Flame />}
        color="#F97316"
        tint="rgba(249, 115, 22, 0.1)"
        title="Internal Job Postings (Hotspot)"
        subtitle="Explore and apply to opportunities within the company"
        search={search}
        onSearch={setSearch}
        hideHamburger={true}
      />

      <div className="hotspot-grid">
        {loading ? (
          <div className="omp-empty">Loading...</div>
        ) : openings.length === 0 ? (
          <div className="omp-empty">
            <div className="omp-empty-title">No Internal Openings</div>
            <div className="omp-empty-sub">There are currently no internal job postings available.</div>
          </div>
        ) : (
          openings.map((opening) => (
            <HotspotCard
              key={opening.id}
              opening={opening}
              onClick={() => handleCardClick(opening)}
              onApply={() => handleApply(opening)}
            />
          ))
        )}
      </div>

      <HotspotJobDrawer
        open={drawerOpen}
        opening={selectedOpening}
        onClose={() => setDrawerOpen(false)}
        onApply={() => handleApply(selectedOpening!)}
      />

      {selectedOpening && (
        <ApplyModal
          open={applyModalOpen}
          opening={selectedOpening}
          onClose={() => setApplyModalOpen(false)}
        />
      )}

      <style jsx>{`
        .hotspot-dashboard {
          margin: 0 -8px;
          padding: 0 0 40px 0;
        }
        .hotspot-dashboard :global(.omp-header) {
          padding: 12px 24px 12px 24px !important;
          margin-bottom: 16px !important;
        }
        .hotspot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 16px;
          padding: 0 24px;
        }
      `}</style>
    </div>
  );
}
