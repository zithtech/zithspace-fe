"use client";

import React, { useState } from "react";
import { Button } from "antd";
import { Check, Plus, ArrowRight, Bot } from "lucide-react";
import { useTour } from "@/context/TourContext";
import { useTheme } from "@/context/ThemeContext";

interface PostCreationSuccessScreenProps {
  itemName: string;
  itemType: string;
  onCreateAnother: () => void;
  onContinue: () => void;
}

export default function PostCreationSuccessScreen({
  itemName,
  itemType,
  onCreateAnother,
  onContinue,
}: PostCreationSuccessScreenProps) {
  const { run, stepIndex, setStepIndex } = useTour();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [imgError, setImgError] = useState(false);

  const handleContinue = () => {
    if (run) {
      setStepIndex(stepIndex + 1);
    }
    onContinue();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 12px",
        width: "100%",
        animation: "successCardPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes successCardPop {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: "340px",
          textAlign: "center",
          borderRadius: "14px",
          padding: "18px 20px",
          background: isDark ? "#111827" : "#ffffff",
          border: isDark ? "1px solid #1f293d" : "1px solid #e2e8f0",
          boxShadow: isDark
            ? "0 10px 25px -8px rgba(0, 0, 0, 0.6)"
            : "0 8px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Compact Avatar with Checkmark */}
        <div style={{ position: "relative", display: "inline-flex" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              border: isDark ? "2px solid #374151" : "2px solid #e0e7ff",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
              backgroundColor: isDark ? "#1f2937" : "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!imgError ? (
              <img
                src="/images/robot-guide.jpg"
                alt="Buddy"
                onError={() => setImgError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Bot size={24} color="#4F46E5" />
            )}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              background: "#10b981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isDark ? "2px solid #111827" : "2px solid #ffffff",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.35)",
            }}
          >
            <Check size={10} color="#ffffff" strokeWidth={3.5} />
          </div>
        </div>

        {/* Title and item name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: isDark ? "#f3f4f6" : "#0f172a",
              letterSpacing: "-0.2px",
            }}
          >
            {itemType} Created
          </h3>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              maxWidth: "260px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: isDark ? "#94a3b8" : "#64748b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <strong style={{ color: isDark ? "#e2e8f0" : "#334155" }}>{itemName}</strong> is ready.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: "100%",
            marginTop: "2px",
          }}
        >
          <Button
            type="default"
            size="middle"
            icon={<Plus size={13} />}
            onClick={onCreateAnother}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: "12.5px",
              color: isDark ? "#cbd5e1" : "#475569",
              borderColor: isDark ? "#334155" : "#cbd5e1",
              background: isDark ? "#1e293b" : "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            Create Another
          </Button>
          <Button
            type="primary"
            size="middle"
            icon={<ArrowRight size={13} />}
            onClick={handleContinue}
            style={{
              flex: 1.15,
              height: 34,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: "12.5px",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              border: "none",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {run ? "Continue Tour" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
