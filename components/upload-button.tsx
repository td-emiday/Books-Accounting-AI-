"use client";

import { useState } from "react";
import { BankUpload } from "./bank-upload";
import { Icon } from "./icon";

/**
 * Single button that opens the bank-statement upload modal.
 * Lives on both the Overview hero and Bank & Cash hero so people
 * have an obvious way to add transactions without a backend.
 */
export function UploadButton({
  variant = "default",
  label = "Upload statement",
}: {
  variant?: "default" | "primary";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`btn ${variant === "primary" ? "primary" : ""}`.trim()}
        onClick={() => setOpen(true)}
        data-tour="upload"
      >
        <Icon name="upload" size={13} /> {label}
      </button>
      <BankUpload open={open} onClose={() => setOpen(false)} />
    </>
  );
}
