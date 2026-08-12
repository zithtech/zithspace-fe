"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { 
  Space, 
  Typography, 
  Card, 
  Row, 
  Col, 
  DatePicker, 
  Select, 
  Button, 
  Divider,
  Tooltip
} from "antd";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  Filter, 
  Download, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Calendar
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Mock data for beautiful placeholder charts
const REVENUE_DATA = [
  { name: 'Jan', revenue: 4500, count: 12 },
  { name: 'Feb', revenue: 5200, count: 15 },
  { name: 'Mar', revenue: 4800, count: 14 },
  { name: 'Apr', revenue: 6100, count: 18 },
  { name: 'May', revenue: 5900, count: 17 },
  { name: 'Jun', revenue: 7200, count: 22 },
];

const STATUS_DATA = [
  { name: 'Paid', value: 65, color: '#22c55e' },
  { name: 'Pending', value: 25, color: '#3b82f6' },
  { name: 'Overdue', value: 10, color: '#ef4444' },
];

export default function InvoiceproReportsPage() {
  const router = useRouter();
  const { canReadInvoiceReport } = usePermission();
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !canReadInvoiceReport) {
      router.push('/invoice/invoices');
    }
  }, [authLoading, canReadInvoiceReport, router]);

  const StatCard = ({ label, value, icon: Icon, color, trend, trendValue }: any) => (
    <Card 
      styles={{ body: { padding: 24 } }} 
      style={{ 
        borderRadius: 20, 
        border: "1px solid #f1f5f9", 
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        height: "100%",
        overflow: "hidden"
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.025em" }}>{label}</Text>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>{value}</div>
          {trend && (
            <div className={`flex items-center mt-2 text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
              {trendValue} 
              <span className="ml-1 text-slate-400 font-normal text-[11px]">vs last month</span>
            </div>
          )}
        </div>
        <div style={{ 
          color, 
          background: `${color}15`, 
          padding: 14, 
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 12px -2px ${color}20`
        }}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  );

  if (authLoading) return <MainLayout><div className="flex justify-center items-center h-screen"><ZukvoLoader size="lg" /></div></MainLayout>;
  if (!canReadInvoiceReport) return null;

  return (
    <MainLayout>
      <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "#ffffff",
          minHeight: "calc(100vh - 64px)"
      }}>
        {/* ================= HEADER ================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div style={{ flex: 1 }}>
            <Space size={14} align="center">
              <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 14, color: "#334155", display: "flex" }}>
                <BarChart3 size={28} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Business Intelligence</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Comprehensive insights into your revenue and billing performance.</Text>
              </div>
            </Space>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
            <RangePicker 
              size="large" 
              style={{ borderRadius: 12, height: 44 }} 
              defaultValue={[dayjs().subtract(1, 'month'), dayjs()]}
              className="w-full sm:w-auto"
            />
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                size="large"
                icon={<RefreshCw size={18} />}
                onClick={() => setLoading(true)}
                loading={loading}
                className="flex-1 sm:flex-initial flex items-center justify-center"
                style={{ borderRadius: 12, height: 44 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<Download size={18} />}
                className="flex-1 sm:flex-initial flex items-center justify-center text-white"
                style={{ borderRadius: 12, height: 44, padding: "0 20px", fontWeight: 600, background: "#0f172a", border: "none" }}
              >
                Export data
              </Button>
            </div>
          </div>
        </div>

        {/* ================= STATS ================= */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Net Revenue" value="$42,350.00" icon={DollarSign} color="#3b82f6" trend="up" trendValue="+12.5%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Invoices Sent" value="128" icon={FileText} color="#8b5cf6" trend="up" trendValue="+8.2%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Avg. Order Value" value="$330.85" icon={TrendingUp} color="#10b981" trend="down" trendValue="-2.4%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard label="Total Customers" value="48" icon={Users} color="#f59e0b" trend="up" trendValue="+4.1%" />
          </Col>
        </Row>

        {/* ================= CHARTS ================= */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-slate-800 font-bold">Revenue Growth</span>
                </div>
              }
              style={{ borderRadius: 20, border: "1px solid #f1f5f9", height: "auto" }}
              styles={{ body: { padding: "20px 24px" } }}
              className="shadow-sm"
            >
              <div style={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_DATA}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <PieChartIcon size={18} />
                  </div>
                  <span className="text-slate-800 font-bold">Payment Status</span>
                </div>
              }
              style={{ borderRadius: 20, border: "1px solid #f1f5f9", height: "100%" }}
              className="shadow-sm"
            >
              <div style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={STATUS_DATA}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {STATUS_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-900 font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: "40px 0" }} />

        {/* ================= RECENT ACTIVITY MOCK ================= */}
        <div className="mb-8">
           <Title level={4} style={{ fontWeight: 700, color: "#1e293b", marginBottom: 20 }}>Top Performers</Title>
           <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, border: "1px solid #f1f5f9" }} className="shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <Text strong style={{ fontSize: 16 }}>Top Customers by Revenue</Text>
                      <Button type="link" size="small">View all</Button>
                   </div>
                   <div className="space-y-4">
                      {[
                        { name: "Acme Corp", rev: "$12,400", trend: "+15%" },
                        { name: "Globex Inc", rev: "$8,200", trend: "+5%" },
                        { name: "Soylent Corp", rev: "$7,100", trend: "+12%" },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">{c.name[0]}</div>
                              <Text strong className="text-slate-800">{c.name}</Text>
                           </div>
                           <div className="text-right">
                              <div className="font-bold text-slate-900">{c.rev}</div>
                              <div className="text-green-600 text-[11px] font-bold">{c.trend}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 20, border: "1px solid #f1f5f9" }} className="shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <Text strong style={{ fontSize: 16 }}>Highest Value Invoices</Text>
                      <Button type="link" size="small">Export</Button>
                   </div>
                   <div className="space-y-4">
                      {[
                        { id: "INV-2026-001", amount: "$4,500.00", date: "Mar 12, 2026" },
                        { id: "INV-2026-042", amount: "$3,800.00", date: "Mar 20, 2026" },
                        { id: "INV-2026-089", amount: "$3,200.00", date: "Mar 28, 2026" },
                      ].map((inv, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="size-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><Download size={18} /></div>
                              <div>
                                <div className="font-bold text-slate-800">{inv.id}</div>
                                <div className="text-slate-400 text-xs">{inv.date}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="font-extrabold text-blue-600">{inv.amount}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
              </Col>
           </Row>
        </div>
      </div>
    </MainLayout>
  );
}
