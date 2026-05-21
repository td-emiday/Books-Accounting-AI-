"use client";

// Type-to-confirm delete form for a workspace. Disables the destructive
// button until the operator types the exact workspace name. Submits to
// a server action passed in by the parent page.

import { useState } from "react";

export function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
  onDelete,
}: {
  workspaceId: string;
  workspaceName: string;
  onDelete: (formData: FormData) => Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const armed = typed.trim() === workspaceName.trim();

  return (
    <form action={onDelete} className="space-y-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label className="block">
        <span className="block text-xs text-red-900">
          Type{" "}
          <strong className="font-mono">{workspaceName}</strong> to confirm:
        </span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="mt-1 w-full rounded border border-red-300 bg-white px-2 py-1 text-xs font-mono"
        />
      </label>
      <button
        type="submit"
        disabled={!armed}
        className={`w-full rounded px-3 py-2 text-xs font-medium ${
          armed
            ? "bg-red-700 text-white hover:bg-red-800"
            : "cursor-not-allowed bg-neutral-200 text-neutral-500"
        }`}
      >
        Delete workspace + user
      </button>
    </form>
  );
}
