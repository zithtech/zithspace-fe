"use client";

import React from "react";
import { Button } from "antd";
import { CheckCircle } from "lucide-react";
import { useTour } from "@/context/TourContext";

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        minHeight: "300px",
      }}
    >
      <CheckCircle size={56} color="#10B981" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-slate-900, #0f172a)", marginBottom: 8 }}>
        {itemType} created
      </h2>
      <p style={{ fontSize: "15px", color: "var(--text-slate-600, #475569)", marginBottom: 32 }}>
        <strong>{itemName}</strong> was successfully created.
      </p>
      
      <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "center" }}>
        <Button size="large" onClick={onCreateAnother}>
          Create Another
        </Button>
        <Button type="primary" size="large" onClick={handleContinue}>
          {run ? "Continue Tour" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
