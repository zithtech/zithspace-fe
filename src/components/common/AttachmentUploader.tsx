"use client";

import React, { useState, useRef } from "react";
import { Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

interface AttachmentUploaderProps {
  onUpload: (file: string, fileName: string) => Promise<void>;
  maxSize?: number; // in MB
  accept?: string;
  disabled?: boolean;
}

export default function AttachmentUploader({
  onUpload,
  maxSize = 5,
  accept = "*",
  disabled = false,
}: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);

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
      setUploading(true);
      
      // Convert file to base64
      const base64File = await convertFileToBase64(file);
      
      // Call the upload handler
      await onUpload(base64File, file.name);
      
      message.success(`${file.name} uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      message.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }

    // Prevent default upload behavior
    return false;
  };

  return (
    <Dragger
      name="file"
      multiple={false}
      beforeUpload={handleUpload}
      showUploadList={false}
      disabled={disabled || uploading}
      accept={accept}
      style={{ marginBottom: 16 }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint">
        Support for any file type. Maximum file size: {maxSize}MB
      </p>
      {uploading && <p style={{ color: "#1890ff" }}>Uploading...</p>}
    </Dragger>
  );
}
