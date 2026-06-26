"use client";

import React from "react";
import { Table, Avatar, Tag, Space, Typography, Button, Tooltip, Pagination, Select, Dropdown } from "antd";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  MoreHorizontal,
  Clock,
  Package,
  CheckCircle2,
  Eye,
  Activity,
  User,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { ProjectOutlined, TagOutlined, EyeOutlined, EditOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DailyStatusUpdate,
  ProjectUpdate,
  formatHours,
  getStatusConfig,
} from "@/types/dailyUpdate";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

const { Text } = Typography;

interface UpdateTableProps {
  updates: DailyStatusUpdate[];
  loading: boolean;
  onViewDetails: (update: DailyStatusUpdate) => void;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
}

interface TableDataType {
  key: string;
  update: DailyStatusUpdate;
  userName: string;
  userPosition: string;
  mood: string;
  totalHours: number;
  projectCount: number;
  taskCount: number;
  submittedAt: string | Date;
  dueDate: string | Date;
}

export default function UpdateTable({
  updates,
  loading,
  onViewDetails,
  onDeleteUpdate,
}: UpdateTableProps) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { canUpdateDailyUpdate, canDeleteDailyUpdate } = usePermission();
  const router = useRouter();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const columns: ColumnsType<TableDataType> = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      width: 200,
      fixed: "left",
      render: (name: string, record) => {
        const updateType = record.update.updateType || "EOD";
        return (
          <Space size={10}>
            <Avatar
              src={record.update.user?.avatarUrl}
              size={32}
              style={{
                backgroundColor: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <Text strong style={{ fontSize: 13, display: "block", color: "var(--text-slate-900)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {name}
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {record.userPosition || "Team Member"}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Projects",
      dataIndex: "projectCount",
      key: "projectCount",
      width: 140,
      render: (count: number, record) => {
        const projectUpdates = (record.update.projectUpdates || []) as ProjectUpdate[];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={14} color="var(--text-slate-400)" />
            <Text style={{ fontSize: 12, color: "var(--text-slate-700)" }}>
              {count === 1 ? projectUpdates[0]?.projectName : `${count} Projects`}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Tasks",
      dataIndex: "taskCount",
      key: "taskCount",
      width: 120,
      render: (count: number, record) => {
        const projectUpdates = (record.update.projectUpdates || []) as ProjectUpdate[];
        const firstTask = projectUpdates[0]?.tasks?.[0];
        const projectName = projectUpdates[0]?.projectName;
        const showAsTicketLink = count === 1 && !!firstTask?.ticketNumber && !!firstTask?.ticketId;
        
        if (showAsTicketLink) {
          const ticketTooltip = (
            <div style={{ maxWidth: 260, padding: '2px 0' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span
                  className="inline-flex items-center gap-1 font-semibold uppercase"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.08em',
                    color: isDark ? 'rgba(255,255,255,0.62)' : 'var(--text-slate-400, #94a3b8)',
                  }}
                >
                  <TagOutlined style={{ fontSize: 10 }} /> Ticket
                </span>
                {projectName && (
                  <span
                    className="inline-flex items-center gap-1 font-bold px-1.5 py-[1px] rounded-full"
                    style={{
                      fontSize: 9.5,
                      background: isDark ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.10)',
                      color: isDark ? '#C4B5FD' : '#7C3AED',
                    }}
                  >
                    <ProjectOutlined style={{ fontSize: 8 }} />
                    {projectName}
                  </span>
                )}
              </div>
              <div
                className="font-bold tracking-tight mb-1"
                style={{ fontSize: 14, color: isDark ? '#7DD3FC' : '#0284c7', letterSpacing: '-0.01em' }}
              >
                {firstTask!.ticketNumber}
              </div>
              <div
                className="font-medium"
                style={{
                  fontSize: 11.5,
                  color: isDark ? 'rgba(255,255,255,0.88)' : 'var(--text-slate-700, #334155)',
                  lineHeight: 1.45,
                }}
              >
                {firstTask!.description}
              </div>
              <div
                className="mt-2 pt-2 flex items-center justify-between"
                style={{
                  borderTop: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid var(--border-slate-200, #e2e8f0)',
                  fontSize: 10,
                }}
              >
                <span style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'var(--text-slate-400, #94a3b8)' }}>
                  Click to open
                </span>
              </div>
            </div>
          );

          return (
            <Tooltip
              title={ticketTooltip}
              placement="topLeft"
              mouseEnterDelay={0.2}
              overlayInnerStyle={{
                background: isDark ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
                backdropFilter: 'blur(8px)',
                borderRadius: 10,
                padding: '10px 12px',
                boxShadow: isDark
                  ? '0 10px 32px rgba(15,23,42,0.28), 0 0 0 1px rgba(255,255,255,0.06)'
                  : '0 10px 32px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.08)',
              }}
            >
              <div
                className="dh-inline-cell flex items-center gap-1 py-1 px-2 rounded-md transition-colors group"
                style={{ width: 'fit-content', maxWidth: '100%', cursor: 'pointer', background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openTicketDrawer(firstTask!.ticketId!);
                }}
              >
                <span
                  className="font-semibold text-[#3b82f6] group-hover:text-[#2563eb] dark:text-sky-600 dark:hover:text-sky-700 truncate"
                  style={{ fontSize: '12px', lineHeight: '1.2' }}
                >
                  {firstTask!.ticketNumber}
                </span>
              </div>
            </Tooltip>
          );
        }
        return (
          <Text ellipsis style={{ fontSize: 12, color: "var(--text-slate-700)", maxWidth: 160 }}>
            {count === 1 ? (firstTask?.description) : `${count} Tasks Completed`}
          </Text>
        );
      },
    },
    {
      title: "Progress",
      key: "progress",
      width: 140,
      render: (_, record) => {
        const projectUpdates = (record.update.projectUpdates || []) as ProjectUpdate[];
        const firstTask = projectUpdates[0]?.tasks?.[0];
        const status = firstTask?.status || "pending";
        const config = getStatusConfig(status);
        
        return (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 8px",
            background: "var(--bg-slate-50)",
            border: "1px solid var(--border-slate-200)",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-slate-700)",
            whiteSpace: "nowrap"
          }}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        );
      }
    },
    {
      title: "Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      width: 80,
      render: (hours: number) => (
        <Tag
          style={{
            borderRadius: 6,
            background: "var(--bg-blue-50)",
            border: "none",
            color: "var(--text-blue-700)",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px"
          }}
        >
          {formatHours(hours)}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      render: (date: string) => (
        <Text style={{ fontSize: 12, color: "var(--text-slate-600)", fontWeight: 500 }}>
          {dayjs(date).format("DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "Submitted On",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 140,
      render: (time: string | Date, record: TableDataType) => {
        const isEdited = record.update.updatedAt && record.update.createdAt && dayjs(record.update.updatedAt).diff(dayjs(record.update.createdAt), 'second') > 60;
        const isMissed = Boolean(record.update.is_missed);
        return (
          <Space direction="vertical" size={4}>
            <Text style={{ fontSize: 12, color: "var(--text-slate-600)" }}>
              {dayjs(isEdited ? record.update.updatedAt : time).format("MMM D, h:mm A")}
            </Text>
            {isMissed && (
              <Tag style={{ background: "var(--bg-red-50)", color: "var(--text-red-600)", border: "none", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, margin: 0 }}>
                Missed
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "center" as const,
      width: 72,
      fixed: "right",
      render: (_, record) => {
        const update = record.update;
        const isEditable = dayjs().diff(dayjs(update.createdAt), "hour") < 24;
        const isOwner = user?.id === update.userId;
        const editDisabled = !isEditable || !canUpdateDailyUpdate;

        const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
          <div className="du-menu-item">
            <span className="du-menu-ic" style={{ color, background: tint }}>{icon}</span>
            <span className="du-menu-text">
              <span className="du-menu-title">{title}</span>
              <span className="du-menu-desc">{desc}</span>
            </span>
          </div>
        );

        const items: any[] = [
          {
            key: 'view',
            label: menuLabel('View details', 'View full update details', <EyeOutlined />, '#3b82f6', 'rgba(59,130,246,0.12)')
          }
        ];

        if (isOwner) {
          items.push({
            key: 'edit',
            disabled: editDisabled,
            label: menuLabel('Edit', 'Modify this update', <EditOutlined />, '#64748b', 'rgba(100,116,139,0.12)')
          });
        }

        if (canDeleteDailyUpdate) {
          items.push({
            type: 'divider'
          });
          items.push({
            key: 'delete',
            danger: true,
            label: (
              <ConfirmDialog
                tone="danger"
                icon={<Trash2 size={15} />}
                title="Delete Update?"
                description="Are you sure you want to delete this status update? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                placement="left"
                onConfirm={async () => {
                  if (onDeleteUpdate) {
                    await onDeleteUpdate(update.id);
                  }
                }}
              >
                <div
                  style={{
                    margin: '-5px -12px',
                    padding: '5px 12px',
                    width: 'calc(100% + 24px)',
                    height: '100%'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {menuLabel('Delete', 'Remove this update', <DeleteOutlined />, '#ef4444', 'rgba(239,68,68,0.12)')}
                </div>
              </ConfirmDialog>
            )
          });
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown 
              menu={{ 
                items,
                onClick: ({ key, domEvent }: any) => {
                  domEvent.stopPropagation();
                  if (key === 'view') onViewDetails(update);
                  else if (key === 'edit') {
                    if (!editDisabled) router.push(`/daily-updates/submit?edit=${update.id}`);
                  }
                }
              }} 
              trigger={['click']} 
              placement="bottomRight"
              overlayClassName="du-action-pop"
            >
              <Button type="text" className="du-icon-btn" icon={<MoreVertical size={18} />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const dataSource: TableDataType[] = updates.map((update) => {
    const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
    const totalHours = projectUpdates.reduce(
      (sum, project) => sum + (project.hoursWorked || 0),
      0
    );
    const totalTasks = projectUpdates.reduce(
      (sum, project) => sum + (project.tasks?.length || 0),
      0
    );

    return {
      key: update.id,
      update,
      userName: update.user?.name || "Unknown",
      userPosition: update.user?.position?.title || "",
      mood: update.mood || "neutral",
      totalHours,
      projectCount: projectUpdates.length,
      taskCount: totalTasks,
      submittedAt: typeof update.submittedAt === "string"
        ? update.submittedAt
        : update.submittedAt?.toISOString() || update.createdAt,
      dueDate: update.is_missed && update.missed_updateAt
        ? update.missed_updateAt
        : update.createdAt,
    };
  });

  const total = dataSource.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const paginatedData = dataSource.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <div style={{ flex: "1 0 auto", background: "var(--bg-pure-white)", borderRadius: 0, border: "1px solid var(--border-slate-200)", overflow: "hidden", marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={paginatedData}
          loading={loading}
          pagination={false}
          scroll={{ x: 1060 }}
          onRow={(record) => ({
            onClick: () => onViewDetails(record.update),
            style: { cursor: "pointer" },
          })}
          style={{
            background: "transparent",
          }}
          className="premium-table"
        />
      </div>
      {total > 0 && (
        <div className="du-footer du-footer--sticky">
          <div className="du-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="du-pager">
            <button type="button" className="du-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`du-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button type="button" className="du-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="du-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
              options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}
      <style jsx>{`
        .du-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .du-footer--sticky {
          position: sticky; bottom: 0; z-index: 30; 
          margin-top: auto; margin-right: -24px; margin-bottom: 0; margin-left: -24px;
          padding: 12px 24px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          border-top: 1px solid var(--border-slate-200);
          border-radius: 0;
        }
        .du-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .du-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .du-pager { display: flex; align-items: center; gap: 3px; }
        .du-pager-btn, .du-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .du-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .du-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .du-pagesize { margin-left: 5px; }
        .du-pagesize :global(.ant-select-selector) { border-radius: 7px !important; height: 28px !important; }

        :global(.premium-table .ant-table) { background: transparent; font-size: 12px; }
        :global(.premium-table .ant-table-thead > tr > th) {
          background: var(--bg-slate-50) !important; 
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; 
          font-weight: 700 !important; 
          letter-spacing: 0.04em;
          text-transform: uppercase; 
          color: var(--text-slate-400) !important; 
          padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        :global(.premium-table .ant-table-thead > tr > th:not(:first-child)::before) {
          content: "" !important;
          position: absolute !important;
          top: 50% !important;
          left: 0 !important;
          width: 1px !important;
          height: 14px !important;
          background-color: var(--border-slate-200) !important;
          transform: translateY(-50%) !important;
        }
        :global(.premium-table .ant-table-tbody > tr > td) { 
          border-bottom: 1px solid var(--border-slate-100) !important; 
          padding: 6.5px 10px !important; 
        }
        :global(.premium-table .ant-table-tbody > tr:last-child > td) { 
          border-bottom: none !important; 
        }
        :global(.premium-table .ant-table-tbody > tr:hover > td) { 
          background: var(--bg-slate-50) !important; 
        }

        /* Dark theme table overrides to match Proposal page */
        :global([data-theme='dark'] .premium-table .ant-table-thead > tr > th) {
          background: #161B22 !important;
          border-bottom: 1px solid #374151 !important;
          color: #94A3B8 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-thead > tr > th:not(:first-child)::before) {
          background-color: #374151 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody > tr > td) {
          background-color: #0B0F1A !important;
          border-bottom: 1px solid #1F2937 !important;
          color: #F1F5F9 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td) {
          background: #161B22 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody .ant-typography) {
          color: #F1F5F9 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody .ant-typography[style*="color: var(--text-slate-400)"]) {
          color: #94A3B8 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody .ant-typography[style*="color: var(--text-slate-600)"]) {
          color: #94A3B8 !important;
        }
        :global([data-theme='dark'] .premium-table .ant-table-tbody .ant-typography[style*="color: var(--text-slate-700)"]) {
          color: #F1F5F9 !important;
        }

        /* Dark theme footer & pagination overrides */
        :global([data-theme='dark'] .du-footer),
        :global([data-theme='dark'] .du-footer--sticky) {
          background: #0B0F1A !important;
          border-top-color: #374151 !important;
        }
        :global([data-theme='dark'] .du-footer-info) {
          color: #94A3B8 !important;
        }
        :global([data-theme='dark'] .du-footer-info strong) {
          color: #FFFFFF !important;
        }
        :global([data-theme='dark'] .du-pager-btn),
        :global([data-theme='dark'] .du-pager-num) {
          background: rgba(255,255,255,0.03) !important;
          border-color: #374151 !important;
          color: #94A3B8 !important;
        }
        :global([data-theme='dark'] .du-pager-num.is-active) {
          background: #3B82F6 !important;
          border-color: #3B82F6 !important;
          color: #ffffff !important;
        }
        :global([data-theme='dark'] .du-pagesize .ant-select-selector) {
          background: #0B0F1A !important;
          border-color: #374151 !important;
          color: #F1F5F9 !important;
        }
        :global([data-theme='dark'] .du-pagesize .ant-select-arrow) {
          color: #94A3B8 !important;
        }

        /* Premium action dropdown */
        :global(.du-action-pop .ant-dropdown-menu) {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        :global(.du-action-pop .ant-dropdown-menu-item) {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        :global(.du-action-pop .ant-dropdown-menu-item:hover) { background: var(--bg-slate-50) !important; }
        :global(.du-action-pop .ant-dropdown-menu-item-divider) { margin: 5px 8px !important; background: var(--border-slate-100); }
        :global(.du-action-pop .ant-dropdown-menu-title-content) { line-height: 1.2; }
        :global(.du-menu-item) { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        :global(.du-menu-ic) {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        :global(.du-menu-text) { display: flex; flex-direction: column; min-width: 0; }
        :global(.du-menu-title) { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        :global(.du-menu-desc) { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        :global(.du-action-pop .ant-dropdown-menu-item-danger:hover) { background: rgba(239,68,68,0.08) !important; }
        :global(.du-action-pop .ant-dropdown-menu-item-danger .du-menu-title) { color: #ef4444; }
        :global(.du-action-pop .ant-dropdown-menu-item-disabled) { opacity: 0.45; }
        :global(.du-action-pop .ant-dropdown-menu-item-disabled:hover) { background: transparent !important; }
        
        :global(.du-icon-btn) { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        :global(.du-icon-btn:hover) { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }
      `}</style>
    </>
  );
}
