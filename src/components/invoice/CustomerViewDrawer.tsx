"use client";

import { FC } from "react";
import { Drawer, Typography, Tag, Divider, Space, Button } from "antd";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  User,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  Calendar,
  Globe,
  Fingerprint
} from "lucide-react";
import { Customer } from "@/services/customersService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface CustomerViewDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerViewDrawer: FC<CustomerViewDrawerProps> = ({ open, onClose, customer }) => {
  if (!customer) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      closable={false}
      styles={{
        body: { padding: 0 },
        mask: { backdropFilter: "blur(4px)", background: "rgba(15, 23, 42, 0.4)" }
      }}
    >
      <div className="h-full flex flex-col bg-slate-50/50">
        {/* Header Section */}
        <div className="px-6 py-6 bg-white border-b border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 size={120} />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl font-bold shadow-sm">
                {customer.companyName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {customer.companyName}
                </Title>
                <div className="flex gap-2 mt-2">
                  <Tag color="success" className="rounded-full px-2.5 font-semibold text-[10px] uppercase tracking-wider m-0 border-none bg-emerald-50 text-emerald-600">
                    Active
                  </Tag>
                </div>
              </div>
            </div>
            <Button
              type="text"
              icon={<ArrowLeft size={18} className="text-slate-400" />}
              onClick={onClose}
              className="hover:bg-slate-100/50 rounded-xl"
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          <div className="grid grid-cols-2 gap-4">
            {/* Main Contact Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                  <User size={14} />
                </div>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest m-0 leading-none">Primary Contact</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Email</span>
                    <Text className="text-sm font-bold text-slate-700 block truncate" title={customer.email || ""}>{customer.email || "Not provided"}</Text>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Phone</span>
                    <Text className="text-sm font-bold text-slate-700">{customer.phone || "Not provided"}</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
                  <ShieldCheck size={14} />
                </div>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest m-0 leading-none">Compliance & Tax</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">GSTIN Identifier</span>
                  <Text className="text-sm font-mono font-bold text-slate-700">{customer.gstin || "--"}</Text>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PAN Number</span>
                  <Text className="text-sm font-mono font-bold text-slate-700">{customer.pan || "--"}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                <MapPin size={14} />
              </div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest m-0 leading-none">Billing Address</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Globe size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Full Address</span>
                  <Text className="text-sm font-medium text-slate-700 leading-relaxed block">{customer.address || "No address provided"}</Text>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-14">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">City</span>
                  <Text className="text-sm font-bold text-slate-700">{customer.city || "--"}</Text>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Country</span>
                  <Tag className="rounded-full px-2 pt-0.5 bg-blue-50 text-blue-600 border-none font-bold text-[10px]">
                    {customer.country || "--"}
                  </Tag>
                </div>
              </div>
            </div>
          </div>

          {/* Account Metadata */}

        </div>
      </div>
    </Drawer>
  );
};

export default CustomerViewDrawer;
