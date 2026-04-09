"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
//import { useRouter } from "next/navigation";
import {
  Table,
  Modal,
  Divider,
  Tag,
  Space,
  Input,
  Popconfirm,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  message,
  Spin,


  Drawer,
  Checkbox,
  Card,
  Image,
  Typography,
  Upload,
  Switch,
  TimePicker,
  Avatar,
  Tooltip,
} from "antd";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  User,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Zap,
  Info,
  Clock,
  ShieldCheck,
  CheckCircle,
  Building2,
  CreditCard,
  FileText,
  Banknote,
  Laptop,
  Lock,
  UserCheck,
  Trophy,
  Layers,
  IdCard,


  Award,
  Box,
  FileBadge,
} from "lucide-react";
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  MailOutlined,
  IdcardOutlined,
  HomeOutlined,
  LaptopOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  BankOutlined,
  ProjectOutlined,
  TrophyOutlined,
  PlusOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import { MembersService } from "@/services/membersService";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import { ProjectService } from "@/services/projectService";
import EmployeeHistoryEditForm from "./Employeehistoryeditform";
import EmployeeHistoryView from "./EmployeeHistoryViews";
import { useRouter } from "next/navigation";
import { PositionService } from "@/services/positionService";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const { Text, Title, Paragraph } = Typography;

const { Option } = Select;

/* ---------------- HELPERS ---------------- */
const labelize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

// Enhanced RowItem component for better view display
const RowItem = ({ label, value, icon, color = "var(--premium-blue)" }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
      padding: "8px 12px",
      background: "var(--bg-pure-white)",
      borderRadius: "10px",
      border: "1px solid var(--border-slate-100)",
      transition: "all 0.2s ease",
    }}
  >
    {icon && (
      <div
        style={{
          marginRight: "12px",
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          background: `${color}10`,
          borderRadius: "8px",
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-slate-500)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-slate-900)",
          fontWeight: 500,
        }}
      >
        {value !== null && value !== undefined && value !== "" ? (
          typeof value === "object" ? (
            JSON.stringify(value)
          ) : (
            value
          )
        ) : (
          <span style={{ color: "var(--premium-blue)" }}>--</span>
        )}
      </div>
    </div>
  </div>
);

// Shared label and input styles for compact forms
const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "4px",
  display: "inline-block"
};
const inputStyle = { borderRadius: "8px", border: "1px solid var(--border-color)" };

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card
    bodyStyle={{ padding: "16px 20px" }}
    style={{
      borderRadius: 12,
      border: "1px solid var(--border-slate-100)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      background: "var(--bg-pure-white)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
/* ---------------- EDIT FORM COMPONENTS ---------------- */

// Personal Details Edit Form
const PersonalDetailsEditForm = ({ form, initialData }: any) => {
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Clear form first to prevent stale data
      form.resetFields();

      // Extract address data with better null handling
      const addressData = initialData.address || {};
      const currentAddr = addressData.current || addressData;
      const permanentAddr = addressData.permanent || addressData;

      // Set form values with proper defaults
      form.setFieldsValue({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        gender: initialData.gender || "",
        dob: initialData.dob ? dayjs(initialData.dob) : null,
        bloodGroup: initialData.bloodGroup || "",
        mobile: initialData.mobile || initialData.phone || "",
        personalEmail: initialData.personalEmail || initialData.email || "",
        workEmail: initialData.workEmail || "",
        pan: initialData.pan || "",
        aadhaar: initialData.aadhaar || "",
        // Current Address
        c_flat: currentAddr.c_flat || "",
        c_area: currentAddr.c_area || "",
        c_city: currentAddr.c_city || "",
        c_state: currentAddr.c_state || "",
        c_pincode: currentAddr.c_pincode || "",
        c_country: currentAddr.c_country || "",
        // Permanent Address
        p_flat: permanentAddr.p_flat || "",
        p_area: permanentAddr.p_area || "",
        p_city: permanentAddr.p_city || "",
        p_state: permanentAddr.p_state || "",
        p_pincode: permanentAddr.p_pincode || "",
        p_country: permanentAddr.p_country || "",
      });
    }
  }, [initialData, form]);

  const onSameAddressChange = (e: any) => {
    setSameAsCurrent(e.target.checked);
    if (e.target.checked) {
      const currentValues = form.getFieldsValue([
        "c_flat",
        "c_area",
        "c_city",
        "c_state",
        "c_pincode",
        "c_country",
      ]);
      form.setFieldsValue({
        p_flat: currentValues.c_flat,
        p_area: currentValues.c_area,
        p_city: currentValues.c_city,
        p_state: currentValues.c_state,
        p_pincode: currentValues.c_pincode,
        p_country: currentValues.c_country,
      });
    }
  };

  return (
    <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
      {/* Basic Information */}
      <div
        style={{
          background: "var(--bg-pure-white)",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: "10px" }}
        >
          <div style={{ background: "var(--bg-blue-50)", padding: "8px", borderRadius: "8px", color: "var(--premium-blue)" }}>
            <User size={18} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)" }}>
            Basic Information
          </span>
        </div>

        <Row gutter={[12, 8]}>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>First Name</span>}
              name="firstName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="First Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Last Name</span>}
              name="lastName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Last Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Gender</span>}
              name="gender"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select" style={inputStyle}>
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Date of Birth</span>}
              name="dob"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker style={{ width: "100%", ...inputStyle }} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Blood Group</span>}
              name="bloodGroup"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select" style={inputStyle}>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Mobile Number</span>}
              name="mobile"
              rules={[
                { required: true, message: "Required" },
                { pattern: /^[0-9]{10}$/, message: "Invalid mobile" },
              ]}
            >
              <Input placeholder="Mobile" maxLength={10} style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Personal Email</span>}
              name="personalEmail"
              rules={[
                { required: true, message: "Required" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input placeholder="Personal Email" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Work Email</span>}
              name="workEmail"
              rules={[
                { required: true, message: "Required" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input placeholder="Work Email" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>PAN Number</span>}
              name="pan"
            >
              <Input placeholder="PAN Number" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Aadhaar Number</span>}
              name="aadhaar"
            >
              <Input placeholder="Aadhaar Number" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Address Information */}
      <div
        style={{
          background: "var(--bg-pure-white)",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: "10px" }}
        >
          <div style={{ background: "var(--bg-blue-50)", padding: "8px", borderRadius: "8px", color: "var(--premium-blue)" }}>
            <MapPin size={18} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)" }}>
            Address Information
          </span>
        </div>

        {/* Current Address */}
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          Current Address
        </div>
        <Row gutter={[12, 8]}>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Flat / Door No</span>}
              name="c_flat"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Flat No" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Area</span>}
              name="c_area"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Area" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>City</span>}
              name="c_city"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="City" style={inputStyle} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>State</span>}
              name="c_state"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="State" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Pincode</span>}
              name="c_pincode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Pincode" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Country</span>}
              name="c_country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Country" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        <Checkbox
          checked={sameAsCurrent}
          onChange={onSameAddressChange}
          style={{ fontSize: 11, marginBottom: 12, marginTop: 8 }}
        >
          Same as current address
        </Checkbox>

        {/* Permanent Address */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            marginTop: 16,
          }}
        >
          Permanent Address
        </div>
        <Row gutter={[12, 8]}>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Flat / Door No</span>}
              name="p_flat"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Flat No" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Area</span>}
              name="p_area"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Area" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>City</span>}
              name="p_city"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="City" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>State</span>}
              name="p_state"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="State" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Pincode</span>}
              name="p_pincode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Pincode" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Country</span>}
              name="p_country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Country" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  );
};

// Employment Edit Form
const EmploymentEditForm = ({ form, initialData, projects }: any) => {
  const workType = Form.useWatch("workType", form);
  const hybridMode = Form.useWatch("hybridMode", form);
  const fixedDays = Form.useWatch("fixedDays", form) || [];
  const generalDays = Form.useWatch("totalDays", form);
  const generalHours = Form.useWatch("totalHours", form);

  const [isHybridModalOpen, setIsHybridModalOpen] = useState(false);
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const { Title, Text } = Typography;

  const [openWorkShiftModal, setOpenWorkShiftModal] = useState(false);
  const [shiftData, setShiftData] = useState<any>({});
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [commonStart, setCommonStart] = useState<any>(null);
  const [commonEnd, setCommonEnd] = useState<any>(null);
  const [workShiftDisplay, setWorkShiftDisplay] = useState("");
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<any>([]);

  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    if (initialData) {
      // Clear form first
      form.resetFields();

      // Normalize workType to match Select options
      let wType = initialData.workType;
      if (wType === "Work From Home") wType = "wfh";
      if (wType === "Work From Office") wType = "wfo";
      if (wType === "Hybrid") wType = "hybrid";

      form.setFieldsValue({
        department: initialData.department || "",
        team: initialData.team || "",
        employeeType: initialData.employeeType || "",
        workLocation: initialData.workLocation || "",
        workShift: initialData.workShift || "", // This holds the JSON string
        joiningDate: initialData.joiningDate
          ? dayjs(initialData.joiningDate)
          : null,
        trainingCompletion: initialData.trainingCompletion
          ? dayjs(initialData.trainingCompletion)
          : null,
        projects: initialData.projects || [],
        reportingManager: initialData.reportingManager || "",
        promotionStatus: initialData.promotionStatus || "",
        employeeGrade: initialData.employeeGrade || "",
        workType: wType || undefined,
        employeeJoiningDate: initialData.employeeJoiningDate
          ? dayjs(initialData.employeeJoiningDate)
          : null, // Hybrid fields
        hybridMode: initialData.hybridMode || "General",
        fixedDays: initialData.fixedDays || [],
        totalDays: initialData.totalDays || null,
        totalHours: initialData.totalHours || null,
        noticePeriod: initialData.noticePeriod || "",
      });
      setTempSelectedDays(initialData.fixedDays || []);

      // Parse workShift for display and modal state
      if (initialData.workShift) {
        try {
          const parsed =
            typeof initialData.workShift === "string"
              ? JSON.parse(initialData.workShift)
              : initialData.workShift;

          if (parsed.type === "all") {
            setWorkShiftDisplay("All Days");
            setSelectAll(true);
            setCommonStart(parsed.start ? dayjs(parsed.start, "HH:mm") : null);
            setCommonEnd(parsed.end ? dayjs(parsed.end, "HH:mm") : null);
            setSelectedDays(weekDays);
            const newShiftData: any = {};
            weekDays.forEach((day) => {
              newShiftData[day] = { start: parsed.start, end: parsed.end };
            });
            setShiftData(newShiftData);
          } else if (parsed.type === "custom") {
            const days = Object.keys(parsed.data || {});
            setWorkShiftDisplay(days.join(", "));
            setSelectAll(false);
            setCommonStart(null);
            setCommonEnd(null);
            setSelectedDays(days);
            setShiftData(parsed.data || {});
          } else {
            setWorkShiftDisplay(initialData.workShift);
          }
        } catch (e) {
          setWorkShiftDisplay(initialData.workShift);
        }
      }
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
        setTotalMembers(data?.length || 0);
      } catch (error) {
        message.error("Failed to load members");
      }
    };

    fetchMembersForSelect();
  }, []);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        const data = await PositionService.getAll();
        const mapData = data.map((pos) => ({
          id: pos.id,
          name: pos.title,
        }));
        setPositions(mapData); // 🔥 store in state
      } catch (error) {
        console.error("Failed to fetch positions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDays(weekDays);
      if (commonStart && commonEnd) {
        applyCommonTime(commonStart, commonEnd);
      }
    } else {
      setSelectedDays([]);
      setShiftData({});
      setCommonStart(null);
      setCommonEnd(null);
    }
  };

  const applyCommonTime = (start: any, end: any) => {
    if (!start || !end) return;
    const newData: any = {};
    weekDays.forEach((day) => {
      newData[day] = {
        start: start.format("HH:mm"),
        end: end.format("HH:mm"),
      };
    });
    setShiftData(newData);
  };

  const handleSaveWorkShift = () => {
    let payload: any;

    if (selectAll && commonStart && commonEnd) {
      const allDaysData: any = {};
      weekDays.forEach((day) => {
        allDaysData[day] = {
          start: commonStart.format("HH:mm"),
          end: commonEnd.format("HH:mm"),
        };
      });

      payload = {
        type: "all",
        start: commonStart.format("HH:mm"),
        end: commonEnd.format("HH:mm"),
        days: weekDays,
        data: allDaysData,
      };
      setWorkShiftDisplay("All Days");
    } else {
      const perDayData: any = {};
      if (selectedDays.length === 0) {
        message.error("Please select at least one day.");
        return;
      }

      for (const day of selectedDays) {
        const dayShift = shiftData[day];
        if (dayShift && dayShift.start && dayShift.end) {
          perDayData[day] = {
            start:
              typeof dayShift.start === "string"
                ? dayShift.start
                : dayjs(dayShift.start).format("HH:mm"),
            end:
              typeof dayShift.end === "string"
                ? dayShift.end
                : dayjs(dayShift.end).format("HH:mm"),
          };
        } else {
          message.error(`Please set start and end time for ${day}.`);
          return;
        }
      }
      payload = {
        type: "custom",
        data: perDayData,
      };
      setWorkShiftDisplay(Object.keys(perDayData).join(", "));
    }

    const jsonString = JSON.stringify(payload);
    form.setFieldsValue({ workShift: jsonString });
    setOpenWorkShiftModal(false);
  };

  const columns = [
    {
      title: "",
      render: (_: any, record: any) => (
        <Checkbox
          checked={selectedDays.includes(record.day)}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              setSelectedDays([...selectedDays, record.day]);
              setShiftData((prev: any) => ({
                ...prev,
                [record.day]: prev[record.day] || { start: null, end: null },
              }));
            } else {
              setSelectedDays(selectedDays.filter((d) => d !== record.day));
              setShiftData((prev: any) => {
                const copy = { ...prev };
                delete copy[record.day];
                return copy;
              });
            }
          }}
        />
      ),
    },
    {
      title: "Week Day",
      dataIndex: "day",
    },
    {
      title: "Start Time",
      render: (_: any, record: any) => (
        <TimePicker
          format="HH:mm"
          value={
            shiftData[record.day]?.start
              ? dayjs(shiftData[record.day].start, "HH:mm")
              : null
          }
          disabled={!selectedDays.includes(record.day)}
          onChange={(time) => {
            setShiftData((prev: any) => ({
              ...prev,
              [record.day]: {
                ...prev[record.day],
                start: time ? time.format("HH:mm") : null,
              },
            }));
          }}
        />
      ),
    },
    {
      title: "End Time",
      render: (_: any, record: any) => (
        <TimePicker
          format="HH:mm"
          value={
            shiftData[record.day]?.end
              ? dayjs(shiftData[record.day].end, "HH:mm")
              : null
          }
          disabled={!selectedDays.includes(record.day)}
          onChange={(time) => {
            setShiftData((prev: any) => ({
              ...prev,
              [record.day]: {
                ...prev[record.day],
                end: time ? time.format("HH:mm") : null,
              },
            }));
          }}
        />
      ),
    },
  ];
  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: "10px" }}>
        <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px", color: "#3b82f6" }}>
          <Briefcase size={18} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          Employment Information
        </span>
      </div>

      <Row gutter={[12, 8]}>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Department</span>}
            name="department"
            rules={[{ message: "Required" }]}
          >
            <Select
              placeholder="Select Position"
              loading={loading}
              style={{ width: "100%", height: 30 }}
              options={positions.map((pos) => ({
                label: pos.name, // 🔥 this will show in dropdown
                value: pos.id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Team</span>}
            name="team"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Team" style={inputStyle}>
              <Option value="frontend">Frontend</Option>
              <Option value="backend">Backend</Option>
              <Option value="design">Design</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Employee Type</span>}
            name="employeeType"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Type" style={inputStyle}>
              <Option value="fulltime">Full Time</Option>
              <Option value="parttime">Part Time</Option>
              <Option value="intern">Intern</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Location</span>}
            name="workLocation"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Enter Location" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="workShift"
            rules={[{ required: true, message: "Required" }]}
            hidden
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={<span style={labelStyle}>Work Shift</span>}
            required
            help={form.getFieldError("workShift")?.[0]}
            validateStatus={
              form.getFieldError("workShift")?.length ? "error" : ""
            }
          >
            <Input
              placeholder="Select Work Shift"
              readOnly
              value={workShiftDisplay}
              onClick={() => setOpenWorkShiftModal(true)}
              style={{ ...inputStyle, cursor: "pointer" }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Type</span>}
            name="workType"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              placeholder="Select Work Type"
              style={inputStyle}
              onChange={(value) => {
                if (value !== "hybrid") {
                  form.setFieldsValue({
                    hybridMode: null,
                    fixedDays: [],
                    totalDays: null,
                    totalHours: null,
                  });
                } else {
                  form.setFieldsValue({ hybridMode: "General" });
                }
              }}
            >
              <Option value="wfh">Work From Home</Option>
              <Option value="wfo">Work From Office</Option>
              <Option value="hybrid">Hybrid</Option>
            </Select>
          </Form.Item>
        </Col>

        {workType === "hybrid" && (
          <Col span={24}>
            <Form.Item name="fixedDays" hidden>
              <Select mode="multiple" />
            </Form.Item>
            <Divider style={{ margin: "0 0 8px" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 500 }}>Hybrid Mode:</div>
              <Form.Item name="hybridMode" noStyle>
                <Switch
                  checkedChildren="Fixed"
                  unCheckedChildren="General"
                  checked={hybridMode === "Fixed"}
                  onChange={(checked) => {
                    const mode = checked ? "Fixed" : "General";
                    form.setFieldsValue({ hybridMode: mode });
                    if (mode === "Fixed") {
                      setTempSelectedDays(
                        form.getFieldValue("fixedDays") || [],
                      );
                      setIsHybridModalOpen(true);
                      form.setFieldsValue({
                        totalDays: null,
                        totalHours: null,
                      });
                    } else {
                      form.setFieldsValue({
                        fixedDays: [],
                        totalDays: null,
                        totalHours: null,
                      });
                    }
                  }}
                />
              </Form.Item>

              {hybridMode === "Fixed" && fixedDays.length > 0 && (
                <div style={{ fontSize: 11, display: "flex", gap: 16 }}>
                  <span>Days: {fixedDays.join(", ").toUpperCase()}</span>
                  <span>
                    Total: {fixedDays.length} days / {fixedDays.length * 8} hrs
                  </span>
                </div>
              )}

              {hybridMode === "General" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Form.Item name="totalDays" noStyle>
                    <Input
                      type="number"
                      placeholder="Days"
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        form.setFieldsValue({
                          totalDays: days,
                          totalHours: days * 8,
                        });
                      }}
                      style={{ fontSize: 11, height: 28, width: 80 }}
                    />
                  </Form.Item>
                  <Form.Item name="totalHours" noStyle>
                    <Input
                      type="number"
                      placeholder="Hrs"
                      addonAfter="hrs"
                      onChange={(e) => {
                        form.setFieldsValue({
                          totalHours: Number(e.target.value),
                        });
                      }}
                      style={{ fontSize: 11, height: 28, width: 100 }}
                    />
                  </Form.Item>
                </div>
              )}
            </div>
            <Divider style={{ margin: "8px 0 0" }} />
          </Col>
        )}

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Joining Date</span>}
            name="employeeJoiningDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Joining Date</span>}
            name="joiningDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Training Completion</span>}
            name="trainingCompletion"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Projects</span>}
            name="projects"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Select Projects"
              style={inputStyle}
              maxTagCount="responsive"
            >
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Reporting Manager</span>}
            name="reportingManager"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              showSearch
              placeholder="Select Manager"
              style={inputStyle}
              optionFilterProp="children"
            >
              {members?.map((member) => (
                <Select.Option key={member.id} value={member.label}>
                  {member.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Promotion Status</span>}
            name="promotionStatus"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Status" style={inputStyle}>
              <Option value="eligible">Eligible</Option>
              <Option value="not-eligible">Not Eligible</Option>
              <Option value="promoted">Promoted</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Employee Grade</span>}
            name="employeeGrade"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Grade" style={inputStyle}>
              <Option value="A">Grade A</Option>
              <Option value="B">Grade B</Option>
              <Option value="C">Grade C</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Notice Period</span>}
            name="noticePeriod"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Notice Period" style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "#1677ff" }} />
            <span>Configure Hybrid Working Days</span>
          </div>
        }
        open={isHybridModalOpen}
        onCancel={() => setIsHybridModalOpen(false)}
        onOk={() => {
          form.setFieldsValue({ fixedDays: tempSelectedDays });
          setIsHybridModalOpen(false);
        }}
        okText="Save"
        centered
      >
        <Card
          bordered={false}
          style={{
            background: "#fafafa",
            borderRadius: 10,
          }}
        >
          <Title level={5} style={{ marginBottom: 15 }}>
            Select Working Days
          </Title>

          <Checkbox.Group
            style={{ width: "100%" }}
            value={tempSelectedDays}
            onChange={(checkedValues: any) => {
              setTempSelectedDays(checkedValues);
            }}
          >
            <Row gutter={[12, 12]}>
              {[
                { label: "Mon", value: "Mon" },
                { label: "Tue", value: "Tue" },
                { label: "Wed", value: "Wed" },
                { label: "Thu", value: "Thu" },
                { label: "Fri", value: "Fri" },
                { label: "Sat", value: "Sat" },
                { label: "Sun", value: "Sun" },
              ].map((day) => (
                <Col span={8} key={day.value}>
                  <Checkbox value={day.value}>{day.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>

          <Divider />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <Text strong>Total Days: {tempSelectedDays.length}</Text>
            <Text strong>Total Hours: {tempSelectedDays.length * 8} hrs</Text>
          </div>
        </Card>
      </Modal>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FieldTimeOutlined style={{ color: "black" }} />
            <span>Set Work Shift</span>
          </div>
        }
        open={openWorkShiftModal}
        onCancel={() => setOpenWorkShiftModal(false)}
        footer={[
          <Button key="close" onClick={() => setOpenWorkShiftModal(false)}>
            Close
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveWorkShift}>
            Save
          </Button>,
        ]}
        width={800}
      >
        {/* ✅ Select All + Common Time */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Checkbox
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              Select All
            </Checkbox>
          </Col>

          {selectAll && (
            <>
              <Col>
                <TimePicker
                  format="HH:mm"
                  placeholder="Common Start"
                  value={commonStart}
                  onChange={(time) => {
                    setCommonStart(time);
                    applyCommonTime(time, commonEnd);
                  }}
                />
              </Col>
              <Col>
                <TimePicker
                  format="HH:mm"
                  placeholder="Common End"
                  value={commonEnd}
                  onChange={(time) => {
                    setCommonEnd(time);
                    applyCommonTime(commonStart, time);
                  }}
                />
              </Col>
            </>
          )}
        </Row>

        <Table
          columns={columns}
          dataSource={weekDays.map((day) => ({
            key: day,
            day,
          }))}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

// Bank & Payroll Edit Form
const BankPayrollEditForm = ({ form, initialData }: any) => {
  useEffect(() => {
    if (initialData) {
      // Clear form first
      form.resetFields();

      form.setFieldsValue({
        bankName: initialData.bankName || "",
        accountNumber: initialData.accountNumber || "",
        ifscCode: initialData.ifscCode || "",
        salary: initialData.salary || "",
        pfNumber: initialData.pfNumber || "",
        esiNumber: initialData.esiNumber || "",
        uanNumber: initialData.uanNumber || "",
        branchName: initialData.branchName || initialData.bankBranch || "",
        accountHolderName: initialData.accountHolderName || "",
      });
    }
  }, [initialData, form]);

  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: "10px" }}>
        <div style={{ background: "White", padding: "8px", borderRadius: "8px", color: "#3b82f6" }}>
          <Banknote size={18} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          Bank & Payroll Information
        </span>
      </div>
      <Row gutter={[12, 8]}>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Bank Name</span>}
            name="bankName"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Bank Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Account Holder Name</span>}
            name="accountHolderName"
          >
            <Input placeholder="Account Holder Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Account Number</span>}
            name="accountNumber"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Account Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>IFSC Code</span>}
            name="ifscCode"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="IFSC Code" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Bank Branch</span>}
            name="branchName"
          >
            <Input placeholder="Branch Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>PF Number</span>}
            name="pfNumber"
          >
            <Input placeholder="PF Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>UAN Number</span>}
            name="uanNumber"
          >
            <Input placeholder="UAN Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>ESI Number</span>}
            name="esiNumber"
          >
            <Input placeholder="ESI Number" style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};


// Assets Edit Form
const AssetsEditForm = ({ form, initialData }: any) => {
  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      // Clear form first
      form.resetFields();

      form.setFieldsValue({
        assets: initialData.map((item: any) => ({
          item: item.item || "",
          brand: item.brand || "",
          model: item.model || "",
          modelNumber: item.modelNumber || "",
          image: item.image
            ? Array.isArray(item.image)
              ? item.image
              : [
                {
                  uid: "-1",
                  name: "image.png",
                  status: "done",
                  url: item.image,
                },
              ]
            : [],
        })),
      });
    } else {
      form.setFieldsValue({ assets: [{}] });
    }
  }, [initialData, form]);

  const handleBeforeUpload = (file: any) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
    }
    return isImage && isLt5M ? false : Upload.LIST_IGNORE;
  };

  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid var(--border-color)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: "10px" }}>
        <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px", color: "#3b82f6" }}>
          <Laptop size={18} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          Assigned Assets
        </span>
      </div>
      <Form.List name="assets" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <div
                key={key}
                style={{
                  marginBottom: 16,
                  padding: "12px",
                  background: "#fafafa",
                  borderRadius: "8px",
                  position: "relative",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#3b82f6",
                  }}
                >
                  Asset {index + 1}
                </div>
                {fields.length > 1 && (
                  <Button
                    type="link"
                    danger
                    onClick={() => remove(name)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: 0,
                    }}
                  >
                    Remove
                  </Button>
                )}
                <Row gutter={[12, 8]}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Item Name</span>}
                      name={[name, "item"]}
                      rules={[
                        { required: true, message: "Please select an item" },
                      ]}
                    >
                      <Select placeholder="Select item" style={inputStyle}>
                        <Option value="Mobile">Mobile</Option>
                        <Option value="Laptop">Laptop</Option>
                        <Option value="Tab">Tab</Option>
                        <Option value="Monitor">Monitor</Option>
                        <Option value="Keyboard">Keyboard</Option>
                        <Option value="Mouse">Mouse</Option>
                        <Option value="Bag">Bag</Option>
                        <Option value="Headphone">Head phone</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Brand Name</span>}
                      name={[name, "brand"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Brand Name" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Model Name</span>}
                      name={[name, "model"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Model Name" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Model Number</span>}
                      name={[name, "modelNumber"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Model Number" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Upload Image</span>}
                      name={[name, "image"]}
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e?.fileList || [];
                      }}
                    >
                      <Upload
                        listType="picture-card"
                        beforeUpload={handleBeforeUpload}
                        maxCount={1}
                      >
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              style={{ marginTop: 8 }}
            >
              + Add Asset
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

/* ---------------- VIEW COMPONENTS ---------------- */

const PersonalDetailsView = ({ data }: any) => {
  if (!data) return <div>No data available</div>;

  const formatAddress = (addr: any, type: "current" | "permanent") => {
    if (!addr) return null;

    const prefix = type === "current" ? "c_" : "p_";
    const parts = [
      addr[`${prefix}flat`],
      addr[`${prefix}area`],
      addr[`${prefix}city`],
      addr[`${prefix}state`],
      addr[`${prefix}pincode`],
      addr[`${prefix}country`],
    ];

    const filtered = parts.filter((p) => p && p.toString().trim() !== "");
    return filtered.length > 0 ? filtered.join(", ") : null;
  };

  const currentAddress = formatAddress(
    data.address?.current || data.address,
    "current",
  );
  const permanentAddress = formatAddress(
    data.address?.permanent || data.address,
    "permanent",
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 👤 Bio Information */}
      <div style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
        padding: 24,
        borderRadius: 20,
        border: "1px solid var(--border-color)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: "#3b82f608",
          borderRadius: "50%"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#3b82f6", padding: 8, borderRadius: 10, color: "#fff" }}>
            <User size={20} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Basic Information</span>
        </div>

        <Row gutter={[16, 0]}>
          <Col span={12}>
            <RowItem
              label="First Name"
              value={data.firstName}
              icon={<User />}
            />
          </Col>
          <Col span={12}>
            <RowItem label="Last Name" value={data.lastName} icon={<User />} />
          </Col>
          <Col span={12}>
            <RowItem label="Gender" value={data.gender} icon={<User />} />
          </Col>
          <Col span={12}>
            <RowItem
              label="Date of Birth"
              value={data.dob ? dayjs(data.dob).format("DD MMM YYYY") : null}
              icon={<Calendar />}
            />
          </Col>
          <Col span={12}>
            <RowItem label="Blood Group" value={data.bloodGroup} icon={<ShieldCheck />} color="#ef4444" />
          </Col>
          <Col span={12}>
            <RowItem
              label="Mobile"
              value={data.mobile || data.phone}
              icon={<Phone />}
              color="#10b981"
            />
          </Col>
        </Row>
      </div>

      {/* 📧 Contact & Identity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Mail size={18} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Communication</span>
          </div>
          <RowItem label="Work Email" value={data.workEmail} icon={<Mail />} />
          <RowItem label="Personal Email" value={data.personalEmail || data.email} icon={<Mail />} />
        </div>

        <div style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Lock size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Identity Info</span>
          </div>
          <RowItem label="PAN Number" value={data.pan} icon={<IdCard size={16} />} color="#f59e0b" />
          <RowItem label="Aadhaar" value={data.aadhaar} icon={<IdCard size={16} />} color="#f59e0b" />
        </div>
      </div>

      {/* 🏠 Address Section */}
      <div style={{ padding: 24, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#8b5cf6", padding: 8, borderRadius: 10, color: "#fff" }}>
            <MapPin size={20} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Address Information</span>
        </div>

        <Row gutter={[20, 20]}>
          <Col span={12}>
            <div style={{ padding: 16, background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-color)", height: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 12, textTransform: "uppercase" }}>Current Address</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500 }}>
                {currentAddress || <span style={{ color: "#ef4444" }}>Not Verified</span>}
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: 16, background: "var(--bg-pure-white)", borderRadius: 16, border: "1px solid var(--border-color)", height: "100%" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", marginBottom: 12, textTransform: "uppercase" }}>Permanent Address</div>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 500 }}>
                {permanentAddress || <span style={{ color: "#ef4444" }}>Not Verified</span>}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const EmploymentView = ({ data, projects: allProjects }: any) => {
  if (!data) return <div>No data available</div>;

  const renderWorkShiftDetails = () => {
    if (!data.workShift) {
      return (
        <>
          <Col span={12}>
            <RowItem label="Work Shift" value={null} />
          </Col>
          <Col span={12}>
            <RowItem label="Notice Period" value={data.noticePeriod} />
          </Col>
        </>
      );
    }

    try {
      const workShiftData =
        typeof data.workShift === "string"
          ? JSON.parse(data.workShift)
          : data.workShift;

      if (workShiftData.type === "custom") {
        const workDays = Object.entries(workShiftData.data)
          .map(
            ([day, times]: [string, any]) =>
              `${day.charAt(0).toUpperCase() + day.slice(1)}: ${times.start} - ${times.end
              }`,
          )
          .join(", ");

        return (
          <>
            <Col span={12}>
              <RowItem label="Work Shift Type" value="Custom" />
            </Col>
            <Col span={12}>
              <RowItem label="Notice Period" value={data.noticePeriod} />
            </Col>

            <Col span={24}>
              <RowItem label="Work Days" value={workDays} />
            </Col>
          </>
        );
      }

      if (workShiftData.type === "all") {
        const workTime = `${workShiftData.start} - ${workShiftData.end}`;
        return (
          <>
            <Col span={12}>
              <RowItem label="Work Shift Type" value="All Days" />
            </Col>
            <Col span={12}>
              <RowItem label="Notice Period" value={data.noticePeriod} />
            </Col>
            <Col span={12}>
              <RowItem label="Work Time" value={workTime} />
            </Col>
          </>
        );
      }
    } catch (e) { }

    // Fallback for unknown format or parsing error
    return (
      <>
        <Col span={12}>
          <RowItem label="Work Shift" value={data.workShift} />
        </Col>
        <Col span={12}>
          <RowItem label="Notice Period" value={data.noticePeriod} />
        </Col>
      </>
    );
  };

  const projectNames =
    data.projects && allProjects?.length > 0
      ? data.projects
        .map((projectId: string) => {
          const project = allProjects.find((p: any) => p.id === projectId);
          return project ? project.name : projectId; // Fallback to ID if not found
        })
        .join(", ")
      : data.projects?.length > 0
        ? data.projects.join(", ")
        : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 🏢 Primary Role & Department */}
      <div style={{
        background: "var(--bg-pure-white)",
        padding: 24,
        borderRadius: 24,
        border: "1px solid #bfdbfe",
        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ background: "#3b82f6", padding: 10, borderRadius: 14, color: "#fff", boxShadow: "0 4px 8px rgba(59, 130, 246, 0.2)" }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>Role & Assignment</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Current position and organizational unit</div>
          </div>
        </div>

        <Row gutter={[16, 0]}>
          <Col span={12}>
            <RowItem
              label="Department"
              value={data.department?.titleName || data.department}
              icon={<Building2 />}
            />
          </Col>
          <Col span={12}>
            <RowItem label="Team" value={data.team} icon={<Users />} color="#8b5cf6" />
          </Col>
          <Col span={12}>
            <RowItem label="Position Status" value={data.promotionStatus} icon={<Trophy />} color="#f59e0b" />
          </Col>
          <Col span={12}>
            <RowItem label="Reporting To" value={data.reportingManager} icon={<UserCheck />} color="#10b981" />
          </Col>
        </Row>
      </div>

      {/* 📅 Tenure & Timing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        <div style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Calendar size={18} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Tenure Details</span>
          </div>
          <RowItem label="Joining Date" value={data.joiningDate ? dayjs(data.joiningDate).format("DD MMM YYYY") : null} icon={<Calendar />} />
          <RowItem label="Completion" value={data.trainingCompletion ? dayjs(data.trainingCompletion).format("DD MMM YYYY") : null} icon={<CheckCircle />} color="#10b981" />
        </div>

        <div style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Clock size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Working Schedule</span>
          </div>
          <Row gutter={[12, 0]}>
            <Col span={12}><RowItem label="Work Type" value={data.workType} icon={<Laptop />} color="#f59e0b" /></Col>
            <Col span={12}><RowItem label="Location" value={data.workLocation} icon={<MapPin />} color="#f59e0b" /></Col>
          </Row>
          {renderWorkShiftDetails()}
        </div>
      </div>

      {/* 📊 Additional Assignments */}
      <div style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Layers size={18} style={{ color: "#6366f1" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Projects & Grade</span>
        </div>
        <Row gutter={[16, 0]}>
          <Col span={14}>
            <RowItem label="Active Projects" value={projectNames} icon={<Box />} color="#6366f1" />
          </Col>
          <Col span={10}>
            <RowItem label="Employee Grade" value={data.employeeGrade} icon={<Award />} color="#6366f1" />
          </Col>
        </Row>
      </div>
    </div>
  );
};

const BankPayrollView = ({ data }: any) => {
  if (!data) return <div>No data available</div>;

  return (
    <div style={{ padding: 24, background: "White", borderRadius: 24, border: "1px solid #f5f5f5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#ffffff", padding: 10, borderRadius: 14, color: "#bfe3c7ff", boxShadow: "0 4px 8px rgba(16, 185, 129, 0.2)" }}>
          <Banknote size={22} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>Bank & Payroll</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Secure financial and settlement details</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RowItem label="Bank Name" value={data.bankName} icon={<Building2 />} color="#10b981" />
          <RowItem label="Account Holder" value={data.accountHolderName} icon={<User />} color="#10b981" />
          <RowItem label="Account Number" value={data.accountNumber} icon={<CreditCard />} color="#10b981" />
          <RowItem label="IFSC Code" value={data.ifscCode} icon={<Zap />} color="#10b981" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RowItem label="Bank Branch" value={data.branchName || data.bankBranch} icon={<MapPin />} color="#10b981" />
          <RowItem label="PF Number" value={data.pfNumber} icon={<FileText />} color="#10b981" />
          <RowItem label="UAN Number" value={data.uanNumber} icon={<IdCard />} color="#10b981" />
          <RowItem label="ESI Number" value={data.esiNumber} icon={<ShieldCheck />} color="#10b981" />
        </div>
      </div>
    </div>
  );
};

const AssetsView = ({ data }: any) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>
        <LaptopOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <div>No assets assigned</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {data.map((item: any, idx: number) => (
        <div key={idx} style={{ padding: 20, background: "var(--bg-pure-white)", borderRadius: 20, border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#6366f115", padding: 8, borderRadius: 10, color: "#6366f1" }}>
              <Laptop size={20} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Asset {idx + 1}: {item.brand || "Unnamed Asset"}
            </div>
          </div>

          <Row gutter={[16, 0]}>
            <Col span={12}><RowItem label="Item Name" value={item.item} icon={<Box />} color="#6366f1" /></Col>
            <Col span={12}><RowItem label="Brand Name" value={item.brand} icon={<Award />} color="#6366f1" /></Col>
            <Col span={12}><RowItem label="Model Name" value={item.model} icon={<Layers />} color="#6366f1" /></Col>
            <Col span={12}><RowItem label="Model Number" value={item.modelNumber} icon={<FileText />} color="#6366f1" /></Col>
          </Row>

          {item.image && (
            <div style={{ marginTop: 12, padding: 12, background: "var(--bg-pure-white)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase" }}>Asset Image</div>
              <Image
                src={item.image}
                alt="Asset"
                width={120}
                height={120}
                style={{ objectFit: "cover", borderRadius: 10, border: "1px solid var(--border-color)" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


/* ---------------- MAIN COMPONENT ---------------- */
const Onboarded = () => {
  const { canUpdateOnboarding } = usePermission();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<any>(null);
  const [section, setSection] = useState("");
  const [edit, setEdit] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Separate forms for each section
  const [personalDetailsForm] = Form.useForm();
  const [employmentForm] = Form.useForm();
  const [bankPayrollForm] = Form.useForm();
  const [companyHistoryForm] = Form.useForm();
  const [assetsForm] = Form.useForm();

  const [projects, setProjects] = useState<any[]>([]);

  // Map section to form
  const sectionFormMap: any = {
    personalDetails: personalDetailsForm,
    employment: employmentForm,
    bankAndPayroll: bankPayrollForm,
    previousCompanyDetails: companyHistoryForm,
    assets: assetsForm,
  };
  const router = useRouter();

  // ✅ Fetch All Employees
  const fetchEmployees = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();
      setTotalMembers(res?.length || 0);
      let employees = [];

      // Handle different response structures
      if (res?.data?.success) {
        employees = res.data.data || [];
      } else if (res?.success) {
        employees = res.data || [];
      } else if (Array.isArray(res?.data)) {
        employees = res.data;
      } else if (Array.isArray(res)) {
        employees = res;
      }

      const mappedData = employees.map((employee: any) => {
        // Handle both nested and flat data structures
        const personal = employee.personal || employee;

        return {
          id: employee.id || employee._id,
          personalDetails: {
            firstName: personal.firstName || employee.firstName || "",
            lastName: personal.lastName || employee.lastName || "",
            email:
              personal.email ||
              personal.personalEmail ||
              employee.email ||
              employee.personalEmail ||
              "",
            phone:
              personal.phone ||
              personal.mobile ||
              employee.phone ||
              employee.mobile ||
              "",
          },
          status: employee.status,
          loginAccess: employee.loginAccess,
          _rawData: employee,
        };
      });

      setData(mappedData);
      if (mappedData.length === 0) {
        message.info("No employees found");
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error("Failed to fetch employees");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const fetchProjects = async () => {
      try {
        const response = await ProjectService.getProjects({
          page: 1,
          limit: 1000,
        });
        if (response?.data) {
          setProjects(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchProjects();
  }, []);

  // ✅ Fetch Full Details for View/Edit - FIXED
  const fetchFullDetails = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.getEmployeeById(id);
      let employeeData = null;

      // Handle different response structures
      if (res?.data?.success) {
        employeeData = res.data.data;
      } else if (res?.success) {
        employeeData = res.data;
      } else if (res?.data) {
        employeeData = res.data;
      } else {
        employeeData = res;
      }

      if (!employeeData) {
        message.error("Employee data not found");
        return null;
      }

      // Comprehensive data extraction with fallbacks
      const personal = employeeData.personal || employeeData;
      const employment = employeeData.employment || employeeData;
      const bank =
        employeeData.bank || employeeData.bankAndPayroll || employeeData;

      return {
        id: id,
        personalDetails: {
          firstName: personal.firstName || "",
          lastName: personal.lastName || "",
          email: personal.email || personal.personalEmail || "",
          personalEmail: personal.personalEmail || personal.email || "",
          phone: personal.phone || personal.mobile || "",
          mobile: personal.mobile || personal.phone || "",
          dob: personal.dateOfBirth || personal.dob || "",
          gender: personal.gender || "",
          bloodGroup: personal.bloodGroup || "",
          workEmail: personal.workEmail || employeeData.workEmail || "",
          address: personal.address || {},
          pan: personal.pan || "",
          aadhaar: personal.aadhaar || "",
        },
        employment: {
          department: employment.department || "",
          team: employment.team || "",
          employeeType:
            employment.employeeType || employment.employmentType || "",
          workLocation: employment.workLocation || "",
          workShift: employment.workShift || "",
          joiningDate: employment.joiningDate || "",
          trainingCompletion: employment.trainingCompletion || "",
          projects: employment.projects || [],
          reportingManager: employment.reportingManager || "",
          promotionStatus: employment.promotionStatus || "",
          employeeGrade: employment.employeeGrade || "",
          workType: employment.workType || null,
          hybridMode: employment.hybridMode || null,
          fixedDays: employment.fixedDays || [],
          totalDays: employment.totalDays || null,
          totalHours: employment.totalHours || null,
          employeeJoiningDate: employment.employeeJoiningDate || null,
          noticePeriod:
            employment.noticePeriod || employment.notice_period || null,
        },
        bankAndPayroll: {
          bankName: bank.bankName || "",
          accountNumber: bank.accountNumber || "",
          ifscCode: bank.ifscCode || "",
          salary: bank.salary || "",
          pfNumber: bank.pfNumber || "",
          esiNumber: bank.esiNumber || "",
          uanNumber: bank.uanNumber || "",
          branchName: bank.branchName || bank.bankBranch || "",
          bankBranch: bank.bankBranch || bank.branchName || "",
          accountHolderName: bank.accountHolderName || "",
        },
        previousCompanyDetails:
          employeeData.history || employeeData.previousCompanyDetails || [],
        assets: employeeData.assets || [],
      };
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      message.error("Failed to fetch employee details");
      return null;
    }
  };

  // ✅ Filter employees
  const filtered = data.filter((e: any) => {
    const firstName = e.personalDetails?.firstName || "";
    const lastName = e.personalDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const activeCount = data.filter((item: any) => item.status).length;
  const inactiveCount = data.length - activeCount;

  const openView = async (emp: any, sec: string) => {
    setSection(sec);
    //setView({ id: emp.id });
    setIsDrawerOpen(true);
    setViewLoading(true);
    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
    }
    setViewLoading(false);
  };

  const handleStatusChange = (id: string, checked: boolean) => {
    const updatedData: any = data.map((item: any) =>
      item.id === id ? { ...item, status: checked } : item,
    );

    setData(updatedData);
  };

  const handleLoginAccess = (id: string) => {
    const updated: any = data.map((item: any) =>
      item.id === id ? { ...item, loginAccess: !item.loginAccess } : item,
    );

    setData(updated);
  };

  const openEdit = async (emp: any, sec: string) => {
    setEdit(false); // Close any existing edit modal first
    setViewLoading(true);
    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
      setSection(sec);

      // Small delay to ensure state is updated before opening edit modal
      // setTimeout(() => {
      setEdit(true);
      setViewLoading(false);
      // }, 100);
    } else {
      setViewLoading(false);
    }
  };
  const handleLoginClick = (record: any) => {
    setSelectedUser(record);
    setIsModalOpen(true);
  };

  const saveEdit = async () => {
    setUpdateLoading(true);

    try {
      const currentForm = sectionFormMap[section];
      const values = await currentForm.validateFields();

      const sectionBackendMap: any = {
        personalDetails: "personal",
        employment: "employment",
        bankAndPayroll: "bank",
        previousCompanyDetails: "history",
        assets: "assets",
      };

      const backendKey = sectionBackendMap[section];
      let payload: any = {};

      // -------- SECTION LOGIC --------
      if (section === "employment") {
        const existingData = view?.[section] || {};
        const formValues = Object.fromEntries(
          Object.entries(values).map(([k, v]: any) => [
            k,
            dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
          ]),
        );
        const newEmploymentData = { ...existingData, ...formValues };
        if (formValues.workType === "hybrid") {
          if (formValues.hybridMode === "Fixed") {
            newEmploymentData.totalDays =
              newEmploymentData.fixedDays?.length || 0;
            newEmploymentData.totalHours = newEmploymentData.totalDays * 8;
          } else {
            // General mode
            newEmploymentData.fixedDays = [];
          }
        } else {
          newEmploymentData.hybridMode = null;
          newEmploymentData.fixedDays = [];
          newEmploymentData.totalDays = null;
          newEmploymentData.totalHours = null;
        }
        payload[backendKey] = newEmploymentData;
      } else if (section === "personalDetails") {
        // Destructure address fields to restructure them
        const {
          c_flat,
          c_area,
          c_city,
          c_state,
          c_pincode,
          c_country,
          p_flat,
          p_area,
          p_city,
          p_state,
          p_pincode,
          p_country,
          ...rest
        } = values;

        payload[backendKey] = {
          ...rest,
          dob: dayjs.isDayjs(values.dob)
            ? values.dob.format("YYYY-MM-DD")
            : values.dob,
          address: {
            current: { c_flat, c_area, c_city, c_state, c_pincode, c_country },
            permanent: {
              p_flat,
              p_area,
              p_city,
              p_state,
              p_pincode,
              p_country,
            },
          },
        };
      } else if (section === "assets") {
        const processedAssets = await Promise.all(
          (values.assets || []).map(async (item: any) => {
            let imageUrl = item.image?.[0]?.url || "";

            if (item.image?.[0]?.originFileObj) {
              imageUrl = await fileToBase64(item.image[0].originFileObj);
            }

            return {
              item: item.item,
              brand: item.brand,
              model: item.model,
              modelNumber: item.modelNumber,
              image: imageUrl,
            };
          }),
        );

        payload[backendKey] = processedAssets;
      } else if (section === "previousCompanyDetails") {
        const previousCompanies = values.previousCompanies || [];
        const processedData = previousCompanies.map((company: any) => ({
          ...company,
          doj: company?.doj ? company.doj.format("YYYY-MM-DD") : null,
          lwd: company?.lwd ? company.lwd.format("YYYY-MM-DD") : null,
          form16: (company.form16 || []).map((item: any) => item.file || item),
          payslips: (company.payslips || []).map(
            (item: any) => item.file || item,
          ),
        }));
        payload[backendKey] = processedData;

      } else {
        payload[backendKey] = Object.fromEntries(
          Object.entries(values).map(([k, v]: any) => [
            k,
            dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
          ]),
        );
      }

      // -------- API CALL --------
      const res = await EmployeeOnboardingService.updateEmployee(
        view.id,
        payload,
      );

      console.log("after update", res);

      if (!res) {
        throw new Error("Failed to update");
      }

      // -------- SUCCESS --------
      message.success("Employee updated successfully");

      const updatedDetails = await fetchFullDetails(view.id);

      if (updatedDetails) {
        setView(updatedDetails);
      }

      await fetchEmployees(true);

      // ✅ CLOSE MODAL AFTER SUCCESS
      setEdit(false);

      // reset form after close
      currentForm.resetFields();
    } catch (error: any) {
      console.error("Update failed:", error);
      message.error(error?.message || "Failed to update employee");
    } finally {
      setUpdateLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.deleteEmployee(id);

      // Try different response structures
      const success = res?.data?.success || res?.success || res?.status === 200;

      if (success) {
        message.success("Employee deleted successfully");
        setData((prev) => prev.filter((e: any) => e.id !== id));
        await fetchEmployees(true);
        fetchEmployees(true);
      } else {
        // If API doesn't support delete, try update with isDeleted flag
        const updateRes = await EmployeeOnboardingService.updateEmployee(id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });

        const updateSuccess = updateRes?.data?.success || updateRes?.success;
        if (updateSuccess) {
          message.success("Employee marked as deleted successfully");
          setData((prev) => prev.filter((e: any) => e.id !== id));
          await fetchEmployees(true);
          fetchEmployees(true);
        } else {
          message.error("Failed to delete employee");
        }
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      message.error(error?.message || "Failed to delete employee");
    }
  };

  // ✅ Table columns
  const columns = [
    {
      title: "Employee Name",
      render: (_: any, r: any) => {
        const firstName = r.personalDetails?.firstName || "";
        const lastName = r.personalDetails?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || <span style={{ color: "red" }}>Not Verified</span>;
      },
    },
    ...[
      ["Personal Details", "personalDetails", "blue"],
      ["Employment", "employment", "green"],
      ["Bank & Payroll", "bankAndPayroll", "purple"],
      ["Employee History", "previousCompanyDetails", "orange"],
      ["Assets", "assets", "red"],
    ].map(([t, k, c]: any) => ({
      title: t,
      render: (_: any, r: any) => (
        <Space>
          <Tag style={{ cursor: "pointer" }} onClick={() => openView(r, k)}>
            <EyeOutlined />
          </Tag>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => openEdit(r, k)}
          />
        </Space>
      ),
    })),

    {
      title: "Login Access",
      dataIndex: "loginAccess",
      key: "loginAccess",
      render: (_: any, record: any) =>
        record.loginAccess ? (
          <CheckCircleTwoTone
            twoToneColor="#52c41a"
            style={{ fontSize: 18, cursor: "pointer" }}
          // onClick={() => handleLoginAccess(record.id)}
          />
        ) : (
          <CloseCircleTwoTone
            twoToneColor="#ff4d4f"
            style={{ fontSize: 18, cursor: "pointer" }}
          // onClick={() => handleLoginAccess(record.id)}
          />
        ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: any, record: any) => (
        <Switch
          size="small"
          checked={record.status}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          style={{
            backgroundColor: record.status ? "#52c41a" : "#ff4d4f",
            minWidth: 36,
          }}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },

    {
      title: "Login Status",
      key: "loginStatus",
      render: (_: any, record: any) =>
        record.loginAccess ? (
          <Typography.Text
            style={{ color: "#1677ff", cursor: "pointer" }}
            onClick={() => handleLoginClick(record)}
          >
            Login
          </Typography.Text>
        ) : (
          <span
            style={{
              color: "#1677ff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => handleLoginClick(record)}
          >
            Connect
          </span>
        ),
    },
  ];

  const sectionIconMap: any = {
    personalDetails: <User size={18} style={{ marginRight: 8 }} />,
    employment: <Briefcase size={18} style={{ marginRight: 8 }} />,
    bankAndPayroll: <CreditCard size={18} style={{ marginRight: 8 }} />,
    previousCompanyDetails: <Clock size={18} style={{ marginRight: 8 }} />,
    assets: <Building2 size={18} style={{ marginRight: 8 }} />,
  };

  const sectionSubTitleMap: Record<string, string> = {
    personalDetails: "Personal information provided by the employee",
    employment: "Employment and company related details",
    bankAndPayroll: "Bank and salary related information",
    previousCompanyDetails: "Previous company and experience details",
    assets: "Assets assigned to the employee",
  };

  // Render appropriate edit form based on section
  const renderEditForm = () => {
    const currentForm = sectionFormMap[section];
    const sectionData = view?.[section];

    switch (section) {
      case "personalDetails":
        return (
          <PersonalDetailsEditForm
            form={currentForm}
            initialData={sectionData}
          />
        );
      case "employment":
        return (
          <EmploymentEditForm
            form={currentForm}
            initialData={sectionData}
            projects={projects}
          />
        );
      case "bankAndPayroll":
        return (
          <BankPayrollEditForm form={currentForm} initialData={sectionData} />
        );
      case "previousCompanyDetails":
        return (
          <EmployeeHistoryEditForm
            form={currentForm}
            initialData={sectionData}
          />
        );
      case "assets":
        return <AssetsEditForm form={currentForm} initialData={sectionData} />;

      default:
        return null;
    }
  };

  // Render appropriate view based on section
  const renderView = () => {
    const sectionData = view?.[section];

    switch (section) {
      case "personalDetails":
        return <PersonalDetailsView data={sectionData} />;
      case "employment":
        return <EmploymentView data={sectionData} projects={projects} />;
      case "bankAndPayroll":
        return <BankPayrollView data={sectionData} />;
      case "previousCompanyDetails":
        return <EmployeeHistoryView data={sectionData} />;
      case "assets":
        return <AssetsView data={sectionData} />;

      default:
        return <div>No data available</div>;
    }
  };

  const handleCancelEdit = () => {
    const currentForm = sectionFormMap[section];
    currentForm?.resetFields(); // reset form
    setEdit(false); // close modal
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "24px 32px", background: "var(--bg-secondary)", minHeight: "calc(100vh - 64px)" }}>
          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{
                  background: "var(--bg-blue-50)",
                  padding: 10,
                  borderRadius: 12,
                  color: "var(--premium-blue)",
                  display: "flex"
                }}>
                  <Users size={24} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Onboarded Members</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Review and manage employees who have successfully completed the onboarding journey.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                placeholder="Search employees..."
                prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
                style={{ width: 280, borderRadius: 10, height: 44, background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-200)" }}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)", border: "none" }}
                onClick={() => router.push("/onboarding/create")}
              >
                Hire Employee
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={6}>
              <StatCard
                label="Total Employees"
                value={totalMembers}
                icon={Users}
                color="#3b82f6"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                label="Active Employees"
                value={activeCount}
                icon={CheckCircle2}
                color="#10b981"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                label="Inactive / Pending"
                value={inactiveCount}
                icon={Clock}
                color="#f59e0b"
              />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard
                label="Verified Stats"
                value="98.5%"
                icon={ShieldCheck}
                color="#8b5cf6"
              />
            </Col>
          </Row>

          {/* Table Card */}
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", overflow: "hidden", background: "var(--bg-pure-white)" }}
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 100 }}>
                <Spin size="large" tip="Loading members..." />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filtered}
                rowKey="id"
                pagination={{ pageSize: 12, position: ["bottomRight"] }}
                size="middle"
              />
            )}
          </Card>
          {/* </Card> */}

          {/* VIEW DRAWER */}
          <Drawer
            //open={!!view && !edit}
            open={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setView(null);
              setSection("");
            }}
            title={
              <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 4, paddingBottom: 4 }}>
                <div style={{
                  minWidth: 48,
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--bg-blue-50)",
                  border: "1px solid var(--border-slate-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--premium-blue)",
                  fontSize: 20
                }}>
                  {sectionIconMap[section]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                    {labelize(section)}
                  </span>
                  {sectionSubTitleMap[section] && (
                    <span style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 400, lineHeight: 1.4 }}>
                      {sectionSubTitleMap[section]}
                    </span>
                  )}
                </div>
              </div>
            }
            width={800}
            headerStyle={{ borderBottom: "1px solid var(--border-slate-100)", padding: "24px 32px", background: "var(--bg-pure-white)" }}
            bodyStyle={{ padding: "32px", background: "var(--bg-pure-white)" }}
          >
            <Spin spinning={viewLoading}>{renderView()}</Spin>
          </Drawer>

          {/* EDIT MODAL */}
          <Modal
            open={edit}
            onCancel={() => {
              setEdit(false);
              sectionFormMap[section]?.resetFields();
              setSection("");
            }}
            onOk={saveEdit}
            title={
              <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 4, paddingBottom: 4 }}>
                <div style={{
                  minWidth: 48,
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--bg-blue-50)",
                  border: "1px solid var(--border-slate-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--premium-blue)",
                  fontSize: 20
                }}>
                  {sectionIconMap[section]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                    Edit {labelize(section)}
                  </span>
                  {sectionSubTitleMap[section] && (
                    <span style={{ fontSize: 13, color: "var(--text-slate-500)", fontWeight: 400, lineHeight: 1.4 }}>
                      {sectionSubTitleMap[section]}
                    </span>
                  )}
                </div>
              </div>
            }
            width={section === "previousCompanyDetails" ? 1400 : 900}
            okText="Save Changes"
            confirmLoading={updateLoading}
            cancelText="Cancel"
            destroyOnClose
          >
            <Form layout="vertical" form={sectionFormMap[section]}>
              {renderEditForm()}
            </Form>
          </Modal>

          <Modal
            title="Connect User"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
          >
            <Form layout="vertical">
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: "Please enter username" }]}
              >
                <Input placeholder="Enter username" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter password" }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block>
                Submit
              </Button>
            </Form>
          </Modal>

          <style dangerouslySetInnerHTML={{
            __html: `
            .ant-table-thead > tr > th {
              background-color: var(--bg-slate-50) !important;
              color: var(--text-slate-500) !important;
              font-weight: 600 !important;
              border-bottom: 2px solid var(--border-slate-100) !important;
              padding: 12px 20px !important;
            }
            .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-50) !important; padding: 16px 20px !important; color: var(--text-slate-900) !important; }
            .ant-table-row:hover { background-color: var(--bg-slate-50) !important; }
            .ant-pagination-item a { color: var(--text-slate-500) !important; }
            .ant-pagination-item-active { background: var(--bg-pure-white) !important; border-color: var(--premium-blue) !important; }
          `}} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

// Wrap with loading and permission checks
export default function OnboardedPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOnboarding } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadOnboarding) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOnboarding, router]);

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ padding: 100, textAlign: 'center' }}>
            <Spin size="large" tip="Loading">
              <div style={{ padding: 20 }} />
            </Spin>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Permission check
  if (!canReadOnboarding) {
    return null;
  }

  return <Onboarded />;
}
