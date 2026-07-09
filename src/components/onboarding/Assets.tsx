"use client";
import React, {
  forwardRef,
  useEffect,
  useState,
  useImperativeHandle,
} from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Upload,
  Divider,
  Row,
  Col,
  Select,
  Typography,
  message,
} from "antd";
import {
  Plus,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Keyboard,
  MousePointer2,
  Briefcase,
  Headphones,
  Trash2,
  Edit2,
  Image as ImageIcon,
  CheckCircle2,
  Info
} from "lucide-react";
import { SectionCard, commonDrawerProps, drawerFormStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Text, Title, Paragraph } = Typography;

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-slate-500)",
  marginBottom: "4px",
  display: "inline-block",
};

const cardStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "11px 0",
  height: "280px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
};

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
    <div style={{ padding: "6px", background: "var(--bg-blue-50)", borderRadius: "8px", border: "1px solid var(--border-slate-100)" }}>
      <Icon size={16} style={{ color: "var(--premium-blue)" }} />
    </div>
    <div>
      <div style={{ fontWeight: 700, color: "var(--text-slate-900)", fontSize: "14px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "11px", color: "var(--text-slate-500)" }}>{subtitle}</div>}
    </div>
  </div>
);

const getAssetIcon = (itemName: string) => {
  const lower = (itemName || "").toLowerCase();
  if (lower.includes("laptop")) return Laptop;
  if (lower.includes("mobile") || lower.includes("phone")) return Smartphone;
  if (lower.includes("monitor") || lower.includes("screen")) return Monitor;
  if (lower.includes("tab")) return Tablet;
  if (lower.includes("keyboard")) return Keyboard;
  if (lower.includes("mouse")) return MousePointer2;
  if (lower.includes("headphone")) return Headphones;
  if (lower.includes("bag")) return Briefcase;
  return Monitor;
};

const Assets = forwardRef(({ data }: any, ref: any) => {
  const [open, setOpen] = useState(false);
  const [assetsform] = Form.useForm();
  const [assets, setAssets] = useState<any[]>([]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setAssets(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    validate: async () => {
      return true; // Assets are managed via drawer, so no main form to validate here
    },
    getData: () => assets,
  }));

  // useImperativeHandle(ref, () => ({
  //   async validateAndGetData() {
  //     return assets || [];
  //   },
  // }));

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error("File size must be less than 5MB");
      return Upload.LIST_IGNORE; // ❌ stop file from adding to list
    }

    return false; // prevent auto upload (because we convert to base64 manually)
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAddOrUpdateAsset = async () => {
    const values = await assetsform.validateFields();

    const fileObj = values.image?.[0];

    let imageBase64 = "";
    let fileName = "";

    // 🔥 If new image selected
    if (fileObj?.originFileObj) {
      imageBase64 = await fileToBase64(fileObj.originFileObj);
      fileName = fileObj.originFileObj.name;
    }
    // 🔥 If editing existing asset (already saved URL)
    else if (fileObj?.url) {
      imageBase64 = fileObj.url; // already uploaded image URL
    }

    const assetData = {
      item: values.item,
      brand: values.brand,
      model: values.model,
      modelNumber: values.modelNumber,

      // 🔥 store base64 (or existing URL)
      image: imageBase64,
      imageName: fileName, // optional (useful for backend)
    };

    if (editIndex !== null) {
      // UPDATE
      setAssets((prev) =>
        prev.map((a, i) => (i === editIndex ? assetData : a)),
      );
      setEditIndex(null);
    } else {
      // ADD
      setAssets((prev) => [...prev, assetData]);
    }

    assetsform.resetFields();
    setOpen(false);
  };

  // DELETE
  const handleDelete = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // EDIT
  const handleEdit = (asset: any, index: number) => {
    setEditIndex(index);
    setOpen(true);

    assetsform.setFieldsValue({
      item: asset.item,
      brand: asset.brand,
      model: asset.model,
      modelNumber: asset.modelNumber,
      image: asset.image
        ? [
          {
            uid: "-1",
            name: asset.imageName || "asset.png",
            status: "done",
            url: asset.image,
          },
        ]
        : [],
    });
  };

  return (
    <div style={{ padding: "0 40px 20px", background: "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "12px 0", borderBottom: "1px solid var(--border-slate-100)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Assets Information</h2>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>Manage Assignment Hardware.</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* ADD BUTTON AS DASHED BOX */}
        <Col xs={24} md={6}>
          <div
            onClick={() => {
              setEditIndex(null);
              assetsform.resetFields();
              setOpen(true);
            }}
            style={{
              height: "280px",
              border: "2px dashed var(--border-slate-200)",
              borderRadius: "12px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "var(--bg-slate-50)",
              color: "var(--premium-blue)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--premium-blue)";
              e.currentTarget.style.background = "var(--bg-blue-50)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-slate-200)";
              e.currentTarget.style.background = "var(--bg-slate-50)";
            }}
          >
            <div style={{
              padding: "8px",
              background: "var(--bg-pure-white)",
              borderRadius: "50%",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              marginBottom: "8px"
            }}>
              <Plus size={20} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-slate-500)" }}>Add New Asset</span>
          </div>
        </Col>

        {/* ASSET CARDS */}
        {assets.map((asset, index) => {
          const AssetIcon = getAssetIcon(asset.item);
          return (
            <Col xs={24} md={6} key={index}>
              <div
                style={cardStyle}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* HOVER ICONS */}
                {hoverIndex === index && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      display: "flex",
                      gap: 8,
                      zIndex: 10,
                    }}
                  >
                    <div
                      onClick={() => handleEdit(asset, index)}
                      style={{
                        background: "var(--bg-pure-white)",
                        padding: "6px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "1px solid var(--border-slate-200)",
                        color: "var(--premium-blue)",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                    >
                      <Edit2 size={14} />
                    </div>
                    <div
                      onClick={() => handleDelete(index)}
                      style={{
                        background: "var(--bg-pure-white)",
                        padding: "6px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "1px solid var(--border-slate-200)",
                        color: "var(--text-red-500)",
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                    >
                      <Trash2 size={14} />
                    </div>
                  </div>
                )}

                <div style={{
                  height: "168px",
                  background: "var(--bg-slate-50)",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "1px solid var(--border-slate-100)"
                }}>
                  {asset.image ? (
                    <img
                      src={asset.image}
                      alt="asset"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <AssetIcon size={52} style={{ color: "#cbd5e1" }} />
                  )}
                </div>

                <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      padding: "4px",
                      background: "var(--bg-blue-50)",
                      borderRadius: "6px",
                      color: "var(--premium-blue)",
                      display: "flex"
                    }}>
                      <AssetIcon size={12} />
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--text-slate-900)", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {asset.item}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-slate-500)", fontWeight: 500 }}>Brand</div>
                      <div style={{ fontSize: "12px", color: "var(--text-slate-900)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.brand}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-slate-500)", fontWeight: 500 }}>Model</div>
                      <div style={{ fontSize: "12px", color: "var(--text-slate-900)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.model}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "6px", borderTop: "1px dashed var(--border-slate-100)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-slate-500)", fontWeight: 500 }}>SN / Model Number</div>
                    <div style={{ fontSize: "12px", color: "var(--text-slate-900)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.modelNumber}</div>
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* DRAWER REPLACING MODAL */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              padding: "8px",
              background: "var(--bg-blue-50)",
              borderRadius: "8px",
              color: "var(--premium-blue)"
            }}>
              {editIndex !== null ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                {editIndex !== null ? "Update Asset Details" : "Register New Asset"}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 400, color: "var(--text-slate-500)" }}>
                {editIndex !== null ? "Modify the existing asset information below." : "Enter the details to register a new assignment."}
              </div>
            </div>
          </div>
        }
        {...commonDrawerProps}
        onClose={() => {
          setOpen(false);
          setEditIndex(null);
        }}
        open={open}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", padding: "16px 24px" }}>
            <Button onClick={() => setOpen(false)} style={{ borderRadius: "8px" }}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleAddOrUpdateAsset}
              style={{
                borderRadius: "8px",
                background: "var(--premium-blue)",
                border: "none",
                padding: "0 24px"
              }}
            >
              {editIndex !== null ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        }
        styles={{
          header: { borderBottom: "1px solid var(--border-slate-100)", padding: "24px" },
          footer: { borderTop: "1px solid var(--border-slate-100)" }
        }}
      >
        <SectionCard 
          icon={<Briefcase size={18} style={{ color: "var(--premium-blue)" }} />} 
          title="Asset Details" 
          subtitle="Manage hardware assignment information"
        >
        <Form form={assetsform} layout="vertical">
          <SectionHeader icon={Briefcase} title="Asset Category" subtitle="Select the type of hardware assigned" />
          <Form.Item
            label={<span style={labelStyle}>Item Type</span>}
            name="item"
            rules={[{ required: true, message: "Please select an item" }]}
          >
            <SearchableDropdown
              style={{ height: "40px", minHeight: "40px" }}
              placeholder="Select asset type"
              options={[
                { label: "Smartphones", value: "Mobile" },
                { label: "Laptop / Notebook", value: "Laptop" },
                { label: "Tablet Device", value: "Tab" },
                { label: "External Monitor", value: "Monitor" },
                { label: "Mechanical Keyboard", value: "Keyboard" },
                { label: "Wireless Mouse", value: "Mouse" },
                { label: "Office Bag", value: "Bag" },
                { label: "Headphones / Mic", value: "Headphone" }
              ]}
            />
          </Form.Item>

          <Divider style={{ margin: "24px 0" }} />
          <SectionHeader icon={Info} title="Device Information" subtitle="Brand and technical specifications" />

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={labelStyle}>Brand Name</span>}
                name="brand"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. Apple, Dell" style={{ height: "40px", borderRadius: "8px" }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={<span style={labelStyle}>Model Name</span>}
                name="model"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. MacBook Pro M2" style={{ height: "40px", borderRadius: "8px" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<span style={labelStyle}>Serial / Model Number</span>}
            name="modelNumber"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g. SN-123456789" style={{ height: "40px", borderRadius: "8px" }} />
          </Form.Item>

          <Divider style={{ margin: "24px 0" }} />
          <SectionHeader icon={ImageIcon} title="Visual Proof" subtitle="Upload a photograph of the physical asset" />

          <Form.Item
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
          >
            <Upload
              listType="picture-card"
              beforeUpload={handleBeforeUpload}
              maxCount={1}
              style={{ width: "100%" }}
            >
              <div style={{ textAlign: "center" }}>
                <Plus size={20} style={{ color: "#3b82f6", marginBottom: "8px" }} />
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Upload Photo</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Max 5MB</div>
              </div>
            </Upload>
          </Form.Item>

          <div style={{ background: "var(--bg-slate-50)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-slate-100)", marginTop: "24px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <CheckCircle2 size={16} style={{ color: "var(--text-green-500)", marginTop: "2px" }} />
              <div style={{ fontSize: "12px", color: "var(--text-slate-500)", lineHeight: "1.6" }}>
                By registering this asset, you acknowledge responsibility for its maintenance and periodic verification.
              </div>
            </div>
          </div>
        </Form>
        </SectionCard>
        <style dangerouslySetInnerHTML={{ __html: drawerFormStyles }} />
      </Drawer>
    </div>
  );
});
export default Assets;
