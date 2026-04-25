import { Icon } from "@/components/icon";
import { Reports } from "@/components/reports";
import { REPORTS } from "@/lib/data/reports";

export default function ReportsPage() {
  return (
    <>
      <div className="hero">
        <div>
          <h1>
            Financial Reports. <em>Always current.</em>
          </h1>
          <p className="sub">
            Every statement regenerates as your books update. Export to PDF,
            CSV or share with your accountant.
          </p>
        </div>
        <div className="right">
          <button className="btn">
            <Icon name="download" size={13} /> Export pack
          </button>
        </div>
      </div>
      <Reports reports={REPORTS} />
    </>
  );
}
