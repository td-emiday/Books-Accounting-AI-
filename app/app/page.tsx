import { Bank } from "@/components/bank";
import { Bento } from "@/components/bento";
import { Icon } from "@/components/icon";
import { Reports } from "@/components/reports";
import { Tax } from "@/components/tax";
import { UploadButton } from "@/components/upload-button";
import { REPORTS } from "@/lib/data/reports";
import { TAX_ITEMS } from "@/lib/data/tax";

export default function OverviewPage() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Good morning, Adaeze. <em>Here&apos;s where you stand.</em>
          </h1>
          <p className="sub">
            Books are 98% reconciled. One VAT return waiting for your review,
            due the 21st. Nothing else urgent.
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
        Inbox <em>— transactions to categorise</em>
      </div>
      <Bank preview limit={12} />

      <div className="section-title">
        Compliance <em>— what&apos;s coming due</em>
      </div>
      <Tax items={TAX_ITEMS} />

      <div className="section-title">
        Reports <em>— generated for April</em>
      </div>
      <Reports reports={REPORTS} />
    </>
  );
}
