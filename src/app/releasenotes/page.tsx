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
} from "antd";
const { Title } = Typography;
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

export default function ReleaseNotesPage() {
  const router = useRouter();

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
              padding: 0, // 🔥 important
              height: "100%",
              overflow: "hidden", // parent should NOT scroll
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 🔒 FIXED / STICKY HEADER */}
            {/* <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: "#f5f5f5", // match layout bg
                padding: "24px 24px 0",
              }}
            >
              <Title level={4} style={{ marginBottom: 0 }}>
                Q1 2025 Platform Update
              </Title>
              <Space>
                <Button icon={<EditOutlined />}>Edit</Button>
                <Button icon={<ShareAltOutlined />}>Share</Button>
                <Button icon={<DownloadOutlined />}>Export</Button>

                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "duplicate",
                        label: "Duplicate release",
                      },
                      {
                        key: "archive",
                        label: "Archive release",
                      },
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

              <Divider />
            </div> */}
            <div
  style={{
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#f5f5f5",
    padding: "16px 24px 0",
  }}
>
  {/* HEADER ROW */}
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
      Q1 2025 Platform Update
    </Title>

    {/* RIGHT : ACTIONS */}
    <Space>
      <Button icon={<EditOutlined />}>Edit</Button>
      <Button icon={<ShareAltOutlined />}>Share</Button>
      <Button icon={<DownloadOutlined />}>Export</Button>

      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "duplicate",
              label: "Duplicate release",
            },
            {
              key: "archive",
              label: "Archive release",
            },
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
        <Button
          icon={<MoreOutlined />}
          type="text"
        />
      </Dropdown>
    </Space>
  </div>

  <Divider style={{ marginTop: 12 }} />
</div>


            {/* 🔽 SCROLLABLE CONTENT */}
            <div
              style={{
                padding: "0 24px 24px",
                overflowY: "auto",
                flex: 1, // 🔥 makes scrolling work
              }}
            >
              <div className="card">
                <Title level={5}>Release Summary</Title>
                <Typography.Paragraph>
                  This release introduces significant improvements to the
                  platform...
                </Typography.Paragraph>
              </div>

              {/* dummy content */}
              {Array.from({ length: 20 }).map((_, i) => (
                <p key={i}>More content {i}</p>
              ))}
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
