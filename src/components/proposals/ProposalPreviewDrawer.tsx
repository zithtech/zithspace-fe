"use client";

import React from "react";
import { Drawer, Button } from "antd";
import { ExportOutlined, EditOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface ProposalLite {
  id: string;
  title?: string;
  client_name?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  proposal: ProposalLite | null;
  canEdit?: boolean;
}

const ProposalPreviewDrawer: React.FC<Props> = ({ open, onClose, proposal, canEdit }) => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={680}
      destroyOnClose
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "inline-flex",
              alignItems: "center", justifyContent: "center",
              background: "#3B82F6", color: "#fff",
            }}
          >
            <ExportOutlined style={{ fontSize: 14 }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
              {proposal?.title || "Proposal"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {proposal?.client_name || "Preview"}
            </div>
          </div>
        </div>
      }
      extra={
        canEdit && proposal ? (
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/proposals/builder?id=${proposal.id}`)}
          >
            Edit
          </Button>
        ) : undefined
      }
      styles={{
        body: { padding: 0, background: '#f8fafc', overflow: "hidden" },
        header: { background: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#0f172a' },
        wrapper: { background: '#ffffff' },
      }}
    >
      {proposal && (
        <iframe
          key={proposal.id}
          src={`/proposals/preview?proposalId=${proposal.id}&theme=${theme === 'dark' ? 'dark' : 'light'}`}
          title="Proposal preview"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      )}
    </Drawer>
  );
};

export default ProposalPreviewDrawer;
