
"use client";

import React, { useState, useRef } from "react";
import { Upload, message, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface AttachmentUploaderProps {
 onUpload: (file: string, fileName: string) => Promise<void>;
  maxSize?: number; // in MB
  accept?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function AttachmentUploader({
  onUpload,
  maxSize = 5,
  accept = "*",
  disabled = false,
  style,
}: AttachmentUploaderProps) {
  const [activeUploads, setActiveUploads] = useState(0);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };




  const handleUpload = async (file: File) => {
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      message.error(`File size must be less than ${maxSize}MB`);
      return false;
    }

    try {
      setActiveUploads((prev) => prev + 1);

      // Convert file to base64
      const base64File = await convertFileToBase64(file);
      
            // Call the upload handler
      await onUpload(base64File, file.name); 
      message.success(`${file.name} uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      message.error(error.message || "Failed to upload file");
    } finally {
      setActiveUploads((prev) => Math.max(0, prev - 1));
    }

    // Prevent default upload behavior
    return false;
  };

  const isUploading = activeUploads > 0;

  return (
    <Upload
      name="file"
      multiple={true}
      beforeUpload={handleUpload}
      showUploadList={false}
      disabled={disabled}
      accept={accept}
    >
      <Button 
        icon={<UploadOutlined style={{ fontSize: 13 }} />} 
        loading={isUploading} 
        disabled={disabled} 
        style={{ 
          ...style,
          height: 32,
          borderRadius: 8,
          fontWeight: 600,
          background: isUploading ? "#f0f0f0" : "#fafafa",
          border: "1px dashed #d9d9d9",
          color: "#595959",
          transition: "all 0.2s"
        }} 
        size="small"
        className="uploader-button"
      >
        {isUploading ? `Uploading (${activeUploads})...` : "Click to attach or drag files"}
      </Button>

      <style jsx global>{`
        .uploader-button:hover:not(:disabled) {
          border-color: #1890ff !important;
          color: #1890ff !important;
          background: #e6f7ff !important;
        }
      `}</style>
    </Upload>
  );
}


