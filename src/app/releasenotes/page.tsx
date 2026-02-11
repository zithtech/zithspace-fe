"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Button,
  Divider,
  Layout,
  Select,
  Input,
  Radio,
  DatePicker,
  Dropdown,
  Card,
} from "antd";
const { Title, Paragraph } = Typography;
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
const { Sider, Content } = Layout;
import { useEffect, useState } from "react";
export default function ReleaseNotesPage() {
  const router = useRouter();
  const [latestRelease, setLatestRelease] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("latestReleaseNote");
    if (stored) setLatestRelease(JSON.parse(stored));
  }, []);

  const versionsByMonth = [
    {
      month: "JANUARY 2025",
      versions: [
        { version: "v2.3.0", status: "Draft" },
        { version: "v2.2.1", status: "Released", active: true },
        { version: "v2.2.0", status: "Released" },
      ],
    },
    {
      month: "DECEMBER 2024",
      versions: [
        { version: "v2.1.0", status: "Released" },
        { version: "v2.0.2", status: "Rolled Back" },
        { version: "v2.0.1", status: "Released" },
      ],
    },
    {
      month: "NOVEMBER 2024",
      versions: [
        { version: "v1.9.0", status: "Released" },
        { version: "v1.8.5", status: "Released" },
      ],
    },
  ];

  return (
    <MainLayout>
      <div>
        <div style={{ margin: 20, marginTop: 10 }}>
          <Space
            align="center"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {/* Left side */}
            <Space align="center">
              <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Release Notes
              </Title>
            </Space>

            {/* Right side button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push("/releasenotes/create")}
            >
              Create Release Notes
            </Button>
          </Space>
        </div>
        <Divider></Divider>

        {/* 👇 INGA dhaan GRID LAYOUT START */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            height: "calc(100vh - 140px)", // header + divider height
            overflow: "hidden",
          }}
        >
          <aside
            style={{
              padding: 16,
              borderRight: "1px solid #e5e7eb",
              height: "100%", // 🔥 required
              overflowY: "auto", // left scroll only
            }}
          >
            <Select
              placeholder="Select Product"
              style={{ width: "100%" }}
              options={[
                { label: "Web App", value: "web" },
                { label: "Mobile App", value: "mobile" },
              ]}
            />

            <Divider style={{ margin: "12px 0" }} />

            <Input.Search placeholder="Search versions..." />

            <Divider style={{ margin: "12px 0" }} />

            {versionsByMonth.map((group) => (
              <div key={group.month} style={{ marginBottom: 24 }}>
                <Typography.Text type="secondary">
                  {group.month}
                </Typography.Text>

                <div style={{ marginTop: 8 }}>
                  {group.versions.map((v) => (
                    <div
                      key={v.version}
                      className={`version-item ${v.active ? "active" : ""}`}
                    >
                      {v.version} · {v.status}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <main
            style={{
              padding: 0,
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* HEADER ROW */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: "#f5f5f5",
                padding: "16px 24px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* LEFT : TITLE */}
                <Title level={4} style={{ margin: 0 }}>
                  {latestRelease ? latestRelease.title : "No Release Selected"}
                </Title>

                {/* RIGHT : ACTIONS */}
                <Space>
                  {/* <Button icon={<EditOutlined />}>Edit</Button> */}
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      localStorage.setItem(
                        "editReleaseNote",
                        JSON.stringify(latestRelease),
                      );
                      router.push("/releasenotes/create");
                    }}
                  >
                    Edit
                  </Button>

                  <Button icon={<ShareAltOutlined />}>Share</Button>
                  <Button icon={<DownloadOutlined />}>Export</Button>

                  <Dropdown
                    trigger={["click"]}
                    menu={{
                      items: [
                        { key: "duplicate", label: "Duplicate release" },
                        { key: "archive", label: "Archive release" },
                        {
                          key: "delete",
                          label: (
                            <span style={{ color: "#ff4d4f" }}>
                              Delete release
                            </span>
                          ),
                        },
                      ],
                    }}
                  >
                    <Button icon={<MoreOutlined />} type="text" />
                  </Dropdown>
                </Space>
              </div>

              <Divider style={{ marginTop: 12 }} />
            </div>

            {/* SCROLLABLE CONTENT */}
            <div
              style={{
                padding: "0 24px 24px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {latestRelease ? (
                <>
                  <div className="card">
                    <Title level={5}>Release Summary</Title>
                    <Card>{latestRelease.summary}</Card>
                  </div>

                  <div className="card">
                    <Title level={5}>Key Insights</Title>
                    <Paragraph>{latestRelease.keyInsights}</Paragraph>
                  </div>

                  <div className="card">
                    <Title level={5}>New Features</Title>
                    <Paragraph>{latestRelease.newFeatures}</Paragraph>
                  </div>

                  <div className="card">
                    <Title level={5}>Improvements</Title>
                    <Paragraph>{latestRelease.improvements}</Paragraph>
                  </div>

                  <div className="card">
                    <Title level={5}>Bug Fixes</Title>
                    <Paragraph>{latestRelease.bugFixes}</Paragraph>
                  </div>

                  <div className="card">
                    <Title level={5}>Breaking Changes</Title>
                    <Paragraph>{latestRelease.breakingChanges}</Paragraph>
                  </div>
                </>
              ) : (
                <p>No release selected.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}


// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Space,
//   Typography,
//   Button,
//   Divider,
//   Layout,
//   Select,
//   Input,
//   Card,
// } from "antd";
// const { Title, Paragraph } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import DocumentEditor from "@/components/common/DocumentEditor";
// import { useCreateBlockNote } from "@blocknote/react";

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [latestRelease, setLatestRelease] = useState<any>(null);
//   const [releaseHistory, setReleaseHistory] = useState<any[]>([]);
  
//   // Initialize editors for viewing
//   const summaryEditor = useCreateBlockNote();
//   const keyInsightsEditor = useCreateBlockNote();
//   const newFeaturesEditor = useCreateBlockNote();
//   const improvementsEditor = useCreateBlockNote();
//   const bugFixesEditor = useCreateBlockNote();
//   const breakingChangesEditor = useCreateBlockNote();
//   const apiChangesEditor = useCreateBlockNote();
//   const databaseChangesEditor = useCreateBlockNote();
//   const knownIssuesEditor = useCreateBlockNote();

//   useEffect(() => {
//     // Load latest release from localStorage
//     const stored = localStorage.getItem("latestReleaseNote");
//     if (stored) {
//       const parsedData = JSON.parse(stored);
//       setLatestRelease(parsedData);
      
//       // Load content into editors for display
//       setTimeout(() => {
//         if (parsedData.summaryBlocks) {
//           summaryEditor.replaceBlocks(summaryEditor.document, parsedData.summaryBlocks);
//         }
//         if (parsedData.keyInsightsBlocks) {
//           keyInsightsEditor.replaceBlocks(keyInsightsEditor.document, parsedData.keyInsightsBlocks);
//         }
//         // ... similarly for other fields
//       }, 100);
//     }
    
//     // Load release history
//     const history = localStorage.getItem("releaseHistory");
//     if (history) {
//       setReleaseHistory(JSON.parse(history));
//     }
//   }, []);

//   const versionsByMonth = [
//     {
//       month: "JANUARY 2025",
//       versions: [
//         { version: "v2.3.0", status: "Draft" },
//         { version: "v2.2.1", status: "Released", active: true },
//         { version: "v2.2.0", status: "Released" },
//       ],
//     },
//     {
//       month: "DECEMBER 2024",
//       versions: [
//         { version: "v2.1.0", status: "Released" },
//         { version: "v2.0.2", status: "Rolled Back" },
//         { version: "v2.0.1", status: "Released" },
//       ],
//     },
//   ];

//   const handleEdit = () => {
//     if (latestRelease) {
//       localStorage.setItem("editReleaseNote", JSON.stringify(latestRelease));
//       router.push("/releasenotes/create");
//     }
//   };

//   return (
//     <MainLayout>
//       <div>
//         <div style={{ margin: 20, marginTop: 10 }}>
//           <Space
//             align="center"
//             style={{
//               width: "100%",
//               display: "flex",
//               justifyContent: "space-between",
//             }}
//           >
//             <Space align="center">
//               <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Release Notes
//               </Title>
//             </Space>

//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => router.push("/releasenotes/create")}
//             >
//               Create Release Notes
//             </Button>
//           </Space>
//         </div>
//         <Divider></Divider>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "300px 1fr",
//             height: "calc(100vh - 140px)",
//             overflow: "hidden",
//           }}
//         >
//           {/* Left Sidebar */}
//           <aside
//             style={{
//               padding: 16,
//               borderRight: "1px solid #e5e7eb",
//               height: "100%",
//               overflowY: "auto",
//             }}
//           >
//             <Select
//               placeholder="Select Product"
//               style={{ width: "100%" }}
//               options={[
//                 { label: "Web App", value: "web" },
//                 { label: "Mobile App", value: "mobile" },
//               ]}
//             />

//             <Divider style={{ margin: "12px 0" }} />

//             <Input.Search placeholder="Search versions..." />

//             <Divider style={{ margin: "12px 0" }} />

//             {/* Display release history from localStorage */}
//             {releaseHistory.length > 0 ? (
//               <div style={{ marginBottom: 24 }}>
//                 <Typography.Text type="secondary" strong>
//                   RECENT RELEASES
//                 </Typography.Text>
//                 <div style={{ marginTop: 8 }}>
//                   {releaseHistory.map((release, index) => (
//                     <div
//                       key={index}
//                       className={`version-item ${latestRelease?.version === release.version ? "active" : ""}`}
//                       onClick={() => setLatestRelease(release)}
//                       style={{
//                         padding: "8px 12px",
//                         marginBottom: 4,
//                         borderRadius: 4,
//                         cursor: "pointer",
//                         backgroundColor: latestRelease?.version === release.version ? "#e6f7ff" : "transparent",
//                         border: latestRelease?.version === release.version ? "1px solid #91d5ff" : "1px solid transparent",
//                       }}
//                     >
//                       <div style={{ fontWeight: 500 }}>{release.version}</div>
//                       <div style={{ fontSize: 12, color: "#666" }}>{release.title}</div>
//                       <div style={{ fontSize: 11, color: "#999" }}>
//                         {release.releaseDate} · {release.environment}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               // Fallback to hardcoded data if no localStorage data
//               versionsByMonth.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 24 }}>
//                   <Typography.Text type="secondary">
//                     {group.month}
//                   </Typography.Text>
//                   <div style={{ marginTop: 8 }}>
//                     {group.versions.map((v) => (
//                       <div
//                         key={v.version}
//                         className={`version-item ${v.active ? "active" : ""}`}
//                       >
//                         {v.version} · {v.status}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </aside>

//           {/* Main Content */}
//           <main
//             style={{
//               padding: 0,
//               height: "100%",
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             {/* Header */}
//             <div
//               style={{
//                 position: "sticky",
//                 top: 0,
//                 zIndex: 2,
//                 background: "#f5f5f5",
//                 padding: "16px 24px 0",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   gap: 12,
//                 }}
//               >
//                 <Title level={4} style={{ margin: 0 }}>
//                   {latestRelease ? latestRelease.title : "No Release Selected"}
//                 </Title>

//                 <Space>
//                   {latestRelease && (
//                     <>
//                       <Button icon={<EditOutlined />} onClick={handleEdit}>
//                         Edit
//                       </Button>
//                       <Button icon={<ShareAltOutlined />}>Share</Button>
//                       <Button icon={<DownloadOutlined />}>Export</Button>
//                       <Button icon={<MoreOutlined />} type="text" />
//                     </>
//                   )}
//                 </Space>
//               </div>

//               {latestRelease && (
//                 <div style={{ marginTop: 8, color: "#666" }}>
//                   <Space>
//                     <span>Version: {latestRelease.version}</span>
//                     <span>•</span>
//                     <span>Released: {latestRelease.releaseDate}</span>
//                     <span>•</span>
//                     <span>Environment: {latestRelease.environment}</span>
//                     <span>•</span>
//                     <span>Project: {latestRelease.project}</span>
//                   </Space>
//                 </div>
//               )}

//               <Divider style={{ marginTop: 12 }} />
//             </div>

//             {/* Scrollable Content */}
//             <div
//               style={{
//                 padding: "0 24px 24px",
//                 overflowY: "auto",
//                 flex: 1,
//               }}
//             >
//               {latestRelease ? (
//                 <>
//                   {/* Basic Information */}
//                   <Card
//                     title="Basic Information"
//                     style={{ marginBottom: 16 }}
//                   >
//                     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//                       <div>
//                         <Typography.Text strong>Project:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.project}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Version:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.version}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Release Date:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.releaseDate}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Environment:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.environment}</Typography.Text>
//                       </div>
//                     </div>
//                   </Card>

//                   {/* Release Summary */}
//                   <Card
//                     title="Release Summary"
//                     style={{ marginBottom: 16 }}
//                   >
//                     <DocumentEditor
//                       editor={summaryEditor}
//                       viewMode="edit"
//                       initialContent={latestRelease.summaryBlocks}
//                     />
//                   </Card>

//                   {/* Key Insights */}
//                   {latestRelease.keyInsights && (
//                     <Card
//                       title="Key Insights"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <DocumentEditor
//                         editor={keyInsightsEditor}
//                         viewMode="edit"
//                         initialContent={latestRelease.keyInsightsBlocks}
//                       />
//                     </Card>
//                   )}

//                   {/* New Features */}
//                   {latestRelease.newFeatures && (
//                     <Card
//                       title="New Features"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <DocumentEditor
//                         editor={newFeaturesEditor}
//                         viewMode="edit"
//                         initialContent={latestRelease.newFeaturesBlocks}
//                       />
//                     </Card>
//                   )}

//                   {/* Improvements */}
//                   {latestRelease.improvements && (
//                     <Card
//                       title="Improvements"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <DocumentEditor
//                         editor={improvementsEditor}
//                         viewMode="edit"
//                         initialContent={latestRelease.improvementsBlocks}
//                       />
//                     </Card>
//                   )}

//                   {/* Bug Fixes */}
//                   {latestRelease.bugFixes && (
//                     <Card
//                       title="Bug Fixes"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <DocumentEditor
//                         editor={bugFixesEditor}
//                         viewMode="edit"
//                         initialContent={latestRelease.bugFixesBlocks}
//                       />
//                     </Card>
//                   )}

//                   {/* Breaking Changes */}
//                   {latestRelease.breakingChanges && (
//                     <Card
//                       title="Breaking Changes"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <DocumentEditor
//                         editor={breakingChangesEditor}
//                         viewMode="edit"
//                         initialContent={latestRelease.breakingChangesBlocks}
//                       />
//                     </Card>
//                   )}

//                   {/* Technical Issues */}
//                   {(latestRelease.apiChanges || latestRelease.databaseChanges || latestRelease.knownIssues) && (
//                     <Card
//                       title="Technical Issues"
//                       style={{ marginBottom: 16 }}
//                     >
//                       {latestRelease.apiChanges && (
//                         <>
//                           <Title level={5}>API Changes</Title>
//                           <DocumentEditor
//                             editor={apiChangesEditor}
//                             viewMode="edit"
//                             initialContent={latestRelease.apiChangesBlocks}
//                           />
//                         </>
//                       )}
                      
//                       {latestRelease.databaseChanges && (
//                         <>
//                           <Title level={5} style={{ marginTop: 16 }}>Database Changes</Title>
//                           <DocumentEditor
//                             editor={databaseChangesEditor}
//                             viewMode="edit"
//                             initialContent={latestRelease.databaseChangesBlocks}
//                           />
//                         </>
//                       )}
                      
//                       {latestRelease.knownIssues && (
//                         <>
//                           <Title level={5} style={{ marginTop: 16 }}>Known Issues</Title>
//                           <DocumentEditor
//                             editor={knownIssuesEditor}
//                             viewMode="edit"
//                             initialContent={latestRelease.knownIssuesBlocks}
//                           />
//                         </>
//                       )}
//                     </Card>
//                   )}

//                   {/* Linked Items */}
//                   <Card
//                     title="Linked Items"
//                     style={{ marginBottom: 16 }}
//                   >
//                     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//                       {latestRelease.linkedTickets && latestRelease.linkedTickets.length > 0 && (
//                         <div>
//                           <Typography.Text strong>Linked Tickets:</Typography.Text>
//                           <br />
//                           {latestRelease.linkedTickets.map((ticket: string, index: number) => (
//                             <Typography.Text key={index}>{ticket}{index < latestRelease.linkedTickets.length - 1 ? ', ' : ''}</Typography.Text>
//                           ))}
//                         </div>
//                       )}
                      
//                       {latestRelease.repositories && latestRelease.repositories.length > 0 && (
//                         <div>
//                           <Typography.Text strong>Repositories:</Typography.Text>
//                           <br />
//                           {latestRelease.repositories.map((repo: string, index: number) => (
//                             <Typography.Text key={index}>{repo}{index < latestRelease.repositories.length - 1 ? ', ' : ''}</Typography.Text>
//                           ))}
//                         </div>
//                       )}
                      
//                       {latestRelease.pullRequests && latestRelease.pullRequests.length > 0 && (
//                         <div>
//                           <Typography.Text strong>Pull Requests:</Typography.Text>
//                           <br />
//                           {latestRelease.pullRequests.map((pr: string, index: number) => (
//                             <Typography.Text key={index}>{pr}{index < latestRelease.pullRequests.length - 1 ? ', ' : ''}</Typography.Text>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </Card>

//                   {/* Visibility */}
//                   <Card
//                     title="Visibility & Audience"
//                   >
//                     <Typography.Text strong>Visible to: </Typography.Text>
//                     {latestRelease.visibility && latestRelease.visibility.map((vis: string, index: number) => (
//                       <Typography.Text key={index}>
//                         {vis === 'internal' ? 'Internal Team' : 
//                          vis === 'client' ? 'Clients' : 
//                          vis === 'public' ? 'Public' : vis}
//                         {index < latestRelease.visibility.length - 1 ? ', ' : ''}
//                       </Typography.Text>
//                     ))}
//                   </Card>
//                 </>
//               ) : (
//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'center', 
//                   alignItems: 'center', 
//                   height: '100%',
//                   flexDirection: 'column',
//                   color: '#999'
//                 }}>
//                   <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
//                   <Title level={4}>No Release Selected</Title>
//                   <Paragraph>Select a release from the sidebar or create a new one.</Paragraph>
//                 </div>
//               )}
//             </div>
//           </main>
//         </div>
//       </div>
//     </MainLayout>
//   );
// }
// "use client";

// import MainLayout from "@/components/layout/MainLayout";
// import {
//   Space,
//   Typography,
//   Button,
//   Divider,
//   Layout,
//   Select,
//   Input,
//   Card,
//   Tag,
// } from "antd";
// const { Title, Paragraph, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import DocumentEditor from "@/components/common/DocumentEditor";
// import { useCreateBlockNote } from "@blocknote/react";

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [latestRelease, setLatestRelease] = useState<any>(null);
//   const [releaseHistory, setReleaseHistory] = useState<any[]>([]);
  
//   // Initialize editors for viewing - using useState to persist them
//   const [summaryEditor] = useState(useCreateBlockNote());
//   const [keyInsightsEditor] = useState(useCreateBlockNote());
//   const [newFeaturesEditor] = useState(useCreateBlockNote());
//   const [improvementsEditor] = useState(useCreateBlockNote());
//   const [bugFixesEditor] = useState(useCreateBlockNote());
//   const [breakingChangesEditor] = useState(useCreateBlockNote());
//   const [apiChangesEditor] = useState(useCreateBlockNote());
//   const [databaseChangesEditor] = useState(useCreateBlockNote());
//   const [knownIssuesEditor] = useState(useCreateBlockNote());

//   // Add a debug button to check localStorage
//   const checkLocalStorage = () => {
//     console.log("=== Checking localStorage ===");
//     const latest = localStorage.getItem("latestReleaseNote");
//     const history = localStorage.getItem("releaseHistory");
//     console.log("latestReleaseNote:", latest);
//     console.log("releaseHistory:", history);
    
//     if (latest) {
//       const parsed = JSON.parse(latest);
//       console.log("Parsed latest release:", parsed);
//       setLatestRelease(parsed);
//     }
    
//     if (history) {
//       setReleaseHistory(JSON.parse(history));
//     }
//   };

//   useEffect(() => {
//     // Check localStorage on component mount
//     checkLocalStorage();
    
//     // Also listen for storage events (in case of multiple tabs)
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === "latestReleaseNote" || e.key === "releaseHistory") {
//         checkLocalStorage();
//       }
//     };
    
//     window.addEventListener('storage', handleStorageChange);
    
//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//     };
//   }, []);

//   const handleEdit = () => {
//     if (latestRelease) {
//       localStorage.setItem("editReleaseNote", JSON.stringify(latestRelease));
//       router.push("/releasenotes/create");
//     }
//   };

//   // Function to get environment color
//   const getEnvironmentColor = (env: string) => {
//     switch (env?.toLowerCase()) {
//       case 'prod': return 'red';
//       case 'qa': return 'orange';
//       case 'dev': return 'blue';
//       default: return 'default';
//     }
//   };

//   const loadReleaseIntoEditors = (release: any) => {
//     setLatestRelease(release);
    
//     // Clear all editors first
//     summaryEditor.replaceBlocks(summaryEditor.document, []);
//     keyInsightsEditor.replaceBlocks(keyInsightsEditor.document, []);
//     newFeaturesEditor.replaceBlocks(newFeaturesEditor.document, []);
//     improvementsEditor.replaceBlocks(improvementsEditor.document, []);
//     bugFixesEditor.replaceBlocks(bugFixesEditor.document, []);
//     breakingChangesEditor.replaceBlocks(breakingChangesEditor.document, []);
//     apiChangesEditor.replaceBlocks(apiChangesEditor.document, []);
//     databaseChangesEditor.replaceBlocks(databaseChangesEditor.document, []);
//     knownIssuesEditor.replaceBlocks(knownIssuesEditor.document, []);
    
//     // Then load new content
//     setTimeout(() => {
//       if (release.summaryBlocks) {
//         summaryEditor.replaceBlocks(summaryEditor.document, release.summaryBlocks);
//       }
//       if (release.keyInsightsBlocks) {
//         keyInsightsEditor.replaceBlocks(keyInsightsEditor.document, release.keyInsightsBlocks);
//       }
//       if (release.newFeaturesBlocks) {
//         newFeaturesEditor.replaceBlocks(newFeaturesEditor.document, release.newFeaturesBlocks);
//       }
//       if (release.improvementsBlocks) {
//         improvementsEditor.replaceBlocks(improvementsEditor.document, release.improvementsBlocks);
//       }
//       if (release.bugFixesBlocks) {
//         bugFixesEditor.replaceBlocks(bugFixesEditor.document, release.bugFixesBlocks);
//       }
//       if (release.breakingChangesBlocks) {
//         breakingChangesEditor.replaceBlocks(breakingChangesEditor.document, release.breakingChangesBlocks);
//       }
//       if (release.apiChangesBlocks) {
//         apiChangesEditor.replaceBlocks(apiChangesEditor.document, release.apiChangesBlocks);
//       }
//       if (release.databaseChangesBlocks) {
//         databaseChangesEditor.replaceBlocks(databaseChangesEditor.document, release.databaseChangesBlocks);
//       }
//       if (release.knownIssuesBlocks) {
//         knownIssuesEditor.replaceBlocks(knownIssuesEditor.document, release.knownIssuesBlocks);
//       }
//     }, 100);
//   };

//   return (
//     <MainLayout>
//       <div>
//         <div style={{ margin: 20, marginTop: 10 }}>
//           <Space
//             align="center"
//             style={{
//               width: "100%",
//               display: "flex",
//               justifyContent: "space-between",
//             }}
//           >
//             <Space align="center">
//               <FileTextOutlined style={{ fontSize: 24, color: "#1677ff" }} />
//               <Title level={3} style={{ margin: 0 }}>
//                 Release Notes
//               </Title>
//             </Space>

//             <Space>
//               {/* Debug button - you can remove this later */}
//               <Button onClick={checkLocalStorage} type="dashed">
//                 Debug
//               </Button>
              
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => router.push("/releasenotes/create")}
//               >
//                 Create Release Notes
//               </Button>
//             </Space>
//           </Space>
//         </div>
//         <Divider></Divider>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "300px 1fr",
//             height: "calc(100vh - 140px)",
//             overflow: "hidden",
//           }}
//         >
//           {/* Left Sidebar */}
//           <aside
//             style={{
//               padding: 16,
//               borderRight: "1px solid #e5e7eb",
//               height: "100%",
//               overflowY: "auto",
//             }}
//           >
//             <Select
//               placeholder="Select Product"
//               style={{ width: "100%" }}
//               options={[
//                 { label: "Web App", value: "web" },
//                 { label: "Mobile App", value: "mobile" },
//               ]}
//             />

//             <Divider style={{ margin: "12px 0" }} />

//             <Input.Search placeholder="Search versions..." />

//             <Divider style={{ margin: "12px 0" }} />

//             {/* Display release history from localStorage */}
//             <div style={{ marginBottom: 24 }}>
//               <Typography.Text type="secondary" strong>
//                 RELEASE HISTORY
//               </Typography.Text>
//               <div style={{ marginTop: 8 }}>
//                 {releaseHistory.length > 0 ? (
//                   releaseHistory.map((release, index) => (
//                     <div
//                       key={index}
//                       className={`version-item ${latestRelease?.version === release.version ? "active" : ""}`}
//                       onClick={() => loadReleaseIntoEditors(release)}
//                       style={{
//                         padding: "12px",
//                         marginBottom: 8,
//                         borderRadius: 6,
//                         cursor: "pointer",
//                         backgroundColor: latestRelease?.version === release.version ? "#e6f7ff" : "#f9f9f9",
//                         border: latestRelease?.version === release.version ? "1px solid #91d5ff" : "1px solid #f0f0f0",
//                         transition: "all 0.3s",
//                       }}
//                     >
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                         <div style={{ fontWeight: 600, fontSize: 14 }}>{release.version}</div>
//                         <Tag color={getEnvironmentColor(release.environment)}>
//                           {release.environment?.toUpperCase()}
//                         </Tag>
//                       </div>
//                       <div style={{ fontSize: 13, color: "#1890ff", marginTop: 4, fontWeight: 500 }}>
//                         {release.title}
//                       </div>
//                       <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
//                         {release.project} • {release.releaseDate}
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <div style={{ 
//                     textAlign: 'center', 
//                     padding: '40px 20px',
//                     color: '#999'
//                   }}>
//                     <FileTextOutlined style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }} />
//                     <Paragraph>No releases yet</Paragraph>
//                     <Paragraph type="secondary" style={{ fontSize: 12 }}>
//                       Create your first release note
//                     </Paragraph>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </aside>

//           {/* Main Content - Right Panel */}
//           <main
//             style={{
//               padding: 0,
//               height: "100%",
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             {/* Header */}
//             <div
//               style={{
//                 position: "sticky",
//                 top: 0,
//                 zIndex: 2,
//                 background: "#f5f5f5",
//                 padding: "16px 24px 0",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   gap: 12,
//                 }}
//               >
//                 <Title level={4} style={{ margin: 0 }}>
//                   {latestRelease ? latestRelease.title : "No Release Selected"}
//                 </Title>

//                 <Space>
//                   {latestRelease && (
//                     <>
//                       <Button icon={<EditOutlined />} onClick={handleEdit}>
//                         Edit
//                       </Button>
//                       <Button icon={<ShareAltOutlined />}>Share</Button>
//                       <Button icon={<DownloadOutlined />}>Export</Button>
//                       <Button icon={<MoreOutlined />} type="text" />
//                     </>
//                   )}
//                 </Space>
//               </div>

//               {latestRelease && (
//                 <div style={{ marginTop: 8, color: "#666" }}>
//                   <Space>
//                     <span><Text strong>Version:</Text> {latestRelease.version}</span>
//                     <span>•</span>
//                     <span><Text strong>Released:</Text> {latestRelease.releaseDate}</span>
//                     <span>•</span>
//                     <span>
//                       <Text strong>Environment:</Text> 
//                       <Tag color={getEnvironmentColor(latestRelease.environment)} style={{ marginLeft: 4 }}>
//                         {latestRelease.environment?.toUpperCase()}
//                       </Tag>
//                     </span>
//                     <span>•</span>
//                     <span><Text strong>Project:</Text> {latestRelease.project}</span>
//                   </Space>
//                 </div>
//               )}

//               <Divider style={{ marginTop: 12 }} />
//             </div>

//             {/* Scrollable Content */}
//             <div
//               style={{
//                 padding: "0 24px 24px",
//                 overflowY: "auto",
//                 flex: 1,
//               }}
//             >
//               {latestRelease ? (
//                 <>
//                   {/* Basic Information */}
//                   <Card
//                     title="Basic Information"
//                     style={{ marginBottom: 16 }}
//                   >
//                     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//                       <div>
//                         <Typography.Text strong>Project:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.project}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Version:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.version}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Release Date:</Typography.Text>
//                         <br />
//                         <Typography.Text>{latestRelease.releaseDate}</Typography.Text>
//                       </div>
//                       <div>
//                         <Typography.Text strong>Environment:</Typography.Text>
//                         <br />
//                         <Typography.Text>
//                           <Tag color={getEnvironmentColor(latestRelease.environment)}>
//                             {latestRelease.environment?.toUpperCase()}
//                           </Tag>
//                         </Typography.Text>
//                       </div>
//                     </div>
//                   </Card>

//                   {/* Release Summary */}
//                   <Card
//                     title="Release Summary"
//                     style={{ marginBottom: 16 }}
//                   >
//                     <div style={{ minHeight: 150 }}>
//                       <DocumentEditor
//                         editor={summaryEditor}
//                         viewMode="preview"
//                       />
//                     </div>
//                   </Card>

//                   {/* Key Insights */}
//                   {(latestRelease.keyInsightsBlocks || latestRelease.keyInsights) && (
//                     <Card
//                       title="Key Insights"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ minHeight: 150 }}>
//                         <DocumentEditor
//                           editor={keyInsightsEditor}
//                           viewMode="preview"
//                         />
//                       </div>
//                     </Card>
//                   )}

//                   {/* New Features */}
//                   {(latestRelease.newFeaturesBlocks || latestRelease.newFeatures) && (
//                     <Card
//                       title="New Features"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ minHeight: 150 }}>
//                         <DocumentEditor
//                           editor={newFeaturesEditor}
//                           viewMode="preview"
//                         />
//                       </div>
//                     </Card>
//                   )}

//                   {/* Improvements */}
//                   {(latestRelease.improvementsBlocks || latestRelease.improvements) && (
//                     <Card
//                       title="Improvements"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ minHeight: 150 }}>
//                         <DocumentEditor
//                           editor={improvementsEditor}
//                           viewMode="preview"
//                         />
//                       </div>
//                     </Card>
//                   )}

//                   {/* Bug Fixes */}
//                   {(latestRelease.bugFixesBlocks || latestRelease.bugFixes) && (
//                     <Card
//                       title="Bug Fixes"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ minHeight: 150 }}>
//                         <DocumentEditor
//                           editor={bugFixesEditor}
//                           viewMode="preview"
//                         />
//                       </div>
//                     </Card>
//                   )}

//                   {/* Breaking Changes */}
//                   {(latestRelease.breakingChangesBlocks || latestRelease.breakingChanges) && (
//                     <Card
//                       title="Breaking Changes"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ minHeight: 150 }}>
//                         <DocumentEditor
//                           editor={breakingChangesEditor}
//                           viewMode="preview"
//                         />
//                       </div>
//                     </Card>
//                   )}

//                   {/* Technical Issues */}
//                   {(latestRelease.apiChangesBlocks || latestRelease.databaseChangesBlocks || latestRelease.knownIssuesBlocks || 
//                     latestRelease.apiChanges || latestRelease.databaseChanges || latestRelease.knownIssues) && (
//                     <Card
//                       title="Technical Issues"
//                       style={{ marginBottom: 16 }}
//                     >
//                       {(latestRelease.apiChangesBlocks || latestRelease.apiChanges) && (
//                         <>
//                           <Title level={5}>API Changes</Title>
//                           <div style={{ minHeight: 120, marginBottom: 16 }}>
//                             <DocumentEditor
//                               editor={apiChangesEditor}
//                               viewMode="preview"
//                             />
//                           </div>
//                         </>
//                       )}
                      
//                       {(latestRelease.databaseChangesBlocks || latestRelease.databaseChanges) && (
//                         <>
//                           <Title level={5} style={{ marginTop: 16 }}>Database Changes</Title>
//                           <div style={{ minHeight: 120, marginBottom: 16 }}>
//                             <DocumentEditor
//                               editor={databaseChangesEditor}
//                               viewMode="preview"
//                             />
//                           </div>
//                         </>
//                       )}
                      
//                       {(latestRelease.knownIssuesBlocks || latestRelease.knownIssues) && (
//                         <>
//                           <Title level={5} style={{ marginTop: 16 }}>Known Issues</Title>
//                           <div style={{ minHeight: 120 }}>
//                             <DocumentEditor
//                               editor={knownIssuesEditor}
//                               viewMode="preview"
//                             />
//                           </div>
//                         </>
//                       )}
//                     </Card>
//                   )}

//                   {/* Linked Items */}
//                   {(latestRelease.linkedTickets || latestRelease.repositories || latestRelease.pullRequests) && (
//                     <Card
//                       title="Linked Items"
//                       style={{ marginBottom: 16 }}
//                     >
//                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
//                         {latestRelease.linkedTickets && latestRelease.linkedTickets.length > 0 && (
//                           <div>
//                             <Typography.Text strong>Linked Tickets:</Typography.Text>
//                             <br />
//                             <div style={{ marginTop: 8 }}>
//                               {latestRelease.linkedTickets.map((ticket: string, index: number) => (
//                                 <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
//                                   {ticket}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}
                        
//                         {latestRelease.repositories && latestRelease.repositories.length > 0 && (
//                           <div>
//                             <Typography.Text strong>Repositories:</Typography.Text>
//                             <br />
//                             <div style={{ marginTop: 8 }}>
//                               {latestRelease.repositories.map((repo: string, index: number) => (
//                                 <Tag key={index} color="green" style={{ marginBottom: 4 }}>
//                                   {repo}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}
                        
//                         {latestRelease.pullRequests && latestRelease.pullRequests.length > 0 && (
//                           <div>
//                             <Typography.Text strong>Pull Requests:</Typography.Text>
//                             <br />
//                             <div style={{ marginTop: 8 }}>
//                               {latestRelease.pullRequests.map((pr: string, index: number) => (
//                                 <Tag key={index} color="purple" style={{ marginBottom: 4 }}>
//                                   {pr}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </Card>
//                   )}

//                   {/* Visibility */}
//                   {latestRelease.visibility && (
//                     <Card
//                       title="Visibility & Audience"
//                     >
//                       <Typography.Text strong>Visible to: </Typography.Text>
//                       <div style={{ marginTop: 8 }}>
//                         {latestRelease.visibility.map((vis: string, index: number) => (
//                           <Tag 
//                             key={index} 
//                             color={
//                               vis === 'internal' ? 'blue' : 
//                               vis === 'client' ? 'gold' : 
//                               vis === 'public' ? 'green' : 'default'
//                             }
//                             style={{ marginRight: 8 }}
//                           >
//                             {vis === 'internal' ? 'Internal Team' : 
//                              vis === 'client' ? 'Clients' : 
//                              vis === 'public' ? 'Public' : vis}
//                           </Tag>
//                         ))}
//                       </div>
//                     </Card>
//                   )}
//                 </>
//               ) : (
//                 <div style={{ 
//                   display: 'flex', 
//                   justifyContent: 'center', 
//                   alignItems: 'center', 
//                   height: '100%',
//                   flexDirection: 'column',
//                   color: '#999'
//                 }}>
//                   <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
//                   <Title level={4}>No Release Selected</Title>
//                   <Paragraph>Select a release from the sidebar or create a new one.</Paragraph>
//                   <Button 
//                     type="primary" 
//                     style={{ marginTop: 16 }}
//                     onClick={() => router.push("/releasenotes/create")}
//                   >
//                     Create Your First Release
//                   </Button>
//                 </div>
//               )}
//             </div>
//           </main>
//         </div>
//       </div>
//     </MainLayout>
//   );
// }