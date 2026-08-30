"use client";

import NoData from "@/components/common/NoData";
import React, { useEffect, useMemo, useState } from "react";
import { Typography, Avatar, Empty, Tooltip } from "antd";
import { OverviewPager } from "./OverviewPager";
import { TeamOutlined, TrophyOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  contribution: number;
  done: number;
  active: number;
  todo: number;
  assigned: number;
  totalHours: number;
}

interface TeamProgressCardsProps {
  members: TeamMember[];
}

// Palette: blue / green / red / grey only
const C = {
  blue: "#3b82f6",
  green: "#10b981",
  red: "#ef4444",
  grey: "#64748b",
};

const Stat: React.FC<{ label: string; value: number | string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="po-tm-stat">
    <span className="po-tm-stat-num" style={{ color }}>
      {value}
    </span>
    <span className="po-tm-stat-lbl">{label}</span>
  </div>
);

export const TeamProgressCards: React.FC<TeamProgressCardsProps> = ({ members = [] }) => {
  const [sortBy, setSortBy] = useState<string>("Contribution");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const sorted = useMemo(() => {
    const copy = [...members];
    if (sortBy === "Hours") copy.sort((a, b) => b.totalHours - a.totalHours);
    else copy.sort((a, b) => b.contribution - a.contribution);
    return copy;
  }, [members, sortBy]);

  // Reset to first page when the ordering or data set changes.
  useEffect(() => {
    setPage(1);
  }, [sortBy, members.length]);

  const topContribution = sorted[0]?.contribution ?? 0;
  const pagedSorted = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="po-tm-wrap">
      <div className="po-tm-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="po-tm-header-ic">
            <TeamOutlined />
          </div>
          <div>
            <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-slate-900)" }}>Team Progress</Text>
            <div style={{ fontSize: 11.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
              {members.length} {members.length === 1 ? "member" : "members"} contributing
            </div>
          </div>
        </div>
        <div className="po-tm-toggle">
          <span className="po-tm-toggle-label">Sort by</span>
          <div className="po-tm-seg">
            <button
              className={sortBy === "Contribution" ? "is-active" : ""}
              onClick={() => setSortBy("Contribution")}
            >
              Contribution
            </button>
            <button
              className={sortBy === "Hours" ? "is-active" : ""}
              onClick={() => setSortBy("Hours")}
            >
              Hours
            </button>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="po-tm-empty">
          <NoData description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No team members</Text>} />
        </div>
      ) : (
        <div className="po-tm-list">
          {pagedSorted.map((m, i) => {
            const rank = (page - 1) * pageSize + i + 1;
            const isTop = sortBy === "Contribution" && page === 1 && i === 0 && topContribution > 0;
            return (
              <div key={m.id} className={`po-tm-row ${isTop ? "is-top" : ""}`}>
                <span className="po-tm-rank">{rank}</span>

                {/* Identity */}
                <div className="po-tm-identity">
                  <span className={`po-tm-ava ${isTop ? "is-top" : ""}`}>
                    <Avatar
                      shape="square"
                      size={36}
                      src={m.avatarUrl}
                      style={{
                        background: C.blue,
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 13,
                        borderRadius: 8,
                      }}
                    >
                      {m.name?.substring(0, 2).toUpperCase() || "UN"}
                    </Avatar>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Text strong ellipsis style={{ fontSize: 13.5, color: "var(--text-slate-900)" }}>
                        {m.name || "Unknown Member"}
                      </Text>
                      {isTop && (
                        <Tooltip title="Top contributor">
                          <span className="po-tm-top">
                            <TrophyOutlined style={{ fontSize: 9 }} /> Top
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <Text style={{ fontSize: 10.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
                      {m.assigned} {m.assigned === 1 ? "ticket" : "tickets"} assigned
                    </Text>
                  </div>
                </div>

                {/* Contribution bar */}
                <div className="po-tm-contrib">
                  <div className="po-tm-bar">
                    <span style={{ width: `${Math.min(m.contribution || 0, 100)}%`, background: C.blue }} />
                  </div>
                  <span className="po-tm-pct">{m.contribution || 0}%</span>
                </div>

                {/* Stats */}
                <div className="po-tm-stats">
                  <Stat label="Total" value={m.assigned || 0} color={C.grey} />
                  <Stat label="Done" value={m.done || 0} color={C.green} />
                  <Stat label="Active" value={m.active || 0} color={C.blue} />
                  <Stat label="To do" value={m.todo || 0} color={C.red} />
                  <Stat label="Hours" value={`${m.totalHours || 0}h`} color={C.grey} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {members.length > 0 && (
        <OverviewPager
          total={members.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          noun="members"
        />
      )}

      <style jsx global>{`
        .po-tm-wrap {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        [data-theme='dark'] .po-tm-wrap {
          background: #111720;
          border-color: #1f2937;
          box-shadow: none;
        }
        .po-tm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0;
          padding: 11px 14px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          flex-wrap: wrap;
          gap: 12px;
          flex-shrink: 0;
        }
        [data-theme='dark'] .po-tm-header {
          background: #0f1419;
          border-bottom-color: #1f2937;
        }
        .po-tm-header-ic {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.12);
          color: ${C.green};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .po-tm-toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .po-tm-toggle-label {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .po-tm-seg {
          display: inline-flex;
          gap: 2px;
          padding: 3px;
          border-radius: 9px;
          background: var(--bg-slate-100, #f1f5f9);
          border: 1px solid var(--border-slate-200);
        }
        .po-tm-seg button {
          height: 28px;
          padding: 0 14px;
          border: none;
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-500);
          transition: color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
        }
        .po-tm-seg button:hover {
          color: var(--text-slate-900);
        }
        .po-tm-seg button.is-active {
          background: var(--bg-pure-white);
          color: #3b82f6;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
        }
        .po-tm-empty {
          background: transparent;
          border: none;
          border-radius: 0;
          flex: 1;
          padding: 48px 0;
        }
        .po-tm-list {
          background: transparent;
          border: none;
          border-radius: 0;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }
        .po-tm-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 16px 10px 14px;
          border-bottom: 1px solid var(--border-slate-100);
          transition: background 0.12s ease;
        }
        .po-tm-row:last-child {
          border-bottom: none;
        }
        .po-tm-row:hover {
          background: var(--bg-slate-50);
        }
        .po-tm-row.is-top {
          background: rgba(16, 185, 129, 0.05);
        }
        .po-tm-row.is-top::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: ${C.green};
        }
        .po-tm-rank {
          flex-shrink: 0;
          width: 20px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-400);
          font-variant-numeric: tabular-nums;
        }
        .po-tm-identity {
          display: flex;
          align-items: center;
          gap: 11px;
          flex: 1;
          min-width: 0;
        }
        .po-tm-ava {
          display: inline-flex;
          padding: 2px;
          border-radius: 10px;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        .po-tm-ava.is-top {
          background: rgba(16, 185, 129, 0.35);
        }
        .po-tm-top {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 1px 7px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          color: ${C.green};
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        .po-tm-contrib {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 230px;
          flex-shrink: 0;
        }
        .po-tm-bar {
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: var(--border-slate-200);
          overflow: hidden;
        }
        .po-tm-bar > span {
          display: block;
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .po-tm-pct {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-slate-900);
          min-width: 38px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .po-tm-stats {
          display: flex;
          align-items: stretch;
          flex-shrink: 0;
        }
        .po-tm-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 70px;
          flex-shrink: 0;
          padding: 0 4px;
          border-left: 1px solid var(--border-slate-100);
        }
        .po-tm-stat:first-child {
          border-left: none;
        }
        .po-tm-stat-num {
          font-size: 15px;
          font-weight: 800;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .po-tm-stat-lbl {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 4px;
        }

        @media (max-width: 1100px) {
          .po-tm-row {
            flex-wrap: wrap;
            gap: 12px;
          }
          .po-tm-identity {
            width: auto;
            flex: 1;
          }
          .po-tm-contrib {
            order: 3;
            width: 100%;
            flex: none;
          }
        }
        @media (max-width: 620px) {
          .po-tm-stats {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};
