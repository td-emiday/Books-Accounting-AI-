"use client";

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
    <form action={onDelete}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <label>
        <span>
          Type{" "}
          <strong style={{ fontFamily: "var(--font-mono)" }}>
            {workspaceName}
          </strong>{" "}
          to confirm:
        </span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button
        type="submit"
        disabled={!armed}
        className="adm-btn danger"
        style={{
          background: armed ? "var(--danger)" : undefined,
          color: armed ? "#fff" : undefined,
          borderColor: armed ? "var(--danger)" : undefined,
        }}
      >
        Delete workspace + user
      </button>
    </form>
  );
}
