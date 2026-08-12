"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Checkbox,
  Divider,
  Result,
  message,
  Typography,
  Upload,
} from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined, PaperClipOutlined, HomeOutlined, ContactsOutlined, IdcardOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { PublicOnboardingService } from "@/services/onboardingService";

const { Title, Text } = Typography;

/* ----------------------------- helpers ----------------------------- */

const toDayjs = (v: any) => (v ? dayjs(v) : undefined);
const fmtDate = (v: any) => (v && dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v || undefined);

/** Read a File into a base64 data URL (data:<mime>;base64,<...>). */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

/**
 * Map the previously-uploaded documents of a history item into the local
 * form/state shape used by the document UI. We key catalog uploads by the
 * document-type name; anything that isn't a known catalog type is treated as
 * a custom document. Existing files are preserved via { url }.
 */
function mapHistoryDocuments(docs: any[], typeNames: Set<string>) {
  const safe = Array.isArray(docs) ? docs : [];
  // catalog: { [typeName]: { url, fileName }|null }
  const catalog: Record<string, any> = {};
  const custom: any[] = [];
  for (const d of safe) {
    if (!d) continue;
    const typeName = d.documentType ?? d.name ?? "";
    const files = Array.isArray(d.files) ? d.files : [];
    const first = files[0];
    if (!first) continue;
    const existing = {
      existingUrl: first.url ?? first.base64 ?? null,
      fileName:
        first.fileName ??
        (typeof first.url === "string" ? first.url.split("/").pop() : "") ??
        "Document",
    };
    if (typeName && typeNames.has(typeName)) {
      catalog[typeName] = existing;
    } else if (typeName) {
      custom.push({ documentName: typeName, ...existing });
    }
  }
  return { catalog, custom };
}

/** Map a (possibly variably-named) history item from the API into form shape. */
function mapHistoryItem(h: any) {
  if (!h) return {};
  const contactsSrc = Array.isArray(h.contacts) ? h.contacts : [];
  return {
    companyName: h.companyName ?? h.company ?? h.companyName ?? h.name ?? "",
    designation: h.designation ?? h.role ?? h.title ?? "",
    employmentType: h.employmentType ?? h.employment_type ?? undefined,
    industry: h.industry ?? h.domain ?? "",
    location: h.location ?? "",
    address: h.address ?? "",
    doj: toDayjs(h.doj ?? h.dateOfJoining ?? h.startDate ?? h.from),
    lwd: toDayjs(h.lwd ?? h.lastWorkingDay ?? h.endDate ?? h.to),
    contacts: contactsSrc.map((c: any) => ({
      contactRole: c.contactRole ?? c.role ?? undefined,
      name: c.name ?? c.contactName ?? "",
      mobile: c.mobile ?? c.contactNumber ?? c.phone ?? "",
      email: c.email ?? c.contactEmail ?? "",
    })),
  };
}

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  margin: "36px 0 24px",
  paddingBottom: 16,
  borderBottom: "1px solid var(--border-slate-200)",
};

const stepBadgeStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "var(--premium-blue)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
  flexShrink: 0,
};

const SectionHeader = ({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) => (
  <div style={sectionHeaderStyle}>
    <div style={stepBadgeStyle}>{step}</div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{subtitle}</div>}
    </div>
  </div>
);

/* ----------------------------- page ----------------------------- */

export default function PublicOnboardPage() {
  const params = useParams();
  const token = (Array.isArray(params?.token) ? params.token[0] : params?.token) as string;

  const [form] = Form.useForm();
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  // Tenant-required document catalog: [{ id, name, description }]
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  /**
   * Per-company document selections, keyed by the Form.List field's stable key.
   * Shape per company:
   *   { catalog: { [typeName]: DocEntry }, custom: DocEntry[] }
   * DocEntry: { file?: File, base64?: string, fileName?: string, existingUrl?: string }
   */
  const [docState, setDocState] = useState<
    Record<number, { catalog: Record<string, any>; custom: any[] }>
  >({});

  // Ordered list of the history Form.List field keys, mirroring the order of
  // entries in the submitted `history` array. Kept in sync on each render of
  // the list so submit can pair each company with its docState bucket.
  const historyKeysRef = React.useRef<number[]>([]);

  // "Permanent same as current" — copy the current-address fields into the
  // permanent block when ticked.
  const handleSameAsCurrent = (checked: boolean) => {
    setSameAsCurrent(checked);
    if (!checked) return;
    const cur = form.getFieldValue(["personal", "address", "current"]) || {};
    form.setFieldsValue({
      personal: {
        address: {
          permanent: {
            p_flat: cur.c_flat,
            p_area: cur.c_area,
            p_city: cur.c_city,
            p_state: cur.c_state,
            p_country: cur.c_country,
            p_pincode: cur.c_pincode,
          },
        },
      },
    });
  };
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await PublicOnboardingService.getInvite(token);
        if (!active) return;
        const data = res?.data ?? res;
        setInvite(data);

        const personal = data?.personal ?? {};
        const bank = data?.bank ?? {};
        const history = Array.isArray(data?.history) ? data.history : [];

        const docTypes = Array.isArray(data?.documentTypes) ? data.documentTypes : [];
        setDocumentTypes(docTypes);
        const typeNames = new Set<string>(
          docTypes.map((t: any) => t?.name).filter(Boolean)
        );

        form.setFieldsValue({
          personal: {
            ...personal,
            dob: toDayjs(personal.dob),
            address: {
              current: { ...(personal?.address?.current ?? {}) },
              permanent: { ...(personal?.address?.permanent ?? {}) },
            },
          },
          bank: { ...bank },
          history: history.length
            ? history.map((h: any) => ({
                ...mapHistoryItem(h),
                // Stash prefilled documents on the form item so each company
                // card can lazily seed its docState once its Form.List field
                // key is known.
                __docPrefill: mapHistoryDocuments(h?.documents, typeNames),
              }))
            : [],
        });
      } catch (e) {
        if (active) setInvalid(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async () => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      message.error("Please fill the required fields before submitting.");
      return;
    }

    const personal = values.personal ?? {};
    const bank = values.bank ?? {};
    const history = Array.isArray(values.history) ? values.history : [];

    const payload = {
      personal: {
        firstName: personal.firstName,
        lastName: personal.lastName,
        gender: personal.gender,
        dob: fmtDate(personal.dob),
        bloodGroup: personal.bloodGroup,
        mobile: personal.mobile,
        workEmail: personal.workEmail,
        personalEmail: personal.personalEmail,
        address: {
          current: {
            c_flat: personal?.address?.current?.c_flat,
            c_area: personal?.address?.current?.c_area,
            c_city: personal?.address?.current?.c_city,
            c_state: personal?.address?.current?.c_state,
            c_country: personal?.address?.current?.c_country,
            c_pincode: personal?.address?.current?.c_pincode,
          },
          permanent: {
            p_flat: personal?.address?.permanent?.p_flat,
            p_area: personal?.address?.permanent?.p_area,
            p_city: personal?.address?.permanent?.p_city,
            p_state: personal?.address?.permanent?.p_state,
            p_country: personal?.address?.permanent?.p_country,
            p_pincode: personal?.address?.permanent?.p_pincode,
          },
        },
        relationship: personal.relationship,
        relationName: personal.relationName,
        relationMobile: personal.relationMobile,
        aadhaar: personal.aadhaar,
        pan: personal.pan,
        passport: personal.passport,
      },
      bank: {
        bankName: bank.bankName,
        accountHolderName: bank.accountHolderName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        branchName: bank.branchName,
        accountType: bank.accountType,
        uanNumber: bank.uanNumber,
        pfNumber: bank.pfNumber,
        esiNumber: bank.esiNumber,
        taxRegime: bank.taxRegime,
        paymentType: bank.paymentType,
      },
      history: history.map((h: any, idx: number) => {
        const fieldKey = historyKeysRef.current[idx];
        const bucket =
          fieldKey != null ? docState[fieldKey] : undefined;
        const documents = bucket
          ? buildDocumentsPayload(bucket)
          : [];
        return {
          companyName: h?.companyName,
          designation: h?.designation,
          employmentType: h?.employmentType,
          industry: h?.industry,
          location: h?.location,
          address: h?.address,
          doj: fmtDate(h?.doj),
          lwd: fmtDate(h?.lwd),
          contacts: (Array.isArray(h?.contacts) ? h.contacts : []).map((c: any) => ({
            contactRole: c?.contactRole,
            name: c?.name,
            mobile: c?.mobile,
            email: c?.email,
          })),
          documents,
        };
      }),
    };

    setSubmitting(true);
    try {
      await PublicOnboardingService.submit(token, payload);
      message.success("Details submitted successfully.");
      setSubmitted(true);
    } catch (e: any) {
      message.error(e?.message || "Failed to submit your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------- documents ------------------------- */

  // Ensure a company's docState bucket exists; seed it from the form's
  // __docPrefill (previously-uploaded docs) the first time we touch it.
  const ensureDocBucket = (key: number, fieldName: number) => {
    setDocState((prev) => {
      if (prev[key]) return prev;
      const prefill = form.getFieldValue(["history", fieldName, "__docPrefill"]) || {
        catalog: {},
        custom: [],
      };
      return {
        ...prev,
        [key]: {
          catalog: { ...(prefill.catalog || {}) },
          custom: Array.isArray(prefill.custom) ? [...prefill.custom] : [],
        },
      };
    });
  };

  const getDocBucket = (key: number) =>
    docState[key] || { catalog: {}, custom: [] };

  // Set/replace the file for a catalog document type.
  const setCatalogDoc = async (key: number, typeName: string, file: File) => {
    try {
      const base64 = await fileToDataUrl(file);
      setDocState((prev) => {
        const bucket = prev[key] || { catalog: {}, custom: [] };
        return {
          ...prev,
          [key]: {
            ...bucket,
            catalog: {
              ...bucket.catalog,
              [typeName]: { base64, fileName: file.name },
            },
          },
        };
      });
    } catch {
      message.error("Could not read the selected file. Please try again.");
    }
  };

  const removeCatalogDoc = (key: number, typeName: string) => {
    setDocState((prev) => {
      const bucket = prev[key] || { catalog: {}, custom: [] };
      const nextCatalog = { ...bucket.catalog };
      delete nextCatalog[typeName];
      return { ...prev, [key]: { ...bucket, catalog: nextCatalog } };
    });
  };

  const addCustomDoc = (key: number) => {
    setDocState((prev) => {
      const bucket = prev[key] || { catalog: {}, custom: [] };
      return {
        ...prev,
        [key]: { ...bucket, custom: [...bucket.custom, { documentName: "" }] },
      };
    });
  };

  const removeCustomDoc = (key: number, idx: number) => {
    setDocState((prev) => {
      const bucket = prev[key] || { catalog: {}, custom: [] };
      const next = bucket.custom.filter((_: any, i: number) => i !== idx);
      return { ...prev, [key]: { ...bucket, custom: next } };
    });
  };

  const setCustomDocName = (key: number, idx: number, name: string) => {
    setDocState((prev) => {
      const bucket = prev[key] || { catalog: {}, custom: [] };
      const next = bucket.custom.map((c: any, i: number) =>
        i === idx ? { ...c, documentName: name } : c
      );
      return { ...prev, [key]: { ...bucket, custom: next } };
    });
  };

  // Clear just the attached file of a custom doc (keep the typed name).
  const clearCustomDocFile = (key: number, idx: number) => {
    setDocState((prev) => {
      const bucket = prev[key] || { catalog: {}, custom: [] };
      const next = bucket.custom.map((c: any, i: number) =>
        i === idx ? { documentName: c.documentName } : c
      );
      return { ...prev, [key]: { ...bucket, custom: next } };
    });
  };

  const setCustomDocFile = async (key: number, idx: number, file: File) => {
    try {
      const base64 = await fileToDataUrl(file);
      setDocState((prev) => {
        const bucket = prev[key] || { catalog: {}, custom: [] };
        const next = bucket.custom.map((c: any, i: number) =>
          i === idx ? { ...c, base64, fileName: file.name, existingUrl: undefined } : c
        );
        return { ...prev, [key]: { ...bucket, custom: next } };
      });
    } catch {
      message.error("Could not read the selected file. Please try again.");
    }
  };

  /**
   * Build the `documents` payload array for one company from its docState
   * bucket. Skips empty slots; preserves existing files via { url }.
   */
  const buildDocumentsPayload = (bucket: { catalog: Record<string, any>; custom: any[] }) => {
    const out: any[] = [];
    // Catalog types
    for (const [typeName, entry] of Object.entries(bucket.catalog || {})) {
      if (!entry) continue;
      const e: any = entry;
      if (e.base64) {
        out.push({ documentType: typeName, files: [{ base64: e.base64, fileName: e.fileName }] });
      } else if (e.existingUrl) {
        out.push({ documentType: typeName, files: [{ url: e.existingUrl }] });
      }
    }
    // Custom docs
    for (const c of bucket.custom || []) {
      const name = (c?.documentName || "").trim();
      if (!name) continue;
      if (c.base64) {
        out.push({ documentType: name, files: [{ base64: c.base64, fileName: c.fileName }] });
      } else if (c.existingUrl) {
        out.push({ documentType: name, files: [{ url: c.existingUrl }] });
      }
    }
    return out;
  };

  // Compact "picked file" pill with a remove action.
  const FilePill = ({ fileName, url, onRemove }: { fileName?: string; url?: string; onRemove: () => void }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        background: "#eef2ff",
        border: "1px solid #e0e7ff",
        borderRadius: 8,
        padding: "4px 8px",
        marginTop: 6,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#3730a3", minWidth: 0 }}>
        <PaperClipOutlined />
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: "#3730a3", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName || "View file"}
          </a>
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName || "Selected file"}</span>
        )}
      </span>
      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </div>
  );

  // Renders the Documents sub-area for a single company card.
  const CompanyDocuments = ({ fieldKey, fieldName }: { fieldKey: number; fieldName: number }) => {
    // Lazily seed this company's bucket from prefill on first render.
    useEffect(() => {
      ensureDocBucket(fieldKey, fieldName);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldKey]);

    const bucket = getDocBucket(fieldKey);
    const inputStyle: React.CSSProperties = { borderRadius: 8 };

    return (
      <>
        <Divider style={{ margin: "12px 0", fontSize: 12, color: "var(--text-slate-400)" }} orientation="left" orientationMargin={0}>
          Documents
        </Divider>
        <Row gutter={16}>
          {documentTypes.map((dt: any) => {
            const typeName = dt?.name;
            if (!typeName) return null;
            const entry = bucket.catalog?.[typeName];
            const hasFile = !!(entry && (entry.base64 || entry.existingUrl));
            return (
              <Col xs={24} sm={12} key={dt.id ?? typeName}>
                <Form.Item
                  label={typeName}
                  help={dt?.description || undefined}
                  style={{ marginBottom: 12 }}
                >
                  {!hasFile && (
                    <Upload
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={(file) => {
                        setCatalogDoc(fieldKey, typeName, file as File);
                        return false;
                      }}
                    >
                      <Button size="small" icon={<UploadOutlined />} style={inputStyle}>
                        Attach file
                      </Button>
                    </Upload>
                  )}
                  {hasFile && (
                    <FilePill
                      fileName={entry.fileName}
                      url={entry.existingUrl}
                      onRemove={() => removeCatalogDoc(fieldKey, typeName)}
                    />
                  )}
                </Form.Item>
              </Col>
            );
          })}
        </Row>

        {/* Custom documents */}
        <div style={{ marginTop: 4 }}>
          {(bucket.custom || []).map((c: any, ci: number) => {
            const hasFile = !!(c.base64 || c.existingUrl);
            return (
              <div
                key={ci}
                style={{
                  border: "1px solid var(--border-slate-200)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "var(--bg-slate-50)",
                }}
              >
                <Row gutter={12} align="middle">
                  <Col xs={24} sm={12}>
                    <Form.Item label="Document Name" style={{ marginBottom: 8 }}>
                      <Input
                        style={inputStyle}
                        placeholder="e.g. Reference Letter"
                        value={c.documentName}
                        onChange={(e) => setCustomDocName(fieldKey, ci, e.target.value)}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="File" style={{ marginBottom: 8 }}>
                      {!hasFile && (
                        <Upload
                          maxCount={1}
                          showUploadList={false}
                          beforeUpload={(file) => {
                            setCustomDocFile(fieldKey, ci, file as File);
                            return false;
                          }}
                        >
                          <Button size="small" icon={<UploadOutlined />} style={inputStyle}>
                            Attach file
                          </Button>
                        </Upload>
                      )}
                      {hasFile && (
                        <FilePill
                          fileName={c.fileName}
                          url={c.existingUrl}
                          onRemove={() => clearCustomDocFile(fieldKey, ci)}
                        />
                      )}
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ textAlign: "right" }}>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeCustomDoc(fieldKey, ci)}
                  >
                    Remove document
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => addCustomDoc(fieldKey)}
            style={{ marginTop: 4 }}
          >
            Add custom document
          </Button>
        </div>
      </>
    );
  };

  /* ------------------------- render states ------------------------- */

  const pageWrap: React.CSSProperties = {
    // Fixed viewport height + internal scroll so the form is always scrollable,
    // even if an ancestor sets overflow:hidden.
    height: "100vh",
    overflowY: "auto",
    background: "var(--bg-primary)",
    padding: "32px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  if (loading) {
    return (
      <div style={{ ...pageWrap, justifyContent: "center" }}>
        <ZukvoLoader size="lg" message="Loading your onboarding form..." />
      </div>
    );
  }

  if (invalid) {
    return (
      <div style={{ ...pageWrap, justifyContent: "center" }}>
        <Card style={{ maxWidth: 480, width: "100%", borderRadius: 16, textAlign: "center" }}>
          <Result
            status="warning"
            title="Link unavailable"
            subTitle="This onboarding link is invalid or has expired. Please contact your HR team for a new link."
          />
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ ...pageWrap, justifyContent: "center" }}>
        <Card style={{ maxWidth: 480, width: "100%", borderRadius: 16, textAlign: "center" }}>
          <Result
            status="success"
            title="Thank you — your details were submitted"
            subTitle="Your information has been received. Our HR team will be in touch with the next steps."
          />
        </Card>
      </div>
    );
  }

  const emp = invite?.employee;
  const expiresAt = invite?.expiresAt ? dayjs(invite.expiresAt) : null;
  const sections: string[] = Array.isArray(invite?.sections) ? invite.sections : [];
  const showPersonal = !sections.length || sections.includes("personal");
  const showBank = !sections.length || sections.includes("bank");
  const showHistory = !sections.length || sections.includes("history");

  const sectionContainerStyle: React.CSSProperties = {
    padding: 28,
    backgroundColor: "var(--bg-pure-white, #ffffff)",
    border: "1px solid var(--border-slate-200)",
    borderRadius: 0,
    marginBottom: 20,
  };

  const inputStyle: React.CSSProperties = { 
    borderRadius: 8,
    backgroundColor: "transparent",
    borderColor: "var(--border-slate-200, #e2e8f0)",
  };

  return (
    <div style={pageWrap}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .ant-select-selector, 
          .ant-picker, 
          .ant-input, 
          .ant-input-number, 
          .ant-btn,
          .ant-input-affix-wrapper {
            border-radius: 8px !important;
          }
          
          .ant-select-selector, 
          .ant-picker, 
          .ant-input, 
          .ant-input-number,
          .ant-input-affix-wrapper {
            background-color: transparent !important;
          }
        `
      }} />
      <div style={{ width: "100%", maxWidth: 960 }}>
        {/* Brand / header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--premium-blue)",
              marginBottom: 4,
            }}
          >
            Zukvo
          </div>
          <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>New Hire Onboarding</Text>
        </div>

        <div style={sectionContainerStyle}>
          {/* Greeting */}
          <div style={{ marginBottom: 8 }}>
            <Title level={4} style={{ margin: 0, color: "var(--text-slate-900)" }}>
              {emp?.firstName ? `Welcome, ${emp.firstName}${emp?.lastName ? ` ${emp.lastName}` : ""}!` : "Welcome!"}
            </Title>
            <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>
              Please review and complete your details below.
              {emp?.employeeCode ? ` (Employee Code: ${emp.employeeCode})` : ""}
            </Text>
            {expiresAt && (
              <div style={{ marginTop: 6 }}>
                <Text style={{ color: "var(--accounts-rose-text)", fontSize: 12 }}>
                  This link expires on {expiresAt.format("DD MMM YYYY")}.
                </Text>
              </div>
            )}
          </div>
        </div>

        <Form form={form} layout="vertical" requiredMark="optional" scrollToFirstError size="large">
            {/* ----------------- 1. PERSONAL ----------------- */}
            {showPersonal && (
              <div style={sectionContainerStyle}>
                <SectionHeader step={1} title="Personal Details" subtitle="Your basic and identity information" />
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name={["personal", "firstName"]}
                      label="First Name"
                      rules={[
                        { required: true, message: "First name is required" },
                        { pattern: /^[A-Za-z\s]+$/, message: "No special characters allowed" }
                      ]}
                    >
                      <Input style={inputStyle} placeholder="First name" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name={["personal", "lastName"]}
                      label="Last Name"
                      rules={[
                        { required: true, message: "Last name is required" },
                        { pattern: /^[A-Za-z\s]+$/, message: "No special characters allowed" }
                      ]}
                    >
                      <Input style={inputStyle} placeholder="Last name" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "gender"]} label="Gender">
                      <Select style={inputStyle} placeholder="Select" allowClear
                        options={[
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "dob"]} label="Date of Birth">
                      <DatePicker style={{ ...inputStyle, width: "100%" }} format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "bloodGroup"]} label="Blood Group">
                      <Select style={inputStyle} placeholder="Select" allowClear
                        options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => ({ value: b, label: b }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name={["personal", "mobile"]}
                      label="Mobile"
                      rules={[
                        { required: true, message: "Mobile is required" },
                        { pattern: /^[0-9]{10,15}$/, message: "Must be 10-15 digits" }
                      ]}
                    >
                      <Input style={inputStyle} placeholder="Mobile number" maxLength={15} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name={["personal", "workEmail"]}
                      label="Work Email"
                      rules={[{ type: "email", message: "Enter a valid email" }]}
                    >
                      <Input style={inputStyle} placeholder="name@company.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name={["personal", "personalEmail"]}
                      label="Personal Email"
                      rules={[{ type: "email", message: "Enter a valid email" }]}
                    >
                      <Input style={inputStyle} placeholder="name@gmail.com" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: "12px 0", color: "var(--text-slate-400)", fontSize: 13 }} orientation="left" orientationMargin={0}>
                  <EnvironmentOutlined style={{ marginRight: 6 }} /> Current Address
                </Divider>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["personal", "address", "current", "c_flat"]} label="Flat / House / Building">
                      <Input style={inputStyle} placeholder="Flat / House no." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["personal", "address", "current", "c_area"]} label="Area / Street">
                      <Input style={inputStyle} placeholder="Area / Street" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "current", "c_city"]} label="City" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="City" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "current", "c_state"]} label="State" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="State" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "current", "c_country"]} label="Country" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="Country" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "current", "c_pincode"]} label="Pincode" rules={[{ pattern: /^[0-9]{6}$/, message: "Invalid pincode" }]}>
                      <Input style={inputStyle} placeholder="Pincode" maxLength={6} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                </Row>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    margin: "16px 0 12px",
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--border-slate-200)",
                  }}
                >
                  <span style={{ color: "var(--text-slate-400)", fontSize: 13, fontWeight: 500 }}><HomeOutlined style={{ marginRight: 6 }} />Permanent Address</span>
                  <Checkbox
                    checked={sameAsCurrent}
                    onChange={(e) => handleSameAsCurrent(e.target.checked)}
                    style={{ fontSize: 13, color: "#475569" }}
                  >
                    Same as Current Address
                  </Checkbox>
                </div>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["personal", "address", "permanent", "p_flat"]} label="Flat / House / Building">
                      <Input style={inputStyle} placeholder="Flat / House no." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["personal", "address", "permanent", "p_area"]} label="Area / Street">
                      <Input style={inputStyle} placeholder="Area / Street" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "permanent", "p_city"]} label="City" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="City" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "permanent", "p_state"]} label="State" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="State" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "permanent", "p_country"]} label="Country" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="Country" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "address", "permanent", "p_pincode"]} label="Pincode" rules={[{ pattern: /^[0-9]{6}$/, message: "Invalid pincode" }]}>
                      <Input style={inputStyle} placeholder="Pincode" maxLength={6} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: "12px 0", color: "var(--text-slate-400)", fontSize: 13 }} orientation="left" orientationMargin={0}>
                  <ContactsOutlined style={{ marginRight: 6 }} /> Emergency Contact
                </Divider>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "relationship"]} label="Relationship">
                      <Select style={inputStyle} placeholder="Select Relationship" allowClear options={[
                        { value: "father", label: "Father" },
                        { value: "mother", label: "Mother" },
                        { value: "spouse", label: "Spouse" },
                        { value: "guardian", label: "Guardian" },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "relationName"]} label="Contact Name" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="Name" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "relationMobile"]} label="Contact Mobile" rules={[
                      { pattern: /^[0-9]{7,15}$/, message: "Must be 7-15 digits" }
                    ]}>
                      <Input style={inputStyle} placeholder="Mobile number" maxLength={15} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: "12px 0", color: "var(--text-slate-400)", fontSize: 13 }} orientation="left" orientationMargin={0}>
                  <IdcardOutlined style={{ marginRight: 6 }} /> Identity Documents
                </Divider>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "aadhaar"]} label="Aadhaar Number" rules={[
                      { pattern: /^[0-9]{12}$/, message: "Must be exactly 12 digits" }
                    ]}>
                      <Input style={inputStyle} placeholder="Aadhaar" maxLength={12} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "pan"]} label="PAN" rules={[
                      { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN format (e.g. ABCDE1234F)" }
                    ]}>
                      <Input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="PAN" maxLength={10} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["personal", "passport"]} label="Passport Number" rules={[
                      { pattern: /^[A-Z]{1}[0-9]{7}$/, message: "Invalid Passport format (e.g. A1234567)" }
                    ]}>
                      <Input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="Passport (optional)" maxLength={8} />
                    </Form.Item>
                  </Col>
                </Row>
                </div>
            )}

            {/* ----------------- 2. BANK & PAYROLL ----------------- */}
            {showBank && (
              <div style={sectionContainerStyle}>
                <SectionHeader step={2} title="Bank & Payroll" subtitle="Salary account and statutory details" />
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "bankName"]} label="Bank Name" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="Bank name" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "accountHolderName"]} label="Account Holder Name" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="As per bank records" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "accountNumber"]} label="Account Number" rules={[
                      { pattern: /^[0-9]{9,18}$/, message: "Account number must be 9-18 digits" }
                    ]}>
                      <Input style={inputStyle} placeholder="Account number" maxLength={18} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "ifscCode"]} label="IFSC Code" rules={[
                      { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC Code format" }
                    ]}>
                      <Input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="IFSC" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "branchName"]} label="Branch Name" rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                      <Input style={inputStyle} placeholder="Branch" onKeyPress={(e) => {
                        if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "accountType"]} label="Account Type">
                      <Select style={inputStyle} placeholder="Select" allowClear
                        options={[
                          { value: "Savings", label: "Savings" },
                          { value: "Current", label: "Current" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["bank", "uanNumber"]} label="UAN Number" rules={[
                      { pattern: /^[0-9]{12}$/, message: "UAN must be 12 digits" }
                    ]}>
                      <Input style={inputStyle} placeholder="UAN (optional)" maxLength={12} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["bank", "pfNumber"]} label="PF Number" rules={[
                      { pattern: /^[A-Za-z]{5}[0-9]{17}$/, message: "Invalid PF format (e.g. MHBAN00000640000000123)" }
                    ]}>
                      <Input style={{ ...inputStyle, textTransform: "uppercase" }} placeholder="PF (optional)" maxLength={22} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name={["bank", "esiNumber"]} label="ESI Number" rules={[
                      { pattern: /^[0-9]{17}$/, message: "ESI must be 17 digits" }
                    ]}>
                      <Input style={inputStyle} placeholder="ESI (optional)" maxLength={17} onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                      }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "taxRegime"]} label="Tax Regime">
                      <Select style={inputStyle} placeholder="Select" allowClear
                        options={[
                          { value: "Old", label: "Old Regime" },
                          { value: "New", label: "New Regime" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name={["bank", "paymentType"]} label="Payment Type">
                      <Select style={inputStyle} placeholder="Select" allowClear
                        options={[
                          { value: "Bank Transfer", label: "Bank Transfer" },
                          { value: "Cheque", label: "Cheque" },
                          { value: "Cash", label: "Cash" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                </div>
            )}

            {/* ----------------- 3. EMPLOYEE HISTORY ----------------- */}
            {showHistory && (
              <div style={sectionContainerStyle}>
                <SectionHeader step={3} title="Employment History" subtitle="Your previous companies (optional)" />
                <Form.List name="history">
                  {(fields, { add, remove }) => {
                    // Keep the ordered field keys in sync with the rendered
                    // order so submit can map history[i] -> docState[key].
                    historyKeysRef.current = fields.map((f) => f.key as number);
                    return (
                    <>
                      {fields.map((field, idx) => (
                        <Card
                          key={field.key}
                          size="small"
                          style={{ marginBottom: 16, borderRadius: 12, background: "var(--bg-slate-50)", borderColor: "var(--border-slate-200)" }}
                          title={`Previous Company #${idx + 1}`}
                          extra={
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            >
                              Remove
                            </Button>
                          }
                        >
                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item name={[field.name, "companyName"]} label="Company Name" rules={[{ pattern: /^[A-Za-z0-9\s.,&-]+$/, message: "Invalid characters" }]}>
                                <Input style={inputStyle} placeholder="Company name" onKeyPress={(e) => {
                                  if (!/^[A-Za-z0-9\s.,&-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                                }} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item name={[field.name, "designation"]} label="Designation">
                                <Input style={inputStyle} placeholder="e.g. Software Engineer" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item name={[field.name, "employmentType"]} label="Employment Type">
                                <Select style={inputStyle} placeholder="Select" allowClear
                                  options={[
                                    { value: "Full Time", label: "Full Time" },
                                    { value: "Contract", label: "Contract" },
                                    { value: "Internship", label: "Internship" },
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item name={[field.name, "industry"]} label="Industry">
                                <Input style={inputStyle} placeholder="e.g. Fintech" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item name={[field.name, "location"]} label="Location">
                                <Input style={inputStyle} placeholder="e.g. Bangalore" />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item name={[field.name, "address"]} label="Company Address">
                                <Input style={inputStyle} placeholder="Full address" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item name={[field.name, "doj"]} label="Date of Joining">
                                <DatePicker style={{ ...inputStyle, width: "100%" }} format="YYYY-MM-DD" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item name={[field.name, "lwd"]} label="Last Working Day">
                                <DatePicker style={{ ...inputStyle, width: "100%" }} format="YYYY-MM-DD" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Divider style={{ margin: "4px 0 12px", fontSize: 12, color: "var(--text-slate-400)" }} orientation="left" orientationMargin={0}>
                            Reference Contacts
                          </Divider>
                          <Form.List name={[field.name, "contacts"]}>
                            {(cFields, { add: addContact, remove: removeContact }) => (
                              <>
                                {cFields.map((cField, ci) => (
                                  <div
                                    key={cField.key}
                                    style={{
                                      border: "1px solid var(--border-slate-200)",
                                      borderRadius: 8,
                                      padding: "10px 12px 2px",
                                      marginBottom: 8,
                                      background: "var(--bg-slate-50)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 4,
                                      }}
                                    >
                                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-500)" }}>
                                        Contact {ci + 1}
                                      </span>
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeContact(cField.name)}
                                      />
                                    </div>
                                    {/* Row 1 — role, name */}
                                    <Row gutter={12}>
                                      <Col xs={24} sm={12}>
                                        <Form.Item name={[cField.name, "contactRole"]} label="Role" style={{ marginBottom: 8 }}>
                                          <Select style={inputStyle} placeholder="Role" allowClear
                                            options={[
                                              { value: "hr", label: "HR" },
                                              { value: "manager", label: "Manager" },
                                              { value: "teamLead", label: "Team Lead" },
                                              { value: "reportingManager", label: "Reporting Manager" },
                                            ]}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} sm={12}>
                                        <Form.Item name={[cField.name, "name"]} label="Name" style={{ marginBottom: 8 }} rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}>
                                          <Input style={inputStyle} placeholder="Name" onKeyPress={(e) => {
                                            if (!/^[A-Za-z\s-]$/.test(e.key) && e.key.length === 1) e.preventDefault();
                                          }} />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                    {/* Row 2 — mobile, email */}
                                    <Row gutter={12}>
                                      <Col xs={24} sm={12}>
                                        <Form.Item name={[cField.name, "mobile"]} label="Mobile" style={{ marginBottom: 8 }} rules={[
                                          { pattern: /^[0-9]{7,15}$/, message: "Must be 7-15 digits" }
                                        ]}>
                                          <Input style={inputStyle} placeholder="Mobile" maxLength={15} onKeyPress={(e) => {
                                            if (!/[0-9]/.test(e.key) && e.key.length === 1) e.preventDefault();
                                          }} />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} sm={12}>
                                        <Form.Item
                                          name={[cField.name, "email"]}
                                          label="Email"
                                          style={{ marginBottom: 8 }}
                                          rules={[{ type: "email", message: "Invalid email" }]}
                                        >
                                          <Input style={inputStyle} placeholder="Email" />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  </div>
                                ))}
                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => addContact({})}
                                  style={{ marginTop: 4 }}
                                >
                                  Add Contact
                                </Button>
                              </>
                            )}
                          </Form.List>

                          {/* Documents required for this company entry */}
                          <CompanyDocuments fieldKey={field.key as number} fieldName={field.name} />
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => add({ contacts: [] })}
                        style={{ borderRadius: 10, height: 44 }}
                      >
                        Add Previous Company
                      </Button>
                    </>
                    );
                  }}
                </Form.List>
                </div>
            )}

            <div style={sectionContainerStyle}>
            <Button
              type="primary"
              size="large"
              block
              loading={submitting}
              onClick={handleSubmit}
              style={{ borderRadius: 10, height: 48, fontWeight: 600, background: "var(--premium-blue)" }}
            >
              Submit My Details
            </Button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                Your information is securely transmitted to your employer's HR team.
              </Text>
            </div>
            </div>
          </Form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>Powered by Zukvo</Text>
        </div>
      </div>
    </div>
  );
}
