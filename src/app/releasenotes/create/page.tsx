"use client";

import {
  Button,
  Space,
  Typography,
  Divider,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Checkbox,
  App,
  Spin,
  Tag,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  LoadingOutlined,
  EyeOutlined,
  PlusOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import DocumentEditor from "@/components/common/DocumentEditor";
import {
  useCreateReleaseNote,
  useUpdateReleaseNote,
  useReleaseNote,
  useReleaseNotes,
} from "@/hooks/usereleasenotes";
import {
  ProjectService,
  Project as ServiceProject,
} from "@/services/projectService";
import TicketService from "@/services/ticketService";
import { enviromentService } from "@/services/enviromentService";

const { Title, Text } = Typography;

interface ReleaseNoteFormValues {
  projectId: string;
  version: string;
  title: string;
  releaseDate: Dayjs;
  environment: string;
  visibility: string[];
  linkedTickets?: [{ ticket: string[] }];
}

// Updated Project interface - removed tenantId as it doesn't exist in service response
interface Project {
  id: string;
  name: string;
}

interface TicketOption {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
}

interface Environment {
  id: string;
  name: string;
  code: string;
  status: string;
}

function CreateReleaseNoteContent() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm<ReleaseNoteFormValues>();

  const editId = searchParams.get("edit");
  const duplicateId = searchParams.get("duplicate");

  const [isEditMode, setIsEditMode] = useState(!!editId);
  const [isDuplicateMode, setIsDuplicateMode] = useState(!!duplicateId);
  const [showPreview, setShowPreview] = useState(true);
  const [activeEditor, setActiveEditor] = useState<{
    title: string;
    icon: any;
    color: string;
    content: any;
  } | null>(null);

  // ========== NEW: Track which action is loading ==========
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // =======================================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Environments state - ONLY from service
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);

  // Tickets state
  const [allTickets, setAllTickets] = useState<TicketOption[]>([]);
  const [displayTickets, setDisplayTickets] = useState<TicketOption[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearchTerm, setTicketSearchTerm] = useState("");

  // Manual input states for repositories
  const [repositoryInput, setRepositoryInput] = useState("");
  const [repositories, setRepositories] = useState<string[]>([]);

  // Manual input states for pull requests
  const [pullRequestInput, setPullRequestInput] = useState("");
  const [pullRequests, setPullRequests] = useState<string[]>([]);

  // ========== NEW: Version tracking states (completely separate) ==========
  const [existingVersions, setExistingVersions] = useState<string[]>([]);
  const [lastVersion, setLastVersion] = useState<string>("");
  const [versionWarning, setVersionWarning] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  // ========================================================================

  // Initialize all editors
  const summaryEditor = useCreateBlockNote();
  const keyInsightsEditor = useCreateBlockNote();
  const newFeaturesEditor = useCreateBlockNote();
  const improvementsEditor = useCreateBlockNote();
  const bugFixesEditor = useCreateBlockNote();
  const breakingChangesEditor = useCreateBlockNote();
  const apiChangesEditor = useCreateBlockNote();
  const databaseChangesEditor = useCreateBlockNote();
  const knownIssuesEditor = useCreateBlockNote();

  // Create refs for editor content to track changes
  const editorContents = useRef({
    summary: null,
    keyInsights: null,
    newFeatures: null,
    improvements: null,
    bugFixes: null,
    breakingChanges: null,
    apiChanges: null,
    databaseChanges: null,
    knownIssues: null,
  });

  const createReleaseNote = useCreateReleaseNote();
  const updateReleaseNote = useUpdateReleaseNote();

  // NEW: Get all release notes for version checking
  const { data: releaseNotes } = useReleaseNotes({ limit: 100 });

  const { data: existingRelease, isLoading: isLoadingRelease } = useReleaseNote(
    editId || duplicateId || undefined,
  );

  // Fetch projects - FIXED: Map service projects to local Project type
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await ProjectService.getProjects();
        const serviceProjects = response.data || [];

        // Map service projects to local Project type (omit tenantId if it exists)
        const mappedProjects: Project[] = serviceProjects.map(
          (p: ServiceProject) => ({
            id: p.id,
            name: p.name,
          }),
        );

        setProjects(mappedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        message.error("Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [message]);

  // Fetch environments from service
  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        setLoadingEnvironments(true);
        const response = await enviromentService.getEnviroments();

        console.log("Environments API response:", response);

        if (Array.isArray(response)) {
          setEnvironments(response);
        } else {
          console.error("Expected array but got:", typeof response);
          setEnvironments([]);
        }
      } catch (error) {
        console.error("Failed to fetch environments:", error);
        message.error("Failed to load environments");
        setEnvironments([]);
      } finally {
        setLoadingEnvironments(false);
      }
    };

    fetchEnvironments();
  }, [message]);

  // ========== NEW: Fetch existing versions when project is selected ==========
  useEffect(() => {
    if (selectedProjectId && releaseNotes?.data) {
      // Filter release notes for this project and get versions
      const projectVersions = releaseNotes.data
        .filter(
          (note: any) => note.projectId === selectedProjectId && note.version,
        )
        .map((note: any) => note.version);

      setExistingVersions(projectVersions);

      // Get the latest version (simple sort)
      if (projectVersions.length > 0) {
        // Simple sort for version strings (works for v1, v2, v3 etc.)
        const sortedVersions = [...projectVersions].sort((a, b) => {
          const aNum = a.replace(/[^0-9.]/g, "");
          const bNum = b.replace(/[^0-9.]/g, "");
          return bNum.localeCompare(aNum, undefined, { numeric: true });
        });
        setLastVersion(sortedVersions[0]);
      } else {
        setLastVersion("");
      }
    }
  }, [selectedProjectId, releaseNotes]);
  // ===========================================================================

  // Load existing release data
  useEffect(() => {
    if (existingRelease) {
      const releaseData = isDuplicateMode
        ? {
            ...existingRelease,
            id: undefined,
            title: `${existingRelease.title} (Copy)`,
          }
        : existingRelease;

      const releaseDateValue = releaseData.releaseDate
        ? dayjs(releaseData.releaseDate)
        : dayjs();

      // Set repositories and pull requests from existing data
      if (releaseData.repositories?.length) {
        setRepositories(releaseData.repositories);
      }

      if (releaseData.pullRequests?.length) {
        setPullRequests(releaseData.pullRequests);
      }

      form.setFieldsValue({
        projectId:
          releaseData.projectId || releaseData.project?.id || undefined,
        version: releaseData.version || "",
        title: releaseData.title || "",
        releaseDate: releaseDateValue,
        environment: releaseData.environment || "",
        visibility: Array.isArray(releaseData.visibility)
          ? releaseData.visibility
          : [],
        linkedTickets: releaseData.linkedTickets?.length
          ? [{ ticket: releaseData.linkedTickets }]
          : undefined,
      });

      if (releaseData.projectId || releaseData.project?.id) {
        const projectId = releaseData.projectId || releaseData.project?.id;
        if (projectId) {
          handleProjectChange(projectId);
          // NEW: Set selected project ID for version tracking
          setSelectedProjectId(projectId);
        }
      }

      // Populate editors (EXACTLY as before - NO CHANGES)
      const getDocumentArray = (content: any) => {
        if (!content) return null;
        if (Array.isArray(content)) return content;
        if (content?.document && Array.isArray(content.document))
          return content.document;
        if (content?.blocks && Array.isArray(content.blocks))
          return content.blocks;
        if (typeof content === "string") {
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            return null;
          }
        }
        return null;
      };

      const summaryContent = getDocumentArray(releaseData.summary);
      if (summaryContent) {
        summaryEditor.replaceBlocks(summaryEditor.document, summaryContent);
        editorContents.current.summary = summaryContent;
      }

      const keyInsightsContent = getDocumentArray(releaseData.keyInsights);
      if (keyInsightsContent) {
        keyInsightsEditor.replaceBlocks(
          keyInsightsEditor.document,
          keyInsightsContent,
        );
        editorContents.current.keyInsights = keyInsightsContent;
      }

      const newFeaturesContent = getDocumentArray(releaseData.newFeatures);
      if (newFeaturesContent) {
        newFeaturesEditor.replaceBlocks(
          newFeaturesEditor.document,
          newFeaturesContent,
        );
        editorContents.current.newFeatures = newFeaturesContent;
      }

      const improvementsContent = getDocumentArray(releaseData.improvements);
      if (improvementsContent) {
        improvementsEditor.replaceBlocks(
          improvementsEditor.document,
          improvementsContent,
        );
        editorContents.current.improvements = improvementsContent;
      }

      const bugFixesContent = getDocumentArray(releaseData.bugFixes);
      if (bugFixesContent) {
        bugFixesEditor.replaceBlocks(bugFixesEditor.document, bugFixesContent);
        editorContents.current.bugFixes = bugFixesContent;
      }

      const breakingChangesContent = getDocumentArray(
        releaseData.breakingChanges,
      );
      if (breakingChangesContent) {
        breakingChangesEditor.replaceBlocks(
          breakingChangesEditor.document,
          breakingChangesContent,
        );
        editorContents.current.breakingChanges = breakingChangesContent;
      }

      const apiChangesContent = getDocumentArray(releaseData.apiChanges);
      if (apiChangesContent) {
        apiChangesEditor.replaceBlocks(
          apiChangesEditor.document,
          apiChangesContent,
        );
        editorContents.current.apiChanges = apiChangesContent;
      }

      const databaseChangesContent = getDocumentArray(
        releaseData.databaseChanges,
      );
      if (databaseChangesContent) {
        databaseChangesEditor.replaceBlocks(
          databaseChangesEditor.document,
          databaseChangesContent,
        );
        editorContents.current.databaseChanges = databaseChangesContent;
      }

      const knownIssuesContent = getDocumentArray(releaseData.knownIssues);
      if (knownIssuesContent) {
        knownIssuesEditor.replaceBlocks(
          knownIssuesEditor.document,
          knownIssuesContent,
        );
        editorContents.current.knownIssues = knownIssuesContent;
      }
    }
  }, [existingRelease, isDuplicateMode]);

  // Set default date for new records - NO default environment
  useEffect(() => {
    if (!editId && !duplicateId) {
      form.setFieldsValue({
        releaseDate: dayjs(),
        visibility: [],
      });
    }
  }, [editId, duplicateId]);

  // ========== NEW: Handle version input change ==========
  // const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const version = e.target.value;
  //   form.setFieldValue("version", version);

  //   // Only show warning for new entries (not edit mode)
  //   if (!version.trim()) {
  //     setVersionWarning("");
  //     return;
  //   }

  //   if (!isEditMode && existingVersions.includes(version)) {
  //     setVersionWarning(
  //       `⚠️ Version "${version}" already exists. Please use a different version.`,
  //     );
  //   } else {
  //     setVersionWarning("");
  //   }
  // };
const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const version = e.target.value;
  form.setFieldValue("version", version);

  // Only show warning for new entries (not edit mode)
  if (!version.trim()) {
    setVersionWarning("");
    return;
  }

  if (!isEditMode && existingVersions.includes(version)) {
    setVersionWarning("duplicate"); // Just set a flag instead of full message
  } else {
    setVersionWarning("");
  }
};
  // NEW: Handle version field blur
  const handleVersionBlur = () => {
    const version = form.getFieldValue("version");

    if (!isEditMode && version && existingVersions.includes(version)) {
      message.warning({
        content: `Version "${version}" already exists. Please create a new version.`,
        duration: 5,
        icon: <WarningOutlined />,
      });
    }
  };

  // NEW: Validate version before publish
  const validateVersion = (): boolean => {
    const version = form.getFieldValue("version");

    if (!isEditMode && version && existingVersions.includes(version)) {
      message.error(
        `Version "${version}" already exists. Please use a different version number.`,
      );
      return false;
    }
    return true;
  };
  // =====================================================

  // Handle add repository
  const handleAddRepository = () => {
    if (!repositoryInput.trim()) {
      message.warning("Please enter a repository name");
      return;
    }

    if (repositories.includes(repositoryInput.trim())) {
      message.warning("This repository already exists in the list");
      return;
    }

    setRepositories([...repositories, repositoryInput.trim()]);
    setRepositoryInput("");
  };

  // Handle remove repository
  const handleRemoveRepository = (repoToRemove: string) => {
    setRepositories(repositories.filter((repo) => repo !== repoToRemove));
  };

  // Handle add pull request
  const handleAddPullRequest = () => {
    if (!pullRequestInput.trim()) {
      message.warning("Please enter a pull request");
      return;
    }

    if (pullRequests.includes(pullRequestInput.trim())) {
      message.warning("This pull request already exists in the list");
      return;
    }

    setPullRequests([...pullRequests, pullRequestInput.trim()]);
    setPullRequestInput("");
  };

  // Handle remove pull request
  const handleRemovePullRequest = (prToRemove: string) => {
    setPullRequests(pullRequests.filter((pr) => pr !== prToRemove));
  };

  // Handle Enter key for inputs
  const handleRepositoryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRepository();
    }
  };

  const handlePullRequestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPullRequest();
    }
  };

  // Fetch tickets when project is selected (MODIFIED to also set selectedProjectId)
  const handleProjectChange = async (projectId: string) => {
    // NEW: Set selected project ID for version tracking
    setSelectedProjectId(projectId);

    if (!projectId) {
      setAllTickets([]);
      setDisplayTickets([]);
      // NEW: Clear versions when project is deselected
      setExistingVersions([]);
      setLastVersion("");
      return;
    }

    try {
      setLoadingTickets(true);
      let ticketsData = [];

      try {
        const response = await TicketService.getTickets({
          projectId: projectId,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        ticketsData = response.data || [];
      } catch (error) {
        console.log("Main tickets endpoint failed, trying alternative...");
        ticketsData = await TicketService.getMyTicketsByProject(projectId);
      }

      if (Array.isArray(ticketsData) && ticketsData.length > 0) {
        setAllTickets(ticketsData);
        const latestTickets = ticketsData.slice(0, 10);
        setDisplayTickets(latestTickets);
      } else {
        setAllTickets([]);
        setDisplayTickets([]);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setAllTickets([]);
      setDisplayTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Handle ticket search
  const handleTicketSearch = (value: string) => {
    setTicketSearchTerm(value);

    if (!value.trim()) {
      const latestTickets = allTickets.slice(0, 10);
      setDisplayTickets(latestTickets);
    } else {
      const searchLower = value.toLowerCase();
      const filtered = allTickets.filter(
        (ticket) =>
          ticket.ticketNumber.toLowerCase().includes(searchLower) ||
          ticket.title.toLowerCase().includes(searchLower),
      );
      setDisplayTickets(filtered);
    }
  };

  const hasEditorContent = (editor: any) => {
    return (
      editor.document &&
      editor.document.length > 0 &&
      !(
        editor.document.length === 1 &&
        editor.document[0].type === "paragraph" &&
        (!editor.document[0].content || editor.document[0].content.length === 0)
      )
    );
  };

  const getEditorContent = (editor: any) => {
    return hasEditorContent(editor) ? editor.document : undefined;
  };

  // Preview functions (EXACTLY as before)
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
    return textContent.trim() || "Start typing to see preview...";
  };

  const renderPreviewContent = (content: any) => {
    if (!content) return "Start typing to see preview...";
    if (typeof content === "string")
      return content || "Start typing to see preview...";
    if (Array.isArray(content)) return extractTextFromBlocks(content);
    if (content?.document && Array.isArray(content.document))
      return extractTextFromBlocks(content.document);
    if (content?.blocks && Array.isArray(content.blocks))
      return extractTextFromBlocks(content.blocks);
    return "Start typing to see preview...";
  };

  const handleEditorFocus = (
    editor: any,
    title: string,
    icon: any,
    color: string,
  ) => {
    setActiveEditor({
      title,
      icon,
      color,
      content: editor.document,
    });
  };

  // Update preview in real-time as user types
  useEffect(() => {
    if (!activeEditor) return;

    // Create a mapping of editor titles to their document references
    const editorMap: Record<string, any> = {
      "Release Summary": summaryEditor.document,
      "Key Insights": keyInsightsEditor.document,
      "New Features": newFeaturesEditor.document,
      Improvements: improvementsEditor.document,
      "Bug Fixes": bugFixesEditor.document,
      "Breaking Changes": breakingChangesEditor.document,
      "API Changes": apiChangesEditor.document,
      "Database Changes": databaseChangesEditor.document,
      "Known Issues": knownIssuesEditor.document,
    };

    // Get the current document for the active editor
    const currentDocument = editorMap[activeEditor.title];

    // Only update if we have a document and it's different from what's in activeEditor
    if (currentDocument) {
      // Use a timeout to debounce rapid updates
      const timeoutId = setTimeout(() => {
        setActiveEditor((prev) =>
          prev ? { ...prev, content: currentDocument } : null,
        );
      }, 100); // Small delay for performance

      return () => clearTimeout(timeoutId);
    }
  }, [
    // Include ALL editor documents as dependencies
    activeEditor?.title,
    summaryEditor.document,
    keyInsightsEditor.document,
    newFeaturesEditor.document,
    improvementsEditor.document,
    bugFixesEditor.document,
    breakingChangesEditor.document,
    apiChangesEditor.document,
    databaseChangesEditor.document,
    knownIssuesEditor.document,
  ]);

  // MODIFIED: Add version validation to handlePublish
  const handlePublish = async () => {
    try {
      // Set publishing state to true
      setIsPublishing(true);

      await form.validateFields([
        "projectId",
        "version",
        "title",
        "releaseDate",
        "environment",
        "visibility",
      ]);

      // NEW: Check version conflict
      if (!validateVersion()) {
        setIsPublishing(false);
        return;
      }

      const values = form.getFieldsValue();

      if (!hasEditorContent(summaryEditor)) {
        message.error("Please enter release summary");
        setIsPublishing(false);
        return;
      }

      const projectId = values.projectId;
      if (!projectId) {
        message.error("Please select a project");
        setIsPublishing(false);
        return;
      }

      const linkedTickets = values.linkedTickets?.[0]?.ticket || [];

      const visibility =
        Array.isArray(values.visibility) && values.visibility.length > 0
          ? values.visibility
              .filter((v) => v !== undefined && v !== null)
              .map((v) => v.toUpperCase())
          : ["INTERNAL"];

      const status = "RELEASED";

      const releaseNoteData = {
        projectId,
        version: values.version.trim(),
        title: values.title.trim(),
        releaseDate: values.releaseDate?.toISOString(),
        environment: values.environment,
        visibility,
        summary: summaryEditor.document,
        keyInsights: getEditorContent(keyInsightsEditor),
        newFeatures: getEditorContent(newFeaturesEditor),
        improvements: getEditorContent(improvementsEditor),
        bugFixes: getEditorContent(bugFixesEditor),
        breakingChanges: getEditorContent(breakingChangesEditor),
        apiChanges: getEditorContent(apiChangesEditor),
        databaseChanges: getEditorContent(databaseChangesEditor),
        knownIssues: getEditorContent(knownIssuesEditor),
        linkedTickets,
        repositories,
        pullRequests,
        status,
      };

      if (isEditMode && editId) {
        await updateReleaseNote.mutateAsync({
          id: editId,
          data: releaseNoteData,
        });
        message.success("✅ Release note updated successfully");
      } else {
        await createReleaseNote.mutateAsync(releaseNoteData);
        message.success("✅ Release note published successfully");
      }

      router.push("/releasenotes");
    } catch (error: any) {
      console.error("❌ Publish failed:", error);

      if (error.errorFields) {
        message.error("Please fill in all required fields");
      } else if (error.response) {
        console.error("API Error Response:", error.response.data);
        message.error(
          error.response.data?.error || "Failed to publish release note",
        );
      } else if (error.request) {
        message.error("Network error. Please check your connection.");
      } else {
        message.error(error?.message || "Failed to publish release note");
      }
    } finally {
      // Always set publishing state to false when done
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Set saving draft state to true
      setIsSavingDraft(true);

      const values = form.getFieldsValue();
      const projectId = values.projectId;

      if (!projectId) {
        message.error("Please select a project to save draft");
        setIsSavingDraft(false);
        return;
      }

      const linkedTickets = values.linkedTickets?.[0]?.ticket || [];

      const visibility = Array.isArray(values.visibility)
        ? values.visibility
            .filter((v) => v !== undefined && v !== null)
            .map((v) => v.toUpperCase())
        : [];

      const status = "DRAFT";

      const draftData = {
        projectId,
        version: values.version || "",
        title: values.title || "",
        releaseDate:
          values.releaseDate?.toISOString() || new Date().toISOString(),
        environment: values.environment || "",
        visibility,
        summary: getEditorContent(summaryEditor) || {},
        keyInsights: getEditorContent(keyInsightsEditor) || {},
        newFeatures: getEditorContent(newFeaturesEditor) || {},
        improvements: getEditorContent(improvementsEditor) || {},
        bugFixes: getEditorContent(bugFixesEditor) || {},
        breakingChanges: getEditorContent(breakingChangesEditor) || {},
        apiChanges: getEditorContent(apiChangesEditor) || {},
        databaseChanges: getEditorContent(databaseChangesEditor) || {},
        knownIssues: getEditorContent(knownIssuesEditor) || {},
        linkedTickets,
        repositories,
        pullRequests,
        status,
      };

      if (isEditMode && editId) {
        await updateReleaseNote.mutateAsync({ id: editId, data: draftData });
        message.success("Draft updated successfully");
      } else {
        await createReleaseNote.mutateAsync(draftData);
        message.success("Draft saved successfully");
      }

      router.push("/releasenotes");
    } catch (error: any) {
      console.error("Save draft failed:", error);
      message.error(error?.message || "Failed to save draft");
    } finally {
      // Always set saving draft state to false when done
      setIsSavingDraft(false);
    }
  };

  const getPageTitle = () => {
    if (isEditMode) return "Edit Release Notes";
    if (isDuplicateMode) return "Duplicate Release Notes";
    return "Create Release Notes";
  };

  const getPublishButtonText = () => {
    if (isEditMode) return "Save Changes";
    if (isDuplicateMode) return "Create Copy";
    return "Publish";
  };

  if (isLoadingRelease) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return (
    <App>
      <div
        style={{
          padding: 20,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/releasenotes")}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {getPageTitle()}
            </Title>
          </Space>
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setShowPreview(!showPreview)}
              type={showPreview ? "primary" : "default"}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              loading={isSavingDraft} // Use separate loading state
              disabled={isPublishing} // Disable if publishing is in progress
            >
              Save Draft
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublish}
              loading={isPublishing} // Use separate loading state
              disabled={isSavingDraft} // Disable if saving draft is in progress
            >
              {getPublishButtonText()}
            </Button>
          </Space>
        </div>

        {/* Rest of your JSX remains exactly the same */}
        <Divider style={{ margin: "0 0 16px 0" }} />

        {/* Split Layout */}
        <div
          style={{
            display: "flex",
            gap: 24,
            height: "calc(100vh - 120px)",
            overflow: "hidden",
          }}
        >
          {/* ===== LEFT PANEL - FORM ===== */}
          <div
            style={{
              flex: showPreview ? 0.6 : 1,
              overflowY: "auto",
              paddingRight: 8,
            }}
          >
            <Row justify="start">
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                {/* Basic Information Card */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Basic Information
                    </span>
                  }
                  styles={{ body: { padding: "16px 16px 8px 16px" } }}
                  style={{
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    marginBottom: 16,
                  }}
                >
                  <Form form={form} layout="vertical">
                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          label="Project"
                          name="projectId"
                          rules={[
                            {
                              required: true,
                              message: "Please select a project",
                            },
                          ]}
                        >
                          <Select
                            placeholder="Select project"
                            loading={loadingProjects}
                            showSearch
                            optionFilterProp="children"
                            onChange={handleProjectChange}
                          >
                            {projects.map((project) => (
                              <Select.Option
                                key={project.id}
                                value={project.id}
                              >
                                {project.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        {/* MODIFIED: Version field with last version display */}
                        <div
                          style={{
                            marginBottom: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <Text strong>Version</Text>
                          {!isEditMode && lastVersion && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 15, fontWeight: "bold" }}
                            >
                              Last Version:{" "}
                              <Text style={{ color: "#1890ff" }}>
                                {lastVersion}
                              </Text>
                            </Text>
                          )}
                        </div>

                        <Form.Item
                          name="version"
                          rules={[
                            { required: true, message: "Please enter version" },
                          ]}
                          validateStatus={versionWarning ? "warning" : ""}
                          help={versionWarning}
                          hasFeedback
                          style={{ marginBottom: 8 }}
                        >
                          <Input
                            placeholder="e.g., v2.3.0"
                            onChange={handleVersionChange}
                            onBlur={handleVersionBlur}
                            disabled={!selectedProjectId}
                          />
                        </Form.Item>

                        {/* NEW: Show warning alert for duplicate version */}
                        {/* {versionWarning && !isEditMode && (
                          <Alert
                            message={versionWarning}
                            type="warning"
                            showIcon
                            icon={<InfoCircleOutlined />}
                            style={{ marginBottom: 16 }}
                          />
                        )} */}
                        {/* Show duplicate version warning as text only */}
                        {versionWarning && !isEditMode && (
                          <div
                            style={{
                              color: "#faad14",
                              fontSize: "13px",
                              marginTop: "-12px",
                              marginBottom: "16px",
                            }}
                          >
                            ⚠️ Version "{form.getFieldValue("version")}" already
                            exists. Please use a different version.
                          </div>
                        )}
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label="Release Title"
                          name="title"
                          rules={[
                            {
                              required: true,
                              message: "Please enter release title",
                            },
                          ]}
                        >
                          <Input placeholder="e.g., Q1 2025 Platform Update" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Release Date"
                          name="releaseDate"
                          rules={[
                            {
                              required: true,
                              message: "Please select release date",
                            },
                          ]}
                        >
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Environment"
                          name="environment"
                          rules={[
                            {
                              required: true,
                              message: "Please select environment",
                            },
                          ]}
                        >
                          <Select
                            placeholder={
                              loadingEnvironments
                                ? "Loading environments..."
                                : "Select environment"
                            }
                            loading={loadingEnvironments}
                            showSearch
                            optionFilterProp="children"
                            notFoundContent={
                              loadingEnvironments
                                ? "Loading..."
                                : "No environments found"
                            }
                            disabled={
                              environments.length === 0 && !loadingEnvironments
                            }
                          >
                            {environments.map((env) => (
                              <Select.Option key={env.id} value={env.code}>
                                {env.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                {/* Release Summary Card - EXACTLY as before */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Release Summary
                    </span>
                  }
                  styles={{
                    header: { background: "transparent" },
                    body: {
                      background: "transparent",
                      padding: "16px 16px 8px 16px",
                    },
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Summary <span style={{ color: "#ff4d4f" }}>*</span>
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          summaryEditor,
                          "Release Summary",
                          "📋",
                          "#1890ff",
                        )
                      }
                    >
                      <div style={{ height: "150px", overflowY: "auto" }}>
                        <DocumentEditor
                          editor={summaryEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Key Insights
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          keyInsightsEditor,
                          "Key Insights",
                          "💡",
                          "#faad14",
                        )
                      }
                    >
                      <div style={{ height: "150px", overflowY: "auto" }}>
                        <DocumentEditor
                          editor={keyInsightsEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Change Log Card - EXACTLY as before */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Change Log
                    </span>
                  }
                  styles={{
                    header: { background: "transparent" },
                    body: {
                      background: "transparent",
                      padding: "16px 16px 8px 16px",
                    },
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      New Features
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          newFeaturesEditor,
                          "New Features",
                          "✨",
                          "#52c41a",
                        )
                      }
                    >
                      <div style={{ height: "150px" }}>
                        <DocumentEditor
                          editor={newFeaturesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Improvements
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          improvementsEditor,
                          "Improvements",
                          "🚀",
                          "#1890ff",
                        )
                      }
                    >
                      <div style={{ height: "150px" }}>
                        <DocumentEditor
                          editor={improvementsEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Bug Fixes
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          bugFixesEditor,
                          "Bug Fixes",
                          "🐛",
                          "#ff4d4f",
                        )
                      }
                    >
                      <div style={{ height: "150px" }}>
                        <DocumentEditor
                          editor={bugFixesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Breaking Changes
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          breakingChangesEditor,
                          "Breaking Changes",
                          "⚠️",
                          "#ff4d4f",
                        )
                      }
                    >
                      <div style={{ height: "150px" }}>
                        <DocumentEditor
                          editor={breakingChangesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Technical Issues Card - EXACTLY as before */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Technical Issues
                    </span>
                  }
                  styles={{
                    header: { background: "transparent" },
                    body: {
                      background: "transparent",
                      padding: "16px 16px 8px 16px",
                    },
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      API Changes
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          apiChangesEditor,
                          "API Changes",
                          "🔌",
                          "#722ed1",
                        )
                      }
                    >
                      <div style={{ height: "150px", overflowY: "auto" }}>
                        <DocumentEditor
                          editor={apiChangesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Database Changes
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          databaseChangesEditor,
                          "Database Changes",
                          "💾",
                          "#13c2c2",
                        )
                      }
                    >
                      <div style={{ height: "150px", overflowY: "auto" }}>
                        <DocumentEditor
                          editor={databaseChangesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      Known Issues
                    </div>
                    <div
                      style={{
                        minHeight: 150,
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleEditorFocus(
                          knownIssuesEditor,
                          "Known Issues",
                          "❗",
                          "#fa8c16",
                        )
                      }
                    >
                      <div style={{ height: "150px", overflowY: "auto" }}>
                        <DocumentEditor
                          editor={knownIssuesEditor}
                          viewMode="edit"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Linked Items Card - EXACTLY as before */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Linked Items
                    </span>
                  }
                  styles={{
                    header: { background: "transparent" },
                    body: {
                      background: "transparent",
                      padding: "16px 16px 8px 16px",
                    },
                  }}
                  style={{
                    marginTop: 16,
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                  }}
                >
                  <Form form={form} layout="vertical">
                    <Form.List name="linkedTickets" initialValue={[{}]}>
                      {(fields) => (
                        <Form.Item label="Linked Tickets" name={[0, "ticket"]}>
                          <Select
                            mode="multiple"
                            placeholder={
                              !form.getFieldValue("projectId")
                                ? "Please select a project first"
                                : loadingTickets
                                  ? "Loading tickets..."
                                  : displayTickets.length === 0
                                    ? "No tickets found"
                                    : `Select tickets (${allTickets.length} total, showing latest 10)`
                            }
                            allowClear
                            loading={loadingTickets}
                            disabled={
                              !form.getFieldValue("projectId") || loadingTickets
                            }
                            showSearch
                            optionFilterProp="children"
                            onSearch={handleTicketSearch}
                            filterOption={false}
                            notFoundContent={
                              ticketSearchTerm
                                ? "No matching tickets"
                                : "Type to search..."
                            }
                            style={{ width: "100%" }}
                          >
                            {displayTickets.map((ticket) => (
                              <Select.Option
                                key={ticket.id}
                                value={ticket.ticketNumber}
                              >
                                {ticket.ticketNumber} - {ticket.title}
                                <span
                                  style={{
                                    marginLeft: 8,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 11,
                                    backgroundColor:
                                      ticket.status === "completed"
                                        ? "#52c41a"
                                        : ticket.status === "in_progress"
                                          ? "#1890ff"
                                          : ticket.status === "blocked"
                                            ? "#ff4d4f"
                                            : "#d9d9d9",
                                    color: "#fff",
                                  }}
                                >
                                  {ticket.status}
                                </span>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      )}
                    </Form.List>

                    {/* Repositories Section - Manual Input with Add Button */}
                    <div style={{ marginBottom: 24 }}>
                      <Text
                        strong
                        style={{ display: "block", marginBottom: 8 }}
                      >
                        Repositories
                      </Text>
                      <Space.Compact
                        style={{ width: "100%", marginBottom: 12 }}
                      >
                        <Input
                          placeholder="Enter repository name"
                          value={repositoryInput}
                          onChange={(e) => setRepositoryInput(e.target.value)}
                          onKeyPress={handleRepositoryKeyPress}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddRepository}
                          disabled={!repositoryInput.trim()}
                        >
                          Add
                        </Button>
                      </Space.Compact>

                      {/* Display added repositories as tags with X */}
                      {repositories.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {repositories.map((repo, index) => (
                            <Tag
                              key={index}
                              closable
                              onClose={() => handleRemoveRepository(repo)}
                              style={{
                                marginBottom: 8,
                                marginRight: 8,
                                padding: "4px 12px",
                                fontSize: "14px",
                                background: "#f0f5ff",
                                border: "1px solid #91caff",
                                borderRadius: "4px",
                              }}
                            >
                              {repo}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pull Requests Section - Manual Input with Add Button */}
                    <div style={{ marginBottom: 24 }}>
                      <Text
                        strong
                        style={{ display: "block", marginBottom: 8 }}
                      >
                        Pull Requests
                      </Text>
                      <Space.Compact
                        style={{ width: "100%", marginBottom: 12 }}
                      >
                        <Input
                          placeholder="Enter pull request"
                          value={pullRequestInput}
                          onChange={(e) => setPullRequestInput(e.target.value)}
                          onKeyPress={handlePullRequestKeyPress}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={handleAddPullRequest}
                          disabled={!pullRequestInput.trim()}
                        >
                          Add
                        </Button>
                      </Space.Compact>

                      {/* Display added pull requests as tags with X */}
                      {pullRequests.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {pullRequests.map((pr, index) => (
                            <Tag
                              key={index}
                              closable
                              onClose={() => handleRemovePullRequest(pr)}
                              style={{
                                marginBottom: 8,
                                marginRight: 8,
                                padding: "4px 12px",
                                fontSize: "14px",
                                background: "#fff0f6",
                                border: "1px solid #ffadd2",
                                borderRadius: "4px",
                              }}
                            >
                              {pr}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </Form>
                </Card>

                {/* Visibility & Audience Card - EXACTLY as before */}
                <Card
                  title={
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      Visibility & Audience
                    </span>
                  }
                  styles={{
                    header: { background: "transparent" },
                    body: {
                      background: "transparent",
                      padding: "16px 16px 8px 16px",
                    },
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                    marginBottom: 16,
                  }}
                >
                  <Form form={form} layout="vertical">
                    <Form.Item
                      label="Select Visibility"
                      name="visibility"
                      rules={[
                        {
                          required: true,
                          message: "Please select at least one",
                        },
                      ]}
                    >
                      <Checkbox.Group>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <Checkbox value="INTERNAL">
                            Internal (Team Only)
                          </Checkbox>
                          <Checkbox value="CLIENT">Client Visible</Checkbox>
                          <Checkbox value="PUBLIC">Public</Checkbox>
                        </div>
                      </Checkbox.Group>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>

          {/* ===== RIGHT PANEL - PREVIEW ===== */}
          {showPreview && (
            <div
              style={{
                flex: 0.4,
                overflowY: "auto",
                background: "#f8f9fa",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  LIVE PREVIEW
                </Text>
              </div>

              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  border: activeEditor
                    ? `1px solid ${activeEditor.color}`
                    : "1px solid #f0f0f0",
                  boxShadow: activeEditor
                    ? `0 4px 12px ${activeEditor.color}20`
                    : "0 1px 2px rgba(0,0,0,0.03)",
                }}
                bodyStyle={{ padding: 20 }}
              >
                {activeEditor ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${activeEditor.color}10`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                          color: activeEditor.color,
                          fontSize: 18,
                        }}
                      >
                        {activeEditor.icon}
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 16, display: "block" }}>
                          {activeEditor.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Active Editor • Typing...
                        </Text>
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fafafa",
                        padding: 20,
                        borderRadius: 8,
                        fontSize: 14,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        maxHeight: 400,
                        overflowY: "auto",
                      }}
                    >
                      {renderPreviewContent(activeEditor.content)}
                    </div>
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        marginTop: 16,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Click on any editor to see live preview
                    </Text>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <EyeOutlined
                      style={{
                        fontSize: 48,
                        color: "#d9d9d9",
                        marginBottom: 16,
                      }}
                    />
                    <Title
                      level={5}
                      style={{ margin: 0, color: "#999", fontWeight: "normal" }}
                    >
                      No Editor Selected
                    </Title>
                    <Text
                      type="secondary"
                      style={{ display: "block", marginTop: 8 }}
                    >
                      Click on any editor field to see live preview
                    </Text>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </App>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
      }
    >
      <CreateReleaseNoteContent />
    </Suspense>
  );
}
