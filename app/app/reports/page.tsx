import Link from "next/link";
import { Icon } from "@/components/icon";
import { Reports } from "@/components/reports";
import { UploadButton } from "@/components/upload-button";
import { REPORTS } from "@/lib/data/reports";
import { getWorkspaceContext } from "@/lib/queries/workspace";

export default async function ReportsPage() {
  const { isNewWorkspace } = await getWorkspaceContext();
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Reports.{" "}
            <em>
              {isNewWorkspace
                ? "Ready once your books have data."
                : "Always up to the minute."}
            </em>
          </h1>
          <p className="sub">
            {isNewWorkspace
              ? "P&L, balance sheet, cashflow — I'll generate these the moment your first transactions land. Upload a statement to get started."
              : "P\u0026L, balance sheet, cashflow — I rebuild them every time your books move. Export to PDF or share with your accountant."}
          </p>
        </div>
        <div className="right">
          {isNewWorkspace ? (
            <UploadButton variant="primary" label="Upload statement" />
          ) : (
            <Link
              href="/reports/monthend"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
            >
              <Icon name="download" size={13} /> Export pack
            </Link>
          )}
        </div>
      </div>
      {isNewWorkspace ? (
        <EmptyCard
          title="No reports yet."
          body="Reports build themselves from your transactions. Upload a bank statement and I'll have your first P&L ready in minutes."
        />
      ) : (
        <Reports reports={REPORTS} />
      )}
    </>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-card" role="status">
      <h3 className="empty-card-title">{title}</h3>
      <p className="empty-card-body">{body}</p>
    </div>
  );
}
