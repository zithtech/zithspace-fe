"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Input,
  Space,
  Button,
  Row,
  Col,
  message,
  Upload,
  Form,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  useCompany,
  useCreateCompany,
  useUpdateCompany,
} from "@/hooks/useCompanies";
import { Company, CreateCompanyData, UpdateCompanyData } from "@/types/company";
import toast from 'react-hot-toast';
import { Toaster } from "react-hot-toast";



const { Title, Text } = Typography;
// const { TextArea } = Input;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

interface Props {
  mode: "create" | "edit";
  editingId: number | null;
  onBack: () => void;
}

export default function NewCompanyDetails({ mode, editingId, onBack }: Props) {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";

  const { data: existingCompany, isLoading: isLoadingCompany } = useCompany(
    editingId,
    isEditMode,
  );
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const [logo, setLogo] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Load existing data for edit mode
  useEffect(() => {
    if (existingCompany) {
      form.setFieldsValue(existingCompany);
      setLogo(existingCompany.logo || "");
    }
  }, [existingCompany, form]);

  

const handleSave = async () => {
  try {
    const values = await form.validateFields();
    const companyData: CreateCompanyData | UpdateCompanyData = {
      ...values,
      logo,
    };

    if (isEditMode && editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        data: companyData,
      });
      toast.success('Company updated successfully!');
    } else {
      await createMutation.mutateAsync(companyData as CreateCompanyData);
      toast.success('Company created successfully!');
    }

    onBack();
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Failed to save company");
    }
  }
};

const handleUpload = async (file: File) => {
  try {
    setUploading(true);
    const base64 = await toBase64(file);
    setLogo(base64);
    toast.success("Logo uploaded successfully");
    return false;
  } catch (error) {
    toast.error("Failed to upload logo");
    return false;
  } finally {
    setUploading(false);
  }
};

const handleRemoveLogo = () => {
  setLogo("");
  toast.success("Logo removed successfully");
};

  const handlePreview = () => {
    const values = form.getFieldsValue();
    const previewData = {
      ...values,
      logo,
      isActive: existingCompany?.isActive || false,
      id: existingCompany?.id || Date.now(),
    };
    message.info(
      "Preview would show company data: " +
        JSON.stringify(previewData, null, 2),
    );
  };

  if (isEditMode && isLoadingCompany) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Title level={4}>Loading company data...</Title>
        </div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
       <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#52c41a',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ff4d4f',
              secondary: '#fff',
            },
          },
        }}
      />
      <Card>
        
        {/* Header - Same as before */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space align="center" size={12}>
            <ArrowLeftOutlined
              style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
              onClick={onBack}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                {isEditMode ? "Edit Company" : "Create Company"}
              </Title>
              <Text type="secondary">Configure company details</Text>
            </div>
          </Space>

          <Space>
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              Preview
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: "",
            email: "",
            phone: "",
            plotNo: "",
            floorNo: "",
            buildingName: "",
            street: "",
            area: "",
            city: "",
            pincode: "",
            country: "",
            cin: "",
            gst: "",
          }}
        >
          {/* Two Column Layout for Basic Info and Logo/Tax */}
          <Row
            gutter={28}
            style={{ marginTop: 16, display: "flex", alignItems: "stretch" }}
          >
            {/* Left Column - Basic Information Card */}
            <Col span={12} style={{ display: "flex", flexDirection: "column" }}>
              <Card
                title="Basic Information"
                style={{
                  border: "1px solid #b9b8b8ff",
                  marginBottom: 16,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
                bodyStyle={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{ flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                      <Form.Item
                        name="name"
                        label="Company Name"
                        rules={[
                          {
                            required: true,
                            message: "Company name is required",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Company Name" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Email" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="phone"
                        label="Phone Number"
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Phone Number" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>

            {/* Right Column - Logo and Tax Cards */}
            <Col span={12} style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{ display: "flex", flexDirection: "column", flex: 1 }}
              >
                {/* Logo Card */}
                <Card
                  title="Company Logo"
                  style={{
                    border: "1px solid #b9b8b8ff",
                    marginBottom: 16,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={handleUpload}
                      onRemove={handleRemoveLogo}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {logo ? (
                        <img
                          src={logo}
                          alt="Company Logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            maxHeight: "150px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                          }}
                        >
                          {uploading ? (
                            "Uploading..."
                          ) : (
                            <>
                              <UploadOutlined
                                style={{ fontSize: 32, marginBottom: 8 }}
                              />
                              <div>Upload Logo</div>
                            </>
                          )}
                        </div>
                      )}
                    </Upload>
                    <div style={{ marginTop: "auto", textAlign: "center" }}>
                      <Text type="secondary">PNG, JPG (Max 2MB)</Text>
                      {logo && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={handleRemoveLogo}
                          style={{ display: "block", marginTop: 4 }}
                        >
                          Remove Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Tax Info Card */}
                <Card
                  title="Tax & Registration Details"
                  style={{
                    border: "1px solid #b9b8b8ff",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                  bodyStyle={{ flex: 1 }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="cin" label="CIN Number">
                        <Input placeholder="CIN Number" />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item name="gst" label="GST Number">
                        <Input placeholder="GST Number" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>
          </Row>

          {/* Full Width Registered Address Card at Bottom */}
          <Card
            title="Registered Address"
            style={{
              border: "1px solid #b9b8b8ff",
              marginTop: 16,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="plotNo" label="Plot / Door No">
                  <Input placeholder="Plot / Door No" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="floorNo" label="Floor No">
                  <Input placeholder="Floor No" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="buildingName" label="Building Name">
                  <Input placeholder="Building Name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="street" label="Street Name">
                  <Input placeholder="Street Name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="area" label="Area / Locality">
                  <Input placeholder="Area / Locality" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="city" label="City">
                  <Input placeholder="City" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pincode" label="Pincode">
                  <Input placeholder="Pincode" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="country" label="Country">
                  <Input placeholder="Country" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </Card>
    </Space>
  );
}
