"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Typography, 
  Space, 
  Button, 
  Input, 
  Select, 
  Card, 
  message, 
  Spin, 
  Slider, 
  Empty, 
  Badge,
  Tooltip
} from "antd";
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  UserOutlined, 
  DollarOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FireOutlined
} from "@ant-design/icons";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { dealService, Deal } from "@/services/dealService";
import pipelineStageService, { PipelineStage } from "@/services/pipelineStageService";
import { EmployeeService } from "@/services/employeeServices";
import KanbanColumn from "@/components/deals/KanbanColumn";
import DealCard from "@/components/deals/DealCard";
import DealDetailsDrawer from "@/components/deals/DealDetailsDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

const BoardView: React.FC = () => {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [valueRange, setValueRange] = useState<[number, number]>([0, 1000000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsRes, stagesRes, employeesRes] = await Promise.all([
        dealService.getAllDeals(),
        pipelineStageService.getAll(),
        EmployeeService.getEmployeesForSelect()
      ]);
      setDeals(dealsRes || []);
      setStages(stagesRes || []);
      setEmployees(employeesRes || []);
    } catch (error) {
      console.error("Error fetching board data:", error);
      message.error("Failed to load board data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered and Grouped Deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchText.toLowerCase()) || 
                           deal.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
                           deal.clientName.toLowerCase().includes(searchText.toLowerCase());
      const matchesUser = !selectedUser || deal.assignedToId === selectedUser;
      const matchesValue = (deal.estimatedValue || 0) >= valueRange[0] && (deal.estimatedValue || 0) <= valueRange[1];
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => deal.tags?.includes(tag));
      
      return matchesSearch && matchesUser && matchesValue && matchesTags;
    });
  }, [deals, searchText, selectedUser, valueRange, selectedTags]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    stages.forEach(stage => {
      grouped[stage.id] = filteredDeals.filter(deal => deal.stageId === stage.id);
    });
    return grouped;
  }, [stages, filteredDeals]);

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Logic for moving between columns or sorting within column
    const isActiveADeal = active.data.current?.type === "Deal";
    const isOverAColumn = over.data.current?.type === "Column";
    const isOverADeal = over.data.current?.type === "Deal";

    if (!isActiveADeal) return;

    // Moving between columns
    if (isOverAColumn) {
      const overColumnId = overId as string;
      const activeDeal = deals.find(d => d.id === activeId);
      
      if (activeDeal && activeDeal.stageId !== overColumnId) {
        setDeals(prev => {
          return prev.map(d => d.id === activeId ? { ...d, stageId: overColumnId } : d);
        });
      }
    }

    // Dropping over another deal in a different column
    if (isOverADeal) {
      const overDeal = deals.find(d => d.id === overId);
      const activeDeal = deals.find(d => d.id === activeId);
      
      if (activeDeal && overDeal && activeDeal.stageId !== overDeal.stageId) {
        setDeals(prev => {
          return prev.map(d => d.id === activeId ? { ...d, stageId: overDeal.stageId } : d);
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;
    
    // Find the current state of the deal
    const finalDealState = deals.find(d => d.id === dealId);
    if (!finalDealState) return;

    try {
      // Persist the stage change to backend
      await dealService.updateDeal(dealId, { stageId: finalDealState.stageId });
      message.success(`Deal moved to ${stages.find(s => s.id === finalDealState.stageId)?.name}`);
    } catch (error) {
      console.error("Failed to update deal stage:", error);
      message.error("Failed to save deal stage change");
      // Optionally revert state on failure
      fetchData();
    }
  };

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    deals.forEach(deal => deal.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [deals]);

  if (loading && deals.length === 0) {
    return (
      <MainLayout>
        <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" tip="Loading active pipeline">
            <div style={{ padding: 20 }} />
          </Spin>
        </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", padding: "16px", background: 'var(--bg-pure-white)' }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <Space align="center" size={10}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--bg-red-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FireOutlined style={{ color: 'var(--text-leave)', fontSize: 18 }} />
              </div>
              <Title level={3} style={{ margin: 0, color: 'var(--text-slate-900)' }}>Sales Pipeline</Title>
            </Space>
            <Text style={{ display: 'block', marginTop: 4, color: 'var(--text-slate-500)' }}>Manage your deals and track progress across stages</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
            <Button icon={<UnorderedListOutlined />} onClick={() => router.push("/admin/deals")}>List View</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/admin/deals/create")}>
              Create Deal
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div style={{ 
          padding: "12px 16px", 
          background: "var(--bg-slate-50)", 
          border: "1px solid var(--border-slate-100)", 
          borderRadius: "8px", 
          marginBottom: "20px" 
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <Input  
              placeholder="Search deals, companies..." 
              prefix={<SearchOutlined />} 
              style={{ width: 250 }} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            
            <Select 
              placeholder="Assigned To" 
              style={{ width: 180 }} 
              allowClear
              prefix={<UserOutlined />}
              onChange={setSelectedUser}
              value={selectedUser}
            >
              {employees.map(emp => (
                <Option key={emp.value} value={emp.value}>{emp.label}</Option>
              ))}
            </Select>

            <Select
              mode="multiple"
              placeholder="Filter by Tags"
              style={{ width: 200 }}
              allowClear
              onChange={setSelectedTags}
              value={selectedTags}
            >
              {allTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>

            <div style={{ width: 200, display: "flex", alignItems: "center", gap: "8px" }}>
              <Tooltip title="Value Range">
                <DollarOutlined style={{ color: "#8c8c8c" }} />
              </Tooltip>
              <Slider 
                range 
                min={0} 
                max={500000} 
                step={5000}
                style={{ flex: 1 }}
                value={valueRange}
                onChange={val => setValueRange(val as [number, number])}
              />
            </div>
            
            <Badge count={filteredDeals.length} style={{ backgroundColor: "#1677ff" }}>
              <Button icon={<FilterOutlined />} type="text">Results</Button>
            </Badge>
          </div>
        </div>

        {/* Kanban Board */}
        <div style={{ flex: 1, overflowX: "auto", display: "flex", paddingBottom: "16px" }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage[stage.id] || []}
                onDealClick={(deal) => {
                  router.push(`/admin/deals/${deal.id}`);
                }}
              />
            ))}

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeDeal ? (
                <DealCard deal={activeDeal} onClick={() => {}} />
              ) : null}
            </DragOverlay>
          </DndContext>
          
          {stages.length === 0 && (
            <div style={{ width: "100%", textAlign: "center", padding: "100px" }}>
              <Empty description="No pipeline stages found. Please create stages in settings." />
              <Button type="primary" onClick={() => router.push("/admin/pipeline-settings")}>
                Go to Pipeline Settings
              </Button>
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        <DealDetailsDrawer 
          deal={selectedDeal} 
          visible={drawerVisible} 
          onClose={() => {
            setDrawerVisible(false);
            setSelectedDeal(null);
          }} 
        />
      </div>
    </MainLayout>
  );
};

export default BoardView;
