// Demo overview — same composition as /app/page.tsx but uses the static
// mock greeting + mock data so it works without a user session.

import { Transactions } from "@/components/transactions";
import { Bento } from "@/components/bento";
import { Icon } from "@/components/icon";
import { Reports } from "@/components/reports";
import { Tax } from "@/components/tax";
import { UploadButton } from "@/components/upload-button";
import { REPORTS } from "@/lib/data/reports";
import { TAX_ITEMS } from "@/lib/data/tax";
import { ACTIVE_USER } from "@/lib/data/workspace";

export default function DemoOverviewPage() {
  const firstName = ACTIVE_USER.name.split(" ")[0];

  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Good morning, {firstName}. <em>Here&apos;s where things stand.</em>
          </h1>
          <p className="sub">
            I&apos;ve gone through your books overnight. One VAT return is
            ready for your sign-off — everything else is quiet today.
          </p>
        </div>
        <div className="right">
          <UploadButton />
          <button type="button" className="btn">
            <Icon name="download" size={13} /> Export
          </button>
          <button type="button" className="btn primary">
            <Icon name="sparkle" size={13} /> Close the month
          </button>
        </div>
      </div>
      <Bento />

      <div className="section-title">
        Recent transactions <em>— what came in &amp; went out</em>
      </div>
      <Transactions preview limit={8} />

      <div className="section-title">
        On the horizon <em>— filings and payments</em>
      </div>
      <Tax items={TAX_ITEMS} />

      <div className="section-title">
        Reports <em>— ready when you are</em>
      </div>
      <Reports reports={REPORTS} />
    </>
  );
}
