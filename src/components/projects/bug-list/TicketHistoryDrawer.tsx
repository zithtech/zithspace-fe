import React from "react";
import { Drawer, Button, Typography, Timeline, Tag } from "antd";
import { History, FileText, ExternalLink, X } from "lucide-react";
import type { BugListItem } from "@/services/bugListService";
import { useTicketDrawer } from "@/context/TicketDrawerContext";
import dayjs from "dayjs";
import { commonDrawerProps } from "@/components/common/DrawerSection";

const { Text, Title } = Typography;

interface TicketHistoryDrawerProps {
  bug: BugListItem | null;
  open: boolean;
  onClose: () => void;
}

export default function TicketHistoryDrawer({ bug, open, onClose }: TicketHistoryDrawerProps) {
  const { open: openTicketDrawer } = useTicketDrawer();

  if (!bug) return null;

  const currentTicket = bug.ticketId ? {
    id: bug.ticketId,
    ticketNumber: bug.ticketNumber,
    status: bug.ticketStatus || "Active",
    isCurrent: true,
  } : null;

  const history = bug.ticketHistory || [];
  
  // Combine history and current ticket for timeline, sort by timestamp (newest first)
  // Assuming history entries have a timestamp
  const items = [...history].reverse().map(h => ({
    ...h,
    isCurrent: false
  }));

  if (currentTicket) {
    items.unshift({
      ...currentTicket,
      timestamp: new Date().toISOString(), // roughly current
    } as any);
  }

  return (
    <Drawer
      {...commonDrawerProps}
      placement="right"
      onClose={onClose}
      open={open}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div
          className="customer-drawer-header"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-color, #f0f0f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: 'var(--bg-pure-white, #fff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <History size={18} />
            <span>Ticket History</span>
          </div>
          <Button type="text" icon={<X size={18} />} onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        </div>

        <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary">
              History for bug: <strong>{bug.title || bug.bugNumber}</strong>
            </Text>
          </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
          <FileText size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
          <div>No ticket history available.</div>
        </div>
      ) : (
        <Timeline
          items={items.map((item, index) => ({
            color: item.isCurrent ? "blue" : "gray",
            dot: item.isCurrent ? <FileText size={16} /> : undefined,
            children: (
              <div 
                style={{ 
                  background: 'var(--bg-pure-white, #fff)', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  border: `1px solid ${item.isCurrent ? 'var(--premium-blue, #bfdbfe)' : 'var(--border-color, #e5e7eb)'}`,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 15, color: item.isCurrent ? 'var(--premium-blue, #1e40af)' : 'var(--text-primary, #4b5563)' }}>
                    {item.ticketNumber}
                  </Text>
                  {item.isCurrent ? (
                    <Tag color="blue" style={{ margin: 0 }}>Current</Tag>
                  ) : (
                    <Tag style={{ margin: 0 }}>Historical</Tag>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Status: <span style={{ color: 'var(--text-primary, #374151)', fontWeight: 500 }}>{item.status || 'Unknown'}</span>
                  </Text>
                  {item.timestamp && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.timestamp).format('MMM D, YYYY')}
                    </Text>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <Button 
                    type={item.isCurrent ? "primary" : "default"}
                    size="small" 
                    icon={<ExternalLink size={14} />}
                    onClick={() => {
                      const idToOpen = (item as any).id || (item as any).ticketId;
                      if (idToOpen) openTicketDrawer(idToOpen);
                    }}
                    style={{ width: '100%' }}
                  >
                    View {item.isCurrent ? "Current" : "Previous"} Ticket
                  </Button>
                </div>
              </div>
            )
          }))}
        />
      )}
        </div>
      </div>
    </Drawer>
  );
}
