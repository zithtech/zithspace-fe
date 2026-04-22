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
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--drawer-bg)' }}>
        {/* Header Section */}
        <div className="px-6 py-6 border-b shadow-sm relative overflow-hidden" style={{ backgroundColor: 'var(--drawer-header-bg)', borderColor: 'var(--drawer-header-border)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 size={120} />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border flex items-center justify-center text-2xl font-bold shadow-sm" style={{ backgroundColor: 'var(--drawer-avatar-bg)', color: 'var(--drawer-avatar-text)', borderColor: 'var(--drawer-avatar-border)' }}>
                {customer.companyName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: "var(--drawer-title-color)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {customer.companyName}
                </Title>
                <div className="flex gap-2 mt-2">
                  <Tag className="rounded-full px-2.5 font-semibold text-[10px] uppercase tracking-wider m-0 border-none" style={{ backgroundColor: 'var(--drawer-tag-bg)', color: 'var(--drawer-tag-text)' }}>
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
            <div className="rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: 'var(--drawer-card-bg)', borderColor: 'var(--drawer-card-border)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--drawer-icon-bg-blue)', color: 'var(--drawer-icon-text-blue)' }}>
                  <User size={14} />
                </div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--drawer-label-color)' }}>Primary Contact</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--drawer-field-bg)', color: 'var(--drawer-label-color)' }}>
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase mb-0.5 block" style={{ color: 'var(--drawer-label-color)' }}>Email</span>
                    <Text className="text-sm font-bold block truncate" style={{ color: 'var(--drawer-value-color)' }} title={customer.email || ""}>{customer.email || "Not provided"}</Text>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--drawer-field-bg)', color: 'var(--drawer-label-color)' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase mb-0.5 block" style={{ color: 'var(--drawer-label-color)' }}>Phone</span>
                    <Text className="text-sm font-bold" style={{ color: 'var(--drawer-value-color)' }}>{customer.phone || "Not provided"}</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Card */}
            <div className="rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: 'var(--drawer-card-bg)', borderColor: 'var(--drawer-card-border)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--drawer-icon-bg-emerald)', color: 'var(--drawer-icon-text-emerald)' }}>
                  <ShieldCheck size={14} />
                </div>
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--drawer-label-color)' }}>Compliance & Tax</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-3 rounded-2xl border" style={{ backgroundColor: 'var(--drawer-field-bg)', borderColor: 'var(--drawer-field-border)' }}>
                  <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--drawer-label-color)' }}>GSTIN Identifier</span>
                  <Text className="text-sm font-mono font-bold" style={{ color: 'var(--drawer-value-color)' }}>{customer.gstin || "--"}</Text>
                </div>
                <div className="p-3 rounded-2xl border" style={{ backgroundColor: 'var(--drawer-field-bg)', borderColor: 'var(--drawer-field-border)' }}>
                  <span className="text-[10px] font-bold uppercase block mb-1" style={{ color: 'var(--drawer-label-color)' }}>PAN Number</span>
                  <Text className="text-sm font-mono font-bold" style={{ color: 'var(--drawer-value-color)' }}>{customer.pan || "--"}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--drawer-card-bg)', borderColor: 'var(--drawer-card-border)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--drawer-icon-bg-indigo)', color: 'var(--drawer-icon-text-indigo)' }}>
                <MapPin size={14} />
              </div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest m-0 leading-none" style={{ color: 'var(--drawer-label-color)' }}>Billing Address</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--drawer-field-bg)', color: 'var(--drawer-label-color)' }}>
                  <Globe size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase mb-0.5 block" style={{ color: 'var(--drawer-label-color)' }}>Full Address</span>
                  <Text className="text-sm font-medium leading-relaxed block" style={{ color: 'var(--drawer-value-color)' }}>{customer.address || "No address provided"}</Text>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 ml-14">
                <div>
                  <span className="text-[10px] font-bold uppercase block mb-0.5" style={{ color: 'var(--drawer-label-color)' }}>City</span>
                  <Text className="text-sm font-bold" style={{ color: 'var(--drawer-value-color)' }}>{customer.city || "--"}</Text>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase block mb-0.5" style={{ color: 'var(--drawer-label-color)' }}>Country</span>
                  <Tag className="rounded-full px-2 pt-0.5 border-none font-bold text-[10px]" style={{ backgroundColor: 'var(--drawer-country-tag-bg)', color: 'var(--drawer-country-tag-text)' }}>
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
