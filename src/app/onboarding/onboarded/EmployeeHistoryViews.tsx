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
} from "antd";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  HistoryOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const EmployeeHistoryView = ({ data }: any) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Empty description="No employment history available" />
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
    if (!fileData) return "";
    if (typeof fileData === "string")
      return fileData.split("/").pop() || "Document";
    if (fileData.fileName) return fileData.fileName;
    if (fileData.url) return fileData.url.split("/").pop() || "Document";
    return "Document";
  };

  const DocumentCard = ({ label, fileData }: any) => {
    const fileUrl = normalizeFileUrl(fileData);
    const fileName = getFileName(fileData);

    if (!fileUrl) return null;

    return (
      <div
        style={{
          padding: "12px",
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          borderRadius: 8,
          border: "1px solid #bae6fd",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: "#0284c7", fontSize: 16 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0c4a6e" }}>
                {label}
              </div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{fileName}</div>
            </div>
          </div>
          <Space size={4}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(fileUrl, "_blank")}
              style={{
                background: "#0284c7",
                color: "white",
                border: "none",
                fontSize: 11,
              }}
            >
              View
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => {
                const link = document.createElement("a");
                link.href = fileUrl;
                link.download = fileName;
                link.click();
              }}
              style={{ fontSize: 11 }}
            >
              Download
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "16px" }}>
      {data.map((company: any, index: number) => (
        <Card
          key={index}
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
          }}
          headStyle={{
            background: "linear-gradient(135deg, #d6dfeb 0%, #a9bbd1 100%)",
            color: "white",
            borderBottom: "none",
            padding: "16px 24px",
          }}
          bodyStyle={{ padding: 0 }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <HistoryOutlined style={{ fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {company.companyName || `Company ${index + 1}`}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
                  {company.designation || "Position not specified"}
                </div>
              </div>
            </div>
          }
          extra={
            <Tag
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontSize: 12,
                padding: "4px 12px",
              }}
            >
              {company.employmentType || "Full Time"}
            </Tag>
          }
        >
          <div style={{ padding: "24px" }}>
            {/* Company & Tenure Details */}
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {/* Company Information */}
              <div
                style={{
                  flex: "1 1 45%",
                  minWidth: 300,
                  padding: 16,
                  background:
                    "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <EnvironmentOutlined style={{ color: "#1677ff" }} />
                  Company Information
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {company.location && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#64748b",
                          width: 100,
                        }}
                      >
                        Location:
                      </span>
                      <span style={{ color: "#1e293b" }}>
                        {company.location}
                      </span>
                    </div>
                  )}
                  {company.industry && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#64748b",
                          width: 100,
                        }}
                      >
                        Industry:
                      </span>
                      <span style={{ color: "#1e293b" }}>
                        {company.industry}
                      </span>
                    </div>
                  )}
                  {company.address && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#64748b",
                          width: 100,
                        }}
                      >
                        Address:
                      </span>
                      <span style={{ color: "#1e293b" }}>
                        {company.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenure Information */}
              <div
                style={{
                  flex: "1 1 45%",
                  minWidth: 300,
                  padding: 16,
                  background:
                    "linear-gradient(135deg, #e9f3f4 0%, #e1e6ea 100%)",
                  borderRadius: 12,
                  border: "1px solid #b5d8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#3b67ae",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CalendarOutlined style={{ color: "#3b67ae" }} />
                  Tenure Details
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {company.doj && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#78716c",
                          width: 120,
                        }}
                      >
                        Joined:
                      </span>
                      <span style={{ color: "#292524" }}>
                        {dayjs(company.doj).format("DD MMM YYYY")}
                      </span>
                    </div>
                  )}
                  {company.lwd && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#78716c",
                          width: 120,
                        }}
                      >
                        Last Working Day:
                      </span>
                      <span style={{ color: "#292524" }}>
                        {dayjs(company.lwd).format("DD MMM YYYY")}
                      </span>
                    </div>
                  )}
                  {company.doj && company.lwd && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#78716c",
                          width: 120,
                        }}
                      >
                        Duration:
                      </span>
                      <span style={{ color: "#292524" }}>
                        {dayjs(company.lwd).diff(dayjs(company.doj), "month")}{" "}
                        months
                      </span>
                    </div>
                  )}
                  {company.reasonForLeaving && (
                    <div style={{ display: "flex", fontSize: 12 }}>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "#78716c",
                          width: 120,
                        }}
                      >
                        Reason:
                      </span>
                      <span style={{ color: "#292524" }}>
                        {company.reasonForLeaving}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Divider style={{ margin: "16px 0" }} />

            {/* Documents Section */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FileTextOutlined style={{ color: "#1677ff" }} />
                Documents & Certificates
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 12,
                }}
              >
                <DocumentCard
                  label="Experience Letter"
                  fileData={company.experienceLetter}
                />
                <DocumentCard
                  label="Offer Letter"
                  fileData={company.offerLetter}
                />
                <DocumentCard
                  label="Service Letter"
                  fileData={company.serviceLetter}
                />
                <DocumentCard
                  label="Relieving Letter"
                  fileData={company.relievingLetter}
                />

                {/* Form 16 */}
                {company.form16 && company.form16.length > 0 && (
                  <>
                    {company.form16.map((form16Item: any, idx: number) => (
                      <DocumentCard
                        key={`form16-${idx}`}
                        label={`Form 16 #${idx + 1}`}
                        fileData={form16Item.file || form16Item}
                      />
                    ))}
                  </>
                )}

                {/* Payslips */}
                {company.payslips && company.payslips.length > 0 && (
                  <>
                    {company.payslips.map((payslip: any, idx: number) => (
                      <DocumentCard
                        key={`payslip-${idx}`}
                        label={`Payslip #${idx + 1}`}
                        fileData={payslip.file || payslip}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Contact Details */}
            {company.contacts && company.contacts.length > 0 && (
              <>
                <Divider style={{ margin: "16px 0" }} />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 16,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <UserOutlined style={{ color: "#1677ff" }} />
                    Contact Persons
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {company.contacts.map((contact: any, idx: number) => {
                      const roleLabelMap: any = {
                        hr: "HR",
                        manager: "Manager",
                        teamLead: "Team Leader",
                        reportingManager: "Reporting Manager",
                      };
                      const roleLabel =
                        roleLabelMap[contact.contactRole] || "Contact";

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 16,
                            // background:
                            //   "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                            background:
                              "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                            borderRadius: 12,
                            border: "1px solid #d3ded7",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#166534",
                              marginBottom: 12,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Tag
                              color="#1677ff"
                              style={{
                                fontSize: 10,
                                padding: "2px 8px",
                                margin: 0,
                              }}
                            >
                              {roleLabel}
                            </Tag>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {contact.contactName && (
                              <div style={{ display: "flex", fontSize: 11 }}>
                                <UserOutlined
                                  style={{
                                    color: "#1677ff",
                                    marginRight: 8,
                                    fontSize: 12,
                                  }}
                                />
                                <span
                                  style={{ fontWeight: 500, color: "#1677ff" }}
                                >
                                  {contact.contactName}
                                </span>
                              </div>
                            )}
                            {contact.contactNumber && (
                              <div style={{ display: "flex", fontSize: 11 }}>
                                <PhoneOutlined
                                  style={{
                                    color: "#1677ff",
                                    marginRight: 8,
                                    fontSize: 12,
                                  }}
                                />
                                <span style={{ color: "#1677ff" }}>
                                  {contact.contactNumber}
                                </span>
                              </div>
                            )}
                            {contact.contactEmail && (
                              <div style={{ display: "flex", fontSize: 11 }}>
                                <MailOutlined
                                  style={{
                                    color: "#1677ff",
                                    marginRight: 8,
                                    fontSize: 12,
                                  }}
                                />
                                <span style={{ color: "#1677ff" }}>
                                  {contact.contactEmail}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EmployeeHistoryView;
