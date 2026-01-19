"use client";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Space, Typography, Button, Card, Row, Col, Steps } from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import GeneralSettings from "./GeneralSettings";
import InvoiceSetting from "./InvoiceSetting";
import { useEffect } from "react";

import {
  InvoiceDraft,
  GeneralDraft,
  Draft,
  SavedSetting,
} from "@/types/invoice";

import helloBoy from "@/assets/Robot.gif";

import BankPaymentSettings from "./PaymentSetting";

const { Title } = Typography;

export default function InvoiceproSettingPage() {
  const [mode, setMode] = useState<"view" | "create">("view");

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("invoice_settings");
    if (stored) {
      setSavedSettings(JSON.parse(stored));
    }
  }, []);

  // temporary draft for new settings
  const [draft, setDraft] = useState<Draft>({
    general: {
      company_name: "",
      company_address: "",
      primary_color: "#1890ff",
      company_logo: null,
      currency_code: "USD",
      date_format: "MM/DD/YYYY",
    },
    invoices: {
      invoice_format: "INV-{YYYY}-{###}",
    },
    payments: {
      account_name: "",
      account_number: "",
      ifsc_code: "",
      branch_name: "",
      qr_code: null,
    },
  });

  const [savedSettings, setSavedSettings] = useState<SavedSetting[]>([]);

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <Space align="center">
            {mode === "create" && (
              <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => setMode("view")}
              >
                Back
              </Button>
            )}

            <Space align="center">
              <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
              <Title level={3} style={{ margin: 0 }}>
                Settings
              </Title>
            </Space>
          </Space>

          {mode === "view" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setMode("create")}
            >
              Create New
            </Button>
          )}
        </div>

        {/* VIEW MODE */}
        {mode === "view" && (
          <>
            {savedSettings.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-80 flex justify-center">
                  <img
                    src={helloBoy.src}
                    alt="Hello"
                    className="h-auto w-full"
                  />
                </div>

                <p className="max-w-sm text-gray-500">
                  No saved settings yet.
                  <br />
                  Click <b>Create New</b> to get started.
                </p>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {savedSettings.map((setting) => (
                  <Col xs={24} sm={12} md={8} key={setting.id}>
                    <Card
                      hoverable
                      className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 border border-gray-100 bg-white"
                    >
                      {/* ================= COMPANY INFO ================= */}
                      <div className="flex items-center gap-4 mb-4">
                        {setting.general.company_logo && (
                          <div className="w-20 h-20 p-2 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <img
                              src={setting.general.company_logo}
                              alt="Company Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">
                              Company Name
                            </p>
                            <p className="text-gray-800 font-medium">
                              {setting.general.company_name}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">
                              Company Address
                            </p>
                            <p className="text-gray-600">
                              {setting.general.company_address || "—"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-500 uppercase">
                              Primary Color
                            </p>
                            <div
                              className="w-6 h-6 rounded-lg border border-gray-300"
                              style={{
                                backgroundColor: setting.general.primary_color,
                              }}
                            />
                            <span className="text-gray-700 font-mono text-sm">
                              {setting.general.primary_color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ================= GRID SECTIONS ================= */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Regional */}
                        <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Regional
                          </p>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Currency</span>
                            <span className="font-medium">
                              {setting.general.currency_code}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date</span>
                            <span className="font-medium">
                              {setting.general.date_format || "MM/DD/YYYY"}
                            </span>
                          </div>
                        </div>

                        {/* Invoice */}
                        <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Invoice
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {setting.invoices.invoice_format}
                            </span>
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="col-span-2 p-3 bg-gray-50 rounded-lg border text-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Payment
                          </p>

                          <div className="grid grid-cols-3 gap-4 items-center">
                            {/* ========= PAYMENT DETAILS ========= */}
                            <div className="col-span-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Bank</span>
                                <span className="font-medium">
                                  {setting.payments?.account_name || "—"}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-500">
                                  Account No
                                </span>
                                <span className="font-medium">
                                  {setting.payments?.account_number || "—"}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-500">IFSC</span>
                                <span className="font-medium">
                                  {setting.payments?.ifsc_code || "—"}
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-500">Branch</span>
                                <span className="font-medium">
                                  {setting.payments?.branch_name || "—"}
                                </span>
                              </div>
                            </div>

                            {/* ========= QR IMAGE ========= */}
                            {setting.payments?.qr_code && (
                              <div className="flex flex-col items-center justify-center">
                                <img
                                  src={setting.payments.qr_code}
                                  alt="Payment QR"
                                  className="w-20 h-20 object-contain border rounded bg-white p-1"
                                />
                                <span className="text-[10px] text-gray-500 mt-1">
                                  Scan to pay
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Signature */}
                        <div className="col-span-2 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Signature
                          </p>

                          {setting.general.company_signature ? (
                            <img
                              src={setting.general.company_signature}
                              alt="Signature"
                              className="h-12 object-contain border rounded bg-white px-2"
                            />
                          ) : (
                            <p className="text-xs text-gray-400">
                              No signature uploaded
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <>
            <Steps
              current={currentStep}
              className="mb-8"
              items={[
                { title: "General" },
                { title: "Invoice" },
                { title: "Payment" },
              ]}
            />

            <div className="mt-6">
              {currentStep === 0 && (
                <GeneralSettings
                  initialValues={draft.general}
                  onSave={(data) =>
                    setDraft((prev) => ({ ...prev, general: data }))
                  }
                />
              )}

              {currentStep === 1 && (
                <InvoiceSetting
                  initialValues={draft.invoices}
                  onSave={(data) =>
                    setDraft((prev) => ({ ...prev, invoices: data }))
                  }
                />
              )}

              {currentStep === 2 && (
                <BankPaymentSettings
                  initialValues={draft.payments}
                  onSave={(data) =>
                    setDraft((prev) => ({ ...prev, payments: data }))
                  }
                />
              )}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center z-50">
              {/* BACK */}
              <div style={{ paddingLeft: "7%" }}>
                <Button
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  Back
                </Button>
              </div>

              {/* NEXT / SAVE */}
              {currentStep < 2 ? (
                <Button
                  type="primary"
                  onClick={() => setCurrentStep((s) => s + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => {
                    const newSetting = {
                      id: Date.now(),
                      name: draft.general.company_name || "Untitled",
                      general: draft.general,
                      invoices: draft.invoices,
                      payments: draft.payments,
                    };

                    const updatedSettings = [...savedSettings, newSetting];
                    setSavedSettings(updatedSettings);

                    localStorage.setItem(
                      "invoice_settings",
                      JSON.stringify(updatedSettings),
                    );

                    setMode("view");
                    setCurrentStep(0);
                  }}
                >
                  Save All
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
