
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
      <Button icon={<UploadOutlined />} loading={isUploading} disabled={disabled} style={style} size="small">
        {isUploading ? `Uploading (${activeUploads})...` : "Attach File"}
      </Button>
    </Upload>
  );
}


