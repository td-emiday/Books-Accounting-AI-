"use client";

// Type-to-confirm modal for destructive actions. Used on
// "Clear workspace data" and "Delete workspace" — actions that
// can't be undone and shouldn't be a single click.
//
// Usage:
//   const [open, setOpen] = useState(false);
//   <button onClick={() => setOpen(true)}>Delete workspace</button>
//   <ConfirmDialog
//     open={open}
//     onClose={() => setOpen(false)}
//     title="Delete workspace"
//     body="This permanently deletes the workspace and every transaction in it."
//     confirmValue={workspace.name}
//     confirmLabel="Delete workspace"
//     onConfirm={() => deleteWorkspaceAction()}
//   />

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirmValue,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  /** Exact string the user must type to enable the destructive button. */
  confirmValue: string;
  /** Label on the destructive button. */
  confirmLabel: string;
  /** Called when the destructive button is clicked. The dialog stays
   *  open — the caller decides when to close (e.g. after the action
   *  resolves). */
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the typed value every time the dialog opens. Otherwise
  // pre-filled text from a previous open survives a re-open and
  // the destructive button is already enabled.
  useEffect(() => {
    if (open) {
      setTyped("");
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Escape closes; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const enabled = typed.trim() === confirmValue.trim();

  return (
    <div
      className="confirm-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        // Click on scrim (not the card) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="confirm-card">
        <h2 id="confirm-dialog-title" className="confirm-title">
          {title}
        </h2>
        <div className="confirm-body">{body}</div>

        <label className="confirm-field">
          <span>
            Type <code>{confirmValue}</code> to confirm
          </span>
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="confirm-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="confirm-destructive"
            disabled={!enabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
