"use client";

import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Divider,
  message,
  Switch,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  usePayslipFields,
  useCreatePayslipField,
  useUpdatePayslipField,
  useToggleFieldStatus,
  useDeletePayslipField,
} from "@/hooks/usePayslipFields";
import type { PayslipField } from "@/types/payslipField";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

interface PayslipSettingsProps {
  onPreview: (type: "payslip", data: any) => void;
}

type FieldType = "text" | "number" | "date" | "dropdown";

const { Title, Text } = Typography;

export default function PayslipSettings({ onPreview }: PayslipSettingsProps) {
  // Fetch fields from backend
  const { data: fieldsData, isLoading, refetch } = usePayslipFields();
  const createField = useCreatePayslipField();
  const updateField = useUpdatePayslipField();
  const toggleStatus = useToggleFieldStatus();
  const deleteField = useDeletePayslipField();

  const [fields, setFields] = useState<PayslipField[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editField, setEditField] = useState<PayslipField | null>(null);
  const [editForm] = Form.useForm();
  const [editModalKey, setEditModalKey] = useState(0); // Modal refresh key
  const watchedOptions = Form.useWatch("options", editForm);


  // Update local state when data changes
  useEffect(() => {
    if (fieldsData) {
      setFields(fieldsData);
    }
  }, [fieldsData]);

  const handleAddField = () => {
    form.validateFields().then((values) => {
      const fieldData = {
        label: values.name,
        value:
          values.defaultValue !== undefined && values.defaultValue !== null
            ? String(values.defaultValue)
            : "",
        type: values.type,
        status: true,
        ...(values.type === "dropdown" && values.options
          ? {
              options: values.options
                .split(",")
                .map((opt: string) => opt.trim())
                .filter((opt: string) => opt.length > 0),
            }
          : {}),
      };

      createField.mutate(fieldData, {
        onSuccess: () => {
          toast.success("Field added successfully!");
          form.resetFields();
          setIsModalOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to add field");
        },
      });
    }).catch(() => {
      toast.error("Please fill all required fields");
    });
  };

  const handleDeleteField = (id: number) => {
    deleteField.mutate(id, {
      onSuccess: () => {
        toast.success("Field deleted successfully!");
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete field");
      },
    });
  };

  const updateFieldStatus = (id: number, currentStatus: boolean) => {
    toggleStatus.mutate(id, {
      onSuccess: () => {
        toast.success(
          `Field ${currentStatus ? "hidden" : "shown"} successfully!`
        );
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update field status");
      },
    });
  };

  const handleSaveSettings = () => {
    refetch();
    toast.success("Payslip settings refreshed successfully!");
  };

  const renderInputByType = (field: PayslipField) => {
    switch (field.type) {
      case "date":
        return (
          <DatePicker
            style={{ width: "100%" }}
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) => {
              if (date) {
                updateField.mutate({
                  id: field.id,
                  data: { value: String(date.format("YYYY-MM-DD")) },
                }, {
                  onSuccess: () => {
                    toast.success("Date updated successfully!");
                    refetch();
                  },
                  onError: (error: any) => {
                    toast.error(error.message || "Failed to update date");
                  },
                });
              }
            }}
          />
        );

      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            value={field.value ? parseFloat(field.value) : undefined}
            onChange={(value) => {
              updateField.mutate(
                {
                  id: field.id,
                  data: { value: value !== null ? String(value) : "" },
                },
                {
                  onSuccess: () => {
                    toast.success("Number updated successfully!");
                    refetch();
                  },
                  onError: (error: any) => {
                    toast.error(error.message || "Failed to update number");
                  },
                }
              );
            }}
          />
        );

      case "dropdown":
        return (
          <Select
            style={{ width: "100%" }}
            value={field.value}
            onChange={(value) => {
              updateField.mutate({
                id: field.id,
                data: { value },
              }, {
                onSuccess: () => {
                  toast.success("Dropdown value updated!");
                  refetch();
                },
                onError: (error: any) => {
                  toast.error(error.message || "Failed to update dropdown");
                },
              });
            }}
            options={field.options?.map((option) => ({
              label: option,
              value: option,
            }))}
          />
        );

      default:
        return (
          <Input
            value={field.value}
            onChange={(e) => {
              updateField.mutate({
                id: field.id,
                data: { value: e.target.value },
              }, {
                onSuccess: () => {
                  toast.success("Text updated successfully!");
                  refetch();
                },
                onError: (error: any) => {
                  toast.error(error.message || "Failed to update text");
                },
              });
            }}
          />
        );
    }
  };

  const renderFieldValue = (field: PayslipField) => {
    if (!field.value) return "-";

    switch (field.type) {
      case "date":
        return dayjs(field.value).isValid()
          ? dayjs(field.value).format("DD MMM YYYY")
          : field.value;

      case "dropdown":
        return field.value;

      default:
        return field.value;
    }
  };

  const getFieldTypeTag = (type: FieldType) => {
    const typeColors: Record<FieldType, string> = {
      text: "blue",
      number: "green",
      date: "orange",
      dropdown: "purple",
    };

    return (
      <Tag color={typeColors[type]} style={{ marginLeft: 8, fontSize: 11 }}>
        {type.toUpperCase()}
      </Tag>
    );
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditField(null);
    editForm.resetFields();
    setEditModalKey(prev => prev + 1); // Force modal re-render
  };

  // Handle edit button click
  const handleEditClick = (field: PayslipField) => {
    setEditField(field);
    setEditModalKey(prev => prev + 1); // Reset modal key
    
    // Reset form first
    editForm.resetFields();
    
    // Use setTimeout to ensure form is reset before setting new values
    setTimeout(() => {
      const formValues: any = {
        label: field.label,
      };

      // Handle different field types
      if (field.type === "date" && field.value) {
        formValues.value = dayjs(field.value);
      } else if (field.type === "dropdown") {
        // For dropdown, set options as comma-separated string
        formValues.options = field.options?.join(", ") || "";
        // Set value only if it exists in options or is empty
        formValues.value = field.value || undefined;
      } else {
        // For text and number fields
        formValues.value = field.value || "";
      }

      editForm.setFieldsValue(formValues);
    }, 100);
  };

  // Handle edit submission
  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      if (!editField) return;

      const updateData: any = {
        label: values.label,
      };

      // Handle different field types
      if (editField.type === "date") {
        // For date fields, convert Dayjs to string
        updateData.value = values.value ? dayjs(values.value).format("YYYY-MM-DD") : "";
      } else if (editField.type === "dropdown") {
        // For dropdown, handle options and value
        const optionsArray = values.options
          ? values.options
              .split(",")
              .map((opt: string) => opt.trim())
              .filter((opt: string) => opt.length > 0)
          : [];
        
        updateData.options = optionsArray;
        updateData.value = values.value || "";
        
        // If value is not in updated options and not empty, set it to first option
        if (values.value && !optionsArray.includes(values.value) && optionsArray.length > 0) {
          updateData.value = optionsArray[0];
        }
      } else {
        // For text and number fields
        updateData.value = values.value !== null ? String(values.value) : "";
      }

      updateField.mutate(
        { id: editField.id, data: updateData },
        {
          onSuccess: () => {
            toast.success("Field updated successfully!");
            handleEditModalClose();
            refetch();
          },
          onError: (error: any) => {
            toast.error(error.message || "Failed to update field");
          },
        }
      );
    }).catch((errorInfo) => {
      console.log('Validation failed:', errorInfo);
      toast.error("Please fix validation errors");
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification Container - Same as CompanyPage */}
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

      <Card
        style={{
          marginTop: -16,
          marginLeft: 5,
          border: "1px solid #e8e8e8",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* HEADER */}
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: "#1a1a1a" }}>
              Payslip Base Configuration
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Configure payslip fields with add, edit, and delete functionality
            </Text>
          </div>

          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                onPreview("payslip", { fields: fields });
                toast.success("Preview generated successfully!");
              }}
              style={{
                backgroundColor: "#f0f0f0",
                borderColor: "#d9d9d9",
                color: "#595959",
              }}
            >
              Preview
            </Button>

            {/* <Button 
              icon={<CheckOutlined />} 
              onClick={handleSaveSettings}
              loading={isLoading}
            >
              Refresh
            </Button> */}

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: "#1890ff",
                borderColor: "#1890ff",
              }}
            >
              Add Field
            </Button>
          </Space>
        </Space>

        <Divider style={{ margin: "16px 0", backgroundColor: "#f0f0f0" }} />

        {/* FIELDS */}
        <Row gutter={[16, 16]}>
          {fields.map((field) => (
            <Col key={field.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                bordered
                bodyStyle={{
                  padding: 16,
                  backgroundColor: field.status ? "#fafafa" : "#f5f5f5",
                  borderRadius: 6,
                  opacity: field.status ? 1 : 0.8,
                  height: "100%",
                }}
                style={{
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: `1px solid ${field.status ? "#d9d9d9" : "#e8e8e8"}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: 14,
                          color: field.status ? "#1a1a1a" : "#8c8c8c",
                        }}
                      >
                        {field.label}
                      </Text>
                      {getFieldTypeTag(field.type as FieldType)}
                      {!field.status && (
                        <Tag
                          color="default"
                          style={{ marginLeft: 4, fontSize: 10 }}
                        >
                          Inactive
                        </Tag>
                      )}
                    </div>
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: "1px solid #f0f0f0",
                        minHeight: 32,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: field.status ? "#595959" : "#bfbfbf",
                          fontSize: 13,
                          fontFamily: "monospace",
                        }}
                      >
                        {renderFieldValue(field)}
                      </Text>
                    </div>
                  </div>

                  <Space
                    direction="vertical"
                    align="end"
                    style={{
                      marginLeft: 8,
                      height: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Top actions */}
                    <Space size={4}>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditClick(field)}
                        size="small"
                        style={{ color: "#1890ff" }}
                        disabled={!field.status}
                      />

                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteField(field.id)}
                        size="small"
                        loading={deleteField.isPending && deleteField.variables === field.id}
                      />
                    </Space>

                    {/* Status toggle */}
                    <Space size={6}>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          color: field.status ? "#080807ff" : "#999",
                        }}
                      >
                        {field.status ? "Show" : "Hidden"}
                      </Text>

                      <Switch
                        size="small"
                        checked={field.status}
                        onChange={(checked) =>
                          updateFieldStatus(field.id, checked)
                        }
                        loading={toggleStatus.isPending && toggleStatus.variables === field.id}
                      />
                    </Space>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Add Field Modal */}
      <Modal
        title="Add New Field"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={handleAddField}
        okText="Add Field"
        cancelText="Cancel"
        width={500}
        okButtonProps={{
          style: { backgroundColor: "#1890ff", borderColor: "#1890ff" },
          loading: createField.isPending,
        }}
      >
        <Text type="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
          Create a new field to appear on payslips
        </Text>

        <Form layout="vertical" form={form} style={{ marginTop: 20 }}>
          <Form.Item
            label="Field Name"
            name="name"
            rules={[{ required: true, message: "Please enter field name" }]}
          >
            <Input
              placeholder="e.g. Department, Location, Employee ID"
              size="large"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            label="Field Type"
            name="type"
            initialValue="text"
            rules={[{ required: true, message: "Please select field type" }]}
          >
            <Select
              size="large"
              style={{ borderRadius: 6 }}
              options={[
                { value: "text", label: "Text" },
                { value: "number", label: "Number" },
                { value: "date", label: "Date" },
                { value: "dropdown", label: "Dropdown" },
              ]}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("type");

              if (type === "dropdown") {
                return (
                  <Form.Item
                    label="Dropdown Options"
                    name="options"
                    rules={[
                      {
                        required: true,
                        message: "Please enter dropdown options",
                      },
                    ]}
                    tooltip="Enter options separated by commas (e.g., Option1, Option2, Option3)"
                  >
                    <Input.TextArea
                      placeholder="Weekly, Bi-Weekly, Monthly"
                      rows={3}
                      style={{ borderRadius: 6 }}
                    />
                  </Form.Item>
                );
              }

              return (
                <Form.Item label="Default Value (Optional)" name="defaultValue">
                  {type === "date" ? (
                    <DatePicker
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Select default date"
                    />
                  ) : type === "number" ? (
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      placeholder="Enter default number"
                    />
                  ) : (
                    <Input
                      size="large"
                      placeholder="Enter default value"
                      style={{ borderRadius: 6 }}
                    />
                  )}
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Field Modal - Add key prop to force re-render */}
      <Modal
        key={`edit-modal-${editModalKey}`}
        title="Edit Field"
        open={!!editField}
        onCancel={handleEditModalClose}
        onOk={handleEditSubmit}
        okText="Save Changes"
        cancelText="Cancel"
        width={500}
        okButtonProps={{
          style: { backgroundColor: "#52c41a", borderColor: "#52c41a" },
          loading: updateField.isPending,
        }}
        destroyOnClose={true}
      >
        <Text type="secondary" style={{ fontSize: 14, marginBottom: 16 }}>
          Update the field configuration
        </Text>

        <Form 
          form={editForm} 
          layout="vertical" 
          style={{ marginTop: 20 }}
          preserve={false} // Don't preserve form state
        >
          <Form.Item
            label="Field Name"
            name="label"
            rules={[{ required: true, message: "Please enter field name" }]}
          >
            <Input size="large" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item label="Field Type">
            <Input
              value={editField?.type?.toUpperCase()}
              disabled
              size="large"
              style={{ borderRadius: 6, textTransform: 'uppercase' }}
            />
          </Form.Item>

          {editField?.type === "dropdown" && (
            <>
              <Form.Item
                label="Dropdown Options (comma-separated)"
                name="options"
                rules={[
                  { 
                    required: true, 
                    message: "Please enter dropdown options" 
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim() === '') {
                        return Promise.reject(new Error('Please enter at least one option'));
                      }
                      const options = value.split(',').map((opt: string) => opt.trim()).filter((opt: string) => opt.length > 0);
                      if (options.length === 0) {
                        return Promise.reject(new Error('Please enter valid options separated by commas'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                tooltip="Enter options separated by commas (e.g., Option1, Option2, Option3)"
              >
                <Input.TextArea
                  placeholder="Enter options separated by commas"
                  rows={3}
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
              
              {/* <Form.Item
                label="Selected Value"
                name="value"
                rules={[{ required: false }]}
              >
                <Select
                  size="large"
                  style={{ borderRadius: 6 }}
                  placeholder="Select a value"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={editField.options?.map((option) => ({
                    label: option,
                    value: option,
                  }))}
                />
              </Form.Item> */}

              <Form.Item
  label="Selected Value"
  name="value"
>
  <Select
    size="large"
    style={{ borderRadius: 6 }}
    placeholder="Select a value"
    allowClear
    showSearch
    filterOption={(input, option) =>
  String(option?.label ?? "")
    .toLowerCase()
    .includes(input.toLowerCase())
}

    options={
      watchedOptions
        ? watchedOptions
            .split(",")
            .map((opt: string) => opt.trim())
            .filter((opt: string) => opt.length > 0)
            .map((opt: string) => ({
              label: opt,
              value: opt,
            }))
        : []
    }
  />
</Form.Item>
            </>
          )}

          {editField?.type === "date" && (
            <Form.Item
              label="Date Value"
              name="value"
              rules={[{ required: false }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                size="large"
                format="YYYY-MM-DD"
                placeholder="Select date"
              />
            </Form.Item>
          )}

          {editField?.type === "number" && (
            <Form.Item
              label="Number Value"
              name="value"
              rules={[{ required: false }]}
            >
              <InputNumber 
                style={{ width: "100%" }} 
                size="large"
                placeholder="Enter number"
              />
            </Form.Item>
          )}

          {(editField?.type === "text" || !editField?.type) && (
            <Form.Item
              label="Text Value"
              name="value"
              rules={[{ required: false }]}
            >
              <Input 
                size="large" 
                placeholder="Enter text"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}