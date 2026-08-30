"use client";

import React from "react";
import { Skeleton } from "antd";
import { TicketDetailStyles } from "./ticketDetailUI";

const Block = ({ h, w = "100%", r = 8 }: { h: number; w?: number | string; r?: number }) => (
  <span className="tdx-sk" style={{ height: h, width: w, borderRadius: r }} />
);

export default function TicketDetailsLoading() {
  return (
    <div className="tdx tdx-page">
      <TicketDetailStyles />

      <div className="tdx-topbar-sk">
        <Block h={30} w={30} r={9} />
        <Block h={12} w={220} r={6} />
        <span style={{ flex: 1 }} />
        <Block h={32} w={92} r={9} />
        <Block h={32} w={112} r={9} />
      </div>

      <div className="tdx-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
            <Block h={24} w={86} r={7} />
            <Block h={24} w={62} r={7} />
            <Block h={24} w={96} r={7} />
          </div>
          <Block h={26} w="62%" r={8} />
          <div style={{ height: 18 }} />
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Block h={24} w={96} r={7} />
            <Block h={16} w={72} r={6} />
            <Block h={26} w={150} r={8} />
          </div>
        </div>
        <div className="tdx-sk-stats">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="tdx-sk-stat">
              <Block h={10} w={82} r={4} />
              <Block h={19} w={58} r={6} />
              <Block h={4} w="100%" r={2} />
            </div>
          ))}
        </div>
      </div>

      <div className="tdx-grid">
        <div className="tdx-col">
          <div className="tdx-card">
            <div className="tdx-card__head">
              <Block h={12} w={104} r={5} />
            </div>
            <div className="tdx-card__body">
              <Skeleton active paragraph={{ rows: 6 }} title={false} />
            </div>
          </div>
          <div className="tdx-card">
            <div className="tdx-card__head">
              <Block h={12} w={122} r={5} />
            </div>
            <div className="tdx-card__body">
              <Skeleton active avatar paragraph={{ rows: 2 }} title={false} />
            </div>
          </div>
        </div>

        <div className="tdx-col">
          <div className="tdx-card">
            <div className="tdx-card__head">
              <Block h={12} w={88} r={5} />
            </div>
            <div className="tdx-card__body">
              <Skeleton active paragraph={{ rows: 8 }} title={false} />
            </div>
          </div>
          <div className="tdx-card">
            <div className="tdx-card__head">
              <Block h={12} w={80} r={5} />
            </div>
            <div className="tdx-card__body">
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tdx-sk {
          display: block;
          background: linear-gradient(
            90deg,
            var(--tdx-inset) 25%,
            var(--tdx-line-soft) 37%,
            var(--tdx-inset) 63%
          );
          background-size: 400% 100%;
          animation: tdxShimmer 1.4s ease infinite;
          flex-shrink: 0;
        }
        @keyframes tdxShimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0 50%;
          }
        }
        .tdx-topbar-sk {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 56px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--tdx-line-soft);
        }
        .tdx-sk-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid var(--tdx-line-soft);
          background: var(--tdx-inset);
        }
        .tdx-sk-stat {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px 18px;
          border-right: 1px solid var(--tdx-line-soft);
        }
        .tdx-sk-stat:last-child {
          border-right: none;
        }
        @media (max-width: 1100px) {
          .tdx-sk-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
