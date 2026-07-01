import React from "react";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Empty,
  Image,
  Typography,
  Tooltip,
  Row,
  Col
} from "antd";
import {
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  Download,
  Eye,
  Clock,
  Mail,
  Building2,
  ExternalLink,
} from "lucide-react";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const EmployeeHistoryView = ({ data }: any) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", background: "var(--bg-pure-white, #ffffff)", borderRadius: 16, border: "1px dashed var(--border-slate-200, #e2e8f0)" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">No employment history available</Text>}
        />
      </div>
    );
  }

  const normalizeFileUrl = (fileData: any) => {
    if (!fileData) return null;
    if (typeof fileData === "string") return fileData;
    if (fileData.base64) return fileData.base64;
    if (fileData.url) return fileData.url;
    return null;
  };

  const getFileName = (fileData: any) => {
    let rawName = "Document";
    if (!fileData) return rawName;
    if (typeof fileData === "string")
      rawName = fileData.split("/").pop() || "Document";
    else if (fileData.fileName) rawName = fileData.fileName;
    else if (fileData.url) {
      try {
        const urlObj = new URL(fileData.url);
        rawName = urlObj.pathname.split("/").pop() || "Document";
      } catch (e) {
        rawName = fileData.url.split("/").pop() || "Document";
      }
    }
    
    // Remove nanoid(12)_ prefix if present (12 chars + underscore)
    if (/^[A-Za-z0-9_-]{12}_/.test(rawName)) {
      rawName = rawName.substring(13);
    }
    
    // Sometimes the filename is still just a UUID or has long text, but removing the prefix helps
    return rawName;
  };

  const normalizeDownloadUrl = (fileData: any) => {
    if (!fileData) return null;
    if (fileData.downloadUrl) return fileData.downloadUrl;
    // Fallback to url if downloadUrl is missing
    if (fileData.url) return fileData.url;
    if (typeof fileData === "string") return fileData;
    return null;
  };

  const DocumentCard = ({ label, fileData }: any) => {
    const fileUrl = normalizeFileUrl(fileData);
    const fileDownloadUrl = normalizeDownloadUrl(fileData);
    const fileName = getFileName(fileData);

    if (!fileUrl) return null;

    return (
      <div
        style={{
          padding: "16px",
          background: "var(--bg-pure-white, #ffffff)",
          borderRadius: 12,
          border: "1px solid var(--border-slate-200, #e2e8f0)",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--bg-blue-50, #eff6ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3b82f6"
          }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-slate-900, #1e293b)" }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-slate-500, #64748b)" }}>{fileName.length > 30 ? fileName.substring(0, 30) + "..." : fileName}</div>
          </div>
        </div>
        <Space size={8}>
          <Tooltip title="View Document">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => window.open(fileUrl, "_blank")}
              style={{ color: "var(--text-slate-500, #64748b)" }}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              type="text"
              icon={<Download size={16} />}
              onClick={() => {
                const link = document.createElement("a");
                link.href = fileDownloadUrl || fileUrl;
                link.download = fileName;
                link.click();
              }}
              style={{ color: "var(--text-slate-500, #64748b)" }}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };

  return (
    <div style={{ padding: "0" }}>
      {data.map((company: any, index: number) => (
        <Card
          key={index}
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: "1px solid var(--border-slate-100, #f1f5f9)",
            overflow: "hidden",
            background: "var(--bg-pure-white, #ffffff)",
            boxShadow: "none",
          }}
          bodyStyle={{ padding: 20 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--bg-pure-white, #ffffff)",
                border: "1px solid var(--border-slate-100, #f1f5f9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-slate-900, #1e293b)"
              }}>
                <Building2 size={24} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900, #1e293b)" }}>
                  {company.companyName || `Company ${index + 1}`}
                </Title>
                <div style={{ fontSize: 14, color: "var(--text-slate-500, #64748b)", fontWeight: 500 }}>
                  {company.designation || "Position not specified"}
                </div>
              </div>
            </div>
            <Tag
              style={{
                borderRadius: 20,
                padding: "4px 12px",
                fontWeight: 600,
                background: "var(--bg-green-50, #f0fdf4)",
                color: "#166534",
                border: "none",
              }}
            >
              {company.employmentType?.toUpperCase() || "FULL TIME"}
            </Tag>
          </div>

          <Row gutter={[24, 24]}>
            {/* Company Info */}
            <Col span={12}>
              <div style={{
                padding: "16px 20px",
                background: "var(--bg-pure-white, #ffffff)",
                borderRadius: 16,
                height: "100%",
                border: "1px solid var(--border-slate-100, #f1f5f9)"
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "var(--text-slate-600, #475569)", display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={16} color="#3b82f6" />
                  Company Details
                </div>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Location</Text>
                    <Text strong style={{ fontSize: 12 }}>{company.location || "-"}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Industry</Text>
                    <Text strong style={{ fontSize: 12 }}>{company.industry || "-"}</Text>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Address</Text>
                    <Text style={{ fontSize: 12, color: "var(--text-slate-900, #1e293b)" }}>{company.address || "-"}</Text>
                  </div>
                </Space>
              </div>
            </Col>

            {/* Tenure Info */}
            <Col span={12}>
              <div style={{
                padding: "16px 20px",
                background: "var(--bg-pure-white, #ffffff)",
                borderRadius: 16,
                height: "100%",
                border: "1px solid var(--border-slate-100, #f1f5f9)"
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar size={16} color="#0284c7" />
                  Tenure Information
                </div>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 12, color: "#0369a1" }}>Joining Date</Text>
                    <Text strong style={{ fontSize: 12, color: "#0c4a6e" }}>{company.doj ? dayjs(company.doj).format("DD MMM YYYY") : "-"}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 12, color: "#0369a1" }}>Last Working Day</Text>
                    <Text strong style={{ fontSize: 12, color: "#0c4a6e" }}>{company.lwd ? dayjs(company.lwd).format("DD MMM YYYY") : "-"}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 12, color: "#0369a1" }}>Duration</Text>
                    <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
                      {company.doj && company.lwd ? `${dayjs(company.lwd).diff(dayjs(company.doj), "month")} months` : "-"}
                    </Tag>
                  </div>
                </Space>
              </div>
            </Col>

            {/* Documents */}
            <Col span={24}>
              <Divider style={{ margin: "4px 0" }} />
              <div style={{ marginBottom: 16, marginTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-slate-900, #1e293b)", display: "flex", alignItems: "center", gap: 8 }}>
                  <FileText size={18} color="#3b82f6" />
                  Documents & Certificates
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                  <DocumentCard label="Experience Letter" fileData={company.experienceLetter} />
                  <DocumentCard label="Offer Letter" fileData={company.offerLetter} />
                  <DocumentCard label="Service Letter" fileData={company.serviceLetter} />
                  <DocumentCard label="Relieving Letter" fileData={company.relievingLetter} />
                  {company.form16?.map((item: any, idx: number) => (
                    <DocumentCard key={`f16-${idx}`} label={`Form 16 #${idx + 1}`} fileData={item.file || item} />
                  ))}
                  {company.payslips?.map((item: any, idx: number) => (
                    <DocumentCard key={`ps-${idx}`} label={`Payslip #${idx + 1}`} fileData={item.file || item} />
                  ))}
                </div>

                {/* Onboarding documents (per document type) */}
                {Array.isArray(company.documents) && company.documents.length > 0 ? (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--text-slate-600, #475569)", display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} color="#3b82f6" />
                      Submitted Documents
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                      {company.documents.map((doc: any, dIdx: number) => {
                        const files = Array.isArray(doc?.files) ? doc.files : [];
                        return files.map((f: any, fIdx: number) => (
                          <DocumentCard 
                            key={`doc-${dIdx}-${fIdx}`} 
                            label={doc?.documentType || "Document"} 
                            fileData={f} 
                          />
                        ));
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </Col>

            {/* Contacts */}
            {company.contacts?.length > 0 && (
              <Col span={24}>
                <Divider style={{ margin: "4px 0" }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-slate-900, #1e293b)", display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={18} color="#3b82f6" />
                    Reference Contacts
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {company.contacts.map((contact: any, idx: number) => (
                      <div key={idx} style={{
                        padding: 16,
                        background: "var(--bg-pure-white, #ffffff)",
                        borderRadius: 12,
                        border: "1px solid var(--border-slate-200, #e2e8f0)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <Tag color="blue" style={{ borderRadius: 6 }}>{contact.contactRole?.toUpperCase() || "CONTACT"}</Tag>
                        </div>
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <User size={14} color="var(--text-slate-500, #64748b)" />
                            <Text strong style={{ fontSize: 13 }}>{contact.contactName}</Text>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Phone size={14} color="var(--text-slate-500, #64748b)" />
                            <Text style={{ fontSize: 12 }}>{contact.contactNumber}</Text>
                          </div>
                          {contact.contactEmail && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Mail size={14} color="var(--text-slate-500, #64748b)" />
                              <Text style={{ fontSize: 12 }}>{contact.contactEmail}</Text>
                            </div>
                          )}
                        </Space>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeHistoryView;
