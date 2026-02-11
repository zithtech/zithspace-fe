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
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import DocumentEditor from "@/components/common/DocumentEditor";
import { useRef } from "react";

const { Title } = Typography;

export default function Page() {
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const editData = localStorage.getItem("editReleaseNote");
    if (editData) {
      setInitialData(JSON.parse(editData));
      setIsEditMode(true); // ✅ mark edit mode
      localStorage.removeItem("editReleaseNote"); // optional cleanup
    }
  }, []);
  

  const handlePublish = () => {
    const hardcodedData = {
      project: "project1",
      version: "v2.3.0",
      title: "Q1 2025 Platform Update",
      releaseDate: "2026-02-10",
      environment: "prod",
      summary: "This release focuses on improving performance and security.",
      keyInsights: "Major updates in UI and API, bug fixes included.",
      newFeatures: "New dashboard, enhanced reporting, notifications feature.",
      improvements: "Faster load time, optimized database queries.",
      bugFixes: "Fixed login bug, corrected date picker issue.",
      breakingChanges: "Deprecated old API endpoints v1.",
      apiChanges: "Updated GET /users endpoint response format.",
      databaseChanges: "Added new tables for logging, modified users table.",
      knownIssues: "Minor UI glitches in mobile view.",
      linkedTickets: ["TCK-101", "TCK-102"],
      repositories: ["repo-ui", "repo-api"],
      pullRequests: ["PR-45", "PR-46"],
      visibility: ["internal", "client"],
    };

    // 1️⃣ Save to localStorage
    localStorage.setItem("latestReleaseNote", JSON.stringify(hardcodedData));

    message.success("Release Notes published!");

    // 2️⃣ Redirect to main Release Notes page
    router.push("/releasenotes");
  };


  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          marginBottom: 24,
        }}
      >
        {/* Left - Back */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/releasenotes")}
        >
          Back
        </Button>

        {/* Center - Title */}
        <Title level={3} style={{ margin: 0 }}>
          {isEditMode ? "Edit Release Notes" : "Create Release Notes"}
        </Title>

        {/* Right - Actions */}
        <Space>
          <Button icon={<SaveOutlined />}>Save Draft</Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handlePublish} // can handle both create & edit
          >
            {isEditMode ? "Save Changes" : "Publish"}
          </Button>
        </Space>
      </div>
      <Divider></Divider>
      <div
        style={{
          height: "80vh",
          overflowY: "auto",

          /* Firefox */
          scrollbarWidth: "none",

          /* IE / old Edge */
          msOverflowStyle: "none",
        }}
        onScroll={(e) => {
          e.currentTarget.style.scrollbarWidth = "none";
        }}
      >
        <Row justify="center">
          <Col xs={24} sm={22} md={18} lg={14} xl={12}>
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Basic Information
                </span>
              }
              styles={{
                header: {
                  background: "transparent",
                  //  padding: "4px",
                },
                body: {
                  background: "transparent",
                  paddingTop: 8, // optional – content close
                  padding: "16px 16px 8px 16px",
                },
              }}
              style={{
                background: "transparent",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <Form layout="vertical">
                <Row gutter={24}>
                  {/* Project */}
                  <Col span={12}>
                    <Form.Item
                      label="Project"
                      name="project"
                      rules={[
                        { required: true, message: "Please select a project" },
                      ]}
                    >
                      <Select
                        placeholder="Select project"
                        className="transparent-select"
                        
                      >
                        <Select.Option value="project1">
                          Project 1
                        </Select.Option>
                        <Select.Option value="project2">
                          Project 2
                        </Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* Version */}
                  <Col span={12}>
                    <Form.Item
                      label="Version"
                      name="version"
                      rules={[
                        { required: true, message: "Please enter version" },
                      ]}
                    >
                      <Input
                        placeholder="e.g., v2.3.0"
                       
                        style={{ background: "transparent" }}
                      ></Input>
                    </Form.Item>
                  </Col>

                  {/* Release Title */}
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
                      <Input
                        placeholder="e.g., Q1 2025 Platform Update"
                        style={{ background: "transparent" }}
                      ></Input>
                    </Form.Item>
                  </Col>

                  {/* Release Date */}
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
                      <DatePicker
                       
                        style={{ width: "100%", background: "transparent" }}
                      ></DatePicker>
                    </Form.Item>
                  </Col>

                  {/* Environment */}
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
                        placeholder="Select environment"
                        className="transparent-select"
                      >
                        <Select.Option value="dev">Development</Select.Option>
                        <Select.Option value="qa">QA</Select.Option>
                        <Select.Option value="prod">Production</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Release Summary
                </span>
              }
              styles={{
                header: {
                  background: "transparent",
                },
                body: {
                  background: "transparent",
                  padding: "16px 16px 8px 16px",
                },
              }}
              style={{
                marginTop: 16, // 👈 space between cards
                background: "transparent",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <Form layout="vertical">
                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item
                      label="Summary"
                      name="summary"
                      rules={[
                        {
                          required: true,
                          message: "Please enter release summary",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder="Brief overview of this release..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item label="Key Insights" name="keyInsights">
                      <Input.TextArea
                        rows={4}
                        placeholder="Major highlights, improvements, or fixes..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card> */}
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Release Summary
                </span>
              }
              styles={{
                header: {
                  background: "transparent",
                },
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
              <Form layout="vertical">
                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item
                      label="Summary"
                      name="summary"
                      rules={[
                        {
                          required: true,
                          message: "Please enter release summary",
                        },
                      ]}
                    >
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px", overflowY: "auto" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()} // empty editor
                            //editor={summaryEditor}
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item label="Key Insights" name="keyInsights">
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px", overflowY: "auto" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()}
                            //editor={keyInsightsEditor }

                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

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
                marginTop: 16,
                background: "transparent",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <Form layout="vertical">
                <Row gutter={24}>
                  {/* New Features */}
                  <Col span={24}>
                    <Form.Item label="New Features" name="newFeatures">
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          //border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()} // your editor
                            //editor={newFeaturesEditor  }
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Improvements */}
                  <Col span={24}>
                    <Form.Item label="Improvements" name="improvements">
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          ///border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()} // your editor
                            //editor={improvementsEditor }
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Bug Fixes */}
                  <Col span={24}>
                    <Form.Item label="Bug Fixes" name="bugFixes">
                      <div
                        style={{
                          minHeight: 150,
                          //backgroundColor:"white",
                          borderRadius: 4,
                          //border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()} // your editor
                            //editor={bugFixesEditor  }
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Breaking Changes */}
                  <Col span={24}>
                    <Form.Item label="Breaking Changes" name="breakingChanges">
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          //border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <div style={{ height: "150px" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()} // your editor
                            //editor={breakingChangesEditor}
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Technical Issues
                </span>
              }
              styles={{
                header: {
                  background: "transparent",
                },
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
              <Form layout="vertical">
                <Row gutter={24}>
                
                  <Col span={24}>
                    <Form.Item label="API Changes" name="apiChanges">
                      <Input.TextArea
                        rows={4}
                        placeholder="Describe API modifications, endpoints, or payload changes..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                
                  <Col span={24}>
                    <Form.Item label="Database Changes" name="databaseChanges">
                      <Input.TextArea
                        rows={4}
                        placeholder="Schema updates, migrations, or data-related changes..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                
                  <Col span={24}>
                    <Form.Item label="Known Issues" name="knownIssues">
                      <Input.TextArea
                        rows={4}
                        placeholder="Known bugs or limitations users should be aware of..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card> */}
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
                marginTop: 16,
                background: "transparent",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <Form layout="vertical">
                <Row gutter={24}>
                  {/* API Changes */}
                  <Col span={24}>
                    <Form.Item label="API Changes" name="apiChanges">
                      <div
                        style={{ minHeight: 150, borderRadius: 4, padding: 8 }}
                      >
                        <div style={{ height: "150px", overflowY: "auto" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()}
                            //editor={apiChangesEditor }
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Database Changes */}
                  <Col span={24}>
                    <Form.Item label="Database Changes" name="databaseChanges">
                      <div
                        style={{ minHeight: 150, borderRadius: 4, padding: 8 }}
                      >
                        <div style={{ height: "150px", overflowY: "auto" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()}
                            //editor={databaseChangesEditor}
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Known Issues */}
                  <Col span={24}>
                    <Form.Item label="Known Issues" name="knownIssues">
                      <div
                        style={{ minHeight: 150, borderRadius: 4, padding: 8 }}
                      >
                        <div style={{ height: "150px", overflowY: "auto" }}>
                          <DocumentEditor
                            editor={useCreateBlockNote()}
                            //editor={knownIssuesEditor }
                            viewMode="edit"
                          />
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

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
              <Form layout="vertical">
                {/* 🔹 Linked Tickets */}
                {/* <Form.List name="linkedTickets" initialValue={[{}]}>
                  {(fields) => (
                    <>
                      <Form.Item
                        label="Linked Tickets"
                        name={[0, "ticket"]}
                        rules={[{ required: true, message: "Select ticket" }]}
                      >
                        <Select
                          placeholder="Select ticket"
                          className="transparent-select"
                        >
                          <Select.Option value="TCK-101">TCK-101</Select.Option>
                          <Select.Option value="TCK-102">TCK-102</Select.Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}
                </Form.List> */}
                <Form.List name="linkedTickets" initialValue={[{}]}>
                  {(fields) => (
                    <>
                      <Form.Item
                        label="Linked Tickets"
                        name={[0, "ticket"]}
                        rules={[
                          {
                            required: true,
                            message: "Select at least one ticket",
                          },
                        ]}
                      >
                        <Select
                          mode="multiple" // ✅ allows multiple selection
                          placeholder="Select ticket(s)"
                          className="transparent-select"
                          allowClear
                        >
                          <Select.Option value="TCK-101">TCK-101</Select.Option>
                          <Select.Option value="TCK-102">TCK-102</Select.Option>
                          <Select.Option value="TCK-103">TCK-103</Select.Option>
                          <Select.Option value="TCK-104">TCK-104</Select.Option>
                        </Select>
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <Row gutter={16}>
                  {/* 🔹 Repositories */}
                  <Col span={12}>
                    <Form.List name="repositories" initialValue={[{}]}>
                      {(fields) => (
                        <Form.Item
                          label="Repositories"
                          name={[0, "repository"]}
                          rules={[
                            { required: true, message: "Select repository" },
                          ]}
                        >
                          <Select
                            placeholder="Select repository"
                            className="transparent-select"
                            style={{ width: "100%" }}
                          >
                            <Select.Option value="repo-ui">
                              UI Repo
                            </Select.Option>
                            <Select.Option value="repo-api">
                              API Repo
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      )}
                    </Form.List>
                  </Col>

                  {/* 🔹 Pull Requests */}
                  <Col span={12}>
                    <Form.List name="pullRequests" initialValue={[{}]}>
                      {(fields) => (
                        <Form.Item
                          label="Pull Requests"
                          name={[0, "pr"]}
                          rules={[
                            { required: true, message: "Select pull request" },
                          ]}
                        >
                          <Select
                            placeholder="Select pull request"
                            className="transparent-select"
                            style={{ width: "100%" }}
                          >
                            <Select.Option value="PR-45">PR-45</Select.Option>
                            <Select.Option value="PR-46">PR-46</Select.Option>
                          </Select>
                        </Form.Item>
                      )}
                    </Form.List>
                  </Col>
                </Row>
              </Form>
            </Card>

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
                marginTop: 16,
                background: "transparent",
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
            >
              <Form layout="vertical">
                <Form.Item
                  label="Select Visibility"
                  name="visibility"
                  rules={[
                    { required: true, message: "Please select at least one" },
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
                      <Checkbox value="internal">Internal (Team Only)</Checkbox>
                      <Checkbox value="client">Client Visible</Checkbox>
                      <Checkbox value="public">Public</Checkbox>
                    </div>
                  </Checkbox.Group>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
// "use client";

// import {
//   Button,
//   Space,
//   Typography,
//   Divider,
//   Card,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Row,
//   Col,
//   Checkbox,
//   message,
// } from "antd";
// import {
//   ArrowLeftOutlined,
//   SaveOutlined,
//   SendOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useCreateBlockNote } from "@blocknote/react";
// import DocumentEditor from "@/components/common/DocumentEditor";

// const { Title } = Typography;

// export default function Page() {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [initialData, setInitialData] = useState<any>(null);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Initialize editors for each rich text field
//   const summaryEditor = useCreateBlockNote();
//   const keyInsightsEditor = useCreateBlockNote();
//   const newFeaturesEditor = useCreateBlockNote();
//   const improvementsEditor = useCreateBlockNote();
//   const bugFixesEditor = useCreateBlockNote();
//   const breakingChangesEditor = useCreateBlockNote();
//   const apiChangesEditor = useCreateBlockNote();
//   const databaseChangesEditor = useCreateBlockNote();
//   const knownIssuesEditor = useCreateBlockNote();

//   // Load edit data
//   useEffect(() => {
//     const editData = localStorage.getItem("editReleaseNote");
//     if (editData) {
//       const parsedData = JSON.parse(editData);
//       setInitialData(parsedData);
//       setIsEditMode(true);
      
//       // Pre-fill form with existing data
//       form.setFieldsValue({
//         project: parsedData.project,
//         version: parsedData.version,
//         title: parsedData.title,
//         releaseDate: parsedData.releaseDate ? dayjs(parsedData.releaseDate) : null,
//         environment: parsedData.environment,
//         linkedTickets: parsedData.linkedTickets,
//         repositories: parsedData.repositories,
//         pullRequests: parsedData.pullRequests,
//         visibility: parsedData.visibility,
//       });
      
//       // Pre-fill rich text editors
//       setTimeout(() => {
//         if (parsedData.summary && parsedData.summary.blocks) {
//           summaryEditor.replaceBlocks(summaryEditor.document, parsedData.summary.blocks);
//         }
//         if (parsedData.keyInsights && parsedData.keyInsights.blocks) {
//           keyInsightsEditor.replaceBlocks(keyInsightsEditor.document, parsedData.keyInsights.blocks);
//         }
//         // ... similarly for other rich text fields
//       }, 100);
      
//       localStorage.removeItem("editReleaseNote");
//     }
//   }, [form]);

//   const handlePublish = async () => {
//     try {
//       setLoading(true);
      
//       // Validate form
//       await form.validateFields();
      
//       // Get form values
//       const formValues = form.getFieldsValue();
      
//       // Get content from rich text editors
//       const formData = {
//         ...formValues,
//         releaseDate: formValues.releaseDate ? formValues.releaseDate.format('YYYY-MM-DD') : null,
        
//         // Get content from BlockNote editors
//         summary: await summaryEditor.blocksToMarkdownLossy(summaryEditor.document),
//         keyInsights: await keyInsightsEditor.blocksToMarkdownLossy(keyInsightsEditor.document),
//         newFeatures: await newFeaturesEditor.blocksToMarkdownLossy(newFeaturesEditor.document),
//         improvements: await improvementsEditor.blocksToMarkdownLossy(improvementsEditor.document),
//         bugFixes: await bugFixesEditor.blocksToMarkdownLossy(bugFixesEditor.document),
//         breakingChanges: await breakingChangesEditor.blocksToMarkdownLossy(breakingChangesEditor.document),
//         apiChanges: await apiChangesEditor.blocksToMarkdownLossy(apiChangesEditor.document),
//         databaseChanges: await databaseChangesEditor.blocksToMarkdownLossy(databaseChangesEditor.document),
//         knownIssues: await knownIssuesEditor.blocksToMarkdownLossy(knownIssuesEditor.document),
        
//         // Also store the block data for editing
//         summaryBlocks: summaryEditor.document,
//         keyInsightsBlocks: keyInsightsEditor.document,
//         newFeaturesBlocks: newFeaturesEditor.document,
//         improvementsBlocks: improvementsEditor.document,
//         bugFixesBlocks: bugFixesEditor.document,
//         breakingChangesBlocks: breakingChangesEditor.document,
//         apiChangesBlocks: apiChangesEditor.document,
//         databaseChangesBlocks: databaseChangesEditor.document,
//         knownIssuesBlocks: knownIssuesEditor.document,
//       };

//       // Save to localStorage
//       localStorage.setItem("latestReleaseNote", JSON.stringify(formData));
      
//       message.success(`Release Notes ${isEditMode ? 'updated' : 'published'} successfully!`);
      
//       // Redirect to main Release Notes page
//       router.push("/releasenotes");
//     } catch (error) {
//       console.error("Error publishing:", error);
//       message.error("Please fill all required fields");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSaveDraft = async () => {
//     try {
//       const formValues = form.getFieldsValue();
//       const draftData = {
//         ...formValues,
//         releaseDate: formValues.releaseDate ? formValues.releaseDate.format('YYYY-MM-DD') : null,
//         summary: await summaryEditor.blocksToMarkdownLossy(summaryEditor.document),
//         keyInsights: await keyInsightsEditor.blocksToMarkdownLossy(keyInsightsEditor.document),
//         // ... other fields
//       };
      
//       localStorage.setItem("draftReleaseNote", JSON.stringify(draftData));
//       message.success("Draft saved successfully!");
//     } catch (error) {
//       message.error("Error saving draft");
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       {/* Header */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-around",
//           marginBottom: 24,
//         }}
//       >
//         {/* Left - Back */}
//         <Button
//           icon={<ArrowLeftOutlined />}
//           onClick={() => router.push("/releasenotes")}
//         >
//           Back
//         </Button>

//         {/* Center - Title */}
//         <Title level={3} style={{ margin: 0 }}>
//           {isEditMode ? "Edit Release Notes" : "Create Release Notes"}
//         </Title>

//         {/* Right - Actions */}
//         <Space>
//           <Button 
//             icon={<SaveOutlined />}
//             onClick={handleSaveDraft}
//           >
//             Save Draft
//           </Button>
//           <Button
//             type="primary"
//             icon={<SendOutlined />}
//             onClick={handlePublish}
//             loading={loading}
//           >
//             {isEditMode ? "Save Changes" : "Publish"}
//           </Button>
//         </Space>
//       </div>
//       <Divider></Divider>
      
//       <Form form={form} layout="vertical">
//         <div
//           style={{
//             height: "80vh",
//             overflowY: "auto",
//             scrollbarWidth: "none",
//             msOverflowStyle: "none",
//           }}
//         >
//           <Row justify="center">
//             <Col xs={24} sm={22} md={18} lg={14} xl={12}>
//               {/* Basic Information Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Basic Information
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     paddingTop: 8,
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={12}>
//                     <Form.Item
//                       label="Project"
//                       name="project"
//                       rules={[
//                         { required: true, message: "Please select a project" },
//                       ]}
//                     >
//                       <Select placeholder="Select project">
//                         <Select.Option value="project1">Project 1</Select.Option>
//                         <Select.Option value="project2">Project 2</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Version"
//                       name="version"
//                       rules={[
//                         { required: true, message: "Please enter version" },
//                       ]}
//                     >
//                       <Input placeholder="e.g., v2.3.0" />
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item
//                       label="Release Title"
//                       name="title"
//                       rules={[
//                         { required: true, message: "Please enter release title" },
//                       ]}
//                     >
//                       <Input placeholder="e.g., Q1 2025 Platform Update" />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Release Date"
//                       name="releaseDate"
//                       rules={[
//                         { required: true, message: "Please select release date" },
//                       ]}
//                     >
//                       <DatePicker style={{ width: "100%" }} />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Environment"
//                       name="environment"
//                       rules={[
//                         { required: true, message: "Please select environment" },
//                       ]}
//                     >
//                       <Select placeholder="Select environment">
//                         <Select.Option value="dev">Development</Select.Option>
//                         <Select.Option value="qa">QA</Select.Option>
//                         <Select.Option value="prod">Production</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Release Summary Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Release Summary
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item
//                       label="Summary"
//                       name="summary"
//                       rules={[
//                         { required: true, message: "Please enter release summary" },
//                       ]}
//                     >
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={summaryEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Key Insights" name="keyInsights">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={keyInsightsEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Change Log Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Change Log
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item label="New Features" name="newFeatures">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={newFeaturesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Improvements" name="improvements">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={improvementsEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Bug Fixes" name="bugFixes">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={bugFixesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Breaking Changes" name="breakingChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={breakingChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Technical Issues Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Technical Issues
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item label="API Changes" name="apiChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={apiChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Database Changes" name="databaseChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={databaseChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Known Issues" name="knownIssues">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={knownIssuesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Linked Items Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Linked Items
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Form.List name="linkedTickets">
//                   {(fields) => (
//                     <Form.Item
//                       label="Linked Tickets"
//                       name="linkedTickets"
//                       rules={[
//                         {
//                           required: true,
//                           message: "Select at least one ticket",
//                         },
//                       ]}
//                     >
//                       <Select
//                         mode="multiple"
//                         placeholder="Select ticket(s)"
//                         allowClear
//                       >
//                         <Select.Option value="TCK-101">TCK-101</Select.Option>
//                         <Select.Option value="TCK-102">TCK-102</Select.Option>
//                         <Select.Option value="TCK-103">TCK-103</Select.Option>
//                         <Select.Option value="TCK-104">TCK-104</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   )}
//                 </Form.List>

//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <Form.List name="repositories">
//                       {(fields) => (
//                         <Form.Item
//                           label="Repositories"
//                           name="repositories"
//                           rules={[
//                             { required: true, message: "Select repository" },
//                           ]}
//                         >
//                           <Select
//                             mode="multiple"
//                             placeholder="Select repository"
//                             style={{ width: "100%" }}
//                           >
//                             <Select.Option value="repo-ui">UI Repo</Select.Option>
//                             <Select.Option value="repo-api">API Repo</Select.Option>
//                           </Select>
//                         </Form.Item>
//                       )}
//                     </Form.List>
//                   </Col>

//                   <Col span={12}>
//                     <Form.List name="pullRequests">
//                       {(fields) => (
//                         <Form.Item
//                           label="Pull Requests"
//                           name="pullRequests"
//                           rules={[
//                             { required: true, message: "Select pull request" },
//                           ]}
//                         >
//                           <Select
//                             mode="multiple"
//                             placeholder="Select pull request"
//                             style={{ width: "100%" }}
//                           >
//                             <Select.Option value="PR-45">PR-45</Select.Option>
//                             <Select.Option value="PR-46">PR-46</Select.Option>
//                           </Select>
//                         </Form.Item>
//                       )}
//                     </Form.List>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Visibility & Audience Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Visibility & Audience
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Form.Item
//                   label="Select Visibility"
//                   name="visibility"
//                   rules={[
//                     { required: true, message: "Please select at least one" },
//                   ]}
//                 >
//                   <Checkbox.Group>
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 8,
//                       }}
//                     >
//                       <Checkbox value="internal">Internal (Team Only)</Checkbox>
//                       <Checkbox value="client">Client Visible</Checkbox>
//                       <Checkbox value="public">Public</Checkbox>
//                     </div>
//                   </Checkbox.Group>
//                 </Form.Item>
//               </Card>
//             </Col>
//           </Row>
//         </div>
//       </Form>
//     </div>
//   );
// }








// "use client";

// import {
//   Button,
//   Space,
//   Typography,
//   Divider,
//   Card,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Row,
//   Col,
//   Checkbox,
//   message,
// } from "antd";
// import {
//   ArrowLeftOutlined,
//   SaveOutlined,
//   SendOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useCreateBlockNote } from "@blocknote/react";
// import DocumentEditor from "@/components/common/DocumentEditor";

// const { Title } = Typography;

// export default function Page() {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [initialData, setInitialData] = useState<any>(null);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Initialize editors for each rich text field
//   const summaryEditor = useCreateBlockNote();
//   const keyInsightsEditor = useCreateBlockNote();
//   const newFeaturesEditor = useCreateBlockNote();
//   const improvementsEditor = useCreateBlockNote();
//   const bugFixesEditor = useCreateBlockNote();
//   const breakingChangesEditor = useCreateBlockNote();
//   const apiChangesEditor = useCreateBlockNote();
//   const databaseChangesEditor = useCreateBlockNote();
//   const knownIssuesEditor = useCreateBlockNote();

//   // Load edit data
//   useEffect(() => {
//     const editData = localStorage.getItem("editReleaseNote");
//     if (editData) {
//       const parsedData = JSON.parse(editData);
//       setInitialData(parsedData);
//       setIsEditMode(true);
      
//       // Pre-fill form with existing data
//       form.setFieldsValue({
//         project: parsedData.project,
//         version: parsedData.version,
//         title: parsedData.title,
//         releaseDate: parsedData.releaseDate ? dayjs(parsedData.releaseDate) : null,
//         environment: parsedData.environment,
//         linkedTickets: parsedData.linkedTickets,
//         repositories: parsedData.repositories,
//         pullRequests: parsedData.pullRequests,
//         visibility: parsedData.visibility,
//       });
      
//       // Pre-fill rich text editors
//       setTimeout(() => {
//         if (parsedData.summaryBlocks) {
//           summaryEditor.replaceBlocks(summaryEditor.document, parsedData.summaryBlocks);
//         }
//         if (parsedData.keyInsightsBlocks) {
//           keyInsightsEditor.replaceBlocks(keyInsightsEditor.document, parsedData.keyInsightsBlocks);
//         }
//         if (parsedData.newFeaturesBlocks) {
//           newFeaturesEditor.replaceBlocks(newFeaturesEditor.document, parsedData.newFeaturesBlocks);
//         }
//         if (parsedData.improvementsBlocks) {
//           improvementsEditor.replaceBlocks(improvementsEditor.document, parsedData.improvementsBlocks);
//         }
//         if (parsedData.bugFixesBlocks) {
//           bugFixesEditor.replaceBlocks(bugFixesEditor.document, parsedData.bugFixesBlocks);
//         }
//         if (parsedData.breakingChangesBlocks) {
//           breakingChangesEditor.replaceBlocks(breakingChangesEditor.document, parsedData.breakingChangesBlocks);
//         }
//         if (parsedData.apiChangesBlocks) {
//           apiChangesEditor.replaceBlocks(apiChangesEditor.document, parsedData.apiChangesBlocks);
//         }
//         if (parsedData.databaseChangesBlocks) {
//           databaseChangesEditor.replaceBlocks(databaseChangesEditor.document, parsedData.databaseChangesBlocks);
//         }
//         if (parsedData.knownIssuesBlocks) {
//           knownIssuesEditor.replaceBlocks(knownIssuesEditor.document, parsedData.knownIssuesBlocks);
//         }
//       }, 100);
      
//       localStorage.removeItem("editReleaseNote");
//     }
//   }, [form]);

//   const handlePublish = async () => {
//     try {
//       setLoading(true);
      
//       // Validate form
//       await form.validateFields();
      
//       // Get form values
//       const formValues = form.getFieldsValue();
      
//       console.log("Form values:", formValues);
//       console.log("Editor contents:");
//       console.log("Summary blocks:", summaryEditor.document);
      
//       // Create form data object - ONLY what user entered
//       const formData = {
//         project: formValues.project,
//         version: formValues.version,
//         title: formValues.title,
//         releaseDate: formValues.releaseDate ? formValues.releaseDate.format('YYYY-MM-DD') : null,
//         environment: formValues.environment,
//         linkedTickets: formValues.linkedTickets || [],
//         repositories: formValues.repositories || [],
//         pullRequests: formValues.pullRequests || [],
//         visibility: formValues.visibility || [],
        
//         // Get the block content from editors
//         summaryBlocks: summaryEditor.document,
//         keyInsightsBlocks: keyInsightsEditor.document,
//         newFeaturesBlocks: newFeaturesEditor.document,
//         improvementsBlocks: improvementsEditor.document,
//         bugFixesBlocks: bugFixesEditor.document,
//         breakingChangesBlocks: breakingChangesEditor.document,
//         apiChangesBlocks: apiChangesEditor.document,
//         databaseChangesBlocks: databaseChangesEditor.document,
//         knownIssuesBlocks: knownIssuesEditor.document,
        
//         // Also save markdown for display if needed
//         summary: await summaryEditor.blocksToMarkdownLossy(summaryEditor.document),
//         keyInsights: await keyInsightsEditor.blocksToMarkdownLossy(keyInsightsEditor.document),
//         newFeatures: await newFeaturesEditor.blocksToMarkdownLossy(newFeaturesEditor.document),
//         improvements: await improvementsEditor.blocksToMarkdownLossy(improvementsEditor.document),
//         bugFixes: await bugFixesEditor.blocksToMarkdownLossy(bugFixesEditor.document),
//         breakingChanges: await breakingChangesEditor.blocksToMarkdownLossy(breakingChangesEditor.document),
//         apiChanges: await apiChangesEditor.blocksToMarkdownLossy(apiChangesEditor.document),
//         databaseChanges: await databaseChangesEditor.blocksToMarkdownLossy(databaseChangesEditor.document),
//         knownIssues: await knownIssuesEditor.blocksToMarkdownLossy(knownIssuesEditor.document),
//       };

//       console.log("Form data to save:", formData);

//       // Save to localStorage with a small delay to ensure it's written
//       localStorage.setItem("latestReleaseNote", JSON.stringify(formData));
      
//       // Also add to release history
//       const existingHistory = localStorage.getItem("releaseHistory");
//       let releaseHistory = existingHistory ? JSON.parse(existingHistory) : [];
//       releaseHistory = [formData, ...releaseHistory];
//       localStorage.setItem("releaseHistory", JSON.stringify(releaseHistory));
      
//       // Force a sync by reading back to confirm
//       const saved = localStorage.getItem("latestReleaseNote");
//       console.log("Saved data (read back):", saved);
      
//       message.success(`Release Notes ${isEditMode ? 'updated' : 'published'} successfully!`);
      
//       // Add a small delay before redirecting to ensure localStorage is saved
//       setTimeout(() => {
//         router.push("/releasenotes");
//       }, 100);
      
//     } catch (error) {
//       console.error("Error publishing:", error);
//       message.error("Please fill all required fields");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSaveDraft = async () => {
//     try {
//       const formValues = form.getFieldsValue();
//       const draftData = {
//         ...formValues,
//         releaseDate: formValues.releaseDate ? formValues.releaseDate.format('YYYY-MM-DD') : null,
//         summaryBlocks: summaryEditor.document,
//         keyInsightsBlocks: keyInsightsEditor.document,
//         newFeaturesBlocks: newFeaturesEditor.document,
//         improvementsBlocks: improvementsEditor.document,
//         bugFixesBlocks: bugFixesEditor.document,
//         breakingChangesBlocks: breakingChangesEditor.document,
//         apiChangesBlocks: apiChangesEditor.document,
//         databaseChangesBlocks: databaseChangesEditor.document,
//         knownIssuesBlocks: knownIssuesEditor.document,
//       };
      
//       localStorage.setItem("draftReleaseNote", JSON.stringify(draftData));
//       message.success("Draft saved successfully!");
//     } catch (error) {
//       message.error("Error saving draft");
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       {/* Header */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-around",
//           marginBottom: 24,
//         }}
//       >
//         {/* Left - Back */}
//         <Button
//           icon={<ArrowLeftOutlined />}
//           onClick={() => router.push("/releasenotes")}
//         >
//           Back
//         </Button>

//         {/* Center - Title */}
//         <Title level={3} style={{ margin: 0 }}>
//           {isEditMode ? "Edit Release Notes" : "Create Release Notes"}
//         </Title>

//         {/* Right - Actions */}
//         <Space>
//           <Button 
//             icon={<SaveOutlined />}
//             onClick={handleSaveDraft}
//           >
//             Save Draft
//           </Button>
//           <Button
//             type="primary"
//             icon={<SendOutlined />}
//             onClick={handlePublish}
//             loading={loading}
//           >
//             {isEditMode ? "Save Changes" : "Publish"}
//           </Button>
//         </Space>
//       </div>
//       <Divider></Divider>
      
//       <Form form={form} layout="vertical">
//         <div
//           style={{
//             height: "80vh",
//             overflowY: "auto",
//             scrollbarWidth: "none",
//             msOverflowStyle: "none",
//           }}
//         >
//           <Row justify="center">
//             <Col xs={24} sm={22} md={18} lg={14} xl={12}>
//               {/* Basic Information Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Basic Information
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     paddingTop: 8,
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={12}>
//                     <Form.Item
//                       label="Project"
//                       name="project"
//                       rules={[
//                         { required: true, message: "Please select a project" },
//                       ]}
//                     >
//                       <Select placeholder="Select project">
//                         <Select.Option value="project1">Project 1</Select.Option>
//                         <Select.Option value="project2">Project 2</Select.Option>
//                         <Select.Option value="project3">Project 3</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Version"
//                       name="version"
//                       rules={[
//                         { required: true, message: "Please enter version" },
//                       ]}
//                     >
//                       <Input placeholder="e.g., v2.3.0" />
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item
//                       label="Release Title"
//                       name="title"
//                       rules={[
//                         { required: true, message: "Please enter release title" },
//                       ]}
//                     >
//                       <Input placeholder="e.g., Q1 2025 Platform Update" />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Release Date"
//                       name="releaseDate"
//                       rules={[
//                         { required: true, message: "Please select release date" },
//                       ]}
//                     >
//                       <DatePicker style={{ width: "100%" }} />
//                     </Form.Item>
//                   </Col>

//                   <Col span={12}>
//                     <Form.Item
//                       label="Environment"
//                       name="environment"
//                       rules={[
//                         { required: true, message: "Please select environment" },
//                       ]}
//                     >
//                       <Select placeholder="Select environment">
//                         <Select.Option value="dev">Development</Select.Option>
//                         <Select.Option value="qa">QA</Select.Option>
//                         <Select.Option value="prod">Production</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Release Summary Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Release Summary
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item
//                       label="Summary"
//                       name="summary"
//                       rules={[
//                         { required: true, message: "Please enter release summary" },
//                       ]}
//                     >
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={summaryEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Key Insights" name="keyInsights">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={keyInsightsEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Change Log Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Change Log
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item label="New Features" name="newFeatures">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={newFeaturesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Improvements" name="improvements">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={improvementsEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Bug Fixes" name="bugFixes">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={bugFixesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Breaking Changes" name="breakingChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px" }}>
//                           <DocumentEditor
//                             editor={breakingChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Technical Issues Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Technical Issues
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item label="API Changes" name="apiChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={apiChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Database Changes" name="databaseChanges">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={databaseChangesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item label="Known Issues" name="knownIssues">
//                       <div style={{ minHeight: 150, borderRadius: 4, padding: 8 }}>
//                         <div style={{ height: "150px", overflowY: "auto" }}>
//                           <DocumentEditor
//                             editor={knownIssuesEditor}
//                             viewMode="edit"
//                           />
//                         </div>
//                       </div>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Linked Items Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Linked Items
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Row gutter={24}>
//                   <Col span={24}>
//                     <Form.Item
//                       label="Linked Tickets"
//                       name="linkedTickets"
//                     >
//                       <Select
//                         mode="multiple"
//                         placeholder="Select ticket(s) (optional)"
//                         allowClear
//                       >
//                         <Select.Option value="TCK-101">TCK-101</Select.Option>
//                         <Select.Option value="TCK-102">TCK-102</Select.Option>
//                         <Select.Option value="TCK-103">TCK-103</Select.Option>
//                         <Select.Option value="TCK-104">TCK-104</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item
//                       label="Repositories"
//                       name="repositories"
//                     >
//                       <Select
//                         mode="multiple"
//                         placeholder="Select repository (optional)"
//                       >
//                         <Select.Option value="repo-ui">UI Repo</Select.Option>
//                         <Select.Option value="repo-api">API Repo</Select.Option>
//                         <Select.Option value="repo-mobile">Mobile Repo</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>

//                   <Col span={24}>
//                     <Form.Item
//                       label="Pull Requests"
//                       name="pullRequests"
//                     >
//                       <Select
//                         mode="multiple"
//                         placeholder="Select pull request (optional)"
//                       >
//                         <Select.Option value="PR-45">PR-45</Select.Option>
//                         <Select.Option value="PR-46">PR-46</Select.Option>
//                         <Select.Option value="PR-47">PR-47</Select.Option>
//                         <Select.Option value="PR-48">PR-48</Select.Option>
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               </Card>

//               {/* Visibility & Audience Card */}
//               <Card
//                 title={
//                   <span style={{ fontWeight: 600, fontSize: 16 }}>
//                     Visibility & Audience
//                   </span>
//                 }
//                 styles={{
//                   header: { background: "transparent" },
//                   body: {
//                     background: "transparent",
//                     padding: "16px 16px 8px 16px",
//                   },
//                 }}
//                 style={{
//                   marginTop: 16,
//                   background: "transparent",
//                   border: "1px solid #e5e7eb",
//                   boxShadow: "none",
//                 }}
//               >
//                 <Form.Item
//                   label="Select Visibility"
//                   name="visibility"
//                   rules={[
//                     { required: true, message: "Please select at least one" },
//                   ]}
//                 >
//                   <Checkbox.Group>
//                     <div
//                       style={{
//                         display: "flex",
//                         flexDirection: "column",
//                         gap: 8,
//                       }}
//                     >
//                       <Checkbox value="internal">Internal (Team Only)</Checkbox>
//                       <Checkbox value="client">Client Visible</Checkbox>
//                       <Checkbox value="public">Public</Checkbox>
//                     </div>
//                   </Checkbox.Group>
//                 </Form.Item>
//               </Card>
//             </Col>
//           </Row>
//         </div>
//       </Form>
//     </div>
//   );
// }
