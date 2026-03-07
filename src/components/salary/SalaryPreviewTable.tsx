"use client";

import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PayComp { id: string; name: string; amount: number; }
interface Employee {
  id: string; name: string; code: string; dept: string; role: string;
  initials: string; hue: string; workDays: number; lop: number; status: string;
  earnings: PayComp[]; deductions: PayComp[];
}
interface Computed extends Employee {
  gross: number; ded: number; net: number; lopAmt: number;
}

// ── Data ─────────────────────────────────────────────────────────────────────
const PAYROLL: Employee[] = [
  { id:"1", name:"Senthil Kumar", code:"ZIT-001", dept:"Engineering", role:"Fullstack Developer", initials:"SK", hue:"#6366f1", workDays:22, lop:0, status:"Approved",
    earnings:[{id:"e1",name:"Basic Pay",amount:62500},{id:"e2",name:"HRA",amount:31250},{id:"e3",name:"Conveyance",amount:5000},{id:"e4",name:"Special Allowance",amount:26250}],
    deductions:[{id:"d1",name:"Provident Fund",amount:7500},{id:"d2",name:"Professional Tax",amount:1000}] },
  { id:"2", name:"Ananya Ghosh", code:"ZIT-005", dept:"Design", role:"UI/UX Designer", initials:"AG", hue:"#ec4899", workDays:22, lop:1, status:"Draft",
    earnings:[{id:"e1",name:"Basic Pay",amount:47500},{id:"e2",name:"HRA",amount:23750},{id:"e3",name:"Special Allowance",amount:23750}],
    deductions:[{id:"d1",name:"Provident Fund",amount:5700},{id:"d2",name:"Professional Tax",amount:500}] },
  { id:"3", name:"Rahul Sharma", code:"ZIT-012", dept:"Sales", role:"Account Executive", initials:"RS", hue:"#f59e0b", workDays:22, lop:0, status:"Draft",
    earnings:[{id:"e1",name:"Basic Pay",amount:40000},{id:"e2",name:"HRA",amount:20000},{id:"e3",name:"Incentive",amount:15000},{id:"e4",name:"Conveyance",amount:5000}],
    deductions:[{id:"d1",name:"Provident Fund",amount:4800},{id:"d2",name:"Professional Tax",amount:500}] },
  { id:"4", name:"Priyanka Nair", code:"ZIT-008", dept:"HR", role:"Talent Acquisition", initials:"PN", hue:"#10b981", workDays:22, lop:0, status:"Approved",
    earnings:[{id:"e1",name:"Basic Pay",amount:32500},{id:"e2",name:"HRA",amount:16250},{id:"e3",name:"Special Allowance",amount:16250}],
    deductions:[{id:"d1",name:"Provident Fund",amount:3900},{id:"d2",name:"Professional Tax",amount:200}] },
  { id:"5", name:"Vikram Singh", code:"ZIT-022", dept:"Engineering", role:"DevOps Engineer", initials:"VS", hue:"#8b5cf6", workDays:22, lop:3, status:"Draft",
    earnings:[{id:"e1",name:"Basic Pay",amount:55000},{id:"e2",name:"HRA",amount:27500},{id:"e3",name:"Performance Bonus",amount:27500}],
    deductions:[{id:"d1",name:"Provident Fund",amount:6600},{id:"d2",name:"Professional Tax",amount:1000}] },
];

const rupee = (n: number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const compute = (emp: Employee): Computed => {
  const gross = emp.earnings.reduce((s,e) => s+e.amount, 0);
  const ded   = emp.deductions.reduce((s,d) => s+d.amount, 0);
  const lopAmt = Math.round((gross / emp.workDays) * emp.lop);
  return { ...emp, gross, ded, net: gross - ded - lopAmt, lopAmt };
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ico = {
  users:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  wallet:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  dollar:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  check:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  pen:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  chevron: (d: boolean) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={d?"6 9 12 15 18 9":"6 15 12 9 18 15"}/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  filter:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
};

// ── Inline amount editor ──────────────────────────────────────────────────────
function AmountEdit({ value, onSave, onCancel }: { value: number; onSave: (v: number) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <span style={{display:'flex',alignItems:'center',gap:5}}>
      <input autoFocus type="number" value={v} onChange={e=>setV(+e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter')onSave(v);if(e.key==='Escape')onCancel();}}
        style={{width:88,padding:'4px 8px',border:'1.5px solid #6366f1',borderRadius:7,fontSize:12,outline:'none',fontFamily:'inherit',background:'#f5f3ff',color:'#3730a3'}} />
      <button onClick={()=>onSave(v)} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:6,padding:'4px 8px',fontSize:11,cursor:'pointer',fontWeight:600}}>✓</button>
      <button onClick={onCancel} style={{background:'#f1f5f9',color:'#64748b',border:'none',borderRadius:6,padding:'4px 8px',fontSize:11,cursor:'pointer'}}>✕</button>
    </span>
  );
}

// ── Expanded detail panel ─────────────────────────────────────────────────────
function DetailPanel({ emp, onUpdate, onAdd, onRemove }: {
  emp: Computed;
  onUpdate: (eid: string, type: string, cid: string, val: number) => void;
  onAdd: (eid: string, type: string) => void;
  onRemove: (eid: string, type: string, cid: string) => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const perDay = Math.round(emp.gross / emp.workDays);

  const Section = ({ title, items, type, accent, bg, border }: {
    title: string; items: PayComp[]; type: string; accent: string; bg: string; border: string;
  }) => (
    <div style={{background:bg, borderRadius:14, padding:18, border:`1.5px solid ${border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{fontSize:10,fontWeight:700,color:accent,letterSpacing:1.5,textTransform:'uppercase'}}>{title}</span>
        <button onClick={()=>onAdd(emp.id, type)} style={{display:'flex',alignItems:'center',gap:4,background:`${accent}15`,color:accent,border:`1px solid ${accent}30`,borderRadius:7,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
          {Ico.plus} Add
        </button>
      </div>
      {items.length === 0 && <div style={{textAlign:'center',color:'#cbd5e1',fontSize:12,padding:'14px 0'}}>None added</div>}
      {items.map(item => (
        <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:`1px solid ${border}80`}}>
          <span style={{fontSize:12,color:'#64748b',fontWeight:500}}>{item.name}</span>
          <span style={{display:'flex',alignItems:'center',gap:7}}>
            {editId === item.id
              ? <AmountEdit value={item.amount} onSave={(v: number)=>{onUpdate(emp.id,type,item.id,v);setEditId(null);}} onCancel={()=>setEditId(null)} />
              : <>
                  <span style={{fontSize:13,fontWeight:700,color:accent}}>{rupee(item.amount)}</span>
                  <button onClick={()=>setEditId(item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',display:'flex',alignItems:'center',padding:'2px 3px'}}>{Ico.pen}</button>
                  <button onClick={()=>onRemove(emp.id,type,item.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#fca5a5',display:'flex',alignItems:'center',padding:'2px 3px'}}>{Ico.trash}</button>
                </>
            }
          </span>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'space-between',paddingTop:12,marginTop:4}}>
        <span style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>Total</span>
        <span style={{fontSize:14,fontWeight:800,color:accent}}>{rupee(items.reduce((s,x)=>s+x.amount,0))}</span>
      </div>
    </div>
  );

  return (
    <div style={{background:'#f8faff',borderTop:'1.5px solid #e0e7ff',padding:'22px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'190px 1fr 1fr',gap:16,marginBottom:16}}>
        {/* Attendance */}
        <div style={{background:'#fff',borderRadius:14,padding:18,border:'1.5px solid #e0e7ff',boxShadow:'0 1px 6px rgba(99,102,241,0.06)'}}>
          <div style={{fontSize:10,fontWeight:700,color:'#6366f1',letterSpacing:1.5,textTransform:'uppercase',marginBottom:16}}>Attendance</div>
          {([['Working Days', String(emp.workDays), '#1e293b'],
            ['Payable Days', String(emp.workDays - emp.lop), '#1e293b'],
            ['LOP Days', String(emp.lop), emp.lop > 0 ? '#ef4444' : '#94a3b8'],
            ['Per Day Rate', rupee(perDay), '#6366f1'],
            ['LOP Impact', emp.lop > 0 ? `-${rupee(emp.lopAmt)}` : '—', '#ef4444'],
          ] as [string, string, string][]).map(([l,v,c]) => (
            <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:11}}>
              <span style={{fontSize:11,color:'#94a3b8'}}>{l}</span>
              <span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>

        <Section title="Earnings"   items={emp.earnings}   type="earnings"   accent="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
        <Section title="Deductions" items={emp.deductions} type="deductions" accent="#ef4444" bg="#fff5f5" border="#fecaca" />
      </div>

      {/* Net payable bar */}
      <div style={{
        background:'linear-gradient(135deg,#4338ca 0%,#6366f1 60%,#818cf8 100%)',
        borderRadius:14, padding:'18px 28px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        boxShadow:'0 6px 24px rgba(99,102,241,0.22)'
      }}>
        <div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:1}}>Calculation</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:4}}>
            {rupee(emp.gross)} − {rupee(emp.ded)}{emp.lop>0?` − ${rupee(emp.lopAmt)} (LOP)`: ''}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:1}}>Net Payable Amount</div>
          <div style={{fontSize:28,fontWeight:800,color:'#fff',letterSpacing:'-0.5px',marginTop:4}}>{rupee(emp.net)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SalaryPreviewTable() {
  const [data, setData] = useState<Computed[]>(PAYROLL.map(compute));
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1"]));
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const notify = (msg: string, type = 'success') => { setToast({msg,type}); setTimeout(()=>setToast(null), 2500); };
  const toggle = (id: string) => setExpanded(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleSelect = (id: string) => setSelected(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
  };
  const handleApprove = () => {
    setData(p => p.map(e => selected.has(e.id) ? compute({...e, status: 'Approved'}) : e));
    notify(`${selected.size} employee(s) approved`);
    setSelected(new Set());
  };

  // ── Derived ──
  const departments = useMemo(() => {
    const depts = new Set(data.map(e => e.dept));
    return ['All Departments', ...Array.from(depts)];
  }, [data]);

  const filtered = useMemo(() => data.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All Departments' || e.dept === deptFilter;
    const matchStatus = statusFilter === 'All Statuses' || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  }), [data, search, deptFilter, statusFilter]);

  // ── Handlers ──
  const onUpdate = (eid: string, type: string, cid: string, val: number) => {
    setData(p => p.map(e => e.id!==eid ? e : compute({...e, [type]: (e as any)[type].map((c: PayComp) => c.id!==cid ? c : {...c, amount:val})})));
    notify("Amount updated");
  };
  const onAdd = (eid: string, type: string) => {
    const nid = `new-${Date.now()}`;
    setData(p => p.map(e => e.id!==eid ? e : compute({...e, [type]: [...(e as any)[type], {id:nid, name: type==='earnings'?'New Earning':'New Deduction', amount:0}]})));
  };
  const onRemove = (eid: string, type: string, cid: string) => {
    setData(p => p.map(e => e.id!==eid ? e : compute({...e, [type]: (e as any)[type].filter((c: PayComp) => c.id!==cid)})));
    notify("Removed", "info");
  };

  const stats = [
    { label:"Total Employees", val: String(data.length),                              icon: Ico.users,  accent:"#6366f1" },
    { label:"Net Payroll",      val: rupee(data.reduce((s,e)=>s+e.net,0)),            icon: Ico.wallet, accent:"#0ea5e9" },
    { label:"Deductions",       val: rupee(data.reduce((s,e)=>s+e.ded,0)),            icon: Ico.dollar, accent:"#ef4444" },
    { label:"Approved",         val: `${data.filter(e=>e.status==="Approved").length} / ${data.length}`,
                                sub: `${Math.round(data.filter(e=>e.status==="Approved").length/data.length*100)}% done`,
                                icon: Ico.check, accent:"#10b981" },
  ];

  // ── Select style helper ──
  const selectStyle: React.CSSProperties = {
    height: 38, padding: '0 14px', border: '1.5px solid #e0e7ff', borderRadius: 10,
    fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#374151',
    background: '#fff', cursor: 'pointer',
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .wp-stat  { animation: fadeUp 0.4s ease both; transition: box-shadow 0.2s, transform 0.2s; }
        .wp-stat:hover  { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1) !important; }
        .wp-row   { transition: background 0.13s; }
        .wp-row:hover { background: #f5f7ff !important; }
        input::placeholder { color: #94a3b8; }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); outline: none; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:20,right:20,zIndex:9999,background: toast.type==='success'?'#16a34a':'#6366f1',color:'#fff',padding:'11px 18px',borderRadius:10,fontSize:13,fontWeight:500,boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header with buttons ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:'#94a3b8',textTransform:'uppercase',marginBottom:4,fontWeight:700}}>PAYROLL MODULE</div>
          <div style={{fontSize:24,fontWeight:800,color:'#1e293b',letterSpacing:'-0.5px'}}>Salary Preview</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button style={{display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:11,border:'1.5px solid #e0e7ff',background:'#fff',color:'#6366f1',fontSize:13,fontWeight:600,cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            {Ico.refresh} Refresh
          </button>
          <button style={{display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(16,185,129,0.35)'}}>
            {Ico.check} Finalize Payroll
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {stats.map((s,i) => (
          <div key={s.label} className="wp-stat" style={{
            background:'#fff', borderRadius:16, padding:'20px 22px',
            border:'1.5px solid #e8ecf8',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
            animationDelay:`${i*0.07}s`
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1.2,fontWeight:700,marginBottom:10}}>{s.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:'#1e293b',letterSpacing:'-0.5px'}}>{s.val}</div>
                {s.sub && <div style={{fontSize:11,color:s.accent,fontWeight:600,marginTop:4}}>↑ {s.sub}</div>}
              </div>
              <div style={{width:42,height:42,borderRadius:11,background:`${s.accent}12`,border:`1.5px solid ${s.accent}22`,display:'flex',alignItems:'center',justifyContent:'center',color:s.accent}}>
                {s.icon}
              </div>
            </div>
            {/* accent progress bar */}
            <div style={{marginTop:16,height:3,background:'#f1f5f9',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:'62%',background:`linear-gradient(90deg,${s.accent},${s.accent}40)`,borderRadius:2}} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div style={{background:'#fff',borderRadius:18,border:'1.5px solid #e8ecf8',overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,0.07)'}}>

        {/* Toolbar — search + filters only */}
        <div style={{padding:'14px 22px',borderBottom:'1.5px solid #f0f4ff',background:'#fafbff',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',display:'flex'}}>{Ico.search}</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or employee ID..."
              style={{paddingLeft:34,paddingRight:14,height:38,width:280,background:'#fff',border:'1.5px solid #e0e7ff',borderRadius:10,color:'#1e293b',fontSize:13,outline:'none',fontFamily:'inherit',transition:'border-color 0.2s'}} />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={selectStyle}>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            {['All Statuses', 'Approved', 'Draft'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{marginLeft:'auto',fontSize:12,color:'#94a3b8',fontWeight:500}}>Showing {filtered.length} of {data.length}</div>
        </div>

        {/* Selection action bar */}
        {selected.size > 0 && (
          <div style={{
            padding:'10px 22px', background:'linear-gradient(135deg,#eef2ff,#e8ecff)',
            borderBottom:'1.5px solid #c7d2fe',
            display:'flex', alignItems:'center', gap:16
          }}>
            <span style={{fontSize:13,fontWeight:700,color:'#4338ca'}}>{selected.size} selected</span>
            <div style={{width:1,height:20,background:'#c7d2fe'}} />
            <button onClick={()=>notify('Recalculating...')} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',color:'#6366f1',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0'}}>
              {Ico.refresh} Recalculate
            </button>
            <button onClick={handleApprove} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',color:'#16a34a',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0'}}>
              {Ico.check} Approve
            </button>
            <button onClick={()=>notify('Marked as ready to transfer')} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',color:'#0ea5e9',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0'}}>
              {Ico.wallet} Ready to Transfer
            </button>
          </div>
        )}

        {/* Column headers */}
        <div style={{display:'grid',gridTemplateColumns:'36px 1fr 220px 140px 160px 120px 36px',padding:'10px 22px',background:'#fafbff',borderBottom:'1px solid #f0f4ff',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleSelectAll}
              style={{width:16,height:16,accentColor:'#6366f1',cursor:'pointer'}} />
          </div>
          {['Employee','Pay Elements','Attendance','Net Pay','Status',''].map(h=>(
            <div key={h || '_expand'} style={{fontSize:9,fontWeight:700,color:'#94a3b8',letterSpacing:1.5,textTransform:'uppercase'}}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <div style={{padding:'48px 22px',textAlign:'center',color:'#94a3b8',fontSize:13}}>
            No employees match the current filters
          </div>
        )}
        {filtered.map((emp, i) => (
          <div key={emp.id} style={{borderTop: i>0 ? '1px solid #f0f4ff' : 'none'}}>
            <div className="wp-row" onClick={()=>toggle(emp.id)} style={{
              display:'grid', gridTemplateColumns:'36px 1fr 220px 140px 160px 120px 36px',
              padding:'15px 22px', alignItems:'center', cursor:'pointer',
              background: selected.has(emp.id) ? '#f5f3ff' : expanded.has(emp.id) ? '#f8faff' : '#fff'
            }}>
              {/* Checkbox */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
                <input type="checkbox" checked={selected.has(emp.id)}
                  onChange={()=>toggleSelect(emp.id)}
                  style={{width:16,height:16,accentColor:'#6366f1',cursor:'pointer'}} />
              </div>

              {/* Employee */}
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:11,background:`${emp.hue}12`,border:`1.5px solid ${emp.hue}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:emp.hue,flexShrink:0}}>
                  {emp.initials}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>{emp.name}</div>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{emp.code} · {emp.role}</div>
                </div>
              </div>

              {/* Pay elements */}
              <div style={{display:'flex',gap:18,alignItems:'center'}}>
                <div>
                  <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,fontWeight:700}}>Gross</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginTop:3}}>{rupee(emp.gross)}</div>
                </div>
                <div style={{width:1,height:28,background:'#e0e7ff'}} />
                <div>
                  <div style={{fontSize:9,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,fontWeight:700}}>Ded.</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#ef4444',marginTop:3}}>{rupee(emp.ded)}</div>
                </div>
              </div>

              {/* Attendance */}
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:15,fontWeight:800,color:'#1e293b'}}>{emp.workDays - emp.lop}</span>
                <span style={{fontSize:11,color:'#94a3b8'}}>/ {emp.workDays}</span>
                {emp.lop > 0 && (
                  <span style={{background:'#fef2f2',color:'#ef4444',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,border:'1px solid #fecaca'}}>{emp.lop} LOP</span>
                )}
              </div>

              {/* Net pay */}
              <div>
                <div style={{fontSize:16,fontWeight:800,background:'linear-gradient(135deg,#4338ca,#6366f1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'-0.3px'}}>
                  {rupee(emp.net)}
                </div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:2,fontWeight:500}}>Final Amount</div>
              </div>

              {/* Status */}
              <div>
                <span style={{
                  padding:'5px 13px', borderRadius:20, fontSize:11, fontWeight:700,
                  background: emp.status==='Approved' ? '#f0fdf4' : '#f0f0ff',
                  color:      emp.status==='Approved' ? '#16a34a' : '#6366f1',
                  border:     `1.5px solid ${emp.status==='Approved' ? '#bbf7d0' : '#c7d2fe'}`,
                }}>
                  {emp.status==='Approved' && '✓ '}{emp.status}
                </span>
              </div>

              {/* Expand icon */}
              <div style={{
                width:28, height:28, borderRadius:8,
                background: expanded.has(emp.id) ? '#e0e7ff' : '#f8fafc',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#6366f1', transition:'all 0.2s'
              }}>
                {Ico.chevron(expanded.has(emp.id))}
              </div>
            </div>

            {/* Expanded panel */}
            {expanded.has(emp.id) && (
              <DetailPanel emp={emp} onUpdate={onUpdate} onAdd={onAdd} onRemove={onRemove} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}