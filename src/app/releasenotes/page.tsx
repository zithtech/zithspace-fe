


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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  // ============ PDF EXPORT FUNCTION ============
const exportAsPDF = () => {
  if (!selectedRelease) {
    message.warning("No release selected");
    return;
  }

  try {
    const doc = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 20;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      
      const splitText = doc.splitTextToSize(text, 170); // 170 = page width - margins
      splitText.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Helper function to add section
    const addSection = (title: string, content: any) => {
      if (!content) return false;
      
      const text = renderEditorContent(content);
      if (!text.trim()) return false;

      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Section title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 144, 255); // Blue color
      doc.text(title, margin, yPosition);
      yPosition += lineHeight + 2;
      
      // Section content
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      addWrappedText(text, 11);
      yPosition += 5;
      
      return true;
    };

    // Helper function to add tags/lists
    const addListSection = (title: string, items: string[] | undefined) => {
      if (!items || items.length === 0) return false;

      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 144, 255);
      doc.text(title, margin, yPosition);
      yPosition += lineHeight + 2;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      items.forEach(item => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${item}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;
      
      return true;
    };

    // ===== HEADER =====
    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(selectedRelease.title, margin, yPosition);
    yPosition += lineHeight + 5;

    // Version
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Version: ${selectedRelease.version}`, margin, yPosition);
    yPosition += lineHeight;

    // Status
    const statusColor = selectedRelease.status === "RELEASED" ? "#52c41a" : "#faad14";
    doc.setFillColor(
      selectedRelease.status === "RELEASED" ? 82 : 250, 
      selectedRelease.status === "RELEASED" ? 196 : 173, 
      selectedRelease.status === "RELEASED" ? 26 : 20
    );
    doc.roundedRect(margin, yPosition - 4, 25, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(selectedRelease.status, margin + 2, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += lineHeight + 5;

    // Metadata table
    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: [
        ['Release Date', dayjs(selectedRelease.releaseDate).format('MMMM D, YYYY')],
        ['Environment', selectedRelease.environment],
        ['Project', selectedRelease.project?.name || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [24, 144, 255], textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ===== SECTIONS =====
    // Release Summary
    addSection('Release Summary', selectedRelease.summary);
    
    // Key Insights
    addSection('Key Insights', selectedRelease.keyInsights);
    
    // Changelog Sections
    if (hasContent(selectedRelease.newFeatures) ||
        hasContent(selectedRelease.improvements) ||
        hasContent(selectedRelease.bugFixes) ||
        hasContent(selectedRelease.breakingChanges)) {
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(82, 196, 26); // Green
      doc.text('Changelog', margin, yPosition);
      yPosition += lineHeight + 5;
      
      addSection('New Features', selectedRelease.newFeatures);
      addSection('Improvements', selectedRelease.improvements);
      addSection('Bug Fixes', selectedRelease.bugFixes);
      addSection('Breaking Changes', selectedRelease.breakingChanges);
    }
    
    // Technical Notes
    if (hasContent(selectedRelease.apiChanges) ||
        hasContent(selectedRelease.databaseChanges) ||
        hasContent(selectedRelease.knownIssues)) {
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(114, 46, 209); // Purple
      doc.text('Technical Notes', margin, yPosition);
      yPosition += lineHeight + 5;
      
      addSection('API Changes', selectedRelease.apiChanges);
      addSection('Database Changes', selectedRelease.databaseChanges);
      addSection('Known Issues', selectedRelease.knownIssues);
    }
    
    // Linked Items
    if ((selectedRelease.linkedTickets && selectedRelease.linkedTickets.length > 0) ||
        (selectedRelease.repositories && selectedRelease.repositories.length > 0) ||
        (selectedRelease.pullRequests && selectedRelease.pullRequests.length > 0)) {
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(24, 144, 255); // Blue
      doc.text('Linked Items', margin, yPosition);
      yPosition += lineHeight + 5;
      
      addListSection('Tickets', selectedRelease.linkedTickets);
      addListSection('Repositories', selectedRelease.repositories);
      addListSection('Pull Requests', selectedRelease.pullRequests);
    }
    
    // Visibility
    if (selectedRelease.visibility && selectedRelease.visibility.length > 0) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(114, 46, 209); // Purple
      doc.text('Visibility & Audience', margin, yPosition);
      yPosition += lineHeight + 5;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      selectedRelease.visibility.forEach(v => {
        let label = v;
        if (v === 'INTERNAL') label = '• Internal (Team Only)';
        else if (v === 'CLIENT') label = '• Client Visible';
        else if (v === 'PUBLIC') label = '• Public';
        
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(label, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Exported on ${dayjs().format('MMMM D, YYYY h:mm A')}`,
      margin,
      doc.internal.pageSize.height - 10
    );

    // Save the PDF
    const fileName = `${selectedRelease.version}_${selectedRelease.title}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
    doc.save(fileName);
    
    message.success(`✅ PDF downloaded: ${fileName}`);
  } catch (error) {
    console.error("PDF export failed:", error);
    message.error("Failed to export as PDF");
  }
};

  const exportMenuItems = [
     {
    key: "pdf",
    label: "Export as PDF",
    onClick: exportAsPDF,
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