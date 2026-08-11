"use client";
import { Spin } from 'antd';
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useState } from "react";
import {
  Tabs,
  Button,
  message,
  Modal,
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Space,
  Result
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled, FileOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, PaperClipOutlined } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import {
  RecruitmentService,
  JobRequisitionData,
  RequisitionAttachment
} from "@/services/recruitment.service";
import dayjs from "dayjs";


const { Title, Text } = Typography;

export default function RequisitionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [requisition, setRequisition] = useState<JobRequisitionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, contextHolder] = Modal.useModal();
  const [attachments, setAttachments] = useState<RequisitionAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRequisition(params.id as string);
    }
  }, [params.id]);

  const fetchRequisition = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await RecruitmentService.getRequisitionById(id);
      setRequisition(data);
      // Also fetch attachments
      try {
        setLoadingAttachments(true);
        const attachData = await RecruitmentService.getAttachments(id);
        setAttachments(attachData || []);
      } catch (e) {
        console.error("Failed to fetch attachments:", e);
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load Job Requisition details.");
      message.error("Failed to load Job Requisition details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: "Delete Job Requisition",
      icon: <ExclamationCircleFilled />,
      content: `Are you sure you want to delete ${requisition?.ticketId}? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          if (!requisition?.id) return;
          await RecruitmentService.deleteRequisition(requisition.id);
          message.success("Job Requisition deleted successfully.");
          router.push("/recruitment/job-requisitions");
        } catch (error) {
          console.error(error);
          message.error("Failed to delete Job Requisition.");
        }
      }
    });
  };

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <LoadingSpinner size="large" fullScreen={false} />
      </div>
    );

  if (error || !requisition)
    return (
      <div style={{ padding: "50px" }}>
        <Result
          status="error"
          title="Failed to load requisition"
          subTitle={error || "Requisition not found."}
          extra={
            <Button onClick={() => router.push("/recruitment/job-requisitions")}>
              Back to List
            </Button>
          }
        />
      </div>
    );

  const req: any = requisition;

  const statusColors: Record<string, string> = {
    Open: "green",
    "On Hold": "orange",
    Closed: "default",
    Filled: "blue"
  };

  const priorityColors: Record<string, string> = {
    Critical: "magenta",
    High: "red",
    Medium: "orange",
    Low: "blue"
  };

  const InfoItem = ({
    label,
    value,
    render }: {
      label: string;
      value?: any;
      render?: React.ReactNode;
    }) => (
    <div style={{ marginBottom: "16px" }}>
      <Text
        type="secondary"
        style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}
      >
        {label}
      </Text>
      <Text strong>{render || value || "-"}</Text>
    </div>
  );

  const overviewContainer = (
    <div style={{ padding: "0" }}>
      {/* Basic Information */}
      <Title level={5} style={{ marginTop: 0 }}>
        Basic Information
      </Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <InfoItem label="Ticket ID" value={req.ticketId} />
          </Col>
          <Col span={6}>
            <InfoItem label="Job Title" value={req.jobTitle} />
          </Col>
          <Col span={6}>
            <InfoItem label="Job Code" value={req.jobCode} />
          </Col>
          <Col span={6}>
            <InfoItem label="Openings" value={req.openingsCount} />
          </Col>
          <Col span={6}>
            <InfoItem label="Client" value={req.client?.name || req.client?.companyName} />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Client Contact"
              value={req.clientContactPerson}
            />
          </Col>
          <Col span={6}>
            <InfoItem label="Job Type" value={req.jobType} />
          </Col>
          <Col span={3}>
            <InfoItem
              label="Status"
              render={
                <Tag color={statusColors[req.status] || "default"}>
                  {req.status}
                </Tag>
              }
            />
          </Col>
          <Col span={3}>
            <InfoItem
              label="Priority"
              render={
                <Tag color={priorityColors[req.priority] || "default"}>
                  {req.priority}
                </Tag>
              }
            />
          </Col>
        </Row>
      </Card>

      {/* Candidate Requirements */}
      <Title level={5}>Candidate Requirements</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <InfoItem label="Experience" value={req.experience} />
          </Col>
          <Col span={12}>
            <InfoItem
              label="Mandatory Skills"
              render={
                <Space size={[0, 4]} wrap>
                  {req.mandatorySkills?.map((skill: string) => (
                    <Tag color="blue" key={skill}>
                      {skill}
                    </Tag>
                  ))}
                </Space>
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Secondary Skills"
              render={
                <Space size={[0, 4]} wrap>
                  {req.secondarySkills?.map((skill: string) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                </Space>
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem label="Education" value={req.education} />
          </Col>
          <Col span={6}>
            <InfoItem label="Certification" value={req.certification} />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Communication Skills"
              value={req.communicationSkills}
            />
          </Col>
        </Row>
      </Card>

      {/* Job Description */}
      {(req.jobRole || req.jobDetails || req.responsibilities) && (
        <>
          <Title level={5}>Job Description</Title>
          <Card
            bordered={false}
            style={{ marginBottom: "24px", background: "#fafafa" }}
          >
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <InfoItem label="JD Title / Role" value={req.jobRole} />
              </Col>
              <Col span={24}>
                <InfoItem label="Job Details" value={req.jobDetails} />
              </Col>
              <Col span={24}>
                <InfoItem
                  label="Responsibilities"
                  value={req.responsibilities}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* Visa & Location */}
      <Title level={5}>Visa & Location</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <InfoItem
              label="Allowed Visa Types"
              render={
                <Space size={[0, 4]} wrap>
                  {req.allowedVisaTypes?.map((visa: string) => (
                    <Tag color="green" key={visa}>
                      {visa}
                    </Tag>
                  ))}
                </Space>
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Excluded Visa"
              render={
                <Space size={[0, 4]} wrap>
                  {req.excludedVisaTypes?.map((visa: string) => (
                    <Tag color="red" key={visa}>
                      {visa}
                    </Tag>
                  ))}
                </Space>
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Security Clearance"
              value={
                req.securityClearance ? "Required" : "Not Required"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem label="Location" value={req.jobLocation} />
          </Col>
          <Col span={6}>
            <InfoItem label="Work Mode" value={req.workMode} />
          </Col>
          <Col span={6}>
            <InfoItem label="Time Zone" value={req.timeZone} />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Relocation Allowed"
              value={req.relocationAllowed ? "Yes" : "No"}
            />
          </Col>
        </Row>
      </Card>

      {/* Billing & Rates */}
      <Title level={5}>Billing & Rates</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <InfoItem
              label="Max Bill Rate"
              value={req.maxBillRate ? `$${req.maxBillRate}/hr` : "-"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Recruiter Rate"
              value={
                req.recruiterRate ? `$${req.recruiterRate}/hr` : "-"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Min Pay Rate"
              value={req.minPayRate ? `$${req.minPayRate}/hr` : "-"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="OT Multiplier"
              value={
                req.overtimeMultiplier
                  ? `${req.overtimeMultiplier}x`
                  : "-"
              }
            />
          </Col>
        </Row>
      </Card>

      {/* Timeline */}
      <Title level={5}>Timeline</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <InfoItem
              label="Start Date"
              value={
                req.startDate ? req.startDate.split("T")[0] : "-"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Submission Deadline"
              value={
                req.submissionDeadline
                  ? req.submissionDeadline.split("T")[0]
                  : "-"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Interview Start"
              value={
                req.interviewStartDate
                  ? req.interviewStartDate.split("T")[0]
                  : "-"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Expected Closure"
              value={
                req.expectedClosureDate
                  ? req.expectedClosureDate.split("T")[0]
                  : "-"
              }
            />
          </Col>
        </Row>
      </Card>

      {/* Recruiters */}
      <Title level={5}>Recruiters</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <InfoItem
              label="Assigned Recruiters"
              value={
                req.assignedRecruiters
                  ?.map((r: any) => r.name)
                  .join(", ") || "-"
              }
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Account Manager"
              value={req.accountManager?.name || "-"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Delivery Manager"
              value={req.deliveryManager?.name || "-"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Max Submissions / Recruiter"
              value={req.maxSubmissionsPerRec || "-"}
            />
          </Col>
        </Row>
      </Card>

      {/* Submission Rules */}
      <Title level={5}>Submission Rules</Title>
      <Card
        bordered={false}
        style={{ marginBottom: "24px", background: "#fafafa" }}
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <InfoItem
              label="Max Total Submissions"
              value={req.maxTotalSubmissions || "-"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Exclusive Candidate"
              value={req.exclusiveCandidate ? "Yes" : "No"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Blind CV Required"
              value={req.blindCvRequired ? "Yes" : "No"}
            />
          </Col>
          <Col span={6}>
            <InfoItem
              label="Source / Resume Format"
              value={req.sourceFormat}
            />
          </Col>
        </Row>
      </Card>

      {/* Screening Questions */}
      {Array.isArray(req.screeningQuestions) &&
        req.screeningQuestions.length > 0 && (
          <>
            <Title level={5}>Screening Questions</Title>
            <Card
              bordered={false}
              style={{ marginBottom: "24px", background: "#fafafa" }}
            >
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                {req.screeningQuestions.map(
                  (q: any, idx: number) => (
                    <li key={idx} style={{ marginBottom: "8px" }}>
                      <Text>{q.question || q}</Text>
                    </li>
                  )
                )}
              </ol>
            </Card>
          </>
        )}

      {/* Internal Notes */}
      {req.internalNotes && (
        <>
          <Title level={5}>Internal Notes</Title>
          <Card
            bordered={false}
            style={{ marginBottom: "24px", background: "#fafafa" }}
          >
            <Text>{req.internalNotes}</Text>
          </Card>
        </>
      )}
    </div>
  );

  const items = [
    { key: "1", label: "Overview", children: overviewContainer },
    {
      key: "2",
      label: "Candidates",
      children: <div style={{ padding: 24, color: '#999' }}>Candidates list — coming soon</div>
    },
    {
      key: "3",
      label: "Submissions",
      children: <div style={{ padding: 24, color: '#999' }}>Submissions list — coming soon</div>
    },
    {
      key: "4",
      label: "Interviews",
      children: <div style={{ padding: 24, color: '#999' }}>Interviews list — coming soon</div>
    },
    {
      key: "5",
      label: "Offers",
      children: <div style={{ padding: 24, color: '#999' }}>Offers list — coming soon</div>
    },
    {
      key: "6",
      label: "Notes",
      children: <div style={{ padding: 24, color: '#999' }}>Notes — coming soon</div>
    },
    {
      key: "7",
      label: "Attachments",
      children: (
        <Spin spinning={loadingAttachments}>
          {attachments.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#999" }}>
              <PaperClipOutlined style={{ fontSize: 48, marginBottom: 16, display: "block" }} />
              No attachments uploaded for this requisition.
            </div>
          ) : (
            <Row gutter={[16, 16]} style={{ padding: "16px 0" }}>
              {attachments.map((att: any, idx: number) => {
                const ext = (att.fileType || att.fileName?.split(".").pop() || "").toLowerCase();
                const iconMap: Record<string, React.ReactNode> = {
                  pdf: <FilePdfOutlined style={{ fontSize: 32, color: "#ff4d4f" }} />,
                  doc: <FileWordOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
                  docx: <FileWordOutlined style={{ fontSize: 32, color: "#1890ff" }} />,
                  xls: <FileExcelOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
                  xlsx: <FileExcelOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
                  png: <FileImageOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
                  jpg: <FileImageOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
                  jpeg: <FileImageOutlined style={{ fontSize: 32, color: "#722ed1" }} />
                };
                const icon = iconMap[ext] || <FileOutlined style={{ fontSize: 32, color: "#8c8c8c" }} />;
                const categoryLabels: Record<string, string> = {
                  job_description: "Job Description",
                  client_requirements: "Client Requirements",
                  interview_guide: "Interview Guide"
                };
                const formatSize = (bytes?: number) => {
                  if (!bytes) return "";
                  const k = 1024;
                  const sizes = ["B", "KB", "MB", "GB"];
                  const i = Math.floor(Math.log(bytes) / Math.log(k));
                  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
                };
                return (
                  <Col xs={24} sm={12} md={8} key={att.id || idx}>
                    <Card
                      size="small"
                      hoverable
                      style={{ borderRadius: 8 }}
                      styles={{ body: { padding: "16px" } }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flexShrink: 0, paddingTop: 2 }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            ellipsis
                            title={att.fileName}
                            style={{ display: "block", fontSize: 13 }}
                          >
                            {att.fileName}
                          </Text>
                          <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
                            {categoryLabels[att.category] || att.category}
                          </Tag>
                          <div style={{ marginTop: 6 }}>
                            {att.fileSize && (
                              <Text type="secondary" style={{ fontSize: 11, marginRight: 12 }}>
                                {formatSize(att.fileSize)}
                              </Text>
                            )}
                            {att.uploadedAt && (
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {dayjs(att.uploadedAt).format("MMM DD, YYYY")}
                              </Text>
                            )}
                          </div>
                          {att.uploadedBy?.name && (
                            <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2 }}>
                              Uploaded by {att.uploadedBy.name}
                            </Text>
                          )}
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ padding: 0, marginTop: 8 }}
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = att.fileUrl;
                              link.target = "_blank";
                              link.download = att.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Spin>
      )
    },
    {
      key: "8",
      label: "Metrics",
      children: <div style={{ padding: 24, color: '#999' }}>Metrics — coming soon</div>
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/recruitment/job-requisitions")}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {req.ticketId} — {req.jobTitle}
          </Title>
          <Tag color={statusColors[req.status] || "default"}>
            {req.status}
          </Tag>
          <Tag color={priorityColors[req.priority] || "default"}>
            {req.priority}
          </Tag>
        </div>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => router.push(`/recruitment/job-requisitions/${params.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Space>
      </div>

      <Card bordered={false} styles={{ body: { padding: "24px" } }}>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
}
