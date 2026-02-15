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
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   BranchesOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
//   //VersionTagOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // Fetch projects on component mount
//   // useEffect(() => {
//   //   const fetchProjects = async () => {
//   //     try {
//   //       setLoadingProjects(true);
//   //       const response = await ProjectService.getProjects();
//   //       setProjects(response.data || []);
//   //     } catch (error) {
//   //       console.error("Failed to fetch projects:", error);
//   //       message.error("Failed to load projects");
//   //     } finally {
//   //       setLoadingProjects(false);
//   //     }
//   //   };

//   //   fetchProjects();
//   // }, []);
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);

//         // ✅ THIS LINE DOES THE MAGIC - Auto selects first project
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };

//     fetchProjects();
//   }, []);

//   // Fetch release notes list using React Query
//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });
//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   // Fetch single release note by ID when selected
//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   // Delete mutation
//   const deleteReleaseNote = useDeleteReleaseNote();

//   // Group release notes by month
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};

//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();

//       if (!groups[monthYear]) {
//         groups[monthYear] = [];
//       }
//       groups[monthYear].push(release);
//     });

//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   // Helper function to extract text content from BlockNote blocks
//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
//       return "";
//     }

//     let textContent = "";

//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) {
//             textContent += item.text;
//           } else if (item.content) {
//             extractText(item);
//           }
//         });
//       }

//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }

//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };

//     blocks.forEach((block) => extractText(block));

//     return textContent.trim();
//   };

//   // Helper function to render editor content
//   const renderEditorContent = (content: any) => {
//     if (!content) return "";

//     if (typeof content === "string") return content;

//     if (Array.isArray(content)) {
//       return extractTextFromBlocks(content);
//     }

//     if (content?.document && Array.isArray(content.document)) {
//       return extractTextFromBlocks(content.document);
//     }

//     if (content?.blocks && Array.isArray(content.blocks)) {
//       return extractTextFromBlocks(content.blocks);
//     }

//     return "";
//   };

//   // Handle project selection
//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//   };

//   // Handle version selection
//   const handleVersionSelect = (releaseId: string) => {
//     setSelectedReleaseId(releaseId);
//   };

//   // Handle search
//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     setSelectedReleaseId(null);
//   };

//   // Handle edit
//   const handleEdit = () => {
//     if (selectedReleaseId) {
//       router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//     }
//   };

//   // Handle delete confirmation
//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   // Handle delete
//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;

//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");

//       if (selectedReleaseId === releaseToDelete) {
//         setSelectedReleaseId(null);
//       }

//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // Handle duplicate
//   const handleDuplicate = () => {
//     if (selectedRelease) {
//       router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected to export");
//       return;
//     }

//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const jsonStr = JSON.stringify(selectedRelease, null, 2);
//       const blob = new Blob([jsonStr], { type: "application/json" });
//       const url = URL.createObjectURL(blob);

//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);

//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       console.error("Export failed:", error);
//       message.error("Failed to export as JSON");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected to export");
//       return;
//     }

//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;

//       if (selectedRelease.project) {
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       }

//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) {
//         markdown += `## Release Summary\n\n${summaryText}\n\n`;
//       }

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) {
//         markdown += `## Key Insights\n\n${insightsText}\n\n`;
//       }

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) {
//         markdown += `## New Features\n\n${featuresText}\n\n`;
//       }

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText) {
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;
//       }

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) {
//         markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;
//       }

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText) {
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;
//       }

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) {
//         markdown += `## API Changes\n\n${apiText}\n\n`;
//       }

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) {
//         markdown += `## Database Changes\n\n${dbText}\n\n`;
//       }

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText) {
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;
//       }

//       if (selectedRelease.linkedTickets?.length) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach((ticket) => {
//           markdown += `- ${ticket}\n`;
//         });
//         markdown += `\n`;
//       }

//       if (selectedRelease.repositories?.length) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach((repo) => {
//           markdown += `- ${repo}\n`;
//         });
//         markdown += `\n`;
//       }

//       if (selectedRelease.pullRequests?.length) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => {
//           markdown += `- ${pr}\n`;
//         });
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n`;
//       markdown += `${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);

//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);

//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       console.error("Export failed:", error);
//       message.error("Failed to export as Markdown");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected to export");
//       return;
//     }

//     try {
//       let text = `${selectedRelease.title}\n`;
//       text += `${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;

//       if (selectedRelease.project) {
//         text += `Project: ${selectedRelease.project.name}\n`;
//       }

//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) {
//         text += `RELEASE SUMMARY\n`;
//         text += `${"-".repeat(15)}\n`;
//         text += `${summaryText}\n\n`;
//       }

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) {
//         text += `KEY INSIGHTS\n`;
//         text += `${"-".repeat(12)}\n`;
//         text += `${insightsText}\n\n`;
//       }

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) {
//         text += `NEW FEATURES\n`;
//         text += `${"-".repeat(12)}\n`;
//         text += `${featuresText}\n\n`;
//       }

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText) {
//         text += `IMPROVEMENTS\n`;
//         text += `${"-".repeat(12)}\n`;
//         text += `${improvementsText}\n\n`;
//       }

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) {
//         text += `BUG FIXES\n`;
//         text += `${"-".repeat(9)}\n`;
//         text += `${bugFixesText}\n\n`;
//       }

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText) {
//         text += `BREAKING CHANGES\n`;
//         text += `${"-".repeat(17)}\n`;
//         text += `${breakingText}\n\n`;
//       }

//       if (selectedRelease.linkedTickets?.length) {
//         text += `LINKED TICKETS\n`;
//         text += `${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach((ticket) => {
//           text += `• ${ticket}\n`;
//         });
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);

//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);

//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       console.error("Export failed:", error);
//       message.error("Failed to export as Text");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // Get grouped release notes
//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // Get status color
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   // Get environment color
//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
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
//             <Button icon={<EditOutlined />} onClick={handleEdit}>
//               Edit
//             </Button>
//           </Space>
//         </div>

//         {/* GRID LAYOUT */}
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
//               background: "#fafafa",
//             }}
//           >

//             <Select
//               placeholder="Select Project"
//               style={{ width: "100%" }}
//               loading={loadingProjects}
//               showSearch
//               optionFilterProp="children"
//               onChange={handleProjectChange}
//               allowClear
//               value={selectedProject}
//             >
//               {projects.map((project) => (
//                 <Select.Option key={project.id} value={project.id}>
//                   {project.name}
//                 </Select.Option>
//               ))}
//             </Select>

//             <Divider style={{ margin: "16px 0" }} />

//             <Input.Search
//               placeholder="Search versions..."
//               onSearch={handleSearch}
//               onChange={(e) => !e.target.value && handleSearch("")}
//               allowClear
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "40px 0" }}>
//                 <Spin
//                   indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
//                 />
//                 <p style={{ marginTop: 16, color: "#999" }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "40px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
//                 <p>Select a project to view releases</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "40px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description="No release notes found"
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 24 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 12, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>

//                   <div style={{ marginTop: 8 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "12px",
//                           borderRadius: 8,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 6,
//                           transition: "all 0.2s",
//                         }}
//                         onMouseEnter={(e) => {
//                           if (selectedReleaseId !== release.id) {
//                             e.currentTarget.style.backgroundColor = "#f5f5f5";
//                           }
//                         }}
//                         onMouseLeave={(e) => {
//                           if (selectedReleaseId !== release.id) {
//                             e.currentTarget.style.backgroundColor =
//                               "transparent";
//                           }
//                         }}
//                       >
//                         <div style={{ fontWeight: 600, marginBottom: 4 }}>
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{ fontSize: 11 }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 11, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </aside>

//           {/* Main Content - Right Panel with UI from images */}
//           <main
//             style={{
//               padding: 0,
//               height: "100%",
//               overflow: "hidden",
//               display: "flex",
//               flexDirection: "column",
//               background: "#fff",
//             }}
//           >
//             {/* Header Section - Like note.png */}
//             <div
//               style={{
//                 padding: "24px 32px",
//                 borderBottom: "1px solid #f0f0f0",
//                 background: "#fff",
//               }}
//             >
//               {isLoadingSelectedRelease ? (
//                 <Spin indicator={<LoadingOutlined spin />} />
//               ) : selectedRelease ? (
//                 <>
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "space-between",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <div>
//                       <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Space size="large">
//                         <Space>
//                           <CalendarOutlined style={{ color: "#1890ff" }} />
//                           <Text type="secondary">Version</Text>
//                           <Text strong>{selectedRelease.version}</Text>
//                         </Space>
//                         <Space>
//                           <CalendarOutlined style={{ color: "#52c41a" }} />
//                           <Text type="secondary">Released</Text>
//                           <Text strong>
//                             {dayjs(selectedRelease.releaseDate).format(
//                               "MMMM D, YYYY",
//                             )}
//                           </Text>
//                         </Space>
//                         <Space>
//                           <EnvironmentOutlined style={{ color: "#722ed1" }} />
//                           <Text type="secondary">Environment</Text>
//                           <Tag
//                             color={getEnvironmentColor(
//                               selectedRelease.environment,
//                             )}
//                           >
//                             {selectedRelease.environment}
//                           </Tag>
//                         </Space>
//                         <Space>
//                           <ProjectOutlined style={{ color: "#fa8c16" }} />
//                           <Text type="secondary">Project</Text>
//                           <Text strong>{selectedRelease.project?.name}</Text>
//                         </Space>
//                       </Space>
//                     </div>
//                     <Tag
//                       color={getStatusColor(selectedRelease.status)}
//                       style={{
//                         padding: "4px 12px",
//                         fontSize: 14,
//                         fontWeight: 600,
//                       }}
//                     >
//                       {selectedRelease.status}
//                     </Tag>
//                   </div>

//                   <Space style={{ marginTop: 16 }}>
//                     <Button icon={<EditOutlined />} onClick={handleEdit}>
//                       Edit
//                     </Button>
//                     <Button icon={<ShareAltOutlined />}>Share</Button>
//                     <Dropdown menu={{ items: exportMenuItems }}>
//                       <Button icon={<DownloadOutlined />}>Export</Button>
//                     </Dropdown>
//                     <Dropdown
//                       trigger={["click"]}
//                       menu={{
//                         items: [
//                           {
//                             key: "duplicate",
//                             label: "Duplicate release",
//                             onClick: handleDuplicate,
//                           },
//                           {
//                             key: "archive",
//                             label: "Archive release",
//                             disabled: true,
//                           },
//                           {
//                             key: "delete",
//                             label: (
//                               <span style={{ color: "#ff4d4f" }}>
//                                 Delete release
//                               </span>
//                             ),
//                             onClick: () =>
//                               showDeleteConfirm(selectedRelease.id),
//                           },
//                         ],
//                       }}
//                     >
//                       <Button icon={<MoreOutlined />} type="text" />
//                     </Dropdown>
//                   </Space>
//                 </>
//               ) : (
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project and version to view release notes"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 />
//               )}
//             </div>

//             {/* Scrollable Content - Cards like note.png and note1.png */}
//             <div
//               style={{
//                 padding: "24px 32px",
//                 overflowY: "auto",
//                 flex: 1,
//                 background: "#f8f9fa",
//               }}
//             >
//               {selectedRelease ? (
//                 <>
//                   {/* Release Summary Card - Like note.png */}
//                   <Card
//                     style={{
//                       marginBottom: 24,
//                       borderRadius: 12,
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 24 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 16,
//                       }}
//                     >
//                       <BookOutlined
//                         style={{
//                           fontSize: 20,
//                           color: "#1890ff",
//                           marginRight: 12,
//                         }}
//                       />
//                       <Title level={4} style={{ margin: 0 }}>
//                         Release Summary
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 16px 0" }} />
//                     <div
//                       style={{
//                         background: "#fafafa",
//                         padding: 20,
//                         borderRadius: 8,
//                         borderLeft: "4px solid #1890ff",
//                       }}
//                     >
//                       <Text
//                         style={{
//                           fontSize: 14,
//                           lineHeight: 1.8,
//                           whiteSpace: "pre-wrap",
//                         }}
//                       >
//                         {renderEditorContent(selectedRelease.summary) ||
//                           "No summary provided"}
//                       </Text>
//                     </div>
//                   </Card>

//                   {/* Key Insights Card */}
//                   {selectedRelease.keyInsights &&
//                     renderEditorContent(selectedRelease.keyInsights) && (
//                       <Card
//                         style={{
//                           marginBottom: 24,
//                           borderRadius: 12,
//                           boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                           border: "1px solid #f0f0f0",
//                         }}
//                         bodyStyle={{ padding: 24 }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 16,
//                           }}
//                         >
//                           <BulbOutlined
//                             style={{
//                               fontSize: 20,
//                               color: "#faad14",
//                               marginRight: 12,
//                             }}
//                           />
//                           <Title level={4} style={{ margin: 0 }}>
//                             Key Insights
//                           </Title>
//                         </div>
//                         <Divider style={{ margin: "0 0 16px 0" }} />
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 20,
//                             borderRadius: 8,
//                             borderLeft: "4px solid #faad14",
//                           }}
//                         >
//                           <Text
//                             style={{
//                               fontSize: 14,
//                               lineHeight: 1.8,
//                               whiteSpace: "pre-wrap",
//                             }}
//                           >
//                             {renderEditorContent(selectedRelease.keyInsights)}
//                           </Text>
//                         </div>
//                       </Card>
//                     )}

//                   {/* Changelog Section - Like note1.png */}
//                   <Card
//                     style={{
//                       marginBottom: 24,
//                       borderRadius: 12,
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 24 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 16,
//                       }}
//                     >
//                       <RocketOutlined
//                         style={{
//                           fontSize: 20,
//                           color: "#52c41a",
//                           marginRight: 12,
//                         }}
//                       />
//                       <Title level={4} style={{ margin: 0 }}>
//                         Changelog
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 16px 0" }} />

//                     {/* New Features */}
//                     {selectedRelease.newFeatures &&
//                       renderEditorContent(selectedRelease.newFeatures) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <PlusOutlined
//                               style={{ color: "#52c41a", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               New Features
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                               marginLeft: 24,
//                             }}
//                           >
//                             <Text
//                               style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                             >
//                               {renderEditorContent(selectedRelease.newFeatures)}
//                             </Text>
//                           </div>
//                         </div>
//                       )}

//                     {/* Improvements */}
//                     {selectedRelease.improvements &&
//                       renderEditorContent(selectedRelease.improvements) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <RocketOutlined
//                               style={{ color: "#1890ff", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               Improvements
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                               marginLeft: 24,
//                             }}
//                           >
//                             <Text
//                               style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                             >
//                               {renderEditorContent(
//                                 selectedRelease.improvements,
//                               )}
//                             </Text>
//                           </div>
//                         </div>
//                       )}

//                     {/* Bug Fixes */}
//                     {selectedRelease.bugFixes &&
//                       renderEditorContent(selectedRelease.bugFixes) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <BugOutlined
//                               style={{ color: "#ff4d4f", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               Bug Fixes
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                               marginLeft: 24,
//                             }}
//                           >
//                             <Text
//                               style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                             >
//                               {renderEditorContent(selectedRelease.bugFixes)}
//                             </Text>
//                           </div>
//                         </div>
//                       )}

//                     {/* Breaking Changes */}
//                     {selectedRelease.breakingChanges &&
//                       renderEditorContent(selectedRelease.breakingChanges) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <WarningOutlined
//                               style={{ color: "#ff4d4f", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               Breaking Changes
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                               marginLeft: 24,
//                             }}
//                           >
//                             <Text
//                               style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                             >
//                               {renderEditorContent(
//                                 selectedRelease.breakingChanges,
//                               )}
//                             </Text>
//                           </div>
//                         </div>
//                       )}
//                   </Card>

//                   {/* Technical Notes Card - Like note2.png */}
//                   <Card
//                     style={{
//                       marginBottom: 24,
//                       borderRadius: 12,
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 24 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 16,
//                       }}
//                     >
//                       <CodeOutlined
//                         style={{
//                           fontSize: 20,
//                           color: "#722ed1",
//                           marginRight: 12,
//                         }}
//                       />
//                       <Title level={4} style={{ margin: 0 }}>
//                         Technical Notes
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 16px 0" }} />

//                     {/* API Changes */}
//                     {selectedRelease.apiChanges &&
//                       renderEditorContent(selectedRelease.apiChanges) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <ApiOutlined
//                               style={{ color: "#722ed1", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               API Changes
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                               fontFamily: "monospace",
//                               fontSize: 13,
//                             }}
//                           >
//                             <Text style={{ whiteSpace: "pre-wrap" }}>
//                               {renderEditorContent(selectedRelease.apiChanges)}
//                             </Text>
//                           </div>
//                         </div>
//                       )}

//                     {/* Database Changes */}
//                     {selectedRelease.databaseChanges &&
//                       renderEditorContent(selectedRelease.databaseChanges) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <DatabaseOutlined
//                               style={{ color: "#13c2c2", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               Database Changes
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                             }}
//                           >
//                             <Text style={{ whiteSpace: "pre-wrap" }}>
//                               {renderEditorContent(
//                                 selectedRelease.databaseChanges,
//                               )}
//                             </Text>
//                           </div>
//                         </div>
//                       )}

//                     {/* Known Issues */}
//                     {selectedRelease.knownIssues &&
//                       renderEditorContent(selectedRelease.knownIssues) && (
//                         <div style={{ marginBottom: 24 }}>
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               marginBottom: 12,
//                             }}
//                           >
//                             <ExclamationCircleOutlined
//                               style={{ color: "#fa8c16", marginRight: 8 }}
//                             />
//                             <Title level={5} style={{ margin: 0 }}>
//                               Known Issues
//                             </Title>
//                           </div>
//                           <div
//                             style={{
//                               background: "#fafafa",
//                               padding: 16,
//                               borderRadius: 8,
//                             }}
//                           >
//                             <Text style={{ whiteSpace: "pre-wrap" }}>
//                               {renderEditorContent(selectedRelease.knownIssues)}
//                             </Text>
//                           </div>
//                         </div>
//                       )}
//                   </Card>

//                   {/* Linked Items Card */}
//                   {(selectedRelease.linkedTickets?.length > 0 ||
//                     selectedRelease.repositories?.length > 0 ||
//                     selectedRelease.pullRequests?.length > 0) && (
//                     <Card
//                       style={{
//                         marginBottom: 24,
//                         borderRadius: 12,
//                         boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 24 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 16,
//                         }}
//                       >
//                         <LinkOutlined
//                           style={{
//                             fontSize: 20,
//                             color: "#1890ff",
//                             marginRight: 12,
//                           }}
//                         />
//                         <Title level={4} style={{ margin: 0 }}>
//                           Linked Items
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 16px 0" }} />

//                       {/* Linked Tickets */}
//                       {selectedRelease.linkedTickets &&
//                         selectedRelease.linkedTickets.length > 0 && (
//                           <div style={{ marginBottom: 16 }}>
//                             <Text
//                               strong
//                               style={{ display: "block", marginBottom: 12 }}
//                             >
//                               Tickets
//                             </Text>
//                             <div
//                               style={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 8,
//                               }}
//                             >
//                               {selectedRelease.linkedTickets.map((ticket) => (
//                                 <Tag
//                                   key={ticket}
//                                   color="#1890ff"
//                                   style={{
//                                     padding: "4px 12px",
//                                     borderRadius: 16,
//                                   }}
//                                   icon={<TagOutlined />}
//                                 >
//                                   {ticket}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                       {/* Repositories */}
//                       {selectedRelease.repositories &&
//                         selectedRelease.repositories.length > 0 && (
//                           <div style={{ marginBottom: 16 }}>
//                             <Text
//                               strong
//                               style={{ display: "block", marginBottom: 12 }}
//                             >
//                               Repositories
//                             </Text>
//                             <div
//                               style={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 8,
//                               }}
//                             >
//                               {selectedRelease.repositories.map((repo) => (
//                                 <Tag
//                                   key={repo}
//                                   color="#2db7f5"
//                                   style={{
//                                     padding: "4px 12px",
//                                     borderRadius: 16,
//                                   }}
//                                   icon={<GithubOutlined />}
//                                 >
//                                   {repo}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                       {/* Pull Requests */}
//                       {selectedRelease.pullRequests &&
//                         selectedRelease.pullRequests.length > 0 && (
//                           <div style={{ marginBottom: 16 }}>
//                             <Text
//                               strong
//                               style={{ display: "block", marginBottom: 12 }}
//                             >
//                               Pull Requests
//                             </Text>
//                             <div
//                               style={{
//                                 display: "flex",
//                                 flexWrap: "wrap",
//                                 gap: 8,
//                               }}
//                             >
//                               {selectedRelease.pullRequests.map((pr) => (
//                                 <Tag
//                                   key={pr}
//                                   color="#87d068"
//                                   style={{
//                                     padding: "4px 12px",
//                                     borderRadius: 16,
//                                   }}
//                                   icon={<PullRequestOutlined />}
//                                 >
//                                   {pr}
//                                 </Tag>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                     </Card>
//                   )}

//                   {/* Visibility & Audience Card */}
//                   {selectedRelease.visibility &&
//                     selectedRelease.visibility.length > 0 && (
//                       <Card
//                         style={{
//                           marginBottom: 24,
//                           borderRadius: 12,
//                           boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                           border: "1px solid #f0f0f0",
//                         }}
//                         bodyStyle={{ padding: 24 }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 16,
//                           }}
//                         >
//                           <EyeOutlined
//                             style={{
//                               fontSize: 20,
//                               color: "#722ed1",
//                               marginRight: 12,
//                             }}
//                           />
//                           <Title level={4} style={{ margin: 0 }}>
//                             Visibility & Audience
//                           </Title>
//                         </div>
//                         <Divider style={{ margin: "0 0 16px 0" }} />
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
//                         >
//                           {selectedRelease.visibility.map((v) => {
//                             let color = "#1890ff";
//                             let icon = <CheckCircleOutlined />;
//                             let label = v;

//                             if (v === "INTERNAL") {
//                               color = "#1890ff";
//                               label = "Internal (Team Only)";
//                             } else if (v === "CLIENT") {
//                               color = "#52c41a";
//                               label = "Client Visible";
//                             } else if (v === "PUBLIC") {
//                               color = "#722ed1";
//                               label = "Public";
//                             }

//                             return (
//                               <Tag
//                                 key={v}
//                                 color={color}
//                                 style={{
//                                   padding: "8px 16px",
//                                   borderRadius: 20,
//                                   fontSize: 13,
//                                 }}
//                                 icon={icon}
//                               >
//                                 {label}
//                               </Tag>
//                             );
//                           })}
//                         </div>
//                         <Text
//                           type="secondary"
//                           style={{
//                             display: "block",
//                             marginTop: 16,
//                             fontSize: 13,
//                           }}
//                         >
//                           <ExclamationCircleOutlined
//                             style={{ marginRight: 8 }}
//                           />
//                           Visibility settings determine who can view this
//                           release note. Multiple options can be selected. Public
//                           releases will appear on your changelog page.
//                         </Text>
//                       </Card>
//                     )}
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     height: "100%",
//                   }}
//                 >
//                   <Empty
//                     description={
//                       selectedProject
//                         ? "Select a version to view release notes"
//                         : "Select a project and version to view release notes"
//                     }
//                     image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   />
//                 </div>
//               )}
//             </div>
//           </main>
//         </div>
//       </div>

//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{ danger: true, loading: deleteReleaseNote.isPending }}
//       >
//         <p>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // ============ HANDLERS ============
//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);
//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     setSelectedReleaseId(null);
//   };
//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.repositories?.length) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.pullRequests?.length) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - FLEX LAYOUT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//         }}
//       >
//         {/* ===== LEFT PANEL - 300px fixed width ===== */}
//         <aside
//           style={{
//             width: 300,
//             borderRight: "1px solid #e5e7eb",
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//           }}
//         >
//           <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
//             {/* Release Notes Title - ONLY IN LEFT PANEL */}
//             <Space align="center" style={{ marginBottom: 24 }}>
//               <FileTextOutlined style={{ fontSize: 20, color: "#1677ff" }} />
//               <Title level={4} style={{ margin: 0 }}>
//                 Release Notes
//               </Title>
//             </Space>

//             {/* Project Selector */}
//             <Select
//               placeholder="Select Project"
//               style={{ width: "100%" }}
//               loading={loadingProjects}
//               showSearch
//               optionFilterProp="children"
//               onChange={handleProjectChange}
//               allowClear
//               value={selectedProject}
//             >
//               {projects.map((project) => (
//                 <Select.Option key={project.id} value={project.id}>
//                   {project.name}
//                 </Select.Option>
//               ))}
//             </Select>

//             <Divider style={{ margin: "24px 0" }} />

//             {/* Search */}
//             <Input.Search
//               placeholder="Search versions..."
//               onSearch={handleSearch}
//               onChange={(e) => !e.target.value && handleSearch("")}
//               allowClear
//             />

//             <Divider style={{ margin: "24px 0" }} />

//             {/* Versions List */}
//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "40px 0" }}>
//                 <Spin
//                   indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
//                 />
//                 <p style={{ marginTop: 16, color: "#999" }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "40px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
//                 <p>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "40px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description="No releases found"
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 24 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 12, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 8 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "12px",
//                           borderRadius: 8,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 6,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div style={{ fontWeight: 600, marginBottom: 4 }}>
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{ fontSize: 11 }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 11, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </aside>

//         {/* ===== RIGHT PANEL - Takes remaining width ===== */}
//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           {/* ===== RIGHT PANEL HEADER - SINGLE DIV ===== */}
//           <div
//             style={{
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             <div style={{ display: "flex", justifyContent: "space-around"}}>
//               <div style={{marginTop:"4px"}}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin indicator={<LoadingOutlined spin />} />
//                 ) : selectedRelease ? (
//                   <>

//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 6,
//                       }}
//                     >
//                       <Title level={2} style={{ margin: 0, fontSize: 22 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 10, // Very small
//                           padding: "0 5px", // Minimal padding
//                           height: 20, // Small height
//                           lineHeight: "18px",
//                           borderRadius: 3,
//                           fontWeight: 400,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>

//                     <Space
//                       size="small"
//                       style={{ marginBottom: 16, flexWrap: "wrap" }}
//                     >
//                       <Space size={4}>
//                         {" "}
//                         {/* Reduced space between items */}
//                         <CalendarOutlined
//                           style={{ color: "#1890ff", fontSize: 14 }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 13 }}>
//                           Version
//                         </Text>
//                         <Text strong style={{ fontSize: 13 }}>
//                           {selectedRelease.version}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ color: "#52c41a", fontSize: 14 }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 13 }}>
//                           Released
//                         </Text>
//                         <Text strong style={{ fontSize: 13 }}>
//                           {dayjs(selectedRelease.releaseDate).format(
//                             "MMM D, YYYY",
//                           )}{" "}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined
//                           style={{ color: "#722ed1", fontSize: 14 }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 13 }}>
//                           Environment
//                         </Text>
//                         <Tag
//                           color={getEnvironmentColor(
//                             selectedRelease.environment,
//                           )}
//                           style={{ fontSize: 12, padding: "0 8px" }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined
//                           style={{ color: "#fa8c16", fontSize: 14 }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 13 }}>
//                           Project
//                         </Text>
//                         <Text strong style={{ fontSize: 13 }}>
//                           {selectedRelease.project?.name}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Empty
//                     description={
//                       selectedProject
//                         ? "Select a version to view release notes"
//                         : "Select a project from sidebar"
//                     }
//                     image={Empty.PRESENTED_IMAGE_SIMPLE}
//                     style={{ margin: "20px 0" }} // Reduced margin
//                   />
//                 )}
//               </div>

//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "flex-end",
//                   alignItems: "center",
//                   gap: 8,
//                 }}
//               >
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create Release Notes
//                 </Button>
//                 {/* <Dropdown menu={{ items: exportMenuItems }}>
//                   <Button icon={<DownloadOutlined />}>Export</Button>
//                 </Dropdown> */}

//                 {/* Edit button - only show when release selected */}
//                 {selectedRelease && (
//                   <Button icon={<EditOutlined />} onClick={handleEdit}>
//                     Edit
//                   </Button>
//                 )}

//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate release",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "archive",
//                         label: "Archive release",
//                         disabled: true,
//                       },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems, // Nest export options
//                       },
//                       {
//                         key: "delete",
//                         label: (
//                           <span style={{ color: "#ff4d4f" }}>
//                             Delete release
//                           </span>
//                         ),
//                         onClick: () => showDeleteConfirm(selectedRelease?.id),
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           {/* ===== CONTENT CARDS ===== */}
//           <div
//             style={{
//               padding: "24px 32px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 {/* Release Summary Card */}
//                 <Card
//                   style={{
//                     marginBottom: 24,
//                     borderRadius: 12,
//                     boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <BookOutlined
//                       style={{
//                         fontSize: 20,
//                         color: "#1890ff",
//                         marginRight: 12,
//                       }}
//                     />
//                     <Title level={4} style={{ margin: 0 }}>
//                       Release Summary
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 16px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 20,
//                       borderRadius: 8,
//                       borderLeft: "4px solid #1890ff",
//                     }}
//                   >
//                     <Text
//                       style={{
//                         fontSize: 14,
//                         lineHeight: 1.8,
//                         whiteSpace: "pre-wrap",
//                       }}
//                     >
//                       {renderEditorContent(selectedRelease.summary) ||
//                         "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {/* Key Insights Card */}
//                 {selectedRelease.keyInsights &&
//                   renderEditorContent(selectedRelease.keyInsights) && (
//                     <Card
//                       style={{
//                         marginBottom: 24,
//                         borderRadius: 12,
//                         boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 24 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 16,
//                         }}
//                       >
//                         <BulbOutlined
//                           style={{
//                             fontSize: 20,
//                             color: "#faad14",
//                             marginRight: 12,
//                           }}
//                         />
//                         <Title level={4} style={{ margin: 0 }}>
//                           Key Insights
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 16px 0" }} />
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 20,
//                           borderRadius: 8,
//                           borderLeft: "4px solid #faad14",
//                         }}
//                       >
//                         <Text
//                           style={{
//                             fontSize: 14,
//                             lineHeight: 1.8,
//                             whiteSpace: "pre-wrap",
//                           }}
//                         >
//                           {renderEditorContent(selectedRelease.keyInsights)}
//                         </Text>
//                       </div>
//                     </Card>
//                   )}

//                 {/* Changelog Card */}
//                 <Card
//                   style={{
//                     marginBottom: 24,
//                     borderRadius: 12,
//                     boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <RocketOutlined
//                       style={{
//                         fontSize: 20,
//                         color: "#52c41a",
//                         marginRight: 12,
//                       }}
//                     />
//                     <Title level={4} style={{ margin: 0 }}>
//                       Changelog
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 16px 0" }} />

//                   {selectedRelease.newFeatures &&
//                     renderEditorContent(selectedRelease.newFeatures) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <PlusOutlined
//                             style={{ color: "#52c41a", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             New Features
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                             marginLeft: 24,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.newFeatures)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.improvements &&
//                     renderEditorContent(selectedRelease.improvements) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <RocketOutlined
//                             style={{ color: "#1890ff", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             Improvements
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                             marginLeft: 24,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.improvements)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.bugFixes &&
//                     renderEditorContent(selectedRelease.bugFixes) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <BugOutlined
//                             style={{ color: "#ff4d4f", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             Bug Fixes
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                             marginLeft: 24,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.bugFixes)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.breakingChanges &&
//                     renderEditorContent(selectedRelease.breakingChanges) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <WarningOutlined
//                             style={{ color: "#ff4d4f", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             Breaking Changes
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                             marginLeft: 24,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 14, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.breakingChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Technical Notes Card */}
//                 <Card
//                   style={{
//                     marginBottom: 24,
//                     borderRadius: 12,
//                     boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 24 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <CodeOutlined
//                       style={{
//                         fontSize: 20,
//                         color: "#722ed1",
//                         marginRight: 12,
//                       }}
//                     />
//                     <Title level={4} style={{ margin: 0 }}>
//                       Technical Notes
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 16px 0" }} />

//                   {selectedRelease.apiChanges &&
//                     renderEditorContent(selectedRelease.apiChanges) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <ApiOutlined
//                             style={{ color: "#722ed1", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             API Changes
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                             fontFamily: "monospace",
//                             fontSize: 13,
//                           }}
//                         >
//                           <Text style={{ whiteSpace: "pre-wrap" }}>
//                             {renderEditorContent(selectedRelease.apiChanges)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.databaseChanges &&
//                     renderEditorContent(selectedRelease.databaseChanges) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <DatabaseOutlined
//                             style={{ color: "#13c2c2", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             Database Changes
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                           }}
//                         >
//                           <Text style={{ whiteSpace: "pre-wrap" }}>
//                             {renderEditorContent(
//                               selectedRelease.databaseChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.knownIssues &&
//                     renderEditorContent(selectedRelease.knownIssues) && (
//                       <div style={{ marginBottom: 24 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 12,
//                           }}
//                         >
//                           <ExclamationCircleOutlined
//                             style={{ color: "#fa8c16", marginRight: 8 }}
//                           />
//                           <Title level={5} style={{ margin: 0 }}>
//                             Known Issues
//                           </Title>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 16,
//                             borderRadius: 8,
//                           }}
//                         >
//                           <Text style={{ whiteSpace: "pre-wrap" }}>
//                             {renderEditorContent(selectedRelease.knownIssues)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Linked Items Card */}
//                 {(selectedRelease.linkedTickets?.length > 0 ||
//                   selectedRelease.repositories?.length > 0 ||
//                   selectedRelease.pullRequests?.length > 0) && (
//                   <Card
//                     style={{
//                       marginBottom: 24,
//                       borderRadius: 12,
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 24 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 16,
//                       }}
//                     >
//                       <LinkOutlined
//                         style={{
//                           fontSize: 20,
//                           color: "#1890ff",
//                           marginRight: 12,
//                         }}
//                       />
//                       <Title level={4} style={{ margin: 0 }}>
//                         Linked Items
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 16px 0" }} />

//                     {selectedRelease.linkedTickets?.length > 0 && (
//                       <div style={{ marginBottom: 16 }}>
//                         <Text
//                           strong
//                           style={{ display: "block", marginBottom: 12 }}
//                         >
//                           Tickets
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
//                         >
//                           {selectedRelease.linkedTickets.map((ticket) => (
//                             <Tag
//                               key={ticket}
//                               color="#1890ff"
//                               style={{ padding: "4px 12px", borderRadius: 16 }}
//                               icon={<TagOutlined />}
//                             >
//                               {ticket}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.repositories?.length > 0 && (
//                       <div style={{ marginBottom: 16 }}>
//                         <Text
//                           strong
//                           style={{ display: "block", marginBottom: 12 }}
//                         >
//                           Repositories
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
//                         >
//                           {selectedRelease.repositories.map((repo) => (
//                             <Tag
//                               key={repo}
//                               color="#2db7f5"
//                               style={{ padding: "4px 12px", borderRadius: 16 }}
//                               icon={<GithubOutlined />}
//                             >
//                               {repo}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.pullRequests?.length > 0 && (
//                       <div style={{ marginBottom: 16 }}>
//                         <Text
//                           strong
//                           style={{ display: "block", marginBottom: 12 }}
//                         >
//                           Pull Requests
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
//                         >
//                           {selectedRelease.pullRequests.map((pr) => (
//                             <Tag
//                               key={pr}
//                               color="#87d068"
//                               style={{ padding: "4px 12px", borderRadius: 16 }}
//                               icon={<PullRequestOutlined />}
//                             >
//                               {pr}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 )}

//                 {/* Visibility Card */}
//                 {selectedRelease.visibility?.length > 0 && (
//                   <Card
//                     style={{
//                       marginBottom: 24,
//                       borderRadius: 12,
//                       boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 24 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 16,
//                       }}
//                     >
//                       <EyeOutlined
//                         style={{
//                           fontSize: 20,
//                           color: "#722ed1",
//                           marginRight: 12,
//                         }}
//                       />
//                       <Title level={4} style={{ margin: 0 }}>
//                         Visibility & Audience
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 16px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
//                       {selectedRelease.visibility.map((v) => {
//                         let color = "#1890ff",
//                           icon = <CheckCircleOutlined />,
//                           label = v;
//                         if (v === "INTERNAL") {
//                           color = "#1890ff";
//                           label = "Internal (Team Only)";
//                         } else if (v === "CLIENT") {
//                           color = "#52c41a";
//                           label = "Client Visible";
//                         } else if (v === "PUBLIC") {
//                           color = "#722ed1";
//                           label = "Public";
//                         }
//                         return (
//                           <Tag
//                             key={v}
//                             color={color}
//                             style={{
//                               padding: "8px 16px",
//                               borderRadius: 20,
//                               fontSize: 13,
//                             }}
//                             icon={icon}
//                           >
//                             {label}
//                           </Tag>
//                         );
//                       })}
//                     </div>
//                     <Text
//                       type="secondary"
//                       style={{ display: "block", marginTop: 16, fontSize: 13 }}
//                     >
//                       <ExclamationCircleOutlined style={{ marginRight: 8 }} />
//                       Visibility settings determine who can view this release
//                       note. Multiple options can be selected. Public releases
//                       will appear on your changelog page.
//                     </Text>
//                   </Card>
//                 )}
//               </>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   height: "100%",
//                 }}
//               >
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       {/* Delete Modal */}
//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{ danger: true, loading: deleteReleaseNote.isPending }}
//       >
//         <p>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // ============ HANDLERS ============
//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);
//   const handleSearch = (value: string) => {
//     setSearchTerm(value);
//     setSelectedReleaseId(null);
//   };
//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.repositories?.length) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.pullRequests?.length) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - FLEX LAYOUT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//           maxWidth: "90%", // 80% screen size
//           margin: "0 auto", // center
//           borderLeft: "1px solid #e5e7eb",
//           borderRight: "1px solid #e5e7eb",
//         }}
//       >
//         {/* ===== LEFT PANEL - 280px fixed width (compact) ===== */}
//         <aside
//           style={{
//             width: 280,
//             borderRight: "1px solid #e5e7eb",
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//           }}
//         >
//           <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
//             {/* Release Notes Title - Compact */}
//             <Space align="center" style={{ marginBottom: 20 }}>
//               <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
//               <Title level={5} style={{ margin: 0, fontSize: 16 }}>
//                 Release Notes
//               </Title>
//             </Space>

//             {/* Project Selector - Compact */}
//             <Select
//               placeholder="Select Project"
//               style={{ width: "100%" }}
//               size="small"
//               loading={loadingProjects}
//               showSearch
//               optionFilterProp="children"
//               onChange={handleProjectChange}
//               allowClear
//               value={selectedProject}
//             >
//               {projects.map((project) => (
//                 <Select.Option key={project.id} value={project.id}>
//                   {project.name}
//                 </Select.Option>
//               ))}
//             </Select>

//             <Divider style={{ margin: "16px 0" }} />

//             {/* Search - Compact */}
//             <Input.Search
//               placeholder="Search versions..."
//               onSearch={handleSearch}
//               onChange={(e) => !e.target.value && handleSearch("")}
//               allowClear
//               size="small"
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {/* Versions List - Compact */}
//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "30px 0" }}>
//                 <Spin size="small" />
//                 <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
//                 <p style={{ fontSize: 13 }}>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description="No releases found"
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 60 }}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 20 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 11, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 6 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "10px",
//                           borderRadius: 6,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 4,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             marginBottom: 2,
//                             fontSize: 13,
//                           }}
//                         >
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{ fontSize: 10, padding: "0 4px", height: 18, lineHeight: "16px" }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 10, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </aside>

//         {/* ===== RIGHT PANEL - Takes remaining width ===== */}
//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           {/* ===== COMPACT HEADER - Image style ===== */}
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             {/* LEFT: Title + Status + Details | RIGHT: Create | Edit | ... */}
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//               {/* LEFT SECTION - Title, Status, Metadata */}
//               <div style={{ flex: 1 }}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin size="small" />
//                 ) : selectedRelease ? (
//                   <>
//                     {/* Title and Status - Compact */}
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Title level={4} style={{ margin: 0, fontSize: 20 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 11,
//                           padding: "0 8px",
//                           height: 22,
//                           lineHeight: "20px",
//                           borderRadius: 4,
//                           fontWeight: 500,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>

//                     {/* Metadata - Compact, inline */}
//                     <Space size={[12, 4]} wrap>
//                       <Space size={4}>
//                         <CalendarOutlined style={{ fontSize: 12, color: "#1890ff" }} />
//                         <Text type="secondary" style={{ fontSize: 12 }}>v{selectedRelease.version}</Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined style={{ fontSize: 12, color: "#52c41a" }} />
//                         <Text style={{ fontSize: 12 }}>{dayjs(selectedRelease.releaseDate).format("MMM D, YYYY")}</Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined style={{ fontSize: 12, color: "#722ed1" }} />
//                         <Tag
//                           color={getEnvironmentColor(selectedRelease.environment)}
//                           style={{ fontSize: 11, padding: "0 6px", height: 20, lineHeight: "18px" }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined style={{ fontSize: 12, color: "#fa8c16" }} />
//                         <Text style={{ fontSize: 12 }}>{selectedRelease.project?.name}</Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     {selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"}
//                   </Text>
//                 )}
//               </div>

//               {/* RIGHT SECTION - Action Buttons */}
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="small"
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create
//                 </Button>

//                 {selectedRelease && (
//                   <Button
//                     icon={<EditOutlined />}
//                     size="small"
//                     onClick={handleEdit}
//                   >
//                     Edit
//                   </Button>
//                 )}

//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "archive",
//                         label: "Archive",
//                         disabled: true,
//                       },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems,
//                       },
//                       {
//                         key: "delete",
//                         label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                         onClick: () => showDeleteConfirm(selectedRelease?.id),
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} size="small" type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           {/* ===== CONTENT CARDS - Compact ===== */}
//           <div
//             style={{
//               padding: "20px 24px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 {/* Release Summary Card - Compact */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <BookOutlined style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }} />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>Release Summary</Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 12,
//                       borderRadius: 6,
//                       borderLeft: "3px solid #1890ff",
//                       fontSize: 13,
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                       {renderEditorContent(selectedRelease.summary) || "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {/* Key Insights Card - Compact */}
//                 {selectedRelease.keyInsights && renderEditorContent(selectedRelease.keyInsights) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <BulbOutlined style={{ fontSize: 16, color: "#faad14", marginRight: 8 }} />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>Key Insights</Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div
//                       style={{
//                         background: "#fafafa",
//                         padding: 12,
//                         borderRadius: 6,
//                         borderLeft: "3px solid #faad14",
//                         fontSize: 13,
//                         lineHeight: 1.6,
//                       }}
//                     >
//                       <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                         {renderEditorContent(selectedRelease.keyInsights)}
//                       </Text>
//                     </div>
//                   </Card>
//                 )}

//                 {/* Changelog Card - Compact */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <RocketOutlined style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }} />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>Changelog</Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.newFeatures && renderEditorContent(selectedRelease.newFeatures) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <PlusOutlined style={{ fontSize: 12, color: "#52c41a", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>New Features</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.newFeatures)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {selectedRelease.improvements && renderEditorContent(selectedRelease.improvements) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <RocketOutlined style={{ fontSize: 12, color: "#1890ff", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>Improvements</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.improvements)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {selectedRelease.bugFixes && renderEditorContent(selectedRelease.bugFixes) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <BugOutlined style={{ fontSize: 12, color: "#ff4d4f", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>Bug Fixes</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.bugFixes)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {selectedRelease.breakingChanges && renderEditorContent(selectedRelease.breakingChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <WarningOutlined style={{ fontSize: 12, color: "#ff4d4f", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>Breaking Changes</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.breakingChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}
//                 </Card>

//                 {/* Technical Notes Card - Compact */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <CodeOutlined style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }} />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>Technical Notes</Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.apiChanges && renderEditorContent(selectedRelease.apiChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <ApiOutlined style={{ fontSize: 12, color: "#722ed1", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>API Changes</Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontFamily: "monospace",
//                           fontSize: 12,
//                           marginLeft: 20,
//                         }}
//                       >
//                         <Text style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.apiChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {selectedRelease.databaseChanges && renderEditorContent(selectedRelease.databaseChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <DatabaseOutlined style={{ fontSize: 12, color: "#13c2c2", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>Database Changes</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.databaseChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {selectedRelease.knownIssues && renderEditorContent(selectedRelease.knownIssues) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
//                         <ExclamationCircleOutlined style={{ fontSize: 12, color: "#fa8c16", marginRight: 6 }} />
//                         <Text strong style={{ fontSize: 13 }}>Known Issues</Text>
//                       </div>
//                       <div style={{ background: "#fafafa", padding: 12, borderRadius: 6, marginLeft: 20, fontSize: 13 }}>
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.knownIssues)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}
//                 </Card>

//                 {/* Linked Items Card - Compact */}
//                 {(selectedRelease.linkedTickets?.length > 0 ||
//                   selectedRelease.repositories?.length > 0 ||
//                   selectedRelease.pullRequests?.length > 0) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <LinkOutlined style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }} />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>Linked Items</Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />

//                     {selectedRelease.linkedTickets?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Tickets</Text>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                           {selectedRelease.linkedTickets.map((ticket) => (
//                             <Tag
//                               key={ticket}
//                               color="#1890ff"
//                               style={{ fontSize: 11, padding: "0 8px", borderRadius: 12, height: 22, lineHeight: "20px" }}
//                               icon={<TagOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {ticket}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.repositories?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Repositories</Text>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                           {selectedRelease.repositories.map((repo) => (
//                             <Tag
//                               key={repo}
//                               color="#2db7f5"
//                               style={{ fontSize: 11, padding: "0 8px", borderRadius: 12, height: 22, lineHeight: "20px" }}
//                               icon={<GithubOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {repo}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.pullRequests?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>Pull Requests</Text>
//                         <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                           {selectedRelease.pullRequests.map((pr) => (
//                             <Tag
//                               key={pr}
//                               color="#87d068"
//                               style={{ fontSize: 11, padding: "0 8px", borderRadius: 12, height: 22, lineHeight: "20px" }}
//                               icon={<PullRequestOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {pr}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 )}

//                 {/* Visibility Card - Compact */}
//                 {selectedRelease.visibility?.length > 0 && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <EyeOutlined style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }} />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>Visibility & Audience</Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//                       {selectedRelease.visibility.map((v) => {
//                         let color = "#1890ff", icon = <CheckCircleOutlined style={{ fontSize: 12 }} />, label = v;
//                         if (v === "INTERNAL") { color = "#1890ff"; label = "Internal"; }
//                         else if (v === "CLIENT") { color = "#52c41a"; label = "Client"; }
//                         else if (v === "PUBLIC") { color = "#722ed1"; label = "Public"; }
//                         return (
//                           <Tag
//                             key={v}
//                             color={color}
//                             style={{ fontSize: 12, padding: "4px 12px", borderRadius: 16, height: 28, lineHeight: "20px" }}
//                             icon={icon}
//                           >
//                             {label}
//                           </Tag>
//                         );
//                       })}
//                     </div>
//                     <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 12 }}>
//                       <ExclamationCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />
//                       Visibility settings determine who can view this release note.
//                     </Text>
//                   </Card>
//                 )}
//               </>
//             ) : (
//               <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 80 }}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       {/* Delete Modal - Compact */}
//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{ danger: true, loading: deleteReleaseNote.isPending, size: "small" }}
//         width={400}
//       >
//         <p style={{ fontSize: 13 }}>
//           Are you sure you want to delete this release note? This action cannot be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // ============ HANDLERS ============

//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);

//   // ✅ SEARCH BY TITLE
//   const handleSearch = (value: string) => {
//     console.log("🔍 Searching releases by title:", value);
//     setSearchTerm(value);
//   };

//   // ✅ CLEAR SEARCH - FIXED! (was missing)
//   const handleSearchClear = () => {
//     console.log("🧹 Search cleared");
//     setSearchTerm("");
//   };

//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.repositories?.length) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.pullRequests?.length) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - NO GAP BETWEEN LEFT & RIGHT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//           width: "100%", // Full width
//           borderTop: "1px solid #e5e7eb", // Top border only
//         }}
//       >
//         {/* ===== LEFT PANEL - NO RIGHT BORDER (removed) ===== */}
//         <aside
//           style={{
//             width: 280,
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//             borderRight: "none",
//           }}
//         >
//           <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
//             {/* ✅ RELEASE NOTES TITLE WITH SEARCH INPUT - SEARCH BY TITLE */}
//             <div style={{ marginBottom: 20 }}>
//               <Space align="center" style={{ marginBottom: 8 }}>
//                 <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
//                 <Title level={5} style={{ margin: 0, fontSize: 16 }}>
//                   Release Notes
//                 </Title>
//               </Space>

//               {/* Project Selector */}
//               <Select
//                 placeholder="Select Project"
//                 style={{ width: "100%" }}
//                 size="small"
//                 loading={loadingProjects}
//                 showSearch
//                 optionFilterProp="children"
//                 onChange={handleProjectChange}
//                 allowClear
//                 value={selectedProject}
//               >
//                 {projects.map((project) => (
//                   <Select.Option key={project.id} value={project.id}>
//                     {project.name}
//                   </Select.Option>
//                 ))}
//               </Select>
//             </div>
//             {/* ✅ SEARCH INPUT - FILTER RELEASES BY TITLE */}
//               <Input.Search
//               placeholder="Search releases by title..."
//               onSearch={handleSearch}
//               onChange={(e) => {
//                 if (e.target.value) {
//                   handleSearchClear();
//                 }
//               }}
//               allowClear
//               size="small"
//               style={{ width: "100%" }}
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {/* Versions List - Filtered by RELEASE TITLE searchTerm */}
//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "30px 0" }}>
//                 <Spin size="small" />
//                 <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
//                 <p style={{ fontSize: 13 }}>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description={
//                     searchTerm
//                       ? `No releases found with title "${searchTerm}"`
//                       : "No releases found"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 60 }}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 20 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 11, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 6 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "10px",
//                           borderRadius: 6,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 4,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             marginBottom: 2,
//                             fontSize: 13,
//                           }}
//                         >
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{
//                               fontSize: 10,
//                               padding: "0 4px",
//                               height: 18,
//                               lineHeight: "16px",
//                             }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 10, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}

//             {/* Show search term indicator when searching */}
//             {searchTerm && groupedReleases.length > 0 && (
//               <div
//                 style={{
//                   marginTop: 16,
//                   padding: "8px 0",
//                   borderTop: "1px dashed #e5e7eb",
//                   fontSize: 11,
//                   color: "#999",
//                 }}
//               >
//                 <Text type="secondary">
//                   Searching by title:{" "}
//                   <Text code style={{ fontSize: 11 }}>
//                     {searchTerm}
//                   </Text>
//                 </Text>
//               </div>
//             )}
//           </div>
//         </aside>

//         {/* ===== VERTICAL DIVIDER - SEPARATE LINE ===== */}
//         <div style={{ width: "1px", background: "#e5e7eb", height: "100%" }} />

//         {/* ===== RIGHT PANEL ===== */}
//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-start",
//               }}
//             >
//               {/* LEFT SECTION */}
//               <div style={{ flex: 1 }}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin size="small" />
//                 ) : selectedRelease ? (
//                   <>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Title level={4} style={{ margin: 0, fontSize: 22 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 11,
//                           padding: "0 8px",
//                           height: 20,
//                           lineHeight: "20px",
//                           borderRadius: 4,
//                           fontWeight: 500,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>
//                     <Space size={[12, 4]} wrap>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#1890ff" }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           v{selectedRelease.version}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#52c41a" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {dayjs(selectedRelease.releaseDate).format(
//                             "MMM D, YYYY",
//                           )}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined
//                           style={{ fontSize: 12, color: "#722ed1" }}
//                         />
//                         <Tag
//                           color={getEnvironmentColor(
//                             selectedRelease.environment,
//                           )}
//                           style={{
//                             fontSize: 11,
//                             padding: "0 6px",
//                             height: 20,
//                             lineHeight: "18px",
//                           }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined
//                           style={{ fontSize: 12, color: "#fa8c16" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {selectedRelease.project?.name}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     {selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"}
//                   </Text>
//                 )}
//               </div>

//               {/* RIGHT SECTION */}
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="small"
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create
//                 </Button>
//                 {selectedRelease && (
//                   <Button
//                     icon={<EditOutlined />}
//                     size="small"
//                     onClick={handleEdit}
//                   >
//                     Edit
//                   </Button>
//                 )}
//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       { key: "archive", label: "Archive", disabled: true },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems,
//                       },
//                       {
//                         key: "delete",
//                         label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                         onClick: () => showDeleteConfirm(selectedRelease?.id),
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} size="small" type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           {/* Content Cards */}
//           <div
//             style={{
//               padding: "20px 24px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 {/* Release Summary Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <BookOutlined
//                       style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Release Summary
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 12,
//                       borderRadius: 6,
//                       borderLeft: "3px solid #1890ff",
//                       fontSize: 13,
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                       {renderEditorContent(selectedRelease.summary) ||
//                         "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {/* Key Insights Card */}
//                 {selectedRelease.keyInsights &&
//                   renderEditorContent(selectedRelease.keyInsights) && (
//                     <Card
//                       size="small"
//                       style={{
//                         marginBottom: 16,
//                         borderRadius: 8,
//                         boxShadow: "none",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 16 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <BulbOutlined
//                           style={{
//                             fontSize: 16,
//                             color: "#faad14",
//                             marginRight: 8,
//                           }}
//                         />
//                         <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                           Key Insights
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 12px 0" }} />
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           borderLeft: "3px solid #faad14",
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.keyInsights)}
//                         </Text>
//                       </div>
//                     </Card>
//                   )}

//                 {/* Changelog Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <RocketOutlined
//                       style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Changelog
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.newFeatures &&
//                     renderEditorContent(selectedRelease.newFeatures) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <PlusOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#52c41a",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             New Features
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid  green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.newFeatures)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.improvements &&
//                     renderEditorContent(selectedRelease.improvements) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <RocketOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#1890ff",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Improvements
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid #1890ff",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.improvements)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.bugFixes &&
//                     renderEditorContent(selectedRelease.bugFixes) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <BugOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Bug Fixes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid red",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.bugFixes)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.breakingChanges &&
//                     renderEditorContent(selectedRelease.breakingChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <WarningOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Breaking Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             borderLeft: "3px solid red",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.breakingChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Technical Notes Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <CodeOutlined
//                       style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Technical Notes
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.apiChanges &&
//                     renderEditorContent(selectedRelease.apiChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ApiOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#722ed1",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             API Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontFamily: "monospace",
//                             fontSize: 12,
//                             //marginLeft: 20,
//                             borderLeft: "3px solid violet",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 12, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.apiChanges)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.databaseChanges &&
//                     renderEditorContent(selectedRelease.databaseChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <DatabaseOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#13c2c2",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Database Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid light green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.databaseChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.knownIssues &&
//                     renderEditorContent(selectedRelease.knownIssues) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ExclamationCircleOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#fa8c16",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Known Issues
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             lineHeight: 1.6,
//                             fontSize: 13,
//                             borderLeft: "3px solid orange",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.knownIssues)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Linked Items Card */}
//                 {(selectedRelease.linkedTickets?.length > 0 ||
//                   selectedRelease.repositories?.length > 0 ||
//                   selectedRelease.pullRequests?.length > 0) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <LinkOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#1890ff",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Linked Items
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />

//                     {selectedRelease.linkedTickets?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Tickets
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.linkedTickets.map((ticket) => (
//                             <Tag
//                               key={ticket}
//                               color="#1890ff"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<TagOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {ticket}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.repositories?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Repositories
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.repositories.map((repo) => (
//                             <Tag
//                               key={repo}
//                               color="#2db7f5"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<GithubOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {repo}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.pullRequests?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Pull Requests
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.pullRequests.map((pr) => (
//                             <Tag
//                               key={pr}
//                               color="#87d068"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={
//                                 <PullRequestOutlined style={{ fontSize: 11 }} />
//                               }
//                             >
//                               {pr}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 )}

//                 {/* Visibility Card */}
//                 {selectedRelease.visibility?.length > 0 && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <EyeOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#722ed1",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Visibility & Audience
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//                       {selectedRelease.visibility.map((v) => {
//                         let color = "#1890ff",
//                           icon = (
//                             <CheckCircleOutlined style={{ fontSize: 12 }} />
//                           ),
//                           label = v;
//                         if (v === "INTERNAL") {
//                           color = "#1890ff";
//                           label = "Internal";
//                         } else if (v === "CLIENT") {
//                           color = "#52c41a";
//                           label = "Client";
//                         } else if (v === "PUBLIC") {
//                           color = "#722ed1";
//                           label = "Public";
//                         }
//                         return (
//                           <Tag
//                             key={v}
//                             color={color}
//                             style={{
//                               fontSize: 12,
//                               padding: "4px 12px",
//                               borderRadius: 16,
//                               height: 28,
//                               lineHeight: "20px",
//                             }}
//                             icon={icon}
//                           >
//                             {label}
//                           </Tag>
//                         );
//                       })}
//                     </div>
//                     <Text
//                       type="secondary"
//                       style={{ display: "block", marginTop: 12, fontSize: 12 }}
//                     >
//                       <ExclamationCircleOutlined
//                         style={{ marginRight: 6, fontSize: 12 }}
//                       />
//                       Visibility settings determine who can view this release
//                       note.
//                     </Text>
//                   </Card>
//                 )}
//               </>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   height: "100%",
//                 }}
//               >
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 80 }}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       {/* Delete Modal */}
//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{
//           danger: true,
//           loading: deleteReleaseNote.isPending,
//           size: "small",
//         }}
//         width={400}
//       >
//         <p style={{ fontSize: 13 }}>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // ============ HANDLERS ============

//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//     setSearchTerm(""); // Clear search when changing projects
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);

//   // ✅ SEARCH BY TITLE
//   const handleSearch = (value: string) => {
//     console.log("🔍 Searching releases by title:", value);
//     setSearchTerm(value);
//   };

//   // ✅ CLEAR SEARCH - FIXED!
//   const handleSearchClear = () => {
//     console.log("🧹 Search cleared");
//     setSearchTerm("");
//   };

//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.repositories?.length) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.pullRequests?.length) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (selectedRelease.linkedTickets?.length) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - NO GAP BETWEEN LEFT & RIGHT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//           width: "100%", // Full width
//           borderTop: "1px solid #e5e7eb", // Top border only
//         }}
//       >
//         {/* ===== LEFT PANEL - NO RIGHT BORDER (removed) ===== */}
//         <aside
//           style={{
//             width: 280,
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//             borderRight: "none",
//           }}
//         >
//           <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
//             {/* ✅ RELEASE NOTES TITLE WITH SEARCH INPUT - SEARCH BY TITLE */}
//             <div style={{ marginBottom: 20 }}>
//               <Space align="center" style={{ marginBottom: 8 }}>
//                 <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
//                 <Title level={5} style={{ margin: 0, fontSize: 16 }}>
//                   Release Notes
//                 </Title>
//               </Space>

//               {/* Project Selector */}
//               <Select
//                 placeholder="Select Project"
//                 style={{ width: "100%" }}
//                 size="small"
//                 loading={loadingProjects}
//                 showSearch
//                 optionFilterProp="children"
//                 onChange={handleProjectChange}
//                 allowClear
//                 value={selectedProject}
//               >
//                 {projects.map((project) => (
//                   <Select.Option key={project.id} value={project.id}>
//                     {project.name}
//                   </Select.Option>
//                 ))}
//               </Select>
//             </div>

//             {/* ✅ SEARCH INPUT - FIXED VERSION */}
//             <Input.Search
//               placeholder="Search releases by title..."
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//                 // Auto-search as you type (with debounce if needed)
//                 if (e.target.value === "") {
//                   handleSearchClear();
//                 }
//               }}
//               value={searchTerm}
//               allowClear
//               size="small"
//               style={{ width: "100%" }}
//               onClear={handleSearchClear}
//               // Remove onSearch if you want real-time search
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {/* Versions List - Filtered by RELEASE TITLE searchTerm */}
//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "30px 0" }}>
//                 <Spin size="small" />
//                 <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
//                 <p style={{ fontSize: 13 }}>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description={
//                     searchTerm
//                       ? `No releases found with title "${searchTerm}"`
//                       : "No releases found"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 60 }}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 20 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 11, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 6 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "10px",
//                           borderRadius: 6,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 4,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             marginBottom: 2,
//                             fontSize: 13,
//                           }}
//                         >
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{
//                               fontSize: 10,
//                               padding: "0 4px",
//                               height: 18,
//                               lineHeight: "16px",
//                             }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 10, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}

//             {/* Show search term indicator when searching */}
//             {searchTerm && groupedReleases.length > 0 && (
//               <div
//                 style={{
//                   marginTop: 16,
//                   padding: "8px 0",
//                   borderTop: "1px dashed #e5e7eb",
//                   fontSize: 11,
//                   color: "#999",
//                 }}
//               >
//                 {/* <Text type="secondary">
//                   Searching by title:{" "}
//                   <Text code style={{ fontSize: 11 }}>
//                     {searchTerm}
//                   </Text>
//                 </Text> */}
//               </div>
//             )}
//           </div>
//         </aside>

//         {/* ===== VERTICAL DIVIDER - SEPARATE LINE ===== */}
//         <div style={{ width: "1px", background: "#e5e7eb", height: "100%" }} />

//         {/* ===== RIGHT PANEL ===== */}
//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           {/* Header */}
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-start",
//               }}
//             >
//               {/* LEFT SECTION */}
//               <div style={{ flex: 1 }}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin size="small" />
//                 ) : selectedRelease ? (
//                   <>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Title level={4} style={{ margin: 0, fontSize: 22 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 11,
//                           padding: "0 8px",
//                           height: 20,
//                           lineHeight: "20px",
//                           borderRadius: 4,
//                           fontWeight: 500,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>
//                     <Space size={[12, 4]} wrap>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#1890ff" }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           v{selectedRelease.version}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#52c41a" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {dayjs(selectedRelease.releaseDate).format(
//                             "MMM D, YYYY",
//                           )}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined
//                           style={{ fontSize: 12, color: "#722ed1" }}
//                         />
//                         <Tag
//                           color={getEnvironmentColor(
//                             selectedRelease.environment,
//                           )}
//                           style={{
//                             fontSize: 11,
//                             padding: "0 6px",
//                             height: 20,
//                             lineHeight: "18px",
//                           }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined
//                           style={{ fontSize: 12, color: "#fa8c16" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {selectedRelease.project?.name}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     {selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"}
//                   </Text>
//                 )}
//               </div>

//               {/* RIGHT SECTION */}
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="small"
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create
//                 </Button>
//                 {selectedRelease && (
//                   <Button
//                     icon={<EditOutlined />}
//                     size="small"
//                     onClick={handleEdit}
//                   >
//                     Edit
//                   </Button>
//                 )}
//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       { key: "archive", label: "Archive", disabled: true },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems,
//                       },
//                       {
//                         key: "delete",
//                         label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                         onClick: () => showDeleteConfirm(selectedRelease?.id),
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} size="small" type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           {/* Content Cards */}
//           <div
//             style={{
//               padding: "20px 24px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 {/* Release Summary Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <BookOutlined
//                       style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Release Summary
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 12,
//                       borderRadius: 6,
//                       borderLeft: "3px solid #1890ff",
//                       fontSize: 13,
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                       {renderEditorContent(selectedRelease.summary) ||
//                         "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {/* Key Insights Card */}
//                 {selectedRelease.keyInsights &&
//                   renderEditorContent(selectedRelease.keyInsights) && (
//                     <Card
//                       size="small"
//                       style={{
//                         marginBottom: 16,
//                         borderRadius: 8,
//                         boxShadow: "none",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 16 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <BulbOutlined
//                           style={{
//                             fontSize: 16,
//                             color: "#faad14",
//                             marginRight: 8,
//                           }}
//                         />
//                         <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                           Key Insights
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 12px 0" }} />
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           borderLeft: "3px solid #faad14",
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.keyInsights)}
//                         </Text>
//                       </div>
//                     </Card>
//                   )}

//                 {/* Changelog Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <RocketOutlined
//                       style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Changelog
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.newFeatures &&
//                     renderEditorContent(selectedRelease.newFeatures) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <PlusOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#52c41a",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             New Features
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid  green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.newFeatures)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.improvements &&
//                     renderEditorContent(selectedRelease.improvements) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <RocketOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#1890ff",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Improvements
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid #1890ff",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.improvements)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.bugFixes &&
//                     renderEditorContent(selectedRelease.bugFixes) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <BugOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Bug Fixes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid red",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.bugFixes)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.breakingChanges &&
//                     renderEditorContent(selectedRelease.breakingChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <WarningOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Breaking Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             borderLeft: "3px solid red",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.breakingChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Technical Notes Card */}
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <CodeOutlined
//                       style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Technical Notes
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.apiChanges &&
//                     renderEditorContent(selectedRelease.apiChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ApiOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#722ed1",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             API Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontFamily: "monospace",
//                             fontSize: 12,
//                             //marginLeft: 20,
//                             borderLeft: "3px solid violet",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 12, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.apiChanges)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.databaseChanges &&
//                     renderEditorContent(selectedRelease.databaseChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <DatabaseOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#13c2c2",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Database Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid light green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.databaseChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.knownIssues &&
//                     renderEditorContent(selectedRelease.knownIssues) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ExclamationCircleOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#fa8c16",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Known Issues
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             //marginLeft: 20,
//                             lineHeight: 1.6,
//                             fontSize: 13,
//                             borderLeft: "3px solid orange",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.knownIssues)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Linked Items Card */}
//                 {(selectedRelease.linkedTickets?.length > 0 ||
//                   selectedRelease.repositories?.length > 0 ||
//                   selectedRelease.pullRequests?.length > 0) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <LinkOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#1890ff",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Linked Items
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />

//                     {selectedRelease.linkedTickets?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Tickets
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.linkedTickets.map((ticket) => (
//                             <Tag
//                               key={ticket}
//                               color="#1890ff"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<TagOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {ticket}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.repositories?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Repositories
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.repositories.map((repo) => (
//                             <Tag
//                               key={repo}
//                               color="#2db7f5"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<GithubOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {repo}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.pullRequests?.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Pull Requests
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.pullRequests.map((pr) => (
//                             <Tag
//                               key={pr}
//                               color="#87d068"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={
//                                 <PullRequestOutlined style={{ fontSize: 11 }} />
//                               }
//                             >
//                               {pr}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 )}

//                 {/* Visibility Card */}
//                 {selectedRelease.visibility?.length > 0 && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <EyeOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#722ed1",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Visibility & Audience
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//                       {selectedRelease.visibility.map((v) => {
//                         let color = "#1890ff",
//                           icon = (
//                             <CheckCircleOutlined style={{ fontSize: 12 }} />
//                           ),
//                           label = v;
//                         if (v === "INTERNAL") {
//                           color = "#1890ff";
//                           label = "Internal";
//                         } else if (v === "CLIENT") {
//                           color = "#52c41a";
//                           label = "Client";
//                         } else if (v === "PUBLIC") {
//                           color = "#722ed1";
//                           label = "Public";
//                         }
//                         return (
//                           <Tag
//                             key={v}
//                             color={color}
//                             style={{
//                               fontSize: 12,
//                               padding: "4px 12px",
//                               borderRadius: 16,
//                               height: 28,
//                               lineHeight: "20px",
//                             }}
//                             icon={icon}
//                           >
//                             {label}
//                           </Tag>
//                         );
//                       })}
//                     </div>
//                     <Text
//                       type="secondary"
//                       style={{ display: "block", marginTop: 12, fontSize: 12 }}
//                     >
//                       <ExclamationCircleOutlined
//                         style={{ marginRight: 6, fontSize: 12 }}
//                       />
//                       Visibility settings determine who can view this release
//                       note.
//                     </Text>
//                   </Card>
//                 )}
//               </>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   height: "100%",
//                 }}
//               >
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 80 }}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       {/* Delete Modal */}
//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{
//           danger: true,
//           loading: deleteReleaseNote.isPending,
//           size: "small",
//         }}
//         width={400}
//       >
//         <p style={{ fontSize: 13 }}>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// interface Project {
//   id: string;
//   name: string;
//   tenantId: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];
//         setProjects(projectsData);
//         if (projectsData.length > 0 && !selectedProject) {
//           setSelectedProject(projectsData[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     if (
//       releaseNotesData?.data?.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // ============ HANDLERS ============

//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//     setSearchTerm(""); // Clear search when changing projects
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);

//   // ✅ SEARCH BY TITLE
//   const handleSearch = (value: string) => {
//     console.log("🔍 Searching releases by title:", value);
//     setSearchTerm(value);
//   };

//   // ✅ CLEAR SEARCH - FIXED!
//   const handleSearchClear = () => {
//     console.log("🧹 Search cleared");
//     setSearchTerm("");
//   };

//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (selectedRelease.linkedTickets && selectedRelease.linkedTickets.length > 0) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.repositories && selectedRelease.repositories.length > 0) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (selectedRelease.pullRequests && selectedRelease.pullRequests.length > 0) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (selectedRelease.linkedTickets && selectedRelease.linkedTickets.length > 0) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - NO GAP BETWEEN LEFT & RIGHT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//           width: "100%",
//           borderTop: "1px solid #e5e7eb",
//         }}
//       >
//         {/* ===== LEFT PANEL ===== */}
//         <aside
//           style={{
//             width: 280,
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//             borderRight: "none",
//           }}
//         >
//           <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
//             <div style={{ marginBottom: 20 }}>
//               <Space align="center" style={{ marginBottom: 8 }}>
//                 <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
//                 <Title level={5} style={{ margin: 0, fontSize: 16 }}>
//                   Release Notes
//                 </Title>
//               </Space>

//               <Select
//                 placeholder="Select Project"
//                 style={{ width: "100%" }}
//                 size="small"
//                 loading={loadingProjects}
//                 showSearch
//                 optionFilterProp="children"
//                 onChange={handleProjectChange}
//                 allowClear
//                 value={selectedProject}
//               >
//                 {projects.map((project) => (
//                   <Select.Option key={project.id} value={project.id}>
//                     {project.name}
//                   </Select.Option>
//                 ))}
//               </Select>
//             </div>

//             <Input.Search
//               placeholder="Search releases by title..."
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//                 if (e.target.value === "") {
//                   handleSearchClear();
//                 }
//               }}
//               value={searchTerm}
//               allowClear
//               size="small"
//               style={{ width: "100%" }}
//               onClear={handleSearchClear}
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "30px 0" }}>
//                 <Spin size="small" />
//                 <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
//                 <p style={{ fontSize: 13 }}>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description={
//                     searchTerm
//                       ? `No releases found with title "${searchTerm}"`
//                       : "No releases found"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 60 }}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 20 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 11, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 6 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "10px",
//                           borderRadius: 6,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 4,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             marginBottom: 2,
//                             fontSize: 13,
//                           }}
//                         >
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{
//                               fontSize: 10,
//                               padding: "0 4px",
//                               height: 18,
//                               lineHeight: "16px",
//                             }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 10, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </aside>

//         <div style={{ width: "1px", background: "#e5e7eb", height: "100%" }} />

//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-start",
//               }}
//             >
//               <div style={{ flex: 1 }}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin size="small" />
//                 ) : selectedRelease ? (
//                   <>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Title level={4} style={{ margin: 0, fontSize: 22 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 11,
//                           padding: "0 8px",
//                           height: 20,
//                           lineHeight: "20px",
//                           borderRadius: 4,
//                           fontWeight: 500,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>
//                     <Space size={[12, 4]} wrap>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#1890ff" }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           v{selectedRelease.version}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#52c41a" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {dayjs(selectedRelease.releaseDate).format(
//                             "MMM D, YYYY",
//                           )}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined
//                           style={{ fontSize: 12, color: "#722ed1" }}
//                         />
//                         <Tag
//                           color={getEnvironmentColor(
//                             selectedRelease.environment,
//                           )}
//                           style={{
//                             fontSize: 11,
//                             padding: "0 6px",
//                             height: 20,
//                             lineHeight: "18px",
//                           }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined
//                           style={{ fontSize: 12, color: "#fa8c16" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {selectedRelease.project?.name}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     {selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"}
//                   </Text>
//                 )}
//               </div>

//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="small"
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create
//                 </Button>
//                 {selectedRelease && (
//                   <Button
//                     icon={<EditOutlined />}
//                     size="small"
//                     onClick={handleEdit}
//                   >
//                     Edit
//                   </Button>
//                 )}
//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       { key: "archive", label: "Archive", disabled: true },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems,
//                       },
//                       {
//                         key: "delete",
//                         label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                         onClick: () => showDeleteConfirm(selectedRelease?.id),
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} size="small" type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           <div
//             style={{
//               padding: "20px 24px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <BookOutlined
//                       style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Release Summary
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 12,
//                       borderRadius: 6,
//                       borderLeft: "3px solid #1890ff",
//                       fontSize: 13,
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                       {renderEditorContent(selectedRelease.summary) ||
//                         "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {selectedRelease.keyInsights &&
//                   renderEditorContent(selectedRelease.keyInsights) && (
//                     <Card
//                       size="small"
//                       style={{
//                         marginBottom: 16,
//                         borderRadius: 8,
//                         boxShadow: "none",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 16 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <BulbOutlined
//                           style={{
//                             fontSize: 16,
//                             color: "#faad14",
//                             marginRight: 8,
//                           }}
//                         />
//                         <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                           Key Insights
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 12px 0" }} />
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           borderLeft: "3px solid #faad14",
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.keyInsights)}
//                         </Text>
//                       </div>
//                     </Card>
//                   )}

//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <RocketOutlined
//                       style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Changelog
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.newFeatures &&
//                     renderEditorContent(selectedRelease.newFeatures) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <PlusOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#52c41a",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             New Features
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid  green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.newFeatures)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.improvements &&
//                     renderEditorContent(selectedRelease.improvements) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <RocketOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#1890ff",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Improvements
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid #1890ff",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.improvements)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.bugFixes &&
//                     renderEditorContent(selectedRelease.bugFixes) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <BugOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Bug Fixes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid red",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.bugFixes)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.breakingChanges &&
//                     renderEditorContent(selectedRelease.breakingChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <WarningOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#ff4d4f",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Breaking Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontSize: 13,
//                             borderLeft: "3px solid red",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.breakingChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <CodeOutlined
//                       style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Technical Notes
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {selectedRelease.apiChanges &&
//                     renderEditorContent(selectedRelease.apiChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ApiOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#722ed1",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             API Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontFamily: "monospace",
//                             fontSize: 12,
//                             borderLeft: "3px solid violet",
//                             lineHeight: 1.6,
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 12, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.apiChanges)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.databaseChanges &&
//                     renderEditorContent(selectedRelease.databaseChanges) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <DatabaseOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#13c2c2",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Database Changes
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             fontSize: 13,
//                             lineHeight: 1.6,
//                             borderLeft: "3px solid light green",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(
//                               selectedRelease.databaseChanges,
//                             )}
//                           </Text>
//                         </div>
//                       </div>
//                     )}

//                   {selectedRelease.knownIssues &&
//                     renderEditorContent(selectedRelease.knownIssues) && (
//                       <div style={{ marginBottom: 16 }}>
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             marginBottom: 8,
//                           }}
//                         >
//                           <ExclamationCircleOutlined
//                             style={{
//                               fontSize: 12,
//                               color: "#fa8c16",
//                               marginRight: 6,
//                             }}
//                           />
//                           <Text strong style={{ fontSize: 13 }}>
//                             Known Issues
//                           </Text>
//                         </div>
//                         <div
//                           style={{
//                             background: "#fafafa",
//                             padding: 12,
//                             borderRadius: 6,
//                             lineHeight: 1.6,
//                             fontSize: 13,
//                             borderLeft: "3px solid orange",
//                           }}
//                         >
//                           <Text
//                             style={{ fontSize: 13, whiteSpace: "pre-wrap" }}
//                           >
//                             {renderEditorContent(selectedRelease.knownIssues)}
//                           </Text>
//                         </div>
//                       </div>
//                     )}
//                 </Card>

//                 {/* Linked Items Card - FIXED TypeScript errors */}
//                 {((selectedRelease.linkedTickets && selectedRelease.linkedTickets.length > 0) ||
//                   (selectedRelease.repositories && selectedRelease.repositories.length > 0) ||
//                   (selectedRelease.pullRequests && selectedRelease.pullRequests.length > 0)) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <LinkOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#1890ff",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Linked Items
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />

//                     {selectedRelease.linkedTickets && selectedRelease.linkedTickets.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Tickets
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.linkedTickets.map((ticket) => (
//                             <Tag
//                               key={ticket}
//                               color="#1890ff"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<TagOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {ticket}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.repositories && selectedRelease.repositories.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Repositories
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.repositories.map((repo) => (
//                             <Tag
//                               key={repo}
//                               color="#2db7f5"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={<GithubOutlined style={{ fontSize: 11 }} />}
//                             >
//                               {repo}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {selectedRelease.pullRequests && selectedRelease.pullRequests.length > 0 && (
//                       <div style={{ marginBottom: 12 }}>
//                         <Text
//                           strong
//                           style={{
//                             display: "block",
//                             marginBottom: 8,
//                             fontSize: 13,
//                           }}
//                         >
//                           Pull Requests
//                         </Text>
//                         <div
//                           style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
//                         >
//                           {selectedRelease.pullRequests.map((pr) => (
//                             <Tag
//                               key={pr}
//                               color="#87d068"
//                               style={{
//                                 fontSize: 11,
//                                 padding: "0 8px",
//                                 borderRadius: 12,
//                                 height: 22,
//                                 lineHeight: "20px",
//                               }}
//                               icon={
//                                 <PullRequestOutlined style={{ fontSize: 11 }} />
//                               }
//                             >
//                               {pr}
//                             </Tag>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </Card>
//                 )}

//                 {selectedRelease.visibility && selectedRelease.visibility.length > 0 && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <EyeOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#722ed1",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Visibility & Audience
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//                       {selectedRelease.visibility.map((v) => {
//                         let color = "#1890ff";
//                         let icon = <CheckCircleOutlined style={{ fontSize: 12 }} />;
//                         let label = v;

//                         if (v === "INTERNAL") {
//                           color = "#1890ff";
//                           label = "Internal";
//                         } else if (v === "CLIENT") {
//                           color = "#52c41a";
//                           label = "Client";
//                         } else if (v === "PUBLIC") {
//                           color = "#722ed1";
//                           label = "Public";
//                         }

//                         return (
//                           <Tag
//                             key={v}
//                             color={color}
//                             style={{
//                               fontSize: 12,
//                               padding: "4px 12px",
//                               borderRadius: 16,
//                               height: 28,
//                               lineHeight: "20px",
//                             }}
//                             icon={icon}
//                           >
//                             {label}
//                           </Tag>
//                         );
//                       })}
//                     </div>
//                     <Text
//                       type="secondary"
//                       style={{ display: "block", marginTop: 12, fontSize: 12 }}
//                     >
//                       <ExclamationCircleOutlined
//                         style={{ marginRight: 6, fontSize: 12 }}
//                       />
//                       Visibility settings determine who can view this release
//                       note.
//                     </Text>
//                   </Card>
//                 )}
//               </>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   height: "100%",
//                 }}
//               >
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 80 }}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{
//           danger: true,
//           loading: deleteReleaseNote.isPending,
//           size: "small",
//         }}
//         width={400}
//       >
//         <p style={{ fontSize: 13 }}>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
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
//   Select,
//   Input,
//   Dropdown,
//   Card,
//   Spin,
//   Empty,
//   message,
//   Modal,
//   Tag,
// } from "antd";
// const { Title, Text } = Typography;
// import {
//   FileTextOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ShareAltOutlined,
//   DownloadOutlined,
//   MoreOutlined,
//   LoadingOutlined,
//   BulbOutlined,
//   RocketOutlined,
//   BugOutlined,
//   WarningOutlined,
//   ApiOutlined,
//   DatabaseOutlined,
//   ExclamationCircleOutlined,
//   LinkOutlined,
//   GithubOutlined,
//   PullRequestOutlined,
//   EyeOutlined,
//   CheckCircleOutlined,
//   BookOutlined,
//   CodeOutlined,
//   TagOutlined,
//   CalendarOutlined,
//   EnvironmentOutlined,
//   ProjectOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { ProjectService } from "@/services/projectService";
// import {
//   useReleaseNotes,
//   useDeleteReleaseNote,
//   useReleaseNote,
// } from "@/hooks/usereleasenotes";
// import dayjs from "dayjs";

// // Import the Project type from the service
// import { Project as ServiceProject } from "@/services/projectService";

// interface Project {
//   id: string;
//   name: string;
// }

// interface ReleaseNote {
//   id: string;
//   title: string;
//   version: string;
//   releaseDate: string;
//   status: string;
//   summary?: any;
//   keyInsights?: any;
//   newFeatures?: any;
//   improvements?: any;
//   bugFixes?: any;
//   breakingChanges?: any;
//   apiChanges?: any;
//   databaseChanges?: any;
//   knownIssues?: any;
//   project?: {
//     id: string;
//     name: string;
//   };
//   linkedTickets?: string[];
//   repositories?: string[];
//   pullRequests?: string[];
//   environment: string;
//   visibility: string[];
//   createdBy: string;
//   createdAt: string;
// }

// export default function ReleaseNotesPage() {
//   const router = useRouter();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [selectedProject, setSelectedProject] = useState<string | null>(null);
//   const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
//     null,
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(true);

//   // ============ API CALLS ============
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         setLoadingProjects(true);
//         const response = await ProjectService.getProjects();
//         const projectsData = response.data || [];

//         // Map the service project type to your local Project interface
//         const mappedProjects: Project[] = projectsData.map(
//           (p: ServiceProject) => ({
//             id: p.id,
//             name: p.name,
//           }),
//         );

//         setProjects(mappedProjects);
//         if (mappedProjects.length > 0 && !selectedProject) {
//           setSelectedProject(mappedProjects[0].id);
//         }
//       } catch (error) {
//         console.error("Failed to fetch projects:", error);
//         message.error("Failed to load projects");
//       } finally {
//         setLoadingProjects(false);
//       }
//     };
//     fetchProjects();
//   }, []);

//   const {
//     data: releaseNotesData,
//     isLoading: isLoadingReleaseNotes,
//     refetch: refetchReleaseNotes,
//   } = useReleaseNotes({
//     projectId: selectedProject || undefined,
//     search: searchTerm || undefined,
//     sortBy: "releaseDate",
//     sortOrder: "desc",
//   });

//   useEffect(() => {
//     // Safe check for releaseNotesData and its data property
//     if (
//       releaseNotesData &&
//       releaseNotesData.data &&
//       releaseNotesData.data.length > 0 &&
//       !selectedReleaseId &&
//       isInitialLoad
//     ) {
//       setSelectedReleaseId(releaseNotesData.data[0].id);
//       setIsInitialLoad(false);
//     }
//   }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

//   const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
//     useReleaseNote(selectedReleaseId || undefined);

//   const deleteReleaseNote = useDeleteReleaseNote();

//   // ============ HELPER FUNCTIONS ============
//   const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
//     const groups: { [key: string]: ReleaseNote[] } = {};
//     releases.forEach((release) => {
//       const date = dayjs(release.releaseDate);
//       const monthYear = date.format("MMMM YYYY").toUpperCase();
//       if (!groups[monthYear]) groups[monthYear] = [];
//       groups[monthYear].push(release);
//     });
//     return Object.entries(groups).map(([month, versions]) => ({
//       month,
//       versions: versions.sort(
//         (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
//       ),
//     }));
//   };

//   const extractTextFromBlocks = (blocks: any[]): string => {
//     if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
//     let textContent = "";
//     const extractText = (node: any) => {
//       if (node.content && Array.isArray(node.content)) {
//         node.content.forEach((item: any) => {
//           if (item.type === "text" && item.text) textContent += item.text;
//           else if (item.content) extractText(item);
//         });
//       }
//       if (
//         node.type === "paragraph" &&
//         textContent.length > 0 &&
//         !textContent.endsWith("\n")
//       ) {
//         textContent += "\n";
//       }
//       if (node.children && Array.isArray(node.children)) {
//         node.children.forEach((child: any) => extractText(child));
//       }
//     };
//     blocks.forEach((block) => extractText(block));
//     return textContent.trim();
//   };

//   const renderEditorContent = (content: any) => {
//     if (!content) return "";
//     if (typeof content === "string") return content;
//     if (Array.isArray(content)) return extractTextFromBlocks(content);
//     if (content?.document && Array.isArray(content.document))
//       return extractTextFromBlocks(content.document);
//     if (content?.blocks && Array.isArray(content.blocks))
//       return extractTextFromBlocks(content.blocks);
//     return "";
//   };

//   // Add this helper function RIGHT AFTER renderEditorContent
//   const hasContent = (content: any): boolean => {
//     if (!content) return false;

//     // If it's a string and not empty
//     if (typeof content === "string") return content.trim().length > 0;

//     // If it's an array (blocks)
//     if (Array.isArray(content)) {
//       const text = extractTextFromBlocks(content);
//       return text.trim().length > 0;
//     }

//     // If it has document or blocks structure
//     if (content?.document && Array.isArray(content.document)) {
//       const text = extractTextFromBlocks(content.document);
//       return text.trim().length > 0;
//     }

//     if (content?.blocks && Array.isArray(content.blocks)) {
//       const text = extractTextFromBlocks(content.blocks);
//       return text.trim().length > 0;
//     }

//     return false;
//   };

//   // ============ HANDLERS ============

//   const handleProjectChange = (projectId: string) => {
//     setSelectedProject(projectId);
//     setSelectedReleaseId(null);
//     setIsInitialLoad(true);
//     setSearchTerm(""); // Clear search when changing projects
//   };

//   const handleVersionSelect = (releaseId: string) =>
//     setSelectedReleaseId(releaseId);

//   // ✅ SEARCH BY TITLE
//   const handleSearch = (value: string) => {
//     console.log("🔍 Searching releases by title:", value);
//     setSearchTerm(value);
//   };

//   // ✅ CLEAR SEARCH - FIXED!
//   const handleSearchClear = () => {
//     console.log("🧹 Search cleared");
//     setSearchTerm("");
//   };

//   const handleEdit = () =>
//     selectedReleaseId &&
//     router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
//   const handleDuplicate = () =>
//     selectedRelease &&
//     router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

//   const showDeleteConfirm = (releaseId: string) => {
//     setReleaseToDelete(releaseId);
//     setIsDeleteModalOpen(true);
//   };

//   const handleDeleteRelease = async () => {
//     if (!releaseToDelete) return;
//     try {
//       await deleteReleaseNote.mutateAsync(releaseToDelete);
//       message.success("Release note deleted successfully");
//       if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
//       refetchReleaseNotes();
//     } catch (error) {
//       console.error("Failed to delete release:", error);
//       message.error("Failed to delete release note");
//     } finally {
//       setIsDeleteModalOpen(false);
//       setReleaseToDelete(null);
//     }
//   };

//   // ============ EXPORT FUNCTIONS ============
//   const exportAsJSON = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
//       const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
//         type: "application/json",
//       });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsMarkdown = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let markdown = `# ${selectedRelease.title}\n\n`;
//       markdown += `**Version:** ${selectedRelease.version}  \n`;
//       markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
//       markdown += `**Environment:** ${selectedRelease.environment}  \n`;
//       markdown += `**Status:** ${selectedRelease.status}  \n\n`;
//       if (selectedRelease.project)
//         markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
//       markdown += `---\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         markdown += `## Improvements\n\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

//       const apiText = renderEditorContent(selectedRelease.apiChanges);
//       if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

//       const dbText = renderEditorContent(selectedRelease.databaseChanges);
//       if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

//       const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
//       if (knownIssuesText)
//         markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

//       if (
//         selectedRelease.linkedTickets &&
//         selectedRelease.linkedTickets.length > 0
//       ) {
//         markdown += `## Linked Tickets\n\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (markdown += `- ${ticket}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (
//         selectedRelease.repositories &&
//         selectedRelease.repositories.length > 0
//       ) {
//         markdown += `## Repositories\n\n`;
//         selectedRelease.repositories.forEach(
//           (repo) => (markdown += `- ${repo}\n`),
//         );
//         markdown += `\n`;
//       }
//       if (
//         selectedRelease.pullRequests &&
//         selectedRelease.pullRequests.length > 0
//       ) {
//         markdown += `## Pull Requests\n\n`;
//         selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
//         markdown += `\n`;
//       }

//       markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
//       markdown += `---\n\n`;
//       markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
//       const blob = new Blob([markdown], { type: "text/markdown" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportAsText = () => {
//     if (!selectedRelease) {
//       message.warning("No release selected");
//       return;
//     }
//     try {
//       let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
//       text += `Version: ${selectedRelease.version}\n`;
//       text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
//       text += `Environment: ${selectedRelease.environment}\n`;
//       text += `Status: ${selectedRelease.status}\n`;
//       if (selectedRelease.project)
//         text += `Project: ${selectedRelease.project.name}\n`;
//       text += `\n${"-".repeat(50)}\n\n`;

//       const summaryText = renderEditorContent(selectedRelease.summary);
//       if (summaryText)
//         text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

//       const insightsText = renderEditorContent(selectedRelease.keyInsights);
//       if (insightsText)
//         text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

//       const featuresText = renderEditorContent(selectedRelease.newFeatures);
//       if (featuresText)
//         text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

//       const improvementsText = renderEditorContent(
//         selectedRelease.improvements,
//       );
//       if (improvementsText)
//         text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

//       const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
//       if (bugFixesText)
//         text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

//       const breakingText = renderEditorContent(selectedRelease.breakingChanges);
//       if (breakingText)
//         text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

//       if (
//         selectedRelease.linkedTickets &&
//         selectedRelease.linkedTickets.length > 0
//       ) {
//         text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
//         selectedRelease.linkedTickets.forEach(
//           (ticket) => (text += `• ${ticket}\n`),
//         );
//         text += `\n`;
//       }

//       text += `\n${"-".repeat(50)}\n`;
//       text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

//       const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
//       const blob = new Blob([text], { type: "text/plain" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = fileName;
//       link.click();
//       URL.revokeObjectURL(url);
//       message.success(`Exported as ${fileName}`);
//     } catch (error) {
//       message.error("Failed to export");
//     }
//   };

//   const exportMenuItems = [
//     {
//       key: "json",
//       label: "Export as JSON",
//       onClick: exportAsJSON,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "markdown",
//       label: "Export as Markdown",
//       onClick: exportAsMarkdown,
//       disabled: !selectedRelease,
//     },
//     {
//       key: "text",
//       label: "Export as Text",
//       onClick: exportAsText,
//       disabled: !selectedRelease,
//     },
//   ];

//   // ============ UI HELPERS ============
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "RELEASED":
//         return "#52c41a";
//       case "DRAFT":
//         return "#faad14";
//       default:
//         return "#999";
//     }
//   };

//   const getEnvironmentColor = (env: string) => {
//     switch (env) {
//       case "PROD":
//         return "#f5222d";
//       case "QA":
//         return "#fa8c16";
//       case "DEV":
//         return "#1890ff";
//       default:
//         return "#722ed1";
//     }
//   };

//   // Safe access to releaseNotesData
//   const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

//   // ============ MAIN RENDER ============
//   return (
//     <MainLayout>
//       {/* ===== MAIN CONTAINER - NO GAP BETWEEN LEFT & RIGHT ===== */}
//       <div
//         style={{
//           display: "flex",
//           height: "calc(100vh - 60px)",
//           overflow: "hidden",
//           width: "100%",
//           borderTop: "1px solid #e5e7eb",
//         }}
//       >
//         {/* ===== LEFT PANEL ===== */}
//         <aside
//           style={{
//             width: 280,
//             background: "#fafafa",
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//             overflow: "hidden",
//             borderRight: "none",
//           }}
//         >
//           <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
//             <div style={{ marginBottom: 20 }}>
//               <Space align="center" style={{ marginBottom: 8 }}>
//                 <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
//                 <Title level={5} style={{ margin: 0, fontSize: 16 }}>
//                   Release Notes
//                 </Title>
//               </Space>

//               <Select
//                 placeholder="Select Project"
//                 style={{ width: "100%" }}
//                 size="small"
//                 loading={loadingProjects}
//                 showSearch
//                 optionFilterProp="children"
//                 onChange={handleProjectChange}
//                 allowClear
//                 value={selectedProject}
//               >
//                 {projects.map((project) => (
//                   <Select.Option key={project.id} value={project.id}>
//                     {project.name}
//                   </Select.Option>
//                 ))}
//               </Select>
//             </div>

//             <Input.Search
//               placeholder="Search releases by title..."
//               onChange={(e) => {
//                 setSearchTerm(e.target.value);
//                 if (e.target.value === "") {
//                   handleSearchClear();
//                 }
//               }}
//               value={searchTerm}
//               allowClear
//               size="small"
//               style={{ width: "100%" }}
//               onClear={handleSearchClear}
//             />

//             <Divider style={{ margin: "16px 0" }} />

//             {isLoadingReleaseNotes ? (
//               <div style={{ textAlign: "center", padding: "30px 0" }}>
//                 <Spin size="small" />
//                 <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
//                   Loading releases...
//                 </p>
//               </div>
//             ) : !selectedProject ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
//                 <p style={{ fontSize: 13 }}>Select a project</p>
//               </div>
//             ) : groupedReleases.length === 0 ? (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#999",
//                 }}
//               >
//                 <Empty
//                   description={
//                     searchTerm
//                       ? `No releases found with title "${searchTerm}"`
//                       : "No releases found"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 60 }}
//                 />
//               </div>
//             ) : (
//               groupedReleases.map((group) => (
//                 <div key={group.month} style={{ marginBottom: 20 }}>
//                   <Text
//                     type="secondary"
//                     style={{ fontSize: 11, fontWeight: 600 }}
//                   >
//                     {group.month}
//                   </Text>
//                   <div style={{ marginTop: 6 }}>
//                     {group.versions.map((release) => (
//                       <div
//                         key={release.id}
//                         onClick={() => handleVersionSelect(release.id)}
//                         style={{
//                           cursor: "pointer",
//                           padding: "10px",
//                           borderRadius: 6,
//                           backgroundColor:
//                             selectedReleaseId === release.id
//                               ? "#e6f7ff"
//                               : "transparent",
//                           border:
//                             selectedReleaseId === release.id
//                               ? "1px solid #1890ff"
//                               : "1px solid transparent",
//                           marginBottom: 4,
//                           transition: "all 0.2s",
//                         }}
//                       >
//                         <div
//                           style={{
//                             fontWeight: 600,
//                             marginBottom: 2,
//                             fontSize: 13,
//                           }}
//                         >
//                           {release.title}
//                         </div>
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Tag
//                             color={getStatusColor(release.status)}
//                             style={{
//                               fontSize: 10,
//                               padding: "0 4px",
//                               height: 18,
//                               lineHeight: "16px",
//                             }}
//                           >
//                             {release.status}
//                           </Tag>
//                           <Text style={{ fontSize: 10, color: "#999" }}>
//                             {dayjs(release.releaseDate).format("MMM D, YYYY")}
//                           </Text>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </aside>

//         <div style={{ width: "1px", background: "#e5e7eb", height: "100%" }} />

//         <main
//           style={{
//             flex: 1,
//             height: "100%",
//             overflow: "hidden",
//             display: "flex",
//             flexDirection: "column",
//             background: "#fff",
//           }}
//         >
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #f0f0f0",
//               background: "#fff",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "flex-start",
//               }}
//             >
//               <div style={{ flex: 1 }}>
//                 {isLoadingSelectedRelease ? (
//                   <Spin size="small" />
//                 ) : selectedRelease ? (
//                   <>
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 8,
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Title level={4} style={{ margin: 0, fontSize: 22 }}>
//                         {selectedRelease.title}
//                       </Title>
//                       <Tag
//                         color={getStatusColor(selectedRelease.status)}
//                         style={{
//                           fontSize: 11,
//                           padding: "0 8px",
//                           height: 20,
//                           lineHeight: "20px",
//                           borderRadius: 4,
//                           fontWeight: 500,
//                         }}
//                       >
//                         {selectedRelease.status}
//                       </Tag>
//                     </div>
//                     <Space size={[12, 4]} wrap>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#1890ff" }}
//                         />
//                         <Text type="secondary" style={{ fontSize: 12 }}>
//                           v{selectedRelease.version}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <CalendarOutlined
//                           style={{ fontSize: 12, color: "#52c41a" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {dayjs(selectedRelease.releaseDate).format(
//                             "MMM D, YYYY",
//                           )}
//                         </Text>
//                       </Space>
//                       <Space size={4}>
//                         <EnvironmentOutlined
//                           style={{ fontSize: 12, color: "#722ed1" }}
//                         />
//                         <Tag
//                           color={getEnvironmentColor(
//                             selectedRelease.environment,
//                           )}
//                           style={{
//                             fontSize: 11,
//                             padding: "0 6px",
//                             height: 20,
//                             lineHeight: "18px",
//                           }}
//                         >
//                           {selectedRelease.environment}
//                         </Tag>
//                       </Space>
//                       <Space size={4}>
//                         <ProjectOutlined
//                           style={{ fontSize: 12, color: "#fa8c16" }}
//                         />
//                         <Text style={{ fontSize: 12 }}>
//                           {selectedRelease.project?.name}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </>
//                 ) : (
//                   <Text type="secondary" style={{ fontSize: 13 }}>
//                     {selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"}
//                   </Text>
//                 )}
//               </div>

//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Button
//                   type="primary"
//                   icon={<PlusOutlined />}
//                   size="small"
//                   onClick={() => router.push("/releasenotes/create")}
//                 >
//                   Create
//                 </Button>
//                 {selectedRelease && (
//                   <Button
//                     icon={<EditOutlined />}
//                     size="small"
//                     onClick={handleEdit}
//                   >
//                     Edit
//                   </Button>
//                 )}
//                 <Dropdown
//                   trigger={["click"]}
//                   menu={{
//                     items: [
//                       {
//                         key: "duplicate",
//                         label: "Duplicate",
//                         onClick: handleDuplicate,
//                         disabled: !selectedRelease,
//                       },
//                       { key: "archive", label: "Archive", disabled: true },
//                       {
//                         key: "share",
//                         label: "Share",
//                         disabled: !selectedRelease,
//                       },
//                       {
//                         key: "export",
//                         label: "Export",
//                         disabled: !selectedRelease,
//                         children: exportMenuItems,
//                       },
//                       // {
//                       //   key: "delete",
//                       //   label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                       //   onClick: () => showDeleteConfirm(selectedRelease?.id),
//                       //   disabled: !selectedRelease,
//                       // },
//                       {
//                         key: "delete",
//                         label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
//                         // FIXED: Pass the releaseId only if selectedRelease exists
//                         onClick: () => {
//                           if (selectedRelease) {
//                             showDeleteConfirm(selectedRelease.id);
//                           }
//                         },
//                         disabled: !selectedRelease,
//                       },
//                     ],
//                   }}
//                   disabled={!selectedRelease}
//                 >
//                   <Button icon={<MoreOutlined />} size="small" type="text" />
//                 </Dropdown>
//               </div>
//             </div>
//           </div>

//           <div
//             style={{
//               padding: "20px 24px",
//               overflowY: "auto",
//               flex: 1,
//               background: "#f8f9fa",
//             }}
//           >
//             {selectedRelease ? (
//               <>
//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <BookOutlined
//                       style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Release Summary
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />
//                   <div
//                     style={{
//                       background: "#fafafa",
//                       padding: 12,
//                       borderRadius: 6,
//                       borderLeft: "3px solid #1890ff",
//                       fontSize: 13,
//                       lineHeight: 1.6,
//                     }}
//                   >
//                     <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                       {renderEditorContent(selectedRelease.summary) ||
//                         "No summary provided"}
//                     </Text>
//                   </div>
//                 </Card>

//                 {/* Key Insights - Only show if has content */}
//                 {hasContent(selectedRelease.keyInsights) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <BulbOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#faad14",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Key Insights
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />
//                     <div
//                       style={{
//                         background: "#fafafa",
//                         padding: 12,
//                         borderRadius: 6,
//                         borderLeft: "3px solid #faad14",
//                         fontSize: 13,
//                         lineHeight: 1.6,
//                       }}
//                     >
//                       <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                         {renderEditorContent(selectedRelease.keyInsights)}
//                       </Text>
//                     </div>
//                   </Card>
//                 )}

//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <RocketOutlined
//                       style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Changelog
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {/* New Features - Only show if has content */}
//                   {hasContent(selectedRelease.newFeatures) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <PlusOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#52c41a",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           New Features
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                           borderLeft: "3px solid green",
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.newFeatures)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {/* Improvements - Only show if has content */}
//                   {hasContent(selectedRelease.improvements) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <RocketOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#1890ff",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           Improvements
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                           borderLeft: "3px solid #1890ff",
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.improvements)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {/* Bug Fixes - Only show if has content */}
//                   {hasContent(selectedRelease.bugFixes) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <BugOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#ff4d4f",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           Bug Fixes
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                           borderLeft: "3px solid red",
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.bugFixes)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {/* Breaking Changes - Only show if has content */}
//                   {hasContent(selectedRelease.breakingChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <WarningOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#ff4d4f",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           Breaking Changes
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontSize: 13,
//                           borderLeft: "3px solid red",
//                           lineHeight: 1.6,
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.breakingChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}
//                 </Card>

//                 <Card
//                   size="small"
//                   style={{
//                     marginBottom: 16,
//                     borderRadius: 8,
//                     boxShadow: "none",
//                     border: "1px solid #f0f0f0",
//                   }}
//                   bodyStyle={{ padding: 16 }}
//                 >
//                   <div
//                     style={{
//                       display: "flex",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <CodeOutlined
//                       style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }}
//                     />
//                     <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                       Technical Notes
//                     </Title>
//                   </div>
//                   <Divider style={{ margin: "0 0 12px 0" }} />

//                   {/* API Changes - Only show if has content */}
//                   {hasContent(selectedRelease.apiChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <ApiOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#722ed1",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           API Changes
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontFamily: "monospace",
//                           fontSize: 12,
//                           borderLeft: "3px solid violet",
//                           lineHeight: 1.6,
//                         }}
//                       >
//                         <Text style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.apiChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {/* Database Changes - Only show if has content */}
//                   {hasContent(selectedRelease.databaseChanges) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <DatabaseOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#13c2c2",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           Database Changes
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           fontSize: 13,
//                           lineHeight: 1.6,
//                           borderLeft: "3px solid light green",
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.databaseChanges)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}

//                   {/* Known Issues - Only show if has content */}
//                   {hasContent(selectedRelease.knownIssues) && (
//                     <div style={{ marginBottom: 16 }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <ExclamationCircleOutlined
//                           style={{
//                             fontSize: 12,
//                             color: "#fa8c16",
//                             marginRight: 6,
//                           }}
//                         />
//                         <Text strong style={{ fontSize: 13 }}>
//                           Known Issues
//                         </Text>
//                       </div>
//                       <div
//                         style={{
//                           background: "#fafafa",
//                           padding: 12,
//                           borderRadius: 6,
//                           lineHeight: 1.6,
//                           fontSize: 13,
//                           borderLeft: "3px solid orange",
//                         }}
//                       >
//                         <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
//                           {renderEditorContent(selectedRelease.knownIssues)}
//                         </Text>
//                       </div>
//                     </div>
//                   )}
//                 </Card>

//                 {/* Linked Items Card - FIXED TypeScript errors */}
//                 {((selectedRelease.linkedTickets &&
//                   selectedRelease.linkedTickets.length > 0) ||
//                   (selectedRelease.repositories &&
//                     selectedRelease.repositories.length > 0) ||
//                   (selectedRelease.pullRequests &&
//                     selectedRelease.pullRequests.length > 0)) && (
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 16,
//                       borderRadius: 8,
//                       boxShadow: "none",
//                       border: "1px solid #f0f0f0",
//                     }}
//                     bodyStyle={{ padding: 16 }}
//                   >
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <LinkOutlined
//                         style={{
//                           fontSize: 16,
//                           color: "#1890ff",
//                           marginRight: 8,
//                         }}
//                       />
//                       <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                         Linked Items
//                       </Title>
//                     </div>
//                     <Divider style={{ margin: "0 0 12px 0" }} />

//                     {selectedRelease.linkedTickets &&
//                       selectedRelease.linkedTickets.length > 0 && (
//                         <div style={{ marginBottom: 12 }}>
//                           <Text
//                             strong
//                             style={{
//                               display: "block",
//                               marginBottom: 8,
//                               fontSize: 13,
//                             }}
//                           >
//                             Tickets
//                           </Text>
//                           <div
//                             style={{
//                               display: "flex",
//                               flexWrap: "wrap",
//                               gap: 6,
//                             }}
//                           >
//                             {selectedRelease.linkedTickets.map((ticket) => (
//                               <Tag
//                                 key={ticket}
//                                 color="#1890ff"
//                                 style={{
//                                   fontSize: 11,
//                                   padding: "0 8px",
//                                   borderRadius: 12,
//                                   height: 22,
//                                   lineHeight: "20px",
//                                 }}
//                                 icon={<TagOutlined style={{ fontSize: 11 }} />}
//                               >
//                                 {ticket}
//                               </Tag>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                     {selectedRelease.repositories &&
//                       selectedRelease.repositories.length > 0 && (
//                         <div style={{ marginBottom: 12 }}>
//                           <Text
//                             strong
//                             style={{
//                               display: "block",
//                               marginBottom: 8,
//                               fontSize: 13,
//                             }}
//                           >
//                             Repositories
//                           </Text>
//                           <div
//                             style={{
//                               display: "flex",
//                               flexWrap: "wrap",
//                               gap: 6,
//                             }}
//                           >
//                             {selectedRelease.repositories.map((repo) => (
//                               <Tag
//                                 key={repo}
//                                 color="#2db7f5"
//                                 style={{
//                                   fontSize: 11,
//                                   padding: "0 8px",
//                                   borderRadius: 12,
//                                   height: 22,
//                                   lineHeight: "20px",
//                                 }}
//                                 icon={
//                                   <GithubOutlined style={{ fontSize: 11 }} />
//                                 }
//                               >
//                                 {repo}
//                               </Tag>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                     {selectedRelease.pullRequests &&
//                       selectedRelease.pullRequests.length > 0 && (
//                         <div style={{ marginBottom: 12 }}>
//                           <Text
//                             strong
//                             style={{
//                               display: "block",
//                               marginBottom: 8,
//                               fontSize: 13,
//                             }}
//                           >
//                             Pull Requests
//                           </Text>
//                           <div
//                             style={{
//                               display: "flex",
//                               flexWrap: "wrap",
//                               gap: 6,
//                             }}
//                           >
//                             {selectedRelease.pullRequests.map((pr) => (
//                               <Tag
//                                 key={pr}
//                                 color="#87d068"
//                                 style={{
//                                   fontSize: 11,
//                                   padding: "0 8px",
//                                   borderRadius: 12,
//                                   height: 22,
//                                   lineHeight: "20px",
//                                 }}
//                                 icon={
//                                   <PullRequestOutlined
//                                     style={{ fontSize: 11 }}
//                                   />
//                                 }
//                               >
//                                 {pr}
//                               </Tag>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                   </Card>
//                 )}

//                 {selectedRelease.visibility &&
//                   selectedRelease.visibility.length > 0 && (
//                     <Card
//                       size="small"
//                       style={{
//                         marginBottom: 16,
//                         borderRadius: 8,
//                         boxShadow: "none",
//                         border: "1px solid #f0f0f0",
//                       }}
//                       bodyStyle={{ padding: 16 }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <EyeOutlined
//                           style={{
//                             fontSize: 16,
//                             color: "#722ed1",
//                             marginRight: 8,
//                           }}
//                         />
//                         <Title level={5} style={{ margin: 0, fontSize: 14 }}>
//                           Visibility & Audience
//                         </Title>
//                       </div>
//                       <Divider style={{ margin: "0 0 12px 0" }} />
//                       <div
//                         style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
//                       >
//                         {selectedRelease.visibility.map((v) => {
//                           let color = "#1890ff";
//                           let icon = (
//                             <CheckCircleOutlined style={{ fontSize: 12 }} />
//                           );
//                           let label = v;

//                           if (v === "INTERNAL") {
//                             color = "#1890ff";
//                             label = "Internal";
//                           } else if (v === "CLIENT") {
//                             color = "#52c41a";
//                             label = "Client";
//                           } else if (v === "PUBLIC") {
//                             color = "#722ed1";
//                             label = "Public";
//                           }

//                           return (
//                             <Tag
//                               key={v}
//                               color={color}
//                               style={{
//                                 fontSize: 12,
//                                 padding: "4px 12px",
//                                 borderRadius: 16,
//                                 height: 28,
//                                 lineHeight: "20px",
//                               }}
//                               icon={icon}
//                             >
//                               {label}
//                             </Tag>
//                           );
//                         })}
//                       </div>
//                       <Text
//                         type="secondary"
//                         style={{
//                           display: "block",
//                           marginTop: 12,
//                           fontSize: 12,
//                         }}
//                       >
//                         <ExclamationCircleOutlined
//                           style={{ marginRight: 6, fontSize: 12 }}
//                         />
//                         Visibility settings determine who can view this release
//                         note.
//                       </Text>
//                     </Card>
//                   )}
//               </>
//             ) : (
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "center",
//                   alignItems: "center",
//                   height: "100%",
//                 }}
//               >
//                 <Empty
//                   description={
//                     selectedProject
//                       ? "Select a version to view release notes"
//                       : "Select a project from sidebar"
//                   }
//                   image={Empty.PRESENTED_IMAGE_SIMPLE}
//                   imageStyle={{ height: 80 }}
//                 />
//               </div>
//             )}
//           </div>
//         </main>
//       </div>

//       <Modal
//         title="Delete Release Note"
//         open={isDeleteModalOpen}
//         onOk={handleDeleteRelease}
//         onCancel={() => setIsDeleteModalOpen(false)}
//         okText="Delete"
//         cancelText="Cancel"
//         okButtonProps={{
//           danger: true,
//           loading: deleteReleaseNote.isPending,
//           size: "small",
//         }}
//         width={400}
//       >
//         <p style={{ fontSize: 13 }}>
//           Are you sure you want to delete this release note? This action cannot
//           be undone.
//         </p>
//       </Modal>
//     </MainLayout>
//   );
// }


"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Button,
  Divider,
  Select,
  Input,
  Dropdown,
  Card,
  Spin,
  Empty,
  message,
  Modal,
  Tag,
} from "antd";
const { Title, Text } = Typography;
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined,
  LoadingOutlined,
  BulbOutlined,
  RocketOutlined,
  BugOutlined,
  WarningOutlined,
  ApiOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  LinkOutlined,
  GithubOutlined,
  PullRequestOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CodeOutlined,
  TagOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectService } from "@/services/projectService";
import {
  useReleaseNotes,
  useDeleteReleaseNote,
  useReleaseNote,
} from "@/hooks/usereleasenotes";
import dayjs from "dayjs";

// Import the Project type from the service
import { Project as ServiceProject } from "@/services/projectService";

interface Project {
  id: string;
  name: string;
}

interface ReleaseNote {
  id: string;
  title: string;
  version: string;
  releaseDate: string;
  status: string;
  summary?: any;
  keyInsights?: any;
  newFeatures?: any;
  improvements?: any;
  bugFixes?: any;
  breakingChanges?: any;
  apiChanges?: any;
  databaseChanges?: any;
  knownIssues?: any;
  project?: {
    id: string;
    name: string;
  };
  linkedTickets?: string[];
  repositories?: string[];
  pullRequests?: string[];
  environment: string;
  visibility: string[];
  createdBy: string;
  createdAt: string;
}

export default function ReleaseNotesPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ============ API CALLS ============
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await ProjectService.getProjects();
        const projectsData = response.data || [];

        // Map the service project type to your local Project interface
        const mappedProjects: Project[] = projectsData.map(
          (p: ServiceProject) => ({
            id: p.id,
            name: p.name,
          }),
        );

        setProjects(mappedProjects);
        if (mappedProjects.length > 0 && !selectedProject) {
          setSelectedProject(mappedProjects[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        message.error("Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const {
    data: releaseNotesData,
    isLoading: isLoadingReleaseNotes,
    refetch: refetchReleaseNotes,
  } = useReleaseNotes({
    projectId: selectedProject || undefined,
    search: searchTerm || undefined,
    sortBy: "releaseDate",
    sortOrder: "desc",
  });

  useEffect(() => {
    // Safe check for releaseNotesData and its data property
    if (
      releaseNotesData &&
      releaseNotesData.data &&
      releaseNotesData.data.length > 0 &&
      !selectedReleaseId &&
      isInitialLoad
    ) {
      setSelectedReleaseId(releaseNotesData.data[0].id);
      setIsInitialLoad(false);
    }
  }, [releaseNotesData, selectedReleaseId, isInitialLoad]);

  const { data: selectedRelease, isLoading: isLoadingSelectedRelease } =
    useReleaseNote(selectedReleaseId || undefined);

  const deleteReleaseNote = useDeleteReleaseNote();

  // ============ HELPER FUNCTIONS ============
  const groupReleasesByMonth = (releases: ReleaseNote[] = []) => {
    const groups: { [key: string]: ReleaseNote[] } = {};
    releases.forEach((release) => {
      const date = dayjs(release.releaseDate);
      const monthYear = date.format("MMMM YYYY").toUpperCase();
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(release);
    });
    return Object.entries(groups).map(([month, versions]) => ({
      month,
      versions: versions.sort(
        (a, b) => dayjs(b.releaseDate).unix() - dayjs(a.releaseDate).unix(),
      ),
    }));
  };

  const extractTextFromBlocks = (blocks: any[]): string => {
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
    let textContent = "";
    const extractText = (node: any) => {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((item: any) => {
          if (item.type === "text" && item.text) textContent += item.text;
          else if (item.content) extractText(item);
        });
      }
      if (
        node.type === "paragraph" &&
        textContent.length > 0 &&
        !textContent.endsWith("\n")
      ) {
        textContent += "\n";
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => extractText(child));
      }
    };
    blocks.forEach((block) => extractText(block));
    return textContent.trim();
  };

  const renderEditorContent = (content: any) => {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) return extractTextFromBlocks(content);
    if (content?.document && Array.isArray(content.document))
      return extractTextFromBlocks(content.document);
    if (content?.blocks && Array.isArray(content.blocks))
      return extractTextFromBlocks(content.blocks);
    return "";
  };

  // Add this helper function RIGHT AFTER renderEditorContent
  const hasContent = (content: any): boolean => {
    if (!content) return false;

    // If it's a string and not empty
    if (typeof content === "string") return content.trim().length > 0;

    // If it's an array (blocks)
    if (Array.isArray(content)) {
      const text = extractTextFromBlocks(content);
      return text.trim().length > 0;
    }

    // If it has document or blocks structure
    if (content?.document && Array.isArray(content.document)) {
      const text = extractTextFromBlocks(content.document);
      return text.trim().length > 0;
    }

    if (content?.blocks && Array.isArray(content.blocks)) {
      const text = extractTextFromBlocks(content.blocks);
      return text.trim().length > 0;
    }

    return false;
  };

  // ============ HANDLERS ============

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedReleaseId(null);
    setIsInitialLoad(true);
    setSearchTerm(""); // Clear search when changing projects
  };

  const handleVersionSelect = (releaseId: string) =>
    setSelectedReleaseId(releaseId);

  // ✅ SEARCH BY TITLE
  const handleSearch = (value: string) => {
    console.log("🔍 Searching releases by title:", value);
    setSearchTerm(value);
  };

  // ✅ CLEAR SEARCH - FIXED!
  const handleSearchClear = () => {
    console.log("🧹 Search cleared");
    setSearchTerm("");
  };

  const handleEdit = () =>
    selectedReleaseId &&
    router.push(`/releasenotes/create?edit=${selectedReleaseId}`);
  const handleDuplicate = () =>
    selectedRelease &&
    router.push(`/releasenotes/create?duplicate=${selectedRelease.id}`);

  const showDeleteConfirm = (releaseId: string) => {
    setReleaseToDelete(releaseId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRelease = async () => {
    if (!releaseToDelete) return;
    try {
      await deleteReleaseNote.mutateAsync(releaseToDelete);
      message.success("Release note deleted successfully");
      if (selectedReleaseId === releaseToDelete) setSelectedReleaseId(null);
      refetchReleaseNotes();
    } catch (error) {
      console.error("Failed to delete release:", error);
      message.error("Failed to delete release note");
    } finally {
      setIsDeleteModalOpen(false);
      setReleaseToDelete(null);
    }
  };

  // ============ EXPORT FUNCTIONS ============
  const exportAsJSON = () => {
    if (!selectedRelease) {
      message.warning("No release selected");
      return;
    }
    try {
      const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
      const blob = new Blob([JSON.stringify(selectedRelease, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`Exported as ${fileName}`);
    } catch (error) {
      message.error("Failed to export");
    }
  };

  const exportAsMarkdown = () => {
    if (!selectedRelease) {
      message.warning("No release selected");
      return;
    }
    try {
      let markdown = `# ${selectedRelease.title}\n\n`;
      markdown += `**Version:** ${selectedRelease.version}  \n`;
      markdown += `**Release Date:** ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}  \n`;
      markdown += `**Environment:** ${selectedRelease.environment}  \n`;
      markdown += `**Status:** ${selectedRelease.status}  \n\n`;
      if (selectedRelease.project)
        markdown += `**Project:** ${selectedRelease.project.name}  \n\n`;
      markdown += `---\n\n`;

      const summaryText = renderEditorContent(selectedRelease.summary);
      if (summaryText) markdown += `## Release Summary\n\n${summaryText}\n\n`;

      const insightsText = renderEditorContent(selectedRelease.keyInsights);
      if (insightsText) markdown += `## Key Insights\n\n${insightsText}\n\n`;

      const featuresText = renderEditorContent(selectedRelease.newFeatures);
      if (featuresText) markdown += `## New Features\n\n${featuresText}\n\n`;

      const improvementsText = renderEditorContent(
        selectedRelease.improvements,
      );
      if (improvementsText)
        markdown += `## Improvements\n\n${improvementsText}\n\n`;

      const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
      if (bugFixesText) markdown += `## Bug Fixes\n\n${bugFixesText}\n\n`;

      const breakingText = renderEditorContent(selectedRelease.breakingChanges);
      if (breakingText)
        markdown += `## Breaking Changes\n\n${breakingText}\n\n`;

      const apiText = renderEditorContent(selectedRelease.apiChanges);
      if (apiText) markdown += `## API Changes\n\n${apiText}\n\n`;

      const dbText = renderEditorContent(selectedRelease.databaseChanges);
      if (dbText) markdown += `## Database Changes\n\n${dbText}\n\n`;

      const knownIssuesText = renderEditorContent(selectedRelease.knownIssues);
      if (knownIssuesText)
        markdown += `## Known Issues\n\n${knownIssuesText}\n\n`;

      if (
        selectedRelease.linkedTickets &&
        selectedRelease.linkedTickets.length > 0
      ) {
        markdown += `## Linked Tickets\n\n`;
        selectedRelease.linkedTickets.forEach(
          (ticket) => (markdown += `- ${ticket}\n`),
        );
        markdown += `\n`;
      }
      if (
        selectedRelease.repositories &&
        selectedRelease.repositories.length > 0
      ) {
        markdown += `## Repositories\n\n`;
        selectedRelease.repositories.forEach(
          (repo) => (markdown += `- ${repo}\n`),
        );
        markdown += `\n`;
      }
      if (
        selectedRelease.pullRequests &&
        selectedRelease.pullRequests.length > 0
      ) {
        markdown += `## Pull Requests\n\n`;
        selectedRelease.pullRequests.forEach((pr) => (markdown += `- ${pr}\n`));
        markdown += `\n`;
      }

      markdown += `## Visibility\n\n${selectedRelease.visibility.join(", ")}\n\n`;
      markdown += `---\n\n`;
      markdown += `*Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}*\n`;

      const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.md`;
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`Exported as ${fileName}`);
    } catch (error) {
      message.error("Failed to export");
    }
  };

  const exportAsText = () => {
    if (!selectedRelease) {
      message.warning("No release selected");
      return;
    }
    try {
      let text = `${selectedRelease.title}\n${"=".repeat(selectedRelease.title.length)}\n\n`;
      text += `Version: ${selectedRelease.version}\n`;
      text += `Release Date: ${dayjs(selectedRelease.releaseDate).format("MMMM D, YYYY")}\n`;
      text += `Environment: ${selectedRelease.environment}\n`;
      text += `Status: ${selectedRelease.status}\n`;
      if (selectedRelease.project)
        text += `Project: ${selectedRelease.project.name}\n`;
      text += `\n${"-".repeat(50)}\n\n`;

      const summaryText = renderEditorContent(selectedRelease.summary);
      if (summaryText)
        text += `RELEASE SUMMARY\n${"-".repeat(15)}\n${summaryText}\n\n`;

      const insightsText = renderEditorContent(selectedRelease.keyInsights);
      if (insightsText)
        text += `KEY INSIGHTS\n${"-".repeat(12)}\n${insightsText}\n\n`;

      const featuresText = renderEditorContent(selectedRelease.newFeatures);
      if (featuresText)
        text += `NEW FEATURES\n${"-".repeat(12)}\n${featuresText}\n\n`;

      const improvementsText = renderEditorContent(
        selectedRelease.improvements,
      );
      if (improvementsText)
        text += `IMPROVEMENTS\n${"-".repeat(12)}\n${improvementsText}\n\n`;

      const bugFixesText = renderEditorContent(selectedRelease.bugFixes);
      if (bugFixesText)
        text += `BUG FIXES\n${"-".repeat(9)}\n${bugFixesText}\n\n`;

      const breakingText = renderEditorContent(selectedRelease.breakingChanges);
      if (breakingText)
        text += `BREAKING CHANGES\n${"-".repeat(17)}\n${breakingText}\n\n`;

      if (
        selectedRelease.linkedTickets &&
        selectedRelease.linkedTickets.length > 0
      ) {
        text += `LINKED TICKETS\n${"-".repeat(14)}\n`;
        selectedRelease.linkedTickets.forEach(
          (ticket) => (text += `• ${ticket}\n`),
        );
        text += `\n`;
      }

      text += `\n${"-".repeat(50)}\n`;
      text += `Exported on ${dayjs().format("MMMM D, YYYY h:mm A")}\n`;

      const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.txt`;
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`Exported as ${fileName}`);
    } catch (error) {
      message.error("Failed to export");
    }
  };

  const exportMenuItems = [
    {
      key: "json",
      label: "Export as JSON",
      onClick: exportAsJSON,
      disabled: !selectedRelease,
    },
    {
      key: "markdown",
      label: "Export as Markdown",
      onClick: exportAsMarkdown,
      disabled: !selectedRelease,
    },
    {
      key: "text",
      label: "Export as Text",
      onClick: exportAsText,
      disabled: !selectedRelease,
    },
  ];

  // ============ UI HELPERS ============
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RELEASED":
        return "#52c41a";
      case "DRAFT":
        return "#faad14";
      default:
        return "#999";
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "PROD":
        return "#f5222d";
      case "QA":
        return "#fa8c16";
      case "DEV":
        return "#1890ff";
      default:
        return "#722ed1";
    }
  };

  // Safe access to releaseNotesData
  const groupedReleases = groupReleasesByMonth(releaseNotesData?.data || []);

  // ============ MAIN RENDER ============
  return (
    <MainLayout>
      {/* ===== MAIN CONTAINER - NO GAP BETWEEN LEFT & RIGHT ===== */}
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
          width: "100%",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {/* ===== LEFT PANEL ===== */}
        <aside
          style={{
            width: 280,
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            borderRight: "none",
          }}
        >
          <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
            <div style={{ marginBottom: 20 }}>
              <Space align="center" style={{ marginBottom: 8 }}>
                <FileTextOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                  Release Notes
                </Title>
              </Space>

              <Select
                placeholder="Select Project"
                style={{ width: "100%" }}
                size="small"
                loading={loadingProjects}
                showSearch
                optionFilterProp="children"
                onChange={handleProjectChange}
                allowClear
                value={selectedProject}
              >
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Input.Search
              placeholder="Search releases by title..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === "") {
                  handleSearchClear();
                }
              }}
              value={searchTerm}
              allowClear
              size="small"
              style={{ width: "100%" }}
              onClear={handleSearchClear}
            />

            <Divider style={{ margin: "16px 0" }} />

            {isLoadingReleaseNotes ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <Spin size="small" />
                <p style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
                  Loading releases...
                </p>
              </div>
            ) : !selectedProject ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "#999",
                }}
              >
                <FileTextOutlined style={{ fontSize: 28, marginBottom: 6 }} />
                <p style={{ fontSize: 13 }}>Select a project</p>
              </div>
            ) : groupedReleases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 0",
                  color: "#999",
                }}
              >
                <Empty
                  description={
                    searchTerm
                      ? `No releases found with title "${searchTerm}"`
                      : "No releases found"
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  imageStyle={{ height: 60 }}
                />
              </div>
            ) : (
              groupedReleases.map((group) => (
                <div key={group.month} style={{ marginBottom: 20 }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {group.month}
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    {group.versions.map((release) => (
                      <div
                        key={release.id}
                        onClick={() => handleVersionSelect(release.id)}
                        style={{
                          cursor: "pointer",
                          padding: "10px",
                          borderRadius: 6,
                          backgroundColor:
                            selectedReleaseId === release.id
                              ? "#e6f7ff"
                              : "transparent",
                          border:
                            selectedReleaseId === release.id
                              ? "1px solid #1890ff"
                              : "1px solid transparent",
                          marginBottom: 4,
                          transition: "all 0.2s",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: 2,
                            fontSize: 13,
                          }}
                        >
                          {release.title}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Tag
                            color={getStatusColor(release.status)}
                            style={{
                              fontSize: 10,
                              padding: "0 4px",
                              height: 18,
                              lineHeight: "16px",
                            }}
                          >
                            {release.status}
                          </Tag>
                          <Text style={{ fontSize: 10, color: "#999" }}>
                            {dayjs(release.releaseDate).format("MMM D, YYYY")}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <div style={{ width: "1px", background: "#e5e7eb", height: "100%" }} />

        <main
          style={{
            flex: 1,
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                {isLoadingSelectedRelease ? (
                  <Spin size="small" />
                ) : selectedRelease ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Title level={4} style={{ margin: 0, fontSize: 22 }}>
                        {selectedRelease.title}
                      </Title>
                      <Tag
                        color={getStatusColor(selectedRelease.status)}
                        style={{
                          fontSize: 11,
                          padding: "0 8px",
                          height: 20,
                          lineHeight: "20px",
                          borderRadius: 4,
                          fontWeight: 500,
                        }}
                      >
                        {selectedRelease.status}
                      </Tag>
                    </div>
                    <Space size={[12, 4]} wrap>
                      <Space size={4}>
                        <CalendarOutlined
                          style={{ fontSize: 12, color: "#1890ff" }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          v{selectedRelease.version}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <CalendarOutlined
                          style={{ fontSize: 12, color: "#52c41a" }}
                        />
                        <Text style={{ fontSize: 12 }}>
                          {dayjs(selectedRelease.releaseDate).format(
                            "MMM D, YYYY",
                          )}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <EnvironmentOutlined
                          style={{ fontSize: 12, color: "#722ed1" }}
                        />
                        <Tag
                          color={getEnvironmentColor(
                            selectedRelease.environment,
                          )}
                          style={{
                            fontSize: 11,
                            padding: "0 6px",
                            height: 20,
                            lineHeight: "18px",
                          }}
                        >
                          {selectedRelease.environment}
                        </Tag>
                      </Space>
                      <Space size={4}>
                        <ProjectOutlined
                          style={{ fontSize: 12, color: "#fa8c16" }}
                        />
                        <Text style={{ fontSize: 12 }}>
                          {selectedRelease.project?.name}
                        </Text>
                      </Space>
                    </Space>
                  </>
                ) : (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {selectedProject
                      ? "Select a version to view release notes"
                      : "Select a project from sidebar"}
                  </Text>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => router.push("/releasenotes/create")}
                >
                  Create
                </Button>
                {selectedRelease && (
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                )}
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "duplicate",
                        label: "Duplicate",
                        onClick: handleDuplicate,
                        disabled: !selectedRelease,
                      },
                      { key: "archive", label: "Archive", disabled: true },
                      {
                        key: "share",
                        label: "Share",
                        disabled: !selectedRelease,
                      },
                      {
                        key: "export",
                        label: "Export",
                        disabled: !selectedRelease,
                        children: exportMenuItems,
                      },
                      {
                        key: "delete",
                        label: <span style={{ color: "#ff4d4f" }}>Delete</span>,
                        onClick: () => {
                          if (selectedRelease) {
                            showDeleteConfirm(selectedRelease.id);
                          }
                        },
                        disabled: !selectedRelease,
                      },
                    ],
                  }}
                  disabled={!selectedRelease}
                >
                  <Button icon={<MoreOutlined />} size="small" type="text" />
                </Dropdown>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              flex: 1,
              background: "#f8f9fa",
            }}
          >
            {selectedRelease ? (
              <>
                {/* Release Summary - Only show if has content */}
                {hasContent(selectedRelease.summary) && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "none",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <BookOutlined
                        style={{ fontSize: 16, color: "#1890ff", marginRight: 8 }}
                      />
                      <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                        Release Summary
                      </Title>
                    </div>
                    <Divider style={{ margin: "0 0 12px 0" }} />
                    <div
                      style={{
                        background: "#fafafa",
                        padding: 12,
                        borderRadius: 6,
                        borderLeft: "3px solid #1890ff",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                        {renderEditorContent(selectedRelease.summary)}
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Key Insights - Only show if has content */}
                {hasContent(selectedRelease.keyInsights) && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "none",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <BulbOutlined
                        style={{
                          fontSize: 16,
                          color: "#faad14",
                          marginRight: 8,
                        }}
                      />
                      <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                        Key Insights
                      </Title>
                    </div>
                    <Divider style={{ margin: "0 0 12px 0" }} />
                    <div
                      style={{
                        background: "#fafafa",
                        padding: 12,
                        borderRadius: 6,
                        borderLeft: "3px solid #faad14",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                        {renderEditorContent(selectedRelease.keyInsights)}
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Changelog - Only show if any section has content */}
                {(hasContent(selectedRelease.newFeatures) ||
                  hasContent(selectedRelease.improvements) ||
                  hasContent(selectedRelease.bugFixes) ||
                  hasContent(selectedRelease.breakingChanges)) && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "none",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <RocketOutlined
                        style={{ fontSize: 16, color: "#52c41a", marginRight: 8 }}
                      />
                      <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                        Changelog
                      </Title>
                    </div>
                    <Divider style={{ margin: "0 0 12px 0" }} />

                    {/* New Features - Only show if has content */}
                    {hasContent(selectedRelease.newFeatures) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <PlusOutlined
                            style={{
                              fontSize: 12,
                              color: "#52c41a",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            New Features
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontSize: 13,
                            lineHeight: 1.6,
                            borderLeft: "3px solid green",
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.newFeatures)}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Improvements - Only show if has content */}
                    {hasContent(selectedRelease.improvements) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <RocketOutlined
                            style={{
                              fontSize: 12,
                              color: "#1890ff",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            Improvements
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontSize: 13,
                            lineHeight: 1.6,
                            borderLeft: "3px solid #1890ff",
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.improvements)}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Bug Fixes - Only show if has content */}
                    {hasContent(selectedRelease.bugFixes) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <BugOutlined
                            style={{
                              fontSize: 12,
                              color: "#ff4d4f",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            Bug Fixes
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontSize: 13,
                            lineHeight: 1.6,
                            borderLeft: "3px solid red",
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.bugFixes)}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Breaking Changes - Only show if has content */}
                    {hasContent(selectedRelease.breakingChanges) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <WarningOutlined
                            style={{
                              fontSize: 12,
                              color: "#ff4d4f",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            Breaking Changes
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontSize: 13,
                            borderLeft: "3px solid red",
                            lineHeight: 1.6,
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.breakingChanges)}
                          </Text>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Technical Notes - Only show if any section has content */}
                {(hasContent(selectedRelease.apiChanges) ||
                  hasContent(selectedRelease.databaseChanges) ||
                  hasContent(selectedRelease.knownIssues)) && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "none",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <CodeOutlined
                        style={{ fontSize: 16, color: "#722ed1", marginRight: 8 }}
                      />
                      <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                        Technical Notes
                      </Title>
                    </div>
                    <Divider style={{ margin: "0 0 12px 0" }} />

                    {/* API Changes - Only show if has content */}
                    {hasContent(selectedRelease.apiChanges) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <ApiOutlined
                            style={{
                              fontSize: 12,
                              color: "#722ed1",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            API Changes
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontFamily: "monospace",
                            fontSize: 12,
                            borderLeft: "3px solid violet",
                            lineHeight: 1.6,
                          }}
                        >
                          <Text style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.apiChanges)}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Database Changes - Only show if has content */}
                    {hasContent(selectedRelease.databaseChanges) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <DatabaseOutlined
                            style={{
                              fontSize: 12,
                              color: "#13c2c2",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            Database Changes
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            fontSize: 13,
                            lineHeight: 1.6,
                            borderLeft: "3px solid light green",
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.databaseChanges)}
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Known Issues - Only show if has content */}
                    {hasContent(selectedRelease.knownIssues) && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <ExclamationCircleOutlined
                            style={{
                              fontSize: 12,
                              color: "#fa8c16",
                              marginRight: 6,
                            }}
                          />
                          <Text strong style={{ fontSize: 13 }}>
                            Known Issues
                          </Text>
                        </div>
                        <div
                          style={{
                            background: "#fafafa",
                            padding: 12,
                            borderRadius: 6,
                            lineHeight: 1.6,
                            fontSize: 13,
                            borderLeft: "3px solid orange",
                          }}
                        >
                          <Text style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                            {renderEditorContent(selectedRelease.knownIssues)}
                          </Text>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Linked Items Card - Only show if any items exist */}
                {((selectedRelease.linkedTickets &&
                  selectedRelease.linkedTickets.length > 0) ||
                  (selectedRelease.repositories &&
                    selectedRelease.repositories.length > 0) ||
                  (selectedRelease.pullRequests &&
                    selectedRelease.pullRequests.length > 0)) && (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      boxShadow: "none",
                      border: "1px solid #f0f0f0",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <LinkOutlined
                        style={{
                          fontSize: 16,
                          color: "#1890ff",
                          marginRight: 8,
                        }}
                      />
                      <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                        Linked Items
                      </Title>
                    </div>
                    <Divider style={{ margin: "0 0 12px 0" }} />

                    {selectedRelease.linkedTickets &&
                      selectedRelease.linkedTickets.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Text
                            strong
                            style={{
                              display: "block",
                              marginBottom: 8,
                              fontSize: 13,
                            }}
                          >
                            Tickets
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {selectedRelease.linkedTickets.map((ticket) => (
                              <Tag
                                key={ticket}
                                color="#1890ff"
                                style={{
                                  fontSize: 11,
                                  padding: "0 8px",
                                  borderRadius: 12,
                                  height: 22,
                                  lineHeight: "20px",
                                }}
                                icon={<TagOutlined style={{ fontSize: 11 }} />}
                              >
                                {ticket}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedRelease.repositories &&
                      selectedRelease.repositories.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Text
                            strong
                            style={{
                              display: "block",
                              marginBottom: 8,
                              fontSize: 13,
                            }}
                          >
                            Repositories
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {selectedRelease.repositories.map((repo) => (
                              <Tag
                                key={repo}
                                color="#2db7f5"
                                style={{
                                  fontSize: 11,
                                  padding: "0 8px",
                                  borderRadius: 12,
                                  height: 22,
                                  lineHeight: "20px",
                                }}
                                icon={
                                  <GithubOutlined style={{ fontSize: 11 }} />
                                }
                              >
                                {repo}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedRelease.pullRequests &&
                      selectedRelease.pullRequests.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Text
                            strong
                            style={{
                              display: "block",
                              marginBottom: 8,
                              fontSize: 13,
                            }}
                          >
                            Pull Requests
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            {selectedRelease.pullRequests.map((pr) => (
                              <Tag
                                key={pr}
                                color="#87d068"
                                style={{
                                  fontSize: 11,
                                  padding: "0 8px",
                                  borderRadius: 12,
                                  height: 22,
                                  lineHeight: "20px",
                                }}
                                icon={
                                  <PullRequestOutlined
                                    style={{ fontSize: 11 }}
                                  />
                                }
                              >
                                {pr}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                  </Card>
                )}

                {/* Visibility Card - Only show if has visibility items */}
                {selectedRelease.visibility &&
                  selectedRelease.visibility.length > 0 && (
                    <Card
                      size="small"
                      style={{
                        marginBottom: 16,
                        borderRadius: 8,
                        boxShadow: "none",
                        border: "1px solid #f0f0f0",
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <EyeOutlined
                          style={{
                            fontSize: 16,
                            color: "#722ed1",
                            marginRight: 8,
                          }}
                        />
                        <Title level={5} style={{ margin: 0, fontSize: 14 }}>
                          Visibility & Audience
                        </Title>
                      </div>
                      <Divider style={{ margin: "0 0 12px 0" }} />
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {selectedRelease.visibility.map((v) => {
                          let color = "#1890ff";
                          let icon = (
                            <CheckCircleOutlined style={{ fontSize: 12 }} />
                          );
                          let label = v;

                          if (v === "INTERNAL") {
                            color = "#1890ff";
                            label = "Internal";
                          } else if (v === "CLIENT") {
                            color = "#52c41a";
                            label = "Client";
                          } else if (v === "PUBLIC") {
                            color = "#722ed1";
                            label = "Public";
                          }

                          return (
                            <Tag
                              key={v}
                              color={color}
                              style={{
                                fontSize: 12,
                                padding: "4px 12px",
                                borderRadius: 16,
                                height: 28,
                                lineHeight: "20px",
                              }}
                              icon={icon}
                            >
                              {label}
                            </Tag>
                          );
                        })}
                      </div>
                      <Text
                        type="secondary"
                        style={{
                          display: "block",
                          marginTop: 12,
                          fontSize: 12,
                        }}
                      >
                        <ExclamationCircleOutlined
                          style={{ marginRight: 6, fontSize: 12 }}
                        />
                        Visibility settings determine who can view this release
                        note.
                      </Text>
                    </Card>
                  )}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Empty
                  description={
                    selectedProject
                      ? "Select a version to view release notes"
                      : "Select a project from sidebar"
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  imageStyle={{ height: 80 }}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        title="Delete Release Note"
        open={isDeleteModalOpen}
        onOk={handleDeleteRelease}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleteReleaseNote.isPending,
          size: "small",
        }}
        width={400}
      >
        <p style={{ fontSize: 13 }}>
          Are you sure you want to delete this release note? This action cannot
          be undone.
        </p>
      </Modal>
    </MainLayout>
  );
}