"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Segmented, Space, Typography, Button, Card, Row, Col } from "antd";
import {
  SettingOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  ApartmentOutlined,
  FullscreenOutlined,
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
  const [section, setSection] = useState("general");

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
                      className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 bg-white"
                    >
                      {/* Company Info */}
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
                              {setting.general.company_address}
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
                            ></div>
                            <span className="text-gray-700 font-mono text-sm">
                              {setting.general.primary_color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Regional Settings */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase mb-2">
                          Regional Settings
                        </p>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-gray-500 text-xs">Currency</p>
                            <p className="text-gray-800 font-medium">
                              {setting.general.currency_code}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Date Format</p>
                            <p className="text-gray-800 font-medium">
                              {setting.general.date_format || "MM/DD/YYYY"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Details */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase mb-2">
                          Invoice Details
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-gray-800 font-medium">
                            {setting.invoices.invoice_format}
                          </p>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                            Format
                          </span>
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
            <Segmented
              value={section}
              onChange={setSection}
              className="bg-slate-100 p-1 rounded-lg"
              options={[
                { label: "General", value: "general" },
                { label: "Invoices", value: "invoices" },
                { label: "Payments", value: "payments" },
                { label: "Alerts", value: "alerts" },
              ]}
            />

            <div className="mt-6">
              <div
                key={section}
                className="animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                {section === "general" && (
                  <GeneralSettings
                    initialValues={draft.general}
                    onSave={(data) =>
                      setDraft((prev) => ({ ...prev, general: data }))
                    }
                  />
                )}

                {section === "invoices" && (
                  <InvoiceSetting
                    initialValues={draft.invoices}
                    onSave={(data) =>
                      setDraft((prev) => ({ ...prev, invoices: data }))
                    }
                  />
                )}
                {section === "payments" && (
                  <BankPaymentSettings
                    initialValues={draft.payments} // ✅ CORRECT
                    onSave={(data) =>
                      setDraft((prev) => ({ ...prev, payments: data }))
                    }
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                type="primary"
                onClick={() => {
                  const newSetting: SavedSetting = {
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
                    JSON.stringify(updatedSettings)
                  );
                  setMode("view");
                }}
              >
                Save All
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
