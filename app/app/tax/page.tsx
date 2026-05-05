import { Icon } from "@/components/icon";
import { Tax } from "@/components/tax";
import { UploadButton } from "@/components/upload-button";
import { TAX_ITEMS } from "@/lib/data/tax";
import { getWorkspaceContext } from "@/lib/queries/workspace";

export default async function TaxPage() {
  const { isNewWorkspace } = await getWorkspaceContext();
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Tax &amp; compliance.{" "}
            <em>
              {isNewWorkspace
                ? "I'll start drafting once books are loaded."
                : "Already on top of it."}
            </em>
          </h1>
          <p className="sub">
            {isNewWorkspace
              ? "FIRS, Lagos IRS, PenCom, NSITF — once you upload your bank statements, I'll draft every return and remind you before each deadline."
              : "FIRS, Lagos IRS, PenCom, NSITF — I draft every return and remind you before it's due. Pay in one click."}
          </p>
        </div>
        <div className="right">
          {isNewWorkspace ? (
            <UploadButton variant="primary" label="Upload statement" />
          ) : (
            <button className="btn">
              <Icon name="calendar" size={13} /> Full calendar
            </button>
          )}
        </div>
      </div>
      {isNewWorkspace ? (
        <div className="empty-card" role="status">
          <h3 className="empty-card-title">No filings yet.</h3>
          <p className="empty-card-body">
            I draft VAT, PAYE, Pension, NSITF and CIT from your transactions.
            Upload a bank statement to get the first draft on your calendar.
          </p>
        </div>
      ) : (
        <Tax items={TAX_ITEMS} />
      )}
    </>
  );
}
