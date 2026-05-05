import { Transactions } from "@/components/transactions";
import { Icon } from "@/components/icon";
import { UploadButton } from "@/components/upload-button";

export default function TransactionsPage() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Transactions. <em>What came in, what went out.</em>
          </h1>
          <p className="sub">
            Every credit and debit, in plain English. Forward a receipt on
            WhatsApp and I&apos;ll match it to the right line for you.
          </p>
        </div>
        <div className="right">
          <UploadButton variant="primary" label="Upload statement" />
          <button type="button" className="btn">
            <Icon name="plus" size={13} /> Add manual entry
          </button>
        </div>
      </div>
      <Transactions />
    </>
  );
}
