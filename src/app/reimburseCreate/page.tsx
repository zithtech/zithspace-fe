"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
import {
  Card,
  Typography,
  Form,
  Select,
  Divider,
} from "antd";
import { FileTextOutlined, EyeOutlined, FileProtectOutlined } from "@ant-design/icons";
import ExpenseBuilder from "@/components/reimbursement/ExpenseBuilder"
import { ReimbursementService } from "@/services/reimbursementService";

const { Title } = Typography;

type ExpenseItem = {
  date?: any;
  amount?: number;
  billNo?: string;
  description?: string;
  files?: any[];
};

type Mode = "empty" | "form" | "list" | "review";

export default function ReimburseCreatePage() {
  const router = useRouter();
  const [form] = Form.useForm();

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseMode, setExpenseMode] = useState<Mode>("empty");
  const [previewData, setPreviewData] = useState<any>({});

  const total = expenseItems.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );

const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    const newReimbursement = {
      id: Date.now().toString(),
      requestId: `REQ-${Date.now()}`,

      // ✅ MUST MATCH employeeData filter
      employee: {
        name: "Current User",
        department: "Engineering",
        role: "EMPLOYEE",
      },

      category: values.category,
      policy: values.policy,
      amount: total,

      // ✅ IMPORTANT: change status
      status: "PENDING_APPROVAL",
      submitted: new Date().toDateString(),
      created: new Date().toDateString(),

      expenseItems: expenseItems.map((i) => ({
        title: i.description || "Expense",
        date: i.date?.format("DD MMM YYYY"),
        amount: i.amount,
        file: i.files?.[0]?.name,

        // ✅ Expense item status also correct
        status: "PENDING_APPROVAL",
      })),

      activityLog: [
        {
          action: "Submitted by Employee",
          date: new Date().toDateString(),
        },
      ],
    };

    await ReimbursementService.create(newReimbursement as any);
    router.push("/reimbursement");
  } catch (e) {
    console.error(e);
  }
};

  const handleCancelAll = () => {
    form.resetFields();
    setExpenseItems([]);
    setExpenseMode("empty");
    setPreviewData({});
  };

  const resetCategoryAndPolicy = () => {
    form.resetFields(["category", "policy"]);
    setPreviewData({});
  };







  const handleSaveDraft = async () => {
  try {
    // get current form values WITHOUT validation
    const values = form.getFieldsValue();

    const draftPayload = {
      id: Date.now().toString(),
      requestId: `DRAFT-${Date.now()}`,
      employee: {
        name: "Current User",
        department: "Engineering",
      },

      category: values.category || null,
      policy: values.policy || null,

      amount: total || 0,
      status: "DRAFT",

      created: new Date().toISOString(),
      updated: new Date().toISOString(),

      expenseItems: expenseItems.map((i) => ({
        title: i.description || "Expense",
        date: i.date ? i.date.format("DD MMM YYYY") : null,
        amount: i.amount || 0,
        billNo: i.billNo || null,
        file: i.files?.[0]?.name || null,
        status: "DRAFT",
      })),

      activityLog: [
        {
          action: "Saved as Draft by Employee",
          date: new Date().toISOString(),
        },
      ],
    };

    await ReimbursementService.create(draftPayload as any);

    // optional success UX
    console.log("Draft saved successfully");

    router.push("/reimbursement");
  } catch (error) {
    console.error("Save draft failed", error);
  }
};


  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-3">
        {/* ===== COMPACT HEADER ===== */}
        <div className="mb-2">
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 border border-blue-100">
                <FileTextOutlined className="text-sm text-blue-600" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">
                  Create Reimbursement
                </h1>
                <p className="text-xs text-gray-500">
                  Submit expense request
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
  {/* Save Draft */}
  <button
    type="button"
    onClick={handleSaveDraft}
    className="
      px-3 py-1.5 text-xs font-medium
      text-gray-700
      border border-gray-300
      rounded-md
      hover:bg-gray-50
      transition
    "
  >
    Save Draft
  </button>

  {/* Cancel */}
  <button
    type="button"
    onClick={() => router.push('/reimbursement')}
    className="
      px-3 py-1.5 text-xs font-medium
      text-gray-700
      border border-gray-300
      rounded-md
      hover:bg-gray-50
      transition
    "
  >
    Cancel
  </button>
</div>

          </div>
        </div>

        {/* ===== MAIN CONTENT - NO SCROLL ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT: FORM */}
          <div className="lg:col-span-2">
            <Card
              className="
                rounded-lg
                border border-gray-200
                bg-white
                shadow-sm
                p-0
                min-h-[470px]         
                 shadow-[0_12px_32px_rgba(0,0,0,0.10)]
    transition-all
    duration-300
    hover:-translate-y-[2px]
    hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]
              "
              title={
                <div className="flex items-center justify-between p-0">
                  <div className="flex items-center gap-2">
                    <div className="
                      flex items-center justify-center 
                      w-6 h-6 
                      rounded-md 
                      bg-blue-50
                      border border-blue-100
                    ">
                      <FileProtectOutlined className="text-xs text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">
                        Reimbursement Form
                      </h3>
                      <p className="text-xs text-gray-500">
                        Enter required details
                      </p>
                    </div>
                  </div>
                  <span className="
                    px-2 py-0.5
                    text-xs font-medium
                    rounded-full
                    bg-blue-50
                    text-blue-700
                    border border-blue-200
                  ">
                    FORM
                  </span>
                </div>
              }
              headStyle={{
                borderBottom: '1px solid #f0f0f0',
                padding: '12px',
                minHeight: 'auto'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <Form
                form={form}
                layout="vertical"
                size="small"
                className="space-y-2"
                onValuesChange={(_, allValues) => setPreviewData(allValues)}
              >
                {/* Category & Policy - COMPACT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-gray-700">
                        Expense Category *
                      </span>
                    }
                    name="category"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      placeholder="Select category"
                      size="small"
                      className="
                        w-full
                        text-xs
                        rounded-md
                        border-gray-300
                      "
                    >
                      <Select.Option value="travel">Travel</Select.Option>
                      <Select.Option value="food">Food & Meals</Select.Option>
                      <Select.Option value="internet">Internet</Select.Option>
                      <Select.Option value="mobile">Mobile</Select.Option>
                      <Select.Option value="medical">Medical</Select.Option>
                      <Select.Option value="office">Office Supplies</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-xs font-semibold text-gray-700">
                        Policy Type *
                      </span>
                    }
                    name="policy"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Select
                      placeholder="Select policy"
                      size="small"
                      className="
                        w-full
                        text-xs
                        rounded-md
                        border-gray-300
                      "
                    >
                      <Select.Option value="travel">Travel Policy</Select.Option>
                      <Select.Option value="food">Food & Meals Policy</Select.Option>
                      <Select.Option value="internet">Internet Policy</Select.Option>
                      <Select.Option value="mobile">Mobile Policy</Select.Option>
                      <Select.Option value="medical">Medical Policy</Select.Option>
                      <Select.Option value="office">Office Supplies Policy</Select.Option>
                      <Select.Option value="other">Other Policy</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <Divider className="my-2 border-gray-200" />

                {/* Expense Builder - COMPACT */}
                <div>
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-gray-900">
                      Expense Items
                    </h4>
                    <p className="text-xs text-gray-500">
                      Add expense items below
                    </p>
                  </div>

                  <div className="
                    rounded-lg
                    border border-gray-200
                    bg-gray-50
                    p-2
                  ">
                    <ExpenseBuilder
                      items={expenseItems}
                      setItems={setExpenseItems}
                      mode={expenseMode}
                      setMode={setExpenseMode}
                      onSubmit={handleSubmit}
                      onCancelAll={handleCancelAll}
                      onResetMainForm={resetCategoryAndPolicy}
                    />
                  </div>
                </div>
              </Form>
            </Card>
          </div>

          {/* RIGHT: PREVIEW */}
          <div className="lg:col-span-1">
            <Card
              className="
                rounded-lg
                border border-gray-200
                bg-white
                shadow-sm
                p-0
                min-h-[470px]      
                  shadow-[0_12px_32px_rgba(0,0,0,0.10)]
                transition-all
              duration-300
              hover:-translate-y-[2px]
              hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)]
              "
              title={
                <div className="flex items-center justify-between p-0">
                  <div className="flex items-center gap-2">
                    <div className="
                      flex items-center justify-center 
                      w-6 h-6 
                      rounded-md 
                      bg-purple-50
                      border border-purple-100
                    ">
                      <EyeOutlined className="text-xs text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900">
                        Live Preview
                      </h3>
                      <p className="text-xs text-gray-500">
                        Review before submit
                      </p>
                    </div>
                  </div>
                  <span className="
                    px-2 py-0.5
                    text-xs font-medium
                    rounded-full
                    bg-purple-50
                    text-purple-700
                    border border-purple-200
                  ">
                    PREVIEW
                  </span>
                </div>
              }
              headStyle={{
                borderBottom: '1px solid #f0f0f0',
                padding: '12px',
                minHeight: 'auto'
              }}
              bodyStyle={{ padding: '12px' }}
            >
              {/* Category & Policy Preview */}
              <div className="space-y-2 mb-3">
                <div className="
                  flex justify-between items-center
                  p-2
                  rounded-md
                  bg-gray-50
                  border border-gray-200
                ">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-gray-700">
                      Category
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {previewData.category || "—"}
                  </span>
                </div>

                <div className="
                  flex justify-between items-center
                  p-2
                  rounded-md
                  bg-gray-50
                  border border-gray-200
                ">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-gray-700">
                      Policy
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {previewData.policy || "—"}
                  </span>
                </div>
              </div>



              {/* Expense Items Preview */}
              <div>
                <div className="
                  flex items-center justify-between
                  p-1
                  rounded-md
                  bg-gray-50
                  border border-gray-200
                  mb-2
                ">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-xs font-bold text-gray-700">
                      Expense Details
                    </span>
                  </div>
                  
                  <span className="
                    px-1.5 py-0.5
                    text-2xs font-bold
                    rounded-full
                    bg-indigo-50
                    text-indigo-700
                    border border-indigo-200
                  ">
                    {expenseMode.toUpperCase()}
                  </span>
                </div>

                {expenseItems.length === 0 ? (
                  <div className="
                    flex items-center justify-center
                     py-4
                   rounded-md
                   border border-dashed border-gray-300
                   bg-gray-50
                   ">
                    <div className="
                      w-8 h-8
                      flex items-center justify-center
                      rounded-full
                      bg-gray-100
                      border border-gray-200
                      mb-1
                    ">
                      <span className="text-gray-400 text-sm">📁</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      No expenses added
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {expenseItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="
                          p-2
                          rounded-md
                          border border-gray-200
                          bg-white
                        "
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1">
                            <span className="
                              text-2xs font-semibold 
                              text-gray-500 
                              bg-gray-100 
                              px-1 py-0.5 
                              rounded
                            ">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {item.date?.format("DD MMM") || "—"}
                            </span>
                          </div>
                          <span className="
                            flex items-center gap-0.5
                            text-2xs font-medium
                            text-emerald-600
                            bg-emerald-50
                            px-1 py-0.5
                            rounded-full
                          ">
                            📎 {item.files?.length || 0}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            Amount
                          </span>
                          <span className="text-xs font-bold text-gray-900">
                            ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {item.description && (
                          <div className="
                            mt-1 pt-1
                            border-t border-gray-100
                            text-xs text-gray-700
                          ">
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expenseItems.length > 0 && (
                  <>
                    <Divider className="my-2 border-gray-200" />
                    <div className="
                      flex justify-between items-center
                      p-2
                      rounded-md
                      bg-gray-900
                      text-white
                    ">
                      <span className="text-xs font-bold">
                        TOTAL
                      </span>
                      <span className="text-sm font-extrabold">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}

                {expenseMode === "review" && (
                  <div className="mt-2">
                    <div className="
                      flex items-center justify-center gap-1
                      p-2
                      rounded-md
                      bg-emerald-50
                      border border-emerald-200
                    ">
                      <span className="
                        flex items-center justify-center 
                        w-4 h-4 
                        rounded-full 
                        bg-emerald-500 
                        text-white 
                        text-2xs
                      ">
                        ✓
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        Ready to submit
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}