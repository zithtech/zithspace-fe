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
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCreateBlockNote } from "@blocknote/react";
import DocumentEditor from "@/components/common/DocumentEditor";

const { Title } = Typography;

export default function Page() {
  const router = useRouter();

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
          Create Release Notes
        </Title>

        {/* Right - Actions */}
        <Space>
          <Button icon={<SaveOutlined />}>Save Draft</Button>
          <Button type="primary" icon={<SendOutlined />}>
            Publish
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
            </Card>

            {/* 
            <Card
              title={
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  Change Log
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
                    <Form.Item label="New Features" name="newFeatures">
                      <Input.TextArea
                        rows={4}
                        placeholder="List newly added features in this release..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                
                  <Col span={24}>
                    <Form.Item label="Improvements" name="improvements">
                      <Input.TextArea
                        rows={4}
                        placeholder="Enhancements and performance improvements..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24}>
                    <Form.Item label="Bug Fixes" name="bugFixes">
                      <Input.TextArea
                        rows={4}
                        placeholder="Bugs fixed in this release..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                  
                  <Col span={24}>
                    <Form.Item label="Breaking Changes" name="breakingChanges">
                      <Input.TextArea
                        rows={4}
                        placeholder="Any breaking changes users should be aware of..."
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
                          border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <DocumentEditor
                          //   editor={useCreateBlockNote({ initialContent: [] })}
                          editor={useCreateBlockNote()} // ✅ empty editor
                          viewMode="edit" // ← important for Notion-style editor
                        />
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
                          border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <DocumentEditor
                          //   editor={useCreateBlockNote({ initialContent: [] })}
                          editor={useCreateBlockNote()} // ✅ empty editor
                          viewMode="edit"
                        />
                      </div>
                    </Form.Item>
                  </Col>

                  {/* Bug Fixes */}
                  <Col span={24}>
                    <Form.Item label="Bug Fixes" name="bugFixes">
                      <div
                        style={{
                          minHeight: 150,
                          borderRadius: 4,
                          border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <DocumentEditor
                          //   editor={useCreateBlockNote({ initialContent: [] })}
                          editor={useCreateBlockNote()} // ✅ empty editor
                          viewMode="edit"
                        />
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
                          border: "1px solid #e5e7eb",
                          padding: 8,
                        }}
                      >
                        <DocumentEditor
                          //   editor={useCreateBlockNote({ initialContent: [] })}
                          editor={useCreateBlockNote()} // ✅ empty editor
                          viewMode="edit"
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <Card
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
                  {/* API Changes */}
                  <Col span={24}>
                    <Form.Item label="API Changes" name="apiChanges">
                      <Input.TextArea
                        rows={4}
                        placeholder="Describe API modifications, endpoints, or payload changes..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                  {/* Database Changes */}
                  <Col span={24}>
                    <Form.Item label="Database Changes" name="databaseChanges">
                      <Input.TextArea
                        rows={4}
                        placeholder="Schema updates, migrations, or data-related changes..."
                        style={{ background: "transparent" }}
                      />
                    </Form.Item>
                  </Col>

                  {/* Known Issues */}
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
                <Form.List name="linkedTickets" initialValue={[{}]}>
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
