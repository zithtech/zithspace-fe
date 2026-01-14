"use client";

import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Drawer,
  Modal,
  message,
  
} from "antd";
import {
  CloseOutlined,
  EyeOutlined,
  DownloadOutlined, 
  ClockCircleOutlined,
  DollarOutlined, 
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useReimbursements } from "@/hooks/useReimbursements";
import { Reimbursement } from "@/types/reimbursement";

export default function EmployeeTab() {
  /* ===== DATA FROM SERVICE VIA HOOK ===== */
  const { data, loading } = useReimbursements();

  /* ===== DRAWER STATE ===== */
  const [open, setOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const [previewFileName, setPreviewFileName] = useState('');



  const employeeData = data.filter(
    r => r.employee.name === "Current User"
  );
  const getFileName = (file: any): string => {
    if (typeof file === 'string') {
      return file.split('/').pop()?.split('\\').pop() || file;
    }
    return file?.name || file || 'file';
  };

  const normalizeFiles = (item: any): string[] => {
    if (Array.isArray(item.attachments)) return item.attachments;
    if (Array.isArray(item.files)) return item.files;
    if (typeof item.attachments === "string") return [item.attachments];
    if (typeof item.files === "string") return [item.files];
    if (item.file) return [item.file];
    return [];
  };

const handlePreview = (file: any) => {
  const fileName = getFileName(file);
  const url = `/files/${fileName}`;

  setPreviewFileName(fileName);
  setPreviewUrl(url);

  if (window.innerWidth < 768) {
    window.open(url, "_blank");
  } else {
    setPreviewModal(true);
  }
};


const handleDownload = async (fileName: string) => {
  setLoadingFile(true);
  try {
    const downloadUrl = `/files/${fileName}`;

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error("Failed");

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);

    message.success("Download started");
  } catch {
    message.error("Download failed");
  } finally {
    setLoadingFile(false);
  }
};


  /* ===== TABLE COLUMNS (UNCHANGED) ===== */
  const columns = [
    {
      title: "Request ID",
      render: (_: any, r: Reimbursement, index: number) => {
        const year = new Date().getFullYear();
        const seq = String(index + 1).padStart(4, "0");
        return `REQ-${year}-${seq}`;
      },
    },

    { title: "Category", dataIndex: "category" },

    {
      title: "Amount",
      render: (_: any, r: Reimbursement) =>
        `₹${r.amount.toLocaleString("en-IN")}`,
    },


    {
      title: "Submitted",
      render: (_: any, r: Reimbursement) =>
        r.status === "DRAFT" ? "—" : r.submitted,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: Reimbursement["status"]) => (
        <Tag
          color={
            status === "DRAFT"
              ? "default"
              : status === "PENDING_APPROVAL"
                ? "orange"
                : status === "APPROVED"
                  ? "green"
                  : status === "PAID"
                    ? "blue"
                    : "red"
          }
        >
          {status}
        </Tag>
      ),
    },

    {
      title: "Actions",
      render: (_: any, record: Reimbursement) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRow(record);
            setOpen(true);
          }}
        >
        </Button>
      ),
    },
  ];


  {/* ================= style ================= */ }
  const summaryCardClass = `
  h-24
  rounded-2xl
  border border-gray-200
  bg-white
  p-4
  shadow-[0_6px_20px_rgba(0,0,0,0.08)]
  flex items-center
`;


  return (
    <div className="space-y-6">

      {/* ================= SUMMARY CARDS (UNCHANGED) ================= */}


      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Total Submitted</span>}
              value={employeeData.length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Pending Approval</span>}
              value={employeeData.filter(d => d.status === "PENDING_APPROVAL").length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Approved</span>}
              value={employeeData.filter(d => d.status === "APPROVED").length}
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <Statistic
              title={<span className="text-xs text-gray-500">Total Paid</span>}
              value={employeeData
                .filter(d => d.status === "PAID")
                .reduce((s, i) => s + i.amount, 0)}
              prefix="₹"
              valueStyle={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#111827",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* ================= TABLE ================= */}
      <Card className="rounded-2xl shadow-lg">
        <Table
          columns={columns}
          dataSource={employeeData}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>
  <Modal
  open={previewModal}
  onCancel={() => setPreviewModal(false)}
  footer={null}
  width={900}
  bodyStyle={{ padding: 0, height: '80vh' }}
  styles={{ 
    body: { 
      padding: 0, 
      height: '80vh',
      maxHeight: '90vh' 
    } 
  }}
>
  <div className="p-4 border-b flex items-center justify-between bg-gray-50">
    <div className="font-semibold text-lg text-gray-900 truncate max-w-[400px]">
      Preview: {getFileName(previewUrl)}
    </div>
    <div className="flex gap-2">
      <Button 
        icon={<DownloadOutlined />} 
        onClick={() => handleDownload(previewFileName)}
        loading={loadingFile}
      >
        Download
      </Button>
      <Button onClick={() => setPreviewModal(false)}>Close</Button>
    </div>
  </div>
  <iframe 
    src={`${previewUrl}#toolbar=0&navpanes=0`} 
    className="w-full h-[calc(100%-70px)] border-0 rounded-b-lg"
    onError={() => message.error('Preview failed - use download')}
    loading="lazy"
  />
</Modal>

  

      {/* ================= DRAWER ================= */}
         <Drawer
     title={
       <div className="pb-4">
         <div className="flex items-center justify-between">
           <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
             #{selectedRow?.requestId || "REQ-0000"}
           </div>
           <div className="flex items-center gap-3">
             <Tag
               color={
                 selectedRow?.status === "APPROVED"
                   ? "green"
                   : selectedRow?.status === "REJECTED"
                   ? "red"
                   : "orange"
               }
               className="rounded-full px-4 py-1 text-xs font-medium shadow-sm border-0 backdrop-blur-sm"
             >
               {selectedRow?.status || "PENDING"}
             </Tag>
             <CloseOutlined
               className="cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-110 text-base transition-all duration-200"
               onClick={() => setOpen(false)}
             />
           </div>
         </div>
       </div>
     }
     placement="right"
     width={450}
     closeIcon={null}
     open={open}
     styles={{ 
       body: { padding: 12 },
       header: { padding: '16px 20px 0' }
     }}
   >
     {selectedRow && (
       <div className="text-sm text-gray-700 h-full flex flex-col">
         {/* COMPACT SUMMARY - FIXED HEIGHT */}
         <div className="flex-shrink-0">
           <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">Request Summary</div>
           <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-100 space-y-2 shadow-lg">
             {[
               ["Category", selectedRow.category],
               ["Total Amount", `₹${selectedRow.amount}`],
               ["Employee", selectedRow.employee.name],
               ["Department", selectedRow.employee.department],
               ["Submitted", selectedRow.submitted],
               ["Created", selectedRow.created],
             ].map(([label, value], i) => (
               <div key={i} className="flex justify-between text-xs py-1 hover:bg-slate-100 hover:rounded-lg px-2 transition-colors">
                 <span className="text-gray-500 font-medium">{label}</span>
                 <span className="font-bold text-gray-900">{value}</span>
               </div>
             ))}
           </div>
         </div>
   
         {/* EXPENSE ITEMS - FLEXIBLE HEIGHT */}
         <div className="flex-1 min-h-0 mt-3">
           <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight flex justify-between items-center">
             <span>Expense Items ({selectedRow.expenseItems?.length || 0})</span>
           </div>
           <div className="space-y-2 pr-2">
             {selectedRow.expenseItems?.map((item, i) => {
               const files = normalizeFiles(item);
               const showFiles = files.slice(0, 4);
               const hasMoreFiles = files.length > 4;
   
               return (
                 <div key={i} className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                   <div className="flex-1 min-w-0">
                     <div className="font-bold text-sm group-hover:text-blue-700 transition-colors truncate">{item.title}</div>
                     <div className="text-xs text-gray-500 mt-0.5">{item.date} • ₹{item.amount}</div>
                   </div>
                   
                   {files.length > 0 && (
                     <div className="space-y-1.5 min-w-[180px]">
                       {showFiles.map((file, idx) => (
                         <div
                           key={idx}
                           className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 border border-slate-100 hover:border-blue-100 h-8"
                         >
                           <span className="truncate font-medium text-gray-800 max-w-[90px]">
                             {file}
                           </span>
                           <div className="flex gap-0.5">
                             <Button
                               size="small"
                               type="text"
                               className="!p-0 w-6 h-6 text-gray-600 hover:text-blue-600 hover:scale-110 flex items-center justify-center"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handlePreview(file);
                               }}
                               loading={loadingFile}
                             >
                               <EyeOutlined />
                             </Button>
                             <Button
                               size="small"
                               type="text"
                               className="!p-0 w-6 h-6 text-gray-600 hover:text-green-600 hover:scale-110 flex items-center justify-center"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDownload(file);
                               }}
                             >
                               <DownloadOutlined />
                             </Button>
                           </div>
                         </div>
                       ))}
                       {hasMoreFiles && (
                         <div className="pt-1">
                           <Button
                             size="small"
                             type="link"
                             className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
                             onClick={(e) => {
                               e.stopPropagation();
                             }}
                           >
                             +{files.length - 4} more files
                           </Button>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         </div>
   
         {/* ACTIVITY LOG - FIXED BOTTOM */}
         <div className="flex-shrink-0 border-t border-slate-200 pt-4 mt-4">
           <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">Activity Log</div>
           <div className="space-y-3 max-h-32 overflow-hidden">
             {selectedRow.activityLog.slice(-4).map((log, i) => (  // Show only last 4
               <div key={i} className="relative pl-6 border-l-2 border-indigo-200 group hover:border-indigo-400 transition-colors pr-2">
                 <span className="absolute -left-2.5 top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md group-hover:scale-110 transition-all" />
                 <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors line-clamp-1">{log.action}</div>
                 {log.note && <div className="text-xs text-gray-600 mt-0.5 pl-1 italic line-clamp-1">{log.note}</div>}
                 <div className="text-xs text-gray-500 mt-0.5 font-mono">{log.date}</div>
               </div>
             ))}
           </div>
         </div>
       </div>
     )}
   </Drawer>









    </div>
  );
}
