"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  Form,
  Button,
  Select,
  Input,
  Space,
  Typography,
  notification,
  DatePicker,
  Row,
  Col,
  Alert,
  Tag,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import dayjs from "dayjs";
import {
  useCreateReimbursement,
  useReimbursementById,
  useUpdateReimbursement,
} from "@/hooks/usereimbursementcreate";
import {
  ReimbursementService,
  CategoryLimit,
} from "@/services/reimbursementcreateService";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Status enum matching backend
const REIMBURSEMENT_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

// File interface for preview
interface UploadedFile {
  base64: string;
  fileName: string;
  fileType: string;
  file?: File;
}

// Reimbursement Item Interface
interface ReimbursementItem {
  id: string;
  category: string;
  date: string | null;
  billNo: string;
  amount: number | null;
  description: string;
  attachments: UploadedFile[];
}

// Category option with limit info
interface CategoryOption {
  value: string;
  label: string;
  maxAmount: number;
  periodType: string;
}

function CreateReimbursementPageInner() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const reimbursementId = searchParams.get("id");
  const router = useRouter();

  const { canCreateReimbursement, canUpdateReimbursement } = usePermission();

  if (isLoading) {
    return (
      <MainLayout>
        <ZukvoLoader message="Loading..." />
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  const isEditing = !!reimbursementId;
  const hasPermission = isEditing ? canUpdateReimbursement : canCreateReimbursement;

  if (!hasPermission) {
    router.push("/reimbursement");
    return null;
  }

  return (
    <MainLayout>
      <CreateReimbursementContent
        user={user}
        reimbursementId={reimbursementId}
      />
    </MainLayout>
  );
}

interface CreateReimbursementContentProps {
  user: any;
  reimbursementId: string | null;
}

function CreateReimbursementContent({
  user,
  reimbursementId,
}: CreateReimbursementContentProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // State for loading existing reimbursement
  const [loadingReimbursement, setLoadingReimbursement] =
    useState(!!reimbursementId);

  // ===== Category limits state =====
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // ===== File preview modal state =====
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  // Add this state to track which categories require attachments
  const [categoryAttachmentRequired, setCategoryAttachmentRequired] = useState<Record<string, boolean>>({});

  // Use the create and update mutation hooks
  const createMutation = useCreateReimbursement();
  const updateMutation = useUpdateReimbursement();

  // Fetch reimbursement data if editing
  const {
    data: existingReimbursement,
    isLoading: fetchingReimbursement,
    refetch: refetchReimbursement,
  } = useReimbursementById(reimbursementId || "");

  // State for multiple reimbursement items
  const [reimbursementItems, setReimbursementItems] = useState<
    ReimbursementItem[]
  >([
    {
      id: `item_${Date.now()}_0`,
      category: "",
      date: null,
      billNo: "",
      amount: null,
      description: "",
      attachments: [],
    },
  ]);

  // Track all files for upload
  const [allFiles, setAllFiles] = useState<File[]>([]);

  // Track which button is loading
  const [actionLoading, setActionLoading] = useState<{
    saveDraft: boolean;
    submit: boolean;
  }>({
    saveDraft: false,
    submit: false,
  });

  // ===== Load category limits on page load =====
  useEffect(() => {
    loadCategoryLimits();
  }, []);

  // ===== Load existing reimbursement data when editing =====
  useEffect(() => {
    if (existingReimbursement && reimbursementId) {
      console.log("📝 Loading existing reimbursement:", existingReimbursement);
      loadReimbursementData(existingReimbursement);
      setLoadingReimbursement(false);
    }
  }, [existingReimbursement, reimbursementId]);

  const loadReimbursementData = (data: any) => {
    console.log("Loading reimbursement data:", data);

    if (!data || !data.items || data.items.length === 0) {
      console.log("No items found in reimbursement data");
      return;
    }

    // Full API response structure check
    console.log("Full data object:", JSON.stringify(data, null, 2));

    // Transform the API response to match our component state
    const items: ReimbursementItem[] = data.items.map(
      (item: any, index: number) => {
        console.log(`Processing item ${index}:`, item);

        // Check all possible attachment locations
        console.log(`Item ${index} attachments:`, item.attachments);
        console.log(`Item ${index} files:`, item.files);
        console.log(`Item ${index} documents:`, item.documents);
        console.log(`Item ${index} receipts:`, item.receipts);

        // Try different possible attachment field names
        const attachmentsData =
          item.attachments ||
          item.files ||
          item.documents ||
          item.receipts ||
          [];

        console.log(`Item ${index} attachments data found:`, attachmentsData);

        // Convert existing attachments to UploadedFile format
        const existingFiles: UploadedFile[] = attachmentsData.map(
          (att: any) => {
            console.log(`Processing attachment:`, att);
            return {
              base64: att.fileUrl || att.url || att.path || "",
              fileName:
                att.fileName || att.name || att.originalName || "unknown",
              fileType: att.fileType || att.mimeType || att.type || "unknown",
              file: undefined,
            };
          },
        );

        console.log(`Item ${index} attachments processed:`, existingFiles);

        return {
          id: `item_${Date.now()}_${index}`,
          category: item.category || "",
          date: item.date || null,
          billNo: item.billNo || "",
          amount: item.amount || null,
          description: item.description || "",
          attachments: existingFiles,
        };
      },
    );

    console.log("Transformed items with attachments:", items);
    setReimbursementItems(items);

    // Update form fields
    form.setFieldsValue({
      items: items,
    });
  };

  const loadCategoryLimits = async () => {
    try {
      setLoadingLimits(true);
      setCategoryError(null);

      const limits = await ReimbursementService.getUserCategoryLimits();

      console.log("✅ Loaded category limits:", limits);

      if (limits && limits.length > 0) {
        setCategoryLimits(limits);

        const options: CategoryOption[] = limits.map((limit) => ({
          value: limit.categoryId,
          label: limit.categoryId,
          maxAmount: limit.maxAmount,
          periodType: limit.periodType,
        }));

        setCategoryOptions(options);

        if (limits.length > 0) {
          await loadCategoryNames(limits);
        }
      } else {
        console.log("No category limits found for this user");
        setCategoryLimits([]);
        setCategoryOptions([]);

        api.info({
          message: "No Limits Found",
          description:
            "No reimbursement policies are configured for your position",
          placement: "bottomRight",
          duration: 4,
        });
      }
    } catch (error: any) {
      console.error("Failed to load category limits:", error);
      setCategoryError(error.message || "Failed to load category limits");
      setCategoryLimits([]);
      setCategoryOptions([]);
    } finally {
      setLoadingLimits(false);
    }
  };

  // const loadCategoryNames = async (limits: CategoryLimit[]) => {
  //   try {
  //     const categoryIds = limits.map((limit) => limit.categoryId);

  //     const response = await fetch("/api/reimbursement-categories/by-ids", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ ids: categoryIds }),
  //     });

  //     const result = await response.json();

  //     if (result.success) {
  //       const categories = result.data;

  //       const options: CategoryOption[] = limits.map((limit) => {
  //         const category = categories.find(
  //           (c: any) => c.id === limit.categoryId,
  //         );
  //         return {
  //           value: limit.categoryId,
  //           label: category?.name || limit.categoryId,
  //           maxAmount: limit.maxAmount,
  //           periodType: limit.periodType,
  //         };
  //       });

  //       setCategoryOptions(options);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load category names:", error);
  //   }
  // };

  // Get max amount for a category
  const loadCategoryNames = async (limits: CategoryLimit[]) => {
    try {
      const categoryIds = limits.map((limit) => limit.categoryId);

      const response = await fetch("/api/reimbursement-categories/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: categoryIds }),
      });

      const result = await response.json();

      if (result.success) {
        const categories = result.data;

        // Store attachmentRequired for each category
        const attachmentRequiredMap: Record<string, boolean> = {};
        categories.forEach((category: any) => {
          attachmentRequiredMap[category.id] = category.attachmentRequired || false;
        });
        setCategoryAttachmentRequired(attachmentRequiredMap);

        const options: CategoryOption[] = limits.map((limit) => {
          const category = categories.find(
            (c: any) => c.id === limit.categoryId,
          );
          return {
            value: limit.categoryId,
            label: category?.name || limit.categoryId,
            maxAmount: limit.maxAmount,
            periodType: limit.periodType,
          };
        });

        setCategoryOptions(options);

        console.log("📋 Category attachment requirements:", attachmentRequiredMap);
      }
    } catch (error) {
      console.error("Failed to load category names:", error);
    }
  };



  const getMaxAmountForCategory = (categoryId: string): number => {
    const option = categoryOptions.find((opt) => opt.value === categoryId);
    return option?.maxAmount || 0;
  };

  // Get period type for a category
  const getPeriodTypeForCategory = (categoryId: string): string => {
    const option = categoryOptions.find((opt) => opt.value === categoryId);
    return option?.periodType || "MONTH";
  };

  // Validate amount against category limit
  const validateAmount = (
    categoryId: string,
    amount: number | null,
  ): string | null => {
    if (!categoryId || !amount) return null;

    const maxAmount = getMaxAmountForCategory(categoryId);
    if (amount > maxAmount) {
      const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
      return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
    }
    return null;
  };

  // Handle Add Item
  const handleAddItem = () => {
    setReimbursementItems([
      ...reimbursementItems,
      {
        id: `item_${Date.now()}_${reimbursementItems.length}`,
        category: "",
        date: null,
        billNo: "",
        amount: null,
        description: "",
        attachments: [],
      },
    ]);
  };

  // Handle Remove Item
  const handleRemoveItem = (index: number) => {
    if (reimbursementItems.length === 1) {
      api.warning({
        message: "Warning",
        description: "At least one reimbursement item is required",
        placement: "bottomRight",
        duration: 3,
      });
      return;
    }

    const itemToRemove = reimbursementItems[index];
    const filesToRemove = itemToRemove.attachments.map((att) => att.fileName);
    setAllFiles((prev) =>
      prev.filter((file) => !filesToRemove.includes(file.name)),
    );

    const newItems = reimbursementItems.filter((_, i) => i !== index);
    setReimbursementItems(newItems);
  };

  // Handle Field Change
  const handleItemChange = (
    index: number,
    field: keyof ReimbursementItem,
    value: any,
  ) => {
    const newItems = [...reimbursementItems];

    // If field is 'amount', ensure it's stored as a number
    if (field === "amount") {
      (newItems[index][field] as any) = value ? Number(value) : null;
    } else {
      (newItems[index][field] as any) = value;
    }

    setReimbursementItems(newItems);
  };

  // Handle File Upload
  const handleFileUpload = async (
    index: number,
    base64File: string,
    fileName: string,
  ) => {
    try {
      const response = await fetch(base64File);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      setAllFiles((prev) => [...prev, file]);

      const newFile: UploadedFile = {
        base64: base64File,
        fileName: fileName,
        fileType: fileName.split(".").pop() || "unknown",
        file: file,
      };

      const newItems = [...reimbursementItems];
      newItems[index].attachments.push(newFile);
      setReimbursementItems(newItems);

      api.success({
        message: "Success",
        description: "File uploaded successfully",
        placement: "bottomRight",
        duration: 2,
      });
    } catch (error) {
      console.error("File upload error:", error);
      api.error({
        message: "Error",
        description: "Failed to upload file",
        placement: "bottomRight",
        duration: 3,
      });
    }
  };

  // Handle Delete Attachment
  const handleDeleteAttachment = async (
    itemIndex: number,
    fileToDelete: UploadedFile,
  ) => {
    try {
      // If it's a new file (has file object), remove from allFiles state
      if (fileToDelete.file) {
        setAllFiles((prev) =>
          prev.filter((f) => f.name !== fileToDelete.fileName),
        );
      } else {
        // If it's an existing file from server, you might want to:
        // Option 1: Mark for deletion on server (recommended)
        // Add to a state for files to delete on server
        // setFilesToDelete(prev => [...prev, fileToDelete]);

        // Option 2: Just remove from UI and handle on save
        // For now, we'll just remove from UI
        console.log(
          "Existing file marked for deletion:",
          fileToDelete.fileName,
        );
      }

      // Remove from UI immediately
      const newItems = [...reimbursementItems];
      newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
        (file) => file.fileName !== fileToDelete.fileName,
      );
      setReimbursementItems(newItems);

      api.success({
        message: "Success",
        description: "File removed",
        placement: "bottomRight",
        duration: 2,
      });
    } catch (error) {
      console.error("File delete error:", error);
      api.error({
        message: "Error",
        description: "Failed to delete file",
        placement: "bottomRight",
        duration: 3,
      });
    }
  };

  // Handle View File in Modal
  const handleViewFile = (file: UploadedFile) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // Handle Download File
  const handleDownloadFile = (file: UploadedFile) => {
    const link = document.createElement("a");
    link.href = file.base64;
    link.download = file.fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get iframe URL for preview
  const getIframeUrl = (file: UploadedFile): string => {
    const fileName = file.fileName?.toLowerCase() || "";
    const fileType = file.fileType || "";

    if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(file.base64)}&embedded=true`;
    }

    if (
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".ppt") ||
      fileName.endsWith(".pptx")
    ) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.base64)}`;
    }

    if (
      fileType?.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif")
    ) {
      return file.base64;
    }

    return `https://docs.google.com/viewer?url=${encodeURIComponent(file.base64)}&embedded=true`;
  };

  // Validate Form
  // const validateForm = () => {
  //   const totalAttachments = reimbursementItems.reduce(
  //     (sum, item) => sum + item.attachments.length,
  //     0,
  //   );

  //   // For new submissions, require at least one attachment
  //   if (!reimbursementId && totalAttachments === 0) {
  //     api.error({
  //       message: "Validation Error",
  //       description: "Please upload at least one attachment",
  //       placement: "bottomRight",
  //       duration: 3,
  //     });
  //     return false;
  //   }

  //   for (let i = 0; i < reimbursementItems.length; i++) {
  //     const item = reimbursementItems[i];

  //     if (!item.category) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: Please select a category`,
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       return false;
  //     }

  //     if (!item.date) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: Please select a date`,
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       return false;
  //     }

  //     if (!item.billNo?.trim()) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: Please enter bill number`,
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       return false;
  //     }

  //     if (!item.amount || item.amount <= 0) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: Please enter a valid amount`,
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       return false;
  //     }

  //     const amountError = validateAmount(item.category, item.amount);
  //     if (amountError) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: ${amountError}`,
  //         placement: "bottomRight",
  //         duration: 4,
  //       });
  //       return false;
  //     }

  //     if (!item.description?.trim()) {
  //       api.error({
  //         message: "Validation Error",
  //         description: `Item #${i + 1}: Please enter a description`,
  //         placement: "bottomRight",
  //         duration: 3,
  //       });
  //       return false;
  //     }
  //   }

  //   return true;
  // };








  // Validate Form
  const validateForm = () => {
    // First check if any attachments are required
    let hasRequiredAttachments = true;

    for (let i = 0; i < reimbursementItems.length; i++) {
      const item = reimbursementItems[i];

      if (!item.category) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please select a category`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      // Check if attachment is required for this category
      const isAttachmentRequired = categoryAttachmentRequired[item.category];

      // If attachment is required and this item has no attachments, show error
      if (isAttachmentRequired && item.attachments.length === 0) {
        const categoryName = categoryOptions.find(opt => opt.value === item.category)?.label || item.category;
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Attachments are required for ${categoryName} category`,
          placement: "bottomRight",
          duration: 4,
        });
        hasRequiredAttachments = false;
        return false;
      }

      if (!item.date) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please select a date`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      if (!item.billNo?.trim()) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter bill number`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      if (!item.amount || item.amount <= 0) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter a valid amount`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      const amountError = validateAmount(item.category, item.amount);
      if (amountError) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: ${amountError}`,
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      if (!item.description?.trim()) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter a description`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }
    }

    return hasRequiredAttachments;
  };

  // Transform items to match backend format
  // const transformItemsForBackend = () => {
  //   return reimbursementItems.map((item) => ({
  //     category: item.category,
  //     // date: item.date,
  //      date: item.date || new Date().toISOString().split('T')[0],
  //     billNo: item.billNo,
  //     amount: item.amount ? Number(item.amount) : 0,
  //     description: item.description,
  //   }));
  // };
  //   const transformItemsForBackend = () => {
  //   return reimbursementItems.map((item) => {

  //     const attachmentIndexes = item.attachments
  //       .map((att) =>
  //         allFiles.findIndex((file) => file.name === att.fileName)
  //       )
  //       .filter((index) => index !== -1);

  //     return {
  //       category: item.category,
  //       date: item.date || new Date().toISOString().split("T")[0],
  //       billNo: item.billNo,
  //       amount: item.amount ? Number(item.amount) : 0,
  //       description: item.description,
  //       attachments: attachmentIndexes // ⭐ important
  //     };
  //   });
  // };
  const transformItemsForBackend = () => {
    return reimbursementItems.map((item) => {
      // Get indexes of new files
      const attachmentIndexes = item.attachments
        .map((att) =>
          att.file ? allFiles.findIndex((file) => file.name === att.fileName) : -1
        )
        .filter((index) => index !== -1);

      // Get existing attachments (from server, no file object)
      const existingAttachments = item.attachments
        .filter((att) => !att.file)
        .map((att) => ({
          fileName: att.fileName,
          fileUrl: att.base64, // or att.fileUrl from server
          fileSize: 0, // You might need to store this
          fileType: att.fileType,
          uploadedBy: undefined // You might need to store this
        }));

      return {
        category: item.category,
        date: item.date || new Date().toISOString().split("T")[0],
        billNo: item.billNo,
        amount: item.amount ? Number(item.amount) : 0,
        description: item.description,
        attachments: attachmentIndexes, // New file indexes
        existingAttachments: existingAttachments, // ⭐ Send existing attachments too
      };
    });
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setActionLoading((prev) => ({ ...prev, saveDraft: true }));

    try {
      const itemsData = transformItemsForBackend();

      if (reimbursementId) {
        // Update existing draft
        await updateMutation.mutateAsync({
          id: reimbursementId,
          data: {
            items: itemsData,
            status: REIMBURSEMENT_STATUS.DRAFT,
          },
          files: allFiles,
        });

        api.success({
          message: "Success",
          description: "Draft updated successfully",
          placement: "bottomRight",
          duration: 2,
        });
      } else {
        // Create new draft
        await createMutation.mutateAsync({
          items: itemsData,
          files: allFiles,
          status: REIMBURSEMENT_STATUS.DRAFT,
        });

        api.success({
          message: "Success",
          description: "Reimbursement saved as draft",
          placement: "bottomRight",
          duration: 2,
        });
      }

      setTimeout(() => {
        router.push("/reimbursements/view");
      }, 1000);
    } catch (error: any) {
      console.error("Save draft error:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to save draft",
        placement: "bottomRight",
        duration: 3,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, saveDraft: false }));
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setActionLoading((prev) => ({ ...prev, submit: true }));

    try {
      const itemsData = transformItemsForBackend();

      console.log("📦 REIMBURSEMENT PAYLOAD:");
      console.log("Items:", JSON.stringify(itemsData, null, 2));
      console.log(
        "New Files:",
        allFiles.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      );
      console.log("Status:", REIMBURSEMENT_STATUS.SUBMITTED);

      let result;
      if (reimbursementId) {
        // Update existing and submit
        result = await updateMutation.mutateAsync({
          id: reimbursementId,
          data: {
            items: itemsData,
            status: REIMBURSEMENT_STATUS.SUBMITTED,
          },
          files: allFiles,
        });

        console.log("✅ Update successful, result:", result);

        api.success({
          message: "Success",
          description: "Reimbursement updated and submitted successfully!",
          placement: "bottomRight",
          duration: 2,
        });
      } else {
        // Create new and submit
        result = await createMutation.mutateAsync({
          items: itemsData,
          files: allFiles,
          status: REIMBURSEMENT_STATUS.SUBMITTED,
        });

        api.success({
          message: "Success",
          description: "Reimbursement submitted successfully!",
          placement: "bottomRight",
          duration: 2,
        });
      }

      setTimeout(() => {
        router.push("/reimbursement");
      }, 1000);
    } catch (error: any) {
      console.error("❌ Submit error:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to submit reimbursement",
        placement: "bottomRight",
        duration: 3,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Calculate Total Amount
  const getTotalAmount = () => {
    return reimbursementItems.reduce((sum, item) => {
      const amount =
        typeof item.amount === "string"
          ? parseFloat(item.amount) || 0
          : typeof item.amount === "number" && !isNaN(item.amount)
            ? item.amount
            : 0;
      return sum + amount;
    }, 0);
  };

  const handleBack = () => {
    router.push("/reimbursement");
  };

  // Only show full page loading for initial data fetch when editing
  const isInitialLoading =
    (fetchingReimbursement && reimbursementId) || loadingReimbursement;

  if (isInitialLoading) {
    return (
      <MainLayout>
        <ZukvoLoader message="Loading reimbursement data..." />
      </MainLayout>
    );
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {contextHolder}

      {/* Header with Back Button */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            type="text"
            size="small"
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {reimbursementId
              ? "Edit Reimbursement Request"
              : "Create Reimbursement Request"}
          </Title>
        </Space>
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 32 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        {reimbursementId && existingReimbursement && (
          <div style={{ marginTop: 8, marginLeft: 32 }}>
            <Tag
              color={
                existingReimbursement.status === "DRAFT" ? "default" : "blue"
              }
            >
              Status: {existingReimbursement.status}
            </Tag>
          </div>
        )}
      </div>

      {/* Category Limits Summary - Only this shows loading state for limits */}
      {/* {loadingLimits ? (
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
        >
          <ZukvoLoader size="md" message="Loading your reimbursement limits..." />
        </Card>
      ) : (
        categoryOptions.length > 0 && (
          <Card
            size="small"
            style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>Your Reimbursement Limits:</Text>
              <Space size={16} wrap>
                {categoryOptions.map((opt) => (
                  <Text key={opt.value} style={{ fontSize: 12 }}>
                    {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
                  </Text>
                ))}
              </Space>
            </div>
          </Card>
        )
      )} */}

      {/* Error Alert */}
      {categoryError && (
        <Alert
          message="Error Loading Limits"
          description={categoryError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Form Card */}
      <Card
        style={{
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        styles={{
          body: {
            padding: "16px 20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Scrollable Content Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 8,
              marginBottom: 16,
            }}
          >
            {/* Reimbursement Items Section */}
            <div style={{ marginBottom: 16 }}>
              <Text
                strong
                style={{ fontSize: 15, display: "block", marginBottom: 12 }}
              >
                Reimbursement Items
              </Text>

              {reimbursementItems.map((item, index) => {
                const amountError =
                  item.category && item.amount
                    ? validateAmount(item.category, item.amount)
                    : null;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: 6,
                      padding: "12px 14px",
                      marginBottom: 12,
                      backgroundColor: "#fafafa",
                      position: "relative",
                    }}
                  >
                    {/* Item Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
                        Expense #{index + 1}
                      </Text>
                      {reimbursementItems.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(index)}
                          disabled={
                            actionLoading.saveDraft || actionLoading.submit
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Category and Date */}
                    <Row gutter={12} style={{ marginBottom: 10 }}>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Category{" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          {/* <Select
                            placeholder={
                              loadingLimits ? "Loading categories..." : "Select"
                            }
                            value={item.category || undefined}
                            onChange={(value) => {
                              handleItemChange(index, "category", value);
                              if (item.amount) {
                                const error = validateAmount(
                                  value,
                                  item.amount,
                                );
                                if (error) {
                                  api.warning({
                                    message: "Limit Warning",
                                    description: error,
                                    placement: "bottomRight",
                                    duration: 3,
                                  });
                                }
                              }
                            }}
                            options={categoryOptions}
                            style={{ width: "100%" }}
                            size="small"
                            disabled={
                              actionLoading.saveDraft ||
                              actionLoading.submit ||
                              loadingLimits
                            }
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            loading={loadingLimits}
                          /> */}
                          <Select
                            placeholder={loadingLimits ? "Loading categories..." : "Select"}
                            value={item.category || undefined}
                            onChange={(value) => {
                              handleItemChange(index, "category", value);
                              if (item.amount) {
                                const error = validateAmount(value, item.amount);
                                if (error) {
                                  api.warning({
                                    message: "Limit Warning",
                                    description: error,
                                    placement: "bottomRight",
                                    duration: 3,
                                  });
                                }
                              }
                            }}
                            style={{ width: "100%" }}
                            size="small"
                            disabled={actionLoading.saveDraft || actionLoading.submit || loadingLimits}
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label?.toString() ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            loading={loadingLimits}
                          >
                            {categoryOptions.map(opt => (
                              <Select.Option key={opt.value} value={opt.value}>
                                <Space>
                                  {opt.label}
                                  {categoryAttachmentRequired[opt.value] && (
                                    <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>
                                      Attachment Required
                                    </Tag>
                                  )}
                                </Space>
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Date <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Select"
                            value={item.date ? dayjs(item.date) : null}
                            // onChange={(date) =>
                            //   handleItemChange(
                            //     index,
                            //     "date",
                            //     date ? date.toISOString() : null,
                            //   )
                            // }
                            onChange={(date) =>
                              handleItemChange(
                                index,
                                "date",
                                date ? date.format("YYYY-MM-DD") : null, // ✅ This keeps the date as is
                              )
                            }
                            format="DD-MM-YYYY"
                            size="small"
                            disabled={
                              actionLoading.saveDraft || actionLoading.submit
                            }
                            disabledDate={(current) =>
                              current && current > dayjs().endOf("day")
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={12} style={{ marginBottom: 10 }}>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Bill No{" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Enter bill no"
                            value={item.billNo}
                            onChange={(e) =>
                              handleItemChange(index, "billNo", e.target.value)
                            }
                            size="small"
                            disabled={
                              actionLoading.saveDraft || actionLoading.submit
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Amount (₹){" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                          validateStatus={amountError ? "error" : undefined}
                          help={amountError}
                        >
                          <Input
                            type="number"
                            placeholder={`Enter amount (max ₹${getMaxAmountForCategory(item.category)})`}
                            value={item.amount || undefined}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "amount",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              )
                            }
                            prefix="₹"
                            min={0}
                            max={getMaxAmountForCategory(item.category)}
                            step={0.01}
                            size="small"
                            disabled={
                              actionLoading.saveDraft ||
                              actionLoading.submit ||
                              !item.category
                            }
                            status={amountError ? "error" : undefined}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Row 3: Description */}
                    <Form.Item
                      label={
                        <span style={{ fontSize: 12 }}>
                          Description{" "}
                          <span style={{ color: "#ff4d4f" }}>*</span>
                        </span>
                      }
                      required={false}
                      style={{ marginBottom: 10 }}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Describe expense details..."
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        size="small"
                        disabled={
                          actionLoading.saveDraft || actionLoading.submit
                        }
                      />
                    </Form.Item>

                    {/* Row 4: Attachments */}
                    {/* <Form.Item
                      label={
                        <span style={{ fontSize: 12 }}>
                          Attachments
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, marginLeft: 4 }}
                          >
                            {!reimbursementId
                              ? "(Required - at least one)"
                              : "(Upload new files to add more)"}
                          </Text>
                        </span>
                      }
                      style={{ marginBottom: 0 }}
                    > */}
                    <Form.Item
                      label={
                        <span style={{ fontSize: 12 }}>
                          Attachments
                          {item.category && categoryAttachmentRequired[item.category] ? (
                            <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>
                              Required
                            </Tag>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                              {item.category ? "(Optional)" : "(Select category first)"}
                            </Text>
                          )}
                        </span>
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <AttachmentUploader
                          onUpload={(base64File, fileName) =>
                            handleFileUpload(index, base64File, fileName)
                          }
                          maxSize={5}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={
                            actionLoading.saveDraft || actionLoading.submit
                          }
                        />

                        {/* Show ALL attachments (existing + new) */}
                        {item.attachments && item.attachments.length > 0 ? (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {reimbursementId
                                ? "Current Attachments:"
                                : "Attachments:"}
                            </Text>
                            {item.attachments.map((file, fileIndex) => {
                              // Check if this is an existing attachment (no file object) or new one
                              const isExisting = !file.file;

                              return (
                                <div
                                  key={`${file.fileName}_${fileIndex}_${isExisting ? "existing" : "new"}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "4px 8px",
                                    border: "1px solid #e8e8e8",
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    backgroundColor: isExisting
                                      ? "#f9f9f9"
                                      : "#fff",
                                  }}
                                >
                                  <span style={{ fontSize: 12 }}>
                                    {file.fileName}
                                  </span>
                                  <Space size={4}>
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<EyeOutlined />}
                                      onClick={() => handleViewFile(file)}
                                      disabled={
                                        actionLoading.saveDraft ||
                                        actionLoading.submit
                                      }
                                    />
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() =>
                                        handleDeleteAttachment(index, file)
                                      }
                                      disabled={
                                        actionLoading.saveDraft ||
                                        actionLoading.submit
                                      }
                                    />
                                  </Space>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No attachments
                          </Text>
                        )}
                      </Space>
                    </Form.Item>
                  </div>
                );
              })}

              {/* Add Item Button */}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ width: "100%", marginTop: 4 }}
                size="small"
                disabled={actionLoading.saveDraft || actionLoading.submit}
              >
                Add Another Expense
              </Button>
            </div>

            {/* Total Amount Display */}
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#f0f5ff",
                borderRadius: 6,
                border: "1px solid #adc6ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Total Amount:
              </Text>
              <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
                ₹
                {(() => {
                  const total = getTotalAmount();
                  return Number(total).toFixed(2);
                })()}
              </Text>
            </div>
          </div>

          {/* Fixed Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid #e8e8e8",
              paddingTop: 16,
              flexShrink: 0,
              backgroundColor: "#fff",
            }}
          >
            <Button
              onClick={handleSaveDraft}
              loading={actionLoading.saveDraft}
              icon={<SaveOutlined />}
              size="middle"
              disabled={actionLoading.submit}
            >
              {reimbursementId ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              onClick={handleBack}
              size="middle"
              disabled={actionLoading.saveDraft || actionLoading.submit}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={actionLoading.submit}
              size="middle"
              disabled={actionLoading.saveDraft}
            >
              {reimbursementId ? "Update & Submit" : "Submit"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* File Preview Modal */}
      <Modal
        title={
          <Space>
            <span>{previewFile?.fileName || "Document Preview"}</span>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => previewFile && handleDownloadFile(previewFile)}
            >
              Download
            </Button>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
        width={1000}
        styles={{ body: { height: "80vh", padding: 0 } }}
      >
        {previewFile && (
          <iframe
            src={getIframeUrl(previewFile)}
            style={{ width: "100%", height: "100%", border: "none" }}
            title={previewFile.fileName}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            referrerPolicy="no-referrer"
            allow="autoplay *; fullscreen *"
          />
        )}
      </Modal>
    </div>
  );
}

export default function CreateReimbursementPage() {
  return (
    <Suspense>
      <CreateReimbursementPageInner />
    </Suspense>
  );
}
