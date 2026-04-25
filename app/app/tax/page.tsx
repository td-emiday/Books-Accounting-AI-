import { Icon } from "@/components/icon";
import { Tax } from "@/components/tax";
import { TAX_ITEMS } from "@/lib/data/tax";

export default function TaxPage() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Tax &amp; Compliance. <em>Calmly on top of it.</em>
          </h1>
          <p className="sub">
            FIRS, Lagos IRS, PenCom, NSITF — every return, remittance and
            deadline drafted for you.
          </p>
        </div>
        <div className="right">
          <button className="btn">
            <Icon name="calendar" size={13} /> Full calendar
          </button>
        </div>
      </div>
      <Tax items={TAX_ITEMS} />
    </>
  );
}
