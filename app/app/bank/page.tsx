import { Bank } from "@/components/bank";
import { Icon } from "@/components/icon";
import { UploadButton } from "@/components/upload-button";

export default function BankPage() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Bank &amp; Cash. <em>Inbox zero in sight.</em>
          </h1>
          <p className="sub">
            Emiday reads your statements nightly. Categorised line-by-line,
            learning your chart of accounts.
          </p>
        </div>
        <div className="right">
          <UploadButton variant="primary" label="Upload statement" />
          <button type="button" className="btn">
            <Icon name="plus" size={13} /> Connect account
          </button>
        </div>
      </div>
      <Bank />
    </>
  );
}
