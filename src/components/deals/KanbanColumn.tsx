"use client";

import React from "react";
import { Typography, Space, Badge, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import DealCard from "./DealCard";
import { Deal } from "@/services/dealService";
import { PipelineStage } from "@/services/pipelineStageService";

const { Title, Text } = Typography;

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals, onDealClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: "Column",
      stage,
    },
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.estimatedValue || 0), 0);
  const currency = deals.length > 0 ? deals[0].currency || "USD" : "USD";

  return (
    <div
      style={{
        width: "300px",
        minWidth: "300px",
        marginRight: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f4f5f7",
        borderRadius: "12px",
        border: isOver ? `2px dashed ${stage.color}` : "2px solid transparent",
        transition: "all 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <div 
        style={{ 
          padding: "16px 16px 12px", 
          backgroundColor: "transparent",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <Space size={8}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: stage.color }} />
            <Text strong style={{ margin: 0, fontSize: "13px", color: '#595959', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stage.name}
            </Text>
          </Space>
          <Badge count={deals.length} overflowCount={999} style={{ backgroundColor: "#e8eaed", color: "#595959", fontWeight: 600, boxShadow: 'none' }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "16px" }}>
          <Space size={4}>
            <Text strong style={{ fontSize: "14px", color: stage.color }}>
              {currency} {totalValue.toLocaleString()}
            </Text>
            <Tooltip title={`Probability: ${stage.probability}%`}>
              <InfoCircleOutlined style={{ fontSize: "12px", color: "#bfbfbf" }} />
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* Cards Area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: "8px",
          overflowY: "auto",
          minHeight: "100px",
        }}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.length === 0 && !isOver && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "#bfbfbf" }}>
              <Text type="secondary" italic style={{ fontSize: "12px" }}>
                No deals in this stage
              </Text>
            </div>
          )}
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
