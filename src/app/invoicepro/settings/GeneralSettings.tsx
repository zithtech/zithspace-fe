// import { FC, useEffect, useState } from "react";
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Upload,
//   Row,
//   Col,
//   Space,
//   Select,
// } from "antd";
// import {
//   UploadOutlined,
//   ApartmentOutlined,
//   FullscreenOutlined,
// } from "@ant-design/icons";
// import { currencyOptions } from "@/utils/currencyOptions";
// import { GeneralDraft } from "@/types/invoice";
// const { Option } = Select;

// interface GeneralSettingsProps {
//   initialValues: GeneralDraft;
//   onSave: (data: GeneralDraft) => void;
// }

// const GeneralSettings: FC<GeneralSettingsProps> = ({
//   initialValues,
//   onSave,
// }) => {
//   const [form] = Form.useForm();

//   const currencyCode = Form.useWatch("currency_code", form);
//   const primaryColor = Form.useWatch("primary_color", form);

//   const [fileList, setFileList] = useState<any[]>([]);

//   useEffect(() => {
//     if (initialValues.company_logo) {
//       setFileList([
//         {
//           uid: "-1",
//           name: "company-logo",
//           status: "done",
//           url: initialValues.company_logo,
//         },
//       ]);
//     }
//   }, [initialValues.company_logo]);

//   //  const handleFinish = (values: GeneralDraft & { company_logo?: any[] }) => {
//   //   const file = values.company_logo?.[0]?.originFileObj;

//   //   // If no logo uploaded
//   //   if (!file) {
//   //     onSave({
//   //       ...values,
//   //       company_logo: initialValues.company_logo || null,
//   //     });
//   //     return;
//   //   }

//   //   const reader = new FileReader();
//   //   reader.onload = () => {
//   //     onSave({
//   //       ...values,
//   //       company_logo: reader.result as string, // ✅ Base64
//   //     });
//   //   };
//   //   reader.readAsDataURL(file);
//   // };

//   useEffect(() => {
//     form.setFieldsValue(initialValues);
//   }, [initialValues]);

//   // const handleFinish = async (
//   //   values: GeneralDraft & { company_logo?: any[] }
//   // ) => {
//   //   const uploadFile = values.company_logo?.[0];

//   //   // If NO new logo uploaded
//   //   if (!uploadFile?.originFileObj) {
//   //     onSave({
//   //       ...values,
//   //       company_logo: initialValues.company_logo || null,
//   //     });
//   //     return;
//   //   }

//   //   const file = uploadFile.originFileObj as File;

//   //   const toBase64 = (file: File) =>
//   //     new Promise<string>((resolve, reject) => {
//   //       const reader = new FileReader();
//   //       reader.onload = () => resolve(reader.result as string);
//   //       reader.onerror = reject;
//   //       reader.readAsDataURL(file);
//   //     });

//   //   const base64Logo = await toBase64(file);

//   //   onSave({
//   //     ...values,
//   //     company_logo: base64Logo, // ✅ STRING ONLY
//   //   });
//   // };

//   // const handleFinish = async (
//   //   values: GeneralDraft & { company_logo?: any[] }
//   // ) => {
//   //   const fileList = values.company_logo;

//   //   // If no files were uploaded
//   //   if (!fileList || fileList.length === 0) {
//   //     onSave({
//   //       ...values,
//   //       company_logo: initialValues.company_logo || null,
//   //     });
//   //     return;
//   //   }

//   //   const file = fileList[0].originFileObj as File;

//   //   // Only process if it's a new file
//   //   if (file) {
//   //     const toBase64 = (file: File) =>
//   //       new Promise<string>((resolve, reject) => {
//   //         const reader = new FileReader();
//   //         reader.onload = () => resolve(reader.result as string);
//   //         reader.onerror = reject;
//   //         reader.readAsDataURL(file);
//   //       });

//   //     const base64Logo = await toBase64(file);

//   //     onSave({
//   //       ...values,
//   //       company_logo: base64Logo,
//   //     });
//   //   } else {
//   //     // If it's already a base64 string (from previous save)
//   //     onSave({
//   //       ...values,
//   //       company_logo:
//   //         fileList[0]?.url ||
//   //         fileList[0]?.thumbUrl ||
//   //         initialValues.company_logo,
//   //     });
//   //   }
//   // };

//   // const handleFinish = async (
//   //   values: GeneralDraft & { company_logo?: any[] }
//   // ) => {
//   //   const uploadedFile = fileList[0];

//   //   if (uploadedFile?.originFileObj) {
//   //     const file = uploadedFile.originFileObj as File;

//   //     const base64Logo = await new Promise<string>((resolve, reject) => {
//   //       const reader = new FileReader();
//   //       reader.onload = () => resolve(reader.result as string);
//   //       reader.onerror = reject;
//   //       reader.readAsDataURL(file);
//   //     });

//   //     onSave({ ...values, company_logo: base64Logo });
//   //   } else {
//   //     onSave({ ...values, company_logo: uploadedFile?.url || null });
//   //   }
//   // };

//   const handleFinish = async (
//     values: GeneralDraft & { company_logo?: any[] }
//   ) => {
//     const uploadedFile = fileList[0];

//     if (uploadedFile?.originFileObj) {
//       const file = uploadedFile.originFileObj as File;

//       const base64Logo = await new Promise<string>((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result as string);
//         reader.onerror = reject;
//         reader.readAsDataURL(file);
//       });

//       onSave({ ...values, company_logo: base64Logo });
//     } else {
//       onSave({ ...values, company_logo: uploadedFile?.url || null });
//     }
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 md:p-6">
//       <Form
//         form={form}
//         layout="vertical"
//         initialValues={initialValues}
//         onFinish={handleFinish}
//         // onValuesChange={(_, values) => {
//         //   onSave({ ...initialValues, ...values }); // MERGE!
//         // }}
//         onValuesChange={(_, values) => {
//           onSave({
//             ...initialValues,
//             ...values,
//             company_logo: fileList[0]?.url || initialValues.company_logo,
//           });
//         }}
//       >
//         <Row gutter={[24, 24]}>
//           {/* Company Information */}
//           <Col xs={24} md={12}>
//             <Card
//               title={
//                 <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <ApartmentOutlined
//                     style={{ color: "#1890ff", fontSize: 18 }}
//                   />
//                   Company Information
//                 </span>
//               }
//               className="rounded-xl shadow-sm h-full"
//             >
//               <Form.Item
//                 label="Company Name"
//                 name="company_name"
//                 rules={[
//                   { required: true, message: "Company name is required" },
//                 ]}
//               >
//                 <Input placeholder="Enter company name" />
//               </Form.Item>

//               <Form.Item label="Company Address" name="company_address">
//                 <Input.TextArea rows={3} />
//               </Form.Item>

//               <Form.Item label="Primary Color">
//                 <div className="flex w-full items-center gap-3">
//                   {/* Color picker – 30% */}
//                   <Form.Item
//                     name="primary_color"
//                     noStyle
//                     initialValue="#1890ff"
//                   >
//                     <Input
//                       type="color"
//                       className="h-10 cursor-pointer"
//                       style={{
//                         width: "10%",
//                         padding: 4,
//                         borderRadius: 8,
//                       }}
//                     />
//                   </Form.Item>

//                   {/* Hex input – 70% */}
//                   <Form.Item noStyle>
//                     <Input
//                       value={primaryColor}
//                       placeholder="#1890ff"
//                       onChange={(e) =>
//                         form.setFieldValue("primary_color", e.target.value)
//                       }
//                       style={{
//                         width: "90%",
//                       }}
//                     />
//                   </Form.Item>
//                 </div>
//               </Form.Item>

//               {/* <Form.Item
//                 label="Company Logo"
//                 name="company_logo"
//                 valuePropName="fileList"
//                 getValueFromEvent={(e) => e?.fileList}
//               >
//                 <Upload
//                   maxCount={1}
//                   listType="picture"
//                   beforeUpload={() => false}
//                 >
//                   <Button icon={<UploadOutlined />}>Upload Logo</Button>
//                 </Upload>
//               </Form.Item> */}

//               {/* <Form.Item
//                 label="Company Logo"
//                 name="company_logo"
//                 valuePropName="fileList"
//                 getValueFromEvent={(e) => {
//                   if (Array.isArray(e)) {
//                     return e;
//                   }
//                   return e?.fileList;
//                 }}
//               >
//                 <Upload
//                   maxCount={1}
//                   listType="picture"
//                   beforeUpload={() => false}
//                   fileList={
//                     initialValues.company_logo
//                       ? [
//                           {
//                             uid: "-1",
//                             name: "company-logo",
//                             status: "done",
//                             url: initialValues.company_logo,
//                           },
//                         ]
//                       : []
//                   }
//                 >
//                   <Button icon={<UploadOutlined />}>Upload Logo</Button>
//                 </Upload>
//                 <Upload
//                   maxCount={1}
//                   listType="picture"
//                   beforeUpload={() => false} // prevents auto upload
//                   fileList={fileList} // controlled
//                   onChange={({ fileList }) => setFileList(fileList)} // updates state
//                 >
//                   <Button icon={<UploadOutlined />}>Upload Logo</Button>
//                 </Upload>
//               </Form.Item>  */}

//               <Form.Item
//                 label="Company Logo"
//                 name="company_logo"
//                 valuePropName="fileList"
//                 getValueFromEvent={(e) => {
//                   if (Array.isArray(e)) return e;
//                   return e?.fileList;
//                 }}
//               >
//                 <Upload
//                   maxCount={1}
//                   listType="picture"
//                   beforeUpload={() => false} // prevent auto upload
//                   fileList={fileList} // controlled
//                   onChange={({ fileList }) => setFileList(fileList)} // update state
//                 >
//                   <Button icon={<UploadOutlined />}>Upload Logo</Button>
//                 </Upload>
//               </Form.Item>
//             </Card>
//           </Col>

//           {/* Regional Settings */}
//           <Col xs={24} md={12}>
//             <Card
//               title={
//                 <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <FullscreenOutlined
//                     style={{ color: "#1890ff", fontSize: 18 }}
//                   />
//                   Regional Settings
//                 </span>
//               }
//               className="rounded-xl shadow-sm h-full"
//             >
//               <Form.Item
//                 label="Default Currency"
//                 name="currency_code"
//                 rules={[{ required: true, message: "Currency is required" }]}
//                 initialValue="USD"
//               >
//                 <Select
//                   placeholder="Select currency"
//                   optionLabelProp="label" // shows symbol + label in input
//                 >
//                   {currencyOptions.map((c) => (
//                     <Option
//                       key={c.value}
//                       value={c.value}
//                       label={`${c.symbol} ${c.label}`}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           gap: 8,
//                           alignItems: "center",
//                         }}
//                       >
//                         <span>{c.symbol}</span>
//                         <span>{c.label}</span>
//                       </div>
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>

//               <Form.Item
//                 label="Date Format"
//                 name="date_format"
//                 rules={[{ required: true, message: "Date format is required" }]}
//                 initialValue="MM/DD/YYYY" // <-- default value here
//               >
//                 <Select>
//                   <Select.Option value="MM/DD/YYYY">MM/DD/YYYY</Select.Option>
//                   <Select.Option value="DD/MM/YYYY">DD/MM/YYYY</Select.Option>
//                   <Select.Option value="YYYY-MM-DD">YYYY/MM/DD</Select.Option>
//                 </Select>
//               </Form.Item>
//             </Card>
//           </Col>
//         </Row>

//         {/* SINGLE SAVE BUTTON */}
//         {/* <div className="flex justify-end">
//           <Button type="primary" htmlType="submit" size="large">
//             Save Settings
//           </Button>
//         </div> */}
//       </Form>
//     </div>
//   );
// };

// export default GeneralSettings;

// import { FC, useEffect, useState, useRef } from "react";
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Upload,
//   Row,
//   Col,
//   Select,
//   message,
// } from "antd";
// import {
//   UploadOutlined,
//   ApartmentOutlined,
//   FullscreenOutlined,
// } from "@ant-design/icons";
// import { currencyOptions } from "@/utils/currencyOptions";
// import { GeneralDraft } from "@/types/invoice";
// import type { UploadFile, UploadProps } from "antd";
// const { Option } = Select;

// interface GeneralSettingsProps {
//   initialValues: GeneralDraft;
//   onSave: (data: GeneralDraft) => void;
// }

// const GeneralSettings: FC<GeneralSettingsProps> = ({
//   initialValues,
//   onSave,
// }) => {
//   const [form] = Form.useForm();
//   const [fileList, setFileList] = useState<UploadFile[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [hasInitialized, setHasInitialized] = useState(false);

//   const prevLogoRef = useRef<string | null>(null);

//   const currencyCode = Form.useWatch("currency_code", form);
//   const primaryColor = Form.useWatch("primary_color", form);

//   // Initialize form with initialValues
//   useEffect(() => {
//     if (initialValues && !hasInitialized) {
//       form.setFieldsValue(initialValues);
//       setHasInitialized(true);
//     }
//   }, [initialValues, form, hasInitialized]);

//   // Handle logo initialization and updates
//   useEffect(() => {
//     // Only update fileList if logo has changed
//     if (prevLogoRef.current !== initialValues.company_logo) {
//       if (initialValues.company_logo) {
//         // Check if it's a base64 string or URL
//         const isBase64 = initialValues.company_logo.startsWith("data:image");
//         const isUrl = initialValues.company_logo.startsWith("http");

//         setFileList([
//           {
//             uid: "-1",
//             name: "company-logo",
//             status: "done",
//             url:
//               isBase64 || isUrl
//                 ? initialValues.company_logo
//                 : `data:image/jpeg;base64,${initialValues.company_logo}`,
//           },
//         ]);
//       } else {
//         setFileList([]);
//       }
//       prevLogoRef.current = initialValues.company_logo;
//     }
//   }, [initialValues.company_logo]);

//   // Handle form values change (without logo processing)
//   // const handleValuesChange = (changedValues: Partial<GeneralDraft>) => {
//   //   // Exclude company_logo from real-time updates
//   //   const { company_logo, ...otherValues } = changedValues as any;
//   //   onSave({
//   //     ...initialValues,
//   //     ...otherValues,
//   //     // Keep the existing logo in real-time updates
//   //     company_logo: initialValues.company_logo,
//   //   });
//   // };

//   const handleValuesChange = (changedValues: Partial<GeneralDraft>) => {
//     onSave({
//       ...initialValues,
//       ...changedValues,
//       company_logo: fileList[0]?.url || initialValues.company_logo || null,
//     });
//   };

//   // Handle file upload change
//   // const handleUploadChange: UploadProps["onChange"] = ({
//   //   fileList: newFileList,
//   // }) => {
//   //   setFileList(newFileList);
//   // };

//   const handleUploadChange: UploadProps["onChange"] = async ({
//     fileList: newFileList,
//   }) => {
//     setFileList(newFileList);

//     if (newFileList.length > 0) {
//       const file = newFileList[0].originFileObj as File | undefined;

//       if (file) {
//         const base64 = await fileToBase64(file); // convert to base64
//         const currentValues = form.getFieldsValue();
//         onSave({
//           ...currentValues,
//           company_logo: base64, // immediately update parent draft
//         });
//       } else {
//         // Already existing logo (base64 or URL)
//         const currentValues = form.getFieldsValue();
//         onSave({
//           ...currentValues,
//           company_logo:
//             newFileList[0]?.url || initialValues.company_logo || null,
//         });
//       }
//     } else {
//       // Logo removed
//       const currentValues = form.getFieldsValue();
//       onSave({
//         ...currentValues,
//         company_logo: null,
//       });
//     }
//   };

//   // Convert file to base64
//   const fileToBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = () => resolve(reader.result as string);
//       reader.onerror = reject;
//     });
//   };

//   // Handle form submit
//   const handleFinish = async (values: GeneralDraft) => {
//     setLoading(true);
//     try {
//       let logoBase64 = initialValues.company_logo || null;

//       // Check if there's a new file to process
//       const uploadedFile = fileList[0];

//       if (uploadedFile?.originFileObj) {
//         // New file uploaded
//         try {
//           logoBase64 = await fileToBase64(uploadedFile.originFileObj as File);
//         } catch (error) {
//           console.error("Error converting image to base64:", error);
//           message.error("Failed to process logo image");
//           setLoading(false);
//           return;
//         }
//       } else if (fileList.length === 0) {
//         // File was removed
//         logoBase64 = null;
//       }
//       // If fileList has a file but no originFileObj, it means it's the existing logo
//       // So we keep the existing logoBase64

//       // Prepare data for save
//       const saveData: GeneralDraft = {
//         ...values,
//         company_logo: logoBase64,
//       };

//       onSave(saveData);
//       message.success("Settings saved successfully!");
//     } catch (error) {
//       console.error("Error saving settings:", error);
//       message.error("Failed to save settings");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle form submission
//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       await handleFinish(values);
//     } catch (error) {
//       console.error("Form validation failed:", error);
//     }
//   };

//   // Before upload validation
//   const beforeUpload = (file: File) => {
//     const isImage = file.type.startsWith("image/");
//     if (!isImage) {
//       message.error("You can only upload image files!");
//     }

//     const isLt2M = file.size / 1024 / 1024 < 2;
//     if (!isLt2M) {
//       message.error("Image must be smaller than 2MB!");
//     }

//     return isImage && isLt2M;
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 md:p-6">
//       <Form
//         form={form}
//         layout="vertical"
//         onValuesChange={handleValuesChange}
//         onFinish={handleFinish}
//       >
//         <Row gutter={[24, 24]}>
//           {/* Company Information */}
//           <Col xs={24} md={12}>
//             <Card
//               title={
//                 <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <ApartmentOutlined
//                     style={{ color: "#1890ff", fontSize: 18 }}
//                   />
//                   Company Information
//                 </span>
//               }
//               className="rounded-xl shadow-sm h-full"
//             >
//               <Form.Item
//                 label="Company Name"
//                 name="company_name"
//                 rules={[
//                   { required: true, message: "Company name is required" },
//                 ]}
//               >
//                 <Input placeholder="Enter company name" />
//               </Form.Item>

//               <Form.Item label="Company Address" name="company_address">
//                 <Input.TextArea rows={3} />
//               </Form.Item>

//               <Form.Item label="Primary Color">
//                 <div className="flex w-full items-center gap-3">
//                   <Form.Item
//                     name="primary_color"
//                     noStyle
//                     initialValue="#1890ff"
//                   >
//                     <Input
//                       type="color"
//                       className="h-10 cursor-pointer"
//                       style={{
//                         width: "10%",
//                         padding: 4,
//                         borderRadius: 8,
//                       }}
//                     />
//                   </Form.Item>
//                   <Form.Item noStyle>
//                     <Input
//                       value={primaryColor || "#1890ff"}
//                       placeholder="#1890ff"
//                       onChange={(e) =>
//                         form.setFieldValue("primary_color", e.target.value)
//                       }
//                       style={{
//                         width: "90%",
//                       }}
//                     />
//                   </Form.Item>
//                 </div>
//               </Form.Item>

//               <Form.Item label="Company Logo">
//                 <Upload
//                   maxCount={1}
//                   listType="picture-card"
//                   beforeUpload={beforeUpload}
//                   fileList={fileList}
//                   onChange={handleUploadChange}
//                   onRemove={() => {
//                     setFileList([]);
//                     // Trigger immediate save when removing logo
//                     const currentValues = form.getFieldsValue();
//                     onSave({
//                       ...currentValues,
//                       company_logo: null,
//                     });
//                   }}
//                   accept="image/*"
//                 >
//                   {fileList.length === 0 && (
//                     <div>
//                       <UploadOutlined />
//                       <div style={{ marginTop: 8 }}>Upload</div>
//                     </div>
//                   )}
//                 </Upload>
//                 <div className="text-gray-500 text-xs mt-2">
//                   Recommended: Square logo, max 2MB, PNG or JPG format
//                 </div>
//               </Form.Item>
//             </Card>
//           </Col>

//           {/* Regional Settings */}
//           <Col xs={24} md={12}>
//             <Card
//               title={
//                 <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <FullscreenOutlined
//                     style={{ color: "#1890ff", fontSize: 18 }}
//                   />
//                   Regional Settings
//                 </span>
//               }
//               className="rounded-xl shadow-sm h-full"
//             >
//               <Form.Item
//                 label="Default Currency"
//                 name="currency_code"
//                 rules={[{ required: true, message: "Currency is required" }]}
//                 initialValue="USD"
//               >
//                 <Select placeholder="Select currency" optionLabelProp="label">
//                   {currencyOptions.map((c) => (
//                     <Option
//                       key={c.value}
//                       value={c.value}
//                       label={`${c.symbol} ${c.label}`}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           gap: 8,
//                           alignItems: "center",
//                         }}
//                       >
//                         <span>{c.symbol}</span>
//                         <span>{c.label}</span>
//                       </div>
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>

//               <Form.Item
//                 label="Date Format"
//                 name="date_format"
//                 rules={[{ required: true, message: "Date format is required" }]}
//                 initialValue="MM/DD/YYYY"
//               >
//                 <Select>
//                   <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
//                   <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
//                   <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
//                 </Select>
//               </Form.Item>
//             </Card>
//           </Col>

//         </Row>

//         {/* Save Button */}
//         <div className="mt-6 flex justify-end">
//           <Button
//             type="primary"
//             size="large"
//             onClick={handleSubmit}
//             loading={loading}
//           >
//             Save Settings
//           </Button>
//         </div>
//       </Form>
//     </div>
//   );
// };

// export default GeneralSettings;

import { FC, useEffect, useRef, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Select,
  message,
} from "antd";
import {
  UploadOutlined,
  ApartmentOutlined,
  FullscreenOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { currencyOptions } from "@/utils/currencyOptions";
import { GeneralDraft } from "@/types/invoice";

const { Option } = Select;

interface GeneralSettingsProps {
  initialValues: GeneralDraft;
  onSave: (data: GeneralDraft) => void;
}

const GeneralSettings: FC<GeneralSettingsProps> = ({
  initialValues,
  onSave,
}) => {
  const [form] = Form.useForm();

  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [signatureFileList, setSignatureFileList] = useState<UploadFile[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const prevLogoRef = useRef<string | null>(null);
  const prevSignatureRef = useRef<string | null>(null);

  const primaryColor = Form.useWatch("primary_color", form);

  /* ---------------- INIT FORM ---------------- */
  useEffect(() => {
    if (initialValues && !initialized) {
      form.setFieldsValue(initialValues);
      setInitialized(true);
    }
  }, [initialValues, initialized, form]);

  /* ---------------- INIT LOGO ---------------- */
  useEffect(() => {
    if (prevLogoRef.current !== initialValues.company_logo) {
      setLogoFileList(
        initialValues.company_logo
          ? [
              {
                uid: "-1",
                name: "company-logo",
                status: "done",
                url: initialValues.company_logo.startsWith("data:image")
                  ? initialValues.company_logo
                  : `data:image/jpeg;base64,${initialValues.company_logo}`,
              },
            ]
          : []
      );
      prevLogoRef.current = initialValues.company_logo || null;
    }
  }, [initialValues.company_logo]);

  /* ---------------- INIT SIGNATURE ---------------- */
  useEffect(() => {
    if (prevSignatureRef.current !== initialValues.company_signature) {
      setSignatureFileList(
        initialValues.company_signature
          ? [
              {
                uid: "-2",
                name: "company-signature",
                status: "done",
                url: initialValues.company_signature.startsWith("data:image")
                  ? initialValues.company_signature
                  : `data:image/jpeg;base64,${initialValues.company_signature}`,
              },
            ]
          : []
      );
      prevSignatureRef.current = initialValues.company_signature || null;
    }
  }, [initialValues.company_signature]);

  /* ---------------- HELPERS ---------------- */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) message.error("Only image files allowed");

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error("Image must be smaller than 2MB");

    return isImage && isLt2M;
  };

  /* ---------------- REALTIME SAVE ---------------- */
  const handleValuesChange = (changed: Partial<GeneralDraft>) => {
    onSave({
      ...initialValues,
      ...changed,
      company_logo: logoFileList[0]?.url || null,
      company_signature: signatureFileList[0]?.url || null,
    });
  };

  /* ---------------- LOGO UPLOAD ---------------- */
  const handleLogoChange: UploadProps["onChange"] = async ({ fileList }) => {
    setLogoFileList(fileList);

    let base64 = fileList[0]?.url || null;
    if (fileList[0]?.originFileObj) {
      base64 = await fileToBase64(fileList[0].originFileObj as File);
    }

    onSave({
      ...form.getFieldsValue(),
      company_logo: base64,
      company_signature: signatureFileList[0]?.url || null, // preserve signature
    });
  };

  /* ---------------- SIGNATURE UPLOAD ---------------- */
  const handleSignatureChange: UploadProps["onChange"] = async ({
    fileList,
  }) => {
    setSignatureFileList(fileList);

    let base64 = fileList[0]?.url || null;
    if (fileList[0]?.originFileObj) {
      base64 = await fileToBase64(fileList[0].originFileObj as File);
    }

    onSave({
      ...form.getFieldsValue(),
      company_logo: logoFileList[0]?.url || null, // preserve logo
      company_signature: base64,
    });
  };

  /* ---------------- SAVE BUTTON ---------------- */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      onSave({
        ...values,
        company_logo: logoFileList[0]?.url || null,
        company_signature: signatureFileList[0]?.url || null,
      });

      message.success("Settings saved successfully");
    } catch (err) {
      message.error("Validation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6">
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ApartmentOutlined />
                  Company Information
                </span>
              }
            >
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="company_address" label="Company Address">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item label="Primary Color">
                <div className="flex gap-3">
                  <Form.Item name="primary_color" noStyle>
                    <Input type="color" style={{ width: 60 }} />
                  </Form.Item>
                  <Input value={primaryColor} readOnly />
                </div>
              </Form.Item>

              <Form.Item label="Company Logo">
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  beforeUpload={beforeUpload}
                  onChange={handleLogoChange}
                  maxCount={1}
                >
                  {logoFileList.length === 0 && <UploadOutlined />}
                </Upload>
                <p className="text-xs text-gray-500">
                  Recommended: Square logo, max 2MB, PNG or JPG format
                </p>
              </Form.Item>
            </Card>
          </Col>

          {/* RIGHT COLUMN (STACKED) */}
          <Col xs={24} md={12}>
            <div className="flex flex-col gap-7">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <FullscreenOutlined />
                    Regional Settings
                  </span>
                }
              >
                <Form.Item
                  name="currency_code"
                  label="Currency"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {currencyOptions.map((c) => (
                      <Option key={c.value} value={c.value}>
                        {c.symbol} {c.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="date_format"
                  label="Date Format"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Card
                title={
                  <span className="flex items-center gap-2">
                    <EditOutlined />
                    Signature Settings
                  </span>
                }
              >
                <Form.Item label="Authorized Signature">
                  <Upload
                    listType="picture-card"
                    fileList={signatureFileList}
                    beforeUpload={beforeUpload}
                    onChange={handleSignatureChange}
                    maxCount={1}
                  >
                    {signatureFileList.length === 0 && <UploadOutlined />}
                  </Upload>
                  <p className="text-xs text-gray-500">
                    Upload PNG/JPG, max 2MB
                  </p>
                </Form.Item>
              </Card>
            </div>
          </Col>
        </Row>

        <div className="mt-6 flex justify-end">
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default GeneralSettings;
