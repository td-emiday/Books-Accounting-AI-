import { Documents } from "@/components/documents";
import { getDocuments } from "@/lib/queries/documents";

export default async function DocumentsPage() {
  const documents = await getDocuments();
  return <Documents documents={documents} />;
}
