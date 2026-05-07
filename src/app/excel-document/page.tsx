'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Layout,
  Typography,
  Space,
  Button,
  message,
  List,
  Modal,
  Input,
  Breadcrumb,
  Empty,
  Skeleton,
  Card,
  Popconfirm,
  Tooltip,
  theme
} from 'antd';

import {
  FileExcelOutlined,
  PlusOutlined,
  SaveOutlined,
  HomeOutlined,
  ProjectOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  AppstoreOutlined,
  FolderOutlined,
  StarOutlined,
  BarsOutlined
} from '@ant-design/icons';

import MainLayout from '@/components/layout/MainLayout';
import { api } from '@/lib/axios';
import * as XLSX from 'xlsx';

// FortuneSheet depends on browser APIs, so we must load it dynamically with no SSR

const Workbook = dynamic(
  () => import('@fortune-sheet/react').then((mod) => mod.Workbook),
  { ssr: false }
);

import '@fortune-sheet/react/dist/index.css';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function ExcelDocumentPage() {
  const { token } = theme.useToken();
  const isDark = token.colorBgContainer !== '#ffffff' && token.colorBgContainer !== '#fff' && token.colorBgContainer !== 'rgb(255, 255, 255)';

  const [data, setData] = useState<any[]>([


    {
      name: "Sheet1",
      celldata: [{ r: 0, c: 0, v: { v: "Welcome to VDrive", ct: { fa: "General", t: "g" }, m: "Welcome to VDrive", bg: "#ffffff", cl: "#000000" } }],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [importCount, setImportCount] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();


  // Fetch all spreadsheets for this tenant
  const fetchSpreadsheets = async () => {
    try {
      setLoading(true);
      // Fetch flat list of all Excel workbooks
      const res = await api.get('/api/excel/content');
      if (res && res.files) {
        setSpreadsheets(res.files);
      }
    } catch (err) {
      console.error('Failed to fetch spreadsheets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheets();
    api.post('/api/excel/init').catch(console.error);
  }, []);

  const handleCreateNew = async () => {
    if (!newName) return;
    try {
      setLoading(true);
      // Create a fresh workbook with one sheet
      const initialData = [{ name: "Sheet 1", celldata: [] }];

      const payload = {
        name: newName,
        content: `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(initialData))))}`,
      };

      const res = await api.post('/api/excel/save', payload);
      messageApi.success(`${newName} created!`);
      setIsModalVisible(false);
      setNewName('');
      fetchSpreadsheets();

      // Load the newly created sheet
      if (res) {
        setSelectedFile(res);
        setData(initialData);
      }
    } catch (err) {
      messageApi.error('Failed to create spreadsheet');
    } finally {
      setLoading(false);
    }
  };



  const workbookRef = React.useRef<any>(null);
  const dataRef = React.useRef<any[]>(data);
  const lastImportRef = React.useRef<any[] | null>(null);

  // Sync dataRef with state data
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const normalizeData = (sheets: any[]) => {
    if (!sheets || !Array.isArray(sheets)) return [];

    return sheets.map(sheet => {
      // 1. If we already have celldata, we're off to a good start
      let celldata = Array.isArray(sheet.celldata) ? [...sheet.celldata] : [];

      // 2. AGGRESSIVE DEEP SCAN: Search in sheet.data (Dense Grid)
      // We check for sheet.data whether it's an Array or an Object (some engines use numeric keys)
      if (sheet.data && typeof sheet.data === 'object') {
        const denseData = sheet.data;
        const recoveredMap: Record<string, boolean> = {};
        celldata.forEach(cell => { recoveredMap[`${cell.r}-${cell.c}`] = true; });

        // Iterate over rows (works for both Array and Object with numeric keys)
        Object.keys(denseData).forEach(rKey => {
          const r = parseInt(rKey);
          if (isNaN(r)) return;
          const row = denseData[rKey];
          if (!row || typeof row !== 'object') return;

          Object.keys(row).forEach(cKey => {
            const c = parseInt(cKey);
            if (isNaN(c)) return;
            const cell = row[cKey];

            if (cell && typeof cell === 'object') {
              const hasValue = cell.v !== undefined && cell.v !== null && cell.v !== '';
              const hasFormula = !!cell.f;
              const hasFormat = !!cell.m;
              const hasStyle = !!cell.bg || !!cell.bl || !!cell.it;

              if ((hasValue || hasFormula || hasFormat || hasStyle) && !recoveredMap[`${r}-${c}`]) {
                celldata.push({ r, c, v: cell });
                recoveredMap[`${r}-${c}`] = true;
              }
            }
          });
        });
      }

      return {
        ...sheet,
        celldata: celldata,
        data: undefined,
        status: sheet.status !== undefined ? sheet.status : (sheets.indexOf(sheet) === 0 ? 1 : 0)
      };
    });
  };

  const handleSave = async () => {
    if (!selectedFile && !newName) {
      setIsModalVisible(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Capture snapshots: 1. Live Engine, 2. Last Import, 3. Manual Changes
      let liveData = [];
      if (workbookRef.current && typeof workbookRef.current.getData === 'function') {
        liveData = workbookRef.current.getData();
      }

      const getCellCount = (sheets: any[]) => {
        if (!sheets || !Array.isArray(sheets)) return 0;
        return sheets.reduce((acc, s) => acc + (s.celldata?.length || 0), 0);
      };

      const normalizedLive = normalizeData(liveData);
      const normalizedImport = normalizeData(lastImportRef.current || []);
      const normalizedLocal = normalizeData(dataRef.current || []);

      const liveCount = getCellCount(normalizedLive);
      const importCountVal = getCellCount(normalizedImport);
      const localCount = getCellCount(normalizedLocal);

      // 2. SELECTION PRIORITY: 
      //    A. If Live Engine has data, use it (user is editing).
      //    B. If Live is empty but we JUST imported, use the Import Snapshot.
      //    C. Otherwise fallback to local memory.
      let finalSheets = normalizedLive;
      let finalSource = 'Live Engine';

      if (liveCount === 0 && importCountVal > 0) {
        finalSheets = normalizedImport;
        finalSource = 'Frozen Import';
      } else if (liveCount === 0 && localCount > 0) {
        finalSheets = normalizedLocal;
        finalSource = 'Local Memory';
      }

      const jsonStr = JSON.stringify(finalSheets);
      const totalCells = getCellCount(finalSheets);

      if (totalCells === 0 && jsonStr.length < 500) {
        messageApi.warning('The workbook appears to be empty. Please enter data before saving.');
        setLoading(false);
        return;
      }

      console.log(`[ExcelSave] Syncing ${jsonStr.length} bytes (${totalCells} cells) from ${finalSource}`);



      const payload = {
        id: selectedFile?.id,
        name: selectedFile?.name || newName,
        content: `data:application/json;base64,${btoa(unescape(encodeURIComponent(jsonStr)))}`,
      };

      const res = await api.post('/api/excel/save', payload);
      if (res) {
        // SYNC POINT: Update memory with EXACTLY what we just sent to the cloud
        setData(finalSheets);
        dataRef.current = finalSheets;
        lastImportRef.current = null; // Clear fortress after verified success

        setSelectedFile(res);
        messageApi.success('Spreadsheet synced to cloud!');
        fetchSpreadsheets(); // Refresh sidebar
      }
    } catch (err) {
      messageApi.error('Failed to save workbook');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await api.delete(`/api/excel/${id}`);
      messageApi.success('Document deleted');
      if (selectedFile?.id === id) {
        setSelectedFile(null);
        setData([{ name: "Sheet 1", celldata: [] }]);
      }
      fetchSpreadsheets();
    } catch (err) {
      messageApi.error('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const newSheets = wb.SheetNames.map(name => {
          const ws = wb.Sheets[name];
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

          const celldata: any[] = [];
          aoa.forEach((row, r) => {
            row.forEach((cell, c) => {
              if (cell !== null && cell !== undefined && cell !== '') {
                celldata.push({ r, c, v: { v: cell, m: String(cell) } });
              }
            });
          });

          return {
            name,
            celldata,
            status: 0
          };
        });

        if (newSheets.length > 0) {
          setData(newSheets);
          dataRef.current = newSheets;
          lastImportRef.current = newSheets; // LOCK the fortress
          setImportCount(prev => prev + 1);
          messageApi.success(`Imported ${newSheets.length} sheets from ${file.name}`);
        }


      } catch (err) {
        console.error('Import failed:', err);
        messageApi.error('Failed to parse Excel file');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      data.forEach(sheet => {
        // Convert celldata to 2D array for XLSX
        const rows: any[][] = [];
        if (sheet.celldata) {
          sheet.celldata.forEach((cell: any) => {
            if (!rows[cell.r]) rows[cell.r] = [];
            rows[cell.r][cell.c] = cell.v ? cell.v.v : '';
          });
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      XLSX.writeFile(wb, `${selectedFile?.name || 'VDrive_Export'}.xlsx`);
      messageApi.success('Excel file exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      messageApi.error('Failed to export Excel file');
    }
  };

  const openSpreadsheet = async (file: any) => {
    try {
      setLoading(true);
      // messageApi.loading(`Loading ${file.name}...`, 0);

      // Clear current data with a placeholder to prevent crash in Workbook component
      setData([{ name: "Loading...", celldata: [] }]);
      setSelectedFile(null);

      const res = await api.get(`/api/excel/file-content?fileUrl=${encodeURIComponent(file.file_url)}`);

      if (!res || !Array.isArray(res) || res.length === 0) {
        throw new Error('Invalid data format received from cloud');
      }

      // RECOVER DATA: Use the normalizer to bridge dense vs sparse mismatch
      const recovered = normalizeData(res);

      console.log(`[ExcelLoad] Received file: ${file.name}`);
      recovered.forEach((sheet: any, idx: number) => {
        console.log(`[ExcelLoad] Sheet ${idx} (${sheet.name}): ${sheet.celldata?.length || 0} sparse cells ready`);
      });

      setData(recovered);
      setSelectedFile(file);
      dataRef.current = recovered; // Sync ref immediately

      messageApi.destroy();
      messageApi.success(`${file.name} loaded successfully`);
    } catch (err) {
      console.error('Failed to open spreadsheet:', err);
      messageApi.destroy();
      messageApi.error('Failed to open spreadsheet');
    } finally {
      setLoading(false);
    }
  };


  return (
    <MainLayout>
      {contextHolder}
      <Layout style={{
        height: 'calc(100vh - 64px)',
        background: token.colorBgLayout,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden' // Prevents overall page scrollbar jumps
      }}>
        {/* Sidebar Space */}
        <Sider width={280} theme={isDark ? "dark" : "light"} style={{
          borderRight: `1px solid ${isDark ? '#1e293b' : token.colorBorderSecondary}`,
          overflowY: 'auto',
          background: isDark ? '#0f111a' : token.colorBgContainer,
          flexShrink: 0
        }}>

          <div style={{ padding: '24px 16px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: '#f97316',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
              }}>
                <FileExcelOutlined style={{ color: '#fff', fontSize: '20px' }} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <Text strong style={{ color: isDark ? '#fff' : token.colorText, display: 'block', fontSize: '15px' }}>Excel Hub</Text>
                <Text style={{ color: isDark ? '#6b7280' : token.colorTextSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>DOCUMENT WORKSPACE</Text>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <Text style={{ color: isDark ? '#4b5563' : token.colorTextSecondary, fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em' }}>WORKSPACE</Text>
                <PlusOutlined style={{ color: isDark ? '#6b7280' : token.colorTextSecondary, fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsModalVisible(true)} />
              </div>
              
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: !selectedFile ? (isDark ? '#1e293b' : token.colorBgTextActive) : 'transparent',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
                className="sidebar-item-hover"
                onClick={() => setSelectedFile(null)}
              >
                <Space>
                  <AppstoreOutlined style={{ fontSize: '16px', color: !selectedFile ? (isDark ? '#fff' : token.colorPrimary) : (isDark ? '#94a3b8' : token.colorTextSecondary) }} />
                  <Text style={{ color: !selectedFile ? (isDark ? '#fff' : token.colorText) : (isDark ? '#94a3b8' : token.colorTextSecondary), fontSize: '13px', fontWeight: !selectedFile ? 600 : 400 }}>All Documents</Text>
                </Space>
                <Text style={{ color: isDark ? '#6b7280' : token.colorTextSecondary, fontSize: '12px' }}>{spreadsheets.length}</Text>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', marginTop: '12px' }}>
              <Space size={8}>
                <BarsOutlined style={{ color: isDark ? '#4b5563' : token.colorTextQuaternary, fontSize: '12px' }} />
                <Text style={{ color: isDark ? '#4b5563' : token.colorTextSecondary, fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em' }}>COLLECTIONS</Text>
              </Space>
              <PlusOutlined style={{ color: isDark ? '#6b7280' : token.colorTextSecondary, fontSize: '12px', cursor: 'pointer' }} onClick={() => setIsModalVisible(true)} />
            </div>
          </div>

          {loading && spreadsheets.length === 0 && (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          )}

          {spreadsheets.length === 0 && !loading ? (
            <Empty description="No documents created" style={{ marginTop: 40 }} />
          ) : (
            <List
              dataSource={spreadsheets}
              split={false}
              renderItem={(item, index) => {
                // Map Excel/star icons and colors based on design patterns
                let icon = <FileExcelOutlined style={{ fontSize: '18px', color: '#3b82f6' }} />;
                
                const name = item.name.toLowerCase();
                if (name.includes('v1') || name.includes('test')) {
                  icon = <StarOutlined style={{ fontSize: '18px', color: '#f59e0b' }} />;
                } else if (name.includes('proposal')) {
                  icon = <FileExcelOutlined style={{ fontSize: '18px', color: '#ec4899' }} />;
                } else if (name.includes('hub')) {
                  icon = <FileExcelOutlined style={{ fontSize: '18px', color: '#10b981' }} />;
                } else if (name.includes('ticket')) {
                  icon = <FileExcelOutlined style={{ fontSize: '18px', color: '#3b82f6' }} />;
                }

                return (
                  <div
                    onClick={() => openSpreadsheet(item)}
                    style={{
                      padding: '10px 12px',
                      margin: '2px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: selectedFile?.id === item.id ? (isDark ? '#1e293b' : token.colorBgTextActive) : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    className="sidebar-item-hover"
                  >
                    <Space size={14} style={{ width: '100%' }}>
                      {icon}
                      <Text style={{ 
                        color: selectedFile?.id === item.id ? (isDark ? '#fff' : token.colorText) : (isDark ? '#94a3b8' : token.colorTextSecondary), 
                        fontSize: '14px',
                        fontWeight: selectedFile?.id === item.id ? 500 : 400,
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: isDark ? '#4b5563' : token.colorTextQuaternary, fontSize: '12px', marginLeft: 'auto' }}>
                        {Math.floor(Math.random() * 10) + 1}
                      </Text>
                    </Space>
                    
                    <div className="item-actions" style={{ 
                      display: 'flex', 
                      opacity: selectedFile?.id === item.id ? 1 : 0, 
                      gap: '4px',
                      position: 'absolute',
                      right: '8px',
                      background: isDark ? '#1e293b' : token.colorBgTextActive,
                      paddingLeft: '8px'
                    }}>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined style={{ color: isDark ? '#6b7280' : token.colorTextSecondary, fontSize: '12px' }} />} 
                        onClick={(e) => { e.stopPropagation(); openSpreadsheet(item); }}
                      />
                      <Popconfirm
                        title="Delete document"
                        onConfirm={(e: any) => handleDelete(item.id, e)}
                        onCancel={(e: any) => e.stopPropagation()}
                      >
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<DeleteOutlined style={{ color: '#ef4444', fontSize: '12px' }} />} 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </Sider>

        {/* Editor Content */}
        <Content style={{
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#141414' : token.colorBgContainer,
          color: token.colorText,
          flex: 1, // Fill remaining space
          minHeight: 0, // Prevent shrinking
          overflow: 'hidden'
        }}>

          <div style={{
            padding: '12px 24px',
            background: isDark ? '#141414' : token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Space direction="vertical" size={0}>
              <Breadcrumb
                style={{ color: isDark ? '#8c8c8c' : 'inherit' }}
                items={[
                  { title: <span style={{ color: isDark ? '#8c8c8c' : 'inherit' }}>Work</span> },
                  { title: <span style={{ color: isDark ? '#8c8c8c' : 'inherit' }}>{selectedFile ? selectedFile.name : 'New Workbook'}</span> }
                ]}
              />
              <Title level={4} style={{ margin: 0, color: token.colorText }}>
                {selectedFile ? selectedFile.name : 'Untitled'}
              </Title>
            </Space>


            <Space>
              <input
                type="file"
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
                id="excel-import-input"
                onChange={handleImport}
              />
              {/* <Button
                icon={<ProjectOutlined />}
                onClick={() => document.getElementById('excel-import-input')?.click()}
              >
                Import
              </Button> */}
              <Button icon={<CloudDownloadOutlined />} onClick={handleExport}>Export</Button>


              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                style={{ background: '#107c41', borderColor: '#107c41' }}
              >
                Save & Sync
              </Button>
            </Space>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }} className={isDark ? "dark-workbook" : ""}>
            {loading ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.7)',
                zIndex: 10
              }}>
                {/* <Space direction="vertical" align="center">
                  <Skeleton.Input active style={{ width: 200 }} />
                  <Text type="secondary">Syncing spreadsheet data...</Text>
                </Space> */}
              </div>
            ) : null}

            {data && data.length > 0 ? (
              <Workbook
                ref={workbookRef}
                key={`${selectedFile?.id || 'new'}-${importCount}`}
                data={data}
                onChange={(newData) => {

                  // IMMEDIATE update of ref for saving
                  dataRef.current = newData;

                  // Debug log to help USER see when data is "caught" by React
                  const count = newData.reduce((acc, s) => acc + (s.celldata?.length || 0), 0);
                  if (count > 0) console.log(`[ExcelHistory] Snapshot updated: ${count} cells detected.`);
                }}
              />
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Skeleton active />
                <Text type="secondary">Preparing workbook environment...</Text>
              </div>
            )}

          </div>

        </Content>
      </Layout>

      <Modal
        title="Name your Excel Document"
        open={isModalVisible}
        onOk={handleCreateNew}
        onCancel={() => {
          setIsModalVisible(false);
          setNewName('');
        }}
      >


        <Input
          placeholder="e.g. vdrive"
          autoFocus
          value={newName}

          onChange={(e) => setNewName(e.target.value)}
          prefix={<FileExcelOutlined />}
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          This document can contain multiple sheets (Sheet1, Sheet2, etc.) at the bottom.
        </Text>
      </Modal>

      <style jsx global>{`
        /* GLOBAL "ZERO-WHITE" DARK MODE OVERRIDES */
        ${isDark ? `
          body { background-color: #000 !important; }
          
          /* Toolbar and Sidebar (Stay Dark, No Inversion) */
          .fortune-toolbar, .fortune-fx-editor, .fortune-fx-input-container { 
            background: #141414 !important; 
            border-bottom: 1px solid #333 !important; 
            color: #d9d9d9 !important;
          }
          .fortune-toolbar *, .fortune-fx-editor *, .fortune-fx-input-container * {
            border-color: #333 !important;
          }
          .fortune-toolbar-button:hover { background: #262626 !important; }
          
          .fortune-fx-icon { background: #1a1a1a !important; color: #8c8c8c !important; border-right: 1px solid #333 !important; }
          .fortune-fx-input { background: #1a1a1a !important; color: #fff !important; }

          /* THE CORE FIX: Invert the entire grid area including headers */
          /* We invert the container that holds the grid and headers */
          .fortune-sheet-container, .luckysheet-container {
            filter: invert(0.9) hue-rotate(180deg) brightness(1.1) contrast(0.9) !important;
            background: #fff !important; /* Becomes black after inversion */
          }

          /* Elements that should NOT be inverted inside the container (if any) */
          /* Usually everything in the grid should be inverted */

          /* Tabs area (at the bottom) */
          .fortune-sheet-tab-container {
            /* If it's outside the container, style it dark. If inside, let it be inverted. */
            background: #fff !important; /* Becomes dark */
            color: #000 !important; /* Becomes light */
            border-top: 1px solid #ddd !important;
          }
          
          /* Popups, Menus & Dialogs (Style them dark manually as they are often portals) */
          .fortune-context-menu, .fortune-dialog, .fortune-select-container { 
            filter: none !important; /* Don't invert these if they are already dark */
            background: #1a1a1a !important; 
            color: #ffffff !important; 
            border: 1px solid #333333 !important; 
            box-shadow: 0 8px 24px rgba(0,0,0,0.9) !important; 
          }
          .fortune-context-menu-item:hover, .fortune-select-item:hover { background: #262626 !important; }
          .fortune-dialog-title, .fortune-dialog-footer { background: #141414 !important; border-color: #333 !important; }

          /* Selection Border (make it pop after inversion) */
          .fortune-cell-main-active { border: 2px solid #fff !important; } /* Becomes dark blue/black after inversion */

          /* Scrollbars - Force them Dark */
          ::-webkit-scrollbar { width: 10px; height: 10px; }
          ::-webkit-scrollbar-track { background: #141414; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
          ::-webkit-scrollbar-thumb:hover { background: #444; }
          
        ` : ''}

        .fortune-container { height: 100% !important; width: 100% !important; border:none !important; }
        .sidebar-item-hover:hover { background: ${isDark ? '#1e293b' : token.colorBgTextHover} !important; }
        .sidebar-item-hover:hover .item-actions { opacity: 1 !important; }
      `}</style>




    </MainLayout>
  );
}
