"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  Col,
  Row,
  Card,
  Button,
  InputNumber,
  Switch,
  DatePicker,
  message,
  Space,
  Typography,
  Divider
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import {
  RecruitmentService,
  JobRequisitionData,
  SelectOption
} from "@/services/recruitment.service";
import AttachmentSection, { AttachmentItem } from "./AttachmentSection";
import dayjs from "dayjs";
import ZukvoLoader from "@/components/common/ZukvoLoader";


const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

export default function RequisitionForm({
  isEdit = false }: {
    isEdit?: boolean;
  }) {
  const [form] = Form.useForm();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Dropdown data
  const [clients, setClients] = useState<SelectOption[]>([]);
  const [members, setMembers] = useState<SelectOption[]>([]);
  const [implementationPartners, setImplementationPartners] = useState<SelectOption[]>([]);
  const [recruitmentClients, setRecruitmentClients] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);
  const [implementationContacts, setImplementationContacts] = useState<SelectOption[]>([]);
  const [clientContacts, setClientContacts] = useState<SelectOption[]>([]);
  const [vendorContacts, setVendorContacts] = useState<SelectOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Attachments — single source of truth for both new (staged) and existing (saved) attachments
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Load dropdown data on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [clientData, memberData, partnerData, recClientData, vendorData] = await Promise.all([
          RecruitmentService.getClientsForSelect().catch(() => []),
          RecruitmentService.getMembersForSelect().catch(() => []),
          RecruitmentService.getImplementationPartnersForSelect().catch(() => []),
          RecruitmentService.getRecruitmentClientsForSelect().catch(() => []),
          RecruitmentService.getVendorsForSelect().catch(() => []),
        ]);
        setClients(clientData);
        setMembers(memberData);
        setImplementationPartners(partnerData);
        setRecruitmentClients(recClientData);
        setVendors(vendorData);
        console.log("RequisitionForm - Dropdowns loaded successfully");
        console.log("Original Clients Count:", clientData?.length);
        console.log("Members Count:", memberData?.length);
        console.log("Implementation Partners:", partnerData);
        console.log("Recruitment Clients:", recClientData);
        console.log("Vendors:", vendorData);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdowns();
  }, []);

  const handleImplementationChange = async (id: string | null) => {
    try {
      console.log("Implementation Partner changed:", id);
      if (id) {
        const data = await RecruitmentService.getImplementationContacts(id);
        console.log("Fetched implementation contacts:", data);
        setImplementationContacts(data);
      } else {
        setImplementationContacts([]);
      }
    } catch (error) {
      console.error("Failed to fetch implementation contacts:", error);
      message.error("Failed to load contacts for the selected partner.");
    } finally {
      form.setFieldValue("implementationContactId", undefined);
    }
  };

  const handleRecruitmentClientChange = async (id: string | null) => {
    try {
      console.log("Recruitment Client changed:", id);
      if (id) {
        const data = await RecruitmentService.getRecruitmentClientContacts(id);
        console.log("Fetched client contacts:", data);
        setClientContacts(data);
      } else {
        setClientContacts([]);
      }
    } catch (error) {
      console.error("Failed to fetch client contacts:", error);
      message.error("Failed to load contacts for the selected client.");
    } finally {
      form.setFieldValue("clientContactId", undefined);
    }
  };

  const handleVendorChange = async (id: string | null) => {
    try {
      console.log("Vendor changed:", id);
      if (id) {
        const data = await RecruitmentService.getVendorContacts(id);
        console.log("Fetched vendor contacts:", data);
        setVendorContacts(data);
      } else {
        setVendorContacts([]);
      }
    } catch (error) {
      console.error("Failed to fetch vendor contacts:", error);
      message.error("Failed to load contacts for the selected vendor.");
    } finally {
      form.setFieldValue("vendorContactId", undefined);
    }
  };

  const fetchRequisition = useCallback(async (id: string) => {
    try {
      setFetching(true);
      const data = await RecruitmentService.getRequisitionById(id);

      // Fetch contacts for all 3 entities in parallel if they exist
      const [impContacts, cContacts, vContacts] = await Promise.all([
        data.implementationId
          ? RecruitmentService.getImplementationContacts(data.implementationId).catch(() => [])
          : Promise.resolve([]),
        data.recruitmentClientId
          ? RecruitmentService.getRecruitmentClientContacts(data.recruitmentClientId).catch(() => [])
          : Promise.resolve([]),
        data.vendorIds
          ? RecruitmentService.getVendorContacts(data.vendorIds).catch(() => [])
          : Promise.resolve([]),
      ]);

      setImplementationContacts(impContacts);
      setClientContacts(cContacts);
      setVendorContacts(vContacts);

      const savedContactIds = data.jobRequisitionContacts?.map((jc: any) => jc.contactId) || [];

      // Parse dates into dayjs objects for the DatePicker
      const formattedData = {
        ...data,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        submissionDeadline: data.submissionDeadline
          ? dayjs(data.submissionDeadline)
          : null,
        interviewStartDate: data.interviewStartDate
          ? dayjs(data.interviewStartDate)
          : null,
        expectedClosureDate: data.expectedClosureDate
          ? dayjs(data.expectedClosureDate)
          : null,
        assignedRecruiters: data.assignedRecruiters?.map((r: any) => r.id),
        // Map saved contact IDs to specific fields
        implementationContactId: savedContactIds.find(cid => impContacts.some(opt => opt.value === cid)),
        clientContactId: savedContactIds.find(cid => cContacts.some(opt => opt.value === cid)),
        vendorContactId: savedContactIds.find(cid => vContacts.some(opt => opt.value === cid)),
        // Parse screening questions from JSON
        screeningQuestions:
          Array.isArray(data.screeningQuestions) &&
            data.screeningQuestions.length > 0
            ? data.screeningQuestions
            : undefined
      };

      form.setFieldsValue(formattedData);

      // Load attachments
      try {
        const attachmentsData = await RecruitmentService.getAttachments(id);
        // Mark all loaded attachments as NOT new (they're already on R2)
        const mapped: AttachmentItem[] = (attachmentsData || []).map((a: any) => ({
          ...a,
          isNew: false
        }));
        setAttachments(mapped);
      } catch (error) {
        console.error("Failed to load attachments:", error);
        setAttachments([]);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to load Job Requisition details.");
    } finally {
      setFetching(false);
    }
  }, [form]);

  useEffect(() => {
    if (isEdit && params.id) {
      fetchRequisition(params.id as string);
    }
  }, [isEdit, params.id, fetchRequisition]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // Clean up dates for API submission
      const payload: Partial<JobRequisitionData> = {
        ...values,
        startDate: values.startDate?.toISOString() || null,
        submissionDeadline: values.submissionDeadline?.toISOString() || null,
        interviewStartDate: values.interviewStartDate?.toISOString() || null,
        expectedClosureDate: values.expectedClosureDate?.toISOString() || null,
        // Ensure screening questions is a proper JSON array
        screeningQuestions: values.screeningQuestions || [],
        // Collect contacts from the 3 separate dropdowns into contactIds array
        contactIds: [
          values.implementationContactId,
          values.clientContactId,
          values.vendorContactId,
        ].filter(Boolean)
      };

      let requisitionId = params.id as string;

      if (isEdit) {
        await RecruitmentService.updateRequisition(
          requisitionId,
          payload
        );
        message.success("Job Requisition updated successfully!");
      } else {
        const createdReq = await RecruitmentService.createRequisition(
          payload as JobRequisitionData
        );
        requisitionId = createdReq.id as string;
        message.success("Job Requisition created successfully!");
      }

      // Upload any new (staged) attachments to R2
      const newAttachments = attachments.filter(a => a.isNew);
      for (const attachment of newAttachments) {
        try {
          await RecruitmentService.uploadAttachment(
            requisitionId,
            attachment.fileUrl,
            attachment.fileName,
            attachment.category,
          );
        } catch (uploadError) {
          console.error("Failed to upload attachment", attachment.fileName, uploadError);
          message.error(`Failed to upload ${attachment.fileName}`);
        }
      }

      // Delete any saved attachments that were removed during edit
      if (isEdit && deletedAttachmentIds.length > 0) {
        for (const attachmentId of deletedAttachmentIds) {
          try {
            await RecruitmentService.deleteAttachment(requisitionId, attachmentId);
          } catch (deleteError) {
            console.error("Failed to delete attachment", attachmentId, deleteError);
          }
        }
      }

      router.push("/recruitment/job-requisitions");
    } catch (error) {
      console.error(error);
      message.error(
        `Failed to ${isEdit ? "update" : "create"} Job Requisition.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Queue a saved attachment for deletion (deferred until save)
  const handleDeleteSavedAttachment = async (attachmentId: string) => {
    setDeletedAttachmentIds(prev => [...prev, attachmentId]);
  };

  if (fetching)
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <ZukvoLoader message="Loading requisition details..." size="lg" />
      </div>
    );

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/recruitment/job-requisitions")}
        >
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? "Edit Job Requisition" : "Create Job Requisition"}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          openingsCount: 1,
          priority: "Medium",
          status: "Open",
          jobType: "Full-Time",
          workMode: "Remote",
          securityClearance: false,
          relocationAllowed: false,
          exclusiveCandidate: false,
          blindCvRequired: false
        }}
      >
        {/* ─── Basic Job Information ─── */}
        <Card
          title="Basic Job Information"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="jobTitle"
                label="Job Title"
                rules={[
                  { required: true, message: "Please enter job title" },
                ]}
              >
                <Input placeholder="e.g. Senior Frontend Developer" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobCode" label="Job Code">
                <Input placeholder="e.g. ENG-101" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="openingsCount"
                label="Openings Count"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="clientId" label="Client">
                <Select
                  placeholder="Select client"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={clients.map((c) => ({
                    value: c.value,
                    label: c.label
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="clientContactPerson" label="Client Contact Person">
                <Input placeholder="e.g. John Smith" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobType" label="Job Type">
                <Select>
                  <Option value="Full-Time">Full-Time</Option>
                  <Option value="Contract">Contract</Option>
                  <Option value="Contract to Hire">Contract to Hire</Option>
                  <Option value="Part-Time">Part-Time</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="Priority">
                <Select>
                  <Option value="Critical">Critical</Option>
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="Open">Open</Option>
                  <Option value="On Hold">On Hold</Option>
                  <Option value="Closed">Closed</Option>
                  <Option value="Filled">Filled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Candidate Requirements ─── */}
        <Card
          title="Candidate Requirements"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="mandatorySkills" label="Mandatory Skills">
                <Select
                  mode="tags"
                  placeholder="Type and press enter to add skills"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secondarySkills" label="Secondary Skills">
                <Select
                  mode="tags"
                  placeholder="Type and press enter to add skills"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="experience" label="Experience Required">
                <Input placeholder="e.g. 5+ years" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="education" label="Education Required">
                <Input placeholder="e.g. Bachelor's in CS" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="certification"
                label="Certifications (Optional)"
              >
                <Input placeholder="e.g. AWS Certified Developer" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="communicationSkills" label="Communication Skills">
                <Select placeholder="Select level" allowClear>
                  <Option value="Excellent">Excellent</Option>
                  <Option value="Good">Good</Option>
                  <Option value="Average">Average</Option>
                  <Option value="Poor">Poor</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Job Description ─── */}
        <Card
          title="Job Description"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="jobRole" label="JD Title / Role">
                <Input placeholder="e.g. Full Stack Developer" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="jobDetails" label="Job Details">
                <TextArea
                  rows={4}
                  placeholder="Detailed job description..."
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="responsibilities" label="Responsibilities">
                <TextArea
                  rows={3}
                  placeholder="Key responsibilities for this role..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Visa & Work Authorization ─── */}
        <Card
          title="Visa & Location"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="allowedVisaTypes" label="Allowed Visa Types">
                <Select mode="multiple" placeholder="Select allowed visas">
                  <Option value="USC">US Citizen (USC)</Option>
                  <Option value="Green Card">Green Card (GC)</Option>
                  <Option value="H1B">H1B</Option>
                  <Option value="OPT">OPT</Option>
                  <Option value="CPT">CPT</Option>
                  <Option value="H4 EAD">H4 EAD</Option>
                  <Option value="L1">L1</Option>
                  <Option value="TN">TN</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="excludedVisaTypes" label="Excluded Visa Types">
                <Select mode="multiple" placeholder="Select excluded visas">
                  <Option value="H1B">H1B</Option>
                  <Option value="CPT">CPT</Option>
                  <Option value="OPT">OPT</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="securityClearance"
                label="Security Clearance"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="relocationAllowed"
                label="Relocation Allowed"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="jobLocation" label="Job Location">
                <Input placeholder="e.g. Austin, TX" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workMode" label="Work Mode">
                <Select>
                  <Option value="Remote">Remote</Option>
                  <Option value="Hybrid">Hybrid</Option>
                  <Option value="On-Site">On-Site</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="timeZone" label="Time Zone">
                <Input placeholder="e.g. EST" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── External Contacts Setup ─── */}
        <Card
          title="External Contacts Setup"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            {/* Implementation Section */}
            <Col span={8}>
              <Form.Item name="implementationId" label="Implementation Partner">
                <Select
                  placeholder="Select Implementation Partner"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={implementationPartners}
                  onChange={handleImplementationChange}
                />
              </Form.Item>
              <Divider style={{ margin: "12px 0" }} />
              <Form.Item name="implementationContactId" label="Implementation Contact">
                <Select
                  placeholder="Select Contact"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={implementationContacts}
                  disabled={!form.getFieldValue("implementationId")}
                />
              </Form.Item>
            </Col>

            {/* Client Section */}
            <Col span={8}>
              <Form.Item name="recruitmentClientId" label="Client">
                <Select
                  placeholder="Select Client"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={recruitmentClients}
                  onChange={handleRecruitmentClientChange}
                />
              </Form.Item>
              <Divider style={{ margin: "12px 0" }} />
              <Form.Item name="clientContactId" label="Client Contact">
                <Select
                  placeholder="Select Contact"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={clientContacts}
                  disabled={!form.getFieldValue("recruitmentClientId")}
                />
              </Form.Item>
            </Col>

            {/* Vendor Section */}
            <Col span={8}>
              <Form.Item name="vendorIds" label="Vendor">
                <Select
                  placeholder="Select Vendor"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={vendors}
                  onChange={handleVendorChange}
                />
              </Form.Item>
              <Divider style={{ margin: "12px 0" }} />
              <Form.Item name="vendorContactId" label="Vendor Contact">
                <Select
                  placeholder="Select Contact"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={vendorContacts}
                  disabled={!form.getFieldValue("vendorIds")}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Billing & Rate Information ─── */}
        <Card
          title="Billing & Rate Information"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="maxBillRate" label="Max Bill Rate ($/hr)">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="minPayRate" label="Min Pay Rate ($/hr)">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="recruiterRate" label="Recruiter Rate ($/hr)">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="overtimeMultiplier"
                label="OT Rate Multiplier"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.1}
                  placeholder="e.g. 1.5"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Hiring Timeline ─── */}
        <Card
          title="Hiring Timeline"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="startDate" label="Expected Start Date">
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="submissionDeadline" label="Submission Deadline">
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="interviewStartDate"
                label="Interview Start Date"
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="expectedClosureDate"
                label="Expected Closure Date"
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Recruiter Assignment ─── */}
        <Card
          title="Recruiter Assignment"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="assignedRecruiters"
                label="Assigned Recruiters"
              >
                <Select
                  mode="multiple"
                  placeholder="Select recruiters"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={members.map((m) => ({
                    value: m.value,
                    label: m.label
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="accountManagerId" label="Account Manager">
                <Select
                  placeholder="Select account manager"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={members.map((m) => ({
                    value: m.value,
                    label: m.label
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="deliveryManagerId" label="Delivery Manager">
                <Select
                  placeholder="Select delivery manager"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={loadingDropdowns}
                  options={members.map((m) => ({
                    value: m.value,
                    label: m.label
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="maxSubmissionsPerRec"
                label="Max Submissions / Recruiter"
              >
                <InputNumber style={{ width: "100%" }} min={1} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Candidate Submission Rules ─── */}
        <Card
          title="Candidate Submission Rules"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="maxTotalSubmissions"
                label="Max Total Submissions"
              >
                <InputNumber style={{ width: "100%" }} min={1} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="exclusiveCandidate"
                label="Exclusive Candidate"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="blindCvRequired"
                label="Blind CV Required"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sourceFormat" label="Source / Resume Format">
                <Input placeholder="e.g. PDF, Word" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Screening Questions ─── */}
        <Card
          title="Screening Questions"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Form.List name="screeningQuestions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                    <Col flex="auto">
                      <Form.Item
                        {...restField}
                        name={[name, "question"]}
                        rules={[{ required: true, message: "Enter a question" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder={`Question ${name + 1}`} />
                      </Form.Item>
                    </Col>
                    <Col>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: "#ff4d4f", fontSize: 18 }}
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ width: "100%" }}
                >
                  Add Screening Question
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* ─── Attachments ─── */}
        <AttachmentSection
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          onDeleteSaved={handleDeleteSavedAttachment}
          loading={loadingAttachments}
        />

        {/* ─── Internal Notes ─── */}
        <Card
          title="Internal Notes"
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="internalNotes" label="Notes">
                <TextArea
                  rows={3}
                  placeholder="Notes visible only to internal recruiters..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ─── Submit ─── */}
        <Card bordered={false}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              {isEdit ? "Update Requisition" : "Create Requisition"}
            </Button>
            <Button
              onClick={() => router.push("/recruitment/job-requisitions")}
              size="large"
            >
              Cancel
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
}
