import { notFound } from "next/navigation";
import { ReportDocument } from "@/components/report-document";
import { getWorkspaceContext } from "@/lib/queries/workspace";
import { getReportTemplate } from "@/lib/data/report-templates";

// Branded printable report. Top-level route (no dashboard chrome) gated by
// proxy.ts. URL: /reports/<shape> where <shape> is one of:
// pl | bs | cf | vat | pay | tb | daybook | monthend.
//
// Adding ?print=1 kicks off the browser print dialog automatically — handy
// for "Export" buttons that want a one-click PDF flow.

type Params = Promise<{ shape: string }>;
type Search = Promise<{ print?: string }>;

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { shape } = await params;
  const { print } = await searchParams;

  const template = getReportTemplate(shape);
  if (!template) notFound();

  const ctx = await getWorkspaceContext();

  return (
    <ReportDocument
      template={template}
      workspace={ctx.workspace}
      user={ctx.user}
      autoPrint={print === "1"}
    />
  );
}
