"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Tabs, Descriptions, Tag, Row, Col, Timeline, Spin, Button, Space, message, Divider, Drawer } from "antd";
import { ArrowLeftOutlined, FileOutlined, EditOutlined, SendOutlined, DownloadOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import candidateService from "@/services/candidateService";
import dayjs from "dayjs";
import moment from "moment-timezone";

const { Title, Text } = Typography;

export default function CandidateProfile() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const { isLoading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      const res = await candidateService.getById(candidateId);
      if (res) {
        setCandidate(res);
      }
    } catch (error) {
      console.error("Fetch Candidate Detail Error:", error);
      message.error("An error occurred while fetching candidate");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
            <Spin size="large" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!candidate) return null;

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: <OverviewTab candidate={candidate} />
    },
    {
      key: "experience",
      label: "Work Experience",
      children: <ExperienceTab experiences={candidate.workExperiences || []} />
    },
    {
      key: "skills",
      label: "Skills",
      children: <SkillsTab skills={candidate.skills || []} primarySkills={candidate.primarySkills || []} secondarySkills={candidate.secondarySkills || []} />
    },
    {
      key: "education",
      label: "Education",
      children: <EducationTab educations={candidate.educations || []} />
    },
    {
      key: "documentation",
      label: "Documentation",
      children: <DocumentationTab candidate={candidate} />
    },
    {
      key: "interviewSlots",
      label: "Interview Availability",
      children: <InterviewAvailabilityTab interviewSlots={candidate.interviewSlots || []} />
    },
    {
      key: "timeline",
      label: "Activity Timeline",
      children: <TimelineTab candidate={candidate} />
    }
  ];

  const hasDocuments = candidate && (
    candidate.resumeUrl ||
    candidate.passportUrl ||
    candidate.drivingLicenseUrl ||
    candidate.visaDocumentUrl ||
    candidate.identityProofUrl ||
    (candidate.certificationsUrls && candidate.certificationsUrls.length > 0)
  );

const handleDownloadAllDocuments = async () => {
  const allDocs = [
    { url: candidate.resumeUrl, name: "Resume" },
    { url: candidate.passportUrl, name: "Passport" },
    { url: candidate.drivingLicenseUrl, name: "DrivingLicense" },
    { url: candidate.visaDocumentUrl, name: "VisaDocument" },
    { url: candidate.identityProofUrl, name: "IdentityProof" },
    ...(candidate.certificationsUrls || []).map((url: string, i: number) => ({
      url,
      name: `Certification_${i + 1}`,
    })),
  ].filter((doc) => Boolean(doc.url));

  for (let i = 0; i < allDocs.length; i++) {
    const { url, name } = allDocs[i];

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          const response = await fetch(url, { mode: "cors" }); // ✅ CORS mode
          if (!response.ok) throw new Error("Fetch failed");

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const ext = url.split(".").pop()?.split("?")[0] || "pdf";

          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = `${name}.${ext}`;  // ✅ No new tab, direct download
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
          // ✅ Fallback: force download via URL with download attribute
          console.warn(`Blob download failed for ${name}, using fallback`);
          const a = document.createElement("a");
          a.href = `${url}`;
          a.download = name;              // ✅ Still tries to download, not open tab
          a.target = "_blank";            // ✅ Open in new tab so it doesn't navigate away from the app
          a.style.display = "none";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        resolve();
      }, i * 1000);
    });
  }
};

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>
          <div>
            <Button icon={<ArrowLeftOutlined />} type="link" onClick={() => router.push("/recruitment/candidate-management")} style={{ marginBottom: 16, paddingLeft: 0 }}>
              Back to Candidates
            </Button>
          </div>

          <div  style={{ marginBottom: 24, flexShrink: 0 }}>
         
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={3} style={{ margin: 0 }}>{candidate.fullName}</Title>
                <Space style={{ marginTop: 8 }}>
                  <Text type="secondary">{candidate.currentRole || "Candidate"}</Text>
                  <Divider type="vertical" />
                  <Text type="secondary">{[candidate.city, candidate.state, candidate.country].filter(Boolean).join(", ")}</Text>
                </Space>
              </Col>
              <Col>
                <Space wrap style={{gap:12}}>
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => router.push(`/recruitment/candidates-edit/${candidate.id}`)}
                  >
                    Edit
                  </Button>
                  <Button type="primary" icon={<SendOutlined />}>
                    Submit Job
                  </Button>
                </Space>
              </Col>
            </Row>
        
          </div>

          <Card 
            bordered={false} 
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
            bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}
          >
            <style>{`
              .fixed-tab-headers .ant-tabs-content-holder {
                overflow-y: auto;
                padding-right: 8px; /* Adds a bit of padding so the scrollbar doesn't hug the text */
              }
            `}</style>
            <Tabs className="fixed-tab-headers" defaultActiveKey="overview" items={tabItems} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }} />
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

const OverviewTab = ({ candidate }: { candidate: any }) => (
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    <Descriptions title="Personal Details" bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
      <Descriptions.Item label="Email"><a href={`mailto:${candidate.email}`}>{candidate.email}</a></Descriptions.Item>
      <Descriptions.Item label="Phone"><a href={`tel:${candidate.phoneNumber}`}>{candidate.phoneNumber}</a></Descriptions.Item>
      <Descriptions.Item label="Location">{[candidate.city, candidate.state, candidate.country].filter(Boolean).join(", ") || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Timezone">{candidate.timezone || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="LinkedIn">{candidate.linkedinUrl ? <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer">View Profile</a> : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="GitHub">{candidate.githubUrl ? <a href={candidate.githubUrl} target="_blank" rel="noreferrer">View Profile</a> : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Portfolio">{candidate.portfolioUrl ? <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer">View Portfolio</a> : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Preferred Contact">{candidate.preferredContactMethod || "N/A"}</Descriptions.Item>
    </Descriptions>

    <Descriptions title="Career Summary" bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
      <Descriptions.Item label="Current Role/Title">{candidate.currentRole || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Total Years of Experience">{candidate.yearsOfExperience ? `${candidate.yearsOfExperience} Years` : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Primary Skills">
        {candidate.primarySkills?.length > 0 ? <Space wrap>{candidate.primarySkills.map((skill: string) => <Tag color="blue" key={skill}>{skill}</Tag>)}</Space> : "N/A"}
      </Descriptions.Item>
      <Descriptions.Item label="Secondary Skills">
        {candidate.secondarySkills?.length > 0 ? <Space wrap>{candidate.secondarySkills.map((skill: string) => <Tag key={skill}>{skill}</Tag>)}</Space> : "N/A"}
      </Descriptions.Item>
    </Descriptions>

    <Descriptions title="Employment Preferences" bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
      <Descriptions.Item label="Preferred Type">{candidate.preferredEmploymentType || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Work Mode">{candidate.preferredWorkMode || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Expected Rate">{candidate.expectedRate ? `${candidate.expectedRate} ${candidate.rateUnit}` : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Willing to Relocate">{candidate.willingToRelocate || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Notice Period">{candidate.noticePeriod ? `${candidate.noticePeriod} Days` : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Earliest Available">{candidate.earliestAvailable || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Joining Date">{candidate.joiningDate ? dayjs(candidate.joiningDate).format("MMMM D, YYYY") : "N/A"}</Descriptions.Item>
    </Descriptions>

    <Descriptions title="Work Authorization" bordered column={3}>
      <Descriptions.Item label="Authorization Type">{candidate.workAuthorizationType || "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Validity Date">{candidate.visaValidityDate ? dayjs(candidate.visaValidityDate).format("MMMM D, YYYY") : "N/A"}</Descriptions.Item>
      <Descriptions.Item label="Willing to Transfer">{candidate.willingToTransferVisa ? "Yes" : "No"}</Descriptions.Item>
    </Descriptions>
    
    {candidate.professionalSummary && (
       <Card type="inner" title="Professional Summary">
         <Text>{candidate.professionalSummary}</Text>
       </Card>
    )}

    {candidate.internalNotes && (
      <Card type="inner" title="Internal Notes">
        <Text>{candidate.internalNotes}</Text>
      </Card>
    )}
  </Space>
);

const ExperienceTab = ({ experiences }: { experiences: any[] }) => {
  if (!experiences || experiences.length === 0) return <Text type="secondary">No work experience added.</Text>;
  return (
    
    <Timeline mode="left" style={{ maxWidth: 400 }}>
      {experiences.map((exp: any) => (
        <Timeline.Item key={exp.id} label={`${dayjs(exp.startDate).format("MMM YYYY")} - ${exp.endDate ? dayjs(exp.endDate).format("MMM YYYY") : "Present"}`}>
          <Card style={{width:800}} title={`${exp.jobTitle} at ${exp.companyName}`}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Location">{exp.location || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Type">{exp.employmentType || "N/A"}</Descriptions.Item>
              <Descriptions.Item label="Mode">{exp.workMode || "N/A"}</Descriptions.Item>
            </Descriptions>
            {exp.skillsUsed && exp.skillsUsed.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Skills: </Text>
                {exp.skillsUsed.map((skill: string) => <Tag key={skill}>{skill}</Tag>)}
              </div>
            )}
            {exp.responsibilities && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Responsibilities:</Text>
                <p style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{exp.responsibilities}</p>
              </div>
            )}
          </Card>
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

const SkillsTab = ({ skills, primarySkills, secondarySkills }: { skills: any[], primarySkills: string[], secondarySkills: string[] }) => (
  <Space direction="vertical" size="large" style={{ width: '100%' }}>
    {(primarySkills?.length > 0 || secondarySkills?.length > 0) && (
      <Card type="inner" title="Core Skills">
        {primarySkills?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Primary Skills</Text>
            <Space wrap>{primarySkills.map(skill => <Tag color="blue" key={skill}>{skill}</Tag>)}</Space>
          </div>
        )}
        {secondarySkills?.length > 0 && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Secondary Skills</Text>
            <Space wrap>{secondarySkills.map(skill => <Tag key={skill}>{skill}</Tag>)}</Space>
          </div>
        )}
      </Card>
    )}
    {skills?.length > 0 && (
       <Card type="inner" title="Skill Matrix">
          {skills.map((skill: any) => (
             <Descriptions key={skill.id} bordered size="small" column={3} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Skill Name">{Array.isArray(skill.skillName) ? skill.skillName.join(", ") : skill.skillName}</Descriptions.Item>
                <Descriptions.Item label="Experience">{skill.yearsOfExperience} Years</Descriptions.Item>
                <Descriptions.Item label="Last Used">{skill.lastUsedYear ? dayjs(skill.lastUsedYear).format("YYYY") : "N/A"}</Descriptions.Item>
             </Descriptions>
          ))}
       </Card>
    )}
  </Space>
);

const EducationTab = ({ educations }: { educations: any[] }) => {
  if (!educations || educations.length === 0) return <Text type="secondary">No education details added.</Text>;
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {educations.map((edu: any) => (
        <Card key={edu.id} size="small" title={`${edu.degreeName} - ${edu.university}`}>
          <Descriptions column={2} size="small">
             <Descriptions.Item label="Specialization">{edu.specialization || "N/A"}</Descriptions.Item>
             <Descriptions.Item label="Location">{edu.location || "N/A"}</Descriptions.Item>
             <Descriptions.Item label="Start Date">{edu.startDate ? dayjs(edu.startDate).format("MMM YYYY") : "N/A"}</Descriptions.Item>
             <Descriptions.Item label="End Date">{edu.endDate ? dayjs(edu.endDate).format("MMM YYYY") : "N/A"}</Descriptions.Item>
          </Descriptions>
        </Card>
      ))}
    </Space>
  );
};

const DocumentationTab = ({ candidate }: { candidate: any }) => {
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState<string | null>(null);

  const handleView = (url: string) => {
    setCurrentDocUrl(url);
    setViewDrawerVisible(true);
  };

 const handleDownload = async (url: string, label: string = "document") => {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Network response failed");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const ext = url.split(".").pop()?.split("?")[0] || "pdf";

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${label}.${ext}`;   // ✅ Clean filename, no new tab
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.warn(`Blob download failed for ${label}, using fallback`, error);
    // Fallback: force open via URL if fetch fails
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = label;
    a.style.display = "none";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

  const documents = [
    { label: "Resume", url: candidate.resumeUrl },
    { label: "Passport", url: candidate.passportUrl },
    { label: "Driving License", url: candidate.drivingLicenseUrl },
    { label: "Visa Document", url: candidate.visaDocumentUrl },
    { label: "Identity Proof", url: candidate.identityProofUrl },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {documents.map((doc, idx) => doc.url && (
          <Col span={8} key={idx}>
            <Card size="small">
              <Space>
                <FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Space direction="vertical" size={0}>
                  <Text strong>{doc.label}</Text>
                  <Space split={<Divider type="vertical" />}>
                    <a onClick={(e) => { e.preventDefault(); handleView(doc.url); }}>View</a>
                    <a onClick={(e) => { e.preventDefault(); handleDownload(doc.url); }}>Download</a>
                  </Space>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
        {candidate.certificationsUrls?.map((url: string, idx: number) => (
          <Col span={8} key={`cert-${idx}`}>
             <Card size="small">
                <Space>
                  <FileOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <Space direction="vertical" size={0}>
                    <Text strong>Certification {idx + 1}</Text>
                    <Space split={<Divider type="vertical" />}>
                      <a onClick={(e) => { e.preventDefault(); handleView(url); }}>View</a>
                      <a onClick={(e) => { e.preventDefault(); handleDownload(url); }}>Download</a>
                    </Space>
                  </Space>
                </Space>
              </Card>
          </Col>
        ))}
      </Row>
      {!documents.some(d => d.url) && (!candidate.certificationsUrls || candidate.certificationsUrls.length === 0) && (
        <Text type="secondary">No documents uploaded.</Text>
      )}

      <Drawer
        title="View Document"
        placement="right"
        width={800}
        onClose={() => setViewDrawerVisible(false)}
        open={viewDrawerVisible}
        destroyOnClose
      >
        {currentDocUrl && (
          <iframe
            src={currentDocUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Document Viewer"
          />
        )}
      </Drawer>
    </Space>
  );
};

const TimelineTab = ({ candidate }: { candidate: any }) => (
  <div style={{  justifyContent: "center", marginTop: "24px" }}>
    <Timeline mode="left" style={{ marginRight:900 }}>
      <Timeline.Item color="green" label={dayjs(candidate.createdAt).format("MMM D, YYYY HH:mm")} style={{ paddingBottom: "150px" }}>
        Candidate profile created
      </Timeline.Item>
      {candidate.updatedAt !== candidate.createdAt && (
        <Timeline.Item color="blue" label={dayjs(candidate.updatedAt).format("MMM D, YYYY HH:mm")}>
          Candidate profile last updated
        </Timeline.Item>
      )}
    </Timeline>
  </div>
);

const InterviewAvailabilityTab = ({ interviewSlots }: { interviewSlots: any[] }) => {
  if (!interviewSlots || interviewSlots.length === 0)
    return <Text type="secondary">No interview slots added.</Text>;

  const zonesToConvert = [
    { label: "IST", tz: "Asia/Kolkata" },
    { label: "EST", tz: "America/New_York" },
    { label: "CST", tz: "America/Chicago" },
    { label: "MST", tz: "America/Denver" },
    { label: "PST", tz: "America/Los_Angeles" },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        {interviewSlots.map((slot: any, idx: number) => {
          const slotTz = slot.timezone || "UTC";
          const tzAbbr = moment().tz(slotTz).format("z");
          const dateStr = slot.interviewDate ? dayjs(slot.interviewDate).format("YYYY-MM-DD") : "";
          
          // Parse original times using moment-timezone
          const startMoment = slot.interviewDate && slot.startTime ? moment.tz(`${dateStr} ${slot.startTime}`, "YYYY-MM-DD HH:mm", slotTz) : null;
          const endMoment = slot.interviewDate && slot.endTime ? moment.tz(`${dateStr} ${slot.endTime}`, "YYYY-MM-DD HH:mm", slotTz) : null;
          
          const hasValidTime = startMoment && startMoment.isValid() && endMoment && endMoment.isValid();

          return (
            <Col xs={24} md={8} key={slot.id || idx}>
              <Card
                style={{ width: "100%", height: "100%" }}
                bodyStyle={{ padding: 16 }}
                title={`Slot ${idx + 1} - Scheduled in ${slotTz} (${tzAbbr})`}
              >
                <Row gutter={[12, 12]}>
                  <Col span={24}>
                    <Text strong>Original Time:</Text>

                    <div style={{ marginTop: 4 }}>
                      <Text>
                        {slot.interviewDate
                          ? dayjs(slot.interviewDate).format("MMM D, YYYY")
                          : "N/A"}
                      </Text>

                      <span style={{ marginLeft: 12 }}>
                        <Tag color="blue">{slot.startTime || "N/A"}</Tag>
                        {" - "}
                        <Tag color="blue">{slot.endTime || "N/A"}</Tag>
                      </span>
                    </div>
                  </Col>
                </Row>

                <Divider style={{ margin: "10px 0" }} />

                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Converted Times
                </Text>

                <Row gutter={[12, 12]}>
                  {zonesToConvert.filter(z => z.tz !== slotTz).map((z) => (
                    <Col xs={24} sm={12} md={12} key={z.tz}>
                      <Card
                        size="small"
                        type="inner"
                        bodyStyle={{ padding: 10 }}
                      >
                        <Text strong>{z.label}</Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {" "}({z.tz})
                        </Text>

                        <div style={{ marginTop: 6 }}>
                          <Text style={{ fontSize: 12 }}>
                            {hasValidTime
                              ? startMoment.tz(z.tz).format("MMM D, YYYY")
                              : "N/A"}
                          </Text>

                          <div style={{ marginTop: 4 }}>
                            {hasValidTime ? (
                              <>
                                <Tag color="blue">
                                  {startMoment.tz(z.tz).format("HH:mm")}
                                </Tag>
                                {" - "}
                                <Tag color="blue">
                                  {endMoment.tz(z.tz).format("HH:mm")}
                                </Tag>
                              </>
                            ) : (
                              <Text type="secondary">Invalid</Text>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
};