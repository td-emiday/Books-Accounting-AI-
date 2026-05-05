// Live documents loader.

import { createClient } from "@/lib/supabase/server";
import {
  DOCUMENTS as MOCK_DOCUMENTS,
  type Document,
  type DocumentCategory,
  type DocumentSource,
} from "@/lib/data/documents";

type Row = {
  id: string;
  name: string;
  category: string;
  source: string;
  size_bytes: number | null;
  created_at: string;
  client: { name: string } | { name: string }[] | null;
};

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return MOCK_DOCUMENTS;

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, name, category, source, size_bytes, created_at, client:clients(name)",
    )
    .order("created_at", { ascending: false });

  // Authenticated + empty → real empty workspace. Mock only for unauthed (/demo).
  if (error) return [];
  if (!data || data.length === 0) return [];

  return (data as unknown as Row[]).map((r, i) => {
    const client = Array.isArray(r.client) ? r.client[0] : r.client;
    return {
      id: i + 1,
      name: r.name,
      category: r.category as DocumentCategory,
      date: fmtShort(r.created_at),
      size: fmtSize(r.size_bytes),
      source: r.source as DocumentSource,
      client: client?.name,
    };
  });
}
