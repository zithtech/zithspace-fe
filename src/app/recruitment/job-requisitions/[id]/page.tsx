"use client";

import React, { useEffect, useState } from "react";
import {
  Tabs,
  Button,
  Spin,
  message,
  Modal,
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Space,
  Result,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import {
  RecruitmentService,
  JobRequisitionData,
} from "@/services/recruitment.service";

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
      },
    });
  };

  if (loading)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <Spin size="large" />
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
    Filled: "blue",
  };

  const priorityColors: Record<string, string> = {
    Critical: "magenta",
    High: "red",
    Medium: "orange",
    Low: "blue",
  };

  const InfoItem = ({
    label,
    value,
    render,
  }: {
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
      children: <div style={{ padding: 24, color: '#999' }}>Candidates list — coming soon</div>,
    },
    {
      key: "3",
      label: "Submissions",
      children: <div style={{ padding: 24, color: '#999' }}>Submissions list — coming soon</div>,
    },
    {
      key: "4",
      label: "Interviews",
      children: <div style={{ padding: 24, color: '#999' }}>Interviews list — coming soon</div>,
    },
    {
      key: "5",
      label: "Offers",
      children: <div style={{ padding: 24, color: '#999' }}>Offers list — coming soon</div>,
    },
    {
      key: "6",
      label: "Notes",
      children: <div style={{ padding: 24, color: '#999' }}>Notes — coming soon</div>,
    },
    {
      key: "7",
      label: "Attachments",
      children: <div style={{ padding: 24, color: '#999' }}>Attachments — coming soon</div>,
    },
    {
      key: "8",
      label: "Metrics",
      children: <div style={{ padding: 24, color: '#999' }}>Metrics — coming soon</div>,
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
          marginBottom: "24px",
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
